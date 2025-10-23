// src/hooks/useNotifications.ts

'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import type { Notification } from '@/types/notification';
import { useAuth } from '@/contexts/AuthContext'; // ✅ AuthContext 훅 임포트

const API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8080/api';

export const useNotifications = () => {
  // ✅ useAuth 훅을 사용하여 인증 상태와 로딩 상태를 가져옵니다.
  const { isAuthenticated, isLoading } = useAuth();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [toastNotification, setToastNotification] = useState<Notification | null>(null);

  // 초기 알림 목록 로드 (함수 자체는 변경 없음)
  const fetchInitialNotifications = useCallback(async () => {
    // try-catch 블록 내부 로직은 이전과 동일
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;
      const response = await fetch(`${API_URL}/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data: Notification[] = await response.json();
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.is_read).length);
      } else {
        console.error("Failed to fetch initial notifications:", response.statusText);
      }
    } catch (error) {
      console.error("Error fetching initial notifications:", error);
    }
  }, []);

  // ===== [핵심 수정] SSE 연결 useEffect =====
  useEffect(() => {
    // ✅ AuthContext가 로딩 중이거나, 인증되지 않았다면 아무 작업도 하지 않고 즉시 종료
    if (isLoading || !isAuthenticated) {
      // 인증되지 않은 상태에서는 기존 알림 목록을 비워주는 것이 안전합니다.
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    // 인증이 확인된 후에만 아래 로직 실행
    fetchInitialNotifications();
    const token = localStorage.getItem('accessToken');
    
    // 이 시점에서는 토큰이 유효하다고 보장할 수 있음
    if (!token) return;

    const controller = new AbortController();

    fetchEventSource(`${API_URL}/notifications/subscribe`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` },
      signal: controller.signal,
      onopen: async (res) => {
        if (res.ok) console.log("SSE connection established");
        // 이제 401 오류는 발생하지 않아야 합니다.
        else console.error("SSE connection failed", res.status);
      },
      onmessage: (event) => {
        if (event.event === 'connect') return;
        if (event.event === 'notification') {
          const newNotification = JSON.parse(event.data) as Notification;

          console.log("🔔 New Notification Received:", newNotification);
          
          setNotifications(prev => [newNotification, ...prev]);
          if (!newNotification.is_read) {
            setUnreadCount(prev => prev + 1);
          }
          const message = newNotification.message.toUpperCase();
          if (message.includes("CRITICAL") || message.includes("EMERGENCY")) {
            setToastNotification(newNotification);
          }
        }
      },
      onerror: (err) => {
        console.error("SSE error, will retry.", err);
      },
    });

    return () => controller.abort();

  // ✅ useEffect의 의존성 배열에 isLoading과 isAuthenticated를 추가합니다.
  //    인증 상태가 변경될 때마다 이 효과를 다시 실행하여 SSE 연결을 재설정합니다.
  }, [isLoading, isAuthenticated, fetchInitialNotifications]);

  // 알림 읽음 처리 (변경 없음)
  const markAsRead = async (notificationId: number) => {
    // ... 기존 코드 ...
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        setNotifications(prev =>
          prev.map(n =>
            n.notification_id === notificationId ? { ...n, is_read: true } : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };
  
  const clearToast = () => setToastNotification(null);

  return { notifications, unreadCount, markAsRead, toastNotification, clearToast };
};