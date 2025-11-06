'use client';

import React from 'react';
import { useNotificationContext } from '@/contexts/NotificationContext';
import type { Notification } from '@/types';

export default function EmergencyToast() {
  const { toastNotifications, clearToast } = useNotificationContext();

  return (
    <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50">
      {toastNotifications.map((n: Notification) => (
        <div
          key={n.notification_id}
          className="bg-red-500 text-white p-4 rounded shadow cursor-pointer"
          onClick={() => clearToast(n.notification_id)}
        >
          <p className="font-bold">{n.message}</p>
          <small>{new Date(n.created_at).toLocaleString('ko-KR')}</small>
        </div>
      ))}
    </div>
  );
}