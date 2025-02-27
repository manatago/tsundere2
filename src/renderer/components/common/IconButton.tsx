import React, { useState } from 'react';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export const IconButton: React.FC<IconButtonProps> = ({
  children,
  style,
  ...props
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      style={{
        background: 'none',
        border: 'none',
        padding: '8px',
        cursor: 'pointer',
        borderRadius: '4px',
        fontSize: '1.2em',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#666',
        transition: 'background-color 0.2s',
        backgroundColor: isHovered ? 'rgba(0, 0, 0, 0.05)' : 'transparent',
        ...style
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...props}
    >
      {children}
    </button>
  );
};