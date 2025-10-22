import React from "react";
import { FaHeart } from "react-icons/fa";

function Footer() {
  return (
    <footer className="bg-black text-gray-300 px-6 py-3">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-gray-400">
          <p className="flex items-center gap-1">
            Made with <FaHeart className="text-red-500" /> in Bengaluru
          </p>
          <p>
            Copyright © AARIZ TECHNOLOGIES PRIVATE LIMITED. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
