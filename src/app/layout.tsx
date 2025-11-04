// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import KakaoMapProvider from "@/contexts/KakaoMapContext";

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
          src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_API_KEY}&autoload=false&libraries=services`}
        />
      </head>

      <body className={inter.className}>
        <AuthProvider>
          <NotificationProvider>
            {/* ✅ Kakao SDK 로드 상태를 감지해 전역 공급 */}
            <KakaoMapProvider>{children}</KakaoMapProvider>
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}