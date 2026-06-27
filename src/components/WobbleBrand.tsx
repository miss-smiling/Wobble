import React from 'react';

export const WobbleLogo: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const dim = size === 'sm' ? 36 : size === 'lg' ? 56 : 44;

  return (
    <div
      className="rounded-2xl bg-[#2D4A3E] flex items-center justify-center shadow-md shrink-0"
      style={{ width: dim, height: dim }}
    >
      <svg
        width={dim * 0.55}
        height={dim * 0.55}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <path
          d="M8 28C8 20 14 14 22 14C26 14 29 15 31 17C33 13 37 10 42 10C42 18 36 24 28 26C30 30 30 34 28 38C22 38 8 36 8 28Z"
          fill="#BF6B4E"
          opacity="0.9"
        />
        <path
          d="M14 32C16 26 20 22 26 22C24 26 24 30 26 34C20 34 16 34 14 32Z"
          fill="#FDFBF7"
          opacity="0.85"
        />
        <circle cx="34" cy="16" r="3" fill="#FDFBF7" />
      </svg>
    </div>
  );
};

export const WobbleBrand: React.FC<{ showTagline?: boolean; size?: 'sm' | 'md' | 'lg' }> = ({
  showTagline = true,
  size = 'md',
}) => (
  <div className="flex items-center gap-3">
    <WobbleLogo size={size} />
    <div>
      <h1
        className={`font-serif italic font-bold text-[#1F1F1F] leading-none ${
          size === 'lg' ? 'text-3xl md:text-4xl' : size === 'sm' ? 'text-xl' : 'text-2xl md:text-3xl'
        }`}
      >
        Wobble
      </h1>
      {showTagline && (
        <p className="text-[10px] md:text-xs font-mono uppercase tracking-widest text-[#BF6B4E] mt-1">
          AI Guardian &amp; Rescue System
        </p>
      )}
    </div>
  </div>
);
