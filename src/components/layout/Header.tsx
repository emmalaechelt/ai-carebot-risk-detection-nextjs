"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import NotificationBell from "@/components/common/NotificationBell";

interface HeaderProps {
  username: string;
}

export default function Header({ username }: HeaderProps) {
  const { logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setIsDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="flex items-center justify-between h-16 px-6 bg-white border-b border-gray-200">
      {/* 좌측 여백 */}
      <div></div>

      <div ref={dropdownRef} className="relative flex items-center space-x-2">
        <NotificationBell /> {/* 🔔 알림 */}
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center space-x-2 border border-gray-300 rounded-lg px-3 py-2 font-medium text-black hover:bg-gray-50 transition cursor-pointer"
        >
          <span>👮</span>
          <span>{username}</span>
        </button>

        <div
          className={`absolute top-full right-0 mt-2 w-36 bg-white border border-gray-200 rounded-lg shadow-xl z-10
            transform transition-all duration-200 origin-top-right ${isDropdownOpen
              ? "opacity-100 scale-100 translate-y-0"
              : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
            }`}
        >
          <button
            onClick={logout}
            className="block w-full text-center px-4 py-2 text-sm text-red-600 hover:bg-gray-50 rounded-lg font-medium cursor-pointer"
          >
            로그아웃
          </button>
        </div>
      </div>
    </header>
  );
}