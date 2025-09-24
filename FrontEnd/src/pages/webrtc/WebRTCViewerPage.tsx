import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Settings, RefreshCw } from 'lucide-react';
import WebRTCViewer from '../../components/webrtc/WebRTCViewer';

const WebRTCViewerPage: React.FC = () => {
  const { seniorId } = useParams<{ seniorId: string }>();
  const navigate = useNavigate();
  const [jwt, setJwt] = useState<string>('');
  const [serverUrl] = useState<string>('https://j13a503.p.ssafy.io');
  const [error, setError] = useState<string>('');
  const [status, setStatus] = useState<string>('초기화 중...');

  useEffect(() => {
    // 로컬 스토리지에서 JWT 토큰 가져오기
    const token = localStorage.getItem('access_token');
    if (token) {
      setJwt(token);
    } else {
      // 임시로 하드코딩된 토큰 사용 (테스트용)
      const tempToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdGFmZl9pZCI6MywiZW1haWwiOiJmaXJzdG1pbndvbzYxQGdtYWlsLmNvbSIsImV4cCI6MTc1ODY1MDk0MiwiaWF0IjoxNzU4NjA3NzQyfQ.Pj2W5hM35-Zqyel20Csh1zCchLR704pw9QGAzFOPJd8';
      setJwt(tempToken);
      console.log('임시 토큰 사용:', tempToken);
    }
  }, [navigate]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleSettings = () => {
    // 설정 모달 또는 페이지로 이동
    console.log('설정 열기');
  };

  const handleRefresh = () => {
    setError('');
    setStatus('새로고침 중...');
    // 컴포넌트가 자동으로 재연결됨
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
  };

  // const handleStatusChange = (newStatus: string) => {
  //   setStatus(newStatus);
  // };

  if (!seniorId) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px'
      }}>
        <div style={{
          textAlign: 'center',
          maxWidth: '400px'
        }}>
          <h1 style={{
            fontSize: '24px',
            fontWeight: '600',
            color: '#1f2937',
            marginBottom: '16px'
          }}>
            잘못된 접근
          </h1>
          <p style={{
            fontSize: '16px',
            color: '#6b7280',
            marginBottom: '24px'
          }}>
            Senior ID가 지정되지 않았습니다.
          </p>
          <button
            onClick={handleBack}
            style={{
              backgroundColor: '#000000',
              color: '#ffffff',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#333333'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#000000'}
          >
            돌아가기
          </button>
        </div>
      </div>
    );
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
            backgroundColor: '#000000',
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
              backgroundColor: '#000000',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              paddingTop: '40px'
            }}>
              {/* 헤더 */}
              <div style={{
                padding: '16px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                zIndex: 10
              }}>
                <div style={{
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
                      borderLeft: '2px solid #ffffff',
                      borderBottom: '2px solid #ffffff'
                    }}></span>
                  </span>
                  
                  <div>
                    <h1 style={{
                      fontSize: '18px',
                      fontWeight: '600',
                      color: '#ffffff',
                      margin: 0
                    }}>
                      실시간 영상
                    </h1>
                    <p style={{
                      fontSize: '12px',
                      color: '#9ca3af',
                      margin: 0
                    }}>
                      Senior ID: {seniorId}
                    </p>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <button
                    onClick={handleRefresh}
                    style={{
                      width: '32px',
                      height: '32px',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      border: 'none',
                      color: '#ffffff',
                      cursor: 'pointer',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                  >
                    <RefreshCw size={16} />
                  </button>
                  
                  <button
                    onClick={handleSettings}
                    style={{
                      width: '32px',
                      height: '32px',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      border: 'none',
                      color: '#ffffff',
                      cursor: 'pointer',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                  >
                    <Settings size={16} />
                  </button>
                </div>
              </div>

              {/* 메인 컨텐츠 - 비디오 영역 */}
              <div style={{
                flex: 1,
                position: 'relative',
                backgroundColor: '#000000',
                margin: '0 16px 16px 16px',
                borderRadius: '12px',
                overflow: 'hidden'
              }}>
                {jwt ? (
                  <WebRTCViewer
                    seniorId={parseInt(seniorId)}
                    jwt={jwt}
                    serverUrl={serverUrl}
                    onError={handleError}
                    // onStatusChange={handleStatusChange}
                  />
                ) : (
                  <div style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    fontSize: '16px'
                  }}>
                    로딩 중...
                  </div>
                )}
              </div>

              {/* 에러 메시지 */}
              {error && (
                <div style={{
                  position: 'absolute',
                  top: '80px',
                  left: '24px',
                  right: '24px',
                  backgroundColor: 'rgba(239, 68, 68, 0.9)',
                  color: '#ffffff',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  zIndex: 20,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <span>{error}</span>
                  <button
                    onClick={() => setError('')}
                    style={{
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: '#ffffff',
                      cursor: 'pointer',
                      fontSize: '16px',
                      fontWeight: 'bold'
                    }}
                  >
                    ×
                  </button>
                </div>
              )}

              {/* 상태 메시지 */}
              {status && !error && (
                <div style={{
                  position: 'absolute',
                  bottom: '32px',
                  left: '24px',
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  color: '#ffffff',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '500',
                  zIndex: 20
                }}>
                  {status}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebRTCViewerPage;
