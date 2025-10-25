import React, { Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";

const Dashboard = React.lazy(() => import("./Dashboard"));
const TodayDrops = React.lazy(() => import("./components/TodayDrops"));
const ZoomcarTracker = React.lazy(() => import("./components/ZoomcarTracker"));
const ZoomcarVehicles = React.lazy(() => import("./components/ZoomcarVehicles"));
const PayPendingPage = React.lazy(() => import("./components/PayPendingPage"));
const PendingDrops = React.lazy(() => import("./components/PendingDrops"));

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-r from-indigo-50 via-white to-blue-50">
      <Header />
      <main className="flex-grow w-full mx-auto">
        <Suspense fallback={<div className="text-center mt-20">Loading...</div>}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/today-drops" element={<TodayDrops />} />
            <Route path="/zoomcarbookings" element={<ZoomcarTracker />} />
            <Route path="/zoomcarvehicles" element={<ZoomcarVehicles />} />
            <Route path="/paypending" element={<PayPendingPage />} />
            <Route path="/pendingdrops" element={<PendingDrops />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
