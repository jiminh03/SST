import { useMemo, useState } from 'react'
import ElderCard, { type Elder } from '../../components/elder/ElderCard'
import FilterBar, { type FilterValue } from '../../components/layout/FilterBar'

const elders: Elder[] = [
  { id: 1, name: '김OO', birthDate: '1946.03.04 (만 79세)', address: '싸파트 503호', status: '위험' },
  { id: 2, name: '이OO', birthDate: '1946.03.04 (만 79세)', address: '싸파트 503호', status: '안전' },
  { id: 3, name: '신OO', birthDate: '1946.03.04 (만 79세)', address: '싸파트 503호', status: '주의' },
]

export default function HomePage() {
  const [filter, setFilter] = useState<FilterValue>('전체')

  const filtered = useMemo(() => {
    if (filter === '전체') return elders
    return elders.filter((e) => e.status === filter)
  }, [filter])

  return (
    <div className="space-y-4">
      <FilterBar selected={filter} onSelect={setFilter} />
      <div className="p-4 space-y-4">
        {filtered.map((elder) => (
          <ElderCard key={elder.id} elder={elder} />
        ))}
      </div>
    </div>
  )
}