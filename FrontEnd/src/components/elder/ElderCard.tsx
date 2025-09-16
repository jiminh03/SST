export interface Elder {
  id: number
  name: string
  birthDate: string
  address: string
  status: '위험' | '주의' | '안전'
}

import { Link } from 'react-router-dom'

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

  const glowClass = ''

  return (
    <Link to={`/elders/${elder.id}`} className="relative flex items-center gap-4 p-5 bg-white rounded-[20px] shadow-[0px_0px_30px_-2px_rgba(0,0,0,0.15)] no-underline text-inherit">
      {/* 상태 배지 (우상단 고정) */}
      <div className={`absolute top-4 right-4 flex items-center gap-1 text-base font-semibold ${statusClass}`}>
        <span className={`w-3 h-3 shrink-0 aspect-square rounded-full ${dotClass} ${glowClass}`} />
        {elder.status}
      </div>

      {/* 아바타 */}
      <div className="w-20 h-20 rounded-full bg-zinc-100 flex items-center justify-center shadow">
        <img
          src="https://placehold.co/80x80"
          alt="어르신"
          className="rounded-full"
        />
      </div>

      {/* 정보 */}
      <div className="flex-1 ml-2 text-left">
        <p className="text-xl font-bold tracking-widest text-black">{elder.name}</p>
        <p className="text-base text-zinc-400 font-semibold">{elder.birthDate}</p>
        <p className="text-base text-zinc-400 font-semibold">{elder.address}</p>
      </div>
    </Link>
  )
}
