import React from "react";
import { Link } from "react-router-dom";
import { FaCalendarCheck, FaBoxOpen, FaMoneyBillWave, FaCarSide } from "react-icons/fa";
import icon from "../assests/logo.png";

const Header = () => {
  return (
    <header className="w-full z-50 fixed top-0 left-0">
      <nav className="bg-black text-white px-4 py-3 flex justify-between items-center md:px-6">
        <Link to="/" className="flex items-center gap-3">
          <img src={icon} alt="Logo" className="w-28 h-auto" />
        </Link>
        <div className="flex gap-2 md:gap-3 text-[10px] md:text-xs">
          <Link
            to="/today-drops"
            className="flex items-center gap-1 md:gap-2 bg-sky-600 hover:bg-sky-700 px-2 py-1 md:px-2 md:py-1 rounded-xl transition-colors"
          >
            <FaCalendarCheck className="text-white text-[12px] md:text-base" />
            <span className="hidden sm:inline">Today Drops</span>
          </Link>
          <Link
            to="/pendingdrops"
            className="flex items-center gap-1 md:gap-2 bg-red-500 hover:bg-red-600 px-2 py-1 md:px-2 md:py-1 rounded-xl transition-colors"
          >
            <FaBoxOpen className="text-white text-[12px] md:text-base" />
            <span className="hidden sm:inline">Pending Drops</span>
          </Link>
          <Link
            to="/paypending"
            className="flex items-center gap-1 md:gap-2 bg-orange-500 hover:bg-orange-600  px-2 py-1 md:px-2 md:py-1 rounded-xl transition-colors animate-bounce"
          >
            <FaMoneyBillWave className="text-white text-[12px] md:text-base" />
            <span className="hidden sm:inline">Pending Payments</span>
          </Link>
          <Link
            to="/zoomcarbookings"
            className="flex items-center gap-1 md:gap-2 bg-green-600 hover:bg-green-700 px-2 py-1 md:px-2 md:py-1 rounded-xl transition-colors"
          >
            <FaCarSide className="text-white text-[12px] md:text-base" />
            <span className="hidden sm:inline">Zoomcar</span>
          </Link>
          <Link
            to="/zoomcarvehicles"
            className="flex items-center gap-1 md:gap-2 bg-green-900 hover:bg-green-400 px-2 py-1 md:px-2 md:py-1 rounded-xl transition-colors"
          >
            <FaCarSide className="text-white text-[12px] md:text-base" />
            <span className="hidden sm:inline">Zoomcar Vehicles</span>
          </Link>
        </div>
      </nav>
    </header>
  );
};

export default Header;
