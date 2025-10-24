// app/main/layout.tsx

'use client';

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { NotificationProvider, useNotificationContext } from "@/contexts/NotificationContext";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import NotificationToast from "@/components/common/NotificationToast";
import { Member } from "@/types/index";

/**
 * 로딩 중일 때 표시될 스켈레톤 UI 컴포넌트
 * (이 부분은 변경할 필요가 없습니다.)
 */
function AppSkeleton() {
  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-64 flex-shrink-0 bg-white border-r flex flex-col shadow-sm">
        <div className="flex items-center border-b h-16 px-4">
          <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
          <div className="ml-2 h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-4">
          <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        </nav>
      </aside>
      <main className="flex-1 flex flex-col">
        <header className="flex items-center justify-between h-16 px-6 bg-white border-b">
          <div className="h-8 bg-gray-200 rounded w-32 animate-pulse"></div>
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
          </div>
        </header>
        <div className="flex-1 p-6">
          <div className="w-full h-32 bg-gray-200 rounded-lg animate-pulse"></div>
        </div>
      </main>
    </div>
  );
}

/**
 * ✅ 1. 인증된 사용자에게 실제 UI를 렌더링하는 내부 컴포넌트
 * - NotificationContext를 사용하기 위해 NotificationProvider의 자식으로 위치해야 합니다.
 * - useAuth에서 받아온 user 정보를 props로 전달받습니다.
 */
function AuthenticatedLayout({ children, user }: { children: ReactNode; user: Member | null }) {
  const { toastNotifications, clearToast } = useNotificationContext();

  return (
    <>
      {/* 실시간 알림 토스트를 화면 우측 상단에 렌더링하는 컨테이너 */}
      <div className="fixed top-5 right-5 z-[100] flex flex-col items-end space-y-2">
        {toastNotifications.map(notification => (
          <NotificationToast
            key={notification.notification_id}
            notification={notification}
            onClose={() => clearToast(notification.notification_id)}
          />
        ))}
      </div>

      {/* 메인 대시보드 레이아웃 */}
      <div className="flex h-screen bg-gray-100">
        <Sidebar />
        <main className="flex-1 flex flex-col">
          <Header username={user?.username || "관리자"} />
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </>
  );
}

/**
 * ✅ 2. MainLayout: 인증 상태를 확인하고 Context Provider를 제공하는 최상위 레이아웃
 * - 인증 로직과 UI 렌더링 로직을 명확하게 분리합니다.
 */
export default function MainLayout({ children }: { children: ReactNode }) {
  // ✅ 3. useAuth 훅에서 user 객체를 직접 가져옵니다.
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  // 인증 상태가 변경될 때마다 체크하여, 비로그인 시 로그인 페이지로 리디렉션합니다.
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isLoading, isAuthenticated, router]);

  // 로딩 중이거나 아직 인증되지 않았다면 스켈레톤 UI를 보여줍니다.
  if (isLoading || !isAuthenticated) {
    return <AppSkeleton />;
  }

  // ✅ 4. 인증이 완료되면, NotificationProvider로 하위 컴포넌트를 감싸고
  // AuthenticatedLayout에 user 정보를 props로 전달하여 렌더링합니다.
  return (
    <NotificationProvider>
      <AuthenticatedLayout user={user}>
        {children}
      </AuthenticatedLayout>
    </NotificationProvider>
  );
}