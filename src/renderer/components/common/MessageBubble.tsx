import React from 'react';

interface MessageBubbleProps {
  text: string;
  type: 'character' | 'system';
  timestamp?: number;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  text,
  type,
  timestamp
}) => {
  return (
    <div style={{
      ...styles.container,
      justifyContent: type === 'character' ? 'flex-end' : 'flex-start'
    }}>
      <div style={{
        ...styles.bubble,
        ...(type === 'character' ? styles.characterBubble : styles.systemBubble)
      }}>
        <p style={styles.text}>{text}</p>
        {timestamp && (
          <span style={styles.timestamp}>
            {new Date(timestamp).toLocaleTimeString()}
          </span>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    width: '100%',
    marginBottom: '10px',
    padding: '0 10px'
  },
  bubble: {
    maxWidth: '70%',
    padding: '10px 15px',
    borderRadius: '15px',
    position: 'relative' as const
  },
  characterBubble: {
    backgroundColor: '#007AFF',
    color: 'white',
    borderBottomRightRadius: '5px'
  },
  systemBubble: {
    backgroundColor: '#E9E9EB',
    color: '#000',
    borderBottomLeftRadius: '5px'
  },
  text: {
    margin: 0,
    fontSize: '14px',
    lineHeight: '1.4'
  },
  timestamp: {
    fontSize: '10px',
    color: 'rgba(0, 0, 0, 0.5)',
    position: 'absolute' as const,
    bottom: '-18px',
    right: '5px'
  }
};