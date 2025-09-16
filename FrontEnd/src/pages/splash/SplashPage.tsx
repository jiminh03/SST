import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function SplashPage() {
  const navigate = useNavigate()

  const handleLogin = () => {
    navigate('/auth/login')
  }

  const handleRegister = () => {
    navigate('/staffs')
  }

  return (
    <div className="h-[800px] w-[360px] bg-white flex flex-col mx-auto">
      {/* 메인 컨텐츠 */}
      <div className="flex-1 flex flex-col items-center justify-center space-y-6">
        {/* 로고 */}
        <img 
          src="/icons/SST_Logo_Black.png" 
          alt="SST Logo" 
          className="w-32 h-32"
        />
        
        {/* 앱 이름 */}
        <h1 className="text-2xl font-bold text-black text-center">
          Senior Safe Things
        </h1>
      </div>

      {/* 버튼들 - 하단 고정 */}
      <div className="px-6 pb-6 space-y-3">
        <button
          onClick={handleLogin}
          className="w-full font-semibold py-4 px-6 rounded-lg hover:bg-gray-800 transition-colors"
          style={{ backgroundColor: '#000000', color: '#ffffff' }}
        >
          로그인
        </button>
        <button
          onClick={handleRegister}
          className="w-full font-semibold py-4 px-6 rounded-lg border-2 border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-colors"
        >
          회원가입
        </button>
      </div>
    </div>
  )
}
