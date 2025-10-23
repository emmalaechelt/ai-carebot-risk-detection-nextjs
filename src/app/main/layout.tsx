// app/main/layout.tsx

'use client';

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { NotificationProvider, useNotificationContext } from "@/contexts/NotificationContext"; // ✅ useNotificationContext 추가
import NotificationToast from "@/components/common/NotificationToast"; // ✅ 토스트 UI 컴포넌트 임포트

// --- AppSkeleton 컴포넌트는 변경 없음 ---
function AppSkeleton() {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* ... 스켈레톤 UI 코드 ... */}
      <aside className="w-64 bg-white border-r flex flex-col shadow-sm">
        <div className="flex items-center border-b h-16 px-4">
          <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse-slow"></div>
          <div className="ml-2 h-4 bg-gray-200 rounded w-3/4 animate-pulse-slow"></div>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-4">
          <div className="h-8 bg-gray-200 rounded animate-pulse-slow"></div>
          <div className="h-8 bg-gray-200 rounded animate-pulse-slow"></div>
          <div className="h-8 bg-gray-200 rounded animate-pulse-slow"></div>
          <div className="h-8 bg-gray-200 rounded animate-pulse-slow"></div>
        </nav>
      </aside>
      <main className="flex-1 flex flex-col">
        <header className="flex items-center justify-between h-16 px-6 bg-white border-b border-gray-200">
          <div className="h-8 bg-gray-200 rounded w-32 animate-pulse-slow"></div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse-slow"></div>
            <div className="h-4 bg-gray-200 rounded w-20 animate-pulse-slow"></div>
          </div>
        </header>
        <div className="flex-1 p-6">
          <div className="w-full h-32 bg-gray-200 rounded-lg animate-pulse-slow"></div>
        </div>
      </main>
    </div>
  );
}

// ✅ 실제 레이아웃과 토스트를 렌더링하는 내부 컴포넌트
function AuthenticatedLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  // ✅ NotificationProvider 내부에서 컨텍스트 훅을 호출
  const { toastNotification, clearToast } = useNotificationContext();

  return (
    <>
      {/* ✅ 토스트 UI 렌더링 로직 */}
      {toastNotification && (
        <NotificationToast
          notification={toastNotification}
          onClose={clearToast}
        />
      )}

      {/* 기존 레이아웃 구조 */}
      <div className="flex h-screen bg-gray-100">
        <Sidebar />
        <main className="flex-1 flex flex-col">
          <Header username={user?.username || "관리자"} />
          <div className="flex-1 p-6 overflow-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </>
  );
}

// ✅ MainLayout 컴포넌트: 인증 상태 확인 및 Provider 제공 역할
export default function MainLayout({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated) {
    return <AppSkeleton />;
  }

  return (
    // ✅ NotificationProvider가 AuthenticatedLayout을 감싸도록 수정
    <NotificationProvider>
      <AuthenticatedLayout>
        {children}
      </AuthenticatedLayout>
    </NotificationProvider>
  );
}