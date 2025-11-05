// src/app/layout.tsx

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import KakaoMapProvider from "@/contexts/KakaoMapContext";
import NotificationBell from "@/components/common/NotificationBell";
import EmergencyToast from "@/components/common/EmergencyToast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "시니어케어 돌봄로봇",
  description: "실시간 시니어 현황 모니터링 대시보드",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        {/* ✅ Kakao SDK를 가장 먼저 로드 (Geocoder, Map 등 사용 가능) */}
        <Script
          id="kakao-sdk"
          strategy="beforeInteractive"
          src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_APP_KEY}&autoload=false&libraries=services`}
        />
      </head>

      <body className={inter.className}>
        <AuthProvider>
          <NotificationProvider>
              <div className="relative min-h-screen">
                <main>{children}</main>
                <EmergencyToast />
              </div>
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}