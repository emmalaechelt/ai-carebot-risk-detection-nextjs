// src/contexts/NotificationContext.tsx

'use client';

import { createContext, useContext, useState, ReactNode } from "react";
import type { Notification } from "@/types/notification";
import { useNotifications } from "@/hooks/useNotifications";

// 컨텍스트가 제공할 값들의 타입을 정의합니다.
interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: number) => void;
  isBellOpen: boolean;
  setIsBellOpen: (isOpen: boolean) => void;
  toastNotification: Notification | null;
  clearToast: () => void;
}

// 컨텍스트 생성
const NotificationContext = createContext<NotificationContextType | null>(null);

/**
 * 앱 전체에 알림 관련 상태와 함수를 제공하는 Provider 컴포넌트입니다.
 */
export function NotificationProvider({ children }: { children: ReactNode }) {
  // useNotifications 훅을 호출하여 모든 데이터 관련 로직과 상태를 가져옵니다.
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    toastNotification, 
    clearToast 
  } = useNotifications();

  // 알림 벨 메뉴의 열림/닫힘 상태는 Provider가 직접 관리합니다.
  const [isBellOpen, setIsBellOpen] = useState(false);

  // 컨텍스트를 통해 하위 컴포넌트들에게 전달할 값들을 객체로 묶습니다.
  const value = {
    notifications,
    unreadCount,
    markAsRead,
    isBellOpen,
    setIsBellOpen,
    toastNotification,
    clearToast
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

// ✅ [문제의 원인] 이 부분이 파일에 없거나 export되지 않았을 것입니다.
/**
 * NotificationContext의 값들을 쉽게 사용하기 위한 커스텀 훅입니다.
 */
export function useNotificationContext() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotificationContext must be used within a NotificationProvider");
  }
  return context;
}