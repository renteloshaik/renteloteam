// Dashboard.jsx
import React, { useEffect, useState, useMemo, Suspense } from "react";
import { supabase } from "./supabaseClient";

const TodaysDropsReport = React.lazy(() => import("./components/TodayDropsReport"));

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [vehicles, setVehicles] = useState([]);
  const [payPendings, setPayPendings] = useState([]);
  const [followUps, setFollowUps] = useState([]);

  // Fetch all data in parallel
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [vRes, pRes, fRes] = await Promise.all([
          supabase.from("zoomcar_vehicles").select("*"),
          supabase.from("pay_pending").select("*"),
          supabase.from("follow_up_history").select("*"),
        ]);

        setVehicles(vRes.data || []);

        setPayPendings(
          (pRes.data || []).map(p => ({
            ...p,
            pending_current: Number(p.pending_current || 0),
            pending_previous: Number(p.pending_previous || 0),
            extra_charges: Number(p.extra_charges || 0),
            total_amount: Number(p.total_amount || 0),
          }))
        );

        setFollowUps(fRes.data || []);
      } catch (err) {
        console.error(err);
        setError(err.message || String(err));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Memoized calculations
  const totals = useMemo(() => {
    const pausedVehicles = vehicles.filter(v =>
      ["paused", "block", "blocked"].includes((v.block_status || "").toLowerCase())
    ).length;

    const pendingRecords = payPendings.filter(p => (p.status || "").toLowerCase() !== "paid");

    const totalPendingAmount = pendingRecords.reduce(
      (acc, p) => acc + p.pending_current + p.pending_previous + p.extra_charges,
      0
    );

    const totalAmount = payPendings.reduce((acc, p) => acc + p.total_amount, 0);
    const pendingCount = pendingRecords.length;
    const paidCount = payPendings.length - pendingCount;

    const vehiclesByLocation = {};
    vehicles.forEach(v => {
      const loc = v.vehicle_location || "Unknown";
      vehiclesByLocation[loc] = (vehiclesByLocation[loc] || 0) + 1;
    });

    return {
      totalVehicles: vehicles.length,
      pausedVehicles,
      totalPendingAmount,
      totalAmount,
      pendingCount,
      paidCount,
      totalPayPendingRecords: payPendings.length,
      totalFollowUps: followUps.length,
      vehiclesByLocation,
    };
  }, [vehicles, payPendings, followUps]);

  const completionPercent =
    totals.totalPayPendingRecords > 0
      ? Math.round((totals.paidCount / totals.totalPayPendingRecords) * 100)
      : 0;

  // Skeleton loader component
  const LoaderCard = () => (
    <div className="bg-white p-5 rounded-xl shadow animate-pulse" aria-busy="true">
      <span className="sr-only">Loading card content...</span>
      <div className="h-4 bg-gray-300 rounded w-1/2 mb-2"></div>
      <div className="h-8 bg-gray-400 rounded mb-1"></div>
      <div className="h-3 bg-gray-300 rounded w-3/4"></div>
    </div>
  );

  if (loading)
    return (
      <main className="min-h-screen p-6" aria-live="polite">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {Array(4)
            .fill(0)
            .map((_, idx) => (
              <LoaderCard key={idx} />
            ))}
        </div>
        <div className="text-center text-gray-700" role="status">
          Loading dashboard data...
        </div>
      </main>
    );

  if (error)
    return (
      <main
        className="min-h-screen flex items-start justify-center mt-12 text-red-700"
        role="alert"
      >
        {error}
      </main>
    );

  return (
    <main className="min-h-screen bg-gray-100 mt-12 p-6">
      <div className="max-w-[1400px] mx-auto">
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

        <section
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          aria-label="Dashboard summary cards"
        >
          <article className="bg-white p-5 rounded-xl shadow">
            <p className="text-sm text-gray-700 font-medium">Total Vehicles</p>
            <p className="text-2xl font-bold text-gray-900">{totals.totalVehicles}</p>
            <p className="text-xs mt-2 text-gray-600">Paused: {totals.pausedVehicles}</p>
          </article>
          <article className="bg-white p-5 rounded-xl shadow">
            <p className="text-sm text-gray-700 font-medium">Pay Pending Records</p>
            <p className="text-2xl font-bold text-gray-900">{totals.totalPayPendingRecords}</p>
            <p className="text-xs mt-2 text-gray-600">Follow-ups: {totals.totalFollowUps}</p>
          </article>
          <article className="bg-white p-5 rounded-xl shadow">
            <p className="text-sm text-gray-700 font-medium">Total Pending Amount</p>
            <p className="text-2xl font-bold text-red-700">
              ₹ {totals.totalPendingAmount.toLocaleString()}
            </p>
          </article>
          <article className="bg-white p-5 rounded-xl shadow">
            <p className="text-sm text-gray-700 font-medium">Payments Completion</p>
            <p className="text-2xl font-bold text-green-700">{completionPercent}%</p>
            <p className="text-xs mt-2 text-gray-600">
              Paid: {totals.paidCount} • Pending: {totals.pendingCount}
            </p>
          </article>
        </section>

        {/* Lazy-loaded component */}
        <Suspense
          fallback={
            <div
              className="text-center py-10 text-gray-700"
              role="status"
              aria-live="polite"
            >
              Loading today's drops report...
            </div>
          }
        >
          <TodaysDropsReport />
        </Suspense>
      </div>
    </main>
  );
}
