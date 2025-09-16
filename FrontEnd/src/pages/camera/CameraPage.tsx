import { useLocation } from 'react-router-dom'
import { Camera, AlertTriangle } from 'lucide-react'

export default function CameraPage() {
  const location = useLocation()
  const urlParams = new URLSearchParams(location.search)
  const isStreaming = urlParams.get('streaming') === 'true'
  const seniorId = urlParams.get('seniorId')
  const seniorName = urlParams.get('seniorName')

  if (isStreaming) {
    return (
      <div className="h-full bg-black relative">
        {/* 스트리밍 화면 */}
        <div className="h-full flex items-center justify-center relative">
          {/* 실제 스트리밍 영역 (현재는 플레이스홀더) */}
          <div className="w-full h-full bg-gray-900 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="w-32 h-32 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <AlertTriangle className="w-16 h-16 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">실시간 스트리밍</h3>
              <p className="text-gray-300 mb-4">{seniorName}님의 위험 상황 모니터링</p>
              <div className="text-sm text-gray-400">
                <p>위험 상황이 감지되어 실시간 스트리밍이 시작되었습니다</p>
                <p>상황을 확인하고 적절한 조치를 취해주세요</p>
              </div>
            </div>
          </div>


          {/* 상단 정보 */}
          <div className="absolute top-6 left-6 bg-red-600 text-white px-4 py-2 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span className="font-semibold">위험 상황 감지</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

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
