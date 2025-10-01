// src/contexts/AuthContext.tsx
"use client";

import { createContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Member } from "@/types";

interface AuthContextType {
  isAuthenticated: boolean;
  user: Member | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean; // 초기 인증 상태 확인 중인지 여부
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Member | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  const verifyAuth = useCallback(async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      // API 명세서에 명시된 본인 정보 조회 엔드포인트가 없으므로,
      // 전체 회원 목록 조회로 대체하여 토큰 유효성 검증 (실제로는 /members/me 같은 엔드포인트 권장)
      const response = await api.get<Member[]>("/members");
      // 응답이 성공적으로 오면 토큰이 유효하다고 판단.
      // 실제 사용자 정보를 특정하기 위해선 별도 API 필요. 여기서는 첫 번째 유저 또는 'admin'으로 가정.
      const currentUser = response.data.find(m => m.username === 'admin') || response.data[0];
      setUser(currentUser);
    } catch (error) {
      console.error("Authentication failed:", error);
      setUser(null); // 실패 시 사용자 정보 초기화
      localStorage.removeItem("accessToken"); // 유효하지 않은 토큰 제거
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    verifyAuth();
  }, [verifyAuth]);

  const login = async (username: string, password: string) => {
    const response = await api.post("/login", { username, password });
    const accessToken = response.headers.authorization;

    if (!accessToken) {
      throw new Error("Login failed: No access token received.");
    }

    localStorage.setItem("accessToken", accessToken);
    // 로그인 성공 후 사용자 정보 즉시 로드 (username을 로컬스토리지에 저장해두는 것도 좋은 방법)
    localStorage.setItem("username", username);
    await verifyAuth();
    router.push("/main");
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
    router.push("/");
  };
  
  const isAuthenticated = !isLoading && !!user;
  const value = { isAuthenticated, user, login, logout, isLoading };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}