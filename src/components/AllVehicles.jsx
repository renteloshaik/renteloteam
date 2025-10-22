import React, { useState, useEffect } from "react";
import {
  FaCarSide,
  FaMapMarkerAlt,
  FaTag,
  FaIdBadge,
  FaUserCheck,
  FaClock,
  FaToggleOn,
  FaCopy,
  FaCheck,
  FaSearch,
  FaFilter,
  FaEllipsisV,
  FaChevronDown,
} from "react-icons/fa";
import { supabase } from "../supabaseClient";

export default function AllVehicles({ darkMode }) {
  const [vehicles, setVehicles] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filteredVehicles, setFilteredVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copiedField, setCopiedField] = useState({ id: null, field: "" });
  const [filters, setFilters] = useState({
    model: "",
    location: "",
    status: "",
    pausedBy: "",
    search: "",
  });

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("zoomcar_vehicles")
      .select("*")
      .order("id", { ascending: false });
    if (!error && data) {
      setVehicles(data);
      setFilteredVehicles(data);
    }
    setLoading(false);
  };

  const isCurrentlyPaused = (start, end) => {
    const now = new Date();
    return start && end && new Date(start) <= now && now <= new Date(end);
  };

  const isFuturePause = (start) => start && new Date(start) > new Date();

  const getStatus = (v) => {
    const current = isCurrentlyPaused(v.pause_start, v.pause_end);
    const upcoming = isFuturePause(v.pause_start);
    if (current) return "Paused";
    if (upcoming) return "Upcoming Pause";
    return "Active";
  };

  const handleCopy = async (text, id, field) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField({ id, field });
      setTimeout(() => setCopiedField({ id: null, field: "" }), 1500);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
  };

  useEffect(() => {
    let filtered = vehicles.filter((v) => {
      const status = getStatus(v);
      const matchesModel = !filters.model || v.vehicle_model === filters.model;
      const matchesLocation = !filters.location || v.vehicle_location === filters.location;
      const matchesStatus = !filters.status || status === filters.status;
      const matchesPausedBy = !filters.pausedBy || v.pause_done_by === filters.pausedBy;
      const matchesSearch =
        !filters.search ||
        v.vehicle_number?.toLowerCase().includes(filters.search.toLowerCase()) ||
        v.rentelo_id?.toLowerCase().includes(filters.search.toLowerCase());
      return matchesModel && matchesLocation && matchesStatus && matchesPausedBy && matchesSearch;
    });
    setFilteredVehicles(filtered);
  }, [filters, vehicles]);

  const unique = (key) => [...new Set(vehicles.map((v) => v[key]).filter(Boolean))];

  const bgPrimary = darkMode ? "bg-gray-900" : "bg-zinc-100";
  const bgSecondary = darkMode ? "bg-gray-800" : "bg-white";
  const textPrimary = darkMode ? "text-white" : "text-gray-900";
  const textSecondary = darkMode ? "text-gray-200" : "text-gray-800";
  const borderColor = darkMode ? "border-gray-700" : "border-gray-300";

  return (
    <div className="px-2 sm:px-4">
      {/* Filter Toggle Button */}
      <div className="flex justify-end mb-2">
        <button
          onClick={() => setShowFilters(!showFilters)}
        >
          <FaEllipsisV className={`${textPrimary} text-lg`} />
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className={`${bgSecondary} p-4 mb-5 shadow-md border ${borderColor} rounded-xl`}>
          <div className="flex flex-wrap gap-3 items-center justify-center">
            {/* Search */}
            <div className={`flex items-center ${bgPrimary} rounded-lg px-2 py-1 w-full sm:w-auto`}>
              <FaSearch className={`mr-2 ${textSecondary}`} />
              <input
                type="text"
                placeholder="Vehicle No or Rentelo ID"
                className={`bg-transparent ${textPrimary} placeholder-gray-400 outline-none text-xs sm:text-sm w-full`}
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
              />
            </div>

            {/* Select Filters */}
            {[
              { icon: FaFilter, label: "Model", key: "model", options: unique("vehicle_model") },
              { icon: FaMapMarkerAlt, label: "Location", key: "location", options: unique("vehicle_location") },
              { icon: FaToggleOn, label: "Status", key: "status", options: ["Active", "Paused", "Upcoming Pause"] },
              { icon: FaUserCheck, label: "Paused By", key: "pausedBy", options: unique("pause_done_by") },
            ].map((field) => (
              <div key={field.key} className={`relative flex items-center ${bgPrimary} px-2 py-1 rounded-lg w-full sm:w-auto`}>
                <field.icon className={`mr-2 ${textSecondary}`} />
                <select
                  className={`${bgPrimary} ${textPrimary} outline-none text-xs sm:text-sm py-1 px-1 pr-6 rounded cursor-pointer appearance-none w-full sm:w-auto`}
                  value={filters[field.key]}
                  onChange={(e) => handleFilterChange(field.key, e.target.value)}
                >
                  <option value="">{field.label}</option>
                  {field.options.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                <FaChevronDown className="absolute right-2 pointer-events-none text-gray-500" />
              </div>
            ))}

            {/* Reset */}
            <button
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg text-xs sm:text-sm w-full sm:w-auto"
              onClick={() =>
                setFilters({ model: "", location: "", status: "", pausedBy: "", search: "" })
              }
            >
              Reset
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className={`text-center ${textSecondary}`}>Loading vehicles...</p>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className={`min-w-full border ${borderColor} text-sm`}>
              <thead className="bg-sky-700 text-gray-100 uppercase text-xs tracking-wider">
                <tr>
                  <th className={`p-3 border ${borderColor} text-center`}>
                    <div className="flex flex-col items-center justify-center gap-1">
                      <FaCarSide className="text-lg" /> Vehicle No
                    </div>
                  </th>
                  <th className={`p-3 border ${borderColor} text-center`}>
                    <div className="flex flex-col items-center justify-center gap-1">
                      <FaTag className="text-lg" /> Model
                    </div>
                  </th>
                  <th className={`p-3 border ${borderColor} text-center`}>
                    <div className="flex flex-col items-center justify-center gap-1">
                      <FaMapMarkerAlt className="text-lg" /> Location
                    </div>
                  </th>
                  <th className={`p-3 border ${borderColor} text-center`}>
                    <div className="flex flex-col items-center justify-center gap-1">
                      <FaToggleOn className="text-lg" /> Status
                    </div>
                  </th>
                  <th className={`p-3 border ${borderColor} text-center`}>
                    <div className="flex flex-col items-center justify-center gap-1">
                      <FaIdBadge className="text-lg" /> Rentelo ID
                    </div>
                  </th>
                  <th className={`p-3 border ${borderColor} text-center`}>
                    <div className="flex flex-col items-center justify-center gap-1">
                      <FaUserCheck className="text-lg" /> Paused By
                    </div>
                  </th>
                  <th className={`p-3 border ${borderColor} text-center`}>
                    <div className="flex flex-col items-center justify-center gap-1">
                      <FaClock className="text-lg" /> Pause Period
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredVehicles.map((v) => {
                  const status = getStatus(v);
                  return (
                    <tr
                      key={v.id}
                      className={`odd:${bgSecondary} even:${bgPrimary} text-center hover:bg-gray-500 transition`}
                    >
                      <td className={`p-2 border ${borderColor}`}>
                        <div className="flex items-center justify-center gap-2">
                          <span className={textPrimary}>{v.vehicle_number}</span>
                          {copiedField.id === v.id && copiedField.field === "vehicle_number" ? (
                            <FaCheck className="text-green-400 text-sm" />
                          ) : (
                            <FaCopy
                              className={`cursor-pointer ${textSecondary} hover:text-white text-sm`}
                              title="Copy Vehicle Number"
                              onClick={() => handleCopy(v.vehicle_number, v.id, "vehicle_number")}
                            />
                          )}
                        </div>
                      </td>
                      <td className={`p-2 border ${borderColor} ${textSecondary}`}>{v.vehicle_model}</td>
                      <td className={`p-2 border ${borderColor} flex items-center justify-center gap-1 ${textSecondary}`}>
                        <FaMapMarkerAlt className="text-sky-400" /> {v.vehicle_location}
                      </td>
                      <td className={`p-2 border ${borderColor} font-semibold ${
                        status === "Paused" ? "text-red-500" : status === "Upcoming Pause" ? "text-yellow-400" : "text-green-400"
                      }`}>{status}</td>
                      <td className={`p-2 border ${borderColor}`}>
                        {v.rentelo_id ? (
                          <div className="flex items-center justify-center gap-2">
                            <span className={textSecondary}>{v.rentelo_id}</span>
                            {copiedField.id === v.id && copiedField.field === "rentelo_id" ? (
                              <FaCheck className="text-green-400 text-sm" />
                            ) : (
                              <FaCopy
                                className={`cursor-pointer ${textSecondary} hover:text-white text-sm`}
                                title="Copy Rentelo ID"
                                onClick={() => handleCopy(v.rentelo_id, v.id, "rentelo_id")}
                              />
                            )}
                          </div>
                        ) : ("-")}
                      </td>
                      <td className={`p-2 border ${borderColor} ${textSecondary}`}>{v.pause_done_by || "-"}</td>
                      <td className={`p-2 border ${borderColor} ${textSecondary}`}>
                        {v.pause_start
                          ? `${new Date(v.pause_start).toLocaleString()} → ${new Date(v.pause_end).toLocaleString()}`
                          : "-"}
                      </td>
                    </tr>
                  );
                })}
                {filteredVehicles.length === 0 && (
                  <tr>
                    <td colSpan="7" className={`text-center ${textSecondary} py-4 border ${borderColor}`}>
                      No vehicles found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="sm:hidden flex flex-col gap-4">
            {filteredVehicles.map((v) => {
              const status = getStatus(v);
              return (
                <div
                  key={v.id}
                  className={`${bgSecondary} p-4 rounded-xl shadow-md border ${borderColor} flex flex-col gap-2`}
                >
                  <div className="flex justify-between items-center">
                    <span className={`${textPrimary} font-semibold`}>{v.vehicle_number}</span>
                    {copiedField.id === v.id && copiedField.field === "vehicle_number" ? (
                      <FaCheck className="text-green-400 text-sm" />
                    ) : (
                      <FaCopy
                        className={`cursor-pointer ${textSecondary} hover:text-gray-700`}
                        onClick={() => handleCopy(v.vehicle_number, v.id, "vehicle_number")}
                      />
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={textSecondary}>Model: {v.vehicle_model}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={textSecondary}>
                      <FaMapMarkerAlt className="inline text-sky-400 mr-1" />
                      {v.vehicle_location}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span
                      className={`font-semibold ${
                        status === "Paused" ? "text-red-500" : status === "Upcoming Pause" ? "text-yellow-400" : "text-green-400"
                      }`}
                    >
                      Status: {status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={textSecondary}>
                      Rentelo ID: {v.rentelo_id || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={textSecondary}>Paused By: {v.pause_done_by || "-"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={textSecondary}>
                      Pause: {v.pause_start ? `${new Date(v.pause_start).toLocaleString()} → ${new Date(v.pause_end).toLocaleString()}` : "-"}
                    </span>
                  </div>
                </div>
              );
            })}
            {filteredVehicles.length === 0 && (
              <p className={`text-center ${textSecondary}`}>No vehicles found.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
