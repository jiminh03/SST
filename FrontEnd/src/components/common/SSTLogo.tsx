interface SSTLogoProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function SSTLogo({ size = 'md', className = '' }: SSTLogoProps) {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32'
  }

  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {/* 육각형 테두리 */}
        <polygon
          points="50,5 85,25 85,75 50,95 15,75 15,25"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        
        {/* 집 지붕 */}
        <polygon
          points="25,25 50,15 75,25"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        
        {/* SST 텍스트 */}
        <text
          x="50"
          y="60"
          textAnchor="middle"
          fontSize="20"
          fontWeight="bold"
          fill="currentColor"
          fontFamily="Arial, sans-serif"
        >
          SST
        </text>
        
        {/* 하트 */}
        <path
          d="M50,35 C45,30 35,30 35,40 C35,50 50,65 50,65 C50,65 65,50 65,40 C65,30 55,30 50,35 Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        
        {/* Wi-Fi 신호 */}
        <path
          d="M75,20 Q80,15 85,20 Q80,25 75,20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M75,15 Q82,8 89,15 Q82,22 75,15"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M75,10 Q85,0 95,10 Q85,20 75,10"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  )
}
