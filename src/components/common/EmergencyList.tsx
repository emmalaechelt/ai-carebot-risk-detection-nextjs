// src/components/common/EmergencyList.tsx
'use client';

// 긴급 상황 어르신 데이터 타입을 정의합니다.
interface EmergencySenior {
  id: number;
  timestamp: string;
  gu: string;
  dong: string;
  lat: number;
  lng: number;
}

interface EmergencyListProps {
  seniors: EmergencySenior[];
  // 항목 클릭 시, 해당 위치의 위도와 경도를 부모 컴포넌트로 전달하는 함수입니다.
  onItemClick: (lat: number, lng: number) => void;
}

export default function EmergencyList({ seniors, onItemClick }: EmergencyListProps) {
  return (
    <div className="w-full md:w-1/3 h-96 ml-0 md:ml-6 mt-4 md:mt-0 p-4 bg-white rounded-lg shadow-md overflow-y-auto">
      <h3 className="text-lg font-semibold mb-3 text-gray-800">긴급 목록</h3>
      <div className="w-full text-sm text-left text-gray-600">
        {/* 테이블 헤더 */}
        <div className="bg-gray-100 flex sticky top-0">
          <div className="p-2 w-1/6 font-bold text-center">순번</div>
          <div className="p-2 w-2/6 font-bold text-center">일시</div>
          <div className="p-2 w-3/6 font-bold text-center">위치</div>
        </div>
        {/* 테이블 바디 */}
        <div>
          {seniors.length > 0 ? (
            seniors.map((senior, index) => (
              <div
                key={senior.id}
                className="flex border-b hover:bg-gray-50 cursor-pointer"
                // 행 클릭 시 onItemClick 함수를 호출합니다.
                onClick={() => onItemClick(senior.lat, senior.lng)}
              >
                <div className="p-3 w-1/6 text-center">{index + 1}</div>
                <div className="p-3 w-2/6 text-center">
                  {new Date(senior.timestamp).toLocaleString('ko-KR', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                  })}
                </div>
                <div className="p-3 w-3/6 text-center">{`${senior.gu} ${senior.dong}`}</div>
              </div>
            ))
          ) : (
            <p className="text-center p-4 text-gray-500">긴급 상황이 없습니다.</p>
          )}
        </div>
      </div>
    </div>
  );
}