// src/components/common/CsvUploadModal.tsx
"use client";

import { useState, ChangeEvent, DragEvent } from "react";
import api from "@/lib/api";

interface CsvUploadModalProps {
  onClose: () => void;
}

export default function CsvUploadModal({ onClose }: CsvUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setError(null);
    }
  };

  const handleDragEvents = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragover") setIsDragOver(true);
    if (e.type === "dragleave") setIsDragOver(false);
  };

  const handleSubmit = async () => {
    if (!file) {
      setError("파일을 선택해주세요.");
      return;
    }
    setIsUploading(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", file);

    try {
      await api.post("/analyze", formData, { headers: { "Content-Type": "multipart/form-data" } });
      alert("분석 요청에 성공했습니다.");
      onClose();
    } catch (err) {
      console.error(err);
      setError("업로드 또는 분석에 실패했습니다. 파일 형식을 확인해주세요.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-black">대화 파일 분석 요청 (CSV)</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">&times;</button>
        </div>
        
        <div
          onDrop={handleDrop}
          onDragOver={handleDragEvents}
          onDragLeave={handleDragEvents}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
            ${isDragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
        >
          <input type="file" id="csv-upload" accept=".csv" onChange={handleFileChange} className="hidden" />
          <label htmlFor="csv-upload" className="cursor-pointer">
            <p className="text-gray-500">파일을 드래그하거나 클릭하여 업로드</p>
            <p className="text-sm text-gray-400 mt-1">(.csv 형식만 가능)</p>
          </label>
        </div>
        
        {file && <p className="text-center mt-4 text-sm text-gray-700">선택된 파일: {file.name}</p>}
        {error && <p className="text-center mt-4 text-sm text-red-500">{error}</p>}
        
        <div className="mt-6 flex justify-end space-x-2">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">취소</button>
          <button
            onClick={handleSubmit}
            disabled={isUploading || !file}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
          >
            {isUploading ? "업로드 중..." : "분석 요청"}
          </button>
        </div>
      </div>
    </div>
  );
}