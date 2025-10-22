import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as ReTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  LabelList,
} from "recharts";

const STATUS_COLOR_MAP = {
  Completed: "#1D4ED8",    // bg-blue-700
  Extended: "#15803D",     // bg-green-700
  "Drop off": "#3F3F46",   // bg-neutral-700
  "Not Answered": "#B91C1C", // bg-red-700
  "Call Back": "#A21CAF",  // bg-fuchsia-700
  Other: "#EA580C",        // bg-orange-600
};


const LOCATION_PALETTE = [
  "#3B82F6", "#10B981", "#EF4444", "#8B5CF6", "#F97316",
  "#06B6D4", "#7C3AED", "#0EA5E9", "#14B8A6", "#665d5eff",
];


function pickStatusColor(status, idx) {
  if (!status) return STATUS_COLOR_MAP.Other;
  if (STATUS_COLOR_MAP[status]) return STATUS_COLOR_MAP[status];
  const s = status.toString().toLowerCase();
  if (s.includes("complete")) return STATUS_COLOR_MAP.Completed;
  if (s.includes("drop")) return STATUS_COLOR_MAP["Drop off"];
  if (s.includes("pause")) return STATUS_COLOR_MAP.Paused;
  if (s.includes("extend")) return STATUS_COLOR_MAP.Extended;
  if (s.includes("pend")) return STATUS_COLOR_MAP.Pending;
  const keys = Object.keys(STATUS_COLOR_MAP);
  return STATUS_COLOR_MAP[keys[idx % keys.length]] || STATUS_COLOR_MAP.Other;
}

export default function TodaysDropsReport() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768); 
    };

    handleResize(); 
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);


  const [versions, setVersions] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState("");

  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);
  const [availableDates, setAvailableDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState("all");
  const [agentMaster, setAgentMaster] = useState([]);

  const dropIndex = useMemo(() => {
    if (!headers || headers.length === 0) return -1;
    return headers.findIndex((h) => (h || "").toString().toLowerCase().includes("drop"));
  }, [headers]);

  const pickupIndex = useMemo(() => {
    if (!headers || headers.length === 0) return -1;
    const keys = ["pickup", "pick up", "location", "drop location", "drop_loc", "pickup_location"];
    const hLower = headers.map((h) => (h || "").toString().toLowerCase());
    for (const key of keys) {
      const idx = hLower.findIndex((h) => h.includes(key));
      if (idx !== -1) return idx;
    }
    return -1;
  }, [headers]);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      setLoading(true);
      try {
        const { data: mData } = await supabase.from("meta").select("id, headers").order("id", { ascending: false });
        const ids = (mData || []).map((m) => m.id);
        if (!mounted) return;
        setVersions(ids);
        if (ids.length > 0 && !selectedVersion) setSelectedVersion(ids[0]);

        const { data: namesData } = await supabase.from("uploads").select("name");
        const uniq = Array.from(new Set((namesData || []).map((r) => (r.name || "Unassigned"))));
        setAgentMaster(uniq.sort((a, b) => a.localeCompare(b)));
      } catch (err) {
        console.error(err);
        setError(err.message || String(err));
      } finally {
        if (mounted) setLoading(false);
      }
    };
    init();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!selectedVersion) return;
    let mounted = true;
    const loadRows = async () => {
      setLoading(true);
      try {
        const { data: metaData } = await supabase.from("meta").select("headers").eq("id", selectedVersion).single();
        const hdrs = metaData?.headers || [];
        if (!mounted) return;
        setHeaders(hdrs);

        const { data: rowData } = await supabase.from("uploads")
          .select("id, version_id, cells, status, name")
          .eq("version_id", selectedVersion)
          .order("id", { ascending: true });

        if (!mounted) return;
        setRows(rowData || []);

        const dateSet = new Set();
        if (dropIndex !== -1) {
          (rowData || []).forEach((r) => {
            const d = r.cells?.[dropIndex]?.toString().split("T")[0] || "";
            if (d) dateSet.add(d);
          });
        }
        setAvailableDates(Array.from(dateSet).sort().reverse());
        setSelectedDate("all");
      } catch (err) {
        console.error(err);
        setError(err.message || String(err));
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadRows();
    return () => { mounted = false; };
  }, [selectedVersion, dropIndex]);

  const filteredRows = useMemo(() => {
    if (!rows || rows.length === 0) return [];
    if (selectedDate === "all") return rows;
    if (dropIndex === -1) return rows;
    return rows.filter((r) => {
      const d = r.cells?.[dropIndex]?.toString().split("T")[0] || "";
      return d === selectedDate;
    });
  }, [rows, selectedDate, dropIndex]);

  const statusCounts = useMemo(() => {
    const map = {};
    filteredRows.forEach((r) => {
      const key = (r.status || "Other").toString();
      map[key] = (map[key] || 0) + 1;
    });
    const common = ["Completed", "Drop off", "Extended", "Not Answered", "Call Back", "Other"];
    common.forEach((s) => { if (!map[s]) map[s] = 0; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filteredRows]);

  const agentCounts = useMemo(() => {
    const map = {};
    (agentMaster || []).forEach((a) => { map[a] = 0; });
    filteredRows.forEach((r) => {
      const n = r.name || "Unassigned";
      map[n] = (map[n] || 0) + 1;
    });
    return Object.entries(map).map(([name, count]) => ({ name, count }));
  }, [filteredRows, agentMaster]);

  const locationCounts = useMemo(() => {
    const map = {};
    filteredRows.forEach((r) => {
      const loc = r.cells?.[pickupIndex] || "Unknown";
      map[loc] = (map[loc] || 0) + 1;
    });
    return Object.entries(map).map(([location, count], idx) => ({
      location,
      count,
      color: LOCATION_PALETTE[idx % LOCATION_PALETTE.length],
    }));
  }, [filteredRows, pickupIndex]);

  if (loading) return <div className="flex justify-center items-center mt-12 text-gray-600">Loading...</div>;
  if (error) return <div className="text-red-600 mt-12 text-center">{error}</div>;

return (
    <div className="max-w-[1200px] mx-auto p-6 pb-20">
    <div className="flex items-center justify-between mb-4">
        <div>
        <h2 className="text-2xl font-bold text-gray-800">Drops Report</h2>
        <p className="text-sm text-gray-500">
            Version: <span className="font-medium">{selectedVersion || "—"}</span> • Rows:{" "}
            <span className="font-medium">{rows.length}</span>
        </p>
        </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
        <label className="text-sm font-semibold text-gray-700 block mb-1">Select Version</label>
        <select
            className="w-full border p-2 rounded"
            value={selectedVersion}
            onChange={(e) => setSelectedVersion(e.target.value)}
        >
            {versions.map((v) => <option key={v} value={v}>{v}</option>)}
        </select>
        </div> 
        {/*
        <div>
        <label className="text-sm font-semibold text-gray-700 block mb-1">Filter by Drop Date</label>
        <select
            className="w-full border p-2 rounded"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
        >
            <option value="all">All dates</option>
            {availableDates.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        </div>
        */}
        <div className="text-end">
        <div className="text-sm text-gray-600">Total Drops: <span className="text-2xl font-bold">{filteredRows.length}</span></div>
        <div className="mt-2 text-sm text-gray-500">Agents in master list: {agentMaster.length}</div>
        </div>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded shadow">
        <h3 className="font-semibold text-gray-800 mb-2">Drop Status</h3>
        <div style={{ width: "100%", height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie
                data={statusCounts}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ value }) => `${value}`}
                >
                {statusCounts.map((entry, idx) => (
                    <Cell key={entry.name} fill={pickStatusColor(entry.name, idx)} />
                ))}
                </Pie>
                <ReTooltip formatter={(value, name) => [`${value} drops`, name]} />
                
            </PieChart>
            </ResponsiveContainer>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {statusCounts.map((s, idx) => (
            <div
              key={s.name}
              className="flex items-center gap-2 sm:gap-2 p-2 border rounded flex-col-2"
              
            >
              <div
                style={{
                  width: 10,
                  height: 20,
                  background: pickStatusColor(s.name, idx),
                  borderRadius: 1,
                }}
              />
              <div className="text-xs">
                <div className="text-xs font-medium">{s.name}</div>
                <div className="text-xs text-gray-500">{s.value} drops</div>
              </div>
            </div>
          ))}
        </div>
        </div>
        <div className="bg-white p-4 rounded shadow flex justify-center">
        <div className="w-full max-w-3xl">
            <h3 className="font-semibold text-gray-800 mb-2">Drops by Agent</h3>
            <div style={{ width: "100%", height: Math.max(agentCounts.length * 40, 320) }}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={agentCounts} layout="vertical" margin={{ left: 0, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={isMobile ? 45 : 80} // reduce width on mobile
                  tick={{ fontSize: isMobile ? 8 : 12, fill: "#374151" }} // smaller text
                />
                <ReTooltip />
                <Bar
                    dataKey="count"
                    label={{ position: "right", formatter: (val) => `${val}` }}
                >
                    {agentCounts.map((entry, idx) => {
                    const maxCount = Math.max(...agentCounts.map((a) => a.count));
                    const ratio = maxCount > 0 ? entry.count / maxCount : 0;
                    const red = Math.round(255 * (1 - ratio));
                    const green = Math.round(128 + 127 * ratio);
                    const color = `rgb(${red},${green},0)`;
                    return <Cell key={entry.name} fill={color} />;
                    })}
                </Bar>
                </BarChart>
            </ResponsiveContainer>
            </div>
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {agentCounts.map((a) => (
                <div
                key={a.name}
                className="flex justify-between items-center p-2 border rounded bg-gray-50"
                >
                <span className="font-medium text-gray-700 text-xs sm:text-sm">{a.name}</span>
                <span className="text-xs sm:text-sm text-gray-600 ml-1">{a.count}</span>
                </div>
            ))}
            </div>
        </div>
        </div>
    </div>
    <div className="bg-white p-4 rounded shadow mt-6 w-full">
        <h3 className="font-semibold text-gray-800 mb-2">Drops by Location</h3>
        <div style={{ width: "100%", height: 420 }}>
        <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={locationCounts}
              margin={{ top: 20, right: 20, left: 10, bottom: isMobile ? 60 : 80 }} 
            >
              <CartesianGrid strokeDasharray="3 3" />

              {!isMobile && (
                <XAxis
                  dataKey="location"
                  angle={-45}
                  textAnchor="end"
                  interval={0}
                  height={isMobile ? 45 : 100}
                  tick={{ fontSize: isMobile ? 6 : 8, fill: "#374151" }}
                />
              )}

              <YAxis
                allowDecimals={false}
                width={isMobile ? 40 : 80} // reduce width on mobile so chart stretches full width
                tick={{ fontSize: isMobile ? 8 : 12, fill: "#374151" }}
              />

              <ReTooltip />

              <Bar dataKey="count">
                {locationCounts.map((entry) => (
                  <Cell key={entry.location} fill={entry.color} />
                ))}
                <LabelList dataKey="count" position="top" />
              </Bar>
            </BarChart>
        </ResponsiveContainer>
        </div>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {locationCounts.map((loc) => (
                <div
                key={loc.location}
                className="flex items-center gap-2 p-2 border rounded bg-white"
                >
                <div
                    style={{
                    width: 14,
                    height: 20,
                    background: loc.color,
                    borderRadius: 3,
                    }}
                />
                <div className="text-[8px]">
                    <div className="font-medium">{loc.location}</div>
                    <div className="text-sm text-gray-500">{loc.count} drops</div>
                </div>
                </div>
            ))}
            </div>
      </div>
    </div>
  );
}
