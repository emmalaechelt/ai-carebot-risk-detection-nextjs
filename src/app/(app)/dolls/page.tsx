"use client";

import { useState, useEffect, useCallback, FormEvent } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
  PaginationState,
} from "@tanstack/react-table";
import api from "@/lib/api";
import { DollListView } from "@/types";
import { AxiosError } from "axios";

const dollApi = {
  getList: () => api.get("/dolls"),
  delete: (dollId: string) => api.delete(`/dolls/${dollId}`),
  create: (dollId: string) => api.post("/dolls", { id: dollId }),
};

export default function DollsPage() {
  const [allData, setAllData] = useState<DollListView[]>([]);
  const [data, setData] = useState<DollListView[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newDollId, setNewDollId] = useState("");

  const [{ pageIndex, pageSize }, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 15,
  });
  const pagination = { pageIndex, pageSize };

  const fetchDolls = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await dollApi.getList();
      const result = res.data;
      const dolls = result?.content ?? result?.data ?? (Array.isArray(result) ? result : []);

      setAllData(dolls);
      setTotalElements(dolls.length);
    } catch (err) {
      console.error(err);
      setAllData([]);
      setTotalElements(0);
      alert("인형 목록을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDolls();
  }, [fetchDolls]);

  useEffect(() => {
    setPageCount(Math.ceil(allData.length / pageSize));
    const start = pageIndex * pageSize;
    const end = start + pageSize;
    setData(allData.slice(start, end));
  }, [allData, pageIndex, pageSize]);

  const handleDelete = useCallback(async (dollId: string) => {
      if (!confirm(`정말로 인형 "${dollId}"을(를) 삭제하시겠습니까?`)) return;
      setIsSubmitting(true);
      try {
        await dollApi.delete(dollId);
        alert("인형이 성공적으로 삭제되었습니다.");
        await fetchDolls();
      } catch (error) {
        const err = error as AxiosError<{ error: string }>;
        if (err.response?.status === 409) {
          alert("⚠️ 해당 인형은 시니어에게 할당되어 있어 삭제할 수 없습니다.");
        } else {
          alert("삭제 실패: 알 수 없는 오류가 발생했습니다.");
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
        await fetchDolls();
      } catch (error) {
        const err = error as AxiosError<{ error: string }>;
        if (err.response?.status === 409) {
          alert("⚠️ 이미 존재하는 인형 ID입니다.");
        } else {
          alert("등록 실패: 알 수 없는 오류가 발생했습니다.");
        }
      } finally {
        setIsSubmitting(false);
      }
    }, [newDollId, fetchDolls]);

  const columns: ColumnDef<DollListView>[] = [
    { header: "순번", cell: ({ row }) => pageIndex * pageSize + row.index + 1 },
    { accessorKey: "id", header: "인형 ID" },
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
          className="px-2 py-1.5 rounded-md text-xs font-semibold bg-red-500 text-white hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed cursor-pointer"
        >
          삭제
        </button>
      ),
    },
  ];

  const table = useReactTable({
    data,
    columns,
    pageCount,
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
  });

  return (
    <div className="space-y-4 text-black">
      <h2 className="text-2xl font-bold text-center">인형 관리</h2>
      
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
        <div className="flex justify-end mb-3">
          <button
            onClick={() => setIsModalOpen(true)}
            disabled={isSubmitting}
            className="bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 font-bold text-sm cursor-pointer disabled:bg-gray-400"
          >
            등록
          </button>
        </div>

        <div className="flex justify-between items-center mb-3 text-sm">
          <span className="font-semibold">총 <strong>{totalElements}</strong>개</span>
          <select
            value={pageSize}
            onChange={(e) => setPagination({ pageIndex: 0, pageSize: Number(e.target.value) })}
            className="border border-gray-200 rounded px-2 py-1 bg-white text-sm outline-none transition"
          >
            {[10, 15, 20, 30, 50].map((s) => (
              <option key={s} value={s}>{s}개씩 보기</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-center">
            <thead className="text-sm text-gray-700 bg-gray-50">
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((h) => (
                    <th key={h.id} className="border-b border-gray-200 px-3 py-1.5 font-medium text-gray-600">
                      {flexRender(h.column.columnDef.header, h.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={columns.length} className="text-center py-10">데이터 불러오는 중...</td></tr>
              ) : table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50 border-b border-gray-200">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-3 py-1.5 text-gray-700">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr><td colSpan={columns.length} className="py-10 text-center text-gray-500">등록된 인형이 없습니다.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 페이지네이션 */}
        <div className="flex justify-center items-center mt-4 space-x-2 text-sm">
          <button onClick={() => setPagination({ pageIndex: 0, pageSize })} disabled={pageIndex === 0} className="px-2.5 py-1 rounded-md disabled:opacity-50 hover:bg-gray-100 cursor-pointer">{"<<"}</button>
          <button onClick={() => setPagination({ pageIndex: Math.max(0, pageIndex - 1), pageSize })} disabled={pageIndex === 0} className="px-2.5 py-1 rounded-md disabled:opacity-50 hover:bg-gray-100 cursor-pointer">{"<"}</button>
          {Array.from({ length: Math.min(5, pageCount - Math.floor(pageIndex / 5) * 5) }, (_, i) => {
            const pn = Math.floor(pageIndex / 5) * 5 + i;
            if (pn < pageCount) return (
              <button key={pn} onClick={() => setPagination({ pageIndex: pn, pageSize })} className={`px-3 py-1 rounded-md cursor-pointer ${pn === pageIndex ? "bg-blue-600 text-white font-bold" : "text-black hover:bg-gray-100"}`}>{pn + 1}</button>
            );
          })}
          <button onClick={() => setPagination({ pageIndex: Math.min(pageCount - 1, pageIndex + 1), pageSize })} disabled={pageIndex >= pageCount - 1} className="px-2.5 py-1 rounded-md disabled:opacity-50 hover:bg-gray-100 cursor-pointer">{">"}</button>
          <button onClick={() => setPagination({ pageIndex: pageCount - 1, pageSize })} disabled={pageIndex >= pageCount - 1} className="px-2.5 py-1 rounded-md disabled:opacity-50 hover:bg-gray-100 cursor-pointer">{">>"}</button>
        </div>
      </div>

      {/* 신규 등록 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-xl font-bold text-gray-800">신규 인형 등록</h3>
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label htmlFor="new-doll-id" className="block text-sm font-medium text-gray-700 mb-1">인형 ID</label>
                <input id="new-doll-id" type="text" value={newDollId} onChange={(e) => setNewDollId(e.target.value)} placeholder="예) doll-serial-12345" disabled={isSubmitting} className="w-full px-3 py-2 border border-gray-200 rounded-md outline-none transition"/>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} disabled={isSubmitting} className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300 text-sm font-semibold disabled:opacity-60 cursor-pointer">취소</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 text-sm font-semibold disabled:bg-gray-400 cursor-pointer">등록</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}