import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getSeniorById, updateSenior } from '../../api/eldersApi'
import type { Senior } from '../../api/eldersApi'
import { User, MapPin, Smartphone, ArrowLeft } from 'lucide-react'

export default function ElderEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [senior, setSenior] = useState<Senior | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    birth_date: '',
    device_number: ''
  })

  useEffect(() => {
    const fetchSenior = async () => {
      if (!id) return
      try {
        setLoading(true)
        const data = await getSeniorById(parseInt(id))
        setSenior(data)
        setFormData({
          name: data.name || '',
          address: data.address || '',
          birth_date: data.birth_date || '',
          device_number: data.device_number || ''
        })
      } catch (err) {
        setError('어르신 정보를 불러오는데 실패했습니다.')
        console.error('Error fetching senior:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchSenior()
  }, [id])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleUpdate = async () => {
    if (!senior) return
    
    try {
      setIsSubmitting(true)
      setError(null)
      
      await updateSenior(senior.senior_id, {
        name: formData.name,
        address: formData.address,
        birth_date: formData.birth_date,
        device_number: formData.device_number
      })
      
      alert('어르신 정보가 수정되었습니다.')
      navigate(`/elders/${senior.senior_id}`)
    } catch (err) {
      setError('어르신 정보 수정에 실패했습니다. 다시 시도해주세요.')
      console.error('Update error:', err)
    } finally {
      setIsSubmitting(false)
    }
  }


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">어르신 정보를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (error && !senior) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => navigate('/home')} 
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* 헤더 */}
      <div className="bg-white shadow-sm px-6 py-4 flex items-center gap-4">
        <div 
          onClick={() => navigate(`/elders/${id}`)}
          className="w-6 h-6 flex items-center justify-center cursor-pointer"
        >
          <span className="w-4 h-4 rotate-45 border-l-2 border-b-2 border-zinc-700 inline-block" />
        </div>
        <h1 className="text-xl font-semibold">어르신 정보 수정</h1>
      </div>

      <div className="p-6">
        <div className="bg-white rounded-3xl shadow-xl p-6">
          {/* 프로필 사진 */}
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 rounded-full overflow-hidden">
              <img src="https://placehold.co/96x96" alt="어르신" className="w-full h-full object-cover" />
            </div>
          </div>

          {/* 폼 필드들 */}
          <div className="space-y-4">
            {/* 이름 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">이름</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="이름을 입력하세요"
              />
            </div>

            {/* 생년월일 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">생년월일</label>
              <input
                type="date"
                value={formData.birth_date}
                onChange={(e) => handleInputChange('birth_date', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* 주소 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">주소</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="주소를 입력하세요"
              />
            </div>

            {/* 연동 기기 번호 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">연동 기기 번호</label>
              <input
                type="text"
                value={formData.device_number}
                onChange={(e) => handleInputChange('device_number', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="연동 기기 번호를 입력하세요"
              />
            </div>

          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm text-center">{error}</p>
            </div>
          )}

          {/* 버튼 */}
          <div className="mt-8">
            <button
              onClick={handleUpdate}
              disabled={isSubmitting}
              className="w-full text-white font-semibold py-4 px-6 rounded-xl shadow-lg transition-colors transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              style={{ backgroundColor: '#0088FF' }}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  수정 중...
                </div>
              ) : (
                '정보 수정하기'
              )}
            </button>
          </div>
        </div>
      </div>

    </div>
  )
}
