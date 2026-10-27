import React from 'react';

interface BrandLogoProps {
  size?: number;
  className?: string;
}

export function BrandLogo({ size = 26, className = '' }: BrandLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 rounded-[24%] transition-transform hover:scale-105 ${className}`}
      aria-label="SnapExtract Logo"
    >
      {/* Warm Solar Amber Squircle */}
      <rect width="512" height="512" rx="124" fill="#fcd34d" />
      {/* Viewfinder corners + scan line in obsidian slate */}
      <path
        d="M 200 160 L 160 160 L 160 200"
        fill="none"
        stroke="#1c1917"
        strokeWidth="38"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M 312 160 L 352 160 L 352 200"
        fill="none"
        stroke="#1c1917"
        strokeWidth="38"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M 160 312 L 160 352 L 200 352"
        fill="none"
        stroke="#1c1917"
        strokeWidth="38"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M 352 312 L 352 352 L 312 352"
        fill="none"
        stroke="#1c1917"
        strokeWidth="38"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line
        x1="160"
        y1="256"
        x2="352"
        y2="256"
        stroke="#1c1917"
        strokeWidth="38"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default BrandLogo;
