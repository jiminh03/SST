import { useNavigate } from 'react-router-dom'
import { User } from 'lucide-react'
import { useState, useEffect } from 'react'
import type { Senior } from '../../api/eldersApi'
import { useSocket } from '../../contexts/SocketContext'

export default function ElderCard({ elder }: { elder: Senior }) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [imageLoading, setImageLoading] = useState(false)
  const navigate = useNavigate()
  const { socket } = useSocket()

  // 어르신 카드 클릭 핸들러
  const handleElderClick = () => {
    console.log(`🔍 ${elder.senior_id}번 어르신 상세조회로 이동`)
    
    // 웹소켓으로 전체 센서 상태 요청
    if (socket && socket.connected) {
      console.log(`📡 전체 센서 상태 요청 전송: senior_id ${elder.senior_id}`)
      socket.emit('client:request_all_sensor_status', {
        senior_id: elder.senior_id
      })
    } else {
      console.log('⚠️ 웹소켓이 연결되지 않아 센서 상태 요청을 보낼 수 없습니다.')
    }
    
    // 상세조회 페이지로 이동
    navigate(`/elders/${elder.senior_id}`)
  }

  // 인증된 이미지 로드
  useEffect(() => {
    if (elder.senior_id) {
      console.log('🖼️ 이미지 로드 시작 - senior_id:', elder.senior_id)
      setImageLoading(true)
      const token = localStorage.getItem('access_token')
      
      // 프록시를 통한 이미지 API 호출
      const imageApiUrl = `/api/seniors/${elder.senior_id}/profile-image`
      console.log('🖼️ 이미지 API URL:', imageApiUrl)
      console.log('🖼️ 토큰 존재:', !!token)
      
      fetch(imageApiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(response => {
        console.log('🖼️ 이미지 응답 상태:', response.status, response.statusText)
        if (response.ok) {
          return response.blob()
        }
        throw new Error(`Image load failed: ${response.status}`)
      })
      .then(blob => {
        console.log('🖼️ 이미지 blob 크기:', blob.size)
        const url = URL.createObjectURL(blob)
        setImageUrl(url)
        setImageLoading(false)
        console.log('🖼️ 이미지 로드 성공!')
      })
      .catch(error => {
        console.log('❌ 인증된 이미지 로드 실패:', error)
        setImageUrl(null)
        setImageLoading(false)
      })
    } else {
      console.log('🖼️ senior_id가 없어서 이미지 로드 안함')
    }
  }, [elder.senior_id])

  // 상태 결정: elder.status가 있으면 사용, 없으면 health_info에서 계산
  const getHealthStatus = (healthInfo: any): '위험' | '주의' | '안전' => {
    let status: '위험' | '주의' | '안전' = '안전' // 기본값
    
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
  
  // elder.status가 있으면 사용, 없으면 health_info에서 계산
  const status = elder.status || getHealthStatus(elder.health_info)
  
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
  
  const statusClass =
    status === '위험'
      ? 'text-red-500'
      : status === '주의'
      ? 'text-yellow-500'
      : 'text-green-500'

  const dotClass =
    status === '위험'
      ? 'bg-red-500'
      : status === '주의'
      ? 'bg-yellow-500'
      : 'bg-green-500'

  const glowClass = status === '위험' 
    ? 'shadow-[0_0_5px_0_rgba(239,68,68,0.5)]' 
    : status === '주의' 
    ? 'shadow-[0_0_5px_0_rgba(234,179,8,0.5)]'
    : 'shadow-[0_0_5px_0_rgba(34,197,94,0.5)]'

  return (
    <button 
      onClick={handleElderClick}
      className="relative flex items-center gap-3 p-4 bg-white rounded-[20px] shadow-[0px_4px_20px_rgba(0,0,0,0.25)] no-underline text-inherit w-full text-left cursor-pointer hover:shadow-[0px_6px_25px_rgba(0,0,0,0.3)] transition-shadow"
    >
      {/* 상태 배지 (우상단 고정) */}
      <div className={`absolute top-4 right-4 flex items-center gap-1 text-base font-semibold ${statusClass}`}>
        <span className={`w-3 h-3 shrink-0 aspect-square rounded-full ${dotClass} ${glowClass}`} />
        {status}
      </div>

      {/* 아바타 */}
      <div className="w-20 h-20 rounded-full flex items-center justify-center overflow-hidden">
        {imageLoading ? (
          <div className="w-12 h-12 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
        ) : imageUrl ? (
          <img 
            src={imageUrl} 
            alt={`${elder.full_name} 프로필`}
            className="w-full h-full object-cover"
            onError={() => {
              console.log('❌ 이미지 표시 실패:', imageUrl)
              setImageUrl(null)
            }}
          />
        ) : (
          <User className="w-12 h-12 text-gray-400" />
        )}
      </div>

      {/* 정보 */}
      <div className="flex-1 ml-2 text-left space-y-1">
        <p className="text-lg font-bold text-black">{elder.full_name}</p>
        <p className="text-sm text-zinc-400 font-semibold">{calculateAge(elder.birth_date)}</p>
        <p className="text-sm text-zinc-400 font-semibold">{elder.address}</p>
      </div>
    </button>
  )
}
