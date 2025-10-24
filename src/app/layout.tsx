// src/app/layout.tsx

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext"; // ✅ 1. AuthProvider를 import 합니다.

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "시니어케어 돌봄로봇",
  description: "고독사 예방을 위한 데이터 분석 대시보드",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        {/*
          ✅ 2. AuthProvider로 children을 감싸줍니다.
          이제 애플리케이션의 모든 페이지와 컴포넌트가
          AuthContext의 값에 접근할 수 있게 됩니다.
        */}
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}