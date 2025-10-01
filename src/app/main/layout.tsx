// src/app/main/layout.tsx
"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

// ✨ 변경점: 앱 전체 레이아웃을 유지하는 스켈레톤 컴포넌트 추가
function AppSkeleton() {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* 사이드바 스켈레톤 */}
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
      {/* 메인 영역 스켈레톤 */}
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


export default function MainLayout({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isLoading, isAuthenticated, router]);

  // ✨ 변경점: 로딩 중이거나 인증 실패 시, AppSkeleton을 렌더링하여 깜빡임 방지
  if (isLoading || !isAuthenticated) {
    return <AppSkeleton />;
  }

  // 인증 성공 시 실제 레이아웃과 자식 페이지 렌더링
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 flex flex-col">
        <Header username={user?.username || "관리자"} />
        <div className="flex-1 p-6 overflow-auto space-y-6">{children}</div>
      </main>
    </div>
  );
}