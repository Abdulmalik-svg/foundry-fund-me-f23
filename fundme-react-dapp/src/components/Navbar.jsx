// src/components/Navbar.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  const [account, setAccount] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const checkIfWalletIsConnected = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setAccount(accounts[0]);
          }
        } catch (error) {
          console.error("Error checking connection", error);
        }
      }
    };
    checkIfWalletIsConnected();

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        setAccount(accounts[0] || "");
      });
    }
  }, []);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ 
          method: 'eth_requestAccounts' 
        });
        setAccount(accounts[0]);
      } catch (error) {
        console.error("User denied account access", error);
      }
    } else {
      alert("Please install MetaMask!");
    }
  };

  // The "Disconnect" logic - clears local state
  const disconnectWallet = () => {
    setAccount("");
    setShowDropdown(false);
  };

  const formatAddress = (addr) => `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;

  return (
    <nav className="fixed top-0 w-full z-50 bg-[#020408]/80 backdrop-blur-xl border-b border-white/5 font-sans">
      <div className="max-w-[1400px] mx-auto px-8 h-24 flex justify-between items-center">
        
        {/* Logo */}
        <Link to="/" className="group flex items-center gap-3">
          <div className="w-10 h-10 bg-white flex items-center justify-center rounded-lg group-hover:bg-cyan-500 transition-colors duration-300">
            <span className="text-black text-xl font-black italic">S</span>
          </div>
          <span className="text-2xl font-black uppercase tracking-tighter text-white">
            Shadow FundMe <span className="text-cyan-500">.</span>
          </span>
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center gap-12">
          <Link to="/create" className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-white transition-colors">
            Launch
          </Link>

          {/* Wallet Section */}
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={account ? () => setShowDropdown(!showDropdown) : connectWallet}
              className={`px-8 py-3 rounded-full font-black text-[10px] uppercase tracking-widest transition-all duration-300 border-2 flex items-center gap-3 ${
                account 
                  ? "bg-transparent border-cyan-500/50 text-cyan-500 hover:border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.1)]" 
                  : "bg-white border-white text-black hover:bg-cyan-500 hover:border-cyan-500 shadow-xl"
              }`}
            >
              {account ? (
                <>
                  <span className="flex h-1.5 w-1.5 rounded-full bg-cyan-500 animate-pulse"></span>
                  {formatAddress(account)}
                  <svg className={`w-3 h-3 transition-transform ${showDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"></path></svg>
                </>
              ) : (
                "Connect Wallet"
              )}
            </button>

            {/* Disconnect Dropdown */}
            {showDropdown && account && (
              <div className="absolute right-0 mt-4 w-48 bg-[#0a0c12] border border-white/10 rounded-2xl overflow-hidden shadow-2xl animate-in fade-in slide-in-from-top-2">
                <button 
                  onClick={disconnectWallet}
                  className="w-full px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-500/10 transition-colors flex items-center justify-between"
                >
                  Disconnect
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;