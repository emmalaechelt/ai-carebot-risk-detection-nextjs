// src/app/main/analysis/[id]/page.tsx
"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import api from "@/lib/api";

interface Dialogue {
  id: number;
  text: string;
  time: string;
  label: string;
  scores: number[];
}

interface DetailData {
  senior_name: string;
  diseases: string;
  age: number;
  doll_id: string;
  label: string;
  summary: string;
  reasons: string[];
  confidence_scores: {
    positive: number;
    danger: number;
    critical: number;
    emergency: number;
  };
  dialogues: Dialogue[];
}

const labelColorMap: Record<string, string> = {
  EMERGENCY: "bg-red-600",
  CRITICAL: "bg-orange-600",
  DANGER: "bg-yellow-500",
  POSITIVE: "bg-green-600",
};

export default function DetailedAnalysisPage() {
  const router = useRouter();
  const { id } = useParams();
  const [data, setData] = useState<DetailData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/analyze/${id}`);
        console.log("API 응답 데이터:", res.data);
        setData(res.data || null);
      } catch (error) {
        console.error("Failed to fetch detail:", error);
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  const handleDelete = async () => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    try {
      await api.delete(`/analyze/${id}`);
      alert("삭제되었습니다.");
      router.push("/main/analysis");
    } catch (error) {
      console.error("삭제 실패:", error);
      alert("삭제 실패!");
    }
  };

  if (loading)
    return <div className="p-8 text-center text-gray-500 text-lg">데이터를 불러오는 중...</div>;
  if (!data)
    return <div className="p-8 text-center text-red-600 text-lg">데이터를 찾을 수 없습니다.</div>;

  return (
    <div className="p-6 space-y-6 text-lg text-black">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold flex-1 text-center">분석 상세 결과</h1>
        <button
          onClick={() => router.back()}
          className="bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 transition font-bold"
        >
          목록으로
        </button>
      </div>

      {/* 이용자 정보 */}
      <div className="border rounded-lg p-6 bg-gray-50 flex flex-wrap gap-4">
        <div className="font-bold w-full text-xl">이용자 정보</div>
        <span>이름: {data.senior_name}</span>
        <span>질병: {data.diseases}</span>
        <span>나이: {data.age}세</span>
        <span>인형 ID: {data.doll_id}</span>
      </div>

      {/* 분석 결과 카드 */}
      <div className="border rounded-lg p-6 bg-white shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className={`text-xl font-bold px-2 py-1 rounded ${labelColorMap[data.label] || "bg-gray-300"} text-white`}>
            분석 결과: {data.label}
          </div>
        </div>

        <div className="space-y-2">
          <div className="font-bold">요약:</div>
          <div>{data.summary}</div>
          <div className="font-bold">근거:</div>
          <ul className="list-disc pl-6 space-y-1">
            {(data.reasons || []).map((reason, idx) => (
              <li key={idx}>{reason}</li>
            ))}
          </ul>
        </div>

        <div className="flex flex-wrap gap-4 pt-2">
          {[
            { label: "긴급", value: data.confidence_scores.emergency, color: "bg-red-600" },
            { label: "위험", value: data.confidence_scores.critical, color: "bg-orange-600" },
            { label: "주의", value: data.confidence_scores.danger, color: "bg-yellow-500" },
            { label: "안전", value: data.confidence_scores.positive, color: "bg-green-600" },
          ].map((score) => (
            <div key={score.label} className="flex flex-col items-start">
              <span>{score.label}: {(score.value * 100).toFixed(1)}%</span>
              <div className="w-64 h-4 bg-gray-200 rounded-full mt-1">
                <div
                  className={`h-4 ${score.color} rounded-full`}
                  style={{ width: `${score.value * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 대화 목록 */}
      <div className="border rounded-lg p-6 bg-white shadow-sm">
        <div className="font-bold text-xl mb-2">대화 목록</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100 text-gray-700">
                <th className="border p-2">순번</th>
                <th className="border p-2">내용</th>
                <th className="border p-2">시간</th>
                <th className="border p-2">결과</th>
                <th className="border p-2">Positive</th>
                <th className="border p-2">Danger</th>
                <th className="border p-2">Critical</th>
                <th className="border p-2">Emergency</th>
              </tr>
            </thead>
            <tbody>
              {(data.dialogues || []).map((dlg, i) => (
                <tr key={dlg.id} className="border-b hover:bg-gray-50">
                  <td className="border p-2 text-center">{i + 1}</td>
                  <td className="border p-2">{dlg.text}</td>
                  <td className="border p-2 text-center">{dlg.time}</td>
                  <td className="border p-2 text-center">{dlg.label}</td>
                  {[
                    dlg.scores?.[0] ?? 0,
                    dlg.scores?.[1] ?? 0,
                    dlg.scores?.[2] ?? 0,
                    dlg.scores?.[3] ?? 0,
                  ].map((s, idx) => (
                    <td key={idx} className="border p-2 text-center">{(s * 100).toFixed(1)}%</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 삭제 버튼 */}
      <div className="flex justify-center">
        <button
          onClick={handleDelete}
          className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition font-bold"
        >
          삭제
        </button>
      </div>
    </div>
  );
}
