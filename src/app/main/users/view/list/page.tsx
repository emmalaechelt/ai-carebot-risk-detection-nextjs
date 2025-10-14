"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface User {
  senior_id: number;
  name: string;
  age: number;
  sex: "MALE" | "FEMALE";
  gu: string;
  dong: string;
  state: "POSITIVE" | "DANGER" | "CRITICAL" | "EMERGENCY";
  doll_id: string;
  phone: string;
  created_at: string;
}

export default function UserListPage() {
  const router = useRouter();
  const [searchParams, setSearchParams] = useState({
    district: "",
    neighborhood: "",
    status: "",
    ageGroup: "",
    gender: "",
    userIdOrder: "latest",
    userName: "",
    phoneNumber: "",
    personalId: "",
  });

  const [users, setUsers] = useState<User[]>([
    // 초기 샘플 데이터
    {
      id: "1",
      userId: "U0001",
      name: "홍길동",
      age: 65,
      gender: "남",
      district: "동구",
      neighborhood: "신동",
      status: "안전",
      deviceId: "D1001",
      phone: "010-1234-5678",
      createdAt: "2025-09-29",
    },
    // ...추가 데이터
  ]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setSearchParams({...searchParams, [e.target.name]: e.target.value});
  };

  const handleSearch = () => {
    // 실제 검색 시 API 호출 후 setUsers
    alert("검색 기능 샘플입니다. 실제 구현 시 API 호출 필요.");
  };

  const handleRegister = () => router.push("/main/users/register");

  const handleRowClick = (id: string) => router.push(`/main/users/view/${id}`);

  return (
    <div className="space-y-4 p-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">이용자 관리</h2>
        <button onClick={handleRegister} className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600">
          등록
        </button>
      </div>

      {/* 검색폼 */}
      <div className="grid grid-cols-10 gap-3 items-center bg-white p-2 rounded shadow">
        {/* 검색 필드 (생략 가능, 위 코드 참고) */}
        <button onClick={handleSearch} className="col-span-10 bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600">
          검색
        </button>
      </div>

      {/* 사용자 테이블 */}
      <div className="overflow-x-auto bg-white p-2 rounded shadow">
        <table className="min-w-full border border-gray-300 text-center">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-2 py-1">순번</th>
              <th className="border px-2 py-1">이용자 등록번호</th>
              <th className="border px-2 py-1">이름</th>
              <th className="border px-2 py-1">나이</th>
              <th className="border px-2 py-1">성별</th>
              <th className="border px-2 py-1">자치구</th>
              <th className="border px-2 py-1">법정동</th>
              <th className="border px-2 py-1">현재 상태</th>
              <th className="border px-2 py-1">인형아이디</th>
              <th className="border px-2 py-1">전화번호</th>
              <th className="border px-2 py-1">등록일</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u, idx) => (
              <tr key={u.id} className="hover:bg-gray-100 cursor-pointer" onClick={() => handleRowClick(u.id)}>
                <td className="border px-2 py-1">{idx + 1}</td>
                <td className="border px-2 py-1">{u.userId}</td>
                <td className="border px-2 py-1">{u.name}</td>
                <td className="border px-2 py-1">{u.age}</td>
                <td className="border px-2 py-1">{u.gender}</td>
                <td className="border px-2 py-1">{u.district}</td>
                <td className="border px-2 py-1">{u.neighborhood}</td>
                <td className="border px-2 py-1">{u.status}</td>
                <td className="border px-2 py-1">{u.deviceId}</td>
                <td className="border px-2 py-1">{u.phone}</td>
                <td className="border px-2 py-1">{u.createdAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}