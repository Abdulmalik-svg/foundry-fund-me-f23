import React, { useState } from 'react';
import { ethers } from 'ethers';
import { useNavigate } from 'react-router-dom';
import FundMeMultiABI from '../constants/FundMeMultiAbi.json';

const CONTRACT_ADDRESS = "0x468c183692592816C601BDd6c4b7D970892FF422";
const SEPOLIA_PRICEFEED = "0x694AA1769357215DE4FAC081bf1f309aDC325306";

const CreateCampaign = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(''); // 'confirming', 'mining', 'success', 'error'
  const [errorMessage, setErrorMessage] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    goal: '',
    image: '',
    durationInDays: '30'
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!window.ethereum) return setStatus('error') || setErrorMessage('Please install MetaMask!');

    try {
      setLoading(true);
      setStatus('confirming');

      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []); 
      const signer = await provider.getSigner();

      const actualABI = FundMeMultiABI.abi ? FundMeMultiABI.abi : FundMeMultiABI;
      const contract = new ethers.Contract(CONTRACT_ADDRESS, actualABI, signer);

      const goalInWei = ethers.parseEther(formData.goal);
      const duration = BigInt(formData.durationInDays);
      const imageUrl = formData.image || "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=800";

      const tx = await contract.createCampaign(
        formData.title,
        formData.description,
        goalInWei,
        imageUrl,
        duration,
        SEPOLIA_PRICEFEED
      );

      setStatus('mining');
      await tx.wait();
      
      setStatus('success');
      setTimeout(() => navigate('/'), 2000);
      
    } catch (error) {
      console.error(error);
      setStatus('error');
      setErrorMessage(error.reason || error.message || 'Transaction failed');
    }
  };

  return (
    <div className="bg-[#020408] min-h-screen text-white font-sans selection:bg-cyan-500/30 overflow-x-hidden">
      
      {/* Background Glows */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full h-[800px] opacity-30 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/20 via-transparent to-purple-500/20 blur-[140px]"></div>
      </div>

      {/* STATUS MODAL */}
      {status && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm"></div>
          <div className="relative bg-[#0a0c12] border border-white/10 p-10 rounded-[3rem] max-w-sm w-full text-center shadow-2xl shadow-cyan-500/10">
            
            {status === 'confirming' && (
              <div className="space-y-6">
                <div className="w-16 h-16 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin mx-auto"></div>
                <h3 className="text-xl font-black uppercase tracking-tighter">Waiting for Wallet</h3>
                <p className="text-slate-500 text-sm">Please confirm the transaction in your MetaMask extension.</p>
              </div>
            )}

            {status === 'mining' && (
              <div className="space-y-6">
                <div className="w-16 h-16 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mx-auto"></div>
                <h3 className="text-xl font-black uppercase tracking-tighter">Mining Shadow</h3>
                <p className="text-slate-500 text-sm">Deploying your contract to the Sepolia ledger. Please wait.</p>
              </div>
            )}

            {status === 'success' && (
              <div className="space-y-6">
                <div className="w-16 h-16 bg-cyan-500 rounded-full flex items-center justify-center mx-auto shadow-[0_0_20px_#06b6d4]">
                  <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7"></path></svg>
                </div>
                <h3 className="text-xl font-black uppercase tracking-tighter text-cyan-400">Deployed</h3>
                <p className="text-slate-500 text-sm">Your campaign is now live on the protocol.</p>
              </div>
            )}

            {status === 'error' && (
              <div className="space-y-6">
                <div className="w-16 h-16 bg-red-500/20 border-2 border-red-500 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-red-500 text-2xl font-black">!</span>
                </div>
                <h3 className="text-xl font-black uppercase tracking-tighter text-red-500">Failed</h3>
                <p className="text-slate-500 text-[10px] break-words uppercase font-bold">{errorMessage}</p>
                <button onClick={() => setStatus('')} className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">Dismiss</button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="relative z-10 max-w-4xl mx-auto px-6 pt-24 pb-32">
        <div className="mb-16 text-center md:text-left">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md mb-8">
            <span className="flex h-2 w-2 rounded-full bg-cyan-500 animate-pulse"></span>
            <span className="text-white/60 text-[10px] font-black uppercase tracking-widest">Protocol v1.0 Alpha</span>
          </div>
          <h1 className="text-5xl md:text-8xl font-black leading-none tracking-tighter mb-6 uppercase">Launch<span className="text-cyan-500">.</span></h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-white/[0.02] border border-white/5 rounded-[3.5rem] p-8 md:p-12">
            <div className="grid grid-cols-1 gap-10">
              <div>
                <label className="text-slate-500 font-black uppercase tracking-widest text-[10px] mb-4 block">Project Title</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="w-full bg-transparent border-b-2 border-white/10 py-4 text-3xl font-black focus:outline-none focus:border-cyan-500 transition-colors uppercase tracking-tight placeholder:text-white/5"
                  placeholder="Enter Name"
                />
              </div>

              <div>
                <label className="text-slate-500 font-black uppercase tracking-widest text-[10px] mb-4 block">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows="4"
                  className="w-full bg-white/[0.03] border border-white/10 rounded-[2rem] p-6 text-slate-300 focus:outline-none focus:border-cyan-500/50 transition-all resize-none font-medium"
                  placeholder="Manifesto..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="bg-black/20 rounded-[2.5rem] p-8 border border-white/5">
                  <label className="text-slate-500 font-black uppercase tracking-widest text-[10px] mb-2 block">Goal (ETH)</label>
                  <div className="flex items-end gap-2">
                    <input type="number" name="goal" value={formData.goal} onChange={handleChange} required step="0.0001" className="bg-transparent text-5xl font-black text-white w-full focus:outline-none tracking-tighter" placeholder="0.0" />
                    <span className="text-cyan-500 font-black mb-2">ETH</span>
                  </div>
                </div>

                <div className="bg-black/20 rounded-[2.5rem] p-8 border border-white/5">
                  <label className="text-slate-500 font-black uppercase tracking-widest text-[10px] mb-2 block">Duration</label>
                  <div className="flex items-end gap-2">
                    <input type="number" name="durationInDays" value={formData.durationInDays} onChange={handleChange} required className="bg-transparent text-5xl font-black text-white w-full focus:outline-none tracking-tighter" />
                    <span className="text-purple-500 font-black mb-2 uppercase text-xs tracking-widest">Days</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-slate-500 font-black uppercase tracking-widest text-[10px] mb-4 block">Banner URL</label>
                <input type="url" name="image" value={formData.image} onChange={handleChange} className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 px-6 text-cyan-400 font-mono text-sm focus:outline-none focus:border-cyan-500 transition-all" placeholder="https://..." />
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-6">
            <button
              type="submit"
              disabled={loading}
              className="w-full md:w-2/3 py-8 bg-cyan-500 text-black font-black rounded-[2.5rem] hover:bg-white transition-all duration-300 shadow-xl shadow-cyan-500/20 active:scale-[0.98] uppercase tracking-[0.2em] text-sm"
            >
              {loading ? "Processing..." : "Launch Project"}
            </button>
            <button type="button" onClick={() => navigate(-1)} className="w-full md:w-1/3 py-8 bg-transparent text-white font-black rounded-[2.5rem] border-2 border-white/10 hover:bg-white/5 transition-all uppercase tracking-[0.2em] text-[10px]">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCampaign;