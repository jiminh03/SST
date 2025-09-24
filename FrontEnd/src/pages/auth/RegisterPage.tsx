import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Eye, EyeOff, User, Lock, Mail } from 'lucide-react'
import { register } from '../../api/eldersApi'

export default function RegisterPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
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
    
    // 클라이언트 측 유효성 검사
    if (!formData.full_name.trim()) {
      setError('이름을 입력해주세요.')
      return
    }
    
    if (!formData.email.trim()) {
      setError('이메일을 입력해주세요.')
      return
    }
    
    // 이메일 형식 검사
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError('올바른 이메일 형식을 입력해주세요.')
      return
    }
    
    
    if (!formData.password) {
      setError('비밀번호를 입력해주세요.')
      return
    }
    
    if (formData.password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.')
      return
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }
    
    setIsLoading(true)
    
    try {
      await register({
        full_name: formData.full_name,
        email: formData.email,
        password: formData.password
      })
      
      console.log('회원가입 성공!')
      alert('회원가입이 완료되었습니다. 로그인해주세요.')
      navigate('/auth/login')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '회원가입에 실패했습니다.'
      setError(errorMessage)
      console.error('회원가입 에러 상세:', {
        error: err,
        message: errorMessage,
        formData: {
          full_name: formData.full_name,
          email: formData.email,
          passwordLength: formData.password?.length || 0,
          confirmPasswordLength: formData.confirmPassword?.length || 0
        }
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    // 어디서 왔는지에 따라 다른 페이지로 이동
    const from = location.state?.from
    if (from === 'login') {
      navigate('/auth/login')
    } else {
      navigate('/')
    }
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#ffffff',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '32px'
    }}>
      {/* 폰 목업 배경 */}
      <div style={{ position: 'relative' }}>
        {/* 폰 외곽선 */}
        <div style={{
          width: '400px',
          height: '840px',
          backgroundColor: '#000000',
          borderRadius: '48px',
          padding: '8px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }}>
          {/* 폰 화면 */}
          <div style={{
            width: '100%',
            height: '100%',
            backgroundColor: '#ffffff',
            borderRadius: '40px',
            overflow: 'hidden',
            position: 'relative'
          }}>
            {/* 노치 */}
            <div style={{
              position: 'absolute',
              top: '0',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '128px',
              height: '24px',
              backgroundColor: '#000000',
              borderBottomLeftRadius: '16px',
              borderBottomRightRadius: '16px',
              zIndex: 10
            }}></div>
            
            {/* 실제 앱 컨텐츠 */}
            <div style={{
              width: '100%',
              height: '100%',
              backgroundColor: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              paddingTop: '40px',
              background: 'linear-gradient(to bottom, #ffffff 0%, #ffffff 40px, #ffffff 100%)'
            }}>
              {/* 헤더 */}
              <div style={{
                padding: '16px 24px',
                borderBottom: '1px solid #e5e7eb',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <span
                  onClick={handleBack}
                  style={{
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'color 0.2s'
                  }}
                >
                  <span style={{
                    width: '16px',
                    height: '16px',
                    transform: 'rotate(45deg)',
                    borderLeft: '2px solid #4b5563',
                    borderBottom: '2px solid #4b5563'
                  }}></span>
                </span>
                <h1 style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  color: '#1f2937'
                }}>회원가입</h1>
              </div>

              {/* 메인 컨텐츠 */}
              <div style={{
                flex: 1,
                padding: '24px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <div style={{ maxWidth: '384px', margin: '0 auto', width: '100%' }}>
                  {/* 로고 */}
                  <div style={{
                    textAlign: 'center',
                    marginBottom: '24px'
                  }}>
                    <img 
                      src="/icons/SST_Logo_Black.png" 
                      alt="SST Logo" 
                      style={{ width: '80px', height: '80px', margin: '0 auto 12px' }}
                    />
                    <h2 style={{
                      fontSize: '18px',
                      fontWeight: '600',
                      color: '#1f2937'
                    }}>Senior Safe Things</h2>
                    <p style={{
                      fontSize: '14px',
                      color: '#6b7280',
                      marginTop: '4px'
                    }}>담당자 회원가입</p>
                  </div>

                  {/* 회원가입 폼 */}
                  <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* 에러 메시지 */}
                    {error && (
                      <div style={{
                        padding: '12px',
                        backgroundColor: '#fef2f2',
                        border: '1px solid #fecaca',
                        borderRadius: '8px'
                      }}>
                        <p style={{
                          color: '#dc2626',
                          fontSize: '14px',
                          textAlign: 'center'
                        }}>{error}</p>
                      </div>
                    )}

                    {/* 이름 입력 */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#374151'
                      }}>
                        <User style={{ width: '16px', height: '16px', color: '#3b82f6' }} />
                        이름
                        <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="text"
                        name="full_name"
                        value={formData.full_name}
                        onChange={handleInputChange}
                        placeholder="이름을 입력해주세요"
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          backgroundColor: '#ffffff',
                          border: '1px solid #d1d5db',
                          borderRadius: '8px',
                          fontSize: '16px',
                          outline: 'none',
                          transition: 'all 0.2s'
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = '#3b82f6'
                          e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '#d1d5db'
                          e.target.style.boxShadow = 'none'
                        }}
                        required
                      />
                    </div>

                    {/* 이메일 입력 */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#374151'
                      }}>
                        <Mail style={{ width: '16px', height: '16px', color: '#3b82f6' }} />
                        이메일
                        <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="이메일을 입력해주세요"
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          backgroundColor: '#ffffff',
                          border: '1px solid #d1d5db',
                          borderRadius: '8px',
                          fontSize: '16px',
                          outline: 'none',
                          transition: 'all 0.2s'
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = '#3b82f6'
                          e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '#d1d5db'
                          e.target.style.boxShadow = 'none'
                        }}
                        required
                      />
                    </div>


                    {/* 비밀번호 입력 */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#374151'
                      }}>
                        <Lock style={{ width: '16px', height: '16px', color: '#3b82f6' }} />
                        비밀번호
                        <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          placeholder="비밀번호를 입력해주세요"
                          style={{
                            width: '100%',
                            padding: '12px 48px 12px 16px',
                            backgroundColor: '#ffffff',
                            border: '1px solid #d1d5db',
                            borderRadius: '8px',
                            fontSize: '16px',
                            outline: 'none',
                            transition: 'all 0.2s'
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = '#3b82f6'
                            e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = '#d1d5db'
                            e.target.style.boxShadow = 'none'
                          }}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          style={{
                            position: 'absolute',
                            right: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: '#9ca3af',
                            cursor: 'pointer',
                            transition: 'color 0.2s',
                            background: 'none',
                            border: 'none',
                            padding: '0'
                          }}
                          onMouseEnter={(e) => (e.target as HTMLElement).style.color = '#4b5563'}
                          onMouseLeave={(e) => (e.target as HTMLElement).style.color = '#9ca3af'}
                        >
                          {showPassword ? <EyeOff style={{ width: '20px', height: '20px' }} /> : <Eye style={{ width: '20px', height: '20px' }} />}
                        </button>
                      </div>
                    </div>

                    {/* 비밀번호 확인 입력 */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#374151'
                      }}>
                        <Lock style={{ width: '16px', height: '16px', color: '#3b82f6' }} />
                        비밀번호 확인
                        <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          placeholder="비밀번호를 다시 입력해주세요"
                          style={{
                            width: '100%',
                            padding: '12px 48px 12px 16px',
                            backgroundColor: '#ffffff',
                            border: '1px solid #d1d5db',
                            borderRadius: '8px',
                            fontSize: '16px',
                            outline: 'none',
                            transition: 'all 0.2s'
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = '#3b82f6'
                            e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = '#d1d5db'
                            e.target.style.boxShadow = 'none'
                          }}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          style={{
                            position: 'absolute',
                            right: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: '#9ca3af',
                            cursor: 'pointer',
                            transition: 'color 0.2s',
                            background: 'none',
                            border: 'none',
                            padding: '0'
                          }}
                          onMouseEnter={(e) => (e.target as HTMLElement).style.color = '#4b5563'}
                          onMouseLeave={(e) => (e.target as HTMLElement).style.color = '#9ca3af'}
                        >
                          {showConfirmPassword ? <EyeOff style={{ width: '20px', height: '20px' }} /> : <Eye style={{ width: '20px', height: '20px' }} />}
                        </button>
                      </div>
                    </div>

                    {/* 회원가입 버튼 */}
                    <div style={{ paddingTop: '16px' }}>
                      <button
                        type="submit"
                        disabled={isLoading || !formData.full_name || !formData.email || !formData.password || !formData.confirmPassword}
                        style={{
                          width: '100%',
                          fontWeight: '600',
                          padding: '16px 24px',
                          borderRadius: '8px',
                          backgroundColor: '#000000',
                          color: '#ffffff',
                          border: 'none',
                          cursor: isLoading || !formData.full_name || !formData.email || !formData.password || !formData.confirmPassword ? 'not-allowed' : 'pointer',
                          opacity: isLoading || !formData.full_name || !formData.email || !formData.password || !formData.confirmPassword ? 0.5 : 1,
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          if (!isLoading && formData.full_name && formData.email && formData.password && formData.confirmPassword) {
                            (e.target as HTMLElement).style.backgroundColor = '#333333'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isLoading && formData.full_name && formData.email && formData.password && formData.confirmPassword) {
                            (e.target as HTMLElement).style.backgroundColor = '#000000'
                          }
                        }}
                      >
                        {isLoading ? (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px'
                          }}>
                            <div style={{
                              width: '20px',
                              height: '20px',
                              border: '2px solid #ffffff',
                              borderTop: '2px solid transparent',
                              borderRadius: '50%',
                              animation: 'spin 1s linear infinite'
                            }} />
                            회원가입 중...
                          </div>
                        ) : (
                          '회원가입'
                        )}
                      </button>
                    </div>
                  </form>

                  {/* 로그인 링크 */}
                  <div style={{ marginTop: '24px', textAlign: 'center' }}>
                    <p style={{
                      fontSize: '14px',
                      color: '#6b7280'
                    }}>
                      이미 계정이 있으신가요?{' '}
                      <span 
                        onClick={() => navigate('/auth/login')}
                        style={{
                          color: '#2563eb',
                          fontWeight: '500',
                          textDecoration: 'underline',
                          cursor: 'pointer',
                          transition: 'color 0.2s'
                        }}
                        onMouseEnter={(e) => (e.target as HTMLElement).style.color = '#1d4ed8'}
                        onMouseLeave={(e) => (e.target as HTMLElement).style.color = '#2563eb'}
                      >
                        로그인하기
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
