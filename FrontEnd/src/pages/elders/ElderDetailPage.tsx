import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getSeniorById } from '../../api/eldersApi'
import type { Senior, SensorStatus } from '../../api/eldersApi'
import { MapPin, Phone, Activity, Home, Lightbulb, User, Zap, Video } from 'lucide-react'
import { useSocket } from '../../contexts/SocketContext'

export default function ElderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const [scrolled, setScrolled] = useState(false)
  const [senior, setSenior] = useState<Senior | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [showGuardianContact, setShowGuardianContact] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [imageLoading, setImageLoading] = useState(false)
  
  // 센서 데이터 상태
  const [sensorData, setSensorData] = useState<Record<string, SensorStatus>>(() => {
    // localStorage에서 센서 데이터 복원
    if (id) {
      const savedData = localStorage.getItem(`sensor_data_${id}`)
      console.log(`📱 ElderDetailPage localStorage 센서 데이터 조회 (senior_id: ${id}):`, savedData)
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData)
          console.log('📱 ElderDetailPage localStorage에서 센서 데이터 복원:', parsed)
          console.log('📱 ElderDetailPage 복원된 센서 키들:', Object.keys(parsed))
          console.log('📱 ElderDetailPage 센서 데이터 개수:', Object.keys(parsed).length)
          return parsed
        } catch (error) {
          console.error('❌ ElderDetailPage 센서 데이터 파싱 실패:', error)
        }
      } else {
        console.log('📱 ElderDetailPage localStorage에 센서 데이터 없음')
      }
    }
    return {}
  })
  
  // Socket Context 사용
  const { socket, isConnected, connectSocket, addEventListener, removeEventListener } = useSocket()
  
  // API Key를 Senior ID로 매핑하는 함수
  const getSeniorIdByApiKey = async (apiKey: string): Promise<number | null> => {
    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        console.error('❌ 인증 토큰이 없습니다.')
        return null
      }

      const response = await fetch(`/api/iot/api-key-to-senior-id/${apiKey}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        console.error(`❌ API Key 매핑 실패: ${response.status}`)
        return null
      }

      const result = await response.json()
      console.log(`✅ API Key ${apiKey} -> Senior ID ${result.senior_id} 매핑 성공`)
      return result.senior_id
    } catch (error) {
      console.error('❌ API Key 매핑 중 오류:', error)
      return null
    }
  }

  // 센서 데이터 처리 함수 (비동기)
  const handleSensorLog = async (data: any) => {
    console.log('🔔 웹소켓 센서 데이터 이벤트 수신:', data)
    console.log('🔍 현재 어르신 ID:', senior?.senior_id)
    console.log('🔍 수신된 데이터 타입:', typeof data)
    console.log('🔍 수신된 데이터 키들:', Object.keys(data || {}))
    console.log('🔍 수신된 데이터 전체:', JSON.stringify(data, null, 2))
    
    // senior_id가 직접 포함된 경우 (server:notify_sensor_status_change 응답)
    if (data.senior_id) {
      console.log(`🔍 직접 포함된 Senior ID: ${data.senior_id}`)
      
      // 현재 어르신의 센서 데이터 처리
      if (senior?.senior_id === data.senior_id) {
        console.log(`✅ ${senior?.senior_id}번 어르신 센서 데이터 처리 시작 (직접 포함된 senior_id)`)
        
        // 단일 센서 데이터 처리
        if (data.sensor_id) {
          const sensorKey = data.sensor_id
          
          setSensorData(prevSensorData => {
            const updatedData = {
              ...prevSensorData,
              [sensorKey]: {
                sensor_id: data.sensor_id,
                sensor_type: data.sensor_type,
                location: data.location,
                status: data.status,
                value: data.value,
                last_updated: data.last_updated,
                event_description: data.event_description || ''
              }
            }
            
            // localStorage에 센서 데이터 저장
            if (id) {
              localStorage.setItem(`sensor_data_${id}`, JSON.stringify(updatedData))
              console.log('💾 센서 데이터 localStorage에 저장 완료')
            }
            
            return updatedData
          })
          
          console.log(`✅ 센서 상태 업데이트 완료: ${sensorKey} -> ${data.status}`)
        } else if (data.sensors && Array.isArray(data.sensors)) {
          // server:send_all_sensor_status 응답 처리
          console.log('📊 sensors 배열 발견 (server:send_all_sensor_status):', data.sensors)
          console.log('📊 sensors 배열 길이:', data.sensors.length)
          
          const sensorMap: Record<string, any> = {}
          data.sensors.forEach((sensor: any, index: number) => {
            console.log(`📊 센서 ${index + 1}:`, sensor)
            const uiKey = sensor.sensor_id || sensor.sensor_type
            sensorMap[uiKey] = {
              sensor_id: sensor.sensor_id || sensor.sensor_type,
              sensor_type: sensor.sensor_type,
              location: sensor.location,
              status: sensor.status,
              value: sensor.value,
              last_updated: sensor.last_updated,
              event_description: sensor.event_description || ''
            }
            console.log(`📊 센서 매핑: ${uiKey} -> ${sensor.status}`)
          })
          
          console.log('📊 최종 센서 맵:', sensorMap)
          
          setSensorData(prevSensorData => {
            const updatedData = { ...prevSensorData, ...sensorMap }
            console.log('📊 업데이트된 센서 데이터:', updatedData)
            
            // localStorage에 센서 데이터 저장
            if (id) {
              localStorage.setItem(`sensor_data_${id}`, JSON.stringify(updatedData))
              console.log('💾 센서 데이터 localStorage에 저장 완료 (server:send_all_sensor_status)')
            }
            return updatedData
          })
          
          console.log(`✅ senior_id ${senior?.senior_id}번 센서 데이터 맵 업데이트 완료:`, sensorMap)
        }
        return
      } else {
        console.log(`❌ 다른 어르신의 센서 데이터는 무시 (현재: ${senior?.senior_id}, 수신된: ${data.senior_id})`)
        return
      }
    }
    
    // api_key를 통한 매핑 (기존 로직)
    const apiKey = data.api_key
    console.log('🔑 API Key:', apiKey)
    
    if (!apiKey) {
      console.log('❌ API Key가 없습니다.')
      return
    }
    
    // API Key로 Senior ID 조회
    const seniorIdFromApiKey = await getSeniorIdByApiKey(apiKey)
    
    if (!seniorIdFromApiKey) {
      console.log(`❌ API Key ${apiKey}에 해당하는 Senior ID를 찾을 수 없습니다.`)
      return
    }
    
    console.log(`🔍 API Key ${apiKey} -> Senior ID ${seniorIdFromApiKey} 매핑 완료`)
    
    // 현재 어르신의 센서 데이터 처리
    if (senior?.senior_id === seniorIdFromApiKey) {
      console.log(`✅ ${senior.senior_id}번 어르신 센서 데이터 처리 시작 (api_key: ${apiKey})`)
      
      // 백엔드 센서 데이터 형식 처리 (FrontendSensorStatusPayload)
      if (data.sensors && Array.isArray(data.sensors)) {
        console.log('📊 sensors 배열 발견:', data.sensors)
        const sensorMap: Record<string, SensorStatus> = {}
        
        data.sensors.forEach((sensor: any, index: number) => {
          console.log(`📡 센서 ${index + 1}:`, sensor)
          
          // 센서 ID를 그대로 UI 키로 사용
          const uiKey = sensor.sensor_id  // "door_bedroom" 형태
          
          sensorMap[uiKey] = {
            sensor_id: sensor.sensor_id,
            sensor_type: sensor.sensor_type,
            location: sensor.location,
            status: sensor.status,  // "active" | "inactive"
            value: sensor.value,
            last_updated: sensor.last_updated,
            event_description: sensor.event_description || ''
          }
          
          console.log(`📊 센서 매핑: ${sensor.sensor_id} -> ${uiKey} (${sensor.status})`)
        })
        
        setSensorData(prevSensorData => {
          const updatedData = { ...prevSensorData, ...sensorMap }
          // localStorage에 센서 데이터 저장
          if (id) {
            localStorage.setItem(`sensor_data_${id}`, JSON.stringify(updatedData))
            console.log('💾 센서 데이터 localStorage에 저장 완료')
          }
          return updatedData
        })
        console.log(`✅ senior_id ${senior.senior_id}번 센서 데이터 맵 업데이트 완료:`, sensorMap)
        console.log(`📊 업데이트된 센서 키들:`, Object.keys(sensorMap))
      } else if (data.sensor_data && Array.isArray(data.sensor_data)) {
        // 기존 sensor_data 형식 처리 (하위 호환성)
        console.log('📊 sensor_data 배열 발견 (기존 형식):', data.sensor_data)
        const sensorMap: Record<string, SensorStatus> = {}
        
        data.sensor_data.forEach((sensor: any, index: number) => {
          console.log(`📡 센서 ${index + 1}:`, sensor)
          
          // 센서 타입을 그대로 UI 키로 사용
          const uiKey = sensor.sensor_type  // "door_entrance", "pir_livingroom" 등
          
          sensorMap[uiKey] = {
            sensor_id: sensor.sensor_type,
            sensor_type: sensor.sensor_type,
            location: getLocationFromSensorType(sensor.sensor_type),
            status: sensor.sensor_value ? 'active' : 'inactive',
            value: sensor.sensor_value,
            last_updated: sensor.timestamp,
            event_description: sensor.event_description || ''
          }
          
          console.log(`📊 센서 매핑: ${sensor.sensor_type} -> ${uiKey} (${sensor.sensor_value ? 'active' : 'inactive'})`)
          console.log(`🔍 센서 데이터 상세:`, {
            sensor_type: sensor.sensor_type,
            sensor_value: sensor.sensor_value,
            timestamp: sensor.timestamp,
            event_description: sensor.event_description
          })
        })
        
        setSensorData(prevSensorData => {
          const updatedData = { ...prevSensorData, ...sensorMap }
          // localStorage에 센서 데이터 저장
          if (id) {
            localStorage.setItem(`sensor_data_${id}`, JSON.stringify(updatedData))
            console.log('💾 센서 데이터 localStorage에 저장 완료')
          }
          return updatedData
        })
        console.log(`✅ senior_id ${senior.senior_id}번 센서 데이터 맵 업데이트 완료:`, sensorMap)
        console.log(`📊 업데이트된 센서 키들:`, Object.keys(sensorMap))
        console.log(`🔍 최종 센서 데이터 상태:`, sensorData)
      } else {
        console.log('⚠️ 알 수 없는 센서 데이터 형식:', data)
      }
    } else {
      console.log(`❌ 다른 어르신의 센서 데이터는 무시 (현재: ${senior?.senior_id}, 수신된: ${seniorIdFromApiKey})`)
    }
  }

  // 센서 타입에서 위치 추출
  const getLocationFromSensorType = (sensorType: string): string => {
    if (sensorType.includes('entrance')) return 'entrance'
    if (sensorType.includes('fridge')) return 'fridge'
    if (sensorType.includes('livingroom')) return 'livingroom'
    if (sensorType.includes('bedroom')) return 'bedroom'
    if (sensorType.includes('bathroom')) return 'bathroom'
    return 'unknown'
  }
  

  // 웹소켓 연결 상태 디버깅 및 연결 시도
  useEffect(() => {
    console.log('🔍 ElderDetailPage 웹소켓 상태:', {
      socket: socket ? '있음' : '없음',
      socketId: socket?.id || '없음',
      isConnected,
      socketConnected: socket?.connected || false,
      seniorId: senior?.senior_id
    })
    
    // 웹소켓이 연결되지 않은 경우 연결 시도
    if (!socket || !socket.connected) {
      const token = localStorage.getItem('access_token')
      if (token) {
        console.log('🔌 ElderDetailPage: 웹소켓 연결 시도')
        connectSocket('https://j13a503.p.ssafy.io', token)
      }
    }
  }, [socket, isConnected, senior?.senior_id, connectSocket])

  // Socket 상태 디버깅
  useEffect(() => {
        console.log('🔍 ElderDetailPage Socket 상태:', { 
          socket: socket ? '있음' : '없음', 
          socketId: socket?.id || '없음',
          isConnected,
          socketConnected: socket?.connected || false
        })
  }, [socket, isConnected])

  // Socket Context 상태 디버깅
  useEffect(() => {
    console.log('🔍 ElderDetailPage Socket Context 상태:', { 
      socketContext: 'SocketContext 사용 중',
      connectSocket: typeof connectSocket,
      addEventListener: typeof addEventListener
    })
  }, [])

  // Socket.IO 연결 및 이벤트 핸들러 (HomePage에서 이미 연결됨)
  useEffect(() => {
    // senior 데이터가 로드되지 않았으면 이벤트 리스너 등록하지 않음
    if (!senior?.senior_id) {
      console.log('⚠️ ElderDetailPage: senior 데이터 로딩 중, 이벤트 리스너 등록 대기')
      return
    }

    // Socket이 연결되어 있는지 확인
    if (socket && socket.connected) {
      console.log('✅ ElderDetailPage: Socket 이미 연결됨:', socket.id);
    } else {
      console.log('⚠️ ElderDetailPage: Socket 연결 대기 중...');
    }

    // Socket 연결 성공 핸들러 (WebRTC와 동일한 방식)
    const handleConnect = () => {
      console.log(`서버에 연결되었습니다. (sid: ${socket?.id || '연결 중'})`);
      console.log('✅ ElderDetailPage: Socket 연결 성공!');
    };

    const handleDisconnect = () => {
      console.log('서버와의 연결이 끊어졌습니다.');
      console.log('❌ ElderDetailPage: Socket 연결 끊김');
    };

    addEventListener('connect', handleConnect);
    addEventListener('disconnect', handleDisconnect);

    // 백엔드 이벤트 수신 핸들러들 - Context를 통해 등록

    // 2. 응급 상황 (HomePage에서 처리하므로 알림 제거)
    const handleEmergencySituation = (data: any) => {
      console.log('응급 상황:', data)
      // HomePage에서 이미 알림을 처리하므로 여기서는 로그만 출력
    }


    // 4. 센서 이벤트 (너무 빈번하므로 알림 제거)
    const handleSensorEvent = (data: any) => {
      console.log('센서 이벤트:', data)
      // 센서 이벤트는 너무 빈번하므로 알림 제거
    }

    // 5. 안전 확인 요청 (너무 빈번하므로 알림 제거)
    const handleSafetyCheckRequest = (data: any) => {
      console.log('안전 확인 요청:', data)
      // 안전 확인 요청은 너무 빈번하므로 알림 제거
    }

    // 6. 어르신 안전 상태 (너무 빈번하므로 알림 제거)
    const handleSeniorSafe = (data: any) => {
      console.log('어르신 안전:', data)
      // 안전 확인 성공은 너무 빈번하므로 알림 제거
    }

    // 7. 안전 확인 실패 (너무 빈번하므로 알림 제거)
    const handleSafetyCheckFailed = (data: any) => {
      console.log('안전 확인 실패:', data)
      // 안전 확인 실패는 너무 빈번하므로 알림 제거
    }

    // 8. 센서 상태 변경 이벤트 처리
    const handleSensorStatusChange = (data: any) => {
      console.log('🔔 센서 상태 변경 이벤트 수신:', data)
      
      // 수신된 데이터의 senior_id와 현재 어르신 ID 비교
      if (senior?.senior_id === data.senior_id) {
        console.log(`✅ ${senior?.senior_id}번 어르신 센서 상태 변경 처리 시작`)
        
        // 단일 센서 데이터 처리
        if (data && data.sensor_id) {
          const sensorKey = data.sensor_id  // "door_fridge"
          
          // 기존 센서 데이터를 보존하면서 새로운 센서만 업데이트
          setSensorData(prevSensorData => {
            console.log('🔍 센서 상태 변경 시점 이전 센서 데이터:', prevSensorData)
            
            const updatedData = {
              ...prevSensorData,
              [sensorKey]: {
                sensor_id: data.sensor_id,
                sensor_type: data.sensor_type,
                location: data.location,
                status: data.status,  // "active" | "inactive"
                value: data.value,
                last_updated: data.last_updated,
                event_description: data.event_description || ''
              }
            }
            
            console.log('🔍 센서 상태 변경 후 업데이트된 데이터:', updatedData)
            
            // localStorage에 센서 데이터 저장
            if (id) {
              localStorage.setItem(`sensor_data_${id}`, JSON.stringify(updatedData))
              console.log('💾 센서 상태 변경 localStorage에 저장 완료')
            }
            
            return updatedData
          })
          
          console.log(`✅ 센서 상태 업데이트 완료: ${sensorKey} -> ${data.status}`)
        }
      } else {
        console.log(`❌ 다른 어르신의 센서 상태 변경은 무시 (현재: ${senior?.senior_id}, 수신된: ${data.senior_id})`)
      }
    }

    // 이벤트 리스너 등록 (상태 변경은 HomePage에서 처리하므로 제거)
    console.log('🔔 ElderDetailPage: 이벤트 리스너 등록 시작', {
      socket: socket ? '있음' : '없음',
      socketId: socket?.id || '없음',
      isConnected,
      seniorId: senior?.senior_id
    });
    
           // 웹소켓이 연결되면 이벤트 리스너 등록
           if (socket && socket.connected) {
             // 모든 웹소켓 이벤트 수신 (디버깅용)
             socket.onAny((eventName, ...args) => {
               console.log('🔍 수신된 웹소켓 이벤트:', eventName, args)
               if (eventName.includes('sensor')) {
                 console.log('📡 센서 관련 이벤트 수신:', eventName, args)
               }
             })
             
             addEventListener('server:send_sensor_log', handleSensorLog)
             addEventListener('server:emergency_situation', handleEmergencySituation)
             // addEventListener('server:notify_senior_status_change', handleStatusChange) // HomePage에서 처리
             addEventListener('server:notify_sensor_event', handleSensorEvent)
             addEventListener('server:notify_sensor_status_change', handleSensorStatusChange)
             addEventListener('server:request_safety_check', handleSafetyCheckRequest)
             addEventListener('server:senior_is_safe', handleSeniorSafe)
             addEventListener('server:safety_check_failed', handleSafetyCheckFailed)
             
             // client:request_all_sensor_status 응답 이벤트 리스너 추가
             addEventListener('server:send_all_sensor_status', handleSensorLog)
             console.log('🔔 ElderDetailPage: 이벤트 리스너 등록 완료');
           } else {
      console.log('⚠️ ElderDetailPage: 웹소켓이 연결되지 않아 이벤트 리스너 등록 안함');
      // 웹소켓 연결 대기 중이면 잠시 후 다시 시도
      const timer = setTimeout(() => {
        if (socket && socket.connected) {
          console.log('🔄 ElderDetailPage: 웹소켓 연결 후 이벤트 리스너 재등록 시도');
          addEventListener('server:send_sensor_log', handleSensorLog)
          addEventListener('server:emergency_situation', handleEmergencySituation)
          addEventListener('server:notify_sensor_event', handleSensorEvent)
          addEventListener('server:notify_sensor_status_change', handleSensorStatusChange)
          addEventListener('server:request_safety_check', handleSafetyCheckRequest)
          addEventListener('server:senior_is_safe', handleSeniorSafe)
          addEventListener('server:safety_check_failed', handleSafetyCheckFailed)
          addEventListener('server:send_all_sensor_status', handleSensorLog)
        }
      }, 1000)
      
      return () => clearTimeout(timer)
    }

    return () => {
      // 이벤트 리스너 제거 (WebRTC와 동일한 방식)
      removeEventListener('connect', handleConnect)
      removeEventListener('disconnect', handleDisconnect)
      removeEventListener('server:send_sensor_log', handleSensorLog)
      removeEventListener('server:emergency_situation', handleEmergencySituation)
      // removeEventListener('server:notify_senior_status_change', handleStatusChange) // HomePage에서 처리
      removeEventListener('server:notify_sensor_event', handleSensorEvent)
      removeEventListener('server:notify_sensor_status_change', handleSensorStatusChange)
      removeEventListener('server:request_safety_check', handleSafetyCheckRequest)
      removeEventListener('server:senior_is_safe', handleSeniorSafe)
      removeEventListener('server:safety_check_failed', handleSafetyCheckFailed)
      removeEventListener('server:send_all_sensor_status', handleSensorLog)
    }
  }, [addEventListener, removeEventListener, senior]) // senior 데이터가 로드된 후에 이벤트 리스너 등록

  // 페이지 진입 시 센서 데이터 요청 (항상 최신 데이터 요청)
  useEffect(() => {
    if (senior?.senior_id && socket && socket.connected) {
      console.log(`📡 페이지 진입 시 센서 데이터 요청: senior_id ${senior.senior_id}`)
      console.log(`🔍 현재 센서 데이터 상태:`, sensorData)
      
      // 항상 최신 센서 데이터 요청
      console.log(`📡 최신 센서 데이터 요청: senior_id ${senior.senior_id}`)
      socket.emit('client:request_all_sensor_status', {
        senior_id: senior.senior_id
      })
      
      // 3초 후에도 응답이 없으면 다시 요청
      const retryTimer = setTimeout(() => {
        console.log(`🔄 센서 데이터 재요청: senior_id ${senior.senior_id}`)
        socket.emit('client:request_all_sensor_status', {
          senior_id: senior.senior_id
        })
      }, 3000)
      
      return () => clearTimeout(retryTimer)
    }
  }, [senior?.senior_id, socket])

  // 생년월일로부터 만 나이 계산
  const calculateAge = (birthDate: string): string => {
    if (!birthDate) return '정보 없음'
    
    const today = new Date()
    const birth = new Date(birthDate)
    
    // 생년월일이 유효하지 않은 경우
    if (isNaN(birth.getTime())) return '정보 없음'
    
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    
    // 아직 생일이 지나지 않은 경우 1살 빼기
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    
    return `만 ${age}세`
  }

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const onScroll = () => {
      setScrolled(el.scrollTop > 120)
    }
    el.addEventListener('scroll', onScroll)
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const fetchSenior = async () => {
      if (!id) return
      
      try {
        setLoading(true)
        setError(null)
        const seniorId = parseInt(id)
        const data = await getSeniorById(seniorId)
        console.log('🔍 어르신 상세 데이터:', data)
        console.log('🔍 health_info 값:', data.health_info)
        console.log('🔍 health_info 타입:', typeof data.health_info)
        setSenior(data)
      } catch (err) {
        setError('어르신 정보를 불러오는데 실패했습니다.')
        console.error('Error fetching senior:', err)
      } finally {
        setLoading(false)
      }
    }
    
    fetchSenior()
  }, [id])

  // 인증된 이미지 로드
  useEffect(() => {
    if (senior?.senior_id) {
      console.log('🖼️ 상세페이지 이미지 로드 시작 - senior_id:', senior.senior_id)
      setImageLoading(true)
      const token = localStorage.getItem('access_token')
      
      // 프록시를 통한 이미지 API 호출
      const imageApiUrl = `/api/seniors/${senior.senior_id}/profile-image`
      console.log('🖼️ 상세페이지 이미지 API URL:', imageApiUrl)
      console.log('🖼️ 상세페이지 토큰 존재:', !!token)
      
      fetch(imageApiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(response => {
        console.log('🖼️ 상세페이지 이미지 응답 상태:', response.status, response.statusText)
        if (response.ok) {
          return response.blob()
        }
        throw new Error(`Image load failed: ${response.status}`)
      })
      .then(blob => {
        console.log('🖼️ 상세페이지 이미지 blob 크기:', blob.size)
        const url = URL.createObjectURL(blob)
        setImageUrl(url)
        setImageLoading(false)
        console.log('🖼️ 상세페이지 이미지 로드 성공!')
      })
      .catch(error => {
        console.log('❌ 상세페이지 인증된 이미지 로드 실패:', error)
        setImageUrl(null)
        setImageLoading(false)
      })
    } else {
      console.log('🖼️ 상세페이지 senior_id가 없어서 이미지 로드 안함')
    }
  }, [senior?.senior_id])

  // 센서 데이터는 웹소켓 이벤트를 통해서만 수신됩니다
  // localStorage에서 이미 복원되므로 추가 초기화 불필요


  // 가장 최근 센서 활동 정보 가져오기 함수
  const getLatestSensorActivity = (): { hasActivity: boolean; lastActivityTime: string; status: 'red' | 'yellow' | 'green' } => {
    const sensorEntries = Object.entries(sensorData)
    
    if (sensorEntries.length === 0) {
      return {
        hasActivity: false,
        lastActivityTime: '활동 없음',
        status: 'red'
      }
    }
    
    // 모든 센서 중에서 가장 최근 활동 찾기
    let latestSensor = null
    let latestTime = new Date(0) // 1970년 1월 1일
    
    sensorEntries.forEach(([, sensor]) => {
      if (sensor && sensor.last_updated) {
        const sensorTime = new Date(sensor.last_updated)
        if (sensorTime > latestTime) {
          latestTime = sensorTime
          latestSensor = sensor
        }
      }
    })
    
    if (!latestSensor) {
      return {
        hasActivity: false,
        lastActivityTime: '활동 없음',
        status: 'red'
      }
    }
    
    // 현재 시간과의 차이 계산
    const now = new Date()
    const diffMs = now.getTime() - latestTime.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMinutes / 60)
    
    let timeText = ''
    if (diffMinutes < 1) {
      timeText = '방금 전'
    } else if (diffMinutes < 60) {
      timeText = `${diffMinutes}분 전`
    } else if (diffHours < 24) {
      timeText = `${diffHours}시간 전`
    } else {
      const diffDays = Math.floor(diffHours / 24)
      timeText = `${diffDays}일 전`
    }
    
    // 상태 결정 (최근 활동 기준)
    let status: 'red' | 'yellow' | 'green' = 'green'
    if (diffMinutes > 60) {
      status = 'red'
    } else if (diffMinutes > 30) {
      status = 'yellow'
    }
    
    return {
      hasActivity: true,
      lastActivityTime: timeText,
      status
    }
  }

  // 센서 상태 가져오기 함수
  const getSensorStatus = (sensorType: string, location: string): { status: 'red' | 'yellow' | 'green'; time: string; description?: string } => {
    const sensorKey = `${sensorType}_${location}`
    const sensor = sensorData[sensorKey]
    
    console.log(`🔍 getSensorStatus 호출: ${sensorType}_${location}`, {
      sensorKey,
      sensor,
      sensorDataKeys: Object.keys(sensorData),
      sensorData
    })
    
    if (sensor) {
      const result = {
        status: (sensor.status === 'active' ? 'green' : 'red') as 'red' | 'yellow' | 'green',
        time: new Date(sensor.last_updated).toLocaleTimeString('ko-KR', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        description: sensor.event_description
      }
      console.log(`✅ 센서 데이터 발견: ${sensorKey}`, result)
      return result
    }
    
    // 기본값 (센서 데이터가 없을 때)
    console.log(`❌ 센서 데이터 없음: ${sensorKey}, 기본값 반환`)
    return {
      status: 'red',
      time: '활동 없음'
    }
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-orange-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600">어르신 정보를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-orange-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            다시 시도
          </button>
        </div>
      </div>
    )
  }

  if (!senior) {
    return (
      <div className="h-full flex items-center justify-center bg-orange-50">
        <p className="text-gray-600">어르신 정보를 찾을 수 없습니다.</p>
      </div>
    )
  }

  return (
    <div ref={scrollRef} className="h-full overflow-y-auto bg-gray-200">
      {/* 히어로 영역 */}
      <section className="relative px-6 pt-6 pb-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-start gap-6">
            <div className="relative">
              <div className="w-28 h-28 rounded-full flex items-center justify-center overflow-hidden">
                {imageLoading ? (
                  <div className="w-16 h-16 flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : imageUrl ? (
                  <img 
                    src={imageUrl} 
                    alt={senior.full_name}
                    className="w-full h-full object-cover"
                    onError={() => {
                      console.log('❌ 이미지 표시 실패:', imageUrl)
                      setImageUrl(null)
                    }}
                  />
                ) : (
                  <User className="w-16 h-16 text-gray-400" />
                )}
              </div>
            </div>
            <div className="flex-1 pt-2">
              <div className="text-lg font-bold text-gray-800 mb-2">{senior.full_name}</div>
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <User className="w-4 h-4" />
                <span className="text-sm">{calculateAge(senior.birth_date)}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">{senior.address}</span>
          </div>
              <button 
                onClick={() => setShowDetails(!showDetails)}
                className="px-5 py-1.5 rounded-full transition-colors whitespace-nowrap"
                style={{ 
                  backgroundColor: '#4B5563', 
                  color: '#FFFFFF',
                  fontSize: '12px',
                  fontWeight: '600'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#374151'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4B5563'}
              >
                {showDetails ? '닫기' : '자세히 보기'}
              </button>
          </div>
          </div>
          
          {/* 특이사항 표시 */}
          {showDetails && (
            <div className="mt-3 px-4 py-3 bg-gray-200 rounded-xl">
              <h3 className="text-sm font-semibold text-gray-800 mb-2">특이사항</h3>
              <p className="text-sm text-gray-700">
                {(() => {
                  let healthInfo = senior.health_info
                  
                  // 배열인 경우 처리
                  if (Array.isArray(healthInfo)) {
                    healthInfo = healthInfo.join(', ')
                  }
                  
                  // 문자열인 경우 JSON 파싱 시도 (서버에서 "["안전"]" 형태로 올 수 있음)
                  if (typeof healthInfo === 'string' && healthInfo.startsWith('[') && healthInfo.endsWith(']')) {
                    try {
                      const parsed = JSON.parse(healthInfo)
                      if (Array.isArray(parsed)) {
                        healthInfo = parsed.join(', ')
                      }
                    } catch (e) {
                      // 파싱 실패 시 원본 문자열 사용
                    }
                  }
                  
                  // 빈 값이거나 "안전"만 있는 경우 처리
                  if (!healthInfo || healthInfo.trim() === '' || healthInfo === '안전' || healthInfo === '["안전"]') {
                    return '등록된 특이사항이 없습니다.'
                  }
                  
                  return healthInfo
                })()}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* 콘텐츠 카드 컨테이너 - 스크롤 시 확장 연출 */}
      <div className={`relative transition-all duration-300 ease-out ${scrolled ? 'mt-0 rounded-[40px]' : 'mt-2'} `}>
        <div className={`bg-white border border-gray-100 ${scrolled ? 'rounded-2xl pt-4' : 'rounded-2xl pt-4'} `}>
          {/* 상단 액션/배너 영역 */}
          <div className="px-6 pb-6 space-y-4">
            {/* 상태 알림 배너 */}
            {(() => {
              const latestActivity = getLatestSensorActivity()
              const bgColor = latestActivity.status === 'red' ? 'bg-red-50 border-red-200' : 
                             latestActivity.status === 'yellow' ? 'bg-yellow-50 border-yellow-200' : 
                             'bg-green-50 border-green-200'
              const iconBgColor = latestActivity.status === 'red' ? 'bg-red-100' : 
                                 latestActivity.status === 'yellow' ? 'bg-yellow-100' : 
                                 'bg-green-100'
              const iconColor = latestActivity.status === 'red' ? 'text-red-600' : 
                               latestActivity.status === 'yellow' ? 'text-yellow-600' : 
                               'text-green-600'
              const titleColor = latestActivity.status === 'red' ? 'text-red-800' : 
                                latestActivity.status === 'yellow' ? 'text-yellow-800' : 
                                'text-green-800'
              const timeColor = latestActivity.status === 'red' ? 'text-red-600' : 
                               latestActivity.status === 'yellow' ? 'text-yellow-600' : 
                               'text-green-600'
              const titleText = latestActivity.hasActivity ? '활동 감지됨' : '활동 감지 없음'
              
              return (
                <div className={`rounded-xl ${bgColor} px-4 py-3 flex items-center gap-3`}>
                  <div className={`w-8 h-8 ${iconBgColor} rounded-full flex items-center justify-center`}>
                    <Activity className={`w-4 h-4 ${iconColor}`} />
                  </div>
                  <div>
                    <div className={`text-sm font-semibold ${titleColor}`}>{titleText}</div>
                    <div className={`${timeColor} text-xs`}>마지막 활동: {latestActivity.lastActivityTime}</div>
                  </div>
                </div>
              )
            })()}

            {/* 액션 카드 2열 */}
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => navigate(`/webrtc/${id}`)}
                className="rounded-lg text-gray-600 px-3 py-2 border border-gray-200 flex items-center justify-center gap-2 transition-colors shadow-sm hover:shadow-md"
                style={{ backgroundColor: '#ffffff' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
              >
                <Video className="w-4 h-4" />
                <span className="text-sm font-medium">실시간 영상</span>
              </button>
              
              {/* 보호자 연락 버튼 */}
              <button
                onClick={() => setShowGuardianContact(true)}
                className="rounded-lg text-gray-600 px-3 py-2 border border-gray-200 flex items-center justify-center gap-2 transition-colors shadow-sm hover:shadow-md"
                style={{ backgroundColor: '#ffffff' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
              >
                <Phone className="w-4 h-4" />
                <span className="text-sm font-medium">보호자 연락</span>
              </button>
              
            </div>
          </div>
          {/* 구분선 */}
          <div className="mx-6 border-t border-gray-200" />

          {/* 섹션 타이틀 - 문 */}
          <div className="px-6 pt-4 pb-3">
            <div className="flex items-center gap-2">
              <Home className="w-4 h-4 text-gray-600" />
              <h2 className="text-base font-semibold text-gray-800">문</h2>
            </div>
          </div>

          {/* 카드 그리드 - 문 */}
          <div className="grid grid-cols-2 gap-4 px-6 pb-6">
            <RoomCard 
              name="안방" 
              time={getSensorStatus('door', 'bedroom').time} 
              status={getSensorStatus('door', 'bedroom').status} 
            />
            <RoomCard 
              name="화장실" 
              time={getSensorStatus('door', 'bathroom').time} 
              status={getSensorStatus('door', 'bathroom').status} 
            />
            <RoomCard 
              name="현관문" 
              time={getSensorStatus('door', 'entrance').time} 
              status={getSensorStatus('door', 'entrance').status} 
            />
            <RoomCard 
              name="냉장고" 
              time={getSensorStatus('door', 'fridge').time} 
              status={getSensorStatus('door', 'fridge').status} 
            />
          </div>

          {/* 구분선 */}
          <div className="mx-6 border-t border-gray-200" />

          {/* 섹션 타이틀 - 움직임 */}
          <div className="px-6 pt-4 pb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-gray-600" />
              <h2 className="text-base font-semibold text-gray-800">움직임</h2>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 px-6 pb-6">
            <SmallRoomCard 
              name="안방" 
              time={getSensorStatus('pir', 'bedroom').time} 
              status={getSensorStatus('pir', 'bedroom').status} 
            />
            <SmallRoomCard 
              name="거실" 
              time={getSensorStatus('pir', 'livingroom').time} 
              status={getSensorStatus('pir', 'livingroom').status} 
            />
            <SmallRoomCard 
              name="화장실" 
              time={getSensorStatus('pir', 'bathroom').time} 
              status={getSensorStatus('pir', 'bathroom').status} 
            />
          </div>

          {/* 구분선 */}
          <div className="mx-6 border-t border-gray-200" />

          {/* 섹션 타이틀 - 조명 */}
          <div className="px-6 pt-4 pb-3">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-gray-600" />
              <h2 className="text-base font-semibold text-gray-800">조명</h2>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 px-6 pb-6">
            <SmallRoomCard 
              name="안방" 
              time={getSensorStatus('light', 'bedroom').time} 
              status={getSensorStatus('light', 'bedroom').status} 
            />
            <SmallRoomCard 
              name="거실" 
              time={getSensorStatus('light', 'livingroom').time} 
              status={getSensorStatus('light', 'livingroom').status} 
            />
            <SmallRoomCard 
              name="화장실" 
              time={getSensorStatus('light', 'bathroom').time} 
              status={getSensorStatus('light', 'bathroom').status} 
            />
          </div>

          {/* 구분선 */}
          <div className="mx-6 border-t border-gray-200" />

          {/* 섹션 타이틀 - 기타 센서 */}
          <div className="px-6 pt-4 pb-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-gray-600" />
              <h2 className="text-base font-semibold text-gray-800">기타</h2>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 px-6 pb-8">
            <SmallRoomCard 
              name="TV" 
              time={getSensorStatus('tv', 'livingroom').time} 
              status={getSensorStatus('tv', 'livingroom').status} 
            />
          </div>
        </div>
        <div className="h-6" />
      </div>

      {/* 보호자 연락처 팝업 */}
      {showGuardianContact && senior && (
        <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 mx-4 max-w-sm w-full shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">보호자 연락처</h2>
              <p className="text-gray-600 mb-6">{senior.full_name}님의 보호자</p>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-center gap-2">
                  <Phone className="w-5 h-5 text-gray-600" />
                  <span className="text-lg font-semibold text-gray-800">
                    {senior.guardian_contact || '연락처 없음'}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowGuardianContact(false)}
                  className="flex-1 py-3 px-4 rounded-lg border border-gray-300 text-gray-700 font-semibold transition-colors hover:bg-gray-50"
                >
                  닫기
                </button>
                {senior.guardian_contact ? (
                  <button
                    onClick={async () => {
                      const phoneNumber = senior.guardian_contact!
                      try {
                        await navigator.clipboard.writeText(phoneNumber)
                      } catch (err) {
                        // 클립보드 API가 지원되지 않는 경우 대체 방법
                        const textArea = document.createElement('textarea')
                        textArea.value = phoneNumber
                        document.body.appendChild(textArea)
                        textArea.select()
                        document.execCommand('copy')
                        document.body.removeChild(textArea)
                      }
                      setShowGuardianContact(false)
                    }}
                    className="flex-1 py-3 px-4 rounded-lg text-white font-semibold transition-colors"
                    style={{ backgroundColor: '#0088FF' }}
                  >
                    복사하기
                  </button>
                ) : (
                  <button
                    disabled
                    className="flex-1 py-3 px-4 rounded-lg text-gray-400 font-semibold bg-gray-200 cursor-not-allowed"
                  >
                    복사하기
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatusDot({ color }: { color: 'red' | 'yellow' | 'green' }) {
  const colorClass =
    color === 'red' ? 'bg-red-500 shadow-[0_0_5px_0_rgba(239,68,68,0.5)]' : color === 'yellow'
    ? 'bg-yellow-500 shadow-[0_0_5px_0_rgba(234,179,8,0.5)]'
    : 'bg-green-500 shadow-[0_0_5px_0_rgba(34,197,94,0.5)]'
  return <span className={`w-3 h-3 shrink-0 aspect-square rounded-full ${colorClass}`} />
}

function RoomCard({ name, time, status }: { name: string; time: string; status: 'red' | 'yellow' | 'green' }) {
  return (
    <div className="relative rounded-lg bg-white border border-gray-200 px-3 py-3 transition-all duration-200">
      <div className="flex items-center justify-center mb-2">
        <div className="flex items-center gap-2">
          <span className="text-base font-medium text-gray-800 whitespace-nowrap">{name}</span>
        <StatusDot color={status} />
      </div>
      </div>
      <div className="text-xs text-gray-500 text-center">{time}</div>
    </div>
  )
}

function SmallRoomCard({ name, time, status }: { name: string; time: string; status: 'red' | 'yellow' | 'green' }) {
  return (
    <div className="relative rounded-lg bg-white border border-gray-200 px-3 py-3 transition-all duration-200">
      <div className="flex items-center justify-center mb-2">
        <div className="flex items-center gap-2">
          <span className="text-base font-medium text-gray-800 whitespace-nowrap">{name}</span>
        <StatusDot color={status} />
      </div>
      </div>
      <div className="text-xs text-gray-500 text-center">{time}</div>
    </div>
  )
}


