// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import {Test} from "forge-std/Test.sol";
import {console} from "forge-std/console.sol";
import {FundMe} from "../../FundMe.sol";
import {HelperConfig} from "../../../script/HelperConfig.s.sol";

contract InteractionsTest is Test {
    FundMe fundMe;
    address OWNER;
    address USER = makeAddr("user");

    uint256 constant SEND_VALUE = 0.1 ether;
    uint256 constant STARTING_BALANCE = 10 ether;

    function setUp() external {
        // Deploy HelperConfig and get the price feed
        HelperConfig helperConfig = new HelperConfig();
        HelperConfig.NetworkConfig memory config = helperConfig.getActiveNetworkConfig();
        
        // Deploy FundMe - the deployer (this test contract) becomes the owner
        fundMe = new FundMe(config.priceFeed);
        
        // Get the actual owner from the deployed contract
        OWNER = fundMe.getOwner();

        // Give user ETH
        vm.deal(USER, STARTING_BALANCE);
    }

    function testUserCanFundInteractions() public {
        // Arrange
        uint256 startingBalance = address(fundMe).balance;

        // Act - Fund directly from USER
        vm.prank(USER);
        fundMe.fund{value: SEND_VALUE}();

        // Assert
        uint256 endingBalance = address(fundMe).balance;
        assertEq(endingBalance, startingBalance + SEND_VALUE);
    }

    function testUserCanFundAndOwnerWithdraw() public {
        // Arrange - Fund from USER
        vm.prank(USER);
        fundMe.fund{value: SEND_VALUE}();

        uint256 startingFundMeBalance = address(fundMe).balance;
        uint256 startingOwnerBalance = address(this).balance;

        // Act - Withdraw (test contract is the owner, no prank needed)
        fundMe.withdraw();

        // Assert
        uint256 endingFundMeBalance = address(fundMe).balance;
        uint256 endingOwnerBalance = address(this).balance;

        assertEq(endingFundMeBalance, 0, "FundMe should have 0 balance");
        assertEq(endingOwnerBalance, startingOwnerBalance + startingFundMeBalance, "Owner should receive funds");
    }
    
    // Allow test contract to receive ETH
    receive() external payable {}
    
    // Override fallback to accept ETH
    fallback() external payable {}
}