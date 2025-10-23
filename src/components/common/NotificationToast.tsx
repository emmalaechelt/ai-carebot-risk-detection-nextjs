// /components/notifications/NotificationToast.tsx
'use client';

import type { Notification } from "../../types/notification";

interface Props {
  notification: Notification;
}

// 이 컴포넌트는 react-toastify의 내용물로 렌더링됩니다.
export default function NotificationToast({ notification }: Props) {
  return (
    <div>
      <strong className="flex items-center text-base font-bold">🚨 긴급 알림</strong>
      <div className="mt-1 text-sm">{notification.message}</div>
      <p className="text-xs text-right text-gray-200 mt-2">(클릭 시 이동)</p>
    </div>
  );
}