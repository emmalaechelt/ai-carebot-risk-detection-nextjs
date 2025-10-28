import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { KakaoMapProvider } from "@/contexts/KakaoMapContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "시니어케어 돌봄로봇",
  description: "고독사 예방을 위한 데이터 분석 대시보드",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <AuthProvider>
          <KakaoMapProvider>{children}</KakaoMapProvider>
        </AuthProvider>
      </body>
    </html>
  );
}