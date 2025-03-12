export function RedbellyLogo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <div className="flex items-center">
      {/* Isometric cube logo */}
      <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L3 7V17L12 22L21 17V7L12 2Z" fill="#3A4A5C" stroke="#3A4A5C" strokeWidth="0.5" />
        <path d="M12 2L21 7L12 12L3 7L12 2Z" fill="#4A5A6C" stroke="#4A5A6C" strokeWidth="0.5" />
        <path d="M12 12L12 22L3 17L3 7L12 12Z" fill="#2C3E50" stroke="#2C3E50" strokeWidth="0.5" />
        <path d="M12 12L21 7L21 17L12 22L12 12Z" fill="#34495E" stroke="#34495E" strokeWidth="0.5" />
      </svg>

      <div className="ml-2 font-bold text-xl">
        <span className="text-redbelly-red">RED</span>
        {/* Add a light background to ensure "belly" is visible against dark backgrounds */}
        <span className="text-white bg-opacity-20 bg-black px-1 rounded">BELLY</span>
      </div>
    </div>
  )
}

export function RedbellyLogoSmall({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L3 7V17L12 22L21 17V7L12 2Z" fill="#3A4A5C" stroke="#3A4A5C" strokeWidth="0.5" />
      <path d="M12 2L21 7L12 12L3 7L12 2Z" fill="#4A5A6C" stroke="#4A5A6C" strokeWidth="0.5" />
      <path d="M12 12L12 22L3 17L3 7L12 12Z" fill="#2C3E50" stroke="#2C3E50" strokeWidth="0.5" />
      <path d="M12 12L21 7L21 17L12 22L12 12Z" fill="#34495E" stroke="#34495E" strokeWidth="0.5" />
    </svg>
  )
}

