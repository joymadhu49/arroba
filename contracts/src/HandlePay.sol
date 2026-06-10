// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {HandleRegistry} from "./HandleRegistry.sol";

/// @title HandlePay
/// @notice Pay anyone by their X (Twitter) handle on Circle's Arc testnet,
///         where the NATIVE value token is USDC (18 decimals for native value).
///
///         - If the handle is registered in the HandleRegistry, the payment is
///           forwarded directly to its owner.
///         - If the handle is unregistered, the payment is held in escrow keyed
///           by keccak256 of the handle string. Once the rightful user registers
///           AND verifies the handle (via the registry attester), they can
///           `claim()` the escrowed funds. The verification requirement prevents
///           squatters from registering someone else's username to steal
///           escrowed money.
contract HandlePay {
    // ---------------------------------------------------------------------
    // Events
    // ---------------------------------------------------------------------

    /// @param to recipient for direct sends; address(0) when escrowed.
    event PaymentSent(string handle, address indexed from, address indexed to, uint256 amount, bool escrowed);
    event Claimed(string handle, address indexed to, uint256 amount);

    // ---------------------------------------------------------------------
    // Errors
    // ---------------------------------------------------------------------

    error ZeroValue();
    error TransferFailed();
    error NoHandleRegistered();
    error HandleNotVerified();
    error NothingToClaim();
    error Reentrancy();

    // ---------------------------------------------------------------------
    // Storage
    // ---------------------------------------------------------------------

    /// @notice The handle registry this payment contract resolves against.
    HandleRegistry public immutable registry;

    /// @dev keccak256(handle) => escrowed native value (USDC on Arc).
    mapping(bytes32 => uint256) private _pending;

    /// @dev Simple reentrancy guard.
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;
    uint256 private _status = _NOT_ENTERED;

    modifier nonReentrant() {
        if (_status == _ENTERED) revert Reentrancy();
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }

    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------

    constructor(address registry_) {
        require(registry_ != address(0), "registry is zero address");
        registry = HandleRegistry(registry_);
    }

    // ---------------------------------------------------------------------
    // Payments
    // ---------------------------------------------------------------------

    /// @notice Pay native value (USDC on Arc) to `handle`. If the handle is
    ///         registered, value is forwarded directly to its owner; otherwise
    ///         it is held in escrow until the handle's owner claims it.
    function payToHandle(string calldata handle) external payable {
        if (msg.value == 0) revert ZeroValue();

        address owner = registry.ownerOf(handle);
        if (owner != address(0)) {
            (bool success,) = owner.call{value: msg.value}("");
            if (!success) revert TransferFailed();
            emit PaymentSent(handle, msg.sender, owner, msg.value, false);
        } else {
            _pending[keccak256(bytes(handle))] += msg.value;
            emit PaymentSent(handle, msg.sender, address(0), msg.value, true);
        }
    }

    /// @notice Escrowed amount pending for `handle`.
    function pendingOf(string calldata handle) external view returns (uint256) {
        return _pending[keccak256(bytes(handle))];
    }

    /// @notice Claim escrowed funds for the caller's registered handle.
    /// @dev    The handle MUST be verified in the registry: this prevents a
    ///         squatter from registering someone else's username and draining
    ///         the escrow. Follows checks-effects-interactions and is guarded
    ///         against reentrancy.
    function claim() external nonReentrant {
        string memory handle = registry.handleOf(msg.sender);
        if (bytes(handle).length == 0) revert NoHandleRegistered();
        if (!registry.isVerified(handle)) revert HandleNotVerified();

        bytes32 key = keccak256(bytes(handle));
        uint256 amount = _pending[key];
        if (amount == 0) revert NothingToClaim();

        // Effects before interaction.
        _pending[key] = 0;

        (bool success,) = msg.sender.call{value: amount}("");
        if (!success) revert TransferFailed();

        emit Claimed(handle, msg.sender, amount);
    }
}
