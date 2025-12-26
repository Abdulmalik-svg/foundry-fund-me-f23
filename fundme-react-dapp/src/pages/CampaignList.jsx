import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ethers } from 'ethers';

// Your live contract on Sepolia
const CONTRACT_ADDRESS = "0xaEca09531191Db60959f9cEB0f46111C04b6dC41";

const CONTRACT_ABI = [
  "function getCampaignCount() external view returns (uint256)",
  "function getCampaign(uint256 _id) external view returns (address creator, string memory title, string memory description, string memory image, uint256 goal, uint256 pledged, bool completed, address priceFeed)",
  "function getFundersList(uint256 _id) external view returns (address[] memory)"
];

const CampaignList = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCampaigns = async () => {
    try {
      // If no wallet, still try to read (public data)
      const provider = window.ethereum 
        ? new ethers.BrowserProvider(window.ethereum)
        : new ethers.JsonRpcProvider("https://sepolia.infura.io/v3/YOUR_INFURA_KEY"); // Optional fallback

      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

      const count = await contract.getCampaignCount();
      const countNumber = Number(count);

      const campaignsArray = [];

      for (let i = 1; i <= countNumber; i++) {
        try {
          const camp = await contract.getCampaign(i);
          const funders = await contract.getFundersList(i);

          const [
            creator,
            title,
            description,
            image,
            goal,
            pledged,
            completed,
            // priceFeed (ignored)
          ] = camp;

          // Skip completed campaigns (or remove this line to show all)
          if (completed) continue;

          const goalEth = ethers.formatEther(goal);
          const pledgedEth = ethers.formatEther(pledged);
          const progress = goal.isZero() ? 0 : (Number(pledged) / Number(goal)) * 100;

          campaignsArray.push({
            id: i,
            creator,
            title,
            description,
            image: image || "https://via.placeholder.com/600x400?text=No+Image+Available",
            goal: goalEth,
            raised: pledgedEth,
            progress,
            backers: funders.length,
          });
        } catch (err) {
          console.error(`Error loading campaign ${i}:`, err);
        }
      }

      // Show newest campaigns first
      setCampaigns(campaignsArray.reverse());
    } catch (error) {
      console.error("Failed to fetch campaigns:", error);
      alert("Could not load campaigns. Are you on Sepolia network?");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();

    // Optional: Refresh every 20 seconds
    const interval = setInterval(fetchCampaigns, 20000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-20 text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-indigo-500 mx-auto"></div>
        <p className="text-gray-400 mt-6">Loading campaigns from blockchain...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 -mt-10 relative z-10 pb-20">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {campaigns.length === 0 ? (
          <div className="col-span-full text-center py-20">
            <p className="text-2xl text-gray-500">No active campaigns yet</p>
            <p className="text-gray-600 mt-4">Be the first to launch one!</p>
          </div>
        ) : (
          campaigns.map((camp) => (
            <div
              key={camp.id}
              className="bg-gray-800 border border-gray-700 rounded-3xl p-8 shadow-xl hover:translate-y-[-8px] hover:border-indigo-500/50 transition-all duration-300"
            >
              {/* Campaign Image */}
              <div className="w-full h-48 bg-gray-700 rounded-2xl overflow-hidden mb-6">
                <img
                  src={camp.image}
                  alt={camp.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://via.placeholder.com/600x400?text=Campaign+Image";
                  }}
                />
              </div>

              {/* Title */}
              <h2 className="text-2xl font-bold text-indigo-400 mb-4 line-clamp-2">
                {camp.title}
              </h2>

              {/* Progress Section */}
              <div className="mb-6">
                <div className="flex justify-between text-sm mb-2 text-gray-300 font-medium">
                  <span>Funded: {camp.raised} ETH</span>
                  <span>Goal: {camp.goal} ETH</span>
                </div>
                <div className="w-full bg-gray-700 h-3 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-emerald-400 to-teal-500 h-full transition-all duration-1000 ease-out"
                    style={{ width: `${Math.min(camp.progress, 100)}%` }}
                  ></div>
                </div>
                <div className="text-right text-xs text-gray-500 mt-1">
                  {camp.progress.toFixed(1)}%
                </div>
              </div>

              {/* Backers */}
              <div className="text-gray-400 text-sm mb-8 italic">
                {camp.backers} {camp.backers === 1 ? 'backer' : 'backers'} supporting this project
              </div>

              {/* View Button */}
              <Link to={`/campaign/${camp.id}`}>
                <button className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl font-bold text-white shadow-lg hover:shadow-purple-500/30 transition-all">
                  View Campaign
                </button>
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CampaignList;