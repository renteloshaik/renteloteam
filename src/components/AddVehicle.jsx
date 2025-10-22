import React, { useState } from "react";
import { supabase } from "../supabaseClient";

export default function AddVehicle({ onAdded, darkMode }) {
  const [loading, setLoading] = useState(false);
  const [newVehicle, setNewVehicle] = useState({
    vehicle_number: "",
    vehicle_model: "",
    vehicle_location: "",
    pause_start: null,
    pause_end: null,
    pause_done_by: "",
    block_status: "Active",
    remarks: "",
  });
  const handleInput = (e) => {
    const { name, value } = e.target;
    setNewVehicle((prev) => ({ ...prev, [name]: value }));
  };
  const addVehicle = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase
        .from("zoomcar_vehicles")
        .insert([newVehicle])
        .select();
      if (error) throw error;
      setNewVehicle({
        vehicle_number: "",
        vehicle_model: "",
        vehicle_location: "",
        pause_start: null,
        pause_end: null,
        pause_done_by: "",
        block_status: "Active",
        remarks: "",
      });
      if (onAdded) onAdded();
    } catch (err) {
      console.error(err);
      alert("Failed to add vehicle. Check console for details.");
    }
    setLoading(false);
  };
  const inputClass = `w-full px-2 py-2 rounded-md transition-colors ${
    darkMode ? "bg-gray-900 text-white" : "bg-white text-gray-900 border border-gray-300"
  }`;
  const labelClass = `block mb-1 text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`;
  const buttonClass = `px-4 py-2 rounded-lg font-semibold transition-colors ${
    darkMode ? "bg-red-600 hover:bg-red-700 text-white" : "bg-red-500 hover:bg-red-600 text-white"
  }`;
  return (
    <form
      onSubmit={addVehicle}
      className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 p-4 md:p-6 rounded-xl transition-colors ${
        darkMode ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-900"
      }`}
    >
      <div>
        <label className={labelClass}>Vehicle Number</label>
        <input
          type="text"
          name="vehicle_number"
          value={newVehicle.vehicle_number}
          onChange={handleInput}
          placeholder="Enter vehicle number"
          className={inputClass}
          required
        />
      </div>
      <div>
        <label className={labelClass}>Vehicle Model</label>
        <input
          type="text"
          name="vehicle_model"
          value={newVehicle.vehicle_model}
          onChange={handleInput}
          placeholder="Enter vehicle model"
          className={inputClass}
          required
        />
      </div>
      <div>
        <label className={labelClass}>Vehicle Location</label>
        <select
          name="vehicle_location"
          value={newVehicle.vehicle_location}
          onChange={handleInput}
          className={inputClass}
          required
        >
          <option value="">Select Location</option>
          <option value="BTM Layout">BTM Layout</option>
          <option value="Marathahalli">Marathahalli</option>
        </select>
      </div>
      <div className="sm:col-span-2 md:col-span-3 grid grid-cols-3 gap-3">
        <div className="col-span-1">
          <label className={labelClass}>Block Status</label>
          <select
            name="block_status"
            value={newVehicle.block_status}
            onChange={handleInput}
            className={inputClass}
          >
            <option value="Active">Active</option>
            <option value="Block">Block</option>
          </select>
        </div>
        <div className="col-span-2">
          <label className={labelClass}>Remarks</label>
          <input
            type="text"
            name="remarks"
            value={newVehicle.remarks}
            onChange={handleInput}
            placeholder="Enter remarks"
            className={inputClass}
          />
        </div>
      </div>
      <div className="sm:col-span-2 md:col-span-3 text-right mt-2">
        <button type="submit" disabled={loading} className={buttonClass}>
          {loading ? "Saving..." : "Add Vehicle"}
        </button>
      </div>
    </form>
  );
}
