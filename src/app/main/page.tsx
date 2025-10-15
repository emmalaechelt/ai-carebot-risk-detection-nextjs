"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { DashboardData } from "@/types";
import Link from "next/link";

// ✨ 스켈레톤 컴포넌트
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

  if (loading) return <DashboardSkeleton />;
  if (error) return <p className="text-center mt-10 text-red-600">{error}</p>;
  if (!data) return <p className="text-center mt-10 text-gray-600">표시할 데이터가 없습니다.</p>;

  const riskInfo: Record<string, { label: string; className: string; priority: number }> = {
    EMERGENCY: { label: "긴급", className: "text-red-600 border-red-200 bg-red-50", priority: 1 },
    CRITICAL: { label: "위험", className: "text-orange-600 border-orange-200 bg-orange-50", priority: 2 },
    DANGER: { label: "주의", className: "text-yellow-500 border-yellow-200 bg-yellow-50", priority: 3 },
    POSITIVE: { label: "안전", className: "text-green-600 border-green-200 bg-green-50", priority: 4 },
  };

  const defaultRisk = { label: "", className: "text-black border-gray-200 bg-white", priority: 5 };

  // 중복 제거 + 긴급 우선 + 요약 합치기
  const mergedAndSortedResults = () => {
    const map = new Map<string, { label: string; summary: string; latest: any }>();

    data.recent_urgent_results.forEach((item) => {
      const timeKey = new Date(item.timestamp).toISOString();
      const key = `${item.senior_name}-${timeKey}`;

      if (!map.has(key)) {
        map.set(key, { label: item.label, summary: item.summary, latest: item });
      } else {
        const existing = map.get(key)!;
        // 긴급 우선
        if (riskInfo[item.label].priority < riskInfo[existing.label].priority) {
          existing.label = item.label;
        }
        // 요약 합치기
        if (!existing.summary.includes(item.summary)) {
          existing.summary += " / " + item.summary;
        }
      }
    });

    // 배열 변환 후 긴급>위험>주의>안전 순 정렬
    return Array.from(map.values())
      .map((v) => ({ ...v.latest, label: v.label, summary: v.summary }))
      .sort((a, b) => (riskInfo[a.label]?.priority || 5) - (riskInfo[b.label]?.priority || 5));
  };

  const displayResults = mergedAndSortedResults();

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
          {(["EMERGENCY", "CRITICAL", "DANGER", "POSITIVE"] as const).map((key) => {
            const risk = riskInfo[key] || defaultRisk;
            const countKey = key.toLowerCase() as keyof DashboardData["state_count"];
            return (
              <div key={key} className={`${risk.className} rounded-lg p-2`}>
                <div className="font-semibold text-xl">{risk.label}</div>
                <div className="text-xl font-bold">{data.state_count[countKey]}명</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 최근 분석 결과 */}
      <div className="border rounded-lg p-3 bg-white shadow-sm max-w-full">
        <h2 className="text-lg font-bold mb-3 text-black">최근 분석 결과 (최대 10건)</h2>
        <div className="space-y-3">
          {displayResults.length > 0 ? (
            displayResults.map((item) => {
              const risk = riskInfo[item.label] || defaultRisk;
              return (
                <Link href={`/main/analysis/${item.overall_result_id}`} key={item.overall_result_id}>
                  <div
                    className={`relative flex flex-col px-3 py-2 rounded-lg border cursor-pointer hover:shadow-sm transition-shadow ${risk.className}`}
                  >
                    {/* 첫 줄: 이모지 + 이름 + 성별/나이 + 주소 + 시간 */}
                    <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
                      <span>👤</span>
                      <span className="font-semibold text-black">{item.senior_name}</span>
                      <span>({item.sex === "MALE" ? "남" : "여"}/{item.age}세)</span>
                      <span>📍 {item.gu} {item.dong}</span>
                      <span>⏱ {new Date(item.timestamp).toLocaleString("ko-KR")}</span>
                    </div>
                    {/* 둘째 줄: 요약 */}
                    <div className="mt-1 text-base text-gray-700">{item.summary}</div>
                    {/* 오른쪽 상단 배지 */}
                    {risk.label && (
                      <span
                        className={`absolute top-2 right-2 text-xl font-semibold px-2 py-0.5 rounded-full ${risk.className}`}
                      >
                        {risk.label}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })
          ) : (
            <p className="text-center text-gray-500 py-4">최근 분석 결과가 없습니다.</p>
          )}
        </div>
      </div>
    </div>
  );
}
