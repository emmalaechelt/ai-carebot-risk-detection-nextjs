// src/contexts/NotificationContext.tsx

'use client';

import { createContext, useContext, useState, ReactNode } from "react";
import type { Notification } from "@/types/notification";
import { useNotifications } from "@/hooks/useNotifications";

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: number) => void;
  isBellOpen: boolean;
  setIsBellOpen: (isOpen: boolean) => void;
  
  // ✅ [수정] 타입이 단일 객체에서 '배열'로 변경됩니다.
  toastNotifications: Notification[];
  // ✅ [수정] clearToast가 이제 닫을 토스트의 ID를 인자로 받습니다.
  clearToast: (id: number) => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  // ✅ [수동 수정] useNotifications 훅이 반환하는 객체의 이름이 바뀌었으므로 맞춰줍니다.
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    toastNotifications, // 이름 변경
    clearToast 
  } = useNotifications();
  
  const [isBellOpen, setIsBellOpen] = useState(false);

  const value = {
    notifications,
    unreadCount,
    markAsRead,
    isBellOpen,
    setIsBellOpen,
    toastNotifications, // 이름 변경
    clearToast
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationContext() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotificationContext must be used within a NotificationProvider");
  return ctx;
}