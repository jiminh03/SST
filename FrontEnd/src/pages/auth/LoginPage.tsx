import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, User, Lock } from 'lucide-react'
import { login } from '../../api/eldersApi'

export default function LoginPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    login_id: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await login({
        login_id: formData.login_id,
        password: formData.password
      })
      
      // 로그인 성공 시 토큰 저장 (localStorage 또는 다른 저장소)
      localStorage.setItem('access_token', response.access_token)
      console.log('로그인 성공, 토큰 저장됨:', response.access_token)
      
      // 홈페이지로 이동
      navigate('/home')
    } catch (err) {
      setError(err instanceof Error ? err.message : '로그인에 실패했습니다.')
      console.error('로그인 에러:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackToSplash = () => {
    navigate('/')
  }

  return (
    <div className="h-[800px] w-[360px] bg-white flex flex-col mx-auto">
      {/* 헤더 */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <span
            onClick={handleBackToSplash}
            className="w-6 h-6 flex items-center justify-center cursor-pointer transition-colors"
          >
            <span className="w-4 h-4 rotate-45 border-l-2 border-b-2 border-gray-600"></span>
          </span>
          <h1 className="text-xl font-semibold text-gray-800">로그인</h1>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="flex-1 px-6 py-8">
        <div className="max-w-md mx-auto">
          {/* 로고 */}
          <div className="text-center mb-8">
            <img 
              src="/icons/SST_Logo_Black.png" 
              alt="SST Logo" 
              className="w-24 h-24 mx-auto mb-4"
            />
            <h2 className="text-lg font-semibold text-gray-800">Senior Safe Things</h2>
            <p className="text-sm text-gray-500 mt-2">담당자 로그인</p>
          </div>

          {/* 로그인 폼 */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 에러 메시지 */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm text-center">{error}</p>
              </div>
            )}

            {/* 아이디 입력 */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <User className="w-4 h-4 text-blue-500" />
                로그인 ID
              </label>
              <input
                type="text"
                name="login_id"
                value={formData.login_id}
                onChange={handleInputChange}
                placeholder="로그인 ID를 입력해주세요"
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 transition-all shadow-sm"
                required
              />
            </div>

            {/* 비밀번호 입력 */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Lock className="w-4 h-4 text-blue-500" />
                비밀번호
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="비밀번호를 입력해주세요"
                  className="w-full px-4 py-3 pr-12 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 transition-all shadow-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* 로그인 버튼 */}
            <button
              type="submit"
              disabled={isLoading || !formData.login_id || !formData.password}
              className="w-full font-semibold py-4 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#000000', color: '#ffffff' }}
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  로그인 중...
                </div>
              ) : (
                '로그인'
              )}
            </button>
          </form>

          {/* 회원가입 섹션 */}
          <div className="mt-8 text-center">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">또는</span>
              </div>
            </div>
            
            <div className="mt-6">
              <p className="text-sm text-gray-600 mb-4">
                아직 계정이 없으신가요?
              </p>
              <button
                onClick={() => navigate('/staffs')}
                className="w-full font-semibold py-4 px-6 rounded-lg border-2 border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-colors"
              >
                회원가입
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
