'use client';

import React from "react";
import { useRouter } from "next/navigation";
import { FaBell } from "react-icons/fa";
import { useNotificationContext } from "@/contexts/NotificationContext";
import type { Notification } from "@/types/notification";

const NotificationBell: React.FC = () => {
  const router = useRouter();

  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    isBellOpen, 
    setIsBellOpen 
  } = useNotificationContext();

  const handleToggle = () => setIsBellOpen(!isBellOpen);

  // ✅ 3. 알림 항목 클릭 시 실행될 핸들러 함수를 수정합니다.
  const handleClick = (notification: Notification) => {
    // 읽지 않은 알림이라면 읽음 상태로 변경합니다.
    if (!notification.is_read) {
      markAsRead(notification.notification_id);
    }

    // [핵심 로직] 알림 타입에 따라 적절한 페이지로 이동시킵니다.
    switch (notification.type) {
      case 'ANALYSIS_COMPLETE':
        // 알림 타입이 '분석 완료'일 경우, resource_id를 사용하여 분석 상세 페이지로 이동합니다.
        router.push(`/main/analysis/${notification.resource_id}`);
        break;
      
      case 'SENIOR_STATE_CHANGED':
        // 예시: 알림 타입이 '시니어 상태 변경'일 경우, 해당 시니어 상세 페이지로 이동할 수 있습니다.
        // 프로젝트의 URL 구조에 맞게 경로를 설정하세요. (예: /main/users/view/[id])
        // router.push(`/main/users/view/${notification.resource_id}`);
        console.log(`Senior state changed for senior ID: ${notification.resource_id}. Navigation not implemented yet.`);
        break;

      default:
        // 다른 타입의 알림은 페이지 이동 없이 콘솔에 로그만 남깁니다.
        console.log(`Navigation is not defined for notification type: ${notification.type}`);
        break;
    }

    // 페이지 이동 후, 벨 메뉴를 닫습니다.
    setIsBellOpen(false);
  };

  return (
    <div className="relative inline-block">
      {/* 벨 아이콘 */}
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

          {notifications.length > 0 ? (
            <ul className="max-h-80 overflow-y-auto">
              {notifications.map((n) => (
                <li
                  key={n.notification_id}
                  onClick={() => handleClick(n)} // 수정된 핸들러를 연결합니다.
                  className={`px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0 ${
                    !n.is_read ? "bg-blue-50" : "bg-white"
                  }`}
                >
                  <p className="text-gray-800 text-sm">{n.message}</p>
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