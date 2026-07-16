import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { PekateDash } from './pages/PekateDash.jsx'
import { PekateB2BDash } from './pages/PekateB2BDash.jsx'
import { PktHub } from './pages/PktHub.jsx'
import { SellerAnalysis } from './pages/SellerAnalysis.jsx'
import { SellerRanking } from './pages/SellerRanking.jsx'
import { LauraChats } from './pages/LauraChats.jsx'
import { MetaAdsDash } from './pages/MetaAdsDash.jsx'
import { DocsWiki } from './pages/DocsWiki.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/pkt-hub" replace />} />
        <Route path="/pkt-hub" element={<PktHub />} />
        <Route path="/pekate-dash" element={<PekateDash />} />
        <Route path="/comando-b2b" element={<PekateB2BDash />} />
        <Route path="/seller-analysis" element={<SellerAnalysis />} />
        <Route path="/seller-ranking" element={<SellerRanking />} />
        <Route path="/laura-chats" element={<LauraChats />} />
        <Route path="/meta-ads" element={<MetaAdsDash />} />
        <Route path="/documentacao" element={<DocsWiki />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)
