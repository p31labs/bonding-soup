import React from 'react';

interface K4LogoProps {
  width?: number;
  height?: number;
  fill?: string;
  className?: string;
}

const K4Logo: React.FC<K4LogoProps> = ({ width = 24, height = 24, fill = "none", className }) => {
  return (
    <svg
      viewBox="0 0 100 100"
      width={width}
      height={height}
      fill={fill}
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path
        d="M50 10 L90 85 L10 85 Z"
        stroke="var(--p31-teal)"
        strokeWidth="5"
        strokeLinejoin="round"
      />
      <path
        d="M50 10 L50 60 L90 85"
        stroke="var(--p31-coral)"
        strokeWidth="5"
        strokeLinejoin="round"
        opacity="0.8"
      />
      <path
        d="M50 60 L10 85"
        stroke="var(--p31-amber)"
        strokeWidth="5"
        strokeLinejoin="round"
        opacity="0.6"
      />
    </svg>
  );
};

export default K4Logo;
