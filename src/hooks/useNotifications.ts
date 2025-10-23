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
  // ... (other state declarations)
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [toastNotification, setToastNotification] = useState<Notification | null>(null);


  const fetchInitialNotifications = useCallback(async (token: string) => {
    try {
      const response = await fetch(`${API_URL}/notifications`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (response.ok) {
        const data: Notification[] = await response.json();
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.is_read).length);
      } else {
        console.error(`useNotifications: [ERROR] Failed to fetch initial notifications with status: ${response.status}`);
      }
    } catch (error) {
      console.error("useNotifications: [FATAL] Error fetching initial notifications:", error);
    }
  }, []);

  useEffect(() => {
    if (isLoading || !isAuthenticated) {
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) {
        console.error("useNotifications: [ERROR] Authenticated, but no token found in localStorage. This should not happen.");
        return;
    }

    fetchInitialNotifications(token);

    const controller = new AbortController();
    fetchEventSource(`${API_URL}/notifications/subscribe`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` },
      signal: controller.signal,
      onopen: async (res) => {
        if (!res.ok) {
          console.error(`useNotifications: [ERROR] SSE connection failed with status: ${res.status}`);
        } else {
        }
      },
      onmessage: (event) => { /* ... */ },
      onerror: (err) => { console.error("useNotifications: [FATAL] SSE error:", err); },
    });
    return () => controller.abort();
  }, [isLoading, isAuthenticated, fetchInitialNotifications]);

  // ... (markAsRead and clearToast functions are unchanged)
  const markAsRead = async (notificationId: number) => { /* ... */ };
  const clearToast = () => setToastNotification(null);
  
  return { notifications, unreadCount, markAsRead, toastNotification, clearToast };
};