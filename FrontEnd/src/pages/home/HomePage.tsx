import { useMemo, useState, useEffect } from 'react'
import ElderCard from '../../components/elder/ElderCard'
import FilterBar, { type FilterValue } from '../../components/layout/FilterBar'
import { getSeniors, type Senior } from '../../api/eldersApi'
import { useSocket } from '../../contexts/SocketContext'

export default function HomePage() {
  const [filter, setFilter] = useState<FilterValue>('전체')
  const [seniors, setSeniors] = useState<Senior[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Socket Context에서 이벤트 리스너 함수들 가져오기
  const { connectSocket, addEventListener, removeEventListener } = useSocket()

  // Socket 연결 (앱 시작 시점)
  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) {
      console.log('🏠 HomePage: Socket 연결 시작')
      connectSocket('https://j13a503.p.ssafy.io', token)
    }
  }, [connectSocket])

  // WebSocket 이벤트 리스너 등록하여 상태를 실시간으로 업데이트
  useEffect(() => {
    const handleStatusChange = (data: { senior_id: number; status: '위험' | '주의' | '안전' }) => {
      console.log(`⚡️ 홈 화면 상태 변경 이벤트 수신: 어르신 ID ${data.senior_id} -> ${data.status}`);
      
      // 로컬 스토리지에 실시간 상태 저장
      const statusKey = `senior_status_${data.senior_id}`;
      localStorage.setItem(statusKey, data.status);
      
      setSeniors(prevSeniors =>
        prevSeniors.map(senior =>
          senior.senior_id === data.senior_id
            ? { ...senior, status: data.status } // 해당 어르신의 status만 변경
            : senior
        )
      )
    }

    // 이벤트 리스너 등록
    addEventListener('server:notify_senior_status_change', handleStatusChange)

    // 컴포넌트 언마운트 시 리스너 제거
    return () => {
      removeEventListener('server:notify_senior_status_change', handleStatusChange)
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
            <p className="text-gray-500">등록된 어르신이 없습니다.</p>
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