"use client";

import { useState, useEffect, useCallback, ChangeEvent, FormEvent, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
  ColumnDef,
  PaginationState,
} from "@tanstack/react-table";
import { dollApi } from "@/lib/api";
import { DollListView } from "@/types/index";
import { AxiosError } from "axios";

export default function DollsPage() {
  const [data, setData] = useState<DollListView[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newDollId, setNewDollId] = useState("");

  // 페이지네이션 상태
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 15,
  });
  const { pageIndex, pageSize } = pagination;

  const [totalElements, setTotalElements] = useState(0);

  const fetchDolls = useCallback(async () => {
    try {
      setLoading(true);
      const dolls = await dollApi.getList(); // 필요시 API를 pageIndex/pageSize 기반으로 수정
      setData(dolls);
      setTotalElements(dolls.length);
    } catch (error) {
      console.error("인형 목록 불러오기 실패:", error);
      alert("인형 목록을 불러오는 데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDolls();
  }, [fetchDolls]);

  const handleDelete = async (dollId: string) => {
    if (!confirm(`정말로 인형 "${dollId}"을(를) 삭제하시겠습니까?`)) return;
    try {
      await dollApi.delete(dollId);
      alert("삭제되었습니다.");
      fetchDolls();
    } catch (error) {
      const err = error as AxiosError;
      console.error(err);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    if (!newDollId.trim()) {
      alert("인형 ID를 입력해주세요.");
      return;
    }
    try {
      await dollApi.create(newDollId.trim());
      alert("인형이 등록되었습니다.");
      setNewDollId("");
      setIsModalOpen(false);
      fetchDolls();
    } catch (error) {
      const err = error as AxiosError;
      if (err.response?.status === 409) {
        alert("이미 존재하는 인형 ID입니다. 다른 ID를 입력해주세요.");
      } else {
        console.error("등록 실패:", err);
        alert("등록 중 오류가 발생했습니다.");
      }
    }
  };

  const columns = useMemo<ColumnDef<DollListView>[]>(() => [
    { id: "index", header: "순번", cell: (info) => info.row.index + 1 },
    { accessorKey: "id", header: "인형 ID" },
    { accessorKey: "senior_id", header: "이용자 번호", cell: (info) => info.getValue() ?? "-" },
    {
      id: "actions",
      header: "관리",
      cell: (info) => (
        <button
          onClick={() => handleDelete(info.row.original.id)}
          className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 text-xs"
        >
          삭제
        </button>
      ),
    },
  ], []);

  const table = useReactTable({
    data,
    columns,
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    pageCount: Math.ceil(data.length / pageSize),
    manualPagination: false,
  });

  const totalPages = table.getPageCount();

  const renderPageNumbers = () => {
    const currentPage = pageIndex + 1;
    const pageNumbers: number[] = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);
    } else {
      let startPage = Math.max(1, currentPage - 2);
      let endPage = Math.min(totalPages, currentPage + 2);
      if (currentPage <= 3) {
        startPage = 1;
        endPage = maxPagesToShow;
      } else if (currentPage >= totalPages - 2) {
        startPage = totalPages - maxPagesToShow + 1;
        endPage = totalPages;
      }
      for (let i = startPage; i <= endPage; i++) pageNumbers.push(i);
    }

    return pageNumbers.map((number) => (
      <button
        key={number}
        onClick={() => table.setPageIndex(number - 1)}
        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
          currentPage === number ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-gray-100"
        }`}
      >
        {number}
      </button>
    ));
  };

  return (
    <div className="p-4 text-black space-y-4">
      <h2 className="text-2xl font-bold text-center">인형 관리</h2>

      <div className="bg-white rounded-lg shadow-sm p-4 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">
            총 <strong>{totalElements}</strong> 명
          </span>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 text-sm font-semibold"
          >
            등록
          </button>
        </div>

        <div className="flex justify-end mt-2">
          <select
            value={pageSize}
            onChange={(e) => setPagination({ pageIndex: 0, pageSize: Number(e.target.value) })}
            className="border rounded px-2 py-1 bg-white text-sm"
          >
            {[10, 15, 20, 30, 50].map(size => (
              <option key={size} value={size}>{size}개씩 보기</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm text-center">
            <thead className="bg-gray-50">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="border-b px-2 py-1 font-medium text-gray-600 whitespace-nowrap">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={columns.length} className="py-4 text-gray-500">불러오는 중...</td></tr>
              ) : table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50 border-b">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-2 py-1 whitespace-nowrap">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr><td colSpan={columns.length} className="py-4 text-gray-500">등록된 인형이 없습니다.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 페이지네이션 */}
        <div className="flex items-center justify-center gap-2 mt-4 text-gray-600">
          <button
            className="p-1 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            {'<<'}
          </button>
          <button
            className="p-1 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            {'<'}
          </button>

          {/* 고정 폭 컨테이너로 페이지 버튼 위치 흔들림 방지 */}
          <div className="flex gap-2 min-w-[200px] justify-between">
            {renderPageNumbers()}
          </div>

          <button
            className="p-1 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            {'>'}
          </button>
          <button
            className="p-1 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            {'>>'}
          </button>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-xl shadow-lg p-4 w-full max-w-sm space-y-3">
            <h3 className="text-lg font-bold text-center">인형 등록</h3>
            <form onSubmit={handleRegister} className="space-y-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">인형 ID</label>
                <input
                  type="text"
                  value={newDollId}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setNewDollId(e.target.value)}
                  placeholder="인형 고유 ID 입력"
                  className="w-full border rounded px-2 py-1 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-gray-300 text-black px-3 py-1 rounded hover:bg-gray-400 text-sm"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm"
                >
                  등록
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
