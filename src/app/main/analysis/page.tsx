// src/app/main/analysis/page.tsx
"use client";

import { useState, useEffect, useMemo, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
  ColumnDef,
  PaginationState,
} from "@tanstack/react-table";
import api from "@/lib/api";
import { OverallResult, PagedResponse } from "@/types";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function AnalysisPage() {
  const router = useRouter();

  const [data, setData] = useState<OverallResult[]>([]);
  const [pageCount, setPageCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [searchParams, setSearchParams] = useState({
    name: "", label: "", start_date: "", end_date: "", gu: "", dong: ""
  });
  const [{ pageIndex, pageSize }, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });

  const pagination = useMemo(() => ({ pageIndex, pageSize }), [pageIndex, pageSize]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams({
          page: pageIndex.toString(),
          size: pageSize.toString(),
        });
        Object.entries(searchParams).forEach(([key, value]) => {
          if (value) queryParams.append(key, value);
        });

        const res = await api.get<PagedResponse<OverallResult>>(`/analyze?${queryParams.toString()}`);
        setData(res.data.content);
        setPageCount(res.data.total_pages);
      } catch (error) {
        console.error("Failed to fetch analysis results:", error);
        alert("분석 결과를 불러오는 데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [searchParams, pageIndex, pageSize]);

  const columns = useMemo<ColumnDef<OverallResult>[]>(() => [
    { accessorKey: "overall_result_id", header: "분석 ID" },
    {
      accessorKey: "name", header: "이름",
      cell: info => (
        <span className="text-blue-600 cursor-pointer hover:underline" onClick={() => router.push(`/main/users/${info.row.original.senior_id}`)}>
          {info.getValue() as string}
        </span>
      ),
    },
    { accessorKey: "age", header: "나이" },
    { accessorKey: "sex", header: "성별", cell: info => (info.getValue() === "MALE" ? "남" : "여") },
    { accessorKey: "gu", header: "거주지" },
    { accessorKey: "label", header: "분석 라벨" },
    { accessorKey: "summary", header: "요약", cell: info => <p className="truncate max-w-xs">{info.getValue() as string}</p> },
    { accessorKey: "timestamp", header: "분석 시간", cell: info => new Date(info.getValue() as string).toLocaleString('ko-KR') },
  ], [router]);

  const table = useReactTable({
    data, columns, pageCount,
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
  });

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSearchParams(prev => ({ ...prev, [name]: value }));
  };

  const handleDownloadExcel = () => {
    const exportData = data.map(item => ({
      "분석 ID": item.overall_result_id,
      "이름": item.name,
      "나이": item.age,
      "성별": item.sex === 'MALE' ? '남' : '여',
      "거주지": `${item.gu} ${item.dong}`,
      "분석 라벨": item.label,
      "요약": item.summary,
      "분석 시간": new Date(item.timestamp).toLocaleString('ko-KR'),
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "분석결과");
    const excelBuffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
    saveAs(new Blob([excelBuffer]), "분석결과.xlsx");
  };

  return (
    <div className="space-y-4 text-black">
      <h2 className="text-2xl font-bold text-center">전체 분석결과</h2>
      
      <div className="bg-white p-4 rounded-lg shadow-sm space-y-4">
        <div className="flex justify-end">
          <button onClick={handleDownloadExcel} className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 font-semibold">
            엑셀 다운로드
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 items-center text-sm">
          <input name="name" placeholder="이름" value={searchParams.name} onChange={handleInputChange} className="border rounded px-2 py-1.5" />
          <select name="label" value={searchParams.label} onChange={handleInputChange} className="border rounded px-2 py-1.5 bg-white">
            <option value="">라벨 (전체)</option>
            <option value="EMERGENCY">긴급</option>
            <option value="CRITICAL">심각</option>
            <option value="DANGER">위험</option>
            <option value="POSITIVE">긍정</option>
          </select>
          <input type="date" name="start_date" value={searchParams.start_date} onChange={handleInputChange} className="border rounded px-2 py-1.5" />
          <input type="date" name="end_date" value={searchParams.end_date} onChange={handleInputChange} className="border rounded px-2 py-1.5" />
        </div>
        <div className="flex justify-center mt-2">
            <button onClick={() => table.setPageIndex(0)} className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 font-semibold">검색</button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4">
        {/* 테이블 렌더링 (UsersPage와 동일한 구조) */}
        <table className="w-full border-collapse text-sm text-center">
          <thead className="bg-gray-50">{/* ... thead ... */}</thead>
          <tbody>{/* ... tbody ... */}</tbody>
        </table>
        <div className="flex justify-center items-center mt-4 space-x-2 text-sm">{/* ... pagination controls ... */}</div>
      </div>
    </div>
  );
}