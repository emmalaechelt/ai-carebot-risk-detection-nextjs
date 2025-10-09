"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import api from "@/lib/api";

interface DetailData {
  id: number;
  name: string;
  age: number;
  sex: string;
  disease: string;
  doll_id: string;
  result: string;
  summary: string;
  evidence: string[];
  scores: { positive: number; danger: number; critical: number; emergency: number };
  conversation: { id: number; text: string; time: string; result: string; scores: number[] }[];
}

export default function DetailedAnalysisPage() {
  const router = useRouter();
  const { id } = useParams();
  const [data, setData] = useState<DetailData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await api.get(`/analyze/${id}`);
        setData(res.data);
      } catch (error) {
        console.error("Failed to fetch detail:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  if (loading) return <div className="p-8 text-center">데이터를 불러오는 중입니다...</div>;
  if (!data) return <div className="p-8 text-center text-red-600">데이터를 찾을 수 없습니다.</div>;

  return (
    <div className="p-6 space-y-6">
      {/* 제목 */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-center flex-1">분석 상세 결과</h2>
        <button
          onClick={() => router.back()}
          className="bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 font-bold"
        >
          목록으로
        </button>
      </div>

      {/* 사용자 정보 */}
      <div className="border rounded-xl p-4 space-x-4 flex items-center justify-between text-sm">
        <div>이용자 정보</div>
        <div className="flex flex-wrap gap-x-4">
          <span>성함: {data.name}</span>
          <span>질병: {data.disease}</span>
          <span>나이: {data.age}세</span>
          <span>인형 ID: {data.doll_id}</span>
        </div>
      </div>

      {/* 분석 결과 */}
      <div className="border rounded-xl p-4 space-y-3">
        <div className="font-bold text-lg text-blue-700">
          분석 결과: {data.result}
        </div>
        <div>요약: {data.summary}</div>
        <div className="font-bold">근거</div>
        <ul className="list-disc pl-6 space-y-1">
          {data.evidence.map((e, idx) => (
            <li key={idx}>{e}</li>
          ))}
        </ul>

        <div className="flex gap-6 text-sm pt-3">
          <span>Positive: {data.scores.positive}%</span>
          <span>Danger: {data.scores.danger}%</span>
          <span>Critical: {data.scores.critical}%</span>
          <span>Emergency: {data.scores.emergency}%</span>
        </div>
      </div>

      {/* 대화 목록 */}
      <div className="border rounded-xl p-4">
        <div className="font-bold text-lg mb-2">대화 목록</div>
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
            {data.conversation.map((conv, i) => (
              <tr key={conv.id} className="border-b hover:bg-gray-50">
                <td className="border p-2 text-center">{i + 1}</td>
                <td className="border p-2">{conv.text}</td>
                <td className="border p-2 text-center">{conv.time}</td>
                <td className="border p-2 text-center">{conv.result}</td>
                {conv.scores.map((s, idx) => (
                  <td key={idx} className="border p-2 text-center">{s}%</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 삭제 버튼 */}
      <div className="flex justify-center pt-4">
        <button className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 font-bold">
          삭제
        </button>
      </div>
    </div>
  );
}