'use client';

import { ReactNode, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { Member } from "@/types/index";
import { NotificationProvider } from "@/contexts/NotificationContext";
import EmergencyToast from "@/components/common/EmergencyToast";

// AppSkeleton 컴포넌트 (변경 없음)
function AppSkeleton() {
  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-64 flex-shrink-0 bg-white border-r flex flex-col shadow-sm"><div className="flex items-center border-b h-16 px-4"><div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div><div className="ml-2 h-4 bg-gray-200 rounded w-3/4 animate_pulse"></div></div><nav className="flex-1 px-4 py-6 space-y-4"><div className="h-8 bg-gray-200 rounded animate-pulse"></div><div className="h-8 bg-gray-200 rounded animate-pulse"></div><div className="h-8 bg-gray-200 rounded animate-pulse"></div><div className="h-8 bg-gray-200 rounded animate-pulse"></div></nav></aside>
      <main className="flex-1 flex flex-col"><header className="flex items-center justify-between h-16 px-6 bg-white border-b"><div className="h-8 bg-gray-200 rounded w-32 animate-pulse"></div><div className="flex items-center space-x-4"><div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div><div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div></div></header><div className="flex-1 p-6"><div className="w-full h-32 bg-gray-200 rounded-lg animate-pulse"></div></div></main>
    </div>
  );
}

function AuthenticatedLayout({ children, user }: { children: ReactNode; user: Member | null }) {
  // ✅ 3. 이 컴포넌트는 NotificationContext를 사용하지 않으므로, 관련 코드는 여기에 없습니다.
  return (
    <>
      {/* "현재 긴급 상태인 이용자"를 보여주는 새로운 토스트 시스템 */}
       <EmergencyToast />
      
      {/* 기존의 메인 레이아웃 */}
      <div className="flex h-screen bg-gray-100">
        <Sidebar />
        <main className="flex-1 flex flex-col">
          {/* Header는 내부에 NotificationBell을 포함하고 있으므로, NotificationProvider 안쪽에 위치해야 합니다. */}
          <Header username={user?.username || "관리자"} />
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </>
  );
}

export default function MainLayout({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;
    const isLoginPage = pathname === '/';
    if (isLoginPage && isAuthenticated) router.push('/main');
    if (!isLoginPage && !isAuthenticated) router.push('/');
  }, [isLoading, isAuthenticated, router, pathname]);

  const isLoginPage = pathname === '/';
  if (isLoginPage) return <>{children}</>;
  if (isLoading || !isAuthenticated) return <AppSkeleton />;
  
  // ✅ [핵심] NotificationProvider로 전체를 감싸서 두 시스템이 모두 작동하게 합니다.
  return (
    <NotificationProvider>
      <AuthenticatedLayout user={user}>
        {children}
      </AuthenticatedLayout>
    </NotificationProvider>
  );
}