import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getSeniorById } from '../../api/eldersApi'
import type { Senior } from '../../api/eldersApi'
import { Heart, MapPin, Clock, Camera, Phone, Activity, Home, Lightbulb, Thermometer, User, Smartphone } from 'lucide-react'

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
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
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
                    onError={(e) => {
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
              <div className="flex items-center gap-2 text-gray-500 mb-3">
                <Smartphone className="w-4 h-4" />
                <span className="text-sm">{senior.device_id || '정보 없음'}</span>
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
        <div className={`bg-white shadow-lg border border-gray-100 ${scrolled ? 'rounded-2xl pt-4' : 'rounded-2xl pt-4'} `}>
          {/* 상단 액션/배너 영역 */}
          <div className="px-6 pb-6 space-y-4">
            {/* 상태 알림 배너 */}
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <Activity className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <div className="text-sm font-semibold text-red-800">활동 감지 없음</div>
                <div className="text-red-600 text-xs">마지막 활동: 1시간 전</div>
              </div>
            </div>

            {/* 액션 카드 2열 */}
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => navigate(`/camera?from=${id}`)}
                className="rounded-lg text-gray-600 px-3 py-2 border border-gray-200 flex items-center gap-2 transition-colors shadow-sm hover:shadow-md"
                style={{ backgroundColor: '#ffffff' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
              >
                <Camera className="w-4 h-4" />
                <span className="text-sm font-medium">카메라 확인</span>
              </button>
              <button
                onClick={() => setShowGuardianContact(true)}
                className="rounded-lg text-gray-600 px-3 py-2 border border-gray-200 flex items-center gap-2 transition-colors shadow-sm hover:shadow-md"
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

          {/* 섹션 타이틀 */}
          <div className="px-6 pt-4 pb-3">
            <div className="flex items-center gap-2">
              <Home className="w-4 h-4 text-gray-600" />
              <h2 className="text-base font-semibold text-gray-800">문 상태</h2>
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

          <div className="px-6 pt-4 pb-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-600" />
              <h2 className="text-base font-semibold text-gray-800">현재 위치</h2>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 px-6 pb-6">
            <SmallRoomCard name="안방" time="15분 전" status="red" icon={<Home className="w-3 h-3" />} />
            <SmallRoomCard name="거실" time="15분 전" status="green" icon={<Home className="w-3 h-3" />} />
            <SmallRoomCard name="화장실" time="15분 전" status="red" icon={<Home className="w-3 h-3" />} />
          </div>

          {/* 구분선 */}
          <div className="mx-6 border-t border-gray-200" />

          <div className="px-6 pt-4 pb-3">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-gray-600" />
              <h2 className="text-base font-semibold text-gray-800">조명 상태</h2>
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

function RoomCard({ name, time, status, icon }: { name: string; time: string; status: 'red' | 'yellow' | 'green'; icon: React.ReactNode }) {
  return (
    <div className="relative rounded-lg bg-white shadow-sm border border-gray-200 px-3 py-3 hover:shadow-md transition-all duration-200">
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

function SmallRoomCard({ name, time, status, icon }: { name: string; time: string; status: 'red' | 'yellow' | 'green'; icon: React.ReactNode }) {
  return (
    <div className="relative rounded-lg bg-white shadow-sm border border-gray-200 px-3 py-3 hover:shadow-md transition-all duration-200">
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


