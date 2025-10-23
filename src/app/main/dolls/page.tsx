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
import { DollListView, PagedResponse } from "@/types/index";
import { AxiosError } from "axios";

export default function DollsPage() {
  const [data, setData] = useState<DollListView[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newDollId, setNewDollId] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 15,
  });
  const { pageIndex, pageSize } = pagination;
  const totalElements = data.length;

  const fetchDolls = useCallback(async () => {
    try {
       setLoading(true);
      // [최종 수정 1] API가 PagedResponse 객체를 반환한다고 명시합니다.
      const response: PagedResponse<DollListView> = await dollApi.getList();
      
      // [최종 수정 2] response 객체 안의 'content' 배열을 데이터로 설정합니다.
      setData(response.content);
      
      // [최종 수정 3] response 객체 안의 'total_elements'를 총 개수로 설정합니다.
      setTotalElements(response.total_elements);
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
    setActionLoading(true);

    try {
      await dollApi.delete(dollId);
      alert("삭제되었습니다.");
      await fetchDolls();
    } catch (error) {
      const err = error as AxiosError;
      console.error(err);

      if (err.response) {
        switch (err.response.status) {
          case 409:
            alert(`삭제할 수 없는 상태입니다. 이미 시니어에게 할당되어 있습니다.`);
            break;
          case 404:
            alert(`삭제할 인형을 찾을 수 없습니다.`);
            break;
          default:
            alert(`삭제 중 오류가 발생했습니다. (HTTP ${err.response.status})`);
        }
      } else if (err.request) {
        alert("서버 응답이 없습니다. 네트워크 상태를 확인하세요.");
      } else {
        alert(`삭제 중 알 수 없는 오류가 발생했습니다: ${err.message}`);
      }
      await fetchDolls(); // [개선] 에러 발생 시에도 목록을 최신 상태로 갱신
    } finally {
      setActionLoading(false);
    }
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    const trimmedId = newDollId.trim();
    if (!trimmedId) {
      alert("인형 ID를 입력해주세요.");
      return;
    }

    setActionLoading(true);
    try {
      // [최종 수정 2] dollApi.create() 함수는 string 타입의 ID를 인자로 받습니다.
      await dollApi.create(trimmedId);
      alert("인형이 등록되었습니다.");
      setNewDollId("");
      setIsModalOpen(false);
      await fetchDolls();
    } catch (error) {
      const err = error as AxiosError;
      console.error(err);

      if (err.response) {
        switch (err.response.status) {
          case 409:
            alert("이미 존재하는 인형 ID입니다. 다른 ID를 입력해주세요.");
            break;
          case 400:
            alert("잘못된 요청입니다. 입력한 ID를 확인해주세요.");
            break;
          default:
            alert(`등록 중 오류가 발생했습니다. (HTTP ${err.response.status})`);
        }
      } else {
        alert("서버 응답이 없습니다. 네트워크 상태를 확인하세요.");
      }
    } finally {
      setActionLoading(false);
    }
  };

  const columns = useMemo<ColumnDef<DollListView>[]>(() => [
    { id: "index", header: "순번", cell: (info) => (pageIndex * pageSize) + info.row.index + 1 },
    { accessorKey: "id", header: "인형 ID" },
    { accessorKey: "senior_id", header: "할당된 이용자 번호", cell: (info) => info.getValue() ?? "없음" },
    {
      id: "actions",
      header: "관리",
      cell: (info) => (
        <button
          onClick={() => handleDelete(info.row.original.id)}
          disabled={actionLoading}
          className="px-2 py-1 rounded text-xs transition-colors bg-red-500 text-white hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          삭제
        </button>
      ),
    },
  ], [pageIndex, pageSize]); // handleDelete를 의존성 배열에서 제거

  const table = useReactTable({
    data,
    columns,
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    pageCount: Math.ceil(totalElements / pageSize),
    manualPagination: false,
  });

  const totalPages = table.getPageCount();

  const renderPageNumbers = () => {
    const currentPage = pageIndex + 1;
    const pageNumbers: (number | string)[] = [];
    
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);
    } else {
      pageNumbers.push(1);
      if (currentPage > 4) pageNumbers.push('...');
      
      const start = Math.max(2, currentPage - 2);
      const end = Math.min(totalPages - 1, currentPage + 2);
      
      for (let i = start; i <= end; i++) pageNumbers.push(i);
      
      if (currentPage < totalPages - 3) pageNumbers.push('...');
      pageNumbers.push(totalPages);
    }
    
    return pageNumbers.map((number, index) =>
      typeof number === 'string' ? (
        <span key={`dots-${index}`} className="px-1.5 py-1 text-gray-500">...</span>
      ) : (
        <button
          key={number}
          onClick={() => table.setPageIndex(number - 1)}
          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors cursor-pointer ${
            currentPage === number
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
        >
          {number}
        </button>
      )
    );
  };
  
  return (
    <div className="p-4 text-black space-y-2">
      <h2 className="text-2xl font-bold text-center">인형 관리</h2>
      <div className="bg-white rounded-lg shadow-sm p-3 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-base text-gray-600">
            총 <strong>{totalElements}</strong>개
          </span>
          <button
            onClick={() => setIsModalOpen(true)}
            disabled={actionLoading}
            className="bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700 font-bold text-sm cursor-pointer"
          >
            등록
          </button>
        </div>
        <div className="flex justify-end mt-2">
          <select
            value={pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
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
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
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
        <div className="flex items-center justify-center gap-2 mt-4 text-sm">
          <button onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()} className="px-2.5 py-1 disabled:opacity-50 hover:bg-gray-100 cursor-pointer text-gray-600">{"<<"}</button>
          <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} className="px-2.5 py-1 disabled:opacity-50 hover:bg-gray-100 cursor-pointer text-gray-600">{"<"}</button>
          {renderPageNumbers()}
          <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} className="px-2.5 py-1 disabled:opacity-50 hover:bg-gray-100 cursor-pointer text-gray-600">{">"}</button>
          <button onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()} className="px-2.5 py-1 disabled:opacity-50 hover:bg-gray-100 cursor-pointer text-gray-600">{">>"}</button>
        </div>
      </div>
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-xl shadow-lg p-4 w-full max-w-sm space-y-3">
            <h3 className="text-lg font-bold text-center">인형 등록</h3>
            <form onSubmit={handleRegister} className="space-y-2">
              <div>
                <label htmlFor="new-doll-id" className="block text-sm font-medium text-gray-700 mb-1">인형 ID</label>
                <input
                  id="new-doll-id"
                  type="text"
                  value={newDollId}
                  onChange={(e) => setNewDollId(e.target.value)}
                  placeholder="인형 고유 ID 입력"
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                  disabled={actionLoading}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} disabled={actionLoading} className="px-3 py-1 rounded text-sm bg-gray-300 text-black hover:bg-gray-400 disabled:opacity-50">취소</button>
                <button type="submit" disabled={actionLoading} className="px-3 py-1 rounded text-sm bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50">{actionLoading ? "처리 중..." : "등록"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}