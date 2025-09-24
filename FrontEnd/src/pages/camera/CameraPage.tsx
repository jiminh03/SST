import { useSearchParams } from 'react-router-dom'

export default function CameraPage() {
  const [searchParams] = useSearchParams()
  const from = searchParams.get('from')

  return (
    <div className="h-full bg-gray-50">
      {/* 카메라 영역 */}
      <div className="h-full relative bg-gray-100">
        {/* HTML 파일을 iframe으로 임베드 */}
        <iframe
          src="/viewer.html"
          className="w-full h-full border-0"
          title="카메라 뷰어"
          allowFullScreen
        />
      </div>
    </div>
  )
}