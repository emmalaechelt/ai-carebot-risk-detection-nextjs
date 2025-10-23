'use client';

import React from "react";
import { FaBell } from "react-icons/fa";
import { useNotificationContext } from "../../contexts/NotificationContext"; // ✅ 수정된 import
import type { Notification } from "../../contexts/NotificationContext";

const NotificationBell: React.FC = () => {
  const { notifications, markAsRead } = useNotificationContext();
  const [isOpen, setIsOpen] = React.useState(false);

  // CSV 업로드 관련 알림만 필터링
  const csvNotifications = notifications.filter((n) => n.type === "csv_upload");

  // 읽지 않은 개수 계산
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleToggle = () => setIsOpen((prev) => !prev);

  const handleClick = (n: Notification) => {
    markAsRead(n.id);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block">
      {/* 🔔 벨 아이콘 */}
      <button
        onClick={handleToggle}
        className="relative bg-transparent border-none cursor-pointer p-2 text-gray-800 hover:text-blue-600 transition-colors"
      >
        <FaBell size={24} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* 알림 목록 */}
      {isOpen && (
        <div className="absolute top-[calc(100%+10px)] right-0 w-[360px] bg-white border border-gray-200 rounded-xl shadow-lg z-50">
          <div className="px-4 py-2 border-b border-gray-100">
            <h4 className="text-sm font-semibold text-gray-700">알림</h4>
          </div>

          {csvNotifications.length > 0 ? (
            <ul className="max-h-60 overflow-y-auto">
              {csvNotifications.map((n) => (
                <li
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={`px-4 py-2 text-sm cursor-pointer hover:bg-gray-50 transition ${
                    !n.is_read ? "bg-blue-50" : ""
                  }`}
                >
                  <p className="text-gray-800">{n.message}</p>
                  <small className="text-gray-500 text-xs">
                    {new Date(n.id).toLocaleString("ko-KR")}
                  </small>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-6 text-sm text-gray-500 text-center">
              새로운 알림이 없습니다.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;