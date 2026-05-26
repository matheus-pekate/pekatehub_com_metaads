import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.jsx'
import { PekateDash } from './pages/PekateDash.jsx'
import { PktHub } from './pages/PktHub.jsx'
import { SellerAnalysis } from './pages/SellerAnalysis.jsx'
import { SellerRanking } from './pages/SellerRanking.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/pkt-hub" element={<PktHub />} />
        <Route path="/pekate-dash" element={<PekateDash />} />
        <Route path="/seller-analysis" element={<SellerAnalysis />} />
        <Route path="/seller-ranking" element={<SellerRanking />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)
