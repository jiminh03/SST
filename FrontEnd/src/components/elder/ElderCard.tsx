export interface Elder {
  id: number
  name: string
  birthDate: string
  address: string
  status: '위험' | '주의' | '안전'
}

import { Link } from 'react-router-dom'
import { User } from 'lucide-react'

export default function ElderCard({ elder }: { elder: Elder }) {
  const statusClass =
    elder.status === '위험'
      ? 'text-red-500'
      : elder.status === '주의'
      ? 'text-yellow-500'
      : 'text-green-500'

  const dotClass =
    elder.status === '위험'
      ? 'bg-red-500'
      : elder.status === '주의'
      ? 'bg-yellow-500'
      : 'bg-green-500'

  const glowClass = elder.status === '위험' 
    ? 'shadow-[0_0_5px_0_rgba(239,68,68,0.5)]' 
    : elder.status === '주의' 
    ? 'shadow-[0_0_5px_0_rgba(234,179,8,0.5)]'
    : 'shadow-[0_0_5px_0_rgba(34,197,94,0.5)]'

  return (
    <Link to={`/elders/${elder.id}`} className="relative flex items-center gap-3 p-4 bg-white rounded-[20px] shadow-[0px_4px_20px_rgba(0,0,0,0.25)] no-underline text-inherit">
      {/* 상태 배지 (우상단 고정) */}
      <div className={`absolute top-4 right-4 flex items-center gap-1 text-base font-semibold ${statusClass}`}>
        <span className={`w-3 h-3 shrink-0 aspect-square rounded-full ${dotClass} ${glowClass}`} />
        {elder.status}
      </div>

      {/* 아바타 */}
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center shadow">
        <User className="w-12 h-12 text-white" />
      </div>

      {/* 정보 */}
      <div className="flex-1 ml-2 text-left space-y-1">
        <p className="text-lg font-bold tracking-widest text-black">{elder.name}</p>
        <p className="text-sm text-zinc-400 font-semibold">{elder.birthDate}</p>
        <p className="text-sm text-zinc-400 font-semibold">{elder.address}</p>
      </div>
    </Link>
  )
}
