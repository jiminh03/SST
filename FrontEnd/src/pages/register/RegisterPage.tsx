import { Camera } from 'lucide-react'

export default function RegisterPage() {
  return (
    <div className="flex flex-col h-full bg-gray-50">


      {/* 본문 */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {/* 프로필 이미지 업로드 */}
        <div className="flex justify-center relative">
          <div className="w-28 h-28 rounded-full bg-gray-200 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-14 h-14 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5.121 17.804A9.969 9.969 0 0112 15c2.21 0 4.236.72 5.879 1.929M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <button className="absolute bottom-0 right-[38%] bg-gray-700 text-white p-2 rounded-full">
            <Camera className="w-4 h-4" />
          </button>
        </div>

        {/* 입력 필드 */}
        <FormField label="이름" required placeholder="이름을 입력해주세요" />
        <FormField label="생년월일" required placeholder="YYYY-MM-DD" />
        <FormField label="주소" required placeholder="주소를 입력해주세요" />
        <FormField label="보호자 연락처" placeholder="예) 010-1234-5678" />
        <FormField label="연동 기기 번호" required placeholder="기기 번호를 입력해주세요" />
      </div>
    </div>
  )
}

interface FormFieldProps {
  label: string
  required?: boolean
  placeholder?: string
}

function FormField({ label, required, placeholder }: FormFieldProps) {
  return (
    <div className="flex flex-col">
      <label className="text-sm font-semibold text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type="text"
        placeholder={placeholder}
        className="mt-1 border-b border-gray-300 focus:outline-none focus:border-sky-500 placeholder-gray-400 text-sm py-2 bg-transparent"
      />
    </div>
  )
}
