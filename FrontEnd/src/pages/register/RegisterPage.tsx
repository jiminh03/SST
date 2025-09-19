import { useState } from 'react'
import { Camera, User, Phone, Smartphone, Calendar } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import AddressSearch from '../../components/common/AddressSearch'
import { createSenior } from '../../api/eldersApi'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    full_name: '',
    birth_date: '',
    address: '',
    guardian_contact: '',
    device_id: '',
    notes: '' // 특이사항
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [profileImage, setProfileImage] = useState<string | null>(null)

  const handleAddressChange = (address: string) => {
    setFormData(prev => ({ ...prev, address }))
  }

  const handleBirthDateChange = (date: string) => {
    setFormData(prev => ({ ...prev, birth_date: date }))
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      console.log('📷 이미지 파일 선택:', {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      })
      
      // 파일 크기 체크 (5MB 제한)
      if (file.size > 5 * 1024 * 1024) {
        alert('파일 크기는 5MB 이하여야 합니다.')
        return
      }
      
      // 이미지 파일 타입 체크
      if (!file.type.startsWith('image/')) {
        alert('이미지 파일만 업로드 가능합니다.')
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        console.log('📷 이미지 미리보기 생성 완료')
        setProfileImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleImageDelete = () => {
    setProfileImage(null)
    // 파일 입력 필드 초기화
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    if (fileInput) {
      fileInput.value = ''
    }
  }


  const handleSubmit = async () => {
    // 필수 필드 검증
    if (!formData.full_name.trim()) {
      setError('이름을 입력해주세요.')
      return
    }
    if (!formData.birth_date.trim()) {
      setError('생년월일을 입력해주세요.')
      return
    }
    if (!formData.address.trim()) {
      setError('주소를 입력해주세요.')
      return
    }
    if (!formData.device_id.trim()) {
      setError('연동 기기 번호를 입력해주세요.')
      return
    }
    

    try {
      setIsSubmitting(true)
      setError(null)

      // 프로필 사진 파일 가져오기
      const profileImageFile = document.querySelector('input[type="file"]') as HTMLInputElement
      const file = profileImageFile?.files?.[0]
      
      console.log('📤 등록 시 파일 정보:', {
        hasFile: !!file,
        fileName: file?.name,
        fileSize: file?.size,
        fileType: file?.type
      })
      
      // 기본 이미지 파일 생성 (프로필 사진이 없을 때)
      const defaultImageFile = new File([''], 'default.png', { type: 'image/png' })
      
      // API 호출
      await createSenior({
        full_name: formData.full_name,
        address: formData.address,
        birth_date: formData.birth_date,
        guardian_contact: formData.guardian_contact,
        device_id: formData.device_id,
        health_info: formData.notes,
        profile_img: file || defaultImageFile
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
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 shadow-xl flex items-center justify-center border-4 border-white ring-4 ring-gray-100 overflow-hidden">
                {profileImage ? (
                  <img 
                    src={profileImage} 
                    alt="프로필" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-20 h-20 text-white" />
                )}
              </div>
              <label className="absolute -bottom-2 -right-5 text-white p-2 rounded-full shadow-xl transition-all duration-200 hover:scale-110 cursor-pointer"
                style={{ backgroundColor: '#0088FF' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0066CC'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0088FF'}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
              
              {/* 이미지 삭제 버튼 */}
              {profileImage && (
                <button 
                  onClick={handleImageDelete}
                  className="absolute -top-2 -right-2 text-white rounded-full shadow-lg transition-all duration-200 hover:scale-110 cursor-pointer"
                  style={{ backgroundColor: '#ef4444', padding: '4px' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ef4444'}
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <p className="text-sm text-gray-600 mt-4">
              {profileImage ? '프로필 사진이 등록되었습니다' : '프로필 사진을 추가해주세요'}
            </p>
          </div>


          {/* 폼 섹션 */}
          <div className="space-y-6">
            <FormField 
              icon={<User className="w-5 h-5" />}
              label="이름" 
              required 
              placeholder="이름을 입력해주세요"
              value={formData.full_name}
              onChange={(value) => handleInputChange('full_name', value)}
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
              placeholder="예) 010-1234-5678"
              value={formData.guardian_contact}
              onChange={(value) => handleInputChange('guardian_contact', value)}
            />
            <FormField 
              icon={<Smartphone className="w-5 h-5" />}
              label="연동 기기 번호" 
              required 
              placeholder="연동된 기기의 번호를 입력해주세요"
              value={formData.device_id}
              onChange={(value) => handleInputChange('device_id', value)}
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
