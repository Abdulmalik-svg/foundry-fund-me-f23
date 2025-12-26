// src/pages/Home.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ethers } from 'ethers';
import FundMeMultiABI from './FundMeMultiABI.json';

const CONTRACT_ADDRESS = "0x468c183692592816C601BDd6c4b7D970892FF422";

const Home = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [networkError, setNetworkError] = useState(false);
  const [totalEthRaised, setTotalEthRaised] = useState("0");

  const switchToSepolia = async () => {
    if (window.ethereum) {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0xaa36a7' }],
        });
      } catch (switchError) {
        if (switchError.code === 4902) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: '0xaa36a7',
                  chainName: 'Sepolia Test Network',
                  rpcUrls: ['https://rpc.sepolia.org'],
                  nativeCurrency: { name: 'Sepolia ETH', symbol: 'ETH', decimals: 18 },
                  blockExplorerUrls: ['https://sepolia.etherscan.io'],
                },
              ],
            });
          } catch (addError) {
            console.error("Could not add network");
          }
        }
      }
    }
  };

  const fetchCampaigns = async () => {
    try {
      if (!window.ethereum) {
        setLoading(false);
        return;
      }
      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();

      if (network.chainId.toString() !== "11155111") {
        setNetworkError(true);
        setLoading(false);
        return;
      }

      setNetworkError(false);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, FundMeMultiABI, provider);
      const count = await contract.getCampaignCount();
      const countNumber = Number(count);

      if (countNumber === 0) {
        setCampaigns([]);
        setLoading(false);
        return;
      }

      let runningTotal = 0n;
      const campaignsArray = [];

      for (let i = 1; i <= countNumber; i++) {
        try {
          const camp = await contract.getCampaign(i);
          const [creator, title, description, image, goal, pledged, deadline, completed] = camp;
          runningTotal += pledged;

          if (!completed) {
            campaignsArray.push({
              id: i,
              title,
              description,
              image: image || "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=800",
              goal: ethers.formatEther(goal),
              pledged: ethers.formatEther(pledged),
              deadline: Number(deadline),
              progress: Number(goal) > 0 ? (Number(pledged) * 100 / Number(goal)) : 0,
            });
          }
        } catch (err) { console.error(err); }
      }
      setTotalEthRaised(ethers.formatEther(runningTotal));
      setCampaigns(campaignsArray.reverse());
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  useEffect(() => {
    if (!window.ethereum) return;
    const provider = new ethers.BrowserProvider(window.ethereum);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, FundMeMultiABI, provider);

    const onFunded = () => fetchCampaigns();
    window.ethereum.on('chainChanged', () => window.location.reload());

    contract.on("MultiFunded", onFunded);
    return () => { 
        contract.off("MultiFunded", onFunded); 
    };
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    fetchCampaigns();
  }, []);

  const formatTimeLeft = (deadline) => {
    const now = Math.floor(Date.now() / 1000);
    const timeLeft = deadline - now;
    if (timeLeft <= 0) return 'Expired';
    const days = Math.floor(timeLeft / 86400);
    return days > 0 ? `${days}d left` : 'Ends Today';
  };

  return (
    <div className="bg-[#020408] min-h-screen text-white font-sans selection:bg-cyan-500/30">
      
      {/* 1. HERO SECTION */}
      <section className="relative pt-24 pb-20 md:pt-40 md:pb-32 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[800px] opacity-40">
            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/20 via-transparent to-purple-500/20 blur-[140px]"></div>
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md mb-8">
            <span className="flex h-2 w-2 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_10px_#06b6d4]"></span>
            <span className="text-white/60 text-[10px] font-black uppercase tracking-widest">Protocol v1.0 Alpha Live</span>
          </div>
          
          <h1 className="text-6xl md:text-[110px] font-black leading-none tracking-tighter mb-8 drop-shadow-2xl text-white">
            SHADOW FundMe<span className="text-cyan-500">.</span>
          </h1>
          
          <p className="text-slate-400 text-lg md:text-2xl max-w-2xl mx-auto mb-14 leading-relaxed font-medium">
            The next generation of decentralized crowdfunding. Secure, transparent, and built entirely on-chain.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center items-center gap-6">
            <Link to="/create" className="w-full sm:w-auto px-12 py-6 bg-cyan-500 text-black font-black rounded-3xl hover:bg-white transition-all duration-300 shadow-xl shadow-cyan-500/20 active:scale-95 uppercase tracking-widest text-sm">
              Launch Project
            </Link>
            <button onClick={() => document.getElementById('marketplace').scrollIntoView({ behavior: 'smooth' })} className="w-full sm:w-auto px-12 py-6 bg-transparent text-white font-black rounded-3xl border-2 border-white/10 hover:bg-white/5 transition-all uppercase tracking-widest text-sm">
              Explore Projects
            </button>
          </div>
        </div>
      </section>

      {/* 2. STATS SECTION */}
      <section className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2 bg-white/[0.02] p-12 rounded-[3rem] border border-white/5 flex flex-col justify-between hover:bg-white/[0.04] transition-all group">
             <p className="text-slate-500 font-black uppercase tracking-widest text-xs mb-8">Total Volume Raised</p>
             <div>
                <h3 className="text-5xl md:text-7xl font-black tracking-tighter mb-2 group-hover:text-cyan-400 transition-colors text-white">{parseFloat(totalEthRaised).toFixed(3)} ETH</h3>
                <p className="text-slate-600 font-bold uppercase text-[10px] tracking-[0.3em]">Aggregate Value Transferred</p>
             </div>
          </div>
          <div className="bg-white/[0.02] p-10 rounded-[3rem] border border-white/5 text-center flex flex-col items-center justify-center">
             <p className="text-4xl font-black mb-1 text-purple-500">{campaigns.length}</p>
             <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest">Active Shadows</p>
          </div>
          <div className="bg-cyan-500 p-10 rounded-[3rem] text-center flex flex-col items-center justify-center text-black shadow-2xl shadow-cyan-500/20">
             <p className="text-4xl font-black mb-1">0%</p>
             <p className="font-black uppercase tracking-widest text-[9px]">Protocol Fees</p>
          </div>
        </div>
      </section>

      {/* 4. MARKETPLACE */}
      <section id="marketplace" className="max-w-7xl mx-auto px-6 py-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-16 gap-8">
          <div>
            <h2 className="text-4xl md:text-5xl font-black mb-4 tracking-tighter uppercase text-white">Live Marketplace</h2>
            <div className="h-1 w-20 bg-cyan-500 rounded-full"></div>
          </div>
          
          {networkError && (
             <button 
                onClick={switchToSepolia}
                className="px-6 py-3 bg-red-500/10 border border-red-500/50 rounded-2xl hover:bg-red-500/20 transition-all group"
             >
                <p className="text-red-500 font-black text-[10px] uppercase tracking-widest animate-pulse group-hover:animate-none">
                  Network Error: Click to use Sepolia
                </p>
             </button>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[1, 2, 3].map(i => <div key={i} className="h-[500px] bg-white/5 rounded-[4rem] animate-pulse"></div>)}
          </div>
        ) : campaigns.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {campaigns.map((camp) => (
              <div key={camp.id} className="group flex flex-col h-full bg-[#0a0c12] border border-white/10 rounded-[3rem] overflow-hidden hover:border-cyan-500/50 transition-all duration-500">
                <div className="relative h-64 overflow-hidden">
                  <img src={camp.image} alt={camp.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0c12] to-transparent opacity-80"></div>
                  <div className="absolute top-6 right-6">
                    <span className="px-4 py-2 bg-black/60 backdrop-blur-md border border-white/10 text-cyan-400 text-[10px] font-black uppercase tracking-widest rounded-2xl">
                      {formatTimeLeft(camp.deadline)}
                    </span>
                  </div>
                </div>

                <div className="p-10 pt-4 flex flex-col flex-grow">
                  <h3 className="text-2xl font-black mb-4 line-clamp-1 group-hover:text-cyan-400 transition-colors tracking-tight uppercase text-white">{camp.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed mb-8 line-clamp-2">{camp.description}</p>

                  <div className="mt-auto space-y-6">
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-slate-600 text-[9px] font-black uppercase tracking-widest mb-1">Raised</p>
                        <p className="text-white font-black text-2xl tracking-tighter">{camp.pledged} <span className="text-xs text-cyan-500">ETH</span></p>
                      </div>
                      <div className="text-right">
                        <p className="text-slate-600 text-[9px] font-black uppercase tracking-widest mb-1">Target</p>
                        <p className="text-slate-400 font-bold">{camp.goal} ETH</p>
                      </div>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-cyan-500 to-purple-600 transition-all duration-1000" style={{ width: `${Math.min(camp.progress, 100)}%` }}></div>
                    </div>
                    <Link to={`/campaign/${camp.id}`} className="block w-full py-5 bg-white text-black hover:bg-cyan-500 rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] transition-all text-center">
                      View Campaign
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white/[0.02] border border-dashed border-white/10 rounded-[4rem] py-32 text-center flex flex-col items-center justify-center">
             <p className="text-slate-500 italic uppercase tracking-widest text-xs mb-6">The shadow protocol is silent. Start a project to begin.</p>
             <Link to="/create" className="text-cyan-500 font-black text-[10px] uppercase tracking-[0.2em] border border-cyan-500/30 px-6 py-3 rounded-full hover:bg-cyan-500 hover:text-black transition-all">
                Initiate First Campaign
             </Link>
          </div>
        )}
      </section>

      {/* 5. FOOTER */}
      <footer className="bg-black border-t border-white/5 py-24 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12 text-center md:text-left">
            <div>
              <h2 className="text-3xl font-black tracking-tighter uppercase text-white mb-2">SHADOW FundMe <span className="text-cyan-500">.</span></h2>
              <p className="text-slate-700 text-[10px] font-bold uppercase tracking-widest">© 2025 Shadow Protocol • Built on Sepolia</p>
            </div>

            {/* X Handle Section */}
            <div className="flex flex-col items-center md:items-end gap-3">
              <p className="text-slate-600 text-[9px] font-black uppercase tracking-[0.3em]">Command Center</p>
              <a 
                href="https://x.com/Sha_dow002" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-6 py-3 bg-white/[0.03] border border-white/10 rounded-2xl hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all group"
              >
                <span className="text-white group-hover:text-cyan-400 font-mono text-sm tracking-tight transition-colors"></span>
                <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-cyan-500/20 transition-all">
                  <svg className="w-4 h-4 text-white group-hover:text-cyan-400 fill-current" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </div>
              </a>
            </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;