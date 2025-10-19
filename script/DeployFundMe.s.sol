// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import {Script} from "forge-std/Script.sol";
import {FundMe} from "../src/FundMe.sol";
import {HelperConfig} from "./HelperConfig.s.sol";

contract DeployFundMe is Script {
    function run() external returns (FundMe) {
        // Instantiate HelperConfig
        HelperConfig helperConfig = new HelperConfig();

        // Get the correct network configuration
        HelperConfig.NetworkConfig memory networkConfig = helperConfig.getActiveNetworkConfig();
        address priceFeedAddress = networkConfig.priceFeed;

        // Always use startBroadcast/stopBroadcast so msg.sender becomes the owner
        // This ensures the broadcaster (not the DeployFundMe contract) owns FundMe
        vm.startBroadcast();
        FundMe fundMe = new FundMe(priceFeedAddress);
        vm.stopBroadcast();

        return fundMe;
    }
}