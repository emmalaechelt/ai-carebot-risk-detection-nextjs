"use client";

import { useState, ChangeEvent } from "react";

export default function SettingsPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // 프로필 이미지 상태
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // 비밀번호 변경 핸들러
  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      alert("새 비밀번호와 확인 비밀번호가 일치하지 않습니다.");
      return;
    }

    // TODO: 백엔드 API 호출해서 비밀번호 변경
    alert("비밀번호가 변경되었습니다.");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  // 프로필 이미지 변경 핸들러
  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImage(URL.createObjectURL(file)); // 미리보기용
      setPreviewImage(file.name); // 파일명 저장 (백엔드 업로드 시 활용)
    }
  };

  // 프로필 이미지 저장 핸들러
  const handleImageUpload = () => {
    if (!profileImage) {
      alert("업로드할 이미지를 선택하세요.");
      return;
    }
    // TODO: 백엔드 API 호출해서 실제 업로드
    alert("프로필 이미지가 변경되었습니다.");
  };

  return (
    <div className="space-y-3 text-black">
      {/* 관리자 정보 */}
      <section className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
        <h2 className="text-xl font-bold mb-4">내 정보</h2>
        <p className="text-gray-700">
          👤 관리자 이름 : <span className="font-semibold">홍길동</span>
        </p>
        <p className="text-gray-700">
          📧 이메일 : <span className="font-semibold">admin@example.com</span>
        </p>
        <p className="text-gray-700">
          🗓️ 가입일 : <span className="font-semibold">2025-01-01</span>
        </p>
      </section>

      {/* 프로필 이미지 변경 */}
      <section className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
        <h2 className="text-xl font-bold mb-4">프로필 이미지 변경</h2>
        <div className="flex items-center space-x-6">
          <div className="w-24 h-24 rounded-full overflow-hidden border border-gray-300">
            {profileImage ? (
              <img
                src={profileImage}
                alt="프로필 미리보기"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                없음
              </div>
            )}
          </div>

          <div className="space-y-2">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="block text-sm text-gray-600"
            />
            <button
              onClick={handleImageUpload}
              className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition"
            >
              저장
            </button>
          </div>
        </div>
      </section>

      {/* 비밀번호 변경 */}
      <section className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
        <h2 className="text-xl font-bold mb-4">비밀번호 변경</h2>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-gray-600 mb-1">현재 비밀번호</label>
            <input
              type="password"
              className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-gray-600 mb-1">새 비밀번호</label>
            <input
              type="password"
              className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-gray-600 mb-1">비밀번호 확인</label>
            <input
              type="password"
              className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition"
          >
            비밀번호 변경
          </button>
        </form>
      </section>
    </div>
  );
}
