import React, { useState, useEffect } from "react";
import {
  FaCarSide,
  FaUserCheck,
  FaRupeeSign,
  FaCalendarAlt,
  FaRegEye,
  FaRegEyeSlash,
  FaEllipsisV,
  FaClock,
  FaPlusCircle,
  FaSearch,
  FaRegCopy,
  FaCheck,
  FaSun,
  FaMoon,
} from "react-icons/fa";
import { supabase } from "../zoomcarClient";
const timeOptions = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2).toString().padStart(2, "0");
  const m = i % 2 === 0 ? "00" : "30";
  return `${h}:${m}`;
});
function CopyButton({ text, darkMode }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className={`ml-1 ${
        darkMode ? "text-gray-300 hover:text-white" : "text-gray-600 hover:text-black"
      } flex items-center`}
    >
      {copied ? <FaCheck className="text-green-500" /> : <FaRegCopy />}
    </button>
  );
}
export default function ZoomcarTracker() {
  const [bookings, setBookings] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showOTP, setShowOTP] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [newBooking, setNewBooking] = useState({
    mail_date: "",
    zoomcar_booking_id: "",
    customer_name: "",
    rentelo_booking_id: "",
    vehicle_number: "",
    vehicle_model: "",
    start_date: "",
    start_time: "",
    end_date: "",
    end_time: "",
    start_otp: "",
    booking_status: "Confirmed",
    earnings: "",
    ride_status: "Upcoming",
    remarks: "",
  });
  const [filters, setFilters] = useState({
    bookingDate: "",
    model: "",
    bookingStatus: "",
    rideStatus: "",
    search: "",
  });
  useEffect(() => {
    fetchBookings();
  }, []);
  const fetchBookings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("zoomcar_bookings")
        .select(
          "id, mail_date, zoomcar_booking_id, customer_name, rentelo_booking_id, vehicle_number, vehicle_model, start_time, end_time, start_otp, booking_status, earnings, ride_status, remarks"
        )
        .order("id", { ascending: false });
      if (error) throw error;
      setBookings(data);
    } catch (err) {
      console.error("Error fetching bookings:", err.message);
    }
    setLoading(false);
  };
  const toggleOTP = (id) =>
    setShowOTP((prev) => ({ ...prev, [id]: !prev[id] }));
  const handleInput = (e) => {
    const { name, value } = e.target;
    setNewBooking((prev) => ({ ...prev, [name]: value }));
  };
  const addBooking = async (e) => {
    e.preventDefault();
    setLoading(true);
    const bookingData = {
      mail_date: newBooking.mail_date.replace("T", " "),
      zoomcar_booking_id: newBooking.zoomcar_booking_id,
      customer_name: newBooking.customer_name,
      rentelo_booking_id: newBooking.rentelo_booking_id,
      vehicle_number: newBooking.vehicle_number,
      vehicle_model: newBooking.vehicle_model,
      start_time: `${newBooking.start_date} ${newBooking.start_time}`,
      end_time: `${newBooking.end_date} ${newBooking.end_time}`,
      start_otp: newBooking.start_otp,
      booking_status: newBooking.booking_status,
      earnings: Number(newBooking.earnings) || 0,
      ride_status: newBooking.ride_status,
      remarks: newBooking.remarks,
    };
    try {
      const { error } = await supabase
        .from("zoomcar_bookings")
        .insert([bookingData]);
      if (error) throw error;
      alert("Booking added successfully!");
      setShowForm(false);
      fetchBookings();
      setNewBooking({
        mail_date: "",
        zoomcar_booking_id: "",
        customer_name: "",
        rentelo_booking_id: "",
        vehicle_number: "",
        vehicle_model: "",
        start_date: "",
        start_time: "",
        end_date: "",
        end_time: "",
        start_otp: "",
        booking_status: "Confirmed",
        earnings: "",
        ride_status: "Upcoming",
        remarks: "",
      });
    } catch (err) {
      console.error("Error adding booking:", err.message);
      alert("Failed to add booking");
    }
    setLoading(false);
  };
  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };
  const unique = (key) => [
    ...new Set(bookings.map((b) => b[key]).filter(Boolean)),
  ];
  const filteredBookings = bookings.filter((b) => {
    const dateMatch =
      !filters.bookingDate || b.start_time?.startsWith(filters.bookingDate);
    const modelMatch = !filters.model || b.vehicle_model === filters.model;
    const bookingStatusMatch =
      !filters.bookingStatus || b.booking_status === filters.bookingStatus;
    const rideStatusMatch =
      !filters.rideStatus || b.ride_status === filters.rideStatus;
    const searchMatch =
      !filters.search ||
      b.zoomcar_booking_id
        ?.toLowerCase()
        .includes(filters.search.toLowerCase()) ||
      b.customer_name?.toLowerCase().includes(filters.search.toLowerCase()) ||
      b.rentelo_booking_id
        ?.toLowerCase()
        .includes(filters.search.toLowerCase()) ||
      b.vehicle_number?.toLowerCase().includes(filters.search.toLowerCase());
    return (
      dateMatch && modelMatch && bookingStatusMatch && rideStatusMatch && searchMatch
    );
  });
  const totalEarnings = filteredBookings.reduce(
    (sum, b) => sum + (b.earnings || 0),
    0
  );
  return (
    <section
      className={`min-h-screen px-4 md:px-8 py-16 md:py-24 transition-colors duration-500 ${
        darkMode
          ? "bg-gradient-to-br from-black via-gray-900 to-red-950 text-white"
          : "bg-gradient-to-br from-gray-100 via-white to-gray-200 text-black"
      }`}
    >
      <div className="flex items-center justify-between mb-8 md:px-16 w-full gap-3">
        <div
          className={`flex justify-between items-center flex-1 font-semibold text-sm md:text-lg px-2 py-1 md:px-4 md:py-1 rounded-xl shadow-md ${
            darkMode ? "bg-red-600 text-white" : "bg-red-500 text-white"
          }`}
        >
          <span className="flex items-center gap-2 truncate">
            <FaRupeeSign /> Total Zoomcar Earnings
          </span>
          <span className="font-bold truncate">₹ {totalEarnings.toLocaleString()}</span>
        </div>
        <button
          onClick={() => setDarkMode(!darkMode)}
          className={`flex items-center gap-2 px-3 py-1 md:px-4 md:py-2 rounded-lg font-semibold text-xs md:text-sm transition ${
            darkMode
              ? "bg-zinc-100 text-black hover:bg-zinc-300"
              : "bg-gray-800 text-white hover:bg-gray-700"
          }`}
        >
          {darkMode ? <FaSun /> : <FaMoon />}
          <span>{darkMode ? "Light" : "Dark"}</span>
        </button>
      </div>
      <div className="flex flex-wrap md:flex-nowrap justify-between items-center mb-6 gap-2 text-xs md:text-base">
        <h2
          className={`text-sm md:text-xl font-semibold flex items-center gap-1 md:gap-2 border-b-2 pb-1 ${
            darkMode ? "text-blue-400 border-red-400" : "text-blue-700 border-red-600"
          }`}
        >
          <FaCarSide /> All Zoomcar Bookings
        </h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowForm(!showForm)}
            className={`flex items-center gap-1 md:gap-2 px-2 py-1 md:px-4 md:py-2 rounded-lg text-xs md:text-base transition ${
              darkMode
                ? "bg-sky-600 hover:bg-sky-700 text-white"
                : "bg-sky-500 hover:bg-sky-600 text-white"
            }`}
          >
            <FaPlusCircle /> {showForm ? "Close" : "Add Booking"}
          </button>
          <button
            onClick={() => setShowFilters((prev) => !prev)}
            className={`flex items-center gap-1 md:gap-2 px-2 py-1 md:px-4 md:py-2 rounded-lg text-xs md:text-base transition ${
              darkMode
                ? " text-white"
                : "text-black"
            }`}
          >
            <FaEllipsisV />
          </button>
        </div>
      </div>
      {showForm && (
  <form
    onSubmit={addBooking}
    className={`p-3 sm:p-4 md:p-6 rounded-xl mb-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6 ${
      darkMode ? "bg-gray-800" : "bg-gray-100"
    }`}
  >
    {[
      { label: "Mail / Booking Received", name: "mail_date", type: "datetime-local" },
      { label: "Zoomcar Booking ID", name: "zoomcar_booking_id" },
      { label: "Customer Name", name: "customer_name" },
      { label: "Rentelo Booking ID", name: "rentelo_booking_id" },
      { label: "Vehicle Number", name: "vehicle_number" },
      { label: "Vehicle Model", name: "vehicle_model" },
      { label: "Booking Start Date", name: "start_date", type: "date" },
      { label: "Booking Start Time", name: "start_time", type: "select", options: timeOptions },
      { label: "Booking End Date", name: "end_date", type: "date" },
      { label: "Booking End Time", name: "end_time", type: "select", options: timeOptions },
      { label: "Start OTP", name: "start_otp" },
      { label: "Booking Status", name: "booking_status", type: "select", options: ["Confirmed", "Cancelled by Host", "Cancelled by Guest", "Cancelled by Executive", "Others"] },
      { label: "Remarks", name: "remarks" },
      { label: "Zoomcar Earnings", name: "earnings", type: "number" },
      { label: "Ride Status", name: "ride_status", type: "select", options: ["Upcoming", "Ongoing", "Completed", "Cancelled"] },
    ].map((field) => (
      <div key={field.name} className="w-full">
        <label
          className={`block mb-1 text-xs sm:text-sm md:text-sm ${
            darkMode ? "text-gray-300" : "text-gray-700"
          }`}
        >
          {field.label}
        </label>
        {field.type === "select" ? (
          <select
            name={field.name}
            value={newBooking[field.name]}
            onChange={handleInput}
            className={`w-full px-2 sm:px-3 py-1 sm:py-2 rounded-md text-xs sm:text-sm outline-none focus:ring-2 ${
              darkMode
                ? "bg-gray-900 text-white focus:ring-red-500"
                : "bg-white text-black focus:ring-red-400"
            }`}
            required
          >
            <option value="">Select {field.label}</option>
            {field.options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        ) : (
          <input
            type={field.type || "text"}
            name={field.name}
            value={newBooking[field.name]}
            onChange={handleInput}
            className={`w-full px-2 sm:px-3 py-1 sm:py-2 rounded-md text-xs sm:text-sm outline-none focus:ring-2 ${
              darkMode
                ? "bg-gray-900 text-white focus:ring-red-500"
                : "bg-white text-black focus:ring-red-400"
            }`}
            required={field.name !== "start_otp" && field.name !== "remarks"}
          />
        )}
      </div>
    ))}
    <div className="sm:col-span-2 md:col-span-3 text-right mt-2">
      <button
        type="submit"
        disabled={loading}
        className={`px-4 sm:px-6 py-2 rounded-lg font-semibold text-xs sm:text-sm md:text-base ${
          darkMode
            ? "bg-red-600 hover:bg-red-700 text-white"
            : "bg-red-500 hover:bg-red-600 text-white"
        }`}
      >
        {loading ? "Saving..." : "Add Booking"}
      </button>
    </div>
  </form>
)}

    {showFilters && ( <div
        className={`p-3 sm:p-4 rounded-xl mb-5 shadow-md border flex flex-wrap gap-2 sm:gap-3 items-center justify-center text-sm sm:text-base ${
          darkMode ? "bg-gray-900 border-gray-700" : "bg-gray-100 border-gray-300"
        }`}
      >
      <input
        type="date"
        value={filters.bookingDate}
        onChange={(e) => handleFilterChange("bookingDate", e.target.value)}
        className={`px-2 py-1 rounded-lg w-full sm:w-auto outline-none ${
          darkMode
            ? "bg-gray-800 text-white"
            : "bg-white text-black border border-gray-300"
        }`}
      />
    <select
      value={filters.model}
      onChange={(e) => handleFilterChange("model", e.target.value)}
      className={`px-2 py-1 rounded-lg w-full sm:w-auto cursor-pointer ${
        darkMode
          ? "bg-gray-800 text-white"
          : "bg-white text-black border border-gray-300"
      }`}
    >
    <option value="">All Models</option>
    {unique("vehicle_model").map((m) => (
      <option key={m} value={m}>
        {m}
      </option>
    ))}
  </select>
  <select
    value={filters.bookingStatus}
    onChange={(e) => handleFilterChange("bookingStatus", e.target.value)}
    className={`px-2 py-1 rounded-lg w-full sm:w-auto cursor-pointer ${
      darkMode
        ? "bg-gray-800 text-white"
        : "bg-white text-black border border-gray-300"
    }`}
  >
    <option value="">All Booking Status</option>
    {unique("booking_status").map((bs) => (
      <option key={bs} value={bs}>
        {bs}
      </option>
    ))}
  </select>
  <select
    value={filters.rideStatus}
    onChange={(e) => handleFilterChange("rideStatus", e.target.value)}
    className={`px-2 py-1 rounded-lg w-full sm:w-auto cursor-pointer ${
      darkMode
        ? "bg-gray-800 text-white"
        : "bg-white text-black border border-gray-300"
    }`}
  >
    <option value="">All Ride Status</option>
    {unique("ride_status").map((rs) => (
      <option key={rs} value={rs}>
        {rs}
      </option>
    ))}
  </select>
  <div className="relative w-full sm:w-64">
    <FaSearch
      className={`absolute left-2 top-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}
    />
    <input
      type="text"
      placeholder="Search by Zoomcar ID, Customer, Rentelo ID, Vehicle No"
      value={filters.search}
      onChange={(e) => handleFilterChange("search", e.target.value)}
      className={`px-8 py-1 rounded-lg outline-none w-full ${
        darkMode
          ? "bg-gray-800 text-white"
          : "bg-white text-black border border-gray-300"
      }`}
    />
  </div>
  <button
    onClick={() =>
      setFilters({
        bookingDate: "",
        model: "",
        bookingStatus: "",
        rideStatus: "",
        search: "",
      })
    }
    className={`px-4 py-1 rounded-lg w-full sm:w-auto ${
      darkMode
        ? "bg-red-600 hover:bg-red-700 text-white"
        : "bg-red-500 hover:bg-red-600 text-white"
    }`}
      >
        Reset
      </button>
    </div>
    )}
      <div
        className={`overflow-x-auto rounded-xl shadow-lg border ${
          darkMode ? "border-gray-700" : "border-gray-300"
        }`}
      >
      {/* Desktop Table */}
<div className="hidden md:block overflow-x-auto rounded-xl shadow-lg border">
  <table
    className={`w-full text-xs md:text-sm border-collapse ${
      darkMode ? "border-gray-600" : "border-gray-300"
    }`}
  >
    <thead>
      <tr
        className={`border-b ${
          darkMode
            ? "bg-green-700 text-white border-gray-600"
            : "bg-green-600 text-white border-gray-300"
        }`}
      >
        {[
          "Booking Date",
          "Zoomcar ID",
          "Customer Name",
          "Rentelo ID",
          "Vehicle No",
          "Model",
          "Booking Start",
          "Booking End",
          "Start OTP",
          "Booking Status",
          "Earnings",
          "Ride Status",
        ].map((head) => (
          <th key={head} className="p-2 md:p-3 border">
            {head}
          </th>
        ))}
      </tr>
    </thead>
    <tbody>
      {filteredBookings.map((b) => (
        <React.Fragment key={b.id}>
          <tr
                  className={`text-center transition border-b ${
                    darkMode
                      ? "odd:bg-gray-800 even:bg-gray-900 hover:bg-gray-700 border-gray-600"
                      : "odd:bg-white even:bg-gray-100 hover:bg-gray-200 border-gray-300"
                  }`}
                >
                  <td className="p-2">
                    {b.mail_date
                      ? new Date(b.mail_date).toLocaleString()
                      : "-"}
                  </td>
                  <td className="p-2">
                    <div className="flex items-center gap-1 whitespace-nowrap">
                      <span className="truncate">{b.zoomcar_booking_id}</span>
                      <CopyButton text={b.zoomcar_booking_id} darkMode={darkMode} />
                    </div>
                  </td>
                  <td className="p-2">{b.customer_name}</td>
                  <td className="p-2">
                    <div className="flex items-center gap-1 whitespace-nowrap">
                      <span className="truncate">{b.rentelo_booking_id}{" "}</span>
                    <CopyButton text={b.rentelo_booking_id} darkMode={darkMode} />
                    </div>
                  </td>
                  <td className="p-2">
                    <div className="flex items-center gap-1 whitespace-nowrap">
                      <span className="truncate">
                    {b.vehicle_number}{" "}</span>
                    <CopyButton text={b.vehicle_number} darkMode={darkMode} />
                    </div>
                  </td>
                  <td className="p-2">{b.vehicle_model}</td>
                  <td className="p-2">{b.start_time}</td>
                  <td className="p-2">{b.end_time}</td>
                  <td className="p-2">
                    <button
                      onClick={() => toggleOTP(b.id)}
                      className={`text-sm md:text-base mx-auto ${
                        darkMode
                          ? "text-red-400 hover:text-red-200"
                          : "text-red-600 hover:text-red-800"
                      }`}
                    >
                      {showOTP[b.id] ? <FaRegEyeSlash /> : <FaRegEye />}
                    </button>
                    {showOTP[b.id] && (
                      <div
                        className={`mt-1 text-xs ${
                          darkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        {b.start_otp}
                      </div>
                    )}
                  </td>
                  <td className="p-2">
                    <select
                      value={b.booking_status}
                      onChange={async (e) => {
                        const newStatus = e.target.value;
                        const { error } = await supabase
                          .from("zoomcar_bookings")
                          .update({ booking_status: newStatus })
                          .eq("id", b.id);
                        if (error) alert("Failed to update booking status");
                        else
                          setBookings((prev) =>
                            prev.map((bk) =>
                              bk.id === b.id
                                ? { ...bk, booking_status: newStatus }
                                : bk
                            )
                          );
                      }}
                      className={`px-2 py-1 rounded-lg text-xs cursor-pointer ${
                        b.booking_status === "Confirmed"
                          ? "bg-green-600 text-white"
                          : b.booking_status.includes("Cancelled")
                          ? "bg-red-600 text-white"
                          : "bg-gray-500 text-white"
                      }`}
                    >
                      {[
                        "Confirmed",
                        "Cancelled by Host",
                        "Cancelled by Guest",
                        "Cancelled by Executive",
                        "Others",
                      ].map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-2 text-green-500 font-semibold">
                    <FaRupeeSign className="inline" /> {b.earnings}
                  </td>
                  <td className="p-2">
                    <select
                      value={b.ride_status}
                      onChange={async (e) => {
                        const newStatus = e.target.value;
                        const { error } = await supabase
                          .from("zoomcar_bookings")
                          .update({ ride_status: newStatus })
                          .eq("id", b.id);
                        if (error) alert("Failed to update ride status");
                        else
                          setBookings((prev) =>
                            prev.map((bk) =>
                              bk.id === b.id
                                ? { ...bk, ride_status: newStatus }
                                : bk
                            )
                          );
                      }}
                      className={`px-2 py-1 rounded-lg text-xs cursor-pointer ${
                        b.ride_status === "Upcoming"
                          ? "bg-blue-600 text-white"
                          : b.ride_status === "Ongoing"
                          ? "bg-yellow-600 text-white"
                          : b.ride_status === "Completed"
                          ? "bg-green-600 text-white"
                          : "bg-red-600 text-white"
                      }`}
                    >
                      {["Upcoming", "Ongoing", "Completed", "Cancelled"].map(
                        (opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        )
                      )}
                    </select>
                  </td>
                </tr>
                <tr
                  className={`text-xs text-start ${
                    darkMode
                      ? "bg-gray-700 text-gray-200 border-gray-600"
                      : "bg-gray-200 text-gray-800 border-gray-300"
                  }`}
                >
                  <td colSpan="12" className="p-2 border">
                    <span className="font-semibold">Remarks:</span>{" "}
                    {b.remarks || "-"}
                  </td>
                </tr>
        </React.Fragment>
      ))}
    </tbody>
  </table>
</div>

{/* Mobile Cards */}
<div className="md:hidden flex flex-col gap-4">
  {filteredBookings.map((b) => (
    <div
      key={b.id}
      className={`p-4 rounded-xl shadow-md border ${
        darkMode ? "bg-gray-900 border-gray-700" : "bg-gray-100 border-gray-300"
      }`}
    >
      <div className="flex justify-between items-center mb-2">
        <span className="font-semibold">Booking Date:</span>
        <span>{b.mail_date ? new Date(b.mail_date).toLocaleString() : "-"}</span>
      </div>
      <div className="flex justify-between items-center mb-2">
        <span className="font-semibold">Zoomcar ID:</span>
        <div className="flex items-center gap-1 flex-shrink-0">
          <span className="truncate">{b.zoomcar_booking_id}</span>
          <CopyButton text={b.zoomcar_booking_id} darkMode={darkMode} />
        </div>
      </div>

      <div className="flex justify-between items-center mb-2">
        <span className="font-semibold">Customer:</span>
        <span>{b.customer_name}</span>
      </div>
      <div className="flex justify-between items-center mb-2">
        <span className="font-semibold">Rentelo ID:</span>
        <div className="flex items-center gap-1 flex-shrink-0">
        <span className="truncate">{b.rentelo_booking_id}</span>
        <CopyButton text={b.rentelo_booking_id} darkMode={darkMode} />
        </div>
      </div>
      <div className="flex justify-between items-center mb-2">
        <span className="font-semibold">Vehicle:</span>
        <div className="flex items-center gap-1 flex-shrink-0">
        <span>{b.vehicle_number} ({b.vehicle_model})</span>
        <CopyButton text={b.vehicle_number} darkMode={darkMode} />
        </div>
      </div>
      <div className="flex justify-between items-center mb-2">
        <span className="font-semibold">Booking Start:</span>
        <span>{b.start_time}</span>
      </div>
      <div className="flex justify-between items-center mb-2">
        <span className="font-semibold">Booking End:</span>
        <span>{b.end_time}</span>
      </div>
      <div className="flex justify-between items-center mb-2">
        <span className="font-semibold">Start OTP:</span>
        <span>
          <button
            onClick={() => toggleOTP(b.id)}
            className={`text-sm ${
              darkMode ? "text-red-400 hover:text-red-200" : "text-red-600 hover:text-red-800"
            }`}
          >
            {showOTP[b.id] ? <FaRegEyeSlash /> : <FaRegEye />}
          </button>
          {showOTP[b.id] && (
            <div className={`mt-1 text-xs ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
              {b.start_otp}
            </div>
          )}
        </span>
      </div>
      <div className="flex justify-between items-center mb-2">
        <span className="font-semibold">Booking Status:</span>
        <select
          value={b.booking_status}
          onChange={async (e) => {
            const newStatus = e.target.value;
            const { error } = await supabase
              .from("zoomcar_bookings")
              .update({ booking_status: newStatus })
              .eq("id", b.id);
            if (!error) setBookings((prev) => prev.map((bk) => (bk.id === b.id ? { ...bk, booking_status: newStatus } : bk)));
          }}
          className={`px-2 py-1 rounded-lg text-xs cursor-pointer ${
            b.booking_status === "Confirmed"
              ? "bg-green-600 text-white"
              : b.booking_status.includes("Cancelled")
              ? "bg-red-600 text-white"
              : "bg-gray-500 text-white"
          }`}
        >
          {["Confirmed", "Cancelled by Host", "Cancelled by Guest", "Cancelled by Executive", "Others"].map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>
      <div className="flex justify-between items-center mb-2">
        <span className="font-semibold">Earnings:</span>
        <span className="text-green-500 font-semibold"><FaRupeeSign className="inline" /> {b.earnings}</span>
      </div>
      <div className="flex justify-between items-center mb-2">
        <span className="font-semibold">Ride Status:</span>
        <select
          value={b.ride_status}
          onChange={async (e) => {
            const newStatus = e.target.value;
            const { error } = await supabase
              .from("zoomcar_bookings")
              .update({ ride_status: newStatus })
              .eq("id", b.id);
            if (!error) setBookings((prev) => prev.map((bk) => (bk.id === b.id ? { ...bk, ride_status: newStatus } : bk)));
          }}
          className={`px-2 py-1 rounded-lg text-xs cursor-pointer ${
            b.ride_status === "Upcoming"
              ? "bg-blue-600 text-white"
              : b.ride_status === "Ongoing"
              ? "bg-yellow-600 text-white"
              : b.ride_status === "Completed"
              ? "bg-green-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          {["Upcoming", "Ongoing", "Completed", "Cancelled"].map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>
      <div>
        <span className="font-semibold">Remarks:</span> {b.remarks || "-"}
      </div>
    </div>
  ))}
</div>

      </div>
    </section>
  );
}
