import React from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Receptionist from "./pages/Receptionist";
import WaitingRoom from "./pages/WaitingRoom";

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/receptionist" element={<Receptionist />} />
        <Route path="/waiting" element={<WaitingRoom />} />
      </Routes>
    </BrowserRouter>
  );
}

function Home() {
  return (
    <div className="home">
      <div className="home-card">
        {/* <div className="home-logo">⚕️</div> */}
        <h1 className="home-title">QueueCure <span>'26</span></h1>
        <p className="home-sub">Live digital queue for neighbourhood clinics</p>
        <div className="home-links">
          <Link to="/receptionist" className="btn btn-primary">Receptionist Panel</Link>
          <Link to="/waiting" className="btn btn-outline">Patient Waiting Room</Link>
        </div>
      </div>
    </div>
  );
}