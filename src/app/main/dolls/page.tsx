"use client";

import { useState, useEffect, useCallback, FormEvent, useMemo } from "react";
import { 
  useReactTable, 
  getCoreRowModel, 
  flexRender, 
  ColumnDef, 
  PaginationState 
} from "@tanstack/react-table";
import api from "@/lib/api"; // ✅ 중앙 api 인스턴스를 직접 사용합니다.
import { DollListView } from "@/types/index";
import { AxiosError } from "axios";

// API 호출을 위한 dollApi 객체 정의
const dollApi = {
  getList: (page = 0, size = 15) => api.get("/dolls", { params: { page, size } }),
  delete: (dollId: string) => api.delete(`/dolls/${dollId}`),
  create: (dollId: string) => api.post("/dolls", { id: dollId }),
};


export default function DollsPage() {
  // --- 상태 관리 ---
  const [data, setData] = useState<DollListView[]>([]);
  const [isLoading, setIsLoading] = useState(true); // 데이터 로딩 상태
  const [isSubmitting, setIsSubmitting] = useState(false); // 등록/삭제 등 액션 처리 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newDollId, setNewDollId] = useState("");
  const [totalElements, setTotalElements] = useState(0);

  // Tanstack Table의 페이지네이션 상태
  const [{ pageIndex, pageSize }, setPagination] = useState<PaginationState>({ 
    pageIndex: 0, 
    pageSize: 15 
  });
  
  // --- 데이터 페칭 ---
  const fetchDolls = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await dollApi.getList(pageIndex, pageSize);
      setData(response.data.content);
      setTotalElements(response.data.total_elements);
    } catch (error) {
      console.error("인형 목록 조회 실패:", error);
      alert("인형 목록을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [pageIndex, pageSize]);

  useEffect(() => {
    fetchDolls();
  }, [fetchDolls]);

  // --- 이벤트 핸들러 ---
  const handleDelete = useCallback(async (dollId: string) => {
    if (!confirm(`정말로 인형 "${dollId}"을(를) 삭제하시겠습니까?`)) return;
    
    setIsSubmitting(true);
    try {
      await dollApi.delete(dollId);
      alert("인형이 성공적으로 삭제되었습니다.");
      fetchDolls(); // ✅ 데이터를 다시 불러와 목록을 갱신합니다.
    } catch (error) {
      const err = error as AxiosError<{ error: string }>;
      const message = err.response?.data?.error || "알 수 없는 오류가 발생했습니다.";
      
      if (err.response?.status === 409) {
        alert("오류: 해당 인형은 시니어에게 할당되어 있어 삭제할 수 없습니다.");
      } else {
        alert(`삭제 실패: ${message}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [fetchDolls]);

  const handleRegister = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    const trimmedId = newDollId.trim();
    if (!trimmedId) {
      alert("인형 ID를 입력해주세요.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      await dollApi.create(trimmedId);
      alert("인형이 성공적으로 등록되었습니다.");
      setIsModalOpen(false);
      setNewDollId("");
      fetchDolls(); // ✅ 데이터를 다시 불러와 목록을 갱신합니다.
    } catch (error) {
      const err = error as AxiosError<{ error: string }>;
      const message = err.response?.data?.error || "알 수 없는 오류가 발생했습니다.";

      if (err.response?.status === 409) {
        alert("오류: 이미 존재하는 인형 ID입니다.");
      } else {
        alert(`등록 실패: ${message}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [newDollId, fetchDolls]);

  // --- 테이블 컬럼 정의 ---
  const columns = useMemo<ColumnDef<DollListView>[]>(() => [
    {
      header: "순번",
      cell: ({ row }) => (pageIndex * pageSize) + row.index + 1,
      size: 60,
    },
    {
      accessorKey: "id",
      header: "인형 ID",
    },
    {
      accessorKey: "senior_id",
      header: "할당된 이용자 번호",
      cell: ({ getValue }) => getValue() ?? <span className="text-gray-500">없음</span>,
    },
    {
      id: "actions",
      header: "관리",
      cell: ({ row }) => (
        <button
          onClick={() => handleDelete(row.original.id)}
          disabled={isSubmitting}
          className="px-3 py-1 rounded text-xs font-semibold transition-colors bg-red-500 text-white hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          삭제
        </button>
      ),
      size: 80,
    },
  ], [pageIndex, pageSize, isSubmitting, handleDelete]); // ✅ 의존성 배열을 명확하게 설정합니다.

  // --- React Table 인스턴스 생성 ---
  const table = useReactTable({
    data,
    columns,
    state: { pagination: { pageIndex, pageSize } },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    pageCount: Math.ceil(totalElements / pageSize), // 총 페이지 수 계산
    manualPagination: true, // 서버 사이드 페이지네이션 사용
  });

  // --- 렌더링 ---
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">인형 관리</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-700">
            총 <span className="font-bold text-blue-600">{totalElements}</span>개의 인형이 등록되어 있습니다.
          </p>
          <button 
            onClick={() => setIsModalOpen(true)} 
            disabled={isSubmitting}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-bold text-sm transition-colors disabled:bg-gray-400"
          >
            신규 등록
          </button>
        </div>
        
        {/* 테이블 */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-gray-50">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="border-b-2 p-3 text-left font-semibold text-gray-600">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={columns.length} className="text-center py-10 text-gray-500">데이터를 불러오는 중입니다...</td></tr>
              ) : table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50 border-b">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="p-3 text-gray-800">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr><td colSpan={columns.length} className="text-center py-10 text-gray-500">등록된 인형이 없습니다.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 페이지네이션 */}
        <div className="flex items-center justify-between gap-2 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-gray-600">페이지 당 개수:</span>
            <select
              value={pageSize}
              onChange={e => table.setPageSize(Number(e.target.value))}
              className="border rounded-md px-2 py-1 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[10, 15, 20, 30, 50].map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()} className="p-1 disabled:opacity-50">«</button>
            <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} className="p-1 disabled:opacity-50">‹</button>
            <span className="font-medium">
              {pageIndex + 1} / {table.getPageCount()}
            </span>
            <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} className="p-1 disabled:opacity-50">›</button>
            <button onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()} className="p-1 disabled:opacity-50">»</button>
          </div>
        </div>
      </div>

      {/* 등록 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-xl font-bold text-gray-800">신규 인형 등록</h3>
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label htmlFor="new-doll-id" className="block text-sm font-medium text-gray-700 mb-1">인형 고유 ID</label>
                <input 
                  id="new-doll-id" 
                  type="text" 
                  value={newDollId} 
                  onChange={(e) => setNewDollId(e.target.value)} 
                  placeholder="예: doll-serial-12345" 
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-md bg-gray-200 text-gray-800 hover:bg-gray-300 text-sm font-semibold transition-colors disabled:opacity-60"
                >
                  취소
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 text-sm font-semibold transition-colors disabled:bg-blue-400"
                >
                  {isSubmitting ? "등록 중..." : "등록"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}