// src/app/page.tsx
"use client";

import Image from "next/image";
import { useState, FormEvent, useEffect, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function LoginPage() {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  const { login, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // 인증 상태가 확인되었고, 이미 로그인 되어 있다면 '/main'으로 리디렉션
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push("/main");
    }
  }, [isAuthenticated, isLoading, router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (!username || !password) {
      setError("아이디와 비밀번호를 모두 입력해주세요.");
      return;
    }

    setIsSubmitting(true);
    try {
      await login(username, password);
    } catch (err) {
      console.error("Login error:", err);
      setError("아이디 또는 비밀번호가 틀렸습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { id, value } = event.target;
    if (id === "username") setUsername(value);
    if (id === "password") setPassword(value);
  };

  // 초기 인증 확인 중이거나, 이미 로그인된 상태라면 로딩 화면 표시
  if (isLoading || isAuthenticated) {
    return <div className="flex justify-center items-center min-h-screen">로딩 중...</div>;
  }
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="text-center -translate-y-10">
        <div className="flex items-center justify-center mb-2">
          <Image
            src="/img/grandparents.png"
            alt="조부모 이모지"
            width={30}
            height={30}
            className="w-14 h-auto mr-5"/>
       
        <h2 className="text-3xl font-bold text-black">시니어 돌봄 관제시스템</h2>
        </div>
        <p className="text-xl text-gray-500 mb-5">Senior Care Control System</p>
        

        <form
          onSubmit={handleSubmit}
          className="border-2 border-black rounded-xl p-8 w-72 mx-auto shadow-lg"
        >
          <h3 className="text-xl font-medium text-black mb-6">관리자 로그인</h3>

          {error && <p className="text-red-500 mb-4">{error}</p>}

          <input
            id="username"
            type="text"
            placeholder="ID"
            value={username}
            onChange={handleChange}
            className="w-full border-2 border-gray-800 rounded-lg p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-600"
            disabled={isSubmitting}
            autoComplete="username"
          />
          <input
            id="password"
            type="password"
            placeholder="PASSWORD"
            value={password}
            onChange={handleChange}
            className="w-full border-2 border-gray-800 rounded-md p-2 mb-7 focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-600"
            disabled={isSubmitting}
            autoComplete="current-password"
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-1/2 py-2 font-semibold bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition disabled:opacity-50"
          >
            로그인
          </button>
        </form>
      </div>
    </div>
  );
}