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

// 구/법정동 데이터
const guOptions: {
  [guName: string]: { gu_code: string; dong_list: { dong_code: string; dong_name: string }[] };
} = {
  "동구": {
    gu_code: "DONG_GU",
    dong_list: [
      { dong_code: "GAYANG_1_DONG", dong_name: "가양1동" },
      { dong_code: "GAYANG_2_DONG", dong_name: "가양2동" },
      { dong_code: "DAE_DONG", dong_name: "대동" },
      { dong_code: "DAECHEONG_DONG", dong_name: "대청동" },
      { dong_code: "PANAM_1_DONG", dong_name: "판암1동" },
      { dong_code: "PANAM_2_DONG", dong_name: "판암2동" },
      { dong_code: "SAMSUNG_DONG", dong_name: "삼성동" },
      { dong_code: "SANNAE_DONG", dong_name: "산내동" },
      { dong_code: "SEONGNAM_DONG", dong_name: "성남동" },
      { dong_code: "SININ_DONG", dong_name: "신인동" },
      { dong_code: "YONGUN_DONG", dong_name: "용운동" },
      { dong_code: "YONGJEON_DONG", dong_name: "용전동" },
      { dong_code: "JAYANG_DONG", dong_name: "자양동" },
      { dong_code: "JUNGANG_DONG", dong_name: "중앙동" },
      { dong_code: "HYO_DONG", dong_name: "효동" },
      { dong_code: "HONGDO_DONG", dong_name: "홍도동" },
    ],
  },
  "중구": {
    gu_code: "JUNG_GU",
    dong_list: [
      { dong_code: "DAESA_DONG", dong_name: "대사동" },
      { dong_code: "DAEHEUNG_DONG", dong_name: "대흥동" },
      { dong_code: "MOK_DONG", dong_name: "목동" },
      { dong_code: "MUNCHANG_DONG", dong_name: "문창동" },
      { dong_code: "MUNHWA_1_DONG", dong_name: "문화1동" },
      { dong_code: "MUNHWA_2_DONG", dong_name: "문화2동" },
      { dong_code: "BUSA_DONG", dong_name: "부사동" },
      { dong_code: "SANSEONG_DONG", dong_name: "산성동" },
      { dong_code: "SEOKGYO_DONG", dong_name: "석교동" },
      { dong_code: "ORYU_DONG", dong_name: "오류동" },
      { dong_code: "YONGDU_DONG", dong_name: "용두동" },
      { dong_code: "YUCHEON_1_DONG", dong_name: "유천1동" },
      { dong_code: "YUCHEON_2_DONG", dong_name: "유천2동" },
      { dong_code: "EUNHAENGSEONHWA_DONG", dong_name: "은행선화동" },
      { dong_code: "JUNGCHON_DONG", dong_name: "중촌동" },
      { dong_code: "TAEPYEONG_1_DONG", dong_name: "태평1동" },
      { dong_code: "TAEPYEONG_2_DONG", dong_name: "태평2동" },
    ],
  },
  "서구": {
    gu_code: "SEO_GU",
    dong_list: [
      { dong_code: "BOKSU_DONG", dong_name: "복수동" },
      { dong_code: "DOMA_1_DONG", dong_name: "도마1동" },
      { dong_code: "DOMA_2_DONG", dong_name: "도마2동" },
      { dong_code: "JEONGLIM_DONG", dong_name: "정림동" },
      { dong_code: "BYEON_DONG", dong_name: "변동" },
      { dong_code: "YONGMUN_DONG", dong_name: "용문동" },
      { dong_code: "TANBANG_DONG", dong_name: "탄방동" },
      { dong_code: "DUNSAN_1_DONG", dong_name: "둔산1동" },
      { dong_code: "DUNSAN_2_DONG", dong_name: "둔산2동" },
      { dong_code: "DUNSAN_3_DONG", dong_name: "둔산3동" },
      { dong_code: "GOEJEONG_DONG", dong_name: "괴정동" },
      { dong_code: "GAJANG_DONG", dong_name: "가장동" },
      { dong_code: "NAE_DONG", dong_name: "내동" },
      { dong_code: "GALMA_1_DONG", dong_name: "갈마1동" },
      { dong_code: "GALMA_2_DONG", dong_name: "갈마2동" },
      { dong_code: "MANNYEON_DONG", dong_name: "만년동" },
      { dong_code: "GASUWON_DONG", dong_name: "가수원동" },
      { dong_code: "WOLPYEONG_1_DONG", dong_name: "월평1동" },
      { dong_code: "WOLPYEONG_2_DONG", dong_name: "월평2동" },
      { dong_code: "WOLPYEONG_3_DONG", dong_name: "월평3동" },
    ],
  },
  "유성구": {
    gu_code: "YUSEONG_GU",
    dong_list: [
      { dong_code: "JINJAM_DONG", dong_name: "진잠동" },
      { dong_code: "HAKHA_DONG", dong_name: "학하동" },
      { dong_code: "WONSINHEUNG_DONG", dong_name: "원신흥동" },
      { dong_code: "SANGDAE_DONG", dong_name: "상대동" },
      { dong_code: "ONCHEON_1_DONG", dong_name: "온천1동" },
      { dong_code: "ONCHEON_2_DONG", dong_name: "온천2동" },
      { dong_code: "NOEUN_1_DONG", dong_name: "노은1동" },
      { dong_code: "NOEUN_2_DONG", dong_name: "노은2동" },
      { dong_code: "NOEUN_3_DONG", dong_name: "노은3동" },
      { dong_code: "SINSEONG_DONG", dong_name: "신성동" },
      { dong_code: "JEONMIN_DONG", dong_name: "전민동" },
      { dong_code: "GUJEUK_DONG", dong_name: "구즉동" },
      { dong_code: "GWANPYEONG_DONG", dong_name: "관평동" },
    ],
  },
  "대덕구": {
    gu_code: "DAEDEOK_GU",
    dong_list: [
      { dong_code: "OJEONG_DONG", dong_name: "오정동" },
      { dong_code: "DAEHWA_DONG", dong_name: "대화동" },
      { dong_code: "HOEDEOK_DONG", dong_name: "회덕동" },
      { dong_code: "BIRAE_DONG", dong_name: "비래동" },
      { dong_code: "JUNGNI_DONG", dong_name: "중리동" },
      { dong_code: "BEOB_1_DONG", dong_name: "법1동" },
      { dong_code: "BEOB_2_DONG", dong_name: "법2동" },
      { dong_code: "SINTANJIN_DONG", dong_name: "신탄진동" },
      { dong_code: "SEOKBONG_DONG", dong_name: "석봉동" },
      { dong_code: "DEOKAM_DONG", dong_name: "덕암동" },
      { dong_code: "MOKSANG_DONG", dong_name: "목상동" },
      { dong_code: "SONGCHON_DONG", dong_name: "송촌동" },
    ],
  },
};

// 현재 상태 한글 매핑
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
    name: "",
    phone: "",
    gu: "",
    dong: "",
    state: "",
    doll_id: "",
    age_group: "",
    sex: "",
    senior_id: "",
  });

  const [availableDongs, setAvailableDongs] = useState<{ dong_code: string; dong_name: string }[]>([]);

  const [{ pageIndex, pageSize }, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const pagination = useMemo(() => ({ pageIndex, pageSize }), [pageIndex, pageSize]);

  useEffect(() => {
    if (searchParams.gu && guOptions[searchParams.gu]) {
      setAvailableDongs(guOptions[searchParams.gu].dong_list);
    } else {
      setAvailableDongs([]);
    }
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

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchData();
    }, 500);
    return () => clearTimeout(debounceTimer);
  }, [searchParams, pageIndex, pageSize, fetchData]);

  const columns = useMemo<ColumnDef<SeniorListView>[]>(() => [
    { id: "index", header: "순번", cell: info => pageIndex * pageSize + info.row.index + 1 },
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
    {
      accessorKey: "dong",
      header: "법정동",
      cell: info => {
        const guName = searchParams.gu;
        const dongCode = info.getValue() as string;
        const dong = guOptions[guName]?.dong_list.find(d => d.dong_code === dongCode);
        return dong?.dong_name || dongCode;
      },
    },
    { accessorKey: "state", header: "현재 상태", cell: info => statusMap[info.getValue() as string] || info.getValue() as string },
    { accessorKey: "doll_id", header: "인형아이디" },
    { accessorKey: "phone", header: "전화번호" },
    { accessorKey: "created_at", header: "등록일", cell: info => new Date(info.getValue() as string).toLocaleDateString() },
  ], [router, pageIndex, pageSize, searchParams.gu]);

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
          <button onClick={handleRegister} className="bg-green-500 text-white px-4 py-1.5 rounded-lg hover:bg-green-600 font-semibold text-sm">등록</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-10 gap-x-6 gap-y-3 items-center text-sm">
          {/* 1행 */}
          <div className="lg:col-span-2 flex items-center">
            <label className="w-28 shrink-0 font-medium text-gray-700 text-right pr-2">현재 상태</label>
            <select name="state" value={searchParams.state} onChange={handleInputChange} className="w-full border rounded px-2 py-1 bg-white">
              <option value="">전체</option>
              {statusApiKeys.map(key => <option key={key} value={key}>{statusMap[key]}</option>)}
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
              {Object.keys(guOptions).map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          <div className="lg:col-span-2 flex items-center">
            <label className="w-28 shrink-0 font-medium text-gray-700 text-right pr-2">법정동</label>
            <select name="dong" value={searchParams.dong} onChange={handleInputChange} className="w-full border rounded px-2 py-1 bg-white" disabled={!searchParams.gu}>
              <option value="">전체</option>
              {availableDongs.map(d => <option key={d.dong_code} value={d.dong_code}>{d.dong_name}</option>)}
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
            {[10, 20, 30, 50].map(size => <option key={size} value={size}>{size}개씩 보기</option>)}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm text-center">
            <thead className="bg-gray-50">
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
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
                  <button key={pageNumber} onClick={() => table.setPageIndex(pageNumber)} className={`px-3 py-1 rounded-md cursor-pointer ${pageNumber === pageIndex ? 'bg-blue-500 text-white font-bold' : 'text-black hover:underline'}`}>{pageNumber + 1}</button>
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
