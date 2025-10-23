'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import type { Notification } from '../types/notification';

// 백엔드 API 기본 URL
const API_URL = 'http://localhost:8080/api';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // 초기 알림 목록 로드
  const fetchInitialNotifications = useCallback(async () => {
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
      }
    } catch (error) {
      console.error("Failed to fetch initial notifications:", error);
    }
  }, []);

  // SSE 연결 설정
  useEffect(() => {
    fetchInitialNotifications();

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const controller = new AbortController();

    fetchEventSource(`${API_URL}/notifications/subscribe`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'text/event-stream',
      },
      signal: controller.signal,
      onopen: async (res) => {
        if (res.ok && res.status === 200) {
          console.log("SSE connection established");
        } else if (res.status >= 400 && res.status < 500 && res.status !== 429) {
          console.error("Client-side error in SSE connection", res);
          controller.abort();
        }
      },
      onmessage: (event) => {
        if (event.event === 'connect') return;

        if (event.event === 'notification') {
          const newNotification = JSON.parse(event.data) as Notification;
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      },
      onerror: (err) => {
        if ((err as { name?: string }).name === 'AbortError') return;
        console.error("SSE network error:", err);
      },
    });

    return () => controller.abort();
  }, [fetchInitialNotifications]);

  // 알림 읽음 처리
  const markAsRead = async (notificationId: number) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

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
        setUnreadCount(prev => (prev > 0 ? prev - 1 : 0));
      }
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  return { notifications, isOpen, setIsOpen, unreadCount, markAsRead };
};
