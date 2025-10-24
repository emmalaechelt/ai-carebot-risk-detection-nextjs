'use client';

import { createContext, useState, useEffect, ReactNode, useContext, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api'; // 중앙 관리되는 axios 인스턴스
import { Member } from '@/types'; // Member 타입을 가져옵니다.
import { AxiosError } from 'axios';

// API 명세서에 따른 Member 타입 사용 (기존 User 인터페이스와 동일)
type User = Member;

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // 로그아웃 함수: 인증 정보 초기화 및 로그인 페이지로 이동
  const logout = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('username');
    setUser(null);
    delete api.defaults.headers.common['Authorization'];
    router.push('/');
  }, [router]);

  // ✅ 1. [개선] 사용자 정보를 API로 조회하여 상태를 업데이트하는 함수
  // - 로그인 성공 시, 페이지 새로고침 시 호출하여 항상 최신 사용자 정보를 유지합니다.
  const fetchAndSetUser = useCallback(async (username: string) => {
    try {
      const response = await api.get<User>(`/members/${username}`);
      setUser(response.data); // API로부터 받은 실제 사용자 정보로 상태 설정
    } catch (error) {
      console.error("사용자 정보 조회 실패:", error);
      logout(); // 사용자 정보 조회를 실패하면 안전하게 로그아웃 처리
    }
  }, [logout]);

  // 앱 로드 시 토큰 유효성 검증 로직
  useEffect(() => {
    const validateToken = async () => {
      const accessToken = localStorage.getItem('accessToken');
      const username = localStorage.getItem('username');

      if (!accessToken || !username) {
        setIsLoading(false);
        return;
      }

      try {
        // ✅ 2. [수정] api 인스턴스에 미리 토큰을 설정해줍니다.
        // 이렇게 하면 첫 요청부터 토큰이 포함되어 전송됩니다.
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        
        // 토큰 유효성 검증 후, 사용자 정보를 조회하여 상태를 업데이트합니다.
        await fetchAndSetUser(username);

      } catch (error) {
        // api.ts의 인터셉터가 토큰 갱신을 시도했음에도 실패한 경우
        console.error("토큰 검증 또는 갱신 실패:", error);
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    validateToken();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ✅ 최초 1회만 실행되도록 의존성 배열을 비웁니다.

  
  // 'sessionExpired' 이벤트(토큰 갱신 실패 시 api.ts에서 발생)를 감지하여 로그아웃
  useEffect(() => {
    const handleSessionExpired = () => {
      alert("세션이 만료되었습니다. 다시 로그인해주세요.");
      logout();
    };

    window.addEventListener('sessionExpired', handleSessionExpired);
    return () => window.removeEventListener('sessionExpired', handleSessionExpired);
  }, [logout]);

  // 로그인 함수
  const login = async (username: string, password: string) => {
    try {
      const response = await api.post('/login', { username, password });
      
      const accessToken = response.headers.authorization?.split(' ')[1];
      if (accessToken) {
        // 로컬 스토리지와 api 인스턴스에 인증 정보 저장
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('username', username);
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        
        // ✅ 3. [개선] 로그인 성공 후, 사용자 정보를 조회하여 상태를 설정합니다.
        await fetchAndSetUser(username);
        
        router.push('/main');
      } else {
        throw new Error('로그인 응답에서 Access Token을 찾을 수 없습니다.');
      }
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response?.status === 401) {
        alert("아이디 또는 비밀번호가 일치하지 않습니다.");
      } else {
        alert("로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
      }
      // UI에서 에러를 처리할 수 있도록 에러를 다시 던져줍니다.
      throw error;
    }
  };

  const value = { isAuthenticated: !!user, user, isLoading, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// useAuth 커스텀 훅
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth는 반드시 AuthProvider 내에서 사용해야 합니다.');
  }
  return context;
};