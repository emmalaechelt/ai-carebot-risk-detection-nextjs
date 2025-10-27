'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import type { Notification } from '@/types/notification';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: number) => void;
  isBellOpen: boolean;
  setIsBellOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isBellOpen, setIsBellOpen] = useState(false);

  useEffect(() => {
    if (isLoading || !isAuthenticated) return;
    if (!API_BASE_URL) {
      console.error("환경 변수 'NEXT_PUBLIC_API_BASE_URL'가 설정되지 않았습니다.");
      return;
    }

    const controller = new AbortController();

    fetchEventSource(`${API_BASE_URL}/notifications/subscribe`, {
      signal: controller.signal,
      headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}` },
      onopen: async (res) => {
        if (res.ok) {
          try {
            const response = await api.get<Notification[]>('/notifications');
            setNotifications(response.data);
            setUnreadCount(response.data.filter(n => !n.is_read).length);
          } catch (e) {
            console.error("초기 알림 목록 동기화 실패:", e);
          }
        } else {
          console.error(`SSE Auth Error: Status ${res.status}.`);
          controller.abort();
        }
      },
      onmessage: (event) => {
        if (event.event === 'notification') {
          const newNotification: Notification = JSON.parse(event.data);
          setNotifications(prev => [newNotification, ...prev]);
          if (!newNotification.is_read) setUnreadCount(prev => prev + 1);
        }
      },
      onerror: (err) => {
        console.error("SSE stream error.", err);
        controller.abort();
      }
    });
    return () => controller.abort();
  }, [isLoading, isAuthenticated]);

  const markAsRead = async (id: number) => {
    const target = notifications.find(n => n.notification_id === id);
    if (!target || target.is_read) return;
    try {
      await api.post(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.notification_id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("알림 읽음 처리 실패:", error);
    }
  };

  const value = { notifications, unreadCount, markAsRead, isBellOpen, setIsBellOpen };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
};