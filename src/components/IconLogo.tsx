import React from 'react'

export function IconLogo({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Panda Ears */}
      <circle cx="30" cy="30" r="10" fill="currentColor" className="text-foreground" />
      <circle cx="70" cy="30" r="10" fill="currentColor" className="text-foreground" />
      
      {/* Panda Face Base */}
      <circle cx="50" cy="55" r="35" stroke="currentColor" strokeWidth="2" className="text-foreground" />
      
      {/* Panda Eyes (Patches) */}
      <ellipse cx="40" cy="50" rx="8" ry="10" fill="currentColor" className="text-foreground" />
      <ellipse cx="60" cy="50" rx="8" ry="10" fill="currentColor" className="text-foreground" />
      
      {/* Download Arrow integrated as Nose/Mouth area */}
      <path 
        d="M50 65V85M50 85L40 75M50 85L60 75" 
        stroke="currentColor" 
        strokeWidth="3" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        className="text-accent"
      />
      
      {/* Technical accents */}
      <path d="M10 50L20 50M80 50L90 50" stroke="currentColor" strokeWidth="1" className="text-accent opacity-30" />
    </svg>
  )
}
