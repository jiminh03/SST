import { useMemo, useState, useEffect, useRef } from 'react'
import ElderCard from '../../components/elder/ElderCard'
import FilterBar, { type FilterValue } from '../../components/layout/FilterBar'
import { getSeniors, getSeniorById, type Senior } from '../../api/eldersApi'
import { useSocket } from '../../contexts/SocketContext'

// Senior 타입에 status 속성을 추가해야 합니다. (eldersApi.ts 파일 등에서 수정)
// export interface Senior {
//   // ... 기존 속성들
//   status?: '위험' | '주의' | '안전';
// }

export default function HomePage() {
  const [filter, setFilter] = useState<FilterValue>('전체')
  const [seniors, setSeniors] = useState<Senior[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // seniors 배열을 ref로 관리하여 이벤트 핸들러에서 최신 상태 참조
  const seniorsRef = useRef<Senior[]>([])
  
  // seniors 상태가 변경될 때마다 ref 업데이트
  useEffect(() => {
    seniorsRef.current = seniors
  }, [seniors])

  // Socket Context에서 이벤트 리스너 함수들 가져오기
  const { socket, isConnected, connectSocket, addEventListener, removeEventListener } = useSocket()
  
  // 웹소켓 연결 상태 디버깅
  useEffect(() => {
    console.log('🔍 HomePage 웹소켓 상태:', {
      socket: socket ? '있음' : '없음',
      socketId: socket?.id || '없음',
      isConnected,
      socketConnected: socket?.connected || false
    })
  }, [socket, isConnected])

  // Socket 연결 (앱 시작 시점) - 기존과 동일
  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) {
      console.log('🏠 HomePage: Socket 연결 시작')
      connectSocket('https://j13a503.p.ssafy.io', token)
    }
  }, [connectSocket])

  // 홈 화면 진입 시 전체 어르신 센서 상태 조회
  useEffect(() => {
    // socket이 연결되고, seniors 데이터가 있을 때만 아래 로직을 실행합니다.
    if (socket && socket.connected && seniors.length > 0) {

      // 1. 전체 어르신의 상태를 한 번에 요청
      console.log('📡 홈 화면 진입 시 전체 어르신 상태 요청');
      socket.emit('client:request_all_senior_status');

      // 2. 각 어르신의 센서 상태를 개별적으로 요청
      console.log('📡 홈 화면 진입 시 어르신별 센서 상태 요청');
      seniors.forEach(senior => { // 변수명을 element보다 senior로 하면 더 명확합니다.
        socket.emit('client:request_all_sensor_status', senior.senior_id);
      });
      
    }
  }, [socket, socket?.connected]); // 의존성 배열은 그대로 유지

  // WebSocket 이벤트 리스너 등록하여 상태를 실시간으로 업데이트
  useEffect(() => {
    // 센서 데이터 수신 핸들러
    const handleSensorData = (data: any) => {
      console.log('🏠 홈 화면 센서 데이터 수신:', data)
      console.log('🏠 수신된 데이터 타입:', typeof data)
      console.log('🏠 수신된 데이터 키들:', Object.keys(data || {}))
      
      // 포스트맨 요청으로 받은 센서 데이터 처리 (api_key 포함)
      if (data.api_key && data.sensor_data && Array.isArray(data.sensor_data)) {
        console.log('🏠 포스트맨 요청 센서 데이터 처리:', data.sensor_data)
        console.log('🏠 API Key:', data.api_key)
        console.log('🏠 센서 데이터 개수:', data.sensor_data.length)
        
        // API Key로 Senior ID 매핑 (임시로 17번 고정 - 실제로는 API 호출 필요)
        const seniorId = 17 // 포스트맨 테스트용
        console.log('🏠 매핑된 Senior ID:', seniorId)
        
        const sensorMap: Record<string, any> = {}
        data.sensor_data.forEach((sensor: any) => {
          const sensorKey = sensor.sensor_type // "door_entrance", "pir_livingroom" 등
          sensorMap[sensorKey] = {
            sensor_id: sensor.sensor_type,
            sensor_type: sensor.sensor_type.split('_')[0], // "door", "pir" 등
            location: sensor.sensor_type.split('_')[1], // "entrance", "livingroom" 등
            status: sensor.sensor_value ? 'active' : 'inactive',
            value: sensor.sensor_value,
            last_updated: sensor.timestamp,
            event_description: sensor.event_description || ''
          }
        })
        
        // localStorage에 센서 데이터 저장
        localStorage.setItem(`sensor_data_${seniorId}`, JSON.stringify(sensorMap))
        console.log(`🏠 포스트맨 센서 데이터 localStorage 저장 완료: senior_id ${seniorId}`)
        console.log('🏠 저장된 센서 맵:', sensorMap)
        
        // localStorage에서 저장된 데이터 확인
        const savedData = localStorage.getItem(`sensor_data_${seniorId}`)
        console.log('🏠 localStorage에서 확인한 데이터:', savedData)
      }
      // 웹소켓으로 받은 센서 데이터 처리 (senior_id 포함)
      else if (data.senior_id && data.sensors && Array.isArray(data.sensors)) {
        console.log(`🏠 ${data.senior_id}번 어르신 센서 데이터 처리`)
        
        const sensorMap: Record<string, any> = {}
        data.sensors.forEach((sensor: any) => {
          const sensorKey = sensor.sensor_id
          sensorMap[sensorKey] = {
            sensor_id: sensor.sensor_id,
            sensor_type: sensor.sensor_type,
            location: sensor.location,
            status: sensor.status,
            value: sensor.value,
            last_updated: sensor.last_updated,
            event_description: sensor.event_description || ''
          }
        })
        
        // localStorage에 센서 데이터 저장
        localStorage.setItem(`sensor_data_${data.senior_id}`, JSON.stringify(sensorMap))
        console.log(`🏠 웹소켓 센서 데이터 localStorage 저장 완료: senior_id ${data.senior_id}`)
      }
      // 단일 센서 상태 변경 처리
      else if (data.senior_id && data.sensor_id) {
        console.log(`🏠 ${data.senior_id}번 어르신 단일 센서 상태 변경: ${data.sensor_id}`)
        
        // 기존 센서 데이터 로드
        const existingData = localStorage.getItem(`sensor_data_${data.senior_id}`)
        const sensorMap = existingData ? JSON.parse(existingData) : {}
        
        // 새로운 센서 데이터 업데이트
        sensorMap[data.sensor_id] = {
          sensor_id: data.sensor_id,
          sensor_type: data.sensor_type,
          location: data.location,
          status: data.status,
          value: data.value,
          last_updated: data.last_updated,
          event_description: data.event_description || ''
        }
        
        // localStorage에 업데이트된 센서 데이터 저장
        localStorage.setItem(`sensor_data_${data.senior_id}`, JSON.stringify(sensorMap))
        console.log(`🏠 단일 센서 상태 변경 localStorage 저장 완료: senior_id ${data.senior_id}`)
      }
      else {
        console.log('🏠 알 수 없는 센서 데이터 형식:', data)
      }
    }

    const handleStatusChange = (data: { senior_id: number; status: '위험' | '주의' | '안전' }) => {
      console.log(`⚡️ 홈 화면 상태 변경 이벤트 수신: 어르신 ID ${data.senior_id} -> ${data.status}`);
      
      // 로컬 스토리지에 실시간 상태 저장
      const statusKey = `senior_status_${data.senior_id}`;
      localStorage.setItem(statusKey, data.status);
      
      setSeniors(prevSeniors => {
        const updatedSeniors = prevSeniors.map(senior =>
          senior.senior_id === data.senior_id
            ? { ...senior, status: data.status } // 해당 어르신의 status만 변경
            : senior
        )
        
        // 상태 변경 알림 (seniorId로 어르신 정보 가져오기)
        console.log('상태 변경 이벤트:', data)
        console.log('현재 seniors 배열:', seniorsRef.current)
        const changedSenior = seniorsRef.current.find(senior => senior.senior_id === data.senior_id);
        console.log('찾은 어르신:', changedSenior)
        
        // seniors 배열에서 찾지 못했으면 API로 가져오기
        if (!changedSenior) {
          console.log('API로 어르신 정보 가져오기 시도:', data.senior_id)
          getSeniorById(data.senior_id)
            .then(seniorData => {
              console.log('API 응답:', seniorData)
              if (seniorData?.full_name) {
                // 상태에 따른 텍스트 조정
                const statusText = data.status === '주의' ? '주의로' : `${data.status}으로`;
                
                const event = new CustomEvent('showNotification', {
                  detail: {
                    type: 'warning',
                    title: '상태 변경',
                    message: `${seniorData.full_name}님의 상태가 ${statusText} 변경되었습니다.`,
                    seniorId: data.senior_id
                  }
                })
                window.dispatchEvent(event)
              }
            })
            .catch(error => {
              console.error('어르신 정보 가져오기 실패:', error)
            })
        } else if (changedSenior.full_name) {
          // seniors 배열에서 찾았으면 바로 알림
          console.log('seniors 배열에서 찾은 어르신 이름:', changedSenior.full_name)
          const statusText = data.status === '주의' ? '주의로' : `${data.status}으로`;
          
          const event = new CustomEvent('showNotification', {
            detail: {
              type: 'warning',
              title: '상태 변경',
              message: `${changedSenior.full_name}님의 상태가 ${statusText} 변경되었습니다.`,
              seniorId: data.senior_id
            }
          })
          window.dispatchEvent(event)
        }
        
        return updatedSeniors;
      })
    }

    // 응급 상황 핸들러
    const handleEmergencySituation = (data: any) => {
      console.log('응급 상황:', data)
      console.log('현재 seniors 배열:', seniorsRef.current)
      
      // 어르신 이름 찾기
      const targetSenior = seniorsRef.current.find(senior => senior.senior_id === data.senior_id);
      console.log('찾은 어르신:', targetSenior)
      
      // seniors 배열에서 찾지 못했으면 API로 가져오기
      if (!targetSenior) {
        console.log('API로 어르신 정보 가져오기 시도:', data.senior_id)
        getSeniorById(data.senior_id)
          .then(seniorData => {
            console.log('API 응답:', seniorData)
            if (seniorData?.full_name) {
              const event = new CustomEvent('showNotification', {
                detail: {
                  type: 'error',
                  title: '🚨 응급 상황',
                  message: `${seniorData.full_name}에게 ${data.emergency_type} 상황이 발생했습니다!`,
                  seniorId: data.senior_id
                }
              })
              window.dispatchEvent(event)
            }
          })
          .catch(error => {
            console.error('어르신 정보 가져오기 실패:', error)
          })
      } else if (targetSenior.full_name) {
        // seniors 배열에서 찾았으면 바로 알림
        console.log('seniors 배열에서 찾은 어르신 이름:', targetSenior.full_name)
        const event = new CustomEvent('showNotification', {
          detail: {
            type: 'error',
            title: '🚨 응급 상황',
            message: `${targetSenior.full_name}에게 ${data.emergency_type} 상황이 발생했습니다!`,
            seniorId: data.senior_id
          }
        })
        window.dispatchEvent(event)
      }
    }

    // 이벤트 리스너 등록
    addEventListener('server:notify_senior_status_change', handleStatusChange)
    addEventListener('server:emergency_situation', handleEmergencySituation)
    addEventListener('server:notify_sensor_status_change', handleSensorData)
    addEventListener('server:send_sensor_log', handleSensorData) // 포스트맨 요청 처리용
    addEventListener('server:send_all_sensor_status', handleSensorData) // 센서 상태 응답 처리용

    // 컴포넌트 언마운트 시 리스너 제거
    return () => {
      removeEventListener('server:notify_senior_status_change', handleStatusChange)
      removeEventListener('server:emergency_situation', handleEmergencySituation)
      removeEventListener('server:notify_sensor_status_change', handleSensorData)
      removeEventListener('server:send_sensor_log', handleSensorData)
      removeEventListener('server:send_all_sensor_status', handleSensorData)
    }
  }, [addEventListener, removeEventListener])

  // API에서 어르신 데이터를 가져올 때 초기 'status' 값을 설정
  useEffect(() => {
    // health_info를 기반으로 초기 상태를 결정하는 내부 함수
    const getInitialStatus = (healthInfo: any): '위험' | '주의' | '안전' => {
      let status: '위험' | '주의' | '안전' = '안전';
      let info = healthInfo;
      
      if (typeof info === 'string') {
        try {
          info = JSON.parse(info)
        } catch (e) {
          // 파싱 실패 시 문자열로 처리
        }
      }
      
      if (Array.isArray(info)) {
        if (info.includes('위험')) status = '위험'
        else if (info.includes('주의')) status = '주의'
      } else if (typeof info === 'string') {
        if (info.includes('위험')) status = '위험'
        else if (info.includes('주의')) status = '주의'
      }

      return status;
    }

    const fetchSeniors = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await getSeniors()
        
        // API 응답 데이터에 'status' 속성을 추가하여 상태를 초기화
        const seniorsWithStatus = data.map(senior => {
          // 1. 로컬 스토리지에서 저장된 실시간 상태 확인
          const statusKey = `senior_status_${senior.senior_id}`;
          const savedStatus = localStorage.getItem(statusKey) as '위험' | '주의' | '안전' | null;
          
          if (savedStatus) {
            console.log(`🔄 로컬 스토리지에서 상태 복원: ${senior.full_name} (${senior.senior_id}) -> ${savedStatus}`);
            return {
              ...senior,
              status: savedStatus
            };
          }
          
          // 2. 로컬 스토리지에 없으면 health_info 기반으로 계산
          return {
            ...senior,
            status: getInitialStatus(senior.health_info)
          };
        })
        
        setSeniors(seniorsWithStatus)
      } catch (err) {
        setError('어르신 목록을 불러오는데 실패했습니다.')
        console.error('Error fetching seniors:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchSeniors()
  }, [])

  // 필터링된 어르신 목록 (이제 매우 간단해집니다)
  const filtered = useMemo(() => {
    if (filter === '전체') return seniors
    
    // 복잡한 getHealthStatus 함수 대신, 객체의 status 속성을 직접 비교합니다.
    return seniors.filter((senior) => senior.status === filter)
  }, [seniors, filter])

  // --- 이하 렌더링(JSX) 부분은 기존 코드와 동일합니다. ---

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">어르신 목록을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            다시 시도
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <FilterBar selected={filter} onSelect={setFilter} />
      <div className="pt-0 px-4 pb-4 space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">
              {filter === '전체' ? '등록된 어르신이 없습니다.' : `'${filter}' 상태의 어르신이 없습니다.`}
            </p>
          </div>
        ) : (
          filtered.map((senior) => (
            <ElderCard key={senior.senior_id} elder={senior} />
          ))
        )}
      </div>
    </div>
  )
}