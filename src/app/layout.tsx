// src/app/layout.tsx
import type { Metadata } from "next";
// 1. 'useAuth' 훅 대신 'AuthProvider' 컴포넌트를 import 합니다.
import { AuthProvider } from "../contexts/AuthContext"; 
import "./globals.css";

export const metadata: Metadata = {
  title: "시니어 돌봄 관제시스템",
  description: "대전시 시니어 돌봄 관제시스템",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        {/* 2. AuthProvider로 자식 컴포넌트들을 감싸 전역 상태를 제공합니다. */}
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}