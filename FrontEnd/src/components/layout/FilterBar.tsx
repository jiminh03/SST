export type FilterValue = '전체' | '위험' | '주의' | '안전'

interface FilterBarProps {
  selected: FilterValue
  onSelect: (value: FilterValue) => void
}

export default function FilterBar({ selected, onSelect }: FilterBarProps) {
  const isSelected = (value: FilterValue) => selected === value

  return (
    <div className="mt-2 grid grid-cols-4 gap-1 px-3 py-2 bg-white overflow-x-hidden">
      {/* 전체 */}
      <button
        onClick={() => onSelect('전체')}
        className={
          `inline-flex items-center justify-center gap-1 h-10 px-2 text-xs whitespace-nowrap rounded-full ` +
          (isSelected('전체')
            ? 'font-bold text-sky-500 bg-blue-100 border-2 border-sky-500'
            : 'font-semibold text-zinc-500 bg-white border-2 border-stone-300')
        }
      >
        전체
      </button>
      {/* 위험 */}
      <button
        onClick={() => onSelect('위험')}
        className={
          `inline-flex items-center justify-center gap-1 h-10 px-2 text-xs whitespace-nowrap rounded-full ` +
          (isSelected('위험')
            ? 'font-bold text-red-500 bg-red-50 border-2 border-red-400'
            : 'font-semibold text-red-500 bg-white border-2 border-stone-300')
        }
      >
        <span className="w-3 h-3 shrink-0 aspect-square rounded-full bg-red-500 shadow-[0_0_5px_0_rgba(239,68,68,0.5)]" />
        위험
      </button>
      {/* 주의 */}
      <button
        onClick={() => onSelect('주의')}
        className={
          `inline-flex items-center justify-center gap-1 h-10 px-2 text-xs whitespace-nowrap rounded-full ` +
          (isSelected('주의')
            ? 'font-bold text-yellow-600 bg-yellow-50 border-2 border-yellow-400'
            : 'font-semibold text-yellow-500 bg-white border-2 border-stone-300')
        }
      >
        <span className="w-3 h-3 shrink-0 aspect-square rounded-full bg-yellow-500 shadow-[0_0_5px_0_rgba(234,179,8,0.5)]" />
        주의
      </button>
      {/* 안전 */}
      <button
        onClick={() => onSelect('안전')}
        className={
          `inline-flex items-center justify-center gap-1 h-10 px-2 text-xs whitespace-nowrap rounded-full ` +
          (isSelected('안전')
            ? 'font-bold text-green-600 bg-green-50 border-2 border-green-400'
            : 'font-semibold text-green-500 bg-white border-2 border-stone-300')
        }
      >
        <span className="w-3 h-3 shrink-0 aspect-square rounded-full bg-green-500 shadow-[0_0_5px_0_rgba(34,197,94,0.5)]" />
        안전
      </button>
    </div>
  )
}
