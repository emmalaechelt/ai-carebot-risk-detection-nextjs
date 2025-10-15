"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import * as XLSX from "xlsx";

interface Dialogue {
  id: number;
  text: string;
  uttered_at: string;
  label: string;
  confidence_scores: {
    positive: number;
    danger: number;
    critical: number;
    emergency: number;
  };
}

interface DetailData {
  senior_name: string;
  diseases: string;
  age: number;
  doll_id: string;
  label: string;
  summary: string;
  treatment_plan: string;
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

const labelTextColorMap: Record<string, string> = {
  EMERGENCY: "text-red-600",
  CRITICAL: "text-orange-600",
  DANGER: "text-yellow-500",
  POSITIVE: "text-green-600",
};

const labelToKorean: Record<string, string> = {
  EMERGENCY: "긴급",
  CRITICAL: "위험",
  DANGER: "주의",
  POSITIVE: "안전",
};

export default function DetailedAnalysisPage() {
  const router = useRouter();
  const { id } = useParams();
  const [data, setData] = useState<DetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/analyze/${id}`);
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

  const handleExcelDownload = () => {
    if (!data) return;
    console.log(data);
    setDownloading(true);

    try {
      const wb = XLSX.utils.book_new();
      const rows: any[][] = [];

      // 기본 정보
      rows.push(["분석 대상자 정보"]);
      rows.push(["항목", "내용"]);
      rows.push(["이름", data.senior_name]);
      rows.push(["질병", data.diseases]);
      rows.push(["나이", data.age]);
      rows.push(["인형 ID", data.doll_id]);
      rows.push([]);

      // 분석 결과
      rows.push(["분석 결과"]);
      rows.push(["항목", "내용"]);
      rows.push(["분석 결과", labelToKorean[data.label] || data.label]);
      rows.push(["요약", data.summary]);
      rows.push(["대처방안", data.treatment_plan || "정보 없음"]);
      rows.push(["근거", (data.reasons || []).join(", ")]);
      rows.push([]);

      // confidence scores
      rows.push(["Confidence Scores"]);
      rows.push(["항목", "퍼센트"]);
      rows.push(["긴급", data.confidence_scores.emergency]);
      rows.push(["위험", data.confidence_scores.critical]);
      rows.push(["주의", data.confidence_scores.danger]);
      rows.push(["안전", data.confidence_scores.positive]);
      rows.push([]);

      // 대화 목록
      rows.push(["대화 목록"]);
      rows.push(["순번", "내용", "결과", "긴급", "위험", "주의", "안전", "시간"]);
      (data.dialogues || []).forEach((dlg, idx) => {
        rows.push([
          idx + 1,
          dlg.text,
          labelToKorean[dlg.label] || dlg.label,
          dlg.confidence_scores.emergency,
          dlg.confidence_scores.critical,
          dlg.confidence_scores.danger,
          dlg.confidence_scores.positive,
          new Date(dlg.uttered_at).toLocaleString("ko-KR"),
        ]);
      });

      const sheet = XLSX.utils.aoa_to_sheet(rows);

      // Excel 스타일
      const range = XLSX.utils.decode_range(sheet["!ref"] || "");
      sheet["!cols"] = [];
      for (let C = range.s.c; C <= range.e.c; C++) {
        sheet["!cols"].push({ wch: 25 });
      }

      for (let R = range.s.r; R <= range.e.r; R++) {
        for (let C = range.s.c; C <= range.e.c; C++) {
          const cellAddr = XLSX.utils.encode_cell({ r: R, c: C });
          const cell = sheet[cellAddr];
          if (!cell) continue;

          // 결과 열 글자 색만 적용
          if (R > 0 && C === 2 && R > 10) {
            const dlg = data.dialogues?.[R - 11]; // optional chaining
            if (dlg) {
              let fillColor = "";
              switch (dlg.label) {
                case "EMERGENCY": fillColor = "F87171"; break;
                case "CRITICAL": fillColor = "FB923C"; break;
                case "DANGER": fillColor = "FACC15"; break;
                case "POSITIVE": fillColor = "4ADE80"; break;
                default: fillColor = "000000";
              }
              cell.s = { font: { color: { rgb: fillColor } }, alignment: { horizontal: "center", wrapText: true } };
            } else {
              // dlg가 undefined일 때는 검정으로
              cell.s = { font: { color: { rgb: "000000" } }, alignment: { horizontal: "center", wrapText: true } };
            }
          } else {
            const isNumber = typeof cell.v === "number" || (typeof cell.v === "string" && cell.v.match(/^\d+(\.\d+)?%?$/));
            cell.s = { font: { color: { rgb: "000000" } }, alignment: { horizontal: isNumber ? "right" : "left", wrapText: true } };
          }
        }
      }

      XLSX.utils.book_append_sheet(wb, sheet, "분석 상세");
      XLSX.writeFile(
        wb,
        `분석_상세_${data.senior_name}_${new Date().toISOString().slice(0, 10)}.xlsx`
      );

    } catch (error) {
      console.error("Excel 다운로드 실패:", error);
    } finally {
      setDownloading(false);
    }
  };

  if (loading)
    return <div className="p-8 text-center text-gray-500 text-lg">데이터를 불러오는 중...</div>;
  if (!data)
    return <div className="p-8 text-center text-red-600 text-lg">데이터를 찾을 수 없습니다.</div>;

  return (
    <div className="p-6 space-y-6 text-lg text-black">
      {/* 제목 */}
      <h2 className="text-3xl font-bold text-center">전체 분석결과</h2>

      {/* 다운로드 버튼 - 제목 아래 오른쪽 */}
      <div className="flex justify-end mt-2">
        <button
          onClick={handleExcelDownload}
          disabled={downloading}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-bold text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {downloading ? "다운로드 중..." : "엑셀 다운로드"}
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
        <div className="flex items-center">
          <div className={`inline-block text-xl font-bold px-2 py-1 rounded ${labelColorMap[data.label] || "bg-gray-300"} text-white`}>
            분석 결과: {labelToKorean[data.label] || data.label}
          </div>
        </div>

        <div className="space-y-2">
          <div className="font-bold">요약:</div>
          <div>{data.summary}</div>

          <div className="font-bold">대처방안:</div>
          <div>{data.treatment_plan?.trim() || "대처방안 정보가 없습니다."}</div>

          <div className="font-bold">근거:</div>
          <ul className="list-disc pl-6 space-y-1">
            {(data.reasons || []).map((reason, idx) => <li key={idx}>{reason}</li>)}
          </ul>
        </div>

        <div className="flex flex-wrap gap-6 pt-2">
          {[
            { label: "긴급", value: data.confidence_scores.emergency, color: "bg-red-600" },
            { label: "위험", value: data.confidence_scores.critical, color: "bg-orange-600" },
            { label: "주의", value: data.confidence_scores.danger, color: "bg-yellow-500" },
            { label: "안전", value: data.confidence_scores.positive, color: "bg-green-600" },
          ].map((score) => (
            <div key={score.label} className="flex flex-col items-start">
              <span>{score.label}: {(score.value * 100).toFixed(1)}%</span>
              <div className="w-32 h-4 bg-gray-200 rounded-full mt-1">
                <div className={`h-4 ${score.color} rounded-full`} style={{ width: `${score.value * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 대화 목록 */}
      <div className="border rounded-lg p-6 bg-white shadow-sm">
        <div className="font-bold text-xl mb-2">대화 목록</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse border">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 w-16">순번</th>
                <th className="border p-2 w-1/2">내용</th>
                <th className="border p-2 w-16">결과</th>
                <th className="border p-2 w-16">긴급</th>
                <th className="border p-2 w-16">위험</th>
                <th className="border p-2 w-16">주의</th>
                <th className="border p-2 w-16">안전</th>
                <th className="border p-2 w-40">시간</th>
              </tr>
            </thead>
            <tbody>
              {(data.dialogues || []).map((dlg, i) => {
                const time = new Date(dlg.uttered_at).toLocaleString("ko-KR", {
                  year: "numeric", month: "2-digit", day: "2-digit",
                  hour: "2-digit", minute: "2-digit", second: "2-digit"
                });
                const resultColor = labelTextColorMap[dlg.label];
                return (
                  <tr key={dlg.id}>
                    <td className="border p-2 text-center text-black">{i + 1}</td>
                    <td className="border p-2 text-black">{dlg.text}</td>
                    <td className={`border p-2 text-center font-semibold ${resultColor}`}>{labelToKorean[dlg.label] || dlg.label}</td>
                    <td className="border p-2 text-center text-black">{(dlg.confidence_scores.emergency * 100).toFixed(1)}%</td>
                    <td className="border p-2 text-center text-black">{(dlg.confidence_scores.critical * 100).toFixed(1)}%</td>
                    <td className="border p-2 text-center text-black">{(dlg.confidence_scores.danger * 100).toFixed(1)}%</td>
                    <td className="border p-2 text-center text-black">{(dlg.confidence_scores.positive * 100).toFixed(1)}%</td>
                    <td className="border p-2 text-center text-black">{time}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 삭제 & 목록 버튼 */}
      <div className="flex justify-center gap-4">
        <button
          onClick={handleDelete}
          className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition font-bold"
        >
          삭제
        </button>
        <button
          onClick={() => router.back()}
          className="bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 transition font-bold"
        >
          목록으로
        </button>
      </div>
    </div>
  );
}
