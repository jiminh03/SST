import { Link } from 'react-router-dom'
import { User } from 'lucide-react'
import type { Senior } from '../../api/eldersApi'

export default function ElderCard({ elder }: { elder: Senior }) {
  // health_info를 상태로 변환 (위험/주의/안전)
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
  
  const status = getHealthStatus(elder.health_info)
  
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
    <Link to={`/elders/${elder.senior_id}`} className="relative flex items-center gap-3 p-4 bg-white rounded-[20px] shadow-[0px_4px_20px_rgba(0,0,0,0.25)] no-underline text-inherit">
      {/* 상태 배지 (우상단 고정) */}
      <div className={`absolute top-4 right-4 flex items-center gap-1 text-base font-semibold ${statusClass}`}>
        <span className={`w-3 h-3 shrink-0 aspect-square rounded-full ${dotClass} ${glowClass}`} />
        {status}
      </div>

      {/* 아바타 */}
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center shadow overflow-hidden">
        {elder.profile_img ? (
          <img 
            src={elder.profile_img} 
            alt={elder.full_name}
            className="w-full h-full object-cover"
            onError={(e) => {
              // 이미지 로드 실패 시 기본 아이콘 표시
              const target = e.target as HTMLImageElement
              target.style.display = 'none'
              const parent = target.parentElement
              if (parent) {
                parent.innerHTML = '<svg class="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"></path></svg>'
              }
            }}
          />
        ) : (
          <User className="w-12 h-12 text-white" />
        )}
      </div>

      {/* 정보 */}
      <div className="flex-1 ml-2 text-left space-y-1">
        <p className="text-lg font-bold text-black">{elder.full_name}</p>
        <p className="text-sm text-zinc-400 font-semibold">{calculateAge(elder.birth_date)}</p>
        <p className="text-sm text-zinc-400 font-semibold">{elder.address}</p>
      </div>
    </Link>
  )
}
