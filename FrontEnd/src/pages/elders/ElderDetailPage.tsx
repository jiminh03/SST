import { useEffect, useRef, useState } from 'react'

export default function ElderDetailPage() {
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const onScroll = () => {
      setScrolled(el.scrollTop > 120)
    }
    el.addEventListener('scroll', onScroll)
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div ref={scrollRef} className="h-full overflow-y-auto bg-orange-50">
      {/* 히어로 영역 */}
      <section className="relative px-6 pt-6 pb-4">
        <div className="flex items-start gap-6">
          <div className="w-24 h-24 rounded-full bg-zinc-100 shadow flex items-center justify-center">
            <img src="https://placehold.co/96x96" alt="어르신" className="rounded-full" />
          </div>
          <div className="flex-1 pt-1">
            <div className="text-2xl font-bold tracking-widest">김OO</div>
            <div className="text-lg text-zinc-400 font-semibold mt-1">1946.03.04 (만 79세)</div>
            <div className="text-lg text-zinc-400 font-semibold">싸파트 503호</div>
            <button className="mt-3 inline-flex items-center gap-2 h-10 px-4 rounded-full bg-zinc-400 text-white font-bold">자세히 보기</button>
          </div>
        </div>
      </section>

      {/* 콘텐츠 카드 컨테이너 - 스크롤 시 확장 연출 */}
      <div className={`relative transition-all duration-300 ease-out ${scrolled ? 'mt-0 rounded-[40px]' : 'mt-4'} `}>
        <div className={`bg-white shadow-[0_0_30px_-2px_rgba(0,0,0,0.15)] ${scrolled ? 'rounded-[40px] pt-4' : 'rounded-[40px] pt-4'} `}>
          {/* 상단 액션/배너 영역 */}
          <div className="px-4 pb-4 space-y-3">
            {/* 경고 배너 */}
            <div className="rounded-2xl bg-red-600 text-white px-4 py-3 shadow-md flex items-center gap-3">
              <div className="w-8 h-8 bg-white rounded-full" />
              <div className="text-xl font-bold">1시간 째 활동 없음</div>
            </div>

            {/* 액션 카드 2열 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white shadow-[0_0_8px_1px_rgba(0,0,0,0.25)] px-4 py-3 text-neutral-400 font-bold text-lg">카메라 확인</div>
              <div className="rounded-2xl bg-white shadow-[0_0_8px_1px_rgba(0,0,0,0.25)] px-4 py-3 text-neutral-400 font-bold text-lg">보호자 연락</div>
            </div>
          </div>
          {/* 상단 구분선 */}
          <div className="mx-4 border-t border-neutral-300" />

          {/* 섹션 타이틀 */}
          <div className="px-6 pt-5 text-2xl font-bold">문 상태</div>

          {/* 카드 그리드 - 문 상태 */}
          <div className="grid grid-cols-2 gap-4 px-6 py-4">
            <RoomCard name="안방" time="15분 전" status="red" />
            <RoomCard name="화장실" time="15분 전" status="red" />
            <RoomCard name="냉장고" time="활동 없음" status="red" />
            <RoomCard name="현관문" time="15분 전" status="red" />
          </div>

          {/* 구분선 */}
          <div className="mx-4 border-t border-neutral-300" />

          <div className="px-6 pt-5 text-2xl font-bold">현재 위치</div>
          <div className="grid grid-cols-2 gap-4 px-6 py-4">
            <SmallRoomCard name="안방" time="15분 전" status="red" />
            <SmallRoomCard name="거실" time="15분 전" status="green" />
            <SmallRoomCard name="화장실" time="15분 전" status="red" />
          </div>

          {/* 구분선 */}
          <div className="mx-4 border-t border-neutral-300" />

          <div className="px-6 pt-5 text-2xl font-bold">ON / OFF</div>
          <div className="grid grid-cols-2 gap-4 px-6 py-4">
            <SmallRoomCard name="안방 조명" time="15분 전" status="red" />
            <SmallRoomCard name="거실 조명" time="15분 전" status="green" />
            <SmallRoomCard name="화장실" time="15분 전" status="red" />
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

function RoomCard({ name, time, status }: { name: string; time: string; status: 'red' | 'yellow' | 'green' }) {
  return (
    <div className="relative rounded-2xl bg-white shadow-[0_0_16px_0_rgba(0,0,0,0.25)] px-4 py-3">
      <div className="flex items-center gap-2 text-xl font-bold">
        {name}
        <StatusDot color={status} />
      </div>
      <div className="text-base text-neutral-400 font-bold">{time}</div>
    </div>
  )
}

function SmallRoomCard({ name, time, status }: { name: string; time: string; status: 'red' | 'yellow' | 'green' }) {
  return (
    <div className="relative rounded-2xl bg-white shadow-[0_0_16px_0_rgba(0,0,0,0.25)] px-4 py-3">
      <div className="flex items-center gap-2 text-lg font-bold">
        {name}
        <StatusDot color={status} />
      </div>
      <div className="text-sm text-neutral-400 font-bold">{time}</div>
    </div>
  )
}


