import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, User, Lock, Mail, Briefcase } from 'lucide-react'
import { register } from '../../api/eldersApi'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    full_name: '',
    login_id: '',
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
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
    setError(null)
    
    // 비밀번호 확인
    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }
    
    setIsLoading(true)
    
    try {
      await register({
        full_name: formData.full_name,
        role: '복지사', // 기본값으로 설정
        login_id: formData.login_id,
        password: formData.password
      })
      
      console.log('회원가입 성공!')
      alert('회원가입이 완료되었습니다. 로그인해주세요.')
      navigate('/auth/login')
    } catch (err) {
      setError(err instanceof Error ? err.message : '회원가입에 실패했습니다.')
      console.error('회원가입 에러:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackToLogin = () => {
    navigate('/auth/login')
  }

  return (
    <div className="h-[800px] w-[360px] bg-white flex flex-col mx-auto">
      {/* 헤더 */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <span
            onClick={handleBackToLogin}
            className="w-6 h-6 flex items-center justify-center cursor-pointer transition-colors"
          >
            <span className="w-4 h-4 rotate-45 border-l-2 border-b-2 border-gray-600"></span>
          </span>
          <h1 className="text-xl font-semibold text-gray-800">회원가입</h1>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="flex-1 px-6 py-6 overflow-y-auto">
        <div className="max-w-md mx-auto">
          {/* 로고 */}
          <div className="text-center mb-6">
            <img 
              src="/icons/SST_Logo_Black.png" 
              alt="SST Logo" 
              className="w-20 h-20 mx-auto mb-3"
            />
            <h2 className="text-lg font-semibold text-gray-800">Senior Safe Things</h2>
            <p className="text-sm text-gray-500 mt-1">담당자 회원가입</p>
          </div>

          {/* 회원가입 폼 */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 에러 메시지 */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm text-center">{error}</p>
              </div>
            )}

            {/* 이름 입력 */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <User className="w-4 h-4 text-blue-500" />
                이름
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                placeholder="이름을 입력해주세요"
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 transition-all shadow-sm"
                required
              />
            </div>


            {/* 로그인 ID 입력 */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Mail className="w-4 h-4 text-blue-500" />
                로그인 ID
                <span className="text-red-500">*</span>
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
                <span className="text-red-500">*</span>
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

            {/* 비밀번호 확인 입력 */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Lock className="w-4 h-4 text-blue-500" />
                비밀번호 확인
                <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="비밀번호를 다시 입력해주세요"
                  className="w-full px-4 py-3 pr-12 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 transition-all shadow-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* 회원가입 버튼 */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading || !formData.full_name || !formData.login_id || !formData.password || !formData.confirmPassword}
                className="w-full font-semibold py-4 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#000000', color: '#ffffff' }}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    회원가입 중...
                  </div>
                ) : (
                  '회원가입'
                )}
              </button>
            </div>
          </form>

          {/* 로그인 링크 */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              이미 계정이 있으신가요?{' '}
              <span 
                onClick={handleBackToLogin}
                className="text-blue-600 hover:text-blue-800 font-medium underline cursor-pointer transition-colors"
              >
                로그인하기
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
