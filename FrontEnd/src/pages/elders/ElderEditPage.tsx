import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getSeniorById, updateSenior } from '../../api/eldersApi'
import type { Senior } from '../../api/eldersApi'
import { User, MapPin, Smartphone, Calendar, Camera, Phone } from 'lucide-react'
import AddressSearch from '../../components/common/AddressSearch'

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
    device_number: '',
    guardian_contact: '',
    notes: ''
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
          device_number: data.device_number || '',
          guardian_contact: data.guardian_contact || '',
          notes: data.notes || ''
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
      
      window.location.href = `/elders/${senior.senior_id}?updated=true`
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
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 shadow-xl flex items-center justify-center border-4 border-white ring-4 ring-gray-100">
                <User className="w-12 h-12 text-white" />
              </div>
              <button 
                className="absolute -bottom-1 -right-2 text-white p-1 rounded-full shadow-xl transition-all duration-200 hover:scale-110"
                style={{ backgroundColor: '#0088FF' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0066CC'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0088FF'}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>
          </div>

          {/* 폼 섹션 */}
          <div className="space-y-6">
            <FormField 
              icon={<User className="w-5 h-5" />}
              label="이름" 
              required 
              placeholder="이름을 입력해주세요"
              value={formData.name}
              onChange={(value) => handleInputChange('name', value)}
            />

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <span className="text-blue-500"><Calendar className="w-5 h-5" /></span>
                생년월일
                <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={formData.birth_date}
                  onChange={(e) => handleInputChange('birth_date', e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                />
              </div>
            </div>

            <AddressSearch 
              value={formData.address}
              onChange={(address) => handleInputChange('address', address)}
              placeholder="주소를 검색해주세요"
            />

            <FormField 
              icon={<Phone className="w-5 h-5" />}
              label="보호자 연락처" 
              required
              placeholder="예) 010-1234-5678"
              value={formData.guardian_contact}
              onChange={(value) => handleInputChange('guardian_contact', value)}
            />
            <FormField 
              icon={<Smartphone className="w-5 h-5" />}
              label="연동 기기 번호" 
              required 
              placeholder="연동된 기기의 번호를 입력해주세요"
              value={formData.device_number}
              onChange={(value) => handleInputChange('device_number', value)}
            />
            
            {/* 특이사항 입력 */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <span className="text-blue-500"><User className="w-5 h-5" /></span>
                특이사항
              </label>
              <div className="relative">
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 transition-all shadow-sm resize-none"
                  placeholder="특이사항을 입력해주세요"
                  rows={3}
                />
              </div>
            </div>

          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="mt-6 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm text-center">{error}</p>
            </div>
          )}

          {/* 버튼 */}
          <div className="mt-8 pb-20">
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

interface FormFieldProps {
  icon: React.ReactNode
  label: string
  required?: boolean
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
}

function FormField({ icon, label, required, placeholder, value, onChange }: FormFieldProps) {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
        <span className="text-blue-500">{icon}</span>
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 transition-all shadow-sm"
        />
      </div>
    </div>
  )
}
