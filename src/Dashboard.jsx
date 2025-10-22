import React, { useEffect, useState, useMemo } from "react";
import { supabase } from "./supabaseClient";
import TodaysDropsReport from "./components/TodayDropsReport";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [vehicles, setVehicles] = useState([]);
  const [payPendings, setPayPendings] = useState([]);
  const [followUps, setFollowUps] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: vData } = await supabase.from("zoomcar_vehicles").select("*");
        setVehicles(vData || []);

        const { data: pData } = await supabase.from("pay_pending").select("*");
        setPayPendings(pData || []);

        const { data: fData } = await supabase.from("follow_up_history").select("*");
        setFollowUps(fData || []);
      } catch(err) {
        console.error(err);
        setError(err.message || String(err));
      } finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const totals = useMemo(() => {
  const pausedVehicles = vehicles.filter(v => ["paused","block","blocked"].includes((v.block_status||"").toLowerCase())).length;

  const pendingRecords = payPendings.filter(p => (p.status||"").toLowerCase() !== "paid");

  const totalPendingAmount = pendingRecords.reduce(
    (acc,p) => acc + Number(p.pending_current||0) + Number(p.pending_previous||0) + Number(p.extra_charges||0),
    0
  );

  const totalAmount = payPendings.reduce((acc,p) => acc + Number(p.total_amount||0), 0);

  const pendingCount = pendingRecords.length;
  const paidCount = payPendings.length - pendingCount;

  const vehiclesByLocation = {};
  vehicles.forEach(v => {
    const loc = v.vehicle_location || "Unknown";
    vehiclesByLocation[loc] = (vehiclesByLocation[loc]||0)+1;
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
    vehiclesByLocation 
  };
}, [vehicles, payPendings, followUps]);

  const completionPercent = totals.totalPayPendingRecords > 0 ? Math.round((totals.paidCount / totals.totalPayPendingRecords) * 100) : 0;

  if(loading) return <div className="min-h-screen flex items-center justify-center mt-12">Loading...</div>;
  if(error) return <div className="min-h-screen flex items-start justify-center mt-12 text-red-600">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-100 mt-12 p-6">
      <div className="max-w-[1400px] mx-auto">
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-5 rounded-xl shadow">
            <p className="text-sm text-gray-500">Total Vehicles</p>
            <p className="text-2xl font-bold">{totals.totalVehicles}</p>
            <p className="text-xs mt-2 text-gray-500">Paused: {totals.pausedVehicles}</p>
          </div>
          <div className="bg-white p-5 rounded-xl shadow">
            <p className="text-sm text-gray-500">Pay Pending Records</p>
            <p className="text-2xl font-bold">{totals.totalPayPendingRecords}</p>
            <p className="text-xs mt-2 text-gray-500">Follow-ups: {totals.totalFollowUps}</p>
          </div>
          <div className="bg-white p-5 rounded-xl shadow">
            <p className="text-sm text-gray-500">Total Pending Amount</p>
            <p className="text-2xl font-bold text-red-600">₹ {totals.totalPendingAmount.toLocaleString()}</p>
          </div>
          <div className="bg-white p-5 rounded-xl shadow">
            <p className="text-sm text-gray-500">Payments Completion</p>
            <p className="text-2xl font-bold text-green-600">{completionPercent}%</p>
            <p className="text-xs mt-2 text-gray-500">Paid: {totals.paidCount} • Pending: {totals.pendingCount}</p>
          </div>
        </div>
        <TodaysDropsReport />
      </div>
    </div>
  );
}
