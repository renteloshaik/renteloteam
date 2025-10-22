import React, { useState } from "react";
import { FaCarSide, FaPlusCircle, FaPauseCircle, FaSun, FaMoon } from "react-icons/fa";
import AllVehicles from "./AllVehicles";
import AddVehicle from "./AddVehicle";
import PauseVehicle from "./PauseVehicle";

export default function ZoomcarDashboard() {
  const [activeTab, setActiveTab] = useState("all");
  const [reloadVehicles, setReloadVehicles] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  return (
    <section
      className={`px-4 md:px-8 py-16 md:py-24 min-h-screen transition-colors ${
        darkMode
          ? "bg-gradient-to-br from-black via-gray-900 to-red-950 text-white"
          : "bg-gradient-to-br from-gray-100 via-gray-200 to-green-100 text-gray-900"
      }`}
    >
      <div className="flex items-center justify-end mb-8">
        <button
          onClick={() => setDarkMode(!darkMode)}
          className={`flex items-center gap-2 px-3 py-1 md:px-4 md:py-2 rounded-lg font-semibold text-xs md:text-sm transition ml-4 ${
            darkMode
              ? "bg-yellow-500 text-black hover:bg-yellow-400"
              : "bg-gray-800 text-white hover:bg-gray-700"
          }`}
        >
          {darkMode ? <FaSun /> : <FaMoon />} {darkMode ? "Light" : "Dark"}
        </button>
      </div>
      <div className="flex justify-center gap-2 sm:gap-3 mb-10 flex-wrap">
      <button
        onClick={() => setActiveTab("all")}
        className={`px-2 sm:px-4 py-1 sm:py-2 rounded-lg flex items-center gap-1 sm:gap-2 text-xs sm:text-sm transition-all ${
          activeTab === "all"
            ? "bg-green-700 text-white"
            : darkMode
            ? "bg-gray-800 hover:bg-gray-700 text-gray-300"
            : "bg-gray-200 hover:bg-gray-300 text-gray-800"
        }`}
      >
        <FaCarSide className="text-sm sm:text-base" /> All Vehicles
      </button>
      <button
        onClick={() => setActiveTab("add")}
        className={`px-2 sm:px-4 py-1 sm:py-2 rounded-lg flex items-center gap-1 sm:gap-2 text-xs sm:text-sm transition-all ${
          activeTab === "add"
            ? "bg-green-700 text-white"
            : darkMode
            ? "bg-gray-800 hover:bg-gray-700 text-gray-300"
            : "bg-gray-200 hover:bg-gray-300 text-gray-800"
        }`}
      >
        <FaPlusCircle className="text-sm sm:text-base" /> Add Vehicle
      </button>
      <button
        onClick={() => setActiveTab("pause")}
        className={`px-2 sm:px-4 py-1 sm:py-2 rounded-lg flex items-center gap-1 sm:gap-2 text-xs sm:text-sm transition-all ${
          activeTab === "pause"
            ? "bg-green-700 text-white"
            : darkMode
            ? "bg-gray-800 hover:bg-gray-700 text-gray-300"
            : "bg-gray-200 hover:bg-gray-300 text-gray-800"
        }`}
      >
        <FaPauseCircle className="text-sm sm:text-base" /> Pause Vehicle
      </button>
    </div>
      <div>
        {activeTab === "all" && <AllVehicles key={reloadVehicles ? "reload" : "all"} darkMode={darkMode} />}
        {activeTab === "add" && <AddVehicle onAdded={() => setReloadVehicles(!reloadVehicles)} darkMode={darkMode} />}
        {activeTab === "pause" && <PauseVehicle darkMode={darkMode} />}
      </div>
    </section>
  );
}
