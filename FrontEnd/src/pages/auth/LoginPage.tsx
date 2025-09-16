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
                  onClick={handleBackToSplash}
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
                }}>로그인</h1>
              </div>

              {/* 메인 컨텐츠 */}
              <div style={{
                flex: 1,
                padding: '32px 24px',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <div style={{ maxWidth: '384px', margin: '0 auto', width: '100%' }}>
                  {/* 로고 */}
                  <div style={{
                    textAlign: 'center',
                    marginBottom: '32px'
                  }}>
                    <img 
                      src="/icons/SST_Logo_Black.png" 
                      alt="SST Logo" 
                      style={{ width: '96px', height: '96px', margin: '0 auto 16px' }}
                    />
                    <h2 style={{
                      fontSize: '18px',
                      fontWeight: '600',
                      color: '#1f2937'
                    }}>Senior Safe Things</h2>
                    <p style={{
                      fontSize: '14px',
                      color: '#6b7280',
                      marginTop: '8px'
                    }}>담당자 로그인</p>
                  </div>

                  {/* 로그인 폼 */}
                  <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
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

                    {/* 아이디 입력 */}
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
                        로그인 ID
                      </label>
                      <input
                        type="text"
                        name="login_id"
                        value={formData.login_id}
                        onChange={handleInputChange}
                        placeholder="로그인 ID를 입력해주세요"
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
                          onMouseEnter={(e) => e.target.style.color = '#4b5563'}
                          onMouseLeave={(e) => e.target.style.color = '#9ca3af'}
                        >
                          {showPassword ? <EyeOff style={{ width: '20px', height: '20px' }} /> : <Eye style={{ width: '20px', height: '20px' }} />}
                        </button>
                      </div>
                    </div>

                    {/* 로그인 버튼 */}
                    <button
                      type="submit"
                      disabled={isLoading || !formData.login_id || !formData.password}
                      style={{
                        width: '100%',
                        fontWeight: '600',
                        padding: '16px 24px',
                        borderRadius: '8px',
                        backgroundColor: '#000000',
                        color: '#ffffff',
                        border: 'none',
                        cursor: isLoading || !formData.login_id || !formData.password ? 'not-allowed' : 'pointer',
                        opacity: isLoading || !formData.login_id || !formData.password ? 0.5 : 1,
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        if (!isLoading && formData.login_id && formData.password) {
                          e.target.style.backgroundColor = '#333333'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isLoading && formData.login_id && formData.password) {
                          e.target.style.backgroundColor = '#000000'
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
                          로그인 중...
                        </div>
                      ) : (
                        '로그인'
                      )}
                    </button>
                  </form>

                  {/* 회원가입 섹션 */}
                  <div style={{ marginTop: '32px', textAlign: 'center' }}>
                    <div style={{ position: 'relative' }}>
                      <div style={{
                        position: 'absolute',
                        top: '0',
                        left: '0',
                        right: '0',
                        display: 'flex',
                        alignItems: 'center'
                      }}>
                        <div style={{
                          width: '100%',
                          borderTop: '1px solid #e5e7eb'
                        }}></div>
                      </div>
                      <div style={{
                        position: 'relative',
                        display: 'flex',
                        justifyContent: 'center',
                        fontSize: '14px'
                      }}>
                        <span style={{
                          padding: '0 16px',
                          backgroundColor: '#ffffff',
                          color: '#6b7280'
                        }}>또는</span>
                      </div>
                    </div>
                    
                    <div style={{ marginTop: '24px' }}>
                      <p style={{
                        fontSize: '14px',
                        color: '#4b5563',
                        marginBottom: '16px'
                      }}>
                        아직 계정이 없으신가요?
                      </p>
                      <button
                        onClick={() => navigate('/staffs', { state: { from: 'login' } })}
                        style={{
                          width: '100%',
                          fontWeight: '600',
                          padding: '16px 24px',
                          borderRadius: '8px',
                          backgroundColor: 'transparent',
                          color: '#374151',
                          border: '2px solid #d1d5db',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.borderColor = '#9ca3af'
                          e.target.style.backgroundColor = '#f9fafb'
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.borderColor = '#d1d5db'
                          e.target.style.backgroundColor = 'transparent'
                        }}
                      >
                        회원가입
                      </button>
                    </div>
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
