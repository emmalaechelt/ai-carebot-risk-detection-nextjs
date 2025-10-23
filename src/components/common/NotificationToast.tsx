'use client';

import React from 'react'; // useEffect를 import에서 제거했습니다.
import { FaTimes, FaBell } from 'react-icons/fa';
import type { Notification } from '@/types/notification';

interface NotificationToastProps {
  notification: Notification;
  onClose: () => void;
}

const NotificationToast: React.FC<NotificationToastProps> = ({ notification, onClose }) => {
  // ✅ 5초 후에 자동으로 닫히던 useEffect 훅을 완전히 삭제했습니다.

  // 위험도에 따라 스타일 결정
  const isEmergency = notification.message.toUpperCase().includes('EMERGENCY');
  const bgColor = isEmergency ? 'bg-red-500' : 'bg-yellow-500';
  const iconColor = isEmergency ? 'text-red-100' : 'text-yellow-100';
  const textColor = 'text-white';

  return (
    <div
      className={`fixed top-5 right-5 z-[100] w-full max-w-sm p-4 ${bgColor} ${textColor} rounded-lg shadow-lg flex items-start animate-fade-in-down`}
    >
      <div className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full ${iconColor} bg-white/20`}>
        <FaBell size={20} />
      </div>
      <div className="ml-3 flex-1">
        <p className="text-sm font-semibold">
          {isEmergency ? '긴급 알림' : '주의 알림'}
        </p>
        <p className="text-sm mt-1">{notification.message}</p>
      </div>
      <button
        onClick={onClose} // ✅ 이 버튼을 클릭해야만 onClose 함수가 호출됩니다.
        className={`ml-3 -mr-1 -mt-1 p-1 rounded-md ${textColor} hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white`}
      >
        <FaTimes size={18} />
      </button>
    </div>
  );
};

export default NotificationToast;