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
  
  // Socket Context 사용
  const { connectSocket } = useSocket()

  // Socket 연결 (앱 시작 시점)
  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) {
      console.log('🏠 HomePage: Socket 연결 시작')
      connectSocket('https://j13a503.p.ssafy.io', token)
    }
  }, [connectSocket])

  // API에서 어르신 데이터 가져오기
  useEffect(() => {
    const fetchSeniors = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await getSeniors()
        setSeniors(data)
      } catch (err) {
        setError('어르신 목록을 불러오는데 실패했습니다.')
        console.error('Error fetching seniors:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchSeniors()
  }, [])

  // health_info를 상태로 변환하는 함수
  const getHealthStatus = (healthInfo: any): string => {
    let status = '안전' // 기본값
    
    // 배열인 경우 처리
    if (Array.isArray(healthInfo)) {
      if (healthInfo.includes('위험')) status = '위험'
      else if (healthInfo.includes('주의')) status = '주의'
      else status = '안전'
    }
    // 문자열인 경우 JSON 파싱 시도
    else if (typeof healthInfo === 'string') {
      if (healthInfo.startsWith('[') && healthInfo.endsWith(']')) {
        try {
          const parsed = JSON.parse(healthInfo)
          if (Array.isArray(parsed)) {
            if (parsed.includes('위험')) status = '위험'
            else if (parsed.includes('주의')) status = '주의'
            else status = '안전'
          }
        } catch (e) {
          // 파싱 실패 시 문자열 직접 비교
          if (healthInfo.includes('위험')) status = '위험'
          else if (healthInfo.includes('주의')) status = '주의'
          else status = '안전'
        }
      } else {
        // 일반 문자열인 경우
        if (healthInfo.includes('위험')) status = '위험'
        else if (healthInfo.includes('주의')) status = '주의'
        else status = '안전'
      }
    }
    
    return status
  }

  // 필터링된 어르신 목록
  const filtered = useMemo(() => {
    if (filter === '전체') return seniors
    
    return seniors.filter((senior) => {
      const status = getHealthStatus(senior.health_info)
      return status === filter
    })
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