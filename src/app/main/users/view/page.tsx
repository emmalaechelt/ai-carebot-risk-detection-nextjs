"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  ColumnDef,
} from "@tanstack/react-table";

interface User {
  id: string;
  userId: string;
  name: string;
  age: number;
  gender: string;
  district: string;
  neighborhood: string;
  status: string;
  deviceId: string;
  phone: string;
  createdAt: string;
}

const neighborhoodOptions: Record<string, string[]> = {
  "대덕구": ["송촌동", "오정동", "비래동"],
  "동구": ["신동", "용운동", "자양동"],
  "서구": ["둔산동", "만년동", "정림동"],
  "유성구": ["도룡동", "관평동", "온천동"],
  "중구": ["선화동", "부사동", "문화동"],
};

const generateUsers = (): User[] => {
  const districts = Object.keys(neighborhoodOptions);
  const genders = ["남", "여"];
  const statuses = ["안전", "주의", "위험", "긴급"];
  let users: User[] = [];
  for (let i = 1; i <= 70; i++) {
    const district = districts[i % districts.length];
    const neighborhood = neighborhoodOptions[district][i % neighborhoodOptions[district].length];
    users.push({
      id: i.toString(),
      userId: `U${String(i).padStart(4, "0")}`,
      name: `사용자${i}`,
      age: 60 + (i % 40),
      gender: genders[i % 2],
      district,
      neighborhood,
      status: statuses[i % 4],
      deviceId: `D${String(i).padStart(4, "0")}`,
      phone: `010-${1000 + i}-${2000 + i}`,
      createdAt: `2025-09-${String(1 + (i % 30)).padStart(2, "0")}`,
    });
  }
  return users;
};

export default function UsersPage() {
  const router = useRouter();

  const [searchParams, setSearchParams] = useState({
    district: "",
    neighborhood: "",
    status: "",
    ageGroup: "",
    gender: "",
    userIdOrder: "",
    userName: "",
    phoneNumber: "",
    personalId: "",
  });

  const [availableNeighborhoods, setAvailableNeighborhoods] = useState<string[]>([]);
  const [allUsers] = useState<User[]>(generateUsers());

  useEffect(() => {
    if (searchParams.district) {
      setAvailableNeighborhoods(neighborhoodOptions[searchParams.district] || []);
      setSearchParams(prev => ({ ...prev, neighborhood: "" }));
    } else {
      setAvailableNeighborhoods([]);
      setSearchParams(prev => ({ ...prev, neighborhood: "" }));
    }
  }, [searchParams.district]);

  const filteredUsers = useMemo(() => {
    let result = allUsers.filter(user => {
      if (searchParams.userName && !user.name.includes(searchParams.userName)) return false;
      if (searchParams.phoneNumber && !user.phone.includes(searchParams.phoneNumber)) return false;
      if (searchParams.district && user.district !== searchParams.district) return false;
      if (searchParams.neighborhood && user.neighborhood !== searchParams.neighborhood) return false;
      if (searchParams.status && user.status !== searchParams.status) return false;
      if (searchParams.gender && user.gender !== searchParams.gender) return false;
      if (searchParams.ageGroup) {
        const age = user.age;
        if (searchParams.ageGroup === "60대" && (age < 60 || age > 69)) return false;
        if (searchParams.ageGroup === "70대" && (age < 70 || age > 79)) return false;
        if (searchParams.ageGroup === "80대" && (age < 80 || age > 89)) return false;
        if (searchParams.ageGroup === "90대" && (age < 90 || age > 99)) return false;
        if (searchParams.ageGroup === "100대" && age < 100) return false;
      }
      return true;
    });

    if (searchParams.userIdOrder) {
      const orderNum = parseInt(searchParams.userIdOrder);
      if (!isNaN(orderNum)) {
        result = result.sort((a, b) => parseInt(a.userId.slice(1)) - parseInt(b.userId.slice(1)));
        if (orderNum < 0) result.reverse();
      }
    }

    return result;
  }, [allUsers, searchParams]);

  const columns = useMemo<ColumnDef<User>[]>(() => [
    { accessorKey: "id", header: "순번" },
    { accessorKey: "userId", header: "이용자 등록번호" },
    {
      accessorKey: "name",
      header: "이름",
      cell: info => (
        <span
          className="text-blue-600 cursor-pointer hover:underline"
          onClick={() => router.push(`/main/users/view/${info.row.original.id}/page`)}
        >
          {info.getValue()}
        </span>
      ),
    },
    { accessorKey: "age", header: "나이" },
    { accessorKey: "gender", header: "성별" },
    { accessorKey: "district", header: "자치구" },
    { accessorKey: "neighborhood", header: "행정동" },
    { accessorKey: "status", header: "현재 상태" },
    { accessorKey: "deviceId", header: "인형아이디" },
    { accessorKey: "phone", header: "전화번호" },
    { accessorKey: "createdAt", header: "등록일" },
  ], [router]);

  const table = useReactTable({
    data: filteredUsers,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10, pageIndex: 0 } },
  });

  const handleRegister = () => router.push("/main/users/register");
  const handleReset = () => {
    setSearchParams({
      district: "",
      neighborhood: "",
      status: "",
      ageGroup: "",
      gender: "",
      userIdOrder: "",
      userName: "",
      phoneNumber: "",
      personalId: "",
    });
    setAvailableNeighborhoods([]);
    table.setPageIndex(0);
  };

  const PAGE_GROUP_SIZE = 5;
  const currentPageIndex = table.getState().pagination.pageIndex;
  const totalPages = table.getPageCount();
  const groupStart = Math.floor(currentPageIndex / PAGE_GROUP_SIZE) * PAGE_GROUP_SIZE + 1;
  const groupEnd = Math.min(groupStart + PAGE_GROUP_SIZE - 1, totalPages);

  return (
    <div className="space-y-3 text-black">
      {/* 제목 */}
      <div className="flex justify-center mb-2">
        <h2 className="text-2xl font-bold text-center">이용자 관리</h2>
      </div>

      {/* 검색 폼 */}
      <div className="bg-white p-3 rounded-lg shadow space-y-2">
        <div className="flex justify-end gap-2 mb-1">
          <button onClick={handleRegister} className="bg-green-500 text-white px-4 py-1 rounded hover:bg-green-600 mb-1">등록</button>
        </div>

        <div className="grid grid-cols-10 gap-2 items-center text-center">
          <label>자치구</label>
          <select value={searchParams.district} onChange={e => setSearchParams(prev => ({ ...prev, district: e.target.value }))} className="border rounded px-2 py-1">
            <option value="">선택</option>
            {Object.keys(neighborhoodOptions).map(d => (<option key={d} value={d}>{d}</option>))}
          </select>

          <label>행정동</label>
          <select value={searchParams.neighborhood} onChange={e => setSearchParams(prev => ({ ...prev, neighborhood: e.target.value }))} className="border rounded px-2 py-1">
            <option value="">선택</option>
            {availableNeighborhoods.map(n => (<option key={n} value={n}>{n}</option>))}
          </select>

          <label>현재 상태</label>
          <select value={searchParams.status} onChange={e => setSearchParams(prev => ({ ...prev, status: e.target.value }))} className="border rounded px-2 py-1">
            <option value="">선택</option>
            <option value="긴급">긴급</option>
            <option value="위험">위험</option>
            <option value="주의">주의</option>
            <option value="안전">안전</option>
          </select>

          <label>연령대</label>
          <select value={searchParams.ageGroup} onChange={e => setSearchParams(prev => ({ ...prev, ageGroup: e.target.value }))} className="border rounded px-2 py-1">
            <option value="">선택</option>
            <option value="60대">60대</option>
            <option value="70대">70대</option>
            <option value="80대">80대</option>
            <option value="90대">90대</option>
            <option value="100대">100대</option>
          </select>

          <label>성별</label>
          <select value={searchParams.gender} onChange={e => setSearchParams(prev => ({ ...prev, gender: e.target.value }))} className="border rounded px-2 py-1">
            <option value="">선택</option>
            <option value="남">남</option>
            <option value="여">여</option>
          </select>

          <label>이용자 등록번호</label>
          <input type="text" inputMode="numeric" value={searchParams.userIdOrder} onChange={e => setSearchParams(prev => ({ ...prev, userIdOrder: e.target.value.replace(/\D/g, "") }))} className="border rounded px-2 py-1 appearance-none" />

          <label>이름</label>
          <input value={searchParams.userName} onChange={e => setSearchParams(prev => ({ ...prev, userName: e.target.value }))} className="border rounded px-2 py-1" />

          <label className="text-center">휴대폰 번호 or<br/>휴대폰 뒷자리</label>
          <input value={searchParams.phoneNumber} onChange={e => setSearchParams(prev => ({ ...prev, phoneNumber: e.target.value }))} className="border rounded px-2 py-1" />

          <label>인형 아이디</label>
          <input value={searchParams.personalId} onChange={e => setSearchParams(prev => ({ ...prev, personalId: e.target.value }))} className="border rounded px-2 py-1" />

          <div className="col-span-10 flex justify-center mt-1 gap-2">
            <button onClick={() => table.setPageIndex(0)} className="bg-blue-500 text-white px-6 py-1.5 rounded hover:bg-blue-600">검색</button>
            <button onClick={handleReset} className="bg-gray-300 text-black px-6 py-1.5 rounded hover:bg-gray-400">초기화</button>
          </div>
        </div>
      </div>

      {/* 테이블 */}
      <div className="bg-white rounded-lg shadow p-3">
        <div className="flex justify-end items-center space-x-2 py-1 px-2">
          <span>페이지 <strong>{currentPageIndex + 1} / {totalPages}</strong></span>
          <select value={table.getState().pagination.pageSize} onChange={e => table.setPageSize(Number(e.target.value))} className="border rounded px-2 py-1">
            {[10, 20, 30, 50].map(size => (<option key={size} value={size}>{size}개씩 보기</option>))}
          </select>
        </div>

        <table className="w-full border-collapse border border-gray-200 text-sm text-black text-center">
          <thead className="bg-gray-100">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th key={header.id} className="border border-gray-200 px-1 py-2 text-center">{flexRender(header.column.columnDef.header, header.getContext())}</th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length ? table.getRowModel().rows.map(row => (
              <tr key={row.id} className="hover:bg-gray-50">
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="border border-gray-200 px-1 py-2 text-center">{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                ))}
              </tr>
            )) : (
              <tr>
                <td colSpan={columns.length} className="text-center text-gray-500 py-3">검색 결과가 없습니다.</td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="flex justify-center items-center mt-2 space-x-1 text-sm">
          <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} className="px-3 py-1 border rounded disabled:opacity-50">이전</button>
          <div className="flex space-x-1">
            {Array.from({ length: groupEnd - groupStart + 1 }, (_, i) => groupStart + i).map(page => (
              <span key={page} onClick={() => table.setPageIndex(page - 1)} className={`px-2 cursor-pointer ${currentPageIndex === page - 1 ? "text-blue-600 font-bold underline" : ""}`}>{page}</span>
            ))}
          </div>
          <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} className="px-3 py-1 border rounded disabled:opacity-50">다음</button>
        </div>
      </div>
    </div>
  );
}
