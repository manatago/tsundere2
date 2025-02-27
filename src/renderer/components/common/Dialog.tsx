import React from 'react';

interface DialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
}

export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = '確認',
  cancelText = 'キャンセル'
}) => {
  if (!isOpen) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.dialog}>
        <h3 style={styles.title}>{title}</h3>
        <p style={styles.message}>{message}</p>
        <div style={styles.buttonContainer}>
          <button
            onClick={onCancel}
            style={{ ...styles.button, ...styles.cancelButton }}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            style={{ ...styles.button, ...styles.confirmButton }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  dialog: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '20px',
    minWidth: '300px',
    maxWidth: '90%',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
  },
  title: {
    margin: '0 0 15px 0',
    fontSize: '1.2em',
    fontWeight: 'bold' as const
  },
  message: {
    margin: '0 0 20px 0',
    color: '#666'
  },
  buttonContainer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px'
  },
  button: {
    padding: '8px 16px',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'background-color 0.2s'
  },
  cancelButton: {
    backgroundColor: '#e9ecef',
    color: '#495057',
    ':hover': {
      backgroundColor: '#dee2e6'
    }
  },
  confirmButton: {
    backgroundColor: '#007bff',
    color: 'white',
    ':hover': {
      backgroundColor: '#0056b3'
    }
  }
};