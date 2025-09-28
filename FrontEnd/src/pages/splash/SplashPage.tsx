// import { useEffect } from 'react'
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
              position: 'relative'
            }}>
              {/* 메인 컨텐츠 */}
              <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '24px'
              }}>
                {/* 로고 */}
                <img 
                  src="/icons/SST_Logo_Black.png" 
                  alt="SST Logo" 
                  style={{ width: '128px', height: '128px' }}
                />
                
                {/* 앱 이름 */}
                <h1 style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: '#000000',
                  textAlign: 'center'
                }}>
                  Senior Safe Things
                </h1>
              </div>

              {/* 버튼들 - 하단 고정 */}
              <div style={{
                padding: '24px',
                paddingBottom: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <button
                  onClick={handleLogin}
                  style={{
                    width: '100%',
                    fontWeight: '600',
                    padding: '16px 24px',
                    borderRadius: '8px',
                    backgroundColor: '#000000',
                    color: '#ffffff',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = '#333333'}
                  onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = '#000000'}
                >
                  로그인
                </button>
                <button
                  onClick={handleRegister}
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
                    (e.target as HTMLElement).style.borderColor = '#9ca3af';
                    (e.target as HTMLElement).style.backgroundColor = '#f9fafb';
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLElement).style.borderColor = '#d1d5db';
                    (e.target as HTMLElement).style.backgroundColor = 'transparent';
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
  )
}
