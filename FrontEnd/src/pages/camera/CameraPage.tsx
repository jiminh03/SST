import { Camera } from 'lucide-react'

export default function CameraPage() {
  return (
    <div className="h-full bg-gray-50">
      {/* 카메라 화면 - 전체 화면 */}
      <div className="h-full bg-gray-100 flex items-center justify-center">
        <div className="text-center text-gray-400">
          <Camera className="w-16 h-16 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">카메라 대기 중</h3>
          <p className="text-sm">위험 상황 발생 시 실시간 스트리밍이 시작됩니다</p>
        </div>
      </div>
    </div>
  )
}
