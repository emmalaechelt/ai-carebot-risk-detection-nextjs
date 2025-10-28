'use client';

// 👇 import 경로를 새로 만든 타입 파일로 변경합니다.
import type { RiskSenior } from '@/types';

interface RiskRankListProps {
  seniors: RiskSenior[];
  selectedSeniorId: number | null;
  onSeniorSelect: (senior: RiskSenior) => void;
  riskLevelLabel: string;
}

export default function RiskRankList({
  seniors,
  selectedSeniorId,
  onSeniorSelect,
  riskLevelLabel,
}: RiskRankListProps) {
  return (
    // 👇 w-1/3으로 너비를 지정하여 오른쪽에 위치하도록 설정
    <div className="w-full md:w-1/3 h-96 md:h-[500px] ml-0 md:ml-4 mt-4 md:mt-0 p-3 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-3 text-gray-800 sticky top-0 bg-white pt-1 pb-2 z-10 border-b">
        {riskLevelLabel} 순
      </h3>
      <div className="overflow-y-auto h-[calc(100%-48px)] space-y-3 pr-1">
        {seniors.length > 0 ? (
          seniors.map((senior, index) => (
            <div
              key={senior.overall_result_id}
              onClick={() => onSeniorSelect(senior)}
              className={`p-3 rounded-lg border cursor-pointer transition-all ${
                selectedSeniorId === senior.overall_result_id
                  ? 'border-blue-500 bg-blue-50 shadow-md ring-2 ring-blue-300'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="font-bold text-base text-gray-800">
                  {index + 1}. {senior.name || senior.senior_name}
                </span>
                <span className="text-xs text-gray-500">
                  ({senior.sex === 'MALE' ? '남' : '여'}, {senior.age}세)
                </span>
              </div>
              <div className="text-sm text-gray-600">
                위치: {senior.gu} {senior.dong}
              </div>
              <div className="text-xs text-gray-400 mt-2 text-right">
                일시: {new Date(senior.timestamp).toLocaleString('ko-KR')}
              </div>
            </div>
          ))
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-center p-4 text-gray-500">해당 상태의 어르신이 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}