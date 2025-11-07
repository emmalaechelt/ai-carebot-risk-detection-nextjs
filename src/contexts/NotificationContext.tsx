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
  if (!context) throw new Error('useNotificationContext must be used within a NotificationProvider');
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
          console.log("✅ SSE 연결이 성공적으로 수립되었습니다.");
          try {
            const response = await api.get<Notification[]>('/notifications');
            setNotifications(response.data);
            setUnreadCount(response.data.filter(n => !n.is_read).length);
          } catch (e) {
            console.error('초기 알림 동기화 실패:', e);
          }
          return;
        }
        console.error('❌ SSE 연결에 실패했습니다. 상태 코드:', res.status);
        controller.abort();
      },
      onmessage: (event) => {
        if (typeof event.data !== 'string' || !event.data.startsWith('{')) {
          console.log("❕ JSON 형식이 아닌 메시지 수신 (무시함):", event.data);
          return;
        }

        try {
          const newNotification: Notification = JSON.parse(event.data);
          console.log("📄 파싱된 알림 객체:", newNotification);
          
          setNotifications(prev => [newNotification, ...prev]);
          if (!newNotification.is_read) {
            setUnreadCount(prev => prev + 1);
          }
          
          // ✅ [핵심 수정] 긴급 알림을 판단하는 로직을 더 유연하고 견고하게 변경합니다.
          const messageUpperCase = newNotification.message.toUpperCase();
          const isEmergency = 
            newNotification.type === 'EMERGENCY_DETECTED' ||
            (newNotification.type === 'ANALYSIS_COMPLETE' && messageUpperCase.includes('EMERGENCY')) ||
            (newNotification.type === 'ANALYSIS_COMPLETE' && messageUpperCase.includes('긴급'));

          console.log(`❔ 긴급 알림 판별 시도: type='${newNotification.type}', message='${newNotification.message}', isEmergency=${isEmergency}`);

          if (isEmergency) {
            console.log("🚨 긴급 알림으로 인식됨! 토스트 상태를 업데이트합니다.", newNotification);
            setToastNotifications(prev => 
              prev.some(n => n.notification_id === newNotification.notification_id)
                ? prev
                : [...prev, newNotification]
            );
          }
        } catch (e) {
          console.error('❌ SSE 메시지 파싱 실패:', e, '원본 데이터:', event.data);
        }
      },
      onerror: (err) => {
        console.error("❌ SSE onerror: 에러 발생", err);
      },
    });

    return () => {
      controller.abort();
      console.log("SSE 연결이 종료되었습니다.");
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