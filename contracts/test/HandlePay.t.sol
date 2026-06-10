// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {HandleRegistry} from "../src/HandleRegistry.sol";
import {HandlePay} from "../src/HandlePay.sol";

/// @dev Receiver that re-enters HandlePay.claim() from its receive() hook.
contract ReentrantClaimer {
    HandleRegistry internal immutable registry;
    HandlePay internal immutable pay;

    bool public reentered; // true if the nested claim() unexpectedly succeeded
    bytes public reentryRevertData; // revert data captured from the nested claim()

    constructor(HandleRegistry registry_, HandlePay pay_) {
        registry = registry_;
        pay = pay_;
    }

    function registerHandle(string calldata handle) external {
        registry.register(handle);
    }

    function doClaim() external {
        pay.claim();
    }

    receive() external payable {
        // Attempt to drain by re-entering claim() while the first claim is
        // still executing. Swallow the failure so the outer transfer succeeds
        // and we can assert on what happened.
        try pay.claim() {
            reentered = true;
        } catch (bytes memory data) {
            reentryRevertData = data;
        }
    }
}

/// @dev Receiver that rejects all native transfers.
contract RejectingReceiver {
    HandleRegistry internal immutable registry;

    constructor(HandleRegistry registry_) {
        registry = registry_;
    }

    function registerHandle(string calldata handle) external {
        registry.register(handle);
    }

    receive() external payable {
        revert("no thanks");
    }
}

contract HandlePayTest is Test {
    HandleRegistry internal registry;
    HandlePay internal pay;

    address internal attester = makeAddr("attester");
    address internal alice = makeAddr("alice");
    address internal bob = makeAddr("bob");
    address internal carol = makeAddr("carol");

    event PaymentSent(string handle, address indexed from, address indexed to, uint256 amount, bool escrowed);
    event Claimed(string handle, address indexed to, uint256 amount);

    function setUp() public {
        registry = new HandleRegistry(attester);
        pay = new HandlePay(address(registry));

        vm.deal(alice, 100 ether);
        vm.deal(bob, 100 ether);
        vm.deal(carol, 100 ether);
    }

    // ------------------------------------------------------------------
    // Constructor
    // ------------------------------------------------------------------

    function test_RegistryWiredInConstructor() public view {
        assertEq(address(pay.registry()), address(registry));
    }

    function test_ConstructorRevertsOnZeroRegistry() public {
        vm.expectRevert(bytes("registry is zero address"));
        new HandlePay(address(0));
    }

    // ------------------------------------------------------------------
    // payToHandle: direct payment
    // ------------------------------------------------------------------

    function test_PayToHandle_DirectToRegisteredOwner() public {
        vm.prank(bob);
        registry.register("bob");

        uint256 bobBefore = bob.balance;

        vm.expectEmit(true, true, true, true);
        emit PaymentSent("bob", alice, bob, 5 ether, false);

        vm.prank(alice);
        pay.payToHandle{value: 5 ether}("bob");

        assertEq(bob.balance, bobBefore + 5 ether);
        assertEq(address(pay).balance, 0); // nothing retained by the contract
        assertEq(pay.pendingOf("bob"), 0); // nothing escrowed
    }

    function test_PayToHandle_RevertWhenRegisteredOwnerRejects() public {
        RejectingReceiver rejector = new RejectingReceiver(registry);
        rejector.registerHandle("grumpy");

        vm.prank(alice);
        vm.expectRevert(HandlePay.TransferFailed.selector);
        pay.payToHandle{value: 1 ether}("grumpy");
    }

    // ------------------------------------------------------------------
    // payToHandle: escrow
    // ------------------------------------------------------------------

    function test_PayToHandle_EscrowsForUnregisteredHandle() public {
        vm.expectEmit(true, true, true, true);
        emit PaymentSent("future_user", alice, address(0), 3 ether, true);

        vm.prank(alice);
        pay.payToHandle{value: 3 ether}("future_user");

        assertEq(pay.pendingOf("future_user"), 3 ether);
        assertEq(address(pay).balance, 3 ether);
    }

    function test_PayToHandle_EscrowAccumulates() public {
        vm.prank(alice);
        pay.payToHandle{value: 1 ether}("future_user");
        vm.prank(bob);
        pay.payToHandle{value: 2 ether}("future_user");

        assertEq(pay.pendingOf("future_user"), 3 ether);
        assertEq(pay.pendingOf("other_user"), 0);
    }

    // ------------------------------------------------------------------
    // payToHandle: zero value
    // ------------------------------------------------------------------

    function test_PayToHandle_RevertOnZeroValue_Unregistered() public {
        vm.prank(alice);
        vm.expectRevert(HandlePay.ZeroValue.selector);
        pay.payToHandle{value: 0}("future_user");
    }

    function test_PayToHandle_RevertOnZeroValue_Registered() public {
        vm.prank(bob);
        registry.register("bob");

        vm.prank(alice);
        vm.expectRevert(HandlePay.ZeroValue.selector);
        pay.payToHandle{value: 0}("bob");
    }

    // ------------------------------------------------------------------
    // claim
    // ------------------------------------------------------------------

    function _escrowFor(string memory handle, uint256 amount) internal {
        vm.prank(alice);
        pay.payToHandle{value: amount}(handle);
    }

    function test_Claim_RevertWhenCallerHasNoHandle() public {
        _escrowFor("bob", 1 ether);

        vm.prank(bob);
        vm.expectRevert(HandlePay.NoHandleRegistered.selector);
        pay.claim();
    }

    function test_Claim_RevertWhenHandleUnverified() public {
        _escrowFor("bob", 1 ether);

        vm.prank(bob);
        registry.register("bob");

        // Registered but NOT verified: claim must be blocked (anti-squatter).
        vm.prank(bob);
        vm.expectRevert(HandlePay.HandleNotVerified.selector);
        pay.claim();

        assertEq(pay.pendingOf("bob"), 1 ether); // escrow untouched
    }

    function test_Claim_SquatterCannotStealEscrow() public {
        // Funds intended for the real "celebrity" are escrowed.
        _escrowFor("celebrity", 10 ether);

        // Squatter registers the handle but can never get it verified.
        vm.prank(carol);
        registry.register("celebrity");

        vm.prank(carol);
        vm.expectRevert(HandlePay.HandleNotVerified.selector);
        pay.claim();

        assertEq(pay.pendingOf("celebrity"), 10 ether);
    }

    function test_Claim_SucceedsWhenVerified() public {
        _escrowFor("bob", 4 ether);

        vm.prank(bob);
        registry.register("bob");
        vm.prank(attester);
        registry.setVerified("bob", true);

        uint256 bobBefore = bob.balance;

        vm.expectEmit(true, true, true, true);
        emit Claimed("bob", bob, 4 ether);

        vm.prank(bob);
        pay.claim();

        assertEq(bob.balance, bobBefore + 4 ether);
        assertEq(address(pay).balance, 0);
    }

    function test_Claim_ZeroesBalance() public {
        _escrowFor("bob", 4 ether);

        vm.prank(bob);
        registry.register("bob");
        vm.prank(attester);
        registry.setVerified("bob", true);

        vm.prank(bob);
        pay.claim();

        assertEq(pay.pendingOf("bob"), 0);

        // Second claim finds nothing.
        vm.prank(bob);
        vm.expectRevert(HandlePay.NothingToClaim.selector);
        pay.claim();
    }

    function test_Claim_RevertWhenNothingEscrowed() public {
        vm.prank(bob);
        registry.register("bob");
        vm.prank(attester);
        registry.setVerified("bob", true);

        vm.prank(bob);
        vm.expectRevert(HandlePay.NothingToClaim.selector);
        pay.claim();
    }

    function test_Claim_OnlyOwnEscrow() public {
        _escrowFor("bob", 2 ether);
        _escrowFor("carol", 7 ether);

        vm.prank(bob);
        registry.register("bob");
        vm.prank(attester);
        registry.setVerified("bob", true);

        vm.prank(bob);
        pay.claim();

        // Carol's escrow is untouched.
        assertEq(pay.pendingOf("carol"), 7 ether);
        assertEq(address(pay).balance, 7 ether);
    }

    function test_Claim_EscrowReceivedAfterRegistration() public {
        vm.prank(bob);
        registry.register("bob");

        // Direct payment goes straight to bob once registered...
        vm.prank(alice);
        pay.payToHandle{value: 1 ether}("bob");
        assertEq(pay.pendingOf("bob"), 0);

        // ...but escrow accrued BEFORE registration is claimable after verify.
    }

    // ------------------------------------------------------------------
    // Reentrancy
    // ------------------------------------------------------------------

    function test_Claim_ReentrancyBlocked() public {
        ReentrantClaimer attacker = new ReentrantClaimer(registry, pay);

        // Escrow funds for the attacker's handle, then register + verify so the
        // outer claim() passes all checks.
        _escrowFor("attacker", 5 ether);
        // Extra unrelated escrow sitting in the contract: the prize a
        // successful reentrancy drain would steal.
        _escrowFor("innocent", 20 ether);

        attacker.registerHandle("attacker");
        vm.prank(attester);
        registry.setVerified("attacker", true);

        attacker.doClaim();

        // The nested claim() inside receive() must have reverted.
        assertFalse(attacker.reentered());
        assertEq(bytes4(attacker.reentryRevertData()), HandlePay.Reentrancy.selector);

        // Attacker got exactly its own escrow, nothing more.
        assertEq(address(attacker).balance, 5 ether);
        assertEq(pay.pendingOf("attacker"), 0);
        assertEq(pay.pendingOf("innocent"), 20 ether);
        assertEq(address(pay).balance, 20 ether);

        // Guard resets: a later legitimate claim still works.
        vm.prank(bob);
        registry.register("innocent");
        vm.prank(attester);
        registry.setVerified("innocent", true);

        uint256 bobBefore = bob.balance;
        vm.prank(bob);
        pay.claim();
        assertEq(bob.balance, bobBefore + 20 ether);
        assertEq(address(pay).balance, 0);
    }

    // ------------------------------------------------------------------
    // Fuzz
    // ------------------------------------------------------------------

    function testFuzz_EscrowThenClaim(uint96 amount) public {
        vm.assume(amount > 0);
        vm.deal(alice, amount);

        vm.prank(alice);
        pay.payToHandle{value: amount}("bob");
        assertEq(pay.pendingOf("bob"), amount);

        vm.prank(bob);
        registry.register("bob");
        vm.prank(attester);
        registry.setVerified("bob", true);

        uint256 bobBefore = bob.balance;
        vm.prank(bob);
        pay.claim();

        assertEq(bob.balance, bobBefore + amount);
        assertEq(pay.pendingOf("bob"), 0);
    }
}
