'use client';

import React from "react";
import { useRouter } from 'next/navigation';
import { FaBell } from 'react-icons/fa';
import api from "@/lib/api";

interface EmergencySenior {
  senior_id: number; name: string; gu: string; dong: string;
}

export default function EmergencyToast() {
  const [seniors, setSeniors] = React.useState<EmergencySenior[]>([]);
  const router = useRouter();

  React.useEffect(() => {
    const fetchSeniors = async () => {
      try {
        const res = await api.get('/seniors', { params: { state: 'EMERGENCY', size: 10 } });
        if (res.data?.content) setSeniors(res.data.content);
      } catch (err) { console.error('긴급 이용자 정보 조회 실패:', err); }
    };
    fetchSeniors();
    const interval = setInterval(fetchSeniors, 30000); // 30초마다 확인
    return () => clearInterval(interval);
  }, []);

  const handleClick = (id: number) => {
    router.push(`/main/users/view/${id}`);
    setSeniors(s => s.filter(senior => senior.senior_id !== id));
  };

  if (seniors.length === 0) return null;

  return (
    <div className="fixed top-5 right-5 z-[100] flex flex-col items-end space-y-2 w-full max-w-sm">
      {seniors.map(s => (
        <button key={s.senior_id} onClick={() => handleClick(s.senior_id)}
          className="w-full flex items-start p-4 rounded-lg shadow-xl bg-red-100 border border-red-300 cursor-pointer text-left transition-transform transform hover:scale-105">
          <div className="flex-shrink-0 mr-4 mt-1 text-red-600"><FaBell size={20} /></div>
          <div className="flex-1">
            <p className="font-semibold text-red-800">긴급 상황 발생</p>
            <p className="text-sm text-red-700">{`[긴급] ${s.name} 어르신(${s.gu} ${s.dong})의 즉각적인 확인이 필요합니다.`}</p>
          </div>
        </button>
      ))}
    </div>
  );
}