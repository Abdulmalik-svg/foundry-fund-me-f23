// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import {AggregatorV3Interface} from "chainlink-brownie-contracts/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import {PriceConverter} from "./PriceConverter.sol";

error NotOwner();

contract FundMe {
    using PriceConverter for uint256;

    // ===== Constants =====
    uint256 public constant c_MINIMUM_USD = 5 * 10 ** 18;

    // ===== Immutables =====
    address private immutable i_owner;

    // ===== Storage Variables =====
    mapping(address => uint256) private s_addressToAmountFunded;
    address[] private s_funders;
    AggregatorV3Interface private immutable s_priceFeed;

    // ===== Constructor =====
    constructor(address priceFeed) {
        i_owner = msg.sender;
        s_priceFeed = AggregatorV3Interface(priceFeed);
    }

    // ===== Fund Function =====
    function fund() public payable {
        require(msg.value.getConversionRate(s_priceFeed) >= c_MINIMUM_USD, "You need to spend more ETH!");
        s_addressToAmountFunded[msg.sender] += msg.value;
        s_funders.push(msg.sender);
    }

    // ===== Get Price Feed Version =====
    function getVersion() public view returns (uint256) {
        return s_priceFeed.version();
    }

    // ===== Owner-only Withdraw =====
    modifier onlyOwner() {
        if (msg.sender != i_owner) revert NotOwner();
        _;
    }

    function cheaperWithdraw() public onlyOwner {
        uint256 fundersLength = s_funders.length;
        for(uint256 funderIndex = 0; funderIndex < fundersLength; funderIndex++) 
        {
            address funder = s_funders[funderIndex];
            s_addressToAmountFunded[funder] = 0;
        }
        s_funders = new address[](0);
        (bool callSuccess, ) = payable(msg.sender).call{
            value: address(this).balance
        } ("");
        require(callSuccess, "Call failed");
    }

    function withdraw() public onlyOwner {
        uint256 amountToWithdraw = address(this).balance;

        // Reset all funded balances
        for (uint256 i = 0; i < s_funders.length; i++) {
            address funder = s_funders[i];
            s_addressToAmountFunded[funder] = 0;
        }

        // Reset funders array correctly
        s_funders = new address[](0);

        // Transfer ETH to owner
        (bool success, ) = payable(i_owner).call{value: amountToWithdraw}("");
        require(success, "Call failed");
    }

    // ===== Fallback / Receive =====
    fallback() external payable {
        fund();
    }

    receive() external payable {
        fund();
    }

    // ===== Getter Functions for Private Storage =====
    function getAddressToAmountFunded(address fundingAddress) external view returns (uint256) {
        return s_addressToAmountFunded[fundingAddress];
    }

    function getFunder(uint256 index) external view returns (address) {
        return s_funders[index];
    }

    function getOwner() external view returns (address) {
        return i_owner;
    }

    function getPriceFeed() external view returns (AggregatorV3Interface) {
        return s_priceFeed;
    }
}