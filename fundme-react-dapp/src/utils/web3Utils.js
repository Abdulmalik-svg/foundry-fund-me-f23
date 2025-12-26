// src/utils/web3Utils.js

import { ethers } from "ethers";

// --- CONFIGURATION ---
// Your verified contract on Sepolia
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || "0xaEca09531191Db60959f9cEB0f46111C04b6dC41";

// ABI import (make sure this file exists and is correct!)
import FundMeMultiAbi from "../constants/FundMeMultiAbi.json";

// Read-only RPC (use environment variable or fallback)
const READ_ONLY_RPC_URL = 
  import.meta.env.VITE_SEPOLIA_RPC_URL || 
  "https://eth-sepolia.g.alchemy.com/v2/your-key-here"; // Optional fallback

// Sepolia ETH/USD Price Feed (fixed for your contract)
const SEPOLIA_PRICE_FEED = "0x694AA1769357215DE4FAC081bf1f309aDC325306";

// Initialize read-only provider (for public view calls)
const readOnlyProvider = READ_ONLY_RPC_URL 
  ? new ethers.JsonRpcProvider(READ_ONLY_RPC_URL)
  : null;

const readOnlyContract = readOnlyProvider
  ? new ethers.Contract(CONTRACT_ADDRESS, FundMeMultiAbi, readOnlyProvider)
  : null;

// Helper to get signer + contract (for transactions)
export async function getSignerAndContract() {
  if (typeof window.ethereum === "undefined") {
    throw new Error("MetaMask or Ethereum wallet not detected");
  }

  try {
    await window.ethereum.request({ method: "eth_requestAccounts" });
    const browserProvider = new ethers.BrowserProvider(window.ethereum);
    const signer = await browserProvider.getSigner();
    const address = await signer.getAddress();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, FundMeMultiAbi, signer);

    return { signer, contract, address };
  } catch (error) {
    console.error("Wallet connection failed:", error);
    throw new Error("Failed to connect wallet. Please try again.");
  }
}

// 1. Check if wallet is already connected
export async function getConnectedAccount() {
  if (typeof window.ethereum === "undefined") return null;

  try {
    const accounts = await window.ethereum.request({ method: "eth_accounts" });
    return accounts.length > 0 ? accounts[0].toLowerCase() : null;
  } catch (error) {
    console.error("Error checking connection:", error);
    return null;
  }
}

// 2. Get campaign count (read-only)
export async function getCampaignCount() {
  if (!readOnlyContract) {
    throw new Error("Read-only provider not configured");
  }

  try {
    const count = await readOnlyContract.getCampaignCount();
    return Number(count);
  } catch (error) {
    console.error("Failed to fetch campaign count:", error);
    return 0;
  }
}

// 3. Get single campaign data
export async function getCampaignData(campaignId) {
  if (!readOnlyContract) {
    throw new Error("Read-only provider not configured");
  }

  try {
    const data = await readOnlyContract.getCampaign(campaignId);

    const [
      creator,
      title,
      description,
      image,
      goal,
      pledged,
      completed,
      priceFeed
    ] = data;

    return {
      id: Number(campaignId),
      creator: creator.toLowerCase(),
      title,
      description,
      image: image || "https://via.placeholder.com/800x400?text=No+Image",
      goalEth: ethers.formatEther(goal),
      pledgedEth: ethers.formatEther(pledged),
      goalWei: goal,
      pledgedWei: pledged,
      completed: Boolean(completed),
      progress: goal > 0n ? (Number(pledged) / Number(goal)) * 100 : 0,
    };
  } catch (error) {
    console.error(`Failed to fetch campaign ${campaignId}:`, error);
    return null;
  }
}

// 4. Get all campaigns
export async function getAllCampaigns() {
  const count = await getCampaignCount();
  if (count === 0) return [];

  const promises = [];
  for (let i = 1; i <= count; i++) {
    promises.push(getCampaignData(i));
  }

  const results = await Promise.all(promises);
  return results
    .filter(camp => camp !== null)
    .reverse(); // newest first
}

// 5. Get backers list + contributions
export async function getBackersList(campaignId) {
  if (!readOnlyContract) return [];

  try {
    const funders = await readOnlyContract.getFundersList(campaignId);
    const backers = [];

    for (const funder of funders) {
      const amount = await readOnlyContract.getContribution(campaignId, funder);
      if (amount > 0n) {
        backers.push({
          address: funder.toLowerCase(),
          amountEth: ethers.formatEther(amount),
          amountWei: amount,
        });
      }
    }

    // Sort by amount descending
    return backers.sort((a, b) => Number(b.amountWei) - Number(a.amountWei));
  } catch (error) {
    console.error("Failed to fetch backers:", error);
    return [];
  }
}

// 6. Create new campaign
export async function createCampaign({ title, description, goalEth, image = "" }) {
  const { contract } = await getSignerAndContract();

  const goalWei = ethers.parseEther(goalEth.toString());

  try {
    const tx = await contract.createCampaign(
      title,
      description,
      goalWei,
      image || "https://images.unsplash.com/photo-1531206715517-5c0ba140b2b8",
      SEPOLIA_PRICE_FEED
    );

    console.log("Creating campaign...");
    await tx.wait();
    console.log("Campaign created!");
    return tx;
  } catch (error) {
    console.error("Create campaign failed:", error);
    throw error;
  }
}

// 7. Fund a campaign
export async function fundCampaign(campaignId, ethAmount) {
  const { contract } = await getSignerAndContract();

  const weiAmount = ethers.parseEther(ethAmount.toString());

  try {
    const tx = await contract.fundCampaign(campaignId, { value: weiAmount });
    console.log("Funding...");
    await tx.wait();
    console.log("Funded successfully!");
    return tx;
  } catch (error) {
    console.error("Funding failed:", error);
    throw error;
  }
}

// 8. Withdraw funds (creator only)
export async function withdrawFunds(campaignId) {
  const { contract, address } = await getSignerAndContract();

  try {
    const tx = await contract.withdraw(campaignId);
    console.log("Withdrawing funds...");
    await tx.wait();
    console.log("Withdrawal successful!");
    return tx;
  } catch (error) {
    console.error("Withdraw failed:", error);

    let msg = "Withdrawal failed.";
    if (error.reason) {
      msg += ` Reason: ${error.reason}`;
    } else if (error.message.includes("Not creator")) {
      msg = "Only the campaign creator can withdraw funds.";
    } else if (error.message.includes("Goal not reached")) {
      msg = "Campaign goal has not been reached yet.";
    } else if (error.message.includes("Already withdrawn")) {
      msg = "Funds have already been withdrawn.";
    }

    throw new Error(msg);
  }
}

export default {
  getConnectedAccount,
  getSignerAndContract,
  getCampaignCount,
  getCampaignData,
  getAllCampaigns,
  getBackersList,
  createCampaign,
  fundCampaign,
  withdrawFunds,
};