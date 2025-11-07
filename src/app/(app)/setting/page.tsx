"use client";

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Member } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

export default function SettingPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user: currentUser } = useAuth();

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const response = await api.get<Member[]>('/members');
      setMembers(response.data);
    } catch (err) {
      console.error('Failed to fetch members:', err);
      setError('회원 목록을 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleDelete = async (username: string) => {
    if (username === currentUser?.username) {
      alert("현재 로그인된 계정은 삭제할 수 없습니다.");
      return;
    }

    if (window.confirm(`'${username}' 회원을 정말 삭제하시겠습니까?`)) {
      try {
        await api.delete(`/members/${username}`);
        alert('회원이 성공적으로 삭제되었습니다.');
        fetchMembers();
      } catch (err) {
        console.error(`Failed to delete member ${username}:`, err);
        alert('회원 삭제 중 오류가 발생했습니다.');
      }
    }
  };

  const handlePasswordChange = async (username: string) => {
    const new_password = window.prompt(`'${username}'의 새 비밀번호를 입력하세요:`);

    if (!new_password || new_password.trim() === "") {
      alert("비밀번호를 입력해야 합니다.");
      return;
    }

    try {
      await api.patch(`/members/${username}/password`, { new_password });
      alert('비밀번호가 성공적으로 변경되었습니다.');
    } catch (err) {
      console.error(`Failed to change password for ${username}:`, err);
      alert('비밀번호 변경 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-black text-center">설정 - 관리자 계정 관리</h1>

      {/* ✅ [수정] 테이블을 감싸는 div 스타일 변경 */}
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
        <div className="overflow-x-auto">
          {/* ✅ [수정] 테이블 스타일 변경 */}
          <table className="w-full text-center text-sm">
            {/* ✅ [수정] thead 스타일 변경 */}
            <thead className="text-sm text-gray-700 bg-gray-50 border-b border-gray-200">
              <tr>
                {/* ✅ [수정] th 스타일 변경 (패딩, 폰트) */}
                <th scope="col" className="px-4 py-2 font-medium text-gray-600">아이디</th>
                <th scope="col" className="px-4 py-2 font-medium text-gray-600">권한</th>
                <th scope="col" className="px-4 py-2 font-medium text-gray-600">계정 상태</th>
                <th scope="col" className="px-4 py-2 font-medium text-gray-600">작업</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="text-center py-10">로딩 중...</td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={4} className="text-center py-10 text-red-500">{error}</td>
                </tr>
              ) : members.map((member) => (
                // ✅ [수정] tr 스타일 변경 (테두리)
                <tr key={member.username} className="bg-white border-b border-gray-200 hover:bg-gray-50">
                  {/* ✅ [수정] td/th 스타일 변경 (패딩, 폰트) */}
                  <th scope="row" className="px-4 py-2 font-medium text-gray-800 whitespace-nowrap">
                    {member.username}
                    {member.username === currentUser?.username && <span className="text-xs text-blue-500 ml-2">(나)</span>}
                  </th>
                  <td className="px-4 py-2 text-gray-700">{member.role}</td>
                  <td className="px-4 py-2 text-gray-700">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        member.enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {member.enabled ? '활성' : '비활성'}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-center space-x-2">
                    <button
                      onClick={() => handlePasswordChange(member.username)}
                      className="px-2 py-1.5 rounded-md text-xs bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                    >
                      비밀번호 변경
                    </button>
                    <button
                      onClick={() => handleDelete(member.username)}
                      disabled={member.username === currentUser?.username}
                      className={`px-2 py-1.5 rounded-md text-xs transition-colors ${
                        member.username === currentUser?.username
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-red-500 text-white hover:bg-red-600 cursor-pointer"
                      }`}
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}