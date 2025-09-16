import { useMemo, useState, useEffect } from 'react'
import ElderCard, { type Elder } from '../../components/elder/ElderCard'
import FilterBar, { type FilterValue } from '../../components/layout/FilterBar'
import { getSeniors, type Senior } from '../../api/eldersApi'

export default function HomePage() {
  const [filter, setFilter] = useState<FilterValue>('전체')
  const [seniors, setSeniors] = useState<Senior[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  // Senior 데이터를 Elder 데이터로 변환
  const elders: Elder[] = useMemo(() => {
    return seniors.map((senior) => ({
      id: senior.senior_id,
      name: senior.name,
      birthDate: '정보 없음', // API에서 생년월일 정보가 없으므로 기본값
      address: senior.address,
      status: senior.health_info === '위험' ? '위험' : 
              senior.health_info === '주의' ? '주의' : '안전' // health_info를 status로 매핑
    }))
  }, [seniors])

  const filtered = useMemo(() => {
    if (filter === '전체') return elders
    return elders.filter((e) => e.status === filter)
  }, [elders, filter])

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
      <div className="pt-0 px-4 pb-4 space-y-4">
        {filtered.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">등록된 어르신이 없습니다.</p>
          </div>
        ) : (
          filtered.map((elder) => (
            <ElderCard key={elder.id} elder={elder} />
          ))
        )}
      </div>
    </div>
  )
}