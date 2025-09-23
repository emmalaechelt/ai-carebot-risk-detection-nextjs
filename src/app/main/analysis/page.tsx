"use client";

import { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  ColumnDef,
} from "@tanstack/react-table";
import Link from "next/link";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

interface UserData {
  id: number;
  name: string;
  age: number;
  gender: string;
  region: string;
  riskLevel: string;
  utterance: number;
  score: number;
  summary: string;
  registeredAt: string; // 'YYYY-MM-DD HH:mm:ss'
}

export default function AnalysisPage() {
  const [filters, setFilters] = useState({
    status: "",
    dateFrom: "",
    dateTo: "",
    timeFrom: "",
    timeTo: "",
  });

  // 데이터 50개 생성 (시간까지 포함)
  const [data] = useState<UserData[]>(
    Array.from({ length: 50 }).map((_, i) => {
      const date = new Date(
        2025,
        0,
        (i % 30) + 1,
        Math.floor(Math.random() * 24),
        Math.floor(Math.random() * 60),
        Math.floor(Math.random() * 60)
      );
      const formattedDate = date.toISOString().slice(0, 19).replace("T", " "); // 'YYYY-MM-DD HH:mm:ss'
      return {
        id: i + 1,
        name: `이용자 ${i + 1}`,
        age: 65 + (i % 20),
        gender: i % 2 === 0 ? "남" : "여",
        region: ["대덕구", "동구", "서구", "유성구", "중구"][i % 5],
        riskLevel: ["긴급", "위험", "주의", "안전"][i % 4],
        utterance: Math.floor(Math.random() * 100),
        score: Math.floor(Math.random() * 100),
        summary: `요약 내용 예시 ${i + 1}. `.repeat(10).slice(0, 200),
        registeredAt: formattedDate,
      };
    })
  );

  const filteredData = useMemo(() => {
    return data.filter((d) => {
      const regDate = new Date(d.registeredAt);
      const fromDate = filters.dateFrom ? new Date(filters.dateFrom) : null;
      const toDate = filters.dateTo ? new Date(filters.dateTo) : null;
      const fromTime = filters.timeFrom ? filters.timeFrom.split(":") : null;
      const toTime = filters.timeTo ? filters.timeTo.split(":") : null;

      if (filters.status && d.riskLevel !== filters.status) return false;
      if (fromDate && regDate < fromDate) return false;
      if (toDate && regDate > toDate) return false;
      if (fromTime && (regDate.getHours() < +fromTime[0] || (regDate.getHours() === +fromTime[0] && regDate.getMinutes() < +fromTime[1]))) return false;
      if (toTime && (regDate.getHours() > +toTime[0] || (regDate.getHours() === +toTime[0] && regDate.getMinutes() > +toTime[1]))) return false;

      return true;
    });
  }, [data, filters]);

  const columns = useMemo<ColumnDef<UserData>[]>(
    () => [
      { accessorKey: "id", header: "순서" },
      {
        accessorKey: "name",
        header: "이름",
        cell: ({ row }) => (
          <Link
            href={`/main/users/view/${row.original.id}`}
            className="text-blue-600 hover:underline"
          >
            {row.original.name}
          </Link>
        ),
      },
      { accessorKey: "age", header: "나이" },
      { accessorKey: "gender", header: "성별" },
      { accessorKey: "region", header: "거주지역" },
      { accessorKey: "riskLevel", header: "라벨" },
      { accessorKey: "utterance", header: "발화건수" },
      { accessorKey: "score", header: "점수" },
      {
        accessorKey: "summary",
        header: "요약",
        cell: ({ getValue }) => {
          const text = getValue() as string;
          return text.length > 100 ? text.slice(0, 100) + "..." : text;
        },
      },
      {
        accessorKey: "registeredAt",
        header: "분석요청시간",
        cell: ({ getValue }) => {
          const full = getValue() as string;
          const [date, time] = full.split(" ");
          return (
            <div>
              <div>{date}</div>
              <div>{time}</div>
            </div>
          );
        },
      },
    ],
    []
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleSearch = () => {
    console.log("검색 조건:", filters);
  };

  const handleDownloadExcel = () => {
    const exportData = table.getRowModel().rows.map((row) => {
      const rowData: Record<string, any> = {};
      row.getVisibleCells().forEach((cell) => {
        rowData[cell.column.columnDef.header as string] = cell.getValue();
      });
      return rowData;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "분석결과");
    const excelBuffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, "분석결과.xlsx");
  };

  const PAGE_GROUP_SIZE = 5;
  const currentPageIndex = table.getState().pagination.pageIndex;
  const totalPages = table.getPageCount();
  const groupStart = Math.floor(currentPageIndex / PAGE_GROUP_SIZE) * PAGE_GROUP_SIZE + 1;
  const groupEnd = Math.min(groupStart + PAGE_GROUP_SIZE - 1, totalPages);

  return (
    <div className="text-black space-y-1 text-center">
      {/* 검색 영역 */}
      <div className="p-1 px-4 bg-white rounded-lg shadow">
        <h2 className="font-bold text-xl mt-3">전체 분석결과</h2>
        <button
          onClick={handleDownloadExcel}
          className="bg-green-400 text-white px-2 py-1 rounded-lg hover:bg-green-600 flex ml-auto text-sm leading-tight"
        >
          엑셀 다운로드
        </button>

        <div className="grid grid-cols-10 gap-3 mt-2 mr-5 p-3">
          <label>현재상태(라벨)</label>
          <select
            name="status"
            value={filters.status}
            onChange={handleChange}
            className="border rounded px-2 py-1"
          >
            <option value="">선택</option>
            <option value="긴급">긴급</option>
            <option value="위험">위험</option>
            <option value="주의">주의</option>
            <option value="안전">안전</option>
          </select>

          <label>날짜</label>
          <input
            type="date"
            name="dateFrom"
            value={filters.dateFrom}
            onChange={handleChange}
            className="border rounded px-2 py-1"
          />
          <span>~</span>
          <input
            type="date"
            name="dateTo"
            value={filters.dateTo}
            onChange={handleChange}
            className="border rounded px-2 py-1"
          />

          <label>시간</label>
          <input
            type="time"
            name="timeFrom"
            value={filters.timeFrom}
            onChange={handleChange}
            className="border rounded px-2 py-1"
          />
          <span>~</span>
          <input
            type="time"
            name="timeTo"
            value={filters.timeTo}
            onChange={handleChange}
            className="border rounded px-2 py-1"
          />

          <div className="col-span-10 mt-2 flex justify-center">
            <button
              onClick={handleSearch}
              className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
            >
              검색
            </button>
          </div>
        </div>
      </div>

      {/* 결과 테이블 */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex justify-end items-center space-x-2 p-2">
          <span>
            페이지 <strong>{currentPageIndex + 1} / {totalPages}</strong>
          </span>
          <select
            value={table.getState().pagination.pageSize}
            onChange={e => table.setPageSize(Number(e.target.value))}
            className="border rounded px-2 py-1"
          >
            {[10, 20, 30, 50].map(size => (
              <option key={size} value={size}>{size}개씩 보기</option>
            ))}
          </select>
        </div>

        <table className="w-full border-collapse border border-gray-200 text-sm text-black text-center">
          <thead className="bg-gray-100">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    className="border border-gray-200 px-1 py-2 text-center cursor-pointer"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {{
                      asc: " 🔼",
                      desc: " 🔽",
                    }[header.column.getIsSorted() as string] ?? null}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length ? table.getRowModel().rows.map(row => (
              <tr key={row.id} className="hover:bg-gray-50">
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="border border-gray-200 px-1 py-2 text-center items-center justify-center">
                    {cell.column.id === "summary"
                      ? (cell.getValue() as string).slice(0, 100)
                      : flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            )) : (
              <tr>
                <td colSpan={columns.length} className="text-center text-gray-500 py-6">
                  검색 결과가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="flex justify-center items-center mt-4 space-x-1 text-sm">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            이전
          </button>

          <div className="flex space-x-1">
            {Array.from({ length: groupEnd - groupStart + 1 }, (_, i) => groupStart + i).map(page => (
              <span
                key={page}
                onClick={() => table.setPageIndex(page - 1)}
                className={`px-2 cursor-pointer ${currentPageIndex === page - 1 ? "text-blue-600 font-bold underline" : ""}`}
              >
                {page}
              </span>
            ))}
          </div>

          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            다음
          </button>
        </div>
      </div>
    </div>
  );
}