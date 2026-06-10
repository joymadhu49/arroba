// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title HandleRegistry
/// @notice On-chain registry mapping X (Twitter) usernames ("handles") to wallet
///         addresses on Circle's Arc testnet. Handles follow X username rules:
///         1-15 characters, lowercase a-z, digits 0-9, and underscore only.
///         Uppercase input is rejected rather than normalized so that the
///         on-chain handle is always canonical.
/// @dev    A designated attester can mark handles as verified (i.e. the
///         registrant has proven ownership of the X account off-chain).
contract HandleRegistry {
    // ---------------------------------------------------------------------
    // Events
    // ---------------------------------------------------------------------

    event HandleRegistered(string handle, address indexed owner);
    event HandleReleased(string handle, address indexed owner);
    event HandleVerified(string handle, bool verified);
    event AttesterChanged(address indexed previousAttester, address indexed newAttester);

    // ---------------------------------------------------------------------
    // Errors
    // ---------------------------------------------------------------------

    error InvalidHandle();
    error HandleAlreadyRegistered();
    error AddressAlreadyHasHandle();
    error NoHandleRegistered();
    error HandleNotRegistered();
    error NotAttester();
    error ZeroAddress();

    // ---------------------------------------------------------------------
    // Storage
    // ---------------------------------------------------------------------

    /// @dev keccak256(handle) => owner address (zero if unclaimed).
    mapping(bytes32 => address) private _handleOwner;

    /// @dev owner address => handle string (empty if none).
    mapping(address => string) private _addressHandle;

    /// @dev keccak256(handle) => verified flag.
    mapping(bytes32 => bool) private _verified;

    /// @dev Address authorized to verify handles.
    address private _attester;

    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------

    constructor(address attester_) {
        if (attester_ == address(0)) revert ZeroAddress();
        _attester = attester_;
        emit AttesterChanged(address(0), attester_);
    }

    // ---------------------------------------------------------------------
    // Modifiers
    // ---------------------------------------------------------------------

    modifier onlyAttester() {
        if (msg.sender != _attester) revert NotAttester();
        _;
    }

    // ---------------------------------------------------------------------
    // Registration
    // ---------------------------------------------------------------------

    /// @notice Claim `handle` for the caller. The handle must be valid,
    ///         unclaimed, and the caller must not already own a handle.
    function register(string calldata handle) external {
        if (!_isValidHandle(handle)) revert InvalidHandle();
        if (bytes(_addressHandle[msg.sender]).length != 0) revert AddressAlreadyHasHandle();

        bytes32 key = keccak256(bytes(handle));
        if (_handleOwner[key] != address(0)) revert HandleAlreadyRegistered();

        _handleOwner[key] = msg.sender;
        _addressHandle[msg.sender] = handle;

        emit HandleRegistered(handle, msg.sender);
    }

    /// @notice Release the caller's handle, making it available for others.
    ///         Clears the handle's verified flag.
    function release() external {
        string memory handle = _addressHandle[msg.sender];
        if (bytes(handle).length == 0) revert NoHandleRegistered();

        bytes32 key = keccak256(bytes(handle));
        delete _handleOwner[key];
        delete _addressHandle[msg.sender];

        if (_verified[key]) {
            delete _verified[key];
            emit HandleVerified(handle, false);
        }

        emit HandleReleased(handle, msg.sender);
    }

    // ---------------------------------------------------------------------
    // Verification (attester)
    // ---------------------------------------------------------------------

    /// @notice Set the verified flag for a registered handle.
    /// @dev    Only callable by the attester.
    function setVerified(string calldata handle, bool v) external onlyAttester {
        bytes32 key = keccak256(bytes(handle));
        if (_handleOwner[key] == address(0)) revert HandleNotRegistered();

        _verified[key] = v;
        emit HandleVerified(handle, v);
    }

    /// @notice Transfer the attester role to a new address.
    /// @dev    Only callable by the current attester.
    function setAttester(address newAttester) external onlyAttester {
        if (newAttester == address(0)) revert ZeroAddress();
        emit AttesterChanged(_attester, newAttester);
        _attester = newAttester;
    }

    // ---------------------------------------------------------------------
    // Views
    // ---------------------------------------------------------------------

    /// @notice Owner of `handle`; zero address if unclaimed.
    function ownerOf(string calldata handle) external view returns (address) {
        return _handleOwner[keccak256(bytes(handle))];
    }

    /// @notice Handle owned by `owner`; empty string if none.
    function handleOf(address owner) external view returns (string memory) {
        return _addressHandle[owner];
    }

    /// @notice Whether `handle` has been verified by the attester.
    function isVerified(string calldata handle) external view returns (bool) {
        return _verified[keccak256(bytes(handle))];
    }

    /// @notice Current attester address.
    function attester() external view returns (address) {
        return _attester;
    }

    // ---------------------------------------------------------------------
    // Internal
    // ---------------------------------------------------------------------

    /// @dev Valid handles are 1-15 bytes of [a-z0-9_]. Uppercase is rejected.
    function _isValidHandle(string calldata handle) internal pure returns (bool) {
        bytes calldata b = bytes(handle);
        uint256 len = b.length;
        if (len == 0 || len > 15) return false;

        for (uint256 i = 0; i < len; ++i) {
            bytes1 c = b[i];
            bool isLower = c >= 0x61 && c <= 0x7A; // a-z
            bool isDigit = c >= 0x30 && c <= 0x39; // 0-9
            bool isUnderscore = c == 0x5F; // _
            if (!isLower && !isDigit && !isUnderscore) return false;
        }
        return true;
    }
}
