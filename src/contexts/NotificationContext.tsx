// src/contexts/NotificationContext.tsx
'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
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
  
  // React 18의 StrictMode에서 useEffect가 두 번 실행되어 연결이 끊어지는 것을 방지하기 위한 Ref
  const sseControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // 인증이 안되었거나, 로딩 중이거나, 이미 SSE 연결이 존재할 경우 중복 실행을 방지합니다.
    if (isLoading || !isAuthenticated || sseControllerRef.current) {
      return;
    }

    if (!API_BASE_URL) {
      console.error("환경 변수 'NEXT_PUBLIC_API_BASE_URL'가 설정되지 않았습니다.");
      return;
    }

    // 새로운 AbortController를 생성하고 ref에 할당하여 연결을 관리합니다.
    const controller = new AbortController();
    sseControllerRef.current = controller;
    
    console.log("SSE 연결을 시작합니다.");

    fetchEventSource(`${API_BASE_URL}/notifications/subscribe`, {
      signal: controller.signal,
      headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}` },
      onopen: async (res) => {
        if (res.ok) {
          console.log("SSE 연결 성공. 초기 알림 목록을 동기화합니다.");
          try {
            const response = await api.get<Notification[]>('/notifications');
            setNotifications(response.data);
            setUnreadCount(response.data.filter(n => !n.is_read).length);
          } catch (e) {
            console.error("초기 알림 목록 동기화 실패:", e);
          }
        } else {
          console.error(`SSE 인증 오류: Status ${res.status}. 연결을 중단합니다.`);
          controller.abort();
        }
      },
      onmessage: (event) => {
        // 서버에서 'notification' 이벤트가 올 때만 처리합니다.
        if (event.event === 'notification') {
          const newNotification: Notification = JSON.parse(event.data);
          // 새로운 알림을 목록의 맨 앞에 추가합니다.
          setNotifications(prev => [newNotification, ...prev]);
          if (!newNotification.is_read) {
            setUnreadCount(prev => prev + 1);
          }
        }
      },
      onerror: (err) => {
        console.error("SSE 스트림 오류. 연결을 중단합니다.", err);
        // 오류 발생 시 컨트롤러를 중단시켜 재연결 시도를 막습니다.
        controller.abort();
        throw err; 
      }
    });

    // 컴포넌트가 화면에서 완전히 사라질 때(unmount) 이 정리 함수가 호출됩니다.
    return () => {
      console.log("SSE 연결을 정리(abort)합니다.");
      if (sseControllerRef.current) {
        sseControllerRef.current.abort();
        sseControllerRef.current = null; // ref를 초기화하여 다음 연결을 준비합니다.
      }
    };
  }, [isLoading, isAuthenticated]); // 인증 상태가 바뀔 때만 연결을 재시도합니다.

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