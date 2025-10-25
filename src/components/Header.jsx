import React from "react";
import { Link } from "react-router-dom";
import { FaCalendarCheck, FaBoxOpen, FaMoneyBillWave, FaCarSide } from "react-icons/fa";
import logo from "../assests/companylogo.webp";

const Header = () => {
  return (
    <header className="w-full z-50 fixed top-0 left-0">
      <nav className="bg-black text-white px-4 py-3 flex justify-between items-center md:px-6" role="navigation" aria-label="Main Navigation">
        <Link to="/" aria-label="Home" className="flex items-center gap-3">
          <img
            src={logo}
            alt="Logo"
            width={107}
            height={20}
            className="w-[107px] h-auto"
            loading="lazy"
          />
        </Link>
        <div className="flex gap-2 md:gap-3 text-[10px] md:text-xs">
          <Link
            to="/today-drops"
            aria-label="Navigate to Today Drops"
            className="flex items-center gap-1 md:gap-2 bg-sky-700 hover:bg-sky-800 text-white px-2 py-1 md:px-2 md:py-1 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
          >
            <FaCalendarCheck className="text-white text-[12px] md:text-base" aria-hidden="true" />
            <span className="hidden sm:inline">Today Drops</span>
          </Link>
          <Link
            to="/pendingdrops"
            aria-label="Navigate to Pending Drops"
            className="flex items-center gap-1 md:gap-2 bg-red-700 hover:bg-red-800 text-white px-2 py-1 md:px-2 md:py-1 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            <FaBoxOpen className="text-white text-[12px] md:text-base" aria-hidden="true" />
            <span className="hidden sm:inline">Pending Drops</span>
          </Link>
          <Link
            to="/paypending"
            aria-label="Navigate to Pending Payments"
            className="flex items-center gap-1 md:gap-2 bg-orange-700 hover:bg-orange-800 text-white px-2 py-1 md:px-2 md:py-1 rounded-xl transition-colors animate-bounce focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
          >
            <FaMoneyBillWave className="text-white text-[12px] md:text-base" aria-hidden="true" />
            <span className="hidden sm:inline">Pending Payments</span>
          </Link>
          <Link
            to="/zoomcarbookings"
            aria-label="Navigate to Zoomcar Bookings"
            className="flex items-center gap-1 md:gap-2 bg-green-700 hover:bg-green-800 text-white px-2 py-1 md:px-2 md:py-1 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            <FaCarSide className="text-white text-[12px] md:text-base" aria-hidden="true" />
            <span className="hidden sm:inline">Zoomcar</span>
          </Link>
          <Link
            to="/zoomcarvehicles"
            aria-label="Navigate to Zoomcar Vehicles"
            className="flex items-center gap-1 md:gap-2 bg-green-900 hover:bg-green-700 text-white px-2 py-1 md:px-2 md:py-1 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            <FaCarSide className="text-white text-[12px] md:text-base" aria-hidden="true" />
            <span className="hidden sm:inline">Zoomcar Vehicles</span>
          </Link>
        </div>
      </nav>
    </header>
  );
};

export default Header;
