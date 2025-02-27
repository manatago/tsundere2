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
  // テキストを文単位で分割（。!?で終わる文を区切る）
  const sentences = text
    .split(/([。！？])/g)
    .reduce((acc: string[], cur, i, arr) => {
      if (cur.match(/[。！？]/)) {
        // 句読点を前の文に結合
        acc[acc.length - 1] += cur;
      } else if (cur.trim()) {
        acc.push(cur.trim());
      }
      return acc;
    }, []);

  return (
    <div style={styles.container}>
      {sentences.map((sentence, index) => (
        sentence && (
          <div
            key={index}
            style={{
              ...styles.bubbleContainer,
              justifyContent: type === 'character' ? 'flex-end' : 'flex-start'
            }}
          >
            <div style={{
              ...styles.bubble,
              ...(type === 'character' ? styles.characterBubble : styles.systemBubble)
            }}>
              <p style={styles.text}>{sentence}</p>
              {timestamp && index === sentences.length - 1 && (
                <span style={styles.timestamp}>
                  {new Date(timestamp).toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
        )
      ))}
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
    width: '100%',
    overflowX: 'hidden' as const,
    overflowY: 'visible' as const,
    padding: '0 10px'
  },
  bubbleContainer: {
    display: 'flex',
    width: '100%'
  },
  bubble: {
    maxWidth: '70%',
    padding: '10px 15px',
    borderRadius: '15px',
    position: 'relative' as const,
    marginBottom: '4px',
    whiteSpace: 'pre-wrap' as const
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
    lineHeight: '1.4',
    wordBreak: 'break-word' as const,
    overflowWrap: 'break-word' as const
  },
  timestamp: {
    fontSize: '10px',
    color: 'rgba(0, 0, 0, 0.5)',
    position: 'absolute' as const,
    bottom: '-18px',
    right: '5px'
  }
};