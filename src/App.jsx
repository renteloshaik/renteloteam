import React from "react";
import { Routes, Route } from "react-router-dom";

import Header from "./components/Header";
import Footer from "./components/Footer";
import ZoomcarVehicles from "./components/ZoomcarVehicles";
import ZoomcarTracker from "./components/ZoomcarTracker";
import TodayDrops from "./components/TodayDrops";
import PayPendingPage from "./components/PayPendingPage";
import PendingDrops from "./components/PendingDrops";
import Dashboard from "./Dashboard";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-r from-indigo-50 via-white to-blue-50">
      <Header />

      <main className="flex-grow w-full mx-auto">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/today-drops" element={<TodayDrops />} />
          <Route path="/zoomcarbookings" element={<ZoomcarTracker />} />
          <Route path="/zoomcarvehicles" element={<ZoomcarVehicles />} />
          <Route path="/paypending" element={<PayPendingPage />} />
          <Route path="/pendingdrops" element={<PendingDrops />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}
