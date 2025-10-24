'use client';

import React from 'react';
import { FaTimes, FaBell } from 'react-icons/fa';
import type { Notification } from '@/types/notification';

interface NotificationToastProps {
  notification: Notification;
  onClose: () => void;
}

const NotificationToast: React.FC<NotificationToastProps> = ({ notification, onClose }) => {

  // ✅ [수정] 색상과 제목을 결정하는 로직
  const messageUpper = notification.message.toUpperCase();

  const bgColor = 'bg-red-500';
  const iconColor = 'text-red-100';
  const textColor = 'text-white';
  const title = '긴급 알림';

  return (
    <div
      className={`relative w-full max-w-sm p-4 ${bgColor} ${textColor} rounded-lg shadow-lg flex items-start animate-fade-in-down`}
    >
      <div className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full ${iconColor} bg-white/20`}>
        <FaBell size={20} />
      </div>
      <div className="ml-3 flex-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-sm mt-1">{notification.message}</p>
      </div>
      <button
        onClick={onClose}
        className={`ml-3 -mr-1 -mt-1 p-1 rounded-md ${textColor} hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white`}
      >
        <FaTimes size={18} />
      </button>
    </div>
  );
};

export default NotificationToast;