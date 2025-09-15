import { useState } from 'react'
import { Camera, User, Phone, Smartphone } from 'lucide-react'
import AddressSearch from '../../components/common/AddressSearch'
import DatePicker from '../../components/common/DatePicker'

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    birthDate: '',
    address: '',
    guardianContact: '',
    deviceNumber: ''
  })

  const handleAddressChange = (address: string) => {
    setFormData(prev => ({ ...prev, address }))
  }

  const handleBirthDateChange = (date: string) => {
    setFormData(prev => ({ ...prev, birthDate: date }))
  }

  return (
    <div className="min-h-full bg-white">
      {/* 메인 컨텐츠 */}
      <div className="px-6 py-8">
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
            />
            <DatePicker 
              value={formData.birthDate}
              onChange={handleBirthDateChange}
              placeholder="YYYY-MM-DD"
            />
            <AddressSearch 
              value={formData.address}
              onChange={handleAddressChange}
              placeholder="주소를 검색해주세요"
            />
            <FormField 
              icon={<Phone className="w-5 h-5" />}
              label="보호자 연락처" 
              placeholder="예) 010-1234-5678" 
            />
            <FormField 
              icon={<Smartphone className="w-5 h-5" />}
              label="연동 기기 번호" 
              required 
              placeholder="연동된 기기의 번호를 입력해주세요" 
            />
          </div>

          {/* 등록 버튼 */}
          <div className="mt-8">
            <button className="w-full text-white font-semibold py-4 px-6 rounded-xl shadow-lg transition-colors transform hover:scale-[1.02] active:scale-[0.98]" style={{ backgroundColor: '#0088FF' }}>
              어르신 등록하기
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
}

function FormField({ icon, label, required, placeholder }: FormFieldProps) {
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
          placeholder={placeholder}
          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 transition-all shadow-sm"
        />
      </div>
    </div>
  )
}
