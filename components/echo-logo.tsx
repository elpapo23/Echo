export function EchoLogo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <div className="flex items-center">
      <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Sound wave logo */}
        <path
          d="M4 12H6C6 8.69 8.69 6 12 6C15.31 6 18 8.69 18 12H20C20 7.58 16.42 4 12 4C7.58 4 4 7.58 4 12Z"
          fill="#FF4D4D"
          stroke="#FF4D4D"
          strokeWidth="0.5"
        />
        <path
          d="M7 12H9C9 10.34 10.34 9 12 9C13.66 9 15 10.34 15 12H17C17 9.24 14.76 7 12 7C9.24 7 7 9.24 7 12Z"
          fill="#FF4D4D"
          stroke="#FF4D4D"
          strokeWidth="0.5"
        />
        <circle cx="12" cy="12" r="2" fill="#FF4D4D" />
        <path
          d="M12 16C14.21 16 16 14.21 16 12H14C14 13.1 13.1 14 12 14C10.9 14 10 13.1 10 12H8C8 14.21 9.79 16 12 16Z"
          fill="#FF4D4D"
          stroke="#FF4D4D"
          strokeWidth="0.5"
        />
        <path
          d="M12 20C16.42 20 20 16.42 20 12H18C18 15.31 15.31 18 12 18C8.69 18 6 15.31 6 12H4C4 16.42 7.58 20 12 20Z"
          fill="#FF4D4D"
          stroke="#FF4D4D"
          strokeWidth="0.5"
        />
      </svg>

      <span className="ml-2 font-bold text-xl text-redbelly-red">Echo</span>
    </div>
  )
}

export function EchoLogoSmall({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M4 12H6C6 8.69 8.69 6 12 6C15.31 6 18 8.69 18 12H20C20 7.58 16.42 4 12 4C7.58 4 4 7.58 4 12Z"
        fill="#FF4D4D"
        stroke="#FF4D4D"
        strokeWidth="0.5"
      />
      <path
        d="M7 12H9C9 10.34 10.34 9 12 9C13.66 9 15 10.34 15 12H17C17 9.24 14.76 7 12 7C9.24 7 7 9.24 7 12Z"
        fill="#FF4D4D"
        stroke="#FF4D4D"
        strokeWidth="0.5"
      />
      <circle cx="12" cy="12" r="2" fill="#FF4D4D" />
      <path
        d="M12 16C14.21 16 16 14.21 16 12H14C14 13.1 13.1 14 12 14C10.9 14 10 13.1 10 12H8C8 14.21 9.79 16 12 16Z"
        fill="#FF4D4D"
        stroke="#FF4D4D"
        strokeWidth="0.5"
      />
      <path
        d="M12 20C16.42 20 20 16.42 20 12H18C18 15.31 15.31 18 12 18C8.69 18 6 15.31 6 12H4C4 16.42 7.58 20 12 20Z"
        fill="#FF4D4D"
        stroke="#FF4D4D"
        strokeWidth="0.5"
      />
    </svg>
  )
}

