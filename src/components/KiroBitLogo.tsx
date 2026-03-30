import React from 'react'

// KiroBit Logo - Modern notepad app with stylized "K" character
export function KiroBitLogo({ variant = "primary", size = "lg" }: { variant?: "primary" | "icon" | "minimal"; size?: "xs" | "sm" | "md" | "lg" }) {
  const sizes = {
    xs: { container: 36, icon: 36 },
    sm: { container: 80, icon: 60 },
    md: { container: 120, icon: 90 },
    lg: { container: 160, icon: 120 }
  };

  const { container, icon } = sizes[size];

  if (variant === "icon") {
    // Icon-only version: Notepad with stylized "K" and binary
    return (
      <svg width={icon} height={icon} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Notepad base */}
        <rect x="40" y="30" width="120" height="150" rx="8" fill="#ffffff" />
        <rect x="50" y="40" width="100" height="130" rx="4" fill="#10b981" />
        
        {/* Spiral binding holes */}
        <circle cx="60" cy="45" r="3" fill="#ffffff" />
        <circle cx="80" cy="45" r="3" fill="#ffffff" />
        <circle cx="100" cy="45" r="3" fill="#ffffff" />
        <circle cx="120" cy="45" r="3" fill="#ffffff" />
        <circle cx="140" cy="45" r="3" fill="#ffffff" />
        
        {/* Stylized "K" character with brush stroke feel */}
        <path d="M 75 75 L 75 135" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M 75 100 L 95 80" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M 75 105 L 95 130" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        
        {/* Binary code (representing 'Bit') */}
        <text x="110" y="85" fill="#d1fae5" fontSize="14" fontFamily="monospace" fontWeight="bold">01</text>
        <text x="110" y="105" fill="#d1fae5" fontSize="14" fontFamily="monospace" fontWeight="bold">10</text>
        <text x="110" y="125" fill="#d1fae5" fontSize="14" fontFamily="monospace" fontWeight="bold">11</text>
        
        {/* Corner fold detail */}
        <path d="M150 40 L150 55 L135 55 Z" fill="#059669" />
        <path d="M150 55 L135 55" stroke="#ffffff" strokeWidth="1" />
      </svg>
    );
  }

  if (variant === "minimal") {
    // Minimal version: Clean geometric design with "K"
    return (
      <svg width={icon} height={icon} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Outer square representing notepad */}
        <rect x="30" y="30" width="140" height="140" rx="12" fill="#ffffff" />
        
        {/* Inner white space */}
        <rect x="45" y="55" width="110" height="110" rx="6" fill="#10b981" />
        
        {/* Top bar (binding) */}
        <rect x="30" y="30" width="140" height="20" rx="12" fill="#d1fae5" />
        
        {/* Large stylized "K" */}
        <path d="M 70 75 L 70 145" stroke="#ffffff" strokeWidth="8" strokeLinecap="round" />
        <path d="M 70 105 L 110 75" stroke="#ffffff" strokeWidth="7" strokeLinecap="round" />
        <path d="M 70 110 L 110 145" stroke="#ffffff" strokeWidth="7" strokeLinecap="round" />
        
        {/* Binary dots accent */}
        <circle cx="130" cy="85" r="4" fill="#d1fae5" />
        <circle cx="130" cy="105" r="4" fill="#d1fae5" />
        <circle cx="130" cy="125" r="4" fill="#ffffff" />
      </svg>
    );
  }

  // Primary version: Full logo with notepad, stylized "K", and tech details
  return (
    <svg width={container} height={container} viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Shadow */}
      <ellipse cx="120" cy="215" rx="70" ry="8" fill="#000000" opacity="0.1" />
      
      {/* Main notepad body */}
      <rect x="50" y="40" width="140" height="170" rx="10" fill="#ffffff" />
      
      {/* Paper/content area */}
      <rect x="65" y="65" width="110" height="130" rx="6" fill="#10b981" />
      
      {/* Spiral binding at top */}
      <rect x="50" y="40" width="140" height="18" rx="10" fill="#d1fae5" />
      {/* Spiral coils */}
      <circle cx="75" cy="49" r="4" fill="#10b981" opacity="0.7" />
      <circle cx="95" cy="49" r="4" fill="#10b981" opacity="0.7" />
      <circle cx="115" cy="49" r="4" fill="#10b981" opacity="0.7" />
      <circle cx="135" cy="49" r="4" fill="#10b981" opacity="0.7" />
      <circle cx="155" cy="49" r="4" fill="#10b981" opacity="0.7" />
      <circle cx="175" cy="49" r="4" fill="#10b981" opacity="0.7" />
      
      {/* Bold stylized "K" with calligraphic feel */}
      <g transform="translate(75, 80)">
        {/* Vertical stroke of K */}
        <path d="M 0 5 L 0 55" stroke="#ffffff" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
        {/* Upper diagonal */}
        <path d="M 0 25 L 30 5" stroke="#ffffff" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
        {/* Lower diagonal */}
        <path d="M 0 30 L 30 55" stroke="#ffffff" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
        {/* Small accent dot (Japanese-inspired) */}
        <circle cx="35" cy="30" r="3" fill="#ffffff" />
      </g>
      
      {/* Binary code pattern (representing 'Bit') */}
      <g transform="translate(125, 85)">
        <text x="0" y="0" fill="#d1fae5" fontSize="16" fontFamily="monospace" fontWeight="bold">01</text>
        <text x="0" y="20" fill="#d1fae5" fontSize="16" fontFamily="monospace" fontWeight="bold">10</text>
        <text x="0" y="40" fill="#d1fae5" fontSize="16" fontFamily="monospace" fontWeight="bold">11</text>
      </g>
      
      {/* Note lines */}
      <line x1="80" y1="145" x2="155" y2="145" stroke="#059669" strokeWidth="2" strokeLinecap="round" />
      <line x1="80" y1="160" x2="150" y2="160" stroke="#059669" strokeWidth="2" strokeLinecap="round" />
      <line x1="80" y1="175" x2="145" y2="175" stroke="#059669" strokeWidth="2" strokeLinecap="round" />
      
      {/* Code brackets decoration */}
      <path d="M 70 135 L 65 145 L 70 155" stroke="#d1fae5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M 165 135 L 170 145 L 165 155" stroke="#d1fae5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      
      {/* Corner page fold */}
      <path d="M 175 65 L 175 85 L 155 85 Z" fill="#ffffff" opacity="0.3" />
      <path d="M 175 85 L 155 85" stroke="#ffffff" strokeWidth="1.5" />
    </svg>
  );
}