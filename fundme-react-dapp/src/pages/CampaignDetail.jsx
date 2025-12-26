import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import FundMeMultiABI from './FundMeMultiABI.json';

const CONTRACT_ADDRESS = "0x468c183692592816C601BDd6c4b7D970892FF422";

const CampaignDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fundAmount, setFundAmount] = useState('');
  const [funding, setFunding] = useState(false);
  const [account, setAccount] = useState('');
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState({ title: '', body: '', type: 'success' });

  const triggerModal = (title, body, type = 'success') => {
    setModalMessage({ title, body, type });
    setShowModal(true);
  };

  const fetchCampaign = async () => {
    try {
      if (!window.ethereum) {
        setLoading(false);
        return;
      }
      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      if (network.chainId.toString() !== "11155111") {
        setLoading(false);
        return;
      }
      const signer = await provider.getSigner();
      const userAccount = await signer.getAddress();
      setAccount(userAccount);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, FundMeMultiABI, provider);
      const camp = await contract.getCampaign(id);
      const [creator, title, description, image, goal, pledged, deadline, completed] = camp;

      setCampaign({
        id: Number(id),
        creator,
        title,
        description,
        image: image || "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=800",
        goal: ethers.formatEther(goal),
        pledged: ethers.formatEther(pledged),
        deadline: Number(deadline),
        completed,
        progress: Number(goal) > 0 ? (Number(pledged) * 100 / Number(goal)) : 0,
        isCreator: userAccount.toLowerCase() === creator.toLowerCase()
      });
    } catch (error) {
      console.error('Error fetching campaign:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaign();
    window.scrollTo(0, 0);
  }, [id]);

  const handleFund = async () => {
    if (!fundAmount || Number(fundAmount) <= 0) return;
    try {
      setFunding(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, FundMeMultiABI, signer);

      const tx = await contract.fundCampaign(id, { value: ethers.parseEther(fundAmount) });
      await tx.wait();
      
      setFundAmount('');
      fetchCampaign();
      triggerModal('TRANSMISSION SUCCESSFUL', 'Your contribution has been verified on the Shadow Protocol.', 'success');
    } catch (error) {
      console.error('Funding error:', error);
      triggerModal('TRANSMISSION FAILED', 'The transaction was rejected or failed. Ensure you are using Sepolia ETH.', 'error');
    } finally {
      setFunding(false);
    }
  };

  const handleWithdraw = async () => {
    try {
      setFunding(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, FundMeMultiABI, signer);

      const tx = await contract.withdraw(id);
      await tx.wait();
      fetchCampaign();
      triggerModal('CAPITAL WITHDRAWN', 'The campaign funds have been successfully routed to your wallet.', 'success');
    } catch (error) {
      console.error('Withdrawal error:', error);
      triggerModal('ACCESS DENIED', 'Only the campaign creator can withdraw capital.', 'error');
    } finally {
      setFunding(false);
    }
  };

  const formatTimeLeft = (deadline) => {
    const now = Math.floor(Date.now() / 1000);
    const timeLeft = deadline - now;
    if (timeLeft <= 0) return 'Expired';
    const days = Math.floor(timeLeft / 86400);
    return days > 0 ? `${days}D Remaining` : 'Ends Today';
  };

  if (loading) return (
    <div className="bg-[#020408] min-h-screen flex items-center justify-center">
      <div className="h-12 w-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!campaign) return (
    <div className="bg-[#020408] min-h-screen flex flex-col items-center justify-center text-white">
      <h1 className="text-2xl font-black uppercase tracking-widest mb-6">Shadow Not Found</h1>
      <button onClick={() => navigate('/')} className="text-cyan-500 font-bold uppercase tracking-widest text-[10px] border border-cyan-500/30 px-10 py-4 rounded-full hover:bg-cyan-500 hover:text-black transition-all">
        Return to Nexus
      </button>
    </div>
  );

  return (
    <div className="bg-[#020408] min-h-screen text-white font-sans selection:bg-cyan-500/30 pb-20">
      
      {/* SHADOW MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setShowModal(false)}></div>
          <div className="relative bg-[#0a0c12] border border-white/10 p-8 md:p-12 rounded-[2.5rem] max-w-md w-full shadow-2xl">
            <div className={`h-1 w-20 rounded-full mb-8 ${modalMessage.type === 'error' ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.5)]'}`}></div>
            <h2 className="text-2xl font-black tracking-tighter uppercase mb-4 text-white">
              {modalMessage.title}
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-10 font-medium">
              {modalMessage.body}
            </p>
            <button 
              onClick={() => setShowModal(false)}
              className={`w-full py-4 font-black rounded-2xl uppercase tracking-[0.2em] text-[10px] transition-all ${modalMessage.type === 'error' ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-white text-black hover:bg-cyan-500'}`}
            >
              Acknowledge
            </button>
          </div>
        </div>
      )}

      {/* TOP GLOW ACCENT */}
      <div className="h-1 w-full bg-gradient-to-r from-cyan-500 via-purple-600 to-transparent"></div>
      
      <div className="max-w-7xl mx-auto px-6 pt-12">
        {/* NAV BUTTON */}
        <div className="mb-12">
          <button 
            onClick={() => navigate('/')} 
            className="group flex items-center gap-3 px-6 py-3 bg-white/[0.03] border border-white/10 rounded-full text-slate-400 hover:text-cyan-400 hover:border-cyan-500/50 transition-all uppercase font-black text-[9px] tracking-[0.3em]"
          >
            <span className="group-hover:-translate-x-1 transition-transform">←</span> Return to Marketplace
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
          
          {/* LEFT: CONTENT COLUMN */}
          <div className="lg:col-span-8 space-y-12">
            <div className="relative rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl">
              <img src={campaign.image} alt={campaign.title} className="w-full h-[550px] object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#020408] via-transparent to-transparent opacity-80"></div>
              <div className="absolute bottom-10 left-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500 text-black text-[9px] font-black uppercase tracking-widest mb-4">
                  ID: #{campaign.id}
                </div>
                <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-tight">
                  {campaign.title}
                </h1>
              </div>
            </div>

            <div className="bg-white/[0.01] border border-white/5 p-10 rounded-[3rem]">
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-6">Protocol Description</p>
              <p className="text-slate-300 text-xl leading-relaxed font-medium whitespace-pre-wrap">
                {campaign.description}
              </p>
            </div>
          </div>

          {/* RIGHT: FIXED SIDEBAR */}
          <div className="lg:col-span-4">
            <div className="bg-[#0a0c12] border border-white/10 p-10 rounded-[3.5rem] sticky top-12 shadow-2xl space-y-10">
              
              {/* PROTOCOL ADVISORY */}
              <div className="p-6 bg-amber-500/5 border border-amber-500/20 rounded-[2rem]">
                <p className="text-amber-500 text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
                  Protocol Advisory
                </p>
                <p className="text-slate-400 text-[11px] font-medium leading-relaxed">
                  This system is live on <span className="text-white">Sepolia Testnet</span>. Only use test tokens. Need funds? 
                  <a href="https://sepolia-faucet.pk910.de/" target="_blank" rel="noreferrer" className="text-cyan-500 underline ml-1 hover:text-white transition-colors">Request Test ETH</a>
                </p>
              </div>

              {/* FUNDING INFO */}
              <div>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-6">Aggregate Capital</p>
                <div className="flex justify-between items-end mb-4">
                  <div>
                    <h3 className="text-5xl font-black tracking-tighter text-white">{campaign.pledged}</h3>
                    <p className="text-cyan-500 text-xs font-black uppercase tracking-widest mt-1">ETH Raised</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold text-lg leading-none">{campaign.goal} ETH</p>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Target</p>
                  </div>
                </div>
                
                <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden mb-3">
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 transition-all duration-1000" 
                    style={{ width: `${Math.min(campaign.progress, 100)}%` }}
                  ></div>
                </div>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest text-right">
                  {campaign.progress.toFixed(2)}% Fulfilled
                </p>
              </div>

              {/* ACTION AREA */}
              {!campaign.completed ? (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-slate-500 text-[10px] font-black uppercase tracking-widest ml-2">Contribution Value</label>
                    <div className="relative group">
                      <input 
                        type="number" 
                        value={fundAmount} 
                        onChange={(e) => setFundAmount(e.target.value)}
                        placeholder="0.1"
                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-6 px-8 text-white font-black text-xl focus:outline-none focus:border-cyan-500 transition-all"
                      />
                      <span className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-500 font-black text-xs">ETH</span>
                    </div>
                  </div>

                  <button 
                    onClick={handleFund}
                    disabled={funding || !fundAmount}
                    className="w-full py-6 bg-cyan-500 hover:bg-white text-black font-black rounded-2xl uppercase tracking-[0.4em] text-[13px] transition-all active:scale-95 disabled:opacity-30"
                  >
                    {funding ? 'Transmitting...' : 'Fund'}
                  </button>
                </div>
              ) : (
                <div className="py-10 border-2 border-dashed border-white/10 rounded-3xl text-center">
                   <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Protocol Finalized</p>
                </div>
              )}

              {/* CREATOR SECTION */}
              {campaign.isCreator && !campaign.completed && (
                <div className="pt-10 border-t border-white/5">
                  <p className="text-purple-500 text-[10px] font-black uppercase tracking-widest mb-6 text-center">Creator Authority</p>
                  <button 
                    onClick={handleWithdraw}
                    disabled={funding}
                    className="w-full py-5 bg-transparent border-2 border-purple-500/50 text-purple-400 hover:bg-purple-500/10 font-black rounded-2xl uppercase tracking-[0.2em] text-[10px] transition-all"
                  >
                    Withdraw Capital
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignDetail;