import { useState, useRef, useEffect } from 'react'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'

interface DatePickerProps {
  value: string
  onChange: (date: string) => void
  placeholder?: string
}

export default function DatePicker({ value, onChange, placeholder = "YYYY-MM-DD" }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showYearPicker, setShowYearPicker] = useState(false)
  const [showMonthPicker, setShowMonthPicker] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // 초기값 설정
  useEffect(() => {
    if (value) {
      const date = new Date(value)
      if (!isNaN(date.getTime())) {
        setSelectedDate(date)
        setCurrentMonth(date)
      }
    }
  }, [value])

  const formatDate = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
    onChange(formatDate(date))
    setIsOpen(false)
  }

  const handleClear = () => {
    setSelectedDate(null)
    onChange('')
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []
    
    // 이전 달의 빈 칸들
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    
    // 현재 달의 날짜들
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }
    
    return days
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev)
      if (direction === 'prev') {
        newMonth.setMonth(prev.getMonth() - 1)
      } else {
        newMonth.setMonth(prev.getMonth() + 1)
      }
      return newMonth
    })
  }

  const handleYearSelect = (year: number) => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev)
      newMonth.setFullYear(year)
      return newMonth
    })
    setShowYearPicker(false)
  }

  const handleMonthSelect = (month: number) => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev)
      newMonth.setMonth(month)
      return newMonth
    })
    setShowMonthPicker(false)
  }

  const generateYearRange = () => {
    const currentYear = new Date().getFullYear()
    const years = []
    for (let year = currentYear - 100; year <= currentYear; year++) {
      years.push(year)
    }
    return years.reverse()
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isSelected = (date: Date) => {
    if (!selectedDate) return false
    return date.toDateString() === selectedDate.toDateString()
  }

  const days = getDaysInMonth(currentMonth)
  const monthNames = [
    '1월', '2월', '3월', '4월', '5월', '6월',
    '7월', '8월', '9월', '10월', '11월', '12월'
  ]
  const dayNames = ['일', '월', '화', '수', '목', '금', '토']

  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
        <span className="text-blue-500"><Calendar className="w-5 h-5" /></span>
        생년월일
        <span className="text-red-500">*</span>
      </label>
      
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          placeholder={placeholder}
          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 transition-all shadow-sm cursor-pointer"
          onClick={() => setIsOpen(true)}
          readOnly
        />

        {/* 달력 팝업 */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-20 p-4">
            {/* 달력 헤더 */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowYearPicker(!showYearPicker)}
                  className="text-lg font-semibold text-gray-800 hover:text-blue-600 transition-colors"
                >
                  {currentMonth.getFullYear()}년
                </button>
                <button
                  onClick={() => setShowMonthPicker(!showMonthPicker)}
                  className="text-lg font-semibold text-gray-800 hover:text-blue-600 transition-colors"
                >
                  {monthNames[currentMonth.getMonth()]}
                </button>
              </div>
              
              <button
                onClick={() => navigateMonth('next')}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* 년도 선택기 */}
            {showYearPicker && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium text-gray-700 mb-2">년도 선택</div>
                <div className="flex flex-wrap gap-1 max-h-40 overflow-y-auto">
                  {generateYearRange().map(year => (
                    <button
                      key={year}
                      onClick={() => handleYearSelect(year)}
                      className={`
                        text-sm py-1.5 px-2 rounded transition-colors flex-shrink-0
                        ${currentMonth.getFullYear() === year
                          ? 'bg-blue-500 text-white'
                          : 'hover:bg-gray-200 text-gray-700'
                        }
                      `}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 월 선택기 */}
            {showMonthPicker && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium text-gray-700 mb-2">월 선택</div>
                <div className="grid grid-cols-3 gap-2">
                  {monthNames.map((month, index) => (
                    <button
                      key={index}
                      onClick={() => handleMonthSelect(index)}
                      className={`
                        text-sm py-2 px-3 rounded transition-colors
                        ${currentMonth.getMonth() === index
                          ? 'bg-blue-500 text-white'
                          : 'hover:bg-gray-200 text-gray-700'
                        }
                      `}
                    >
                      {month}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 요일 헤더 */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {dayNames.map(day => (
                <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* 날짜 그리드 */}
            <div className="grid grid-cols-7 gap-3">
              {days.map((day, index) => {
                if (!day) {
                  return <div key={index} className="h-8 w-8" />
                }
                
                return (
                  <button
                    key={index}
                    onClick={() => handleDateSelect(day)}
                    className={`
                      h-8 w-8 text-xs rounded-md transition-colors font-medium flex items-center justify-center
                      ${isSelected(day) 
                        ? 'bg-blue-100 text-black shadow-md font-bold border border-blue-500' 
                        : isToday(day)
                        ? 'bg-blue-100 text-blue-600 border border-blue-200'
                        : 'hover:bg-gray-100 text-gray-700 hover:shadow-sm'
                      }
                    `}
                  >
                    {day.getDate()}
                  </button>
                )
              })}
            </div>

            {/* 액션 버튼들 */}
            <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-200">
              <button
                onClick={handleClear}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                초기화
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
