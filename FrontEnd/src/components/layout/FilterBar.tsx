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
          `inline-flex items-center justify-center gap-2 h-12 px-3 text-sm whitespace-nowrap rounded-xl transition-all duration-200 font-semibold ` +
          (isSelected('전체')
            ? 'text-blue-600 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-md scale-105'
            : 'text-gray-600 bg-white/50 border-2 border-gray-200 hover:bg-gray-50 hover:scale-105')
        }
      >
        전체
      </button>
      {/* 위험 */}
      <button
        onClick={() => onSelect('위험')}
        className={
          `inline-flex items-center justify-center gap-2 h-12 px-3 text-sm whitespace-nowrap rounded-xl transition-all duration-200 font-semibold ` +
          (isSelected('위험')
            ? 'text-red-600 bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 shadow-md scale-105'
            : 'text-red-500 bg-white/50 border-2 border-gray-200 hover:bg-gray-50 hover:scale-105')
        }
      >
        <span className="w-3 h-3 shrink-0 aspect-square rounded-full bg-gradient-to-br from-red-400 to-red-600 shadow-[0_0_6px_0_rgba(239,68,68,0.4)]" />
        위험
      </button>
      {/* 주의 */}
      <button
        onClick={() => onSelect('주의')}
        className={
          `inline-flex items-center justify-center gap-2 h-12 px-3 text-sm whitespace-nowrap rounded-xl transition-all duration-200 font-semibold ` +
          (isSelected('주의')
            ? 'text-yellow-600 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 shadow-md scale-105'
            : 'text-yellow-500 bg-white/50 border-2 border-gray-200 hover:bg-gray-50 hover:scale-105')
        }
      >
        <span className="w-3 h-3 shrink-0 aspect-square rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-[0_0_6px_0_rgba(234,179,8,0.4)]" />
        주의
      </button>
      {/* 안전 */}
      <button
        onClick={() => onSelect('안전')}
        className={
          `inline-flex items-center justify-center gap-2 h-12 px-3 text-sm whitespace-nowrap rounded-xl transition-all duration-200 font-semibold ` +
          (isSelected('안전')
            ? 'text-green-600 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 shadow-md scale-105'
            : 'text-green-500 bg-white/50 border-2 border-gray-200 hover:bg-gray-50 hover:scale-105')
        }
      >
        <span className="w-3 h-3 shrink-0 aspect-square rounded-full bg-gradient-to-br from-green-400 to-green-600 shadow-[0_0_6px_0_rgba(34,197,94,0.4)]" />
        안전
      </button>
    </div>
  )
}
