export default function RegisterIcon({ size = 32, color = "#AFAFAF" }: { size?: number; color?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 76 76"
      fill="none"
    >
      <g clipPath="url(#clip0_176_5086)">
        <path
          d="M28.5 38C38.9934 38 47.5 29.4934 47.5 19C47.5 8.50659 38.9934 0 28.5 0C18.0066 0 9.5 8.50659 9.5 19C9.5 29.4934 18.0066 38 28.5 38Z"
          fill={color}
        />
        <path
          d="M41.3028 44.3359H15.6972C11.5356 44.341 7.54585 45.9964 4.60315 48.9391C1.66045 51.8818 0.00502812 55.8715 0 60.0331L0 76.0026H57V60.0331C56.995 55.8715 55.3396 51.8818 52.3969 48.9391C49.4542 45.9964 45.4644 44.341 41.3028 44.3359Z"
          fill={color}
        />
        <path
          d="M66.4993 31.664V22.1641H60.166V31.664H50.666V37.9974H60.166V47.4974H66.4993V37.9974H75.9993V31.664H66.4993Z"
          fill={color}
        />
      </g>
      <defs>
        <clipPath id="clip0_176_5086">
          <rect width="76" height="76" fill="white" />
        </clipPath>
      </defs>
    </svg>
  )
}
