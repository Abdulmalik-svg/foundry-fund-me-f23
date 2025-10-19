// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

// Why is this a library and not abstract?
// A Library is used for "utility" functions that don't hold state and are deployed once.
// Why not an interface?
// An interface defines *what* functions exist but contains no implementation/logic.
library PriceConverter {
    
    // We recommend making this function public and pure/view (as appropriate) 
    // to allow other contracts/scripts to use it via the library's deployment address.
    function getPrice(AggregatorV3Interface priceFeed) internal view returns (uint256) {
        // We could write the address here, but we are passing it in instead.
        // Sepolia ETH / USD Address: 0x694AA1769357215DE4FAC081bf1f309aDC325306
        
        // This call will revert if the priceFeed is not a contract, 
        // which is why the main contract needs to ensure the address is correct.
        (, int256 answer, , , ) = priceFeed.latestRoundData();
        
        // Check for a negative price (which shouldn't happen, but is good practice)
        require(answer > 0, "PriceFeed did not return a positive price.");

        // FIX: No need to multiply here!
        // The Aggregator returns the price in 8 decimal places for Sepolia ETH/USD.
        // We will keep the final converted value in 18 decimals later.
        return uint256(answer); 
    }

    // This function returns the price feed's number of decimals.
    // It is often safer to fetch this dynamically than hardcode '8'.
    function getDecimals(AggregatorV3Interface priceFeed) internal view returns (uint8) {
        return priceFeed.decimals();
    }


    // 1000000000000000000 (10**18)
    function getConversionRate(
        uint256 ethAmount, // The amount of ETH (in wei) the user sent (18 decimals)
        AggregatorV3Interface priceFeed
    ) internal view returns (uint256) {
        uint256 ethPrice = getPrice(priceFeed); // Price in 8 decimals
        uint8 decimals = getDecimals(priceFeed); // Should return 8

        // Calculation Steps:
        // 1. Convert the 8-decimal PriceFeed value (ethPrice) into 18 decimals 
        //    by multiplying by 10**(18 - decimals) = 10**10.
        uint256 ethPriceIn18Decimals = ethPrice * (10**(18 - decimals));
        
        // 2. Calculate USD equivalent: (ETH_Price_in_18_Decimals * ETH_Amount_in_18_Decimals)
        //    Since both are in 18 decimals, the result is in 36 decimals.
        //    We divide by 10**18 to bring it back to 18 decimals (the USD amount).
        uint256 ethAmountInUsd = (ethPriceIn18Decimals * ethAmount) / 1000000000000000000;
        
        return ethAmountInUsd;
    }
}