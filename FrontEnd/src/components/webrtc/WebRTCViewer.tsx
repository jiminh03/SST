import React, { useEffect, useRef, useState } from 'react';
import { useSocket } from '../../contexts/SocketContext';

// Socket.IO 이벤트 타입 정의
const WebRTCEvents = {
  REGISTER_OFFER: 'client:register_offer',
  SEND_ANSWER: 'client:send_answer',
  CHECK_OFFER: 'client:check_offer',
  CHECK_ANSWER: 'client:check_answer',
  SEND_ICE_CANDIDATE: 'client:send_ice_candidate',
  NEW_OFFER: 'server:new_offer',
  NEW_ANSWER: 'server:new_answer',
  NEW_ICE_CANDIDATE: 'server:new_ice_candidate'
} as const;

// WebRTC 관련 타입 정의

// interface CheckOfferData {
//   seniorId: number;
// }

// interface SendAnswerData {
//   seniorId: number;
//   answer: {
//     sdp: string;
//     type: 'answer';
//   };
// }

// interface SendIceCandidateData {
//   seniorId: number;
//   candidate: {
//     candidate: string;
//     sdpMLineIndex: number | null;
//     sdpMid: string | null;
//   };
// }

interface WebRTCViewerProps {
  seniorId: number;
  jwt: string;
  serverUrl: string;
  onError?: (error: string) => void;
  // onStatusChange?: (status: string) => void;
}

const WebRTCViewer: React.FC<WebRTCViewerProps> = ({
  seniorId,
  jwt,
  serverUrl,
  onError
  // onStatusChange
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('연결 대기 중...');
  const [showTestVideo, setShowTestVideo] = useState(false);
  
  // Socket Context 사용
  const { socket, isConnected, connectSocket, addEventListener, emit } = useSocket();

  // WebRTC 설정 - 더 간단한 설정으로 변경
  const rtcConfiguration: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },
      // 파이썬 코드와 동일한 TURN 서버 추가
      {
        urls: [
          'turns:j13a503.p.ssafy.io:5349?transport=tcp',
          'turn:j13a503.p.ssafy.io:3478?transport=udp',
        ],
        username: 'SST_TURN',
        credential: 'usGqSEnD6Spu8TxC51bUx9j13SCjPSTk',
      },
    ],
    iceCandidatePoolSize: 10, // ICE 풀 활성화 (파이썬 코드와 동일)
    bundlePolicy: 'max-bundle',
    rtcpMuxPolicy: 'require',
  };

  useEffect(() => {
    initializeWebRTC();
    return () => {
      cleanup();
    };
  }, [seniorId, jwt, serverUrl]);

  const initializeWebRTC = async () => {
    try {
      setConnectionStatus('WebRTC 초기화 중...');
      
        // Socket Context를 통해 연결 (HomePage에서 이미 연결됨)
        // connectSocket(serverUrl, jwt); // 제거됨

      // RTCPeerConnection 생성
      const peerConnection = new RTCPeerConnection(rtcConfiguration);
      peerConnectionRef.current = peerConnection;

      // Socket.IO 이벤트 핸들러 - Context를 통해 등록
      const handleConnect = () => {
        console.log(`서버에 연결되었습니다. (sid: ${socket?.id || '연결 중'})`);
        setConnectionStatus('서버 연결됨');
        
        // Socket Context 상태 강제 업데이트
        if (socket && socket.id) {
          console.log('✅ WebRTC: Socket 연결 성공, Context 상태 업데이트');
          // Context의 connectSocket을 다시 호출하여 상태 동기화
          connectSocket(serverUrl, jwt);
        }
        
      };

      const handleDisconnect = () => {
        console.log('서버와의 연결이 끊어졌습니다.');
        setIsStreaming(false);
        setConnectionStatus('연결 끊어짐');
      };

      addEventListener('connect', handleConnect);
      addEventListener('disconnect', handleDisconnect);

      const handleNewOffer = async (offerData: Record<string, any>) => {
        console.log('📨 NEW_OFFER 이벤트 수신:', {
          offerData: offerData ? '데이터 있음' : '데이터 없음',
          offerLength: offerData?.length || 0,
          seniorId: seniorId
        });
        
        if (!offerData) {
          console.log(`Senior ID ${seniorId}에 대한 Offer가 아직 없습니다. 10초 후 다시 시도합니다.`);
          setTimeout(() => {
            emit(WebRTCEvents.CHECK_OFFER, seniorId);
          }, 10000);
          return;
        }

        try {
          const offer = offerData
          // const offer = JSON.parse(offerData);
          // console.log('📋 Offer 파싱 성공:', {
          //   type: offer.type,
          //   sdpLength: offer.sdp?.length || 0,
          //   sdpPreview: offer.sdp?.substring(0, 100) + '...'
          // });
          
          console.log('🔄 Remote Description 설정 중...');
          await peerConnection.setRemoteDescription(
            new RTCSessionDescription(offer as RTCSessionDescriptionInit));
          console.log('✅ Remote Description 설정 완료');
          
          console.log('🔄 Answer 생성 중...');
          const answer = await peerConnection.createAnswer();
          console.log('✅ Answer 생성 완료:', {
            type: answer.type,
            sdpLength: answer.sdp?.length || 0
          });
          
          console.log('🔄 Local Description 설정 중...');
          await peerConnection.setLocalDescription(answer);
          console.log('✅ Local Description 설정 완료');
          
          const answerData = {
            sdp: peerConnection.localDescription!.sdp,
            type: 'answer'
          };
          
          console.log('📤 Answer 전송 중...', {
            seniorId: seniorId,
            answerType: answerData.type,
            sdpLength: answerData.sdp.length
          });
          // 인자1, 인자2 형식으로 전송 (배열이 아닌 개별 인자)
          emit(WebRTCEvents.SEND_ANSWER, seniorId, answerData);
          console.log('✅ Answer 전송 완료');
        } catch (error) {
          console.error('❌ Offer 처리 중 오류 발생:', error);
          console.error('❌ 오류 상세:', {
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            errorStack: error instanceof Error ? error.stack : undefined,
            offerData: offerData?.substring(0, 200) + '...'
          });
          onError?.(`Offer 처리 오류: ${error}`);
        }
      };

      addEventListener(WebRTCEvents.NEW_OFFER, handleNewOffer);

      const handleNewIceCandidate = async (candidateData: any) => {
        try {
          console.log('📨 NEW_ICE_CANDIDATE 이벤트 수신:', {
            candidateData: candidateData,
            candidate: candidateData.candidate?.substring(0, 50) + '...',
            sdpMLineIndex: candidateData.sdpMLineIndex,
            sdpMid: candidateData.sdpMid
          });
          
          console.log('🔄 ICE Candidate 추가 중...');
          await peerConnection.addIceCandidate(new RTCIceCandidate(candidateData));
          console.log('✅ ICE Candidate 추가 완료');
        } catch (error) {
          console.error('❌ ICE Candidate 추가 중 오류 발생:', error);
          console.error('❌ 오류 상세:', {
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            candidateData: candidateData
          });
        }
      };

      addEventListener(WebRTCEvents.NEW_ICE_CANDIDATE, handleNewIceCandidate);

      // WebRTC 이벤트 핸들러
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          console.log(`내 ICE Candidate 생성: ${event.candidate.candidate.substring(0, 30)}...`);
          console.log(`ICE Candidate 타입: ${event.candidate.type}`);
          console.log(`ICE Candidate 프로토콜: ${event.candidate.protocol}`);
          
          // 파이썬 코드와 동일하게 candidate.to_dict() 형식으로 전송
          const candidateData = {
            candidate: event.candidate.candidate,
            sdpMLineIndex: event.candidate.sdpMLineIndex,
            sdpMid: event.candidate.sdpMid
          };
          // 인자1, 인자2 형식으로 전송 (배열이 아닌 개별 인자)
          console.log('📤 ICE Candidate 전송 중...', {
            seniorId: seniorId,
            candidateType: event.candidate.type,
            candidateProtocol: event.candidate.protocol,
            candidateData: candidateData
          });
          emit(WebRTCEvents.SEND_ICE_CANDIDATE, seniorId, candidateData);
          console.log('✅ ICE Candidate 전송 완료');
        } else {
          console.log('ICE Candidate 수집 완료');
        }
      };

      peerConnection.ontrack = (event) => {
        console.log(`Track ${event.track.kind} 수신. 영상 출력을 시작합니다.`);
        console.log('📹 Track 이벤트 상세 정보:', {
          kind: event.track.kind,
          id: event.track.id,
          enabled: event.track.enabled,
          muted: event.track.muted,
          readyState: event.track.readyState,
          streams: event.streams.length,
          streamId: event.streams[0]?.id
        });
        
        if (event.track.kind === 'video' && videoRef.current) {
          console.log('🎥 비디오 엘리먼트에 스트림 할당 중...');
          console.log('📺 비디오 엘리먼트 상태:', {
            videoElement: !!videoRef.current,
            videoWidth: videoRef.current.videoWidth,
            videoHeight: videoRef.current.videoHeight,
            readyState: videoRef.current.readyState,
            paused: videoRef.current.paused,
            muted: videoRef.current.muted,
            autoplay: videoRef.current.autoplay
          });
          
          videoRef.current.srcObject = event.streams[0];
          setIsStreaming(true);
          setConnectionStatus('스트리밍 중');
          
          // 즉시 재생 시도
          console.log('🎬 즉시 재생 시도...');
          videoRef.current.play().then(() => {
            console.log('✅ 즉시 재생 성공!');
          }).catch((error) => {
            console.error('❌ 즉시 재생 실패:', error);
            console.log('🔄 사용자 상호작용 후 재시도 예정...');
          });
          
          // 비디오 로드 이벤트 리스너 추가
          videoRef.current.onloadedmetadata = () => {
            console.log('📺 비디오 메타데이터 로드 완료:', {
              videoWidth: videoRef.current?.videoWidth,
              videoHeight: videoRef.current?.videoHeight,
              duration: videoRef.current?.duration
            });
            
            // 비디오 크기 강제 설정
            if (videoRef.current) {
              console.log('🔧 비디오 크기 강제 설정...');
              videoRef.current.style.width = '100%';
              videoRef.current.style.height = '100%';
              videoRef.current.style.objectFit = 'cover';
              videoRef.current.style.backgroundColor = '#000000';
              
              // 비디오 재생 시도
              console.log('🎬 비디오 재생 시도 중...');
              videoRef.current.play().then(() => {
                console.log('✅ 비디오 재생 성공!');
                console.log('📺 재생 후 비디오 상태:', {
                  videoWidth: videoRef.current?.videoWidth,
                  videoHeight: videoRef.current?.videoHeight,
                  readyState: videoRef.current?.readyState,
                  paused: videoRef.current?.paused,
                  muted: videoRef.current?.muted
                });
              }).catch((error) => {
                console.error('❌ 비디오 재생 실패:', error);
              });
            }
          };
          
          videoRef.current.oncanplay = () => {
            console.log('📺 비디오 재생 준비 완료');
            console.log('📺 비디오 엘리먼트 최종 상태:', {
              videoWidth: videoRef.current?.videoWidth,
              videoHeight: videoRef.current?.videoHeight,
              readyState: videoRef.current?.readyState,
              paused: videoRef.current?.paused,
              muted: videoRef.current?.muted,
              autoplay: videoRef.current?.autoplay,
              srcObject: !!videoRef.current?.srcObject
            });
          };
          
          videoRef.current.onplay = () => {
            console.log('📺 비디오 재생 시작');
          };
          
          videoRef.current.onpause = () => {
            console.log('⏸️ 비디오 재생 일시정지');
          };
          
          videoRef.current.onerror = (error) => {
            console.error('📺 비디오 재생 에러:', error);
            console.error('📺 에러 상세:', {
              error: error,
              errorCode: videoRef.current?.error?.code,
              errorMessage: videoRef.current?.error?.message
            });
          };
          
          // 추가: 비디오 엘리먼트가 화면에 보이는지 확인
          setTimeout(() => {
            if (videoRef.current) {
              console.log('🔍 비디오 엘리먼트 최종 체크:', {
                videoWidth: videoRef.current.videoWidth,
                videoHeight: videoRef.current.videoHeight,
                readyState: videoRef.current.readyState,
                paused: videoRef.current.paused,
                muted: videoRef.current.muted,
                autoplay: videoRef.current.autoplay,
                srcObject: !!videoRef.current.srcObject,
                currentTime: videoRef.current.currentTime,
                duration: videoRef.current.duration,
                style: {
                  display: videoRef.current.style.display,
                  visibility: videoRef.current.style.visibility,
                  opacity: videoRef.current.style.opacity,
                  width: videoRef.current.style.width,
                  height: videoRef.current.style.height
                }
              });
            }
          }, 3000);
        }
      };

      peerConnection.onconnectionstatechange = () => {
        console.log(`🔄 PeerConnection 상태 변경: ${peerConnection.connectionState}`);
        console.log('📊 연결 상태 상세:', {
          connectionState: peerConnection.connectionState,
          iceConnectionState: peerConnection.iceConnectionState,
          iceGatheringState: peerConnection.iceGatheringState,
          signalingState: peerConnection.signalingState
        });
        
        setConnectionStatus(`연결 상태: ${peerConnection.connectionState}`);
        
        if (peerConnection.connectionState === 'failed') {
          console.log('❌ PeerConnection 연결 실패. 재시도합니다...');
          setConnectionStatus('연결 실패 - 재시도 중...');
          
          // 5초 후 재연결 시도
          setTimeout(() => {
            console.log('🔄 WebRTC 재연결 시도...');
            cleanup();
            setTimeout(() => {
              initializeWebRTC();
            }, 2000);
          }, 5000);
        } else if (peerConnection.connectionState === 'connected') {
          console.log('✅ WebRTC 연결 성공!');
          setConnectionStatus('연결됨 - 스트리밍 중');
        } else if (peerConnection.connectionState === 'connecting') {
          console.log('🔄 WebRTC 연결 시도 중...');
          setConnectionStatus('연결 시도 중...');
        } else if (peerConnection.connectionState === 'disconnected') {
          console.log('⚠️ WebRTC 연결 끊어짐');
          setConnectionStatus('연결 끊어짐');
        } else if (peerConnection.connectionState === 'closed') {
          console.log('🔒 WebRTC 연결 종료됨');
          setConnectionStatus('연결 종료됨');
        }
      };

      // 연결 타임아웃 설정 (30초)
      // const connectionTimeout = setTimeout(() => {
        // if (peerConnection.connectionState === 'connecting') {
        //   console.log('연결 타임아웃 - 재시도합니다...');
        //   setConnectionStatus('연결 타임아웃 - 재시도 중...');
        //   cleanup();
        //   setTimeout(() => {
        //     initializeWebRTC();
        //   }, 2000);
        // }
      // }, 30000);

      // Offer 확인 요청
      emit(WebRTCEvents.CHECK_OFFER, seniorId);
      console.log(`Senior ID ${seniorId}의 Offer를 서버에 요청합니다...`);

    } catch (error) {
      console.error('WebRTC 초기화 중 오류 발생:', error);
      onError?.(`초기화 오류: ${error}`);
    }
  };

  const cleanup = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    
    setIsStreaming(false);
    setConnectionStatus('연결 해제됨');
  };

  // const handleReconnect = () => {
  //   cleanup();
  //   setTimeout(() => {
  //     initializeWebRTC();
  //   }, 1000);
  // };

  return (
    <div style={{
      width: '100%',
      height: '100%',
      position: 'relative',
      backgroundColor: '#000000',
      borderRadius: '12px',
      overflow: 'hidden'
    }}>
      {/* 비디오 플레이어 */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          width: '100%',
          height: '100%',
          minWidth: '100%',
          minHeight: '100%',
          maxWidth: '100%',
          maxHeight: '100%',
          objectFit: 'cover',
          backgroundColor: '#000000',
          display: 'block',
          position: 'absolute',
          top: '0',
          left: '0',
          zIndex: '1'
        }}
      />

      {/* 테스트 비디오 버튼 */}
      {!isStreaming && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          color: 'white',
          zIndex: 5
        }}>
          <div style={{
            fontSize: '40px',
            marginBottom: '12px',
            opacity: 0.5
          }}>
            📹
          </div>
          <div style={{
            fontSize: '16px',
            fontWeight: '500',
            marginBottom: '6px'
          }}>
            스트리밍 대기 중
          </div>
          <div style={{
            fontSize: '12px',
            opacity: 0.7,
            marginBottom: '16px'
          }}>
            Senior ID: {seniorId}
          </div>
          <button
            onClick={() => setShowTestVideo(true)}
            style={{
              backgroundColor: 'rgba(59, 130, 246, 0.8)',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(37, 99, 235, 0.9)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.8)'}
          >
            테스트 비디오 보기
          </button>
        </div>
      )}

      {/* 테스트 비디오 */}
      {showTestVideo && (
        <div style={{
          position: 'absolute',
          top: '0',
          left: '0',
          width: '100%',
          height: '100%',
          backgroundColor: '#1a1a1a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 15
        }}>
          <div style={{
            textAlign: 'center',
            color: 'white'
          }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '16px'
            }}>
              🎥
            </div>
            <div style={{
              fontSize: '18px',
              fontWeight: '500',
              marginBottom: '8px'
            }}>
              테스트 비디오
            </div>
            <div style={{
              fontSize: '14px',
              opacity: 0.7,
              marginBottom: '16px'
            }}>
              WebRTC 연결 테스트용
            </div>
            <button
              onClick={() => setShowTestVideo(false)}
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.8)',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(220, 38, 38, 0.9)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.8)'}
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {/* 연결 상태 표시 */}
      <div style={{
        position: 'absolute',
        top: '12px',
        right: '12px',
        backgroundColor: isConnected ? 'rgba(34, 197, 94, 0.9)' : 'rgba(239, 68, 68, 0.9)',
        color: 'white',
        padding: '6px 10px',
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: '500',
        zIndex: 10
      }}>
        {isConnected ? '연결됨' : '연결 끊어짐'}
      </div>

      {/* 하단 상태 표시 */}
      <div style={{
        position: 'absolute',
        bottom: '12px',
        left: '12px',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '6px 10px',
        borderRadius: '6px',
        fontSize: '11px',
        fontWeight: '500',
        zIndex: 10,
        maxWidth: 'calc(100% - 24px)'
      }}>
        {connectionStatus}
      </div>
    </div>
  );
};

export default WebRTCViewer;
