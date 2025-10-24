// src/hooks/useNotifications.ts

'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import type { Notification } from '@/types/notification';
import { useAuth } from '@/contexts/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8080/api';

export const useNotifications = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [toastNotifications, setToastNotifications] = useState<Notification[]>([]);

  const fetchInitialNotifications = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;
      const response = await fetch(`${API_URL}/notifications`, { headers: { 'Authorization': `Bearer ${token}` } });

      if (response.ok) {
        const data: Notification[] = await response.json();
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.is_read).length);

        // ✅ [핵심 수정] .filter() 조건을 오직 "EMERGENCY"만 찾도록 되돌립니다.
        const urgentNotifications = data.filter(notification => {
          const message = notification.message.toUpperCase();
          return message.includes("EMERGENCY");
        });

        if (urgentNotifications.length > 0) {
          setToastNotifications(urgentNotifications);
        }
      }
    } catch (error) {
      console.error("Error fetching initial notifications:", error);
    }
  }, []);

  useEffect(() => {
    if (isLoading || !isAuthenticated) return;
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    fetchInitialNotifications();
    const controller = new AbortController();
    fetchEventSource(`${API_URL}/notifications/subscribe`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` },
      signal: controller.signal,
      onopen: async (res) => { /* ... */ },
      onmessage: (event) => {
        if (event.event === 'notification') {
          const newNotification = JSON.parse(event.data);
          setNotifications(prev => [newNotification, ...prev]);
          if (!newNotification.is_read) setUnreadCount(prev => prev + 1);

          // ✅ [핵심 수정] 실시간 알림의 토스트 조건도 오직 "EMERGENCY"만 확인합니다.
          const message = newNotification.message.toUpperCase();
          if (message.includes("EMERGENCY")) {
            setToastNotifications(prev => [newNotification, ...prev]);
          }
        }
      },
      onerror: (err) => { /* ... */ },
    });
    return () => controller.abort();
  }, [isLoading, isAuthenticated, fetchInitialNotifications]);

  const markAsRead = async (notificationId: number) => { /* ... */ };
  const clearToast = (notificationId: number) => {
    setToastNotifications(prev => prev.filter(n => n.notification_id !== notificationId));
  };
  
  return { notifications, unreadCount, markAsRead, toastNotifications, clearToast };
};