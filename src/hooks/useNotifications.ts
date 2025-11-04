// src/hooks/useNotifications.ts
'use client';

import { useState, useEffect } from 'react';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import type { Notification } from '@/types/notification';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export const useNotifications = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [toastNotifications, setToastNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (isLoading || !isAuthenticated) return;
    if (!API_BASE_URL) return console.error("환경 변수 NEXT_PUBLIC_API_BASE_URL 없음");

    const controller = new AbortController();
    const SSE_URL = `${API_BASE_URL}/notifications/subscribe`;

    const connectSSE = () => {
      fetchEventSource(SSE_URL, {
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')?.replace(/"/g, '') || ''}`,
        },
        onopen: async (res) => {
          if (res.ok) {
            try {
              const response = await api.get<Notification[]>('/notifications');
              const data = response.data;
              setNotifications(data);
              setUnreadCount(data.filter(n => !n.is_read).length);
            } catch (e) {
              console.error("SSE 연결 후 초기 알림 동기화 실패:", e);
            }
            return;
          }
          if (res.status === 401 || res.status === 403) controller.abort();
        },
        onmessage: (event) => {
          if (event.event === 'notification') {
            try {
              const newNotification: Notification = JSON.parse(event.data);
              setNotifications(prev => [newNotification, ...prev]);
              if (!newNotification.is_read) setUnreadCount(prev => prev + 1);
              if (newNotification.message.toUpperCase().includes("EMERGENCY")) {
                setToastNotifications(prev => [...prev, newNotification]);
              }
            } catch (e) {
              console.error("SSE 메시지 파싱 실패:", event.data);
            }
          }
        },
        onerror: (err) => {
          if (err instanceof Error && err.name === 'AbortError') return;
          console.error("SSE 오류, 재연결 시도 중", err);
          setTimeout(connectSSE, 3000); // 3초 후 재연결
        },
      });
    };

    connectSSE();

    return () => controller.abort();
  }, [isLoading, isAuthenticated]);

  const markAsRead = async (notificationId: number) => {
    const target = notifications.find(n => n.notification_id === notificationId);
    if (!target || target.is_read) return;
    try {
      await api.post(`/notifications/${notificationId}/read`);
      setNotifications(prev =>
        prev.map(n => n.notification_id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      setToastNotifications(prev =>
        prev.filter(n => n.notification_id !== notificationId)
      );
    } catch (error) {
      console.error("알림 읽음 처리 실패:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      setToastNotifications([]);
    } catch (error) {
      console.error("전체 읽음 처리 실패:", error);
    }
  };

  const clearNotifications = async () => {
    try {
      await api.delete('/notifications');
      setNotifications([]);
      setUnreadCount(0);
      setToastNotifications([]);
    } catch (error) {
      console.error("전체 알림 삭제 실패:", error);
    }
  };

  const clearToast = (notificationId: number) => {
    setToastNotifications(prev => prev.filter(n => n.notification_id !== notificationId));
  };

  return {
    notifications,
    unreadCount,
    toastNotifications,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    clearToast,
  };
};