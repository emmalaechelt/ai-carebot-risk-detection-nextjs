"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// API 명세서에 기반한 User(Senior) 타입 정의
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

// 가짜 API 호출 함수 (실제 프로젝트에서는 API 모듈 사용)
const fetchUsers = async (params?: any): Promise<{ content: User[], total_elements: number }> => {
    console.log("Fetching users with params:", params);
    // 실제로는 여기서 `api.get('/api/seniors', { params })` 와 같이 호출합니다.
    const sampleData = [
        { senior_id: 1, name: "홍길동", age: 65, sex: "MALE", gu: "동구", dong: "중앙동", state: "POSITIVE", doll_id: "D1001", phone: "010-1234-5678", created_at: "2025-09-29T10:00:00" },
        { senior_id: 2, name: "김어르신", age: 80, sex: "FEMALE", gu: "서구", dong: "둔산동", state: "DANGER", doll_id: "D1002", phone: "010-8765-4321", created_at: "2025-09-28T11:00:00" },
        { senior_id: 3, name: "이관리", age: 72, sex: "MALE", gu: "유성구", dong: "온천1동", state: "CRITICAL", doll_id: "D1003", phone: "010-1111-2222", created_at: "2025-09-27T15:30:00" },
    ];
    return Promise.resolve({ content: sampleData, total_elements: sampleData.length });
};

export default function UserListPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [searchParams, setSearchParams] = useState({
    name: "",
    phone: "",
    senior_id: "",
    gu: "",
    dong: "",
    state: "",
    age_group: "",
    sex: "",
  });

  useEffect(() => {
    // 페이지 로드 시 사용자 목록을 불러옵니다.
    fetchUsers().then(data => {
        setUsers(data.content);
        setTotalUsers(data.total_elements);
    });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setSearchParams({ ...searchParams, [e.target.name]: e.target.value });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    alert("검색 기능이 실행됩니다. (현재는 Mock 데이터)");
    // 실제 검색: fetchUsers(searchParams).then(data => setUsers(data.content));
  };
  
  const handleReset = () => {
    setSearchParams({
        name: "", phone: "", senior_id: "", gu: "", dong: "",
        state: "", age_group: "", sex: "",
    });
     alert("검색 조건이 초기화됩니다. (현재는 Mock 데이터)");
     // fetchUsers().then(data => setUsers(data.content));
  };

  const handleRegister = () => router.push("/main/users/register");
  
  const handleNameClick = (id: number) => {
    router.push(`/main/users/view/${id}`);
  };

  return (
    <div className="space-y-4 p-4 text-black">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">이용자 관리</h2>
        <button onClick={handleRegister} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-semibold">
          신규 등록
        </button>
      </div>

      {/* 검색폼 */}
      <form onSubmit={handleSearch} className="bg-white p-4 rounded-lg shadow-md border">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          {/* 이름, 연락처, 관리번호 */}
          <div className="flex flex-col"><label className="font-medium text-sm mb-1">이름</label><input type="text" name="name" value={searchParams.name} onChange={handleChange} className="border p-1.5 rounded-md"/></div>
          <div className="flex flex-col"><label className="font-medium text-sm mb-1">연락처</label><input type="text" name="phone" value={searchParams.phone} onChange={handleChange} className="border p-1.5 rounded-md"/></div>
          <div className="flex flex-col"><label className="font-medium text-sm mb-1">관리번호</label><input type="text" name="senior_id" value={searchParams.senior_id} onChange={handleChange} className="border p-1.5 rounded-md"/></div>
          
          {/* 성별, 연령대 */}
          <div className="flex flex-col"><label className="font-medium text-sm mb-1">성별</label><select name="sex" value={searchParams.sex} onChange={handleChange} className="border p-1.5 rounded-md bg-white"><option value="">전체</option><option value="MALE">남성</option><option value="FEMALE">여성</option></select></div>
          <div className="flex flex-col"><label className="font-medium text-sm mb-1">연령대</label><select name="age_group" value={searchParams.age_group} onChange={handleChange} className="border p-1.5 rounded-md bg-white"><option value="">전체</option><option value="60">60대</option><option value="70">70대</option><option value="80">80대</option><option value="100">100세 이상</option></select></div>
          
          {/* 자치구, 법정동 */}
          <div className="flex flex-col"><label className="font-medium text-sm mb-1">자치구</label><input type="text" name="gu" value={searchParams.gu} onChange={handleChange} className="border p-1.5 rounded-md"/></div>
          <div className="flex flex-col"><label className="font-medium text-sm mb-1">법정동</label><input type="text" name="dong" value={searchParams.dong} onChange={handleChange} className="border p-1.5 rounded-md"/></div>
          
          {/* 현재 상태 */}
          <div className="flex flex-col"><label className="font-medium text-sm mb-1">현재 상태</label><select name="state" value={searchParams.state} onChange={handleChange} className="border p-1.5 rounded-md bg-white"><option value="">전체</option><option value="POSITIVE">정상</option><option value="DANGER">위험</option><option value="CRITICAL">심각</option><option value="EMERGENCY">긴급</option></select></div>
        </div>
        <div className="flex justify-center gap-2 mt-4 pt-4 border-t">
            <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700">검색</button>
            <button type="button" onClick={handleReset} className="bg-gray-500 text-white px-6 py-2 rounded-md hover:bg-gray-600">초기화</button>
        </div>
      </form>

      {/* 사용자 테이블 */}
      <div className="overflow-x-auto bg-white p-2 rounded-lg shadow-md border">
        <p className="text-sm px-2 pb-2">총 {totalUsers}명</p>
        <table className="min-w-full border-collapse text-center text-sm">
          <thead className="bg-gray-100">
            <tr>
              {['순번', '관리번호', '이름', '나이', '성별', '자치구', '법정동', '현재 상태', '인형 아이디', '전화번호', '등록일'].map(header => (
                <th key={header} className="border px-2 py-2 font-semibold">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u, idx) => (
              <tr key={u.senior_id} className="hover:bg-gray-50">
                <td className="border px-2 py-1.5">{idx + 1}</td>
                <td className="border px-2 py-1.5">{u.senior_id}</td>
                <td className="border px-2 py-1.5">
                  <span onClick={() => handleNameClick(u.senior_id)} className="text-blue-600 hover:underline cursor-pointer font-medium">
                    {u.name}
                  </span>
                </td>
                <td className="border px-2 py-1.5">{u.age}</td>
                <td className="border px-2 py-1.5">{u.sex === 'MALE' ? '남' : '여'}</td>
                <td className="border px-2 py-1.5">{u.gu}</td>
                <td className="border px-2 py-1.5">{u.dong}</td>
                <td className="border px-2 py-1.5">{u.state}</td>
                <td className="border px-2 py-1.5">{u.doll_id}</td>
                <td className="border px-2 py-1.5">{u.phone}</td>
                <td className="border px-2 py-1.5">{new Date(u.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}