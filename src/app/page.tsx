import Image from 'next/image'

export default function Home() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="text-center -translate-y-3">
        {/* 로고 + "대전시" 한 줄 배치 */}
        <div className="flex items-center justify-center mb-3">
          <Image src="/img/logo.jpg" alt="대전시 로고" width={40} height={40} className="relative -left-3"/>
          <h1 className="text-3xl text-black font-bold">대전시</h1>
        </div>

        {/* 텍스트 */}
        
        <h2 className="text-3xl text-black font-bold mb-2">시니어 돌봄 관제시스템</h2>
        <p className="text-xl text-gray-500 mb-5">Senior Care Control System</p>

        {/* 로그인 박스 */}
        <div className="border-2 border-black rounded-xl p-8 w-70 mx-auto shadow-lg">
          <h3 className="text-xl text-black font-medium mb-6">관리자 로그인</h3>
          <input
            type="text"
            placeholder="ID"
            className="w-full border-2 border-gray-800 rounded-lg p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-600"
          />
          <input
            type="password"
            placeholder="PASSWORD"
            className="w-full border-2 border-gray-800 rounded-md p-2 mb-7 focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-600"
          />
          <button className="w-1/2 font-semibold bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 transition">
            들어가기
          </button>
        </div>
      </div>
    </div>
  )
}
