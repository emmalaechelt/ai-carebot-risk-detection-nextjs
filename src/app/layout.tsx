// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script"; // ✅ Kakao SDK 로드용
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import KakaoMapContext from "@/contexts/KakaoMapContext";

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
        {/* ✅ Kakao Maps SDK 전역 로드 (Geocoder/Map 모두 사용 가능) */}
        <Script
          strategy="beforeInteractive"
          src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_API_KEY}&autoload=false&libraries=services`}
        />
      </head>

      <body className={inter.className}>
        {/* ✅ 전역 Provider 계층 */}
        <AuthProvider>
          <NotificationProvider>
            <KakaoMapContext>
              {children}
            </KakaoMapContext>
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}