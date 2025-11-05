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
    // 로딩 중이거나 로그아웃 상태일 때는 SSE 연결을 시도하지 않습니다.
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
          // 연결 성공 시, 최신 알림 목록을 한 번 불러와 동기화합니다.
          try {
            const response = await api.get<Notification[]>('/notifications');
            setNotifications(response.data);
            setUnreadCount(response.data.filter(n => !n.is_read).length);
          } catch (e) {
            console.error('초기 알림 동기화 실패:', e);
          }
          return;
        }
        
        // 인증 실패 시 재연결 시도를 중단합니다.
        if (res.status === 401 || res.status === 403) {
           console.error('SSE 인증 실패, 연결을 중단합니다.');
           controller.abort();
        }
      },
      onmessage: (event) => {
        try {
          const newNotification: Notification = JSON.parse(event.data);
          
          setNotifications(prev => [newNotification, ...prev]);
          
          if (!newNotification.is_read) {
            setUnreadCount(prev => prev + 1);
          }

          if (newNotification.type === 'EMERGENCY_DETECTED') {
            setToastNotifications(prev => [...prev, newNotification]);
          }
        } catch (e) {
          // Keep-alive 메시지 등 JSON이 아닌 데이터는 무시합니다.
        }
      },
      onerror: (err) => {
        console.error("SSE Error:", err);
        // AbortError는 사용자가 페이지를 떠나는 등 의도된 종료이므로 재연결하지 않습니다.
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
        // 이외의 모든 오류 발생 시, 라이브러리가 자동으로 재연결을 시도하도록 에러를 다시 던집니다.
        throw err;
      },
      // --- ⬇️ 오류의 원인이었던 retry 속성을 완전히 제거했습니다 ---
    });

    // 컴포넌트가 언마운트될 때 SSE 연결을 확실히 종료합니다.
    return () => {
      controller.abort();
    };
  }, [isLoading, isAuthenticated]);

  // --- (이하 함수들은 변경 없음) ---

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