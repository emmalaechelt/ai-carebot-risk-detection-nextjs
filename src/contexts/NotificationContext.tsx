'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { useAuth } from './AuthContext';
import api from '@/lib/api';
import type { Notification } from '@/types';

interface NotificationContextProps {
  notifications: Notification[];
  unreadCount: number;
  toastNotifications: Notification[];
  markAsRead: (notificationId: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearNotifications: () => Promise<void>;
  clearToast: (notificationId: number) => void;
}

const NotificationContext = createContext<NotificationContextProps | undefined>(undefined);

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotificationContext must be used within NotificationProvider');
  return context;
};

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [toastNotifications, setToastNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (isLoading || !isAuthenticated) {
      return;
    }

    const controller = new AbortController();
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api';
    const SSE_URL = `${API_BASE_URL}/notifications/subscribe`;

    fetchEventSource(SSE_URL, {
      signal: controller.signal,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')?.replace(/"/g, '') || ''}`,
      },
      onopen: async (res) => {
        if (res.ok) {
          console.log("SSE connection established.");
          try {
            const response = await api.get<Notification[]>('/notifications');
            setNotifications(response.data);
            setUnreadCount(response.data.filter(n => !n.is_read).length);
          } catch (e) {
            console.error('초기 알림 동기화 실패:', e);
          }
          return;
        }
        if (res.status === 401 || res.status === 403) {
          console.error('SSE 인증 실패, 연결을 중단합니다.');
          controller.abort();
        }
      },
      onmessage: (event) => {
        // Keep-alive 메시지 등 빈 데이터는 무시
        if (!event.data) return;

        try {
          const newNotification: Notification = JSON.parse(event.data);
          
          // ✨ 디버깅용 로그 추가
          console.log('새 알림 수신:', newNotification);

          setNotifications(prev => [newNotification, ...prev]);

          if (!newNotification.is_read) {
            setUnreadCount(prev => prev + 1);
          }
          
          const message = newNotification.message || '';
          const type = newNotification.type || '';

          // 긴급/응급 토스트 조건 확인
          const isEmergency = type.toUpperCase().includes('EMERGENCY') ||
                              message.includes('긴급') ||
                              message.includes('응급');
          
          // ✨ 디버깅용 로그 추가
          console.log(`긴급 알림 여부: ${isEmergency}`);

          if (isEmergency) {
            setToastNotifications(prev => [...prev, newNotification]);
          }
        } catch (e) {
          console.error('SSE 메시지 파싱 실패:', e);
        }
      },
      onerror: (err) => {
        console.error("SSE Error:", err);
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
        throw err;
      },
    });

    return () => {
      controller.abort();
      console.log("SSE connection closed.");
    };
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
    } catch (error) {
      console.error('읽음 처리 실패:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('전체 읽음 처리 실패:', error);
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

  return (
    <NotificationContext.Provider value={{
      notifications, unreadCount, toastNotifications,
      markAsRead, markAllAsRead, clearNotifications, clearToast
    }}>
      {children}
    </NotificationContext.Provider>
  );
};