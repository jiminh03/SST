import { useState } from 'react'
import { Camera, User, Phone, Smartphone, Calendar } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import AddressSearch from '../../components/common/AddressSearch'
import { createSenior } from '../../api/eldersApi'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: '',
    birthDate: '',
    address: '',
    guardianContact: '',
    deviceNumber: '',
    healthInfo: '안전', // 기본값
    notes: '' // 특이사항
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAddressChange = (address: string) => {
    setFormData(prev => ({ ...prev, address }))
  }

  const handleBirthDateChange = (date: string) => {
    setFormData(prev => ({ ...prev, birthDate: date }))
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }


  const handleSubmit = async () => {
    // 필수 필드 검증
    if (!formData.name.trim()) {
      setError('이름을 입력해주세요.')
      return
    }
    if (!formData.address.trim()) {
      setError('주소를 입력해주세요.')
      return
    }
    if (!formData.guardianContact.trim()) {
      setError('보호자 연락처를 입력해주세요.')
      return
    }
    if (!formData.deviceNumber.trim()) {
      setError('연동 기기 번호를 입력해주세요.')
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)

      // API 호출
      await createSenior({
        name: formData.name,
        address: formData.address,
        health_info: formData.healthInfo
      })

      // 성공 시 홈 페이지로 이동 (강제 새로고침) - 등록 성공 파라미터 추가
      window.location.href = '/home?registered=true'
    } catch (err) {
      setError('어르신 등록에 실패했습니다. 다시 시도해주세요.')
      console.error('Registration error:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-full bg-white flex flex-col">
      {/* 메인 컨텐츠 - 스크롤 가능 */}
      <div className="flex-1 px-6 py-8 overflow-y-auto">
        <div className="max-w-md mx-auto">
          {/* 프로필 이미지 섹션 */}
          <div className="text-center mb-8">
            <div className="relative inline-block">
              <div className="w-32 h-32 rounded-full bg-white shadow-lg flex items-center justify-center border-4 border-blue-100">
                <User className="w-16 h-16 text-blue-400" />
              </div>
              <button className="absolute -bottom-2 -right-2 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-colors">
                <Camera className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-4">프로필 사진을 추가해주세요</p>
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
                  value={formData.birthDate}
                  onChange={(e) => handleBirthDateChange(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                />
              </div>
            </div>
            <AddressSearch 
              value={formData.address}
              onChange={handleAddressChange}
              placeholder="주소를 검색해주세요"
            />
            <FormField 
              icon={<Phone className="w-5 h-5" />}
              label="보호자 연락처" 
              required
              placeholder="예) 010-1234-5678"
              value={formData.guardianContact}
              onChange={(value) => handleInputChange('guardianContact', value)}
            />
            <FormField 
              icon={<Smartphone className="w-5 h-5" />}
              label="연동 기기 번호" 
              required 
              placeholder="연동된 기기의 번호를 입력해주세요"
              value={formData.deviceNumber}
              onChange={(value) => handleInputChange('deviceNumber', value)}
            />
            
            {/* 특이사항 입력 */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <span className="text-blue-500"><User className="w-5 h-5" /></span>
                특이사항
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="알레르기, 복용약, 특별한 주의사항 등을 입력해주세요"
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 transition-all shadow-sm resize-none"
                rows={3}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 등록 버튼 - 하단 고정 (TabBar 위에) */}
      <div className="px-6 py-4 pb-20 bg-white border-t border-gray-100">
        {/* 에러 메시지 */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm text-center">{error}</p>
          </div>
        )}
        
        <button 
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full text-white font-semibold py-4 px-6 rounded-xl shadow-lg transition-colors transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none" 
          style={{ backgroundColor: '#0088FF' }}
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              등록 중...
            </div>
          ) : (
            '어르신 등록하기'
          )}
        </button>
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
