// src/components/layout/Sidebar.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, ReactNode } from "react";

interface MenuItem {
  label: string;
  icon?: string;
  href?: string;
  children?: MenuItem[];
}

export default function Sidebar() {
  const pathname = usePathname();
  const [openSubMenus, setOpenSubMenus] = useState<{ [key: string]: boolean }>({});

  const toggleSubMenu = (label: string) => {
    setOpenSubMenus(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const menuItems: MenuItem[] = [
    { label: "전체 현황", icon: "🕧", href: "/main" },
    { label: "이용자 관리", icon: "👨‍👩‍👧‍👦", href: "/main/users/view" },
    { label: "전체 분석결과", icon: "📋", href: "/main/analysis" },
    { label: "설정", icon: "⚙", href: "/main/setting" },
  ];

  const renderMenu = (items: MenuItem[], isSubMenu = false): ReactNode => (
    <ul className={`${isSubMenu ? "ml-4 mt-1 text-sm space-y-1" : "space-y-2 text-gray-700"}`}>
      {items.map(item => {
        const isActive = item.href && pathname === item.href;
        return (
          <li key={item.label}>
            {item.children ? (
              <div>
                <button
                  onClick={() => toggleSubMenu(item.label)}
                  className="flex items-center justify-between w-full px-2 py-2 font-medium text-gray-700 hover:text-orange-500 rounded-lg"
                >
                  <span className="flex items-center space-x-2">
                    {item.icon && <span>{item.icon}</span>}
                    <span>{item.label}</span>
                  </span>
                  <span className="transform transition-transform duration-200">
                    {openSubMenus[item.label] ? "▲" : "▼"}
                  </span>
                </button>
                {openSubMenus[item.label] && renderMenu(item.children, true)}
              </div>
            ) : (
              <Link
                href={item.href || "#"}
                className={`flex items-center space-x-2 px-2 py-2 rounded-lg transition
                ${isActive ? "bg-orange-100 text-orange-600 font-semibold" : "hover:bg-orange-50 hover:text-orange-500"}`}
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
    <aside className="w-64 bg-white border-r flex flex-col shadow-sm">
      <div className="flex items-center border-b h-16 px-4">
        <Image
          src="/img/grandparents.png"
          alt="조부모 이모지"
          width={40}
          height={40}
          className="w-10 h-auto"
        />
        <span className="ml-2 font-bold text-lg text-black whitespace-nowrap">
          시니어 돌봄 관제시스템
        </span>
      </div>
      <nav className="flex-1 px-4 py-6">{renderMenu(menuItems)}</nav>
    </aside>
  );
}