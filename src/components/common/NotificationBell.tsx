// src/components/common/NotificationBell.tsx

'use client';

import React from "react";
import { FaBell } from "react-icons/fa";
import { useNotificationContext } from "@/contexts/NotificationContext"; // ✅ 올바른 컨텍스트 import
import type { Notification } from "@/types/notification"; // ✅ 통합된 타입 import

const NotificationBell: React.FC = () => {
  // ✅ Context에서 모든 상태와 함수를 가져옵니다. 로컬 상태는 필요 없습니다.
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    isBellOpen, 
    setIsBellOpen 
  } = useNotificationContext();

  // ✅ 알림 타입은 API 명세서에 따라 'ANALYSIS_COMPLETE', 'SENIOR_STATE_CHANGED' 등입니다.
  //    백엔드에서 보내주는 실제 값으로 필터링해야 합니다.
  //    여기서는 모든 알림을 보여주는 것으로 가정합니다. 필요시 아래 주석을 참고하여 필터링하세요.
  // const filteredNotifications = notifications.filter((n) => n.type === "ANALYSIS_COMPLETE");
  const allNotifications = notifications;

  const handleToggle = () => setIsBellOpen(!isBellOpen);

  const handleClick = (notification: Notification) => {
    // ✅ 읽지 않은 알림만 읽음 처리 요청
    if (!notification.is_read) {
      markAsRead(notification.notification_id);
    }
    // 링크가 있다면 해당 링크로 이동 (구현 필요 시)
    // if (notification.link) { router.push(notification.link); }
    setIsBellOpen(false); // 메뉴 닫기
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
      {isBellOpen && (
        <div className="absolute top-[calc(100%+10px)] right-0 w-[360px] bg-white border border-gray-200 rounded-xl shadow-lg z-50">
          <div className="px-4 py-2 border-b border-gray-100">
            <h4 className="text-sm font-semibold text-gray-700">알림</h4>
          </div>

          {allNotifications.length > 0 ? (
            <ul className="max-h-80 overflow-y-auto">
              {allNotifications.map((n) => (
                // ✅ key와 id를 notification_id로 수정
                <li
                  key={n.notification_id}
                  onClick={() => handleClick(n)}
                  className={`px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0 ${
                    !n.is_read ? "bg-blue-50" : "bg-white"
                  }`}
                >
                  <p className="text-gray-800 text-sm">{n.message}</p>
                  {/* ✅ 날짜 표시를 위해 id 대신 created_at 사용 */}
                  <small className="text-gray-500 text-xs">
                    {new Date(n.created_at).toLocaleString("ko-KR")}
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