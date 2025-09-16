import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getSeniorById } from '../../api/eldersApi'
import type { Senior } from '../../api/eldersApi'
import { Heart, MapPin, Clock, Camera, Phone, Activity, Home, Lightbulb, Thermometer, User, Smartphone } from 'lucide-react'

export default function ElderDetailPage() {
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const [scrolled, setScrolled] = useState(false)
  const [senior, setSenior] = useState<Senior | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  
  const { id } = useParams<{ id: string }>()

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
    <div ref={scrollRef} className="h-full overflow-y-auto bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* 히어로 영역 */}
      <section className="relative px-6 pt-6 pb-6">
        <div className="bg-white rounded-3xl shadow-xl p-6">
          <div className="flex items-start gap-6">
            <div className="relative">
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-100 to-indigo-200 shadow-lg flex items-center justify-center">
                <img src="https://placehold.co/112x112" alt="어르신" className="rounded-full w-24 h-24 object-cover" />
              </div>
            </div>
            <div className="flex-1 pt-2">
              <div className="text-lg font-bold text-gray-800 mb-2">{senior.name}</div>
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <User className="w-4 h-4" />
                <span className="text-sm">{senior.age || '정보 없음'}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">{senior.address}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-500 mb-3">
                <Smartphone className="w-4 h-4" />
                <span className="text-sm">{senior.device_number || '정보 없음'}</span>
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
            <div className="mt-3 px-4 py-2 bg-gray-200 rounded-xl">
              <h3 className="text-xs font-semibold text-gray-800 mb-1">특이사항</h3>
              <p className="text-xs text-gray-700">
                {senior.health_info || '등록된 특이사항이 없습니다.'}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* 콘텐츠 카드 컨테이너 - 스크롤 시 확장 연출 */}
      <div className={`relative transition-all duration-300 ease-out ${scrolled ? 'mt-0 rounded-[40px]' : 'mt-4'} `}>
        <div className={`bg-white shadow-[0_0_30px_-2px_rgba(0,0,0,0.15)] ${scrolled ? 'rounded-[40px] pt-4' : 'rounded-[40px] pt-4'} `}>
          {/* 상단 액션/배너 영역 */}
          <div className="px-6 pb-6 space-y-4">
            {/* 상태 알림 배너 */}
            <div className="rounded-2xl bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-4 shadow-lg flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <div className="text-lg font-bold">활동 감지 없음</div>
                <div className="text-red-100 text-sm">마지막 활동: 1시간 전</div>
              </div>
            </div>

            {/* 액션 카드 2열 */}
            <div className="grid grid-cols-2 gap-4">
              <button className="rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white px-4 py-3 shadow-lg flex items-center gap-2 hover:from-blue-600 hover:to-blue-700 transition-all transform hover:scale-105">
                <Camera className="w-4 h-4" />
                <span className="text-sm font-semibold">카메라 확인</span>
              </button>
              <button className="rounded-2xl bg-gradient-to-br from-green-500 to-green-600 text-white px-4 py-3 shadow-lg flex items-center gap-2 hover:from-green-600 hover:to-green-700 transition-all transform hover:scale-105">
                <Phone className="w-4 h-4" />
                <span className="text-sm font-semibold">보호자 연락</span>
              </button>
            </div>
          </div>
          {/* 구분선 */}
          <div className="mx-6 border-t border-gray-200" />

          {/* 섹션 타이틀 */}
          <div className="px-6 pt-6 pb-4">
            <div className="flex items-center gap-3">
              <Home className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-bold text-gray-800">문 상태</h2>
            </div>
          </div>

          {/* 카드 그리드 - 문 상태 */}
          <div className="grid grid-cols-2 gap-4 px-6 pb-6">
            <RoomCard name="안방" time="15분 전" status="red" icon={<Home className="w-3 h-3" />} />
            <RoomCard name="화장실" time="15분 전" status="red" icon={<Home className="w-3 h-3" />} />
            <RoomCard name="냉장고" time="활동 없음" status="red" icon={<Thermometer className="w-3 h-3" />} />
            <RoomCard name="현관문" time="15분 전" status="red" icon={<Home className="w-3 h-3" />} />
          </div>

          {/* 구분선 */}
          <div className="mx-6 border-t border-gray-200" />

          <div className="px-6 pt-6 pb-4">
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-green-600" />
              <h2 className="text-lg font-bold text-gray-800">현재 위치</h2>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 px-6 pb-6">
            <SmallRoomCard name="안방" time="15분 전" status="red" icon={<Home className="w-3 h-3" />} />
            <SmallRoomCard name="거실" time="15분 전" status="green" icon={<Home className="w-3 h-3" />} />
            <SmallRoomCard name="화장실" time="15분 전" status="red" icon={<Home className="w-3 h-3" />} />
          </div>

          {/* 구분선 */}
          <div className="mx-6 border-t border-gray-200" />

          <div className="px-6 pt-6 pb-4">
            <div className="flex items-center gap-3">
              <Lightbulb className="w-5 h-5 text-yellow-600" />
              <h2 className="text-lg font-bold text-gray-800">조명 상태</h2>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 px-6 pb-8">
            <SmallRoomCard name="안방 조명" time="15분 전" status="red" icon={<Lightbulb className="w-3 h-3" />} />
            <SmallRoomCard name="거실 조명" time="15분 전" status="green" icon={<Lightbulb className="w-3 h-3" />} />
            <SmallRoomCard name="화장실 조명" time="15분 전" status="red" icon={<Lightbulb className="w-3 h-3" />} />
          </div>
        </div>
        <div className="h-6" />
      </div>
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

function RoomCard({ name, time, status, icon }: { name: string; time: string; status: 'red' | 'yellow' | 'green'; icon: React.ReactNode }) {
  return (
    <div className="relative rounded-2xl bg-gradient-to-br from-white to-gray-50 shadow-lg border border-gray-100 pl-2 pr-4 py-3 hover:shadow-xl transition-all duration-200">
      <div className="flex items-center justify-center mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-800 whitespace-nowrap">{name}</span>
          <StatusDot color={status} />
        </div>
      </div>
      <div className="text-sm text-gray-500 font-medium">{time}</div>
    </div>
  )
}

function SmallRoomCard({ name, time, status, icon }: { name: string; time: string; status: 'red' | 'yellow' | 'green'; icon: React.ReactNode }) {
  return (
    <div className="relative rounded-xl bg-gradient-to-br from-white to-gray-50 shadow-md border border-gray-100 pl-1 pr-3 py-2 hover:shadow-lg transition-all duration-200">
      <div className="flex items-center justify-center mb-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-800 whitespace-nowrap">{name}</span>
          <StatusDot color={status} />
        </div>
      </div>
      <div className="text-xs text-gray-500 font-medium">{time}</div>
    </div>
  )
}


