import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getSeniorById, updateSenior } from '../../api/eldersApi'
import type { Senior } from '../../api/eldersApi'
import { User, MapPin, Smartphone, Calendar, Camera } from 'lucide-react'

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
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="p-6">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          {/* 프로필 사진 */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-full overflow-hidden shadow-md">
                <img src="https://placehold.co/80x80" alt="어르신" className="w-full h-full object-cover" />
              </div>
              <button className="absolute -bottom-1 -right-1 bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full shadow-lg transition-colors">
                <Camera className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* 폼 필드들 */}
          <div className="space-y-5">
            {/* 이름 */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                <span className="text-blue-500"><User className="w-4 h-4" /></span>
                이름
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 transition-all shadow-sm"
                placeholder="이름을 입력하세요"
              />
            </div>

            {/* 생년월일 */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                <span className="text-blue-500"><Calendar className="w-4 h-4" /></span>
                생년월일
                <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.birth_date}
                onChange={(e) => handleInputChange('birth_date', e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
              />
            </div>

            {/* 주소 */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                <span className="text-blue-500"><MapPin className="w-4 h-4" /></span>
                주소
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 transition-all shadow-sm"
                placeholder="주소를 입력하세요"
              />
            </div>

            {/* 연동 기기 번호 */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                <span className="text-blue-500"><Smartphone className="w-4 h-4" /></span>
                연동 기기 번호
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.device_number}
                onChange={(e) => handleInputChange('device_number', e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 transition-all shadow-sm"
                placeholder="연동 기기 번호를 입력하세요"
              />
            </div>

          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="mt-6 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm text-center">{error}</p>
            </div>
          )}

          {/* 버튼 */}
          <div className="mt-8">
            <button
              onClick={handleUpdate}
              disabled={isSubmitting}
              className="w-full text-white font-semibold py-3 px-6 rounded-lg shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#0088FF' }}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
