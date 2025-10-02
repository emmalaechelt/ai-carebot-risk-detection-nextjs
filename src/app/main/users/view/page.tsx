// src/app/main/users/view/page.tsx
"use client";

import { useState, useEffect, useMemo, ChangeEvent, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
  PaginationState,
} from "@tanstack/react-table";
import api from "@/lib/api";
import { SeniorListView, PagedResponse } from "@/types";

// 지역구/행정동 데이터 (검색 UI용)
const neighborhoodOptions: Record<string, string[]> = {
  "동구": [ "중앙동", "신인동", "효 동", "판암1동", "판암2동", "용운동", "대동", "자양동", "가양1동", "가양2동", "용전동", "성남동", "홍도동", "삼성동", "대청동", "산내동" ],
  "중구": [ "은행선화동", "목동", "중촌동", "대흥동", "문창동", "석교동", "대사동", "부사동", "용두동", "오류동", "태평1동", "태평2동", "유천1동", "유천2동", "문화1동", "문화2동", "산성동" ],
  "서구": [ "복수동", "도마1동", "도마2동", "정림동", "변동", "용문동", "탄방동", "둔산1동", "둔산2동", "둔산3동", "괴정동", "가장동", "내동", "갈마1동", "갈마2동", "월평1동", "월평2동", "월평3동", "만년동", "가수원동", "도안동", "관저1동", "관저2동", "기성동" ],
  "유성구": [ "진잠동", "학하동", "원신흥동", "상대동", "온천1동", "온천2동", "노은1동", "노은2동", "노은3동", "신성동", "전민동", "구즉동", "관평동" ],
  "대덕구": [ "오정동", "대화동", "회덕동", "비래동", "송촌동", "중리동", "법1동", "법2동", "신탄진동", "석봉동", "덕암동", "목상동" ]
};

// 현재 상태 한글 매핑
const statusMap: Record<string, string> = {
  "EMERGENCY": "긴급",
  "CRITICAL": "위험",
  "DANGER": "주의",
  "POSITIVE": "안전"
};
const statusApiKeys = Object.keys(statusMap);

export default function UsersViewPage() {
  const router = useRouter();

  const [data, setData] = useState<SeniorListView[]>([]);
  const [pageCount, setPageCount] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);

  const [searchParams, setSearchParams] = useState({
    name: "", phone: "", gu: "", dong: "", state: "", doll_id: "", age_group: "", sex: "", senior_id: ""
  });
  const [availableNeighborhoods, setAvailableNeighborhoods] = useState<string[]>([]);
  
  const [{ pageIndex, pageSize }, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const pagination = useMemo(() => ({ pageIndex, pageSize }), [pageIndex, pageSize]);

  useEffect(() => {
    if (searchParams.gu) {
      setAvailableNeighborhoods(neighborhoodOptions[searchParams.gu] || []);
    } else {
      setAvailableNeighborhoods([]);
    }
    setSearchParams(prev => ({ ...prev, dong: "" }));
  }, [searchParams.gu]);
  
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchData();
    }, 500);
    return () => clearTimeout(debounceTimer);
  }, [searchParams, pageIndex, pageSize]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: pageIndex.toString(),
        size: pageSize.toString(),
        sort: "created_at,desc",
      });

      Object.entries(searchParams).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      const res = await api.get<PagedResponse<SeniorListView>>(`/seniors?${queryParams.toString()}`);
      setData(res.data.content);
      setPageCount(res.data.total_pages);
      setTotalElements(res.data.total_elements);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      alert("이용자 목록을 불러오는 데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }, [pageIndex, pageSize, searchParams]);

  const columns = useMemo<ColumnDef<SeniorListView>[]>(() => [
    {
      id: 'index',
      header: '순번',
      cell: info => pageIndex * pageSize + info.row.index + 1,
    },
    { accessorKey: "senior_id", header: "이용자 번호" },
    {
      accessorKey: "name",
      header: "이름",
      cell: info => (
        <span
          className="text-blue-600 cursor-pointer hover:underline"
          onClick={() => router.push(`/main/users/view/${info.row.original.senior_id}`)}
        >
          {info.getValue() as string}
        </span>
      ),
    },
    { accessorKey: "age", header: "나이" },
    { accessorKey: "sex", header: "성별", cell: info => (info.getValue() === "MALE" ? "남" : "여") },
    { accessorKey: "gu", header: "자치구" },
    { accessorKey: "dong", header: "행정동" },
    { 
      accessorKey: "state", 
      header: "현재 상태",
      cell: info => statusMap[info.getValue() as string] || info.getValue() as string
    },
    { accessorKey: "doll_id", header: "인형아이디" },
    { accessorKey: "phone", header: "전화번호" },
    { accessorKey: "created_at", header: "등록일", cell: info => new Date(info.getValue() as string).toLocaleDateString() },
  ], [router, pageIndex, pageSize]);

  const table = useReactTable({
    data,
    columns,
    pageCount,
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
  });

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    table.setPageIndex(0); 
    setSearchParams(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = () => fetchData();

  const handleReset = () => {
    setSearchParams({ name: "", phone: "", gu: "", dong: "", state: "", doll_id: "", age_group: "", sex: "", senior_id: "" });
    table.setPageIndex(0);
  };
  
  const handleRegister = () => router.push("/main/users/register");

  return (
    <div className="p-2 space-y-2 text-black">
      <h2 className="text-2xl font-bold text-center">이용자 관리</h2>

      <div className="bg-white p-3 rounded-lg shadow-sm space-y-2">
        <div className="flex justify-end">
          <button onClick={handleRegister} className="bg-green-500 text-white px-4 py-1.5 rounded-lg hover:bg-green-600 font-semibold text-sm">
            등록
          </button>
        </div>
        
        {/* 검색 필드 간 세로 간격 조정 (gap-y-3) */}
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-x-6 gap-y-3 items-center text-sm">
          {/* 1행 */}
          <div className="lg:col-span-2 flex items-center">
             {/* 레이블 스타일 통일 */}
            <label className="w-28 shrink-0 font-medium text-gray-700 text-right pr-2">현재 상태</label>
            <select name="state" value={searchParams.state} onChange={handleInputChange} className="w-full border rounded px-2 py-1 bg-white">
              <option value="">전체</option>
              {statusApiKeys.map(key => (
                <option key={key} value={key}>{statusMap[key]}</option>
              ))}
            </select>
          </div>
          <div className="lg:col-span-2 flex items-center">
            <label className="w-28 shrink-0 font-medium text-gray-700 text-right pr-2">이용자 번호</label>
            <input name="senior_id" placeholder="번호" value={searchParams.senior_id} onChange={handleInputChange} className="w-full border rounded px-2 py-1" />
          </div>
          <div className="lg:col-span-2 flex items-center">
            <label className="w-28 shrink-0 font-medium text-gray-700 text-right pr-2">이름</label>
            <input name="name" placeholder="이름" value={searchParams.name} onChange={handleInputChange} className="w-full border rounded px-2 py-1" />
          </div>
          <div className="lg:col-span-4 flex items-center">
            {/* [수정] 휴대폰 번호 레이블의 너비만 w-28에서 w-40으로 조정 */}
            <label className="w-40 shrink-0 font-medium text-gray-700 text-right pr-2">휴대폰 번호 or 뒷자리</label>
            <input name="phone" placeholder="'-' 없이 숫자만 입력" value={searchParams.phone} onChange={handleInputChange} className="w-full border rounded px-2 py-1" />
          </div>
          
          {/* 2행 */}
          <div className="lg:col-span-2 flex items-center">
            <label className="w-28 shrink-0 font-medium text-gray-700 text-right pr-2">연령대</label>
            <select name="age_group" value={searchParams.age_group} onChange={handleInputChange} className="w-full border rounded px-2 py-1 bg-white">
              <option value="">전체</option>
              {[60, 70, 80, 90, 100].map(age => <option key={age} value={age}>{age === 100 ? '100세 이상' : `${age}대`}</option>)}
            </select>
          </div>
          <div className="lg:col-span-2 flex items-center">
            <label className="w-28 shrink-0 font-medium text-gray-700 text-right pr-2">성별</label>
            <select name="sex" value={searchParams.sex} onChange={handleInputChange} className="w-full border rounded px-2 py-1 bg-white">
              <option value="">전체</option>
              <option value="MALE">남</option>
              <option value="FEMALE">여</option>
            </select>
          </div>
          <div className="lg:col-span-2 flex items-center">
            <label className="w-28 shrink-0 font-medium text-gray-700 text-right pr-2">자치구</label>
            <select name="gu" value={searchParams.gu} onChange={handleInputChange} className="w-full border rounded px-2 py-1 bg-white">
              <option value="">전체</option>
              {Object.keys(neighborhoodOptions).map(d => (<option key={d} value={d}>{d}</option>))}
            </select>
          </div>
          <div className="lg:col-span-2 flex items-center">
            <label className="w-28 shrink-0 font-medium text-gray-700 text-right pr-2">행정동</label>
            <select name="dong" value={searchParams.dong} onChange={handleInputChange} className="w-full border rounded px-2 py-1 bg-white" disabled={!searchParams.gu}>
              <option value="">전체</option>
              {availableNeighborhoods.map(n => (<option key={n} value={n}>{n}</option>))}
            </select>
          </div>
          <div className="lg:col-span-2 flex items-center">
            <label className="w-28 shrink-0 font-medium text-gray-700 text-right pr-2">인형 아이디</label>
            <input name="doll_id" placeholder="인형 아이디" value={searchParams.doll_id} onChange={handleInputChange} className="w-full border rounded px-2 py-1" />
          </div>
        </div>

        <div className="flex justify-center gap-2 pt-1">
          <button onClick={handleSearch} className="bg-blue-500 text-white px-6 py-1.5 rounded-lg hover:bg-blue-600 font-semibold text-sm">검색</button>
          <button onClick={handleReset} className="bg-gray-300 text-black px-6 py-1.5 rounded-lg hover:bg-gray-400 font-semibold text-sm">초기화</button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-3">
        <div className="flex justify-between items-center text-xs pb-1">
          <span>총 <strong>{totalElements}</strong> 명</span>
          <select value={table.getState().pagination.pageSize} onChange={e => table.setPageSize(Number(e.target.value))} className="border rounded px-1 py-0.5 bg-white">
            {[10, 20, 30, 50].map(size => (<option key={size} value={size}>{size}개씩 보기</option>))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm text-center">
            <thead className="bg-gray-50">
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {/* 테이블 헤더/셀 세로 여백 조정 (py-2) */}
                  {headerGroup.headers.map(header => (
                    <th key={header.id} className="border-b px-2 py-2 font-medium text-gray-600 whitespace-nowrap">{flexRender(header.column.columnDef.header, header.getContext())}</th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={columns.length} className="text-center py-10">목록을 불러오는 중...</td></tr>
              ) : table.getRowModel().rows.length > 0 ? table.getRowModel().rows.map(row => (
                <tr key={row.id} className="hover:bg-gray-50 border-b">
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="px-2 py-2 whitespace-nowrap">{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                  ))}
                </tr>
              )) : (
                <tr><td colSpan={columns.length} className="text-center text-gray-500 py-10">검색 결과가 없습니다.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex justify-center items-center mt-2 space-x-2 text-sm">
          <button onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()} className="px-2.5 py-1 border rounded disabled:opacity-50 hover:bg-gray-100">«</button>
          <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} className="px-2.5 py-1 border rounded disabled:opacity-50 hover:bg-gray-100">‹</button>
          <div className="flex items-center space-x-2">
            {Array.from({ length: Math.min(5, pageCount - Math.floor(pageIndex / 5) * 5) }, (_, i) => {
                const pageNumber = Math.floor(pageIndex / 5) * 5 + i;
                if (pageNumber < pageCount) {
                    return (
                        <button
                            key={pageNumber}
                            onClick={() => table.setPageIndex(pageNumber)}
                            className={`px-3 py-1 rounded-md cursor-pointer ${
                                pageNumber === pageIndex
                                    ? 'bg-blue-500 text-white font-bold'
                                    : 'text-black hover:underline'
                            }`}
                        >
                            {pageNumber + 1}
                        </button>
                    );
                }
                return null;
            })}
          </div>
          <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} className="px-2.5 py-1 border rounded disabled:opacity-50 hover:bg-gray-100">›</button>
          <button onClick={() => table.setPageIndex(pageCount - 1)} disabled={!table.getCanNextPage()} className="px-2.5 py-1 border rounded disabled:opacity-50 hover:bg-gray-100">»</button>
        </div>
      </div>
    </div>
  );
}