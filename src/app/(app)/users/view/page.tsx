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

// (구/동 데이터는 생략)
const guOptions: {
  [guName: string]: { gu_code: string; dong_list: { dong_code: string; dong_name: string }[] };
} = { /* ... */ };

const statusMap: Record<string, string> = {
  EMERGENCY: "긴급",
  CRITICAL: "위험",
  DANGER: "주의",
  POSITIVE: "안전",
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

  const [availableDongs, setAvailableDongs] = useState<{ dong_code: string; dong_name: string }[]>([]);

  const [{ pageIndex, pageSize }, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const pagination = useMemo(() => ({ pageIndex, pageSize }), [pageIndex, pageSize]);

  useEffect(() => {
    if (searchParams.gu && guOptions[searchParams.gu]) {
      setAvailableDongs(guOptions[searchParams.gu].dong_list);
    } else setAvailableDongs([]);
    setSearchParams(prev => ({ ...prev, dong: "" }));
  }, [searchParams.gu]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: pageIndex.toString(),
        size: pageSize.toString(),
        sort: "created_at,desc",
      });
      Object.entries(searchParams).forEach(([key, value]) => { if (value) queryParams.append(key, value); });

      const res = await api.get<PagedResponse<SeniorListView>>(`/seniors?${queryParams.toString()}`);
      setData(res.data.content);
      setPageCount(res.data.total_pages);
      setTotalElements(res.data.total_elements);
    } catch (err) {
      console.error("이용자 목록 불러오기 실패:", err);
    } finally { setLoading(false); }
  }, [pageIndex, pageSize, searchParams]);

  useEffect(() => {
    const timer = setTimeout(() => fetchData(), 300);
    return () => clearTimeout(timer);
  }, [fetchData]);

  const columns = useMemo<ColumnDef<SeniorListView>[]>(() => [
    { id: "index", header: "순번", cell: info => pageIndex * pageSize + info.row.index + 1 },
    { accessorKey: "senior_id", header: "이용자 번호" },
    { accessorKey: "name", header: "이름", cell: info =>
      <span className="text-blue-600 cursor-pointer hover:underline" onClick={() => router.push(`/users/view/${info.row.original.senior_id}`)}>
        {info.getValue() as string}
      </span>
    },
    { accessorKey: "age", header: "나이" },
    { accessorKey: "sex", header: "성별", cell: info => (info.getValue() === "MALE" ? "남" : "여") },
    { accessorKey: "gu", header: "자치구" },
    { accessorKey: "dong", header: "법정동", cell: info => {
      const guName = searchParams.gu; const dongCode = info.getValue() as string;
      const dong = guOptions[guName]?.dong_list.find(d => d.dong_code === dongCode);
      return dong?.dong_name || dongCode;
    }},
    { accessorKey: "state", header: "현재 상태", cell: info => statusMap[info.getValue() as string] || (info.getValue() as string) },
    { accessorKey: "doll_id", header: "인형 ID" },
    { accessorKey: "phone", header: "전화번호" },
    { 
      accessorKey: "created_at", 
      header: "등록일", 
      cell: info => new Date(info.getValue() as string).toLocaleDateString("ko-KR")
    },
  ], [router, pageIndex, pageSize, searchParams.gu]);

  const table = useReactTable({ data, columns, pageCount, state: { pagination }, onPaginationChange: setPagination, getCoreRowModel: getCoreRowModel(), manualPagination: true });

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target; table.setPageIndex(0);
    setSearchParams(prev => ({ ...prev, [name]: value }));
  };
  const handleSearch = () => fetchData();
  const handleReset = () => { setSearchParams({ name: "", phone: "", gu: "", dong: "", state: "", doll_id: "", age_group: "", sex: "", senior_id: "" }); table.setPageIndex(0); };
  const handleRegister = () => router.push("/users/register");

  return (
    <div className="space-y-4 text-black">
      <h2 className="text-2xl font-bold text-center">이용자 관리</h2>

      {/* 검색창 */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 space-y-4">
        <div className="flex justify-end">
          <button onClick={handleRegister} className="bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 font-bold text-sm cursor-pointer">등록</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-3 items-center text-sm">
          {/* 각 입력 필드의 border-gray-300을 border-gray-200으로 수정 */}
          <div className="flex items-center">
            <label className="w-24 shrink-0 font-medium text-gray-700 pr-3 text-right">현재 상태</label>
            <select name="state" value={searchParams.state} onChange={handleInputChange} className="w-full border border-gray-200 rounded px-2 h-8 outline-none transition">
              <option value="">전체</option>
              {statusApiKeys.map(k => <option key={k} value={k}>{statusMap[k]}</option>)}
            </select>
          </div>
          <div className="flex items-center">
            <label className="w-24 shrink-0 font-medium text-gray-700 pr-3 text-right">이용자 번호</label>
            <input name="senior_id" value={searchParams.senior_id} onChange={handleInputChange} placeholder="번호" className="w-full border border-gray-200 rounded px-2 h-8 outline-none transition" />
          </div>
          <div className="flex items-center">
            <label className="w-24 shrink-0 font-medium text-gray-700 pr-3 text-right">이름</label>
            <input name="name" value={searchParams.name} onChange={handleInputChange} placeholder="이름" className="w-full border border-gray-200 rounded px-2 h-8 outline-none transition" />
          </div>
          <div className="flex items-center">
            <label className="w-24 shrink-0 font-medium text-gray-700 pr-3 text-right">휴대폰 번호</label>
            <input name="phone" value={searchParams.phone} onChange={handleInputChange} placeholder="'-' 없이 숫자" className="w-full border border-gray-200 rounded px-2 h-8 outline-none transition" />
          </div>
          <div className="flex items-center">
            <label className="w-24 shrink-0 font-medium text-gray-700 pr-3 text-right">연령대</label>
            <select name="age_group" value={searchParams.age_group} onChange={handleInputChange} className="w-full border border-gray-200 rounded px-2 h-8 outline-none transition">
              <option value="">전체</option>
              {[60,70,80,90,100].map(a => <option key={a} value={a}>{a===100?'100세 이상':`${a}대`}</option>)}
            </select>
          </div>
          <div className="flex items-center">
            <label className="w-24 shrink-0 font-medium text-gray-700 pr-3 text-right">성별</label>
            <select name="sex" value={searchParams.sex} onChange={handleInputChange} className="w-full border border-gray-200 rounded px-2 h-8 outline-none transition">
              <option value="">전체</option>
              <option value="MALE">남</option>
              <option value="FEMALE">여</option>
            </select>
          </div>
          <div className="flex items-center">
            <label className="w-24 shrink-0 font-medium text-gray-700 pr-3 text-right">자치구</label>
            <select name="gu" value={searchParams.gu} onChange={handleInputChange} className="w-full border border-gray-200 rounded px-2 h-8 outline-none transition">
              <option value="">전체</option>
              {Object.keys(guOptions).map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div className="flex items-center">
            <label className="w-24 shrink-0 font-medium text-gray-700 pr-3 text-right">법정동</label>
            <select name="dong" value={searchParams.dong} onChange={handleInputChange} className="w-full border border-gray-200 rounded px-2 h-8 outline-none transition" disabled={!searchParams.gu}>
              <option value="">전체</option>
              {availableDongs.map(d => <option key={d.dong_code} value={d.dong_code}>{d.dong_name}</option>)}
            </select>
          </div>
          <div className="flex items-center">
            <label className="w-24 shrink-0 font-medium text-gray-700 pr-3 text-right">인형 ID</label>
            <input name="doll_id" value={searchParams.doll_id} onChange={handleInputChange} placeholder="인형 ID" className="w-full border border-gray-200 rounded px-2 h-8 outline-none transition" />
          </div>
        </div>

        <div className="flex justify-center gap-2 pt-2">
          <button onClick={handleSearch} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-semibold text-sm cursor-pointer transition">검색</button>
          <button onClick={handleReset} className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300 font-semibold text-sm cursor-pointer transition">초기화</button>
        </div>
      </div>

      {/* 테이블 */}
      <div className="bg-white rounded-lg shadow-sm p-3 border border-gray-200">
        <div className="flex justify-between items-center text-sm mb-2">
          <span>총 <strong>{totalElements}</strong>명</span>
          <select value={table.getState().pagination.pageSize} onChange={e => table.setPageSize(Number(e.target.value))} className="border border-gray-200 rounded px-2 py-1 bg-white text-sm outline-none transition">
            {[10,20,30,50].map(s => <option key={s} value={s}>{s}개씩 보기</option>)}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-center">
            <thead className="bg-gray-50">
              {table.getHeaderGroups().map(hg => (
                <tr key={hg.id}>
                  {hg.headers.map(h => (
                    <th key={h.id} className="border-b border-gray-200 px-2 py-1.5 font-medium text-gray-600">
                      {flexRender(h.column.columnDef.header, h.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={columns.length} className="text-center py-10">목록을 불러오는 중...</td></tr>
              ) : table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50 border-b border-gray-200">
                    {r.getVisibleCells().map(c => (
                      <td key={c.id} className="px-2 py-1.5 text-gray-700">
                        {flexRender(c.column.columnDef.cell, c.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr><td colSpan={columns.length} className="text-center text-gray-500 py-10">검색 결과가 없습니다.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 페이지네이션 */}
        <div className="flex justify-center items-center mt-4 space-x-2 text-sm cursor-pointer">
          <button onClick={()=>table.setPageIndex(0)} disabled={!table.getCanPreviousPage()} className="px-2.5 py-1 disabled:opacity-50 hover:bg-gray-100 cursor-pointer">{'<<'}</button>
          <button onClick={()=>table.previousPage()} disabled={!table.getCanPreviousPage()} className="px-2.5 py-1 disabled:opacity-50 hover:bg-gray-100 cursor-pointer">{'<'}</button>
          {Array.from({length: Math.min(5,pageCount-Math.floor(pageIndex/5)*5)},(_,i)=>{
            const pn = Math.floor(pageIndex/5)*5 + i;
            if(pn<pageCount) return <button key={pn} onClick={()=>table.setPageIndex(pn)} className={`px-3 py-1 rounded-md ${pn===pageIndex?'bg-blue-500 text-white font-bold':'text-black hover:underline'} cursor-pointer`}>{pn+1}</button>
          })}
          <button onClick={()=>table.nextPage()} disabled={!table.getCanNextPage()} className="px-2.5 py-1 disabled:opacity-50 hover:bg-gray-100 cursor-pointer">{'>'}</button>
          <button onClick={()=>table.setPageIndex(pageCount-1)} disabled={!table.getCanNextPage()} className="px-2.5 py-1 disabled:opacity-50 hover:bg-gray-100 cursor-pointer">{'>>'}</button>
        </div>
      </div>
    </div>
  );
}
