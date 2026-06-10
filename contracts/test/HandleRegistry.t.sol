// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {HandleRegistry} from "../src/HandleRegistry.sol";

contract HandleRegistryTest is Test {
    HandleRegistry internal registry;

    address internal attester = makeAddr("attester");
    address internal alice = makeAddr("alice");
    address internal bob = makeAddr("bob");

    event HandleRegistered(string handle, address indexed owner);
    event HandleReleased(string handle, address indexed owner);
    event HandleVerified(string handle, bool verified);

    function setUp() public {
        registry = new HandleRegistry(attester);
    }

    // ------------------------------------------------------------------
    // Constructor / attester
    // ------------------------------------------------------------------

    function test_AttesterSetInConstructor() public view {
        assertEq(registry.attester(), attester);
    }

    function test_ConstructorRevertsOnZeroAttester() public {
        vm.expectRevert(HandleRegistry.ZeroAddress.selector);
        new HandleRegistry(address(0));
    }

    function test_SetAttester() public {
        vm.prank(attester);
        registry.setAttester(bob);
        assertEq(registry.attester(), bob);
    }

    function test_SetAttester_RevertWhenNotAttester() public {
        vm.prank(alice);
        vm.expectRevert(HandleRegistry.NotAttester.selector);
        registry.setAttester(alice);
    }

    function test_SetAttester_RevertOnZeroAddress() public {
        vm.prank(attester);
        vm.expectRevert(HandleRegistry.ZeroAddress.selector);
        registry.setAttester(address(0));
    }

    // ------------------------------------------------------------------
    // Handle validation
    // ------------------------------------------------------------------

    function test_Register_ValidHandles() public {
        vm.prank(alice);
        registry.register("a"); // 1 char minimum

        vm.prank(bob);
        registry.register("abc_123_xyz_045"); // 15 chars, full charset

        assertEq(registry.ownerOf("a"), alice);
        assertEq(registry.ownerOf("abc_123_xyz_045"), bob);
    }

    function test_Register_RevertOnEmptyHandle() public {
        vm.prank(alice);
        vm.expectRevert(HandleRegistry.InvalidHandle.selector);
        registry.register("");
    }

    function test_Register_RevertOnTooLongHandle() public {
        vm.prank(alice);
        vm.expectRevert(HandleRegistry.InvalidHandle.selector);
        registry.register("abcdefghijklmnop"); // 16 chars
    }

    function test_Register_RevertOnUppercase() public {
        // Uppercase is rejected, not normalized.
        vm.prank(alice);
        vm.expectRevert(HandleRegistry.InvalidHandle.selector);
        registry.register("Alice");

        vm.prank(alice);
        vm.expectRevert(HandleRegistry.InvalidHandle.selector);
        registry.register("aliCe");
    }

    function test_Register_RevertOnInvalidCharacters() public {
        string[8] memory bad =
            ["al ice", "al-ice", "al.ice", "al@ice", "alice!", "@alice", unicode"ålice", "al\nice"];
        for (uint256 i = 0; i < bad.length; ++i) {
            vm.prank(alice);
            vm.expectRevert(HandleRegistry.InvalidHandle.selector);
            registry.register(bad[i]);
        }
    }

    function testFuzz_Register_RejectsBytesOutsideCharset(bytes1 c) public {
        bool valid = (c >= 0x61 && c <= 0x7A) || (c >= 0x30 && c <= 0x39) || c == 0x5F;
        string memory handle = string(abi.encodePacked("ab", c));

        vm.prank(alice);
        if (valid) {
            registry.register(handle);
            assertEq(registry.ownerOf(handle), alice);
        } else {
            vm.expectRevert(HandleRegistry.InvalidHandle.selector);
            registry.register(handle);
        }
    }

    // ------------------------------------------------------------------
    // Registration semantics
    // ------------------------------------------------------------------

    function test_Register_SetsMappingsAndEmits() public {
        vm.expectEmit(true, true, true, true);
        emit HandleRegistered("alice", alice);

        vm.prank(alice);
        registry.register("alice");

        assertEq(registry.ownerOf("alice"), alice);
        assertEq(registry.handleOf(alice), "alice");
        assertFalse(registry.isVerified("alice"));
    }

    function test_Register_RevertOnDuplicateHandle() public {
        vm.prank(alice);
        registry.register("alice");

        vm.prank(bob);
        vm.expectRevert(HandleRegistry.HandleAlreadyRegistered.selector);
        registry.register("alice");
    }

    function test_Register_RevertWhenAddressAlreadyHasHandle() public {
        vm.startPrank(alice);
        registry.register("alice");

        vm.expectRevert(HandleRegistry.AddressAlreadyHasHandle.selector);
        registry.register("alice2");
        vm.stopPrank();
    }

    function test_UnclaimedHandle_Views() public view {
        assertEq(registry.ownerOf("nobody"), address(0));
        assertEq(registry.handleOf(alice), "");
        assertFalse(registry.isVerified("nobody"));
    }

    // ------------------------------------------------------------------
    // Release
    // ------------------------------------------------------------------

    function test_Release_FreesHandleAndEmits() public {
        vm.prank(alice);
        registry.register("alice");

        vm.expectEmit(true, true, true, true);
        emit HandleReleased("alice", alice);

        vm.prank(alice);
        registry.release();

        assertEq(registry.ownerOf("alice"), address(0));
        assertEq(registry.handleOf(alice), "");
    }

    function test_Release_RevertWhenNoHandle() public {
        vm.prank(alice);
        vm.expectRevert(HandleRegistry.NoHandleRegistered.selector);
        registry.release();
    }

    function test_Release_ClearsVerifiedFlag() public {
        vm.prank(alice);
        registry.register("alice");
        vm.prank(attester);
        registry.setVerified("alice", true);
        assertTrue(registry.isVerified("alice"));

        vm.prank(alice);
        registry.release();
        assertFalse(registry.isVerified("alice"));

        // New owner of the same handle must not inherit verification.
        vm.prank(bob);
        registry.register("alice");
        assertFalse(registry.isVerified("alice"));
    }

    function test_ReleaseThenReRegister() public {
        vm.startPrank(alice);
        registry.register("alice");
        registry.release();
        registry.register("alice_new");
        vm.stopPrank();

        assertEq(registry.handleOf(alice), "alice_new");
        assertEq(registry.ownerOf("alice_new"), alice);
        assertEq(registry.ownerOf("alice"), address(0));

        // Released handle can be claimed by someone else.
        vm.prank(bob);
        registry.register("alice");
        assertEq(registry.ownerOf("alice"), bob);
    }

    // ------------------------------------------------------------------
    // Verification
    // ------------------------------------------------------------------

    function test_SetVerified_ByAttester() public {
        vm.prank(alice);
        registry.register("alice");

        vm.expectEmit(true, true, true, true);
        emit HandleVerified("alice", true);

        vm.prank(attester);
        registry.setVerified("alice", true);
        assertTrue(registry.isVerified("alice"));

        vm.prank(attester);
        registry.setVerified("alice", false);
        assertFalse(registry.isVerified("alice"));
    }

    function test_SetVerified_RevertWhenNotAttester() public {
        vm.prank(alice);
        registry.register("alice");

        vm.prank(alice);
        vm.expectRevert(HandleRegistry.NotAttester.selector);
        registry.setVerified("alice", true);

        vm.prank(bob);
        vm.expectRevert(HandleRegistry.NotAttester.selector);
        registry.setVerified("alice", true);
    }

    function test_SetVerified_RevertWhenHandleNotRegistered() public {
        vm.prank(attester);
        vm.expectRevert(HandleRegistry.HandleNotRegistered.selector);
        registry.setVerified("ghost", true);
    }

    function test_SetVerified_AfterAttesterRotation() public {
        vm.prank(alice);
        registry.register("alice");

        vm.prank(attester);
        registry.setAttester(bob);

        // Old attester loses access.
        vm.prank(attester);
        vm.expectRevert(HandleRegistry.NotAttester.selector);
        registry.setVerified("alice", true);

        // New attester can verify.
        vm.prank(bob);
        registry.setVerified("alice", true);
        assertTrue(registry.isVerified("alice"));
    }
}
