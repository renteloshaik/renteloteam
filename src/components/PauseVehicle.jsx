import React, { useState, useEffect } from "react";
import { FaCarSide, FaMapMarkerAlt, FaLock, FaCalendarAlt, FaSearch } from "react-icons/fa";
import { supabase } from "../supabaseClient";

export default function PauseVehicle({ darkMode }) {
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [pauseData, setPauseData] = useState({
    rentelo_id: "",
    pause_start_date: "",
    pause_start_time: "",
    pause_end_date: "",
    pause_end_time: "",
    pause_done_by: "",
  });
  const [showForm, setShowForm] = useState(false);
  const [pauseHistory, setPauseHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterModel, setFilterModel] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  useEffect(() => {
    fetchVehicles();
  }, []);
  const fetchVehicles = async () => {
    const { data } = await supabase
      .from("zoomcar_vehicles")
      .select("*")
      .order("id", { ascending: false });
    if (data) setVehicles(data);
  };
  const fetchHistory = async (vehicleId) => {
    const { data } = await supabase
      .from("pause_history")
      .select("*")
      .eq("vehicle_id", vehicleId)
      .order("id", { ascending: false });
    if (data) setPauseHistory(data);
  };
  const generateTimeOptions = () => {
    const times = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let min = 0; min < 60; min += 30) {
        const hour12 = hour % 12 || 12;
        const ampm = hour < 12 ? "AM" : "PM";
        times.push(`${hour12}:${min.toString().padStart(2, "0")} ${ampm}`);
      }
    }
    return times;
  };
  const combineDateTime = (dateStr, timeStr) => {
    if (!dateStr || !timeStr) return null;
    const [time, ampm] = timeStr.split(" ");
    let [hour, minute] = time.split(":").map(Number);
    if (ampm === "AM" && hour === 12) hour = 0;
    if (ampm === "PM" && hour !== 12) hour += 12;
    const [year, month, day] = dateStr.split("-").map(Number);
    const dt = new Date(year, month - 1, day, hour, minute);
    return dt.toISOString();
  };
  const addPause = async (e) => {
    e.preventDefault();
    if (!selectedVehicle) return;
    const start = combineDateTime(pauseData.pause_start_date, pauseData.pause_start_time);
    const end = combineDateTime(pauseData.pause_end_date, pauseData.pause_end_time);
    if (!start || !end) {
      alert("Please select both start and end date/time.");
      return;
    }
    if (new Date(end) <= new Date(start)) {
      alert("End date/time must be after start date/time.");
      return;
    }
    await supabase
      .from("zoomcar_vehicles")
      .update({
        rentelo_id: pauseData.rentelo_id || null,
        pause_start: start,
        pause_end: end,
        pause_done_by: pauseData.pause_done_by || null,
        block_status: "Block",
      })
      .eq("id", selectedVehicle.id);
    await supabase.from("pause_history").insert([
      {
        vehicle_id: selectedVehicle.id,
        rentelo_id: pauseData.rentelo_id || null,
        pause_start: start,
        pause_end: end,
        pause_done_by: pauseData.pause_done_by || null,
      },
    ]);
    setShowForm(false);
    setPauseData({
      rentelo_id: "",
      pause_start_date: "",
      pause_start_time: "",
      pause_end_date: "",
      pause_end_time: "",
      pause_done_by: "",
    });
    fetchVehicles();
  };
  const releasePause = async (id) => {
    await supabase
      .from("zoomcar_vehicles")
      .update({
        block_status: "Active",
        pause_start: null,
        pause_end: null,
        rentelo_id: null,
        pause_done_by: null,
      })
      .eq("id", id);
    fetchVehicles();
  };
  const getStatus = (v) => {
    const now = new Date();
    if (v.pause_start && v.pause_end) {
      const start = new Date(v.pause_start);
      const end = new Date(v.pause_end);
      if (now >= start && now <= end) return "Paused";
      if (now < start) return "Upcoming Pause";
    }
    return "Active";
  };
  const models = [...new Set(vehicles.map((v) => v.vehicle_model))];
  const locations = [...new Set(vehicles.map((v) => v.vehicle_location))];
  const filteredVehicles = vehicles.filter((v) => {
    const status = getStatus(v);
    const matchesSearch = v.vehicle_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesModel = filterModel ? v.vehicle_model === filterModel : true;
    const matchesLocation = filterLocation ? v.vehicle_location === filterLocation : true;
    const matchesStatus = filterStatus ? status === filterStatus : true;
    return matchesSearch && matchesModel && matchesLocation && matchesStatus;
  });
  const bgClass = darkMode ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-900";
  const inputClass = `bg-transparent px-2 py-2 rounded-md border ${darkMode ? "border-gray-600 text-white" : "border-gray-300 text-gray-900"}`;
  const inputClasses = `bg-transparent px-2 py-1 ${darkMode ? "text-white" : "text-gray-900"}`;
  const cardClass = `p-4 rounded-xl border shadow-lg transition-colors ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-300"}`;
  return (
    <div className={`p-4 transition-colors ${darkMode ? "bg-gray-900" : "bg-zinc-100"}`}>
      <div
  className={`p-4 sm:p-4 mb-6 flex flex-wrap gap-2 sm:gap-4 items-center justify-center rounded-xl transition-colors ${darkMode ? "bg-gray-900" : "bg-gray-200"}`}
>
  {/* Search */}
  <div
    className="flex items-center rounded-md px-2 py-1 sm:px-3 sm:py-2 flex-grow sm:flex-grow-0 border-1 w-full sm:w-auto"
    style={{ backgroundColor: darkMode ? "#1f2937" : "#eff1f6ff" }}
  >
    <FaSearch className="mr-1 sm:mr-2 text-sm sm:text-base" style={{ color: darkMode ? "#9ca3af" : "#374151" }} />
    <input
      type="text"
      placeholder="Search by vehicle number"
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      className={`w-full text-sm sm:text-base ${inputClasses} px-1 sm:px-2 py-1 sm:py-2`}
    />
  </div>

  {/* Model Select */}
  <select
    value={filterModel}
    onChange={(e) => setFilterModel(e.target.value)}
    className={`text-sm sm:text-base px-2 py-1 sm:px-2 sm:py-2 rounded-md transition-colors ${darkMode ? "bg-gray-800 text-white border border-gray-600" : "bg-white text-gray-900 border border-gray-300"} w-full sm:w-auto`}
  >
    <option value="">All Models</option>
    {models.map((m) => (
      <option key={m} value={m}>{m}</option>
    ))}
  </select>

  {/* Location Select */}
  <select
    value={filterLocation}
    onChange={(e) => setFilterLocation(e.target.value)}
    className={`text-sm sm:text-base px-2 py-1 sm:px-2 sm:py-2 rounded-md transition-colors ${darkMode ? "bg-gray-800 text-white border border-gray-600" : "bg-white text-gray-900 border border-gray-300"} w-full sm:w-auto`}
  >
    <option value="">All Locations</option>
    {locations.map((loc) => (
      <option key={loc} value={loc}>{loc}</option>
    ))}
  </select>

  {/* Status Select */}
  <select
    value={filterStatus}
    onChange={(e) => setFilterStatus(e.target.value)}
    className={`text-sm sm:text-base px-2 py-1 sm:px-2 sm:py-2 rounded-md transition-colors ${darkMode ? "bg-gray-800 text-white border border-gray-600" : "bg-white text-gray-900 border border-gray-300"} w-full sm:w-auto`}
  >
    <option value="">All Statuses</option>
    <option value="Active">Active</option>
    <option value="Paused">Paused</option>
    <option value="Upcoming Pause">Upcoming Pause</option>
  </select>

  {/* Reset Button */}
  <button
    onClick={() => { setSearchTerm(""); setFilterModel(""); setFilterLocation(""); setFilterStatus(""); }}
    className={`w-full sm:w-auto px-3 py-1 sm:px-4 sm:py-1 rounded-lg text-sm sm:text-base ${darkMode ? "bg-red-600 hover:bg-red-700 text-white" : "bg-red-500 hover:bg-red-600 text-white"}`}
  >
    Reset
  </button>
</div>

      {filteredVehicles.length === 0 ? (
        <p className="text-center text-gray-400">No vehicles found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {filteredVehicles.map((v) => {
            const status = getStatus(v);
            return (
              <div key={v.id} className={cardClass}>
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <FaCarSide /> {v.vehicle_number}
                </h3>
                <p className={`italic text-sm ${darkMode ? "text-gray-300" : "text-gray-700"} mb-1`}>{v.vehicle_model}</p>
                <p className={`flex items-center gap-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  <FaMapMarkerAlt /> {v.vehicle_location}
                </p>
                {v.rentelo_id && (
                  <p className={`flex items-center gap-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    <FaLock /> {v.rentelo_id}
                  </p>
                )}
                <p className={`mt-1 font-semibold ${status === "Paused" ? "text-red-400" : status === "Upcoming Pause" ? "text-yellow-400" : "text-green-400"}`}>
                  Status: {status}
                </p>
                {v.pause_start && v.pause_end && (
                  <p className={`text-sm mt-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Pause: {new Date(v.pause_start).toLocaleString()} → {new Date(v.pause_end).toLocaleString()}
                  </p>
                )}
                <div className="mt-3 flex flex-col gap-2">
                  <button onClick={() => { setSelectedVehicle(v); setShowForm(true); }} className={`px-2 py-1 rounded-md ${darkMode ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-blue-500 hover:bg-blue-600 text-white"}`}>
                    Add Pause
                  </button>
                  {status === "Paused" && (
                    <button onClick={() => releasePause(v.id)} className={`px-2 py-1 rounded-md ${darkMode ? "bg-yellow-600 hover:bg-yellow-700 text-black" : "bg-yellow-400 hover:bg-yellow-500 text-black"}`}>
                      Release
                    </button>
                  )}
                  <button onClick={() => { setSelectedVehicle(v); setShowHistory(true); fetchHistory(v.id); }} className={`px-2 py-1 rounded-md ${darkMode ? "bg-gray-700 hover:bg-gray-800 text-white" : "bg-gray-300 hover:bg-gray-400 text-gray-900"}`}>
                    History
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {showForm && selectedVehicle && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: darkMode ? "rgba(0,0,0,0.7)" : "rgba(255,255,255,0.7)" }}>
          <div className={`p-6 rounded-xl w-full max-w-lg transition-colors ${darkMode ? "bg-gray-900 text-white" : "bg-white text-gray-900"}`}>
            <h2 className={`text-xl font-semibold mb-4 ${darkMode ? "text-red-400" : "text-red-600"}`}>
              Pause – {selectedVehicle.vehicle_number}
            </h2>
            <form onSubmit={addPause} className="space-y-4">
              <input
                type="text"
                placeholder="Rentelo ID"
                value={pauseData.rentelo_id}
                onChange={(e) => setPauseData({ ...pauseData, rentelo_id: e.target.value })}
                className={`w-full px-2 py-2 rounded-md transition-colors ${darkMode ? "bg-gray-800 text-white border border-gray-600" : "bg-white text-gray-900 border border-gray-300"}`}
              />
              <div className="flex gap-3">
                <div className="flex flex-col gap-2 w-1/2">
                  <label className={`text-sm flex items-center gap-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    <FaCalendarAlt className="text-yellow-400" /> Start Date
                  </label>
                  <input
                    type="date"
                    value={pauseData.pause_start_date}
                    onChange={(e) => setPauseData({ ...pauseData, pause_start_date: e.target.value })}
                    className={`px-2 py-2 rounded-md transition-colors ${darkMode ? "bg-gray-800 text-white border border-gray-600" : "bg-white text-gray-900 border border-gray-300"}`}
                  />
                  <label className={`text-sm flex items-center gap-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    <FaCalendarAlt className="text-yellow-400" /> End Date
                  </label>
                  <input
                    type="date"
                    value={pauseData.pause_end_date}
                    onChange={(e) => setPauseData({ ...pauseData, pause_end_date: e.target.value })}
                    className={`px-2 py-2 rounded-md transition-colors ${darkMode ? "bg-gray-800 text-white border border-gray-600" : "bg-white text-gray-900 border border-gray-300"}`}
                  />
                </div>
                <div className="flex flex-col gap-2 w-1/2">
                  <label className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Start Time</label>
                  <select
                    value={pauseData.pause_start_time}
                    onChange={(e) => setPauseData({ ...pauseData, pause_start_time: e.target.value })}
                    className={`px-2 py-2 rounded-md transition-colors ${darkMode ? "bg-gray-800 text-white border border-gray-600" : "bg-white text-gray-900 border border-gray-300"}`}
                  >
                    <option value="">Select start time</option>
                    {generateTimeOptions().map((time) => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                  <label className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>End Time</label>
                  <select
                    value={pauseData.pause_end_time}
                    onChange={(e) => setPauseData({ ...pauseData, pause_end_time: e.target.value })}
                    className={`px-2 py-2 rounded-md transition-colors ${darkMode ? "bg-gray-800 text-white border border-gray-600" : "bg-white text-gray-900 border border-gray-300"}`}
                  >
                    <option value="">Select end time</option>
                    {generateTimeOptions().map((time) => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
              </div>
              <input
                type="text"
                placeholder="Pause Done By"
                value={pauseData.pause_done_by}
                onChange={(e) => setPauseData({ ...pauseData, pause_done_by: e.target.value })}
                className={`w-full px-2 py-2 rounded-md transition-colors ${darkMode ? "bg-gray-800 text-white border border-gray-600" : "bg-white text-gray-900 border border-gray-300"}`}
              />
              <div className="flex justify-between">
                <button
                  type="submit"
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors ${darkMode ? "bg-red-600 hover:bg-red-700 text-white" : "bg-red-500 hover:bg-red-600 text-white"}`}
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setPauseData({
                      rentelo_id: "",
                      pause_start_date: "",
                      pause_start_time: "",
                      pause_end_date: "",
                      pause_end_time: "",
                      pause_done_by: "",
                    });
                  }}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors ${darkMode ? "bg-gray-700 hover:bg-gray-800 text-white" : "bg-gray-300 hover:bg-gray-400 text-gray-900"}`}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showHistory && selectedVehicle && (
        <div className="fixed inset-0 flex items-center justify-center z-50 overflow-y-auto p-4" style={{ backgroundColor: darkMode ? "rgba(0,0,0,0.7)" : "rgba(255,255,255,0.7)" }}>
          <div className={`p-6 rounded-xl w-full max-w-2xl transition-colors ${darkMode ? "bg-gray-900 text-white" : "bg-white text-gray-900"}`}>
            <h2 className={`text-xl font-semibold mb-4 ${darkMode ? "text-green-400" : "text-green-700"}`}>
              Pause History – {selectedVehicle.vehicle_number}
            </h2>
            {pauseHistory.length === 0 ? (
              <p className="text-gray-400 text-center">No history available.</p>
            ) : (
              <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                {pauseHistory.map((h) => (
                  <div key={h.id} className={`border p-3 rounded-md ${darkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-gray-100 border-gray-300 text-gray-900"}`}>
                    <p className="text-sm">Rentelo ID: {h.rentelo_id || "-"}</p>
                    <p className="text-sm">{new Date(h.pause_start).toLocaleString()} → {new Date(h.pause_end).toLocaleString()}</p>
                    <p className="text-sm italic text-gray-400">Done by: {h.pause_done_by || "-"}</p>
                  </div>
                ))}
              </div>
            )}
            <div className="text-right mt-4">
              <button
                onClick={() => setShowHistory(false)}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${darkMode ? "bg-gray-700 hover:bg-gray-800 text-white" : "bg-gray-300 hover:bg-gray-400 text-gray-900"}`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
