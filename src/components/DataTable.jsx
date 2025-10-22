import React, { useState, useEffect } from "react";
import { Copy } from "lucide-react";
import { db } from "../../firebase.js";
import {
  collection,
  doc,
  setDoc,
  onSnapshot,
  getDocs,
} from "firebase/firestore";
const statusOptions = [
  "Completed",
  "Extended",
  "Drop off",
  "Not Answered",
  "Call Back",
  "Other",
];
const NameOptions = [
  "Ayesha",
  "Harshetha",
  "Shahid",
  "Nithesh",
  "Yousuff",
  "Rafiqul",
  "Other",
];
const statusColors = {
  Completed: "bg-blue-700 text-white",
  Extended: "bg-green-700 text-white",
  "Drop off": "bg-neutral-700 text-white",
  "Not Answered": "bg-red-700 text-white",
  "Call Back": "bg-fuchsia-700 text-white",
  Other: "bg-orange-600 text-white",
};
export default function DataTable() {
  const [versions, setVersions] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState("");
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);
  const [statuses, setStatuses] = useState({});
  const [names, setNames] = useState({});
  const [copied, setCopied] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [nameFilter, setNameFilter] = useState("");
  const [pickupFilter, setPickupFilter] = useState("");
  const [bookingIdSearch, setBookingIdSearch] = useState("");
  const pickupIndex = headers.findIndex((h) =>
    (h || "").toLowerCase().includes("pickup")
  );
  const bookingIndex = headers.findIndex((h) =>
    (h || "").toLowerCase().includes("booking")
  );
  useEffect(() => {
    const loadVersions = async () => {
      const snapshot = await getDocs(collection(db, "meta"));
      const v = snapshot.docs.map((d) => d.id);
      const sorted = v.sort().reverse(); // latest first
      setVersions(sorted);
      if (sorted.length > 0 && !selectedVersion) {
        setSelectedVersion(sorted[0]);
      }
    };
    loadVersions();
  }, []);
  useEffect(() => {
    if (!selectedVersion) return;
    const metaDoc = doc(db, "meta", selectedVersion);
    const unsubMeta = onSnapshot(metaDoc, (snapshot) => {
      if (snapshot.exists()) setHeaders(snapshot.data().headers);
    });
    const unsubRows = onSnapshot(
      collection(db, "uploads", selectedVersion, "rows"),
      (snapshot) => {
        const rowData = [];
        const statusMap = {};
        const nameMap = {};
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          rowData.push({ id: docSnap.id, cells: data.cells });
          statusMap[docSnap.id] = data.status;
          nameMap[docSnap.id] = data.name;
        });
        setRows(rowData);
        setStatuses(statusMap);
        setNames(nameMap);
      }
    );
    return () => {
      unsubMeta();
      unsubRows();
    };
  }, [selectedVersion]);
  const handleStatusChange = async (rowId, value, cells) => {
    await setDoc(
      doc(db, "uploads", selectedVersion, "rows", rowId),
      { status: value, cells },
      { merge: true }
    );
  };
  const handleNameChange = async (rowId, value, cells) => {
    await setDoc(
      doc(db, "uploads", selectedVersion, "rows", rowId),
      { name: value, cells },
      { merge: true }
    );
  };
  const handleCopy = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };
  const downloadCSV = () => {
    let csvContent = headers.join(",") + ",Status,Name\n";
    rows.forEach((row) => {
      const rowStatus = statuses[row.id] || "";
      const rowName = names[row.id] || "";
      const rowPickup = pickupIndex >= 0 ? row.cells[pickupIndex] : "";
      const rowBooking = bookingIndex >= 0 ? row.cells[bookingIndex] : "";
      const statusPass =
        !statusFilter ||
        (statusFilter === "__not_selected__" && rowStatus === "") ||
        rowStatus === statusFilter;
      const namePass = !nameFilter || rowName === nameFilter;
      const pickupPass = !pickupFilter || rowPickup === pickupFilter;
      const bookingPass =
        !bookingIdSearch ||
        (rowBooking || "")
          .toString()
          .toLowerCase()
          .includes(bookingIdSearch.toLowerCase());
      if (statusPass && namePass && pickupPass && bookingPass) {
        csvContent += row.cells.join(",") + "," + rowStatus + "," + rowName + "\n";
      }
    });
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `filtered_${selectedVersion}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  if (!selectedVersion) {
    return (
      <div className="mt-8 text-center text-gray-500">
        No version found — please upload an Excel file.
      </div>
    );
  }
  return (
    <div className="mt-8 w-full overflow-x-auto">
<div className="mb-4">
  <label className="mr-2 font-medium">Upload Date</label>
  <select
    value={selectedVersion}
    onChange={(e) => setSelectedVersion(e.target.value)}
    className="border rounded-lg p-2"
  >
    {versions.map((v) => (
      <option key={v} value={v}>
        {new Date(v).toLocaleString()}
      </option>
    ))}
  </select>
</div>
<div className="hidden md:flex items-center justify-between gap-8 mb-4">
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium">Status</label>
      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        className="border rounded-lg p-2 text-sm"
      >
        <option value="">All</option>
        <option value="__not_selected__">Not Selected</option>
        {statusOptions.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium">Name</label>
      <select
        value={nameFilter}
        onChange={(e) => setNameFilter(e.target.value)}
        className="border rounded-lg p-2 text-sm"
      >
        <option value="">All</option>
        {NameOptions.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
    {pickupIndex >= 0 && (
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium">Location</label>
        <select
          value={pickupFilter}
          onChange={(e) => setPickupFilter(e.target.value)}
          className="border rounded-lg p-2 text-sm"
        >
          <option value="">All</option>
          {[...new Set(rows.map((r) => r.cells[pickupIndex]))].map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
    )}
    {bookingIndex >= 0 && (
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium">Booking ID</label>
        <input
          type="text"
          value={bookingIdSearch}
          onChange={(e) => setBookingIdSearch(e.target.value)}
          placeholder="Enter booking ID"
          className="border rounded-lg p-2 text-sm"
        />
      </div>
    )}
    <button
      onClick={downloadCSV}
      className="px-4 py-2 bg-black text-red-500 rounded-lg shadow hover:bg-red-700 hover:text-white"
    >
      Download CSV
    </button>
</div>
<div className="md:hidden flex flex-col gap-2 mb-4">
  <div className="flex gap-2">
    <div className="flex-1">
      <label className="text-xs font-medium">Status</label>
      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        className="w-full border rounded-lg p-2 text-sm mt-1"
      >
        <option value="">All</option>
        <option value="__not_selected__">Not Selected</option>
        {statusOptions.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
    <div className="flex-1">
      <label className="text-xs font-medium">Name</label>
      <select
        value={nameFilter}
        onChange={(e) => setNameFilter(e.target.value)}
        className="w-full border rounded-lg p-2 text-sm mt-1"
      >
        <option value="">All</option>
        {NameOptions.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
    {pickupIndex >= 0 && (
      <div className="flex-1">
        <label className="text-xs font-medium">Location</label>
        <select
          value={pickupFilter}
          onChange={(e) => setPickupFilter(e.target.value)}
          className="w-full border rounded-lg p-2 text-sm mt-1"
        >
          <option value="">All</option>
          {[...new Set(rows.map((r) => r.cells[pickupIndex]))].map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
    )}
  </div>
  <div className="flex gap-2 mt-2">
    {bookingIndex >= 0 && (
      <div className="flex-1">
        <label className="text-xs font-medium">Booking ID</label>
        <input
          type="text"
          value={bookingIdSearch}
          onChange={(e) => setBookingIdSearch(e.target.value)}
          placeholder="Enter booking ID"
          className="w-full border rounded-lg p-2 text-sm mt-1"
        />
      </div>
    )}
    <div className="flex-none">
      <button onClick={downloadCSV} className="w-full px-2 py-1 bg-black text-red-500 rounded-lg shadow hover:bg-red-700 hover:text-white mt-6 sm:mt-1" >
        Download CSV 
      </button>
    </div>
  </div>
</div>
<div className="hidden md:block inline-block min-w-full align-middle rounded-lg shadow-md overflow-hidden bg-white">
  <table className="table-fixed w-full border-collapse">
    <thead>
      <tr className="bg-red-600 text-white">
        {headers.map((header, i) => (
          <th
            key={i}
            className="px-4 py-3 text-left text-sm font-medium h-12 min-w-[120px] break-words"
          >
            {header ?? `Column ${i + 1}`}
          </th>
        ))}
        <th className="px-4 py-3 text-left text-sm font-medium h-12 min-w-[140px]">
          Status
        </th>
        <th className="px-4 py-3 text-left text-sm font-medium h-12 min-w-[140px]">
          Name
        </th>
      </tr>
    </thead>
    <tbody>
      {rows
        .filter((row) => {
          const rowStatus = statuses[row.id] || "";
          const rowName = names[row.id] || "";
          const rowPickup = pickupIndex >= 0 ? row.cells[pickupIndex] : "";
          const rowBooking = bookingIndex >= 0 ? row.cells[bookingIndex] : "";
          const statusPass =
            !statusFilter ||
            (statusFilter === "__not_selected__" && rowStatus === "") ||
            rowStatus === statusFilter;
          const namePass = !nameFilter || rowName === nameFilter;
          const pickupPass = !pickupFilter || rowPickup === pickupFilter;
          const bookingPass =
            !bookingIdSearch ||
            (rowBooking || "")
              .toString()
              .toLowerCase()
              .includes(bookingIdSearch.toLowerCase());
          return statusPass && namePass && pickupPass && bookingPass;
        })
        .map((row) => (
          <tr
            key={row.id}
            className="odd:bg-white even:bg-gray-50 hover:bg-indigo-50"
          >
            {row.cells.map((cell, j) => {
              const header = headers[j]?.toLowerCase();
              const shouldCopy =
                header?.includes("booking") ||
                header?.includes("mobile") ||
                header?.includes("vehicle");
              return (
                <td
                  key={j}
                  className="px-4 py-3 border-t border-gray-200 text-sm h-12 align-top break-words"
                >
                  <div className="flex items-center gap-2">
                    <span>{cell ?? ""}</span>
                    {shouldCopy && cell && (
                      <button
                        onClick={() => handleCopy(cell, `${row.id}-${j}`)}
                        className="text-gray-500 hover:text-indigo-600"
                        title="Copy"
                      >
                        <Copy size={14} />
                      </button>
                    )}
                    {copied === `${row.id}-${j}` && (
                      <span className="text-green-600 text-xs">Copied!</span>
                    )}
                  </div>
                </td>
              );
            })}
            <td className="px-4 py-3 border-t border-gray-200 text-sm h-12">
              <select
                value={statuses[row.id] || ""}
                onChange={(e) =>
                  handleStatusChange(row.id, e.target.value, row.cells)
                }
                className={`w-full border rounded-lg p-2 text-sm ${
                  statuses[row.id]
                    ? statusColors[statuses[row.id]] || ""
                    : ""
                }`}
              >
                <option value="">Select...</option>
                {statusOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </td>
            <td className="px-4 py-3 border-t border-gray-200 text-sm h-12">
              <select
                value={names[row.id] || ""}
                onChange={(e) =>
                  handleNameChange(row.id, e.target.value, row.cells)
                }
                className="w-full border rounded-lg p-2 text-sm"
              >
                <option value="">Select...</option>
                {NameOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </td>
          </tr>
        ))}
    </tbody>
  </table>
</div>
<div className="md:hidden space-y-4">
  {rows.map((row) => (
    <div
      key={row.id}
      className="bg-white shadow-md rounded-lg p-4 border border-gray-200"
    >
      {row.cells.map((cell, j) => (
        <div key={j} className="mb-2">
          <p className="text-xs font-semibold text-gray-500">
            {headers[j] ?? `Column ${j + 1}`}
          </p>
          <div className="flex items-center gap-2 text-sm">
            <span>{cell ?? ""}</span>
          </div>
        </div>
      ))}
      <div className="mt-2">
        <label className="text-xs font-semibold text-gray-500">Status</label>
        <select
          value={statuses[row.id] || ""}
          onChange={(e) =>
            handleStatusChange(row.id, e.target.value, row.cells)
          }
          className={`w-full border rounded-lg p-2 text-sm mt-1 ${
            statuses[row.id] ? statusColors[statuses[row.id]] || "" : ""
          }`}
        >
          <option value="">Select...</option>
          {statusOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
      <div className="mt-2">
        <label className="text-xs font-semibold text-gray-500">Name</label>
        <select
          value={names[row.id] || ""}
          onChange={(e) =>
            handleNameChange(row.id, e.target.value, row.cells)
          }
          className="w-full border rounded-lg p-2 text-sm mt-1"
        >
          <option value="">Select...</option>
          {NameOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
    </div>
  ))}
</div>
    </div>
  );
}
