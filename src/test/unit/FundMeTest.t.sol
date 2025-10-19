// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import {Test} from "forge-std/Test.sol";
import {console} from "forge-std/console.sol";
import {FundMe} from "../../FundMe.sol";
import {MockV3Aggregator} from "../mocks/MockV3Aggregator.sol";

contract FundMeTest is Test {
    FundMe private fundMe;
    MockV3Aggregator private mockV3Aggregator;

    uint256 private s_defaultSendValue = 10e18; // 10 ETH
    uint8 private constant DECIMALS = 8;
    int256 private constant INITIAL_ANSWER = 2000e8; // $2000
    
    address USER = makeAddr("user");
    uint256 SEND_VALUE = 1e18;
    uint256 constant GAS_PRICE = 1;

    // ===== Setup =====
    function setUp() external {
        // Deploy mock price feed
        mockV3Aggregator = new MockV3Aggregator(DECIMALS, INITIAL_ANSWER);

        // Deploy FundMe with mock price feed
        fundMe = new FundMe(address(mockV3Aggregator));

        // Give this contract some ETH
        vm.deal(address(this), 100e18);
    }

    // ===== Basic Tests =====
    function testMinimumDollarIsFive() public view {
        assertEq(fundMe.c_MINIMUM_USD(), 5e18);
    }

    function testOwnerIsMsgSender() public view {
        assertEq(fundMe.getOwner(), address(this));
    }

    function testPriceFeedVersionIsAccurate() public view {
        uint256 version = fundMe.getVersion();
        assertEq(version, 4); // Mock version
    }

    function testFundFailsWithoutEnoughETH() public {
        vm.expectRevert();
        fundMe.fund(); // sending 0 ETH
    }

    function testFundUpdatesFundedDataStructure() public {
        fundMe.fund{value: s_defaultSendValue}();
        uint256 amountFunded = fundMe.getAddressToAmountFunded(address(this));
        assertEq(amountFunded, s_defaultSendValue);
    }

    function testAddsFunderToArrayOfFunders() public {
        // Give USER some ETH before they can send it
        vm.deal(USER, SEND_VALUE);

        vm.prank(USER);
        fundMe.fund{value: SEND_VALUE}();
        address funder = fundMe.getFunder(0);
        assertEq(funder, USER);
    }

    modifier funded() {
        vm.deal(USER, SEND_VALUE);
        vm.prank(USER);
        fundMe.fund{value: SEND_VALUE}();
        _;
    }

    function testOnlyOwnerCanWithdraw() public funded {
        vm.prank(USER);
        vm.expectRevert();
        fundMe.withdraw();
    }

    function testWithDrawWithASingleFunder() public funded {
        // Arrange
        uint256 startingOwnerBalance = fundMe.getOwner().balance;
        uint256 startingFundMeBalance = address(fundMe).balance;

        vm.prank(fundMe.getOwner());
        fundMe.withdraw();

        // Assert
        uint256 endingOwnerBalance = fundMe.getOwner().balance;
        uint256 endingFundMeBalance = address(fundMe).balance;
        assertEq(endingFundMeBalance, 0);
        assertEq(startingFundMeBalance + startingOwnerBalance, endingOwnerBalance);
    }

    function testWithdrawFromMultipleFunders() public funded {
        // Arrange
        uint160 numberOfFunders = 10;
        uint160 startingFunderIndex = 1;
        for(uint160 i = startingFunderIndex; i < numberOfFunders; i++) {
            hoax(address(i), SEND_VALUE);
            fundMe.fund{value: SEND_VALUE}();
        }

        uint256 startingOwnerBalance = fundMe.getOwner().balance;
        uint256 startingFundMeBalance = address(fundMe).balance;

        // Act
        vm.startPrank(fundMe.getOwner());
        fundMe.withdraw();
        vm.stopPrank();

        // Assert
        assert(address(fundMe).balance == 0);
        assert(startingFundMeBalance + startingOwnerBalance == fundMe.getOwner().balance);
    }

    // ===== Multiple Funders Test =====
    function testMultipleFundersAndWithdraw() public {
        // Create mock addresses
        address alice = makeAddr("alice");
        address bob = makeAddr("bob");
        address carol = makeAddr("carol");

        // Give them ETH
        vm.deal(alice, s_defaultSendValue);
        vm.deal(bob, s_defaultSendValue);
        vm.deal(carol, s_defaultSendValue);

        // Each funder sends ETH
        vm.prank(alice);
        fundMe.fund{value: s_defaultSendValue}();

        vm.prank(bob);
        fundMe.fund{value: s_defaultSendValue}();

        vm.prank(carol);
        fundMe.fund{value: s_defaultSendValue}();

        // Verify funded data
        assertEq(fundMe.getAddressToAmountFunded(alice), s_defaultSendValue);
        assertEq(fundMe.getAddressToAmountFunded(bob), s_defaultSendValue);
        assertEq(fundMe.getAddressToAmountFunded(carol), s_defaultSendValue);

        // Verify funders recorded
        assertEq(fundMe.getFunder(0), alice);
        assertEq(fundMe.getFunder(1), bob);
        assertEq(fundMe.getFunder(2), carol);

        // Check contract balance before withdraw
        uint256 totalBalance = address(fundMe).balance;
        assertEq(totalBalance, s_defaultSendValue * 3);

        // Withdraw as owner (this test contract is the owner)
        uint256 ownerBalanceBefore = address(this).balance;
        fundMe.withdraw();
        uint256 ownerBalanceAfter = address(this).balance;

        // Contract balance should be 0
        assertEq(address(fundMe).balance, 0);

        // Owner balance should increase by total fund amount (allow 10 wei tolerance for rounding)
        assertApproxEqAbs(
            ownerBalanceAfter,
            ownerBalanceBefore + totalBalance,
            10,
            "Owner balance should equal starting balance + withdrawn funds"
        );

        // Funders mapping should reset
        assertEq(fundMe.getAddressToAmountFunded(alice), 0);
        assertEq(fundMe.getAddressToAmountFunded(bob), 0);
        assertEq(fundMe.getAddressToAmountFunded(carol), 0);

        // Ensure funders array is cleared
        vm.expectRevert(); // Accessing empty array should revert
        fundMe.getFunder(0);
    }

    function testMultipleFundersAndWithdrawCheaper() public {
        // Create mock addresses
        address alice = makeAddr("alice");
        address bob = makeAddr("bob");
        address carol = makeAddr("carol");

        // Give them ETH
        vm.deal(alice, s_defaultSendValue);
        vm.deal(bob, s_defaultSendValue);
        vm.deal(carol, s_defaultSendValue);

        // Each funder sends ETH
        vm.prank(alice);
        fundMe.fund{value: s_defaultSendValue}();

        vm.prank(bob);
        fundMe.fund{value: s_defaultSendValue}();

        vm.prank(carol);
        fundMe.fund{value: s_defaultSendValue}();

        // Verify funded data
        assertEq(fundMe.getAddressToAmountFunded(alice), s_defaultSendValue);
        assertEq(fundMe.getAddressToAmountFunded(bob), s_defaultSendValue);
        assertEq(fundMe.getAddressToAmountFunded(carol), s_defaultSendValue);

        // Verify funders recorded
        assertEq(fundMe.getFunder(0), alice);
        assertEq(fundMe.getFunder(1), bob);
        assertEq(fundMe.getFunder(2), carol);

        // Check contract balance before withdraw
        uint256 totalBalance = address(fundMe).balance;
        assertEq(totalBalance, s_defaultSendValue * 3);

        // Withdraw as owner (this test contract is the owner)
        uint256 ownerBalanceBefore = address(this).balance;
        fundMe.cheaperWithdraw();
        uint256 ownerBalanceAfter = address(this).balance;

        // Contract balance should be 0
        assertEq(address(fundMe).balance, 0);

        // Owner balance should increase by total fund amount (allow 10 wei tolerance for rounding)
        assertApproxEqAbs(
            ownerBalanceAfter,
            ownerBalanceBefore + totalBalance,
            10,
            "Owner balance should equal starting balance + withdrawn funds"
        );

        // Funders mapping should reset
        assertEq(fundMe.getAddressToAmountFunded(alice), 0);
        assertEq(fundMe.getAddressToAmountFunded(bob), 0);
        assertEq(fundMe.getAddressToAmountFunded(carol), 0);

        // Ensure funders array is cleared
        vm.expectRevert(); // Accessing empty array should revert
        fundMe.getFunder(0);
    }

    // Make this contract able to receive ETH
    receive() external payable {}
}