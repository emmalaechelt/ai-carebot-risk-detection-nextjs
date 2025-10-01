// src/app/main/page.tsx
"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { DashboardData } from "@/types";
import Link from "next/link";

// ✨ 변경점: 대시보드 로딩을 위한 스켈레톤 컴포넌트
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="border rounded-lg p-4 bg-white shadow-sm">
        <div className="h-6 w-32 mx-auto bg-gray-200 rounded animate-pulse-slow mb-4"></div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-16 mx-auto bg-gray-200 rounded animate-pulse-slow"></div>
              <div className="h-6 w-12 mx-auto bg-gray-200 rounded animate-pulse-slow"></div>
            </div>
          ))}
        </div>
      </div>
      <div className="border rounded-lg p-4 bg-white shadow-sm">
        <div className="h-6 w-48 bg-gray-200 rounded animate-pulse-slow mb-4"></div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center p-3 rounded-lg bg-gray-100 animate-pulse-slow">
              <div className="w-10 h-10 rounded-full bg-gray-200"></div>
              <div className="ml-3 flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      // 로딩 상태를 확실히 하기 위해 초기화
      setLoading(true);
      try {
        const response = await api.get<DashboardData>("/dashboard");
        setData(response.data);
      } catch (err) {
        setError("대시보드 데이터를 불러오는 데 실패했습니다.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // ✨ 변경점: 로딩 중일 때 스켈레톤 UI를 보여줌
  if (loading) return <DashboardSkeleton />;
  if (error) return <p className="text-center mt-10 text-red-600">{error}</p>;
  if (!data) return <p className="text-center mt-10 text-gray-600">표시할 데이터가 없습니다.</p>;
  
  const riskColor: { [key: string]: string } = {
    EMERGENCY: "text-red-600 border-red-200 bg-red-50",
    CRITICAL: "text-orange-600 border-orange-200 bg-orange-50",
    DANGER: "text-yellow-400 border-yellow-200 bg-yellow-50",
    POSITIVE: "text-green-600 border-green-200 bg-green-50",
  };

  return (
    <div className="space-y-6">
      {/* 시니어 현황 */}
      <div className="border rounded-lg p-4 bg-white shadow-sm">
        <h2 className="text-lg font-bold mb-4 text-center text-black">시니어 현황</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
          <div>
            <div className="text-gray-700">총 이용자</div>
            <div className="text-2xl font-bold text-black">{data.state_count.total}명</div>
          </div>
          <div className={riskColor.EMERGENCY.split(' ')[0]}>
            <div>긴급</div>
            <div className="text-xl font-bold">{data.state_count.emergency}명</div>
          </div>
          <div className={riskColor.CRITICAL.split(' ')[0]}>
            <div>위험</div>
            <div className="text-xl font-bold">{data.state_count.critical}명</div>
          </div>
          <div className={riskColor.DANGER.split(' ')[0]}>
            <div>주의</div>
            <div className="text-xl font-bold">{data.state_count.danger}명</div>
          </div>
          <div className={riskColor.POSITIVE.split(' ')[0]}>
            <div>안전</div>
            <div className="text-xl font-bold">{data.state_count.positive}명</div>
          </div>
        </div>
      </div>

      {/* 최근 긴급 분석 결과 */}
      <div className="border rounded-lg p-4 bg-white shadow-sm">
        <h2 className="text-lg font-bold mb-4 text-black">긴급 분석 결과 (최근 10건)</h2>
        <div className="space-y-3">
          {data.recent_urgent_results.length > 0 ? (
            data.recent_urgent_results.map((item) => (
              <Link href={`/main/analysis/${item.overall_result_id}`} key={item.overall_result_id}>
                <div
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:shadow-md transition-shadow ${riskColor[item.label] || ''}`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">👤</span>
                    <div>
                      <span className="font-semibold">{item.name}</span> ({item.sex === 'MALE' ? '남' : '여'}/{item.age}세)
                      <div className="text-sm text-gray-500 flex items-center space-x-2">
                        <span>📍 {item.gu} {item.dong}</span>
                        <span>⏱ {new Date(item.timestamp).toLocaleString('ko-KR')}</span>
                      </div>
                      <p className="text-sm text-gray-700 mt-1 truncate">{item.summary}</p>
                    </div>
                  </div>
                  <span className={`text-sm font-bold px-2 py-1 rounded-full ${riskColor[item.label]}`}>
                    {item.label}
                  </span>
                </div>
              </Link>
            ))
          ) : (
            <p className="text-center text-gray-500 py-4">최근 긴급 분석 결과가 없습니다.</p>
          )}
        </div>
      </div>
    </div>
  );
}