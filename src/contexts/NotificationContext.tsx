'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import type { Notification } from '@/types/notification';
import api from '@/lib/api';

interface NotificationContextProps {
  notifications: Notification[];
  unreadCount: number;
  toastNotifications: Notification[];
  markAsRead: (notificationId: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearNotifications: () => void;
  clearToast: (notificationId: number) => void;
}

const NotificationContext = createContext<NotificationContextProps | undefined>(undefined);

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotificationContext must be used within NotificationProvider');
  return context;
};

interface Props {
  children: ReactNode;
}

export const NotificationProvider: React.FC<Props> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [toastNotifications, setToastNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

  useEffect(() => {
    if (!API_BASE_URL) return;

    const controller = new AbortController();
    const SSE_URL = `${API_BASE_URL}/notifications/subscribe`;

    fetchEventSource(SSE_URL, {
      signal: controller.signal,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')?.replace(/"/g, '') || ''}`,
      },
      onopen: async (res) => {
        if (res.ok) {
          try {
            const response = await api.get<Notification[]>('/notifications');
            setNotifications(response.data);
            setUnreadCount(response.data.filter(n => !n.is_read).length);
          } catch (e) {
            console.error('Failed to fetch notifications:', e);
          }
        }
      },
      onmessage: (event) => {
        const data = event.data;
        if (!data) return;

        try {
          // JSON 형식으로 파싱 시도
          const parsed = JSON.parse(data);

          if (
            typeof parsed === 'object' &&
            parsed !== null &&
            'notification_id' in parsed &&
            'type' in parsed
          ) {
            const newNotification = parsed as Notification;

            setNotifications(prev => [newNotification, ...prev]);
            if (!newNotification.is_read) setUnreadCount(prev => prev + 1);
            if (newNotification.type === 'ANALYSIS_COMPLETE') {
              setToastNotifications(prev => [...prev, newNotification]);
            }
          } else {
            console.warn('Received SSE message in unexpected format:', parsed);
          }
        } catch {
          // JSON 아닌 일반 메시지는 그냥 로그
          console.log('SSE message (non-JSON):', data);
        }
      },
      onerror: (err) => {
        if (err instanceof Error && err.name === 'AbortError') return;
        console.error('SSE error, reconnecting...', err);
      },
    });

    return () => controller.abort();
  }, [API_BASE_URL]);

  const markAsRead = async (notificationId: number) => {
    const target = notifications.find(n => n.notification_id === notificationId);
    if (!target || target.is_read) return;

    try {
      await api.post(`/notifications/${notificationId}/read`);
      setNotifications(prev =>
        prev.map(n => n.notification_id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const clearNotifications = () => setNotifications([]);
  const clearToast = (notificationId: number) => {
    setToastNotifications(prev => prev.filter(n => n.notification_id !== notificationId));
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      toastNotifications,
      markAsRead,
      markAllAsRead,
      clearNotifications,
      clearToast
    }}>
      {children}
    </NotificationContext.Provider>
  );
};