// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {HandleRegistry} from "../src/HandleRegistry.sol";
import {HandlePay} from "../src/HandlePay.sol";

/// @notice Deploys HandleRegistry + HandlePay to Circle's Arc testnet.
///
/// Required environment variables:
///   PRIVATE_KEY       deployer private key (0x-prefixed hex)
///   ATTESTER_ADDRESS  address authorized to verify handles
///
/// Usage:
///   forge script script/Deploy.s.sol \
///     --rpc-url https://rpc.testnet.arc.network \
///     --broadcast
contract Deploy is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address attester = vm.envAddress("ATTESTER_ADDRESS");

        vm.startBroadcast(deployerKey);

        HandleRegistry registry = new HandleRegistry(attester);
        HandlePay pay = new HandlePay(address(registry));

        vm.stopBroadcast();

        console.log("HandleRegistry deployed at:", address(registry));
        console.log("HandlePay deployed at:    ", address(pay));
        console.log("Attester:                 ", attester);
    }
}
