import React from 'react';
import { IconButton } from '../common/IconButton';

interface HeaderProps {
  title: string;
  onSettingsClick?: () => void;
  showSettings?: boolean;
  onBack?: () => void;
  showBack?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  onSettingsClick,
  showSettings = false,
  onBack,
  showBack = false,
}) => {
  return (
    <header style={styles.header}>
      {showBack && (
        <IconButton
          onClick={onBack}
          style={styles.backButton}
          aria-label="戻る"
        >
          ←
        </IconButton>
      )}
      <h1 style={styles.title}>{title}</h1>
      {showSettings && (
        <IconButton
          onClick={onSettingsClick}
          style={styles.settingsButton}
          aria-label="設定"
        >
          ⚙️
        </IconButton>
      )}
    </header>
  );
};

const styles = {
  header: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 20px',
    backgroundColor: '#f8f9fa',
    borderBottom: '1px solid #e9ecef'
  },
  title: {
    margin: 0,
    flexGrow: 1,
    fontSize: '1.5em',
    textAlign: 'center' as const
  },
  backButton: {
    marginRight: 'auto'
  },
  settingsButton: {
    marginLeft: 'auto'
  }
};