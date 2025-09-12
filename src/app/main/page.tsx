// components/Layout.js
import Image from 'next/image'

export default function Layout() {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* 사이드바 */}
      <aside className="w-64 bg-white border-r border-gray-300 flex flex-col">
        <div className="flex items-center justify-center h-16 border-b border-gray-300">
          <Image src="/public/img/logo.jpg" alt="대전시 로고" width={40} height={40} />
          <span className="ml-2 font-bold text-lg">대전시 시니어 돌봄 관제시스템</span>
        </div>

        <nav className="flex-1 px-4 py-6">
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-center space-x-2 cursor-pointer hover:text-orange-500">
              <span>🚨</span>
              <span>긴급 상황</span>
            </li>
            <li className="flex items-center space-x-2 cursor-pointer hover:text-orange-500">
              <span>📊</span>
              <span>전체 현황</span>
            </li>
            <li className="flex items-center space-x-2 cursor-pointer hover:text-orange-500">
              <span>📍</span>
              <span>구별 상황</span>
            </li>
            <li className="flex flex-col ml-6 space-y-1 cursor-pointer hover:text-orange-500">
              <span>이용자 관리</span>
              <ul className="ml-4 space-y-1 text-sm">
                <li>등록 / 수정</li>
                <li>조회</li>
              </ul>
            </li>
            <li className="flex items-center space-x-2 cursor-pointer hover:text-orange-500">
              <span>📈</span>
              <span>전체 통계</span>
            </li>
            <li className="flex items-center space-x-2 cursor-pointer hover:text-orange-500">
              <span>⚙️</span>
              <span>설정</span>
            </li>
          </ul>
        </nav>
      </aside>

      {/* 메인 콘텐츠 영역 */}
      <main className="flex-1 flex flex-col">
        {/* 상단 바 */}
        <header className="flex items-center justify-end h-16 px-6 bg-white border-b border-gray-300">
          <div className="border border-amber-600 rounded-xl p-2 flex items-center space-x-2 font-medium text-black">
            <span>👤</span>
            <span>관리자 OOO</span>
          </div>
        </header>

        {/* 실제 화면 콘텐츠 */}
        <div className="flex-1 p-6 overflow-auto">
            <h1 className="text-2xl font-bold mb-4">대시보드</h1>
        </div>
      </main>
    </div>
  )
}

