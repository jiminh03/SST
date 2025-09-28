// import { useState } from 'react'
// import { useNavigate } from 'react-router-dom'
import { Key, LogOut, UserX } from 'lucide-react'

export default function SettingsPage() {
  // const navigate = useNavigate()

  const handlePasswordChange = () => {
    // URL 파라미터로 비밀번호 변경 모달 표시
    window.location.href = '/settings?changePassword=true'
  }

  const handleLogout = () => {
    // URL 파라미터로 로그아웃 확인 모달 표시
    window.location.href = '/settings?logout=true'
  }

  const handleWithdraw = () => {
    // URL 파라미터로 회원탈퇴 확인 모달 표시
    window.location.href = '/settings?withdraw=true'
  }


  return (
    <div className="min-h-full bg-white">
      <div className="px-6 py-8">
        <div className="max-w-md mx-auto">
          <div className="space-y-4">
            {/* 비밀번호 변경 */}
            <button
              onClick={handlePasswordChange}
              className="w-full flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 flex items-center justify-center">
                <Key className="w-5 h-5 text-gray-600" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-gray-800">비밀번호 변경</h3>
              </div>
            </button>

            {/* 로그아웃 */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 flex items-center justify-center">
                <LogOut className="w-5 h-5 text-gray-600" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-gray-800">로그아웃</h3>
              </div>
            </button>

            {/* 회원탈퇴 */}
            <button
              onClick={handleWithdraw}
              className="w-full flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 flex items-center justify-center">
                <UserX className="w-5 h-5 text-gray-600" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-gray-800">회원탈퇴</h3>
              </div>
            </button>
          </div>
        </div>
      </div>


    </div>
  )
}
