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
import { PagedResponse } from "@/types";
import * as XLSX from "xlsx";

// (타입 및 상수 정의는 그대로 유지)
interface AnalysisResultView {
  overall_result_id: number;
  label: "POSITIVE" | "DANGER" | "CRITICAL" | "EMERGENCY";
  summary: string;
  timestamp: string;
  doll_id: string;
  senior_id: number;
  name: string;
  age: number;
  sex: "MALE" | "FEMALE";
  gu: string;
  dong: string;
}

interface Dong {
  dong_code: string;
  dong_name: string;
}
interface Gu {
  gu_code: string;
  gu_name: string;
  dong_list: Dong[];
}

const labelMap: Record<string, string> = {
  EMERGENCY: "긴급",
  CRITICAL: "위험",
  DANGER: "주의",
  POSITIVE: "안전",
};
const labelApiKeys = Object.keys(labelMap);

export default function AnalysisPage() {
  const router = useRouter();

  const [data, setData] = useState<AnalysisResultView[]>([]);
  const [pageCount, setPageCount] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  const [searchParams, setSearchParams] = useState({
    name: "",
    senior_id: "",
    gu: "",
    dong: "",
    label: "",
    doll_id: "",
    age_group: "",
    sex: "",
    start_date: "",
    end_date: "",
  });

  const [administrativeDistricts, setAdministrativeDistricts] = useState<Gu[]>([]);
  const [availableDongs, setAvailableDongs] = useState<Dong[]>([]);

  const [{ pageIndex, pageSize }, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const pagination = useMemo(() => ({ pageIndex, pageSize }), [pageIndex, pageSize]);

  // (데이터 fetching 및 상태 관리 로직은 그대로 유지)
  useEffect(() => {
    const fetchAdminDistricts = async () => {
      try {
        const res = await api.get<Gu[]>("/administrative-districts");
        setAdministrativeDistricts(res.data);
      } catch (error) {
        console.error("Failed to fetch administrative districts:", error);
      }
    };
    fetchAdminDistricts();
  }, []);

  useEffect(() => {
    if (searchParams.gu) {
      const selectedGu = administrativeDistricts.find((g) => g.gu_code === searchParams.gu);
      setAvailableDongs(selectedGu?.dong_list || []);
    } else {
      setAvailableDongs([]);
    }
    setSearchParams((prev) => ({ ...prev, dong: "" }));
  }, [searchParams.gu, administrativeDistricts]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: pageIndex.toString(),
        size: pageSize.toString(),
        sort: "timestamp,desc",
      });
      Object.entries(searchParams).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
      const res = await api.get<PagedResponse<AnalysisResultView>>(
        `/analyze?${queryParams.toString()}`
      );
      setData(res.data.content);
      setPageCount(res.data.total_pages);
      setTotalElements(res.data.total_elements);
    } catch (error) {
      console.error("Failed to fetch analysis data:", error);
    } finally {
      setLoading(false);
    }
  }, [pageIndex, pageSize, searchParams]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchData();
    }, 500);
    return () => clearTimeout(debounceTimer);
  }, [fetchData]);

  const columns = useMemo<ColumnDef<AnalysisResultView>[]>(() => [
    { id: "index", header: () => <div className="text-center">순번</div>, cell: (info) => info.row.index + 1 },
    { accessorKey: "doll_id", header: () => <div className="text-center">인형 ID</div> },
    { accessorKey: "senior_id", header: () => <div className="text-center">이용자 번호</div> },
    { accessorKey: "name", header: () => <div className="text-center">이름</div> },
    { accessorKey: "age", header: () => <div className="text-center">나이</div> },
    { accessorKey: "sex", header: () => <div className="text-center">성별</div>, cell: (info) => (info.getValue() === "MALE" ? "남" : "여") },
    { accessorKey: "gu", header: () => <div className="text-center">자치구</div> },
    { accessorKey: "dong", header: () => <div className="text-center">법정동</div> },
    { accessorKey: "label", header: () => <div className="text-center">분석 결과</div>, cell: (info) => labelMap[info.getValue() as string] || info.getValue() },
    {
      accessorKey: "summary", header: "요약", cell: ({ row }) => (
        <button
          onClick={() => {
            const resultId = row.original.overall_result_id;
            const seniorId = row.original.senior_id;
            router.push(`/analysis/${resultId}?senior_id=${seniorId}`);
          }}
          className="text-blue-600 hover:underline text-left cursor-pointer"
        >
          {row.original.summary}
        </button>
      )
    },
    { 
      accessorKey: "timestamp", 
      header: "분석 일시", 
      cell: (info) => {
        const date = new Date(info.getValue() as string);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hoursRaw = date.getHours();
        const ampm = hoursRaw >= 12 ? '오후' : '오전';
        const hours = String(hoursRaw % 12 || 12).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${year}. ${month}. ${day}. ${ampm} ${hours}:${minutes}:${seconds}`;
      }
    },
  ], [router]);

  const table = useReactTable({
    data, columns, pageCount, state: { pagination },
    onPaginationChange: setPagination, getCoreRowModel: getCoreRowModel(), manualPagination: true,
  });

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    table.setPageIndex(0);
    setSearchParams((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = () => fetchData();
  const handleReset = () => {
    setSearchParams({ name: "", senior_id: "", gu: "", dong: "", label: "", doll_id: "", age_group: "", sex: "", start_date: "", end_date: "" });
    table.setPageIndex(0);
  };
  const handleExcelDownload = async () => { /* ... */ };
  const renderPageNumbers = () => { /* ... */ };

  return (
    <div className="space-y-4 text-black">
      <div className="text-center">
        <h2 className="text-2xl font-bold">전체 분석 결과</h2>
      </div>

      {/* 검색 영역 */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 space-y-4">
        <div className="flex justify-end">
          <button
            onClick={handleExcelDownload}
            disabled={isDownloading}
            className="bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 font-bold text-sm cursor-pointer disabled:bg-gray-400"
          >
            엑셀 다운로드
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-3 items-center text-sm">
          {/* ✅ [수정] 모든 input/select에 border-gray-200 적용 */}
          <div className="flex items-center">
            <label className="w-24 shrink-0 font-semibold text-gray-700 text-right pr-3">자치구</label>
            <select name="gu" value={searchParams.gu} onChange={handleInputChange} className="w-full border border-gray-200 rounded px-2 h-8 bg-white outline-none transition">
              <option value="">전체</option>
              {administrativeDistricts.map(g => <option key={g.gu_code} value={g.gu_code}>{g.gu_name}</option>)}
            </select>
          </div>
          <div className="flex items-center">
            <label className="w-24 shrink-0 font-semibold text-gray-700 text-right pr-3">법정동</label>
            <select name="dong" value={searchParams.dong} onChange={handleInputChange} className="w-full border border-gray-200 rounded px-2 h-8 bg-white outline-none transition" disabled={!searchParams.gu}>
              <option value="">전체</option>
              {availableDongs.map(d => <option key={d.dong_code} value={d.dong_code}>{d.dong_name}</option>)}
            </select>
          </div>
          <div className="flex items-center">
            <label className="w-24 shrink-0 font-semibold text-gray-700 text-right pr-3">분석 결과</label>
            <select name="label" value={searchParams.label} onChange={handleInputChange} className="w-full border border-gray-200 rounded px-2 h-8 bg-white outline-none transition">
              <option value="">전체</option>
              {labelApiKeys.map(key => <option key={key} value={key}>{labelMap[key]}</option>)}
            </select>
          </div>
          <div className="flex items-center">
            <label className="w-24 shrink-0 font-semibold text-gray-700 text-right pr-3">연령대</label>
            <select name="age_group" value={searchParams.age_group} onChange={handleInputChange} className="w-full border border-gray-200 rounded px-2 h-8 bg-white outline-none transition">
              <option value="">전체</option>
              {[60,70,80,90,100].map(a => <option key={a} value={a}>{a===100?'100세 이상':`${a}대`}</option>)}
            </select>
          </div>
          <div className="flex items-center">
            <label className="w-24 shrink-0 font-semibold text-gray-700 text-right pr-3">성별</label>
            <select name="sex" value={searchParams.sex} onChange={handleInputChange} className="w-full border border-gray-200 rounded px-2 h-8 bg-white outline-none transition">
              <option value="">전체</option>
              <option value="MALE">남성</option>
              <option value="FEMALE">여성</option>
            </select>
          </div>
          <div className="flex items-center">
            <label className="w-24 shrink-0 font-semibold text-gray-700 text-right pr-3">이름</label>
            <input name="name" placeholder="이름" value={searchParams.name} onChange={handleInputChange} className="w-full border border-gray-200 rounded px-2 h-8 outline-none transition" />
          </div>
          <div className="flex items-center">
            <label className="w-24 shrink-0 font-semibold text-gray-700 text-right pr-3">인형 ID</label>
            <input name="doll_id" placeholder="인형 ID" value={searchParams.doll_id} onChange={handleInputChange} className="w-full border border-gray-200 rounded px-2 h-8 outline-none transition" />
          </div>
          <div className="flex items-center">
            <label className="w-24 shrink-0 font-semibold text-gray-700 text-right pr-3">이용자 번호</label>
            <input name="senior_id" placeholder="번호" value={searchParams.senior_id} onChange={handleInputChange} className="w-full border border-gray-200 rounded px-2 h-8 outline-none transition" />
          </div>
          <div className="flex items-center col-span-1 md:col-span-2">
            <label className="w-24 shrink-0 font-semibold text-gray-700 text-right pr-3">분석일</label>
            <input type="date" name="start_date" value={searchParams.start_date} onChange={handleInputChange} className="w-full border border-gray-200 rounded px-2 h-8 outline-none transition" />
            <span className="mx-2">~</span>
            <input type="date" name="end_date" value={searchParams.end_date} onChange={handleInputChange} className="w-full border border-gray-200 rounded px-2 h-8 outline-none transition" />
          </div>
        </div>
        <div className="flex justify-center space-x-3 pt-2">
          <button onClick={handleSearch} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-semibold text-sm cursor-pointer transition">검색</button>
          <button onClick={handleReset} className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300 font-semibold text-sm cursor-pointer transition">초기화</button>
        </div>
      </div>

      {/* 결과 테이블 */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-2">
          <span className="font-semibold text-sm">검색 결과 : 총 {totalElements}건</span>
          <select value={table.getState().pagination.pageSize} onChange={e => table.setPageSize(Number(e.target.value))} className="border border-gray-200 rounded px-2 py-1 bg-white text-sm outline-none transition">
            {[10, 20, 30, 40, 50].map(size => <option key={size} value={size}>{size}개씩 보기</option>)}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-gray-600">
            {/* ✅ [수정] thead 스타일 일관성 있게 변경 */}
            <thead className="text-sm text-gray-700 bg-gray-50">
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    // ✅ [수정] th 패딩(py-1.5)과 border 스타일 적용
                    <th key={header.id} className="px-2 py-1.5 font-medium border-b border-gray-200">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={columns.length} className="text-center py-10">데이터를 불러오는 중입니다...</td></tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr><td colSpan={columns.length} className="text-center py-10">검색 결과가 없습니다.</td></tr>
              ) : (
                table.getRowModel().rows.map(row => (
                  // ✅ [수정] tr에 border 스타일 적용
                  <tr key={row.id} className="bg-white border-b border-gray-200 hover:bg-gray-50">
                    {row.getVisibleCells().map(cell => (
                      // ✅ [수정] td 패딩(py-1.5) 적용
                      <td
                        key={cell.id}
                        className={`px-2 py-1.5 align-middle text-gray-700 ${
                          cell.column.id === 'summary' || cell.column.id === 'timestamp'
                            ? 'text-left'
                            : 'text-center'
                        }`}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex justify-center items-center mt-4 space-x-2 text-sm">
          <button
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            className="px-2 py-1 rounded-md disabled:opacity-50 hover:bg-gray-100 cursor-pointer"
          >
            {"<<"}
          </button>
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="px-2 py-1 rounded-md disabled:opacity-50 hover:bg-gray-100 cursor-pointer"
          >
            {"<"}
          </button>

          {Array.from({ length: Math.min(5, pageCount - Math.floor(pageIndex / 5) * 5) }, (_, i) => {
            const pn = Math.floor(pageIndex / 5) * 5 + i;
            if (pn < pageCount)
              return (
                <button
                  key={pn}
                  onClick={() => table.setPageIndex(pn)}
                  className={`px-3 py-1 rounded-md cursor-pointer ${pn === pageIndex ? "bg-blue-500 text-white font-bold" : "text-black hover:bg-gray-100"}`}
                >
                  {pn + 1}
                </button>
              );
          })}

          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="px-2 py-1 rounded-md disabled:opacity-50 hover:bg-gray-100 cursor-pointer"
          >
            {">"}
          </button>
          <button
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            className="px-2 py-1 rounded-md disabled:opacity-50 hover:bg-gray-100 cursor-pointer"
          >
            {">>"}
          </button>
        </div>
      </div>
    </div>
  );
}