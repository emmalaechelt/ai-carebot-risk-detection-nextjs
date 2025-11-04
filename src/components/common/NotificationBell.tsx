'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { FaBell, FaTrashAlt, FaCheckDouble } from 'react-icons/fa';
import { useNotificationContext } from '@/contexts/NotificationContext';
import type { Notification } from '@/types/notification';

export default function NotificationBell() {
  const router = useRouter();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications } = useNotificationContext();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const toggleOpen = () => setIsOpen(prev => !prev);

  const handleClick = async (notification: Notification) => {
    if (!notification.is_read) await markAsRead(notification.notification_id);

    switch (notification.type) {
      case 'ANALYSIS_COMPLETE':
        router.push(`/main/analysis/${notification.resource_id}`);
        break;
      case 'SENIOR_STATE_CHANGED':
        router.push(`/main/senior/${notification.resource_id}`);
        break;
      default:
        console.log(`Navigation not defined for type: ${notification.type}`);
        break;
    }
    setIsOpen(false);
  };

  // 클릭 외부에서 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button onClick={toggleOpen} className="relative bg-transparent border-none cursor-pointer p-2 text-gray-800 hover:text-blue-600 transition-colors">
        <FaBell size={24} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-[calc(100%+10px)] right-0 w-[360px] bg-white border border-gray-200 rounded-xl shadow-lg z-50">
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
            <h4 className="text-sm font-semibold text-gray-700">알림</h4>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button onClick={markAllAsRead} className="text-xs text-blue-600 hover:underline flex items-center gap-1 cursor-pointer">
                  <FaCheckDouble size={12} /> 모두 읽음
                </button>
              )}
              {notifications.length > 0 && (
                <button onClick={clearNotifications} className="text-xs text-red-400 hover:underline flex items-center gap-1 cursor-pointer">
                  <FaTrashAlt size={12} /> 전체 삭제
                </button>
              )}
            </div>
          </div>

          {notifications.length > 0 ? (
            <ul className="max-h-80 overflow-y-auto">
              {notifications.map(n => (
                <li
                  key={n.notification_id}
                  onClick={() => handleClick(n)}
                  className={`px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0 ${
                    !n.is_read
                      ? n.type === 'ANALYSIS_COMPLETE'
                        ? 'bg-blue-50'
                        : 'bg-gray-100'
                      : 'bg-white'
                  }`}
                >
                  <p className="text-gray-800 text-sm">{n.message}</p>
                  <small className="text-gray-500 text-xs">{new Date(n.created_at).toLocaleString('ko-KR')}</small>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-6 text-sm text-gray-500 text-center">새로운 알림이 없습니다.</div>
          )}
        </div>
      )}
    </div>
  );
}