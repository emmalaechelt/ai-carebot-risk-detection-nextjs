// src/app/(main)/layout.tsx

'use client';

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

// 로딩 중 표시될 스켈레톤 UI
function AppSkeleton() {
  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-64 flex-shrink-0 bg-white border-r flex flex-col shadow-sm">
        <div className="flex items-center border-b h-16 px-4">
          <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
          <div className="ml-2 h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-8 bg-gray-200 rounded animate-pulse"></div>
          ))}
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

export default function MainLayout({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // 인증 상태를 확인하고, 비인증 사용자는 로그인 페이지('/')로 리디렉션합니다.
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isLoading, isAuthenticated, router]);

  // 로딩 중이거나 아직 인증되지 않았다면 스켈레톤 UI를 보여줍니다.
  if (isLoading || !isAuthenticated) {
    return <AppSkeleton />;
  }

  // 인증된 사용자에게 보여줄 메인 레이아웃입니다.
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header />
        {/* 
          ✅ 수정된 부분:
          - EmergencyToast 컴포넌트를 제거했습니다. (RootLayout에서 전역으로 한 번만 렌더링)
          - 여백을 최적화하여 불필요한 스크롤을 방지합니다. (p-4, space-y-4)
        */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {children}
        </div>
      </main>
    </div>
  );
}