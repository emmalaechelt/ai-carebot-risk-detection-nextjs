// src/components/common/EmergencyToast.tsx

'use client';

import { useRouter } from 'next/navigation';
import { FaBell } from 'react-icons/fa';
import { useNotificationContext } from '@/contexts/NotificationContext';
import type { Notification } from '@/types';

export default function EmergencyToast() {
  const router = useRouter();
  const { toastNotifications, clearToast } = useNotificationContext();

  const handleClick = (notification: Notification) => {
    if (notification.resource_id) {
      // ✅ 1. 404 에러 수정: 불필요한 '/main' 경로를 제거하여 올바른 상세 페이지로 이동시킵니다.
      router.push(`/analysis/${notification.resource_id}`);
    }
    clearToast(notification.notification_id);
  };

  if (toastNotifications.length === 0) {
    return null;
  }
  
  // ✅ 2. 가독성 개선: 메시지를 분리하기 위한 헬퍼 함수
  const formatMessage = (message: string): { line1: string; line2: string } => {
    const separator = "완료되었습니다.";
    const index = message.indexOf(separator);
    
    if (index === -1) {
      return { line1: message, line2: "" };
    }
    
    const line1 = message.substring(0, index + separator.length);
    const line2 = message.substring(index + separator.length).trim();
    
    return { line1, line2 };
  };

  return (
    <div className="fixed top-2 right-4 z-[100] flex flex-col items-end space-y-2">
      {toastNotifications.map(toast => {
        const { line1, line2 } = formatMessage(toast.message);
        
        return (
          <button 
            key={toast.notification_id} 
            onClick={() => handleClick(toast)}
            // ✅ 3. 너비 수정: 'w-full'을 'w-auto'로 변경하여 내용에 맞게 너비가 줄어들도록 합니다.
            className="w-auto flex items-start px-4 py-3 rounded-lg shadow-xl bg-red-100 border border-red-300 cursor-pointer text-left transition-transform transform hover:scale-105 animate-pulse"
          >
            <div className="flex-shrink-0 mr-4 mt-1 text-red-600">
              <FaBell size={20} />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-red-800">긴급 상황 발생</p>
              {/* ✅ 4. 줄 바꿈 처리: 분리된 메시지를 각각 다른 요소에 담아 줄 바꿈 효과를 줍니다. */}
              <div className="text-sm text-red-700 mt-1">
                <span>{line1}</span>
                {line2 && <span className="block">{line2}</span>}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}