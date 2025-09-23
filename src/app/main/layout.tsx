"use client";

import Image from "next/image";
import Link from "next/link";
import { ReactNode, useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";

interface MainLayoutProps {
  children?: ReactNode;
}

interface MenuItem {
  label: string;
  icon?: string;
  href?: string;
  children?: MenuItem[];
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [username, setUsername] = useState<string>("OOO");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [openSubMenus, setOpenSubMenus] = useState<{ [key: string]: boolean }>({});
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleSubMenu = (label: string) => {
    setOpenSubMenus((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  const menuItems: MenuItem[] = [
    { label: "전체 현황", icon: "🕧", href: "/main" },
    {
      label: "이용자",
      icon: "👨‍👩‍👧‍👦",
      children: [
        { label: "조회", href: "/main/users/view" },
        { label: "등록 / 수정", href: "/main/users/register" },
      ],
    },
    { label: "전체 분석결과", icon: "📋", href: "/main/analysis" },
    { label: "설정", icon: "⚙", href: "/main/setting" },
  ];

  const renderMenu = (items: MenuItem[], isSubMenu = false) => (
    <ul className={`${isSubMenu ? "ml-4 mt-1 text-sm space-y-1" : "space-y-2 text-gray-700"}`}>
      {items.map((item) => {
        const isActive = item.href && pathname === item.href;
        return (
          <li key={item.label}>
            {item.children ? (
              <div>
                <button
                  onClick={() => toggleSubMenu(item.label)}
                  className="flex items-center justify-between w-full px-1 py-1 font-medium text-gray-700 hover:text-orange-500"
                >
                  {item.icon && <span>{item.icon}</span>}
                  <span>{item.label}</span>
                  <span>{openSubMenus[item.label] ? "▲" : "▼"}</span>
                </button>
                {openSubMenus[item.label] && renderMenu(item.children, true)}
              </div>
            ) : (
              <Link
                href={item.href || "#"}
                className={`flex items-center space-x-2 px-1 py-1 rounded-lg transition 
                  ${isActive ? "bg-orange-100 text-orange-600 font-semibold" : "hover:text-orange-500"}`}
              >
                {item.icon && <span>{item.icon}</span>}
                <span>{item.label}</span>
              </Link>
            )}
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className="flex h-screen bg-gray-100">
      {/* 사이드바 */}
      <aside className="w-45 bg-white border-r flex flex-col">
        <div className="flex items-center border-b h-16 px-4">
          <Image src="/img/logo.jpg" alt="대전시 로고" width={40} height={40} className="w-10 h-auto" />
          <span className="ml-2 font-bold text-lg text-black whitespace-nowrap">
            대전시 시니어 돌봄 관제시스템
          </span>
        </div>
        <nav className="flex-1 px-4 py-6">{renderMenu(menuItems)}</nav>
      </aside>

      {/* 메인 영역 */}
      <main className="flex-1 flex flex-col">
        <header className="flex items-center justify-end h-16 px-6 bg-white border-b border-gray-300">
          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center space-x-2 border border-amber-600 rounded-xl px-3 py-2 font-medium text-black hover:bg-gray-100 transition"
            >
              <span>👮</span>
              <span>관리자 {username}</span>
            </button>

            <div
              className={`absolute top-full right-0 mt-2 w-36 bg-white border border-gray-300 rounded-lg shadow-md transform transition-all duration-200 origin-top-right
                ${isDropdownOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 -translate-y-2 pointer-events-none"}`}
            >
              <button className="block w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100 rounded-lg">
                로그아웃
              </button>
            </div>
          </div>
        </header>

        {/* 페이지별 내용 */}
        <div className="flex-1 p-6 overflow-auto space-y-6">{children}</div>
      </main>
    </div>
  );
}
