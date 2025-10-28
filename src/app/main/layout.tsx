'use client';

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { NotificationProvider } from "@/contexts/NotificationContext";
import EmergencyToast from "@/components/common/EmergencyToast";
import { KakaoMapProvider } from '@/contexts/KakaoMapContext';

// 로딩 중일 때 보여줄 스켈레톤 UI
function AppSkeleton() {
  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-64 flex-shrink-0 bg-white border-r flex flex-col shadow-sm"><div className="flex items-center border-b h-16 px-4"><div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div><div className="ml-2 h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div></div><nav className="flex-1 px-4 py-6 space-y-4"><div className="h-8 bg-gray-200 rounded animate-pulse"></div><div className="h-8 bg-gray-200 rounded animate-pulse"></div><div className="h-8 bg-gray-200 rounded animate-pulse"></div><div className="h-8 bg-gray-200 rounded animate-pulse"></div></nav></aside>
      <main className="flex-1 flex flex-col"><header className="flex items-center justify-between h-16 px-6 bg-white border-b"><div className="h-8 bg-gray-200 rounded w-32 animate-pulse"></div><div className="flex items-center space-x-4"><div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div><div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div></div></header><div className="flex-1 p-6"><div className="w-full h-32 bg-gray-200 rounded-lg animate-pulse"></div></div></main>
    </div>
  );
}

// /main/* 경로에 대한 레이아웃
export default function MainLayout({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  // [핵심] 인증 상태를 확인하고, 로그인되지 않은 사용자는 로그인 페이지로 리디렉션합니다.
  useEffect(() => {
    if (isLoading) return; // 로딩 중에는 아무것도 하지 않습니다.
    if (!isAuthenticated) {
      router.push('/'); // 인증되지 않았다면 로그인 페이지로 보냅니다.
    }
  }, [isLoading, isAuthenticated, router]);

  // 로딩 중이거나, 리디렉션이 아직 실행되기 전에는 스켈레톤 UI를 보여줍니다.
  if (isLoading || !isAuthenticated) {
    return <AppSkeleton />;
  }
  
  // 인증된 사용자에게만 보여줄 레이아웃
  return (
    // NotificationProvider는 알림이 필요한 메인 레이아웃에만 적용합니다.
    <NotificationProvider>
      {/* EmergencyToast는 로그인된 사용자에게만 보여줍니다. */}
      <EmergencyToast />
      
      <div className="flex h-screen bg-gray-100">
        <Sidebar />
        <main className="flex-1 flex flex-col">
          <Header username={user?.username || "관리자"} />
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </NotificationProvider>
  );
}