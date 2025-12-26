// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Navbar from './components/Navbar'; // Restored Navbar import
import Home from './pages/Home';
import CreateCampaign from './pages/CreateCampaign';
import CampaignDetail from './pages/CampaignDetail';

function App() {
  return (
    <Router>
      {/* Background set to match your Shadow Protocol theme */}
      <div className="min-h-screen bg-[#020408] text-gray-100 font-sans antialiased">
        
        {/* Restored Navbar */}
        <Navbar />

        {/* Added padding-top (pt-20) so content isn't covered by the Navbar */}
        <main className="pt-20">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/create" element={<CreateCampaign />} />
            <Route path="/campaign/:id" element={<CampaignDetail />} />
            
            {/* Matches the '/my-campaigns' URL from your navigation logic */}
            
            {/* 404 Page - Updated UI to match Shadow Protocol style */}
            <Route
              path="*"
              element={
                <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
                  <h1 className="text-8xl md:text-[12rem] font-black text-white/5 mb-4 leading-none">404</h1>
                  <p className="text-xl md:text-2xl text-cyan-500 font-black uppercase tracking-[0.3em] mb-12">
                    Signal Lost
                  </p>
                  
                  <Link
                    to="/"
                    className="px-10 py-4 bg-white text-black font-black uppercase tracking-widest rounded-full hover:bg-cyan-500 transition-all duration-300"
                  >
                    Return to Terminal
                  </Link>
                </div>
              }
            />
          </Routes>
        </main>

      </div>
    </Router>
  );
}

export default App;