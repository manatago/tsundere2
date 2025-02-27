import React from 'react';

interface LoadingSpinnerProps {
  isVisible: boolean;
  text?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  isVisible,
  text = '読み込み中...'
}) => {
  if (!isVisible) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.spinner}></div>
      {text && <p style={styles.text}>{text}</p>}
    </div>
  );
};

const spinnerKeyframes = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

// スタイルを動的に追加
const styleSheet = document.createElement('style');
styleSheet.textContent = spinnerKeyframes;
document.head.appendChild(styleSheet);

const styles = {
  overlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #3498db',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  text: {
    marginTop: '15px',
    color: '#666',
    fontSize: '14px'
  }
};