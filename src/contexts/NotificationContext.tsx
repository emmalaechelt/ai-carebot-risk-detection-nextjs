'use client';
import { createContext, useContext, useEffect, useState } from "react";
import { SSE_URL } from "../lib/api";

export interface Notification {
  id: number;
  message: string;
  type: "csv_upload" | "urgent";
  link?: string;
  is_read?: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (n: Notification) => void;
  markAsRead: (id: number) => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // ✅ SSE 연결
  useEffect(() => {
    const eventSource = new EventSource(SSE_URL, { withCredentials: true });

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setNotifications((prev) => [
          ...prev,
          { id: Date.now(), message: data.message, type: data.type, link: data.link },
        ]);
      } catch (err) {
        console.error("SSE parse error", err);
      }
    };

    eventSource.onerror = () => {
      console.warn("SSE connection lost. Retrying...");
      eventSource.close();
      setTimeout(() => new EventSource(SSE_URL, { withCredentials: true }), 3000);
    };

    return () => eventSource.close();
  }, []);

  const addNotification = (n: Notification) => setNotifications((prev) => [...prev, n]);
  const markAsRead = (id: number) =>
    setNotifications((prev) => prev.filter((n) => n.id !== id));

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, markAsRead }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationContext() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotificationContext must be used inside NotificationProvider");
  return ctx;
}