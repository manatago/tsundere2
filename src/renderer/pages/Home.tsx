import React, { useState, useEffect } from 'react';
import { ipcRenderer } from 'electron';
import { Header } from '../components/layout/Header';
import { MessageBubble } from '../components/common/MessageBubble';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import characterImage from '../../assets/base_image.png';

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  description: string | null;
  location: string | null;
}

interface EventsResponse {
  events: CalendarEvent[];
  message: string;
  date: string;
}

type DateType = 'yesterday' | 'today' | 'tomorrow';

export const Home: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<DateType>('today');

  const fetchEvents = async (type: DateType) => {
    setLoading(true);
    setError(null);
    try {
      const response = await ipcRenderer.invoke('calendar:get-events', type);
      if (response.success) {
        setEvents(response.events);
        setMessage(response.message);
      } else {
        throw new Error(response.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'イベントの取得に失敗しました');
      setEvents([]);
      setMessage(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents(selectedDate);
  }, [selectedDate]);

  const handleDateSelect = (type: DateType) => {
    setSelectedDate(type);
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div style={styles.container}>
      <Header
        title="TSUNDERE-CALENDAR"
        showSettings
        onSettingsClick={() => window.location.hash = '#settings'}
      />
      
      <main style={styles.main}>
        <div style={styles.characterContainer}>
          <img
            src={characterImage}
            alt="Character"
            style={styles.characterImage}
          />
        </div>

        <div style={styles.contentWrapper}>
          <div style={styles.content}>
            {events.length > 0 && (
              <div style={styles.eventList}>
                {events.map(event => (
                  <div key={event.id} style={styles.eventItem}>
                    <div style={styles.eventTime}>
                      {formatTime(event.start)}～{formatTime(event.end)}
                    </div>
                    <div style={styles.eventTitle}>
                      {event.title}
                      {event.location && (
                        <div style={styles.eventLocation}>
                          @ {event.location}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {message && (
              <MessageBubble
                text={message}
                type="character"
                timestamp={Date.now()}
              />
            )}
          </div>
        </div>

        <div style={styles.buttonContainer}>
          <button
            onClick={() => handleDateSelect('yesterday')}
            style={{
              ...styles.button,
              ...(selectedDate === 'yesterday' ? styles.selectedButton : {})
            }}
          >
            昨日の予定
          </button>
          <button
            onClick={() => handleDateSelect('today')}
            style={{
              ...styles.button,
              ...(selectedDate === 'today' ? styles.selectedButton : {})
            }}
          >
            今日の予定
          </button>
          <button
            onClick={() => handleDateSelect('tomorrow')}
            style={{
              ...styles.button,
              ...(selectedDate === 'tomorrow' ? styles.selectedButton : {})
            }}
          >
            明日の予定
          </button>
        </div>
      </main>

      <LoadingSpinner isVisible={loading} text="予定を確認しています..." />

      {error && (
        <div style={styles.error}>
          {error}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column' as const,
    backgroundColor: '#f5f5f5',
    overflow: 'hidden'
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    position: 'relative' as const,
    overflow: 'hidden'
  },
  characterContainer: {
    display: 'flex',
    justifyContent: 'center',
    padding: '20px 0',
    backgroundColor: '#fff'
  },
  characterImage: {
    width: '30%',
    height: 'auto',
    objectFit: 'contain' as const
  },
  contentWrapper: {
    flex: 1,
    overflow: 'hidden',
    position: 'relative' as const
  },
  content: {
    height: '100%',
    overflowY: 'auto' as const,
    overflowX: 'hidden' as const,
    padding: '20px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px'
  },
  eventList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px'
  },
  eventItem: {
    display: 'flex',
    alignItems: 'flex-start',
    padding: '10px',
    borderBottom: '1px solid #eee',
    backgroundColor: 'white',
    borderRadius: '4px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  eventTime: {
    minWidth: '120px',
    color: '#666',
    fontSize: '14px'
  },
  eventTitle: {
    flex: 1,
    wordBreak: 'break-word' as const
  },
  eventLocation: {
    fontSize: '12px',
    color: '#666',
    marginTop: '4px'
  },
  buttonContainer: {
    display: 'flex',
    justifyContent: 'center',
    gap: '10px',
    padding: '20px',
    borderTop: '1px solid #eee',
    backgroundColor: 'white',
    position: 'sticky' as const,
    bottom: 0
  },
  button: {
    padding: '10px 20px',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: '#f0f0f0',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'background-color 0.2s'
  },
  selectedButton: {
    backgroundColor: '#007bff',
    color: 'white'
  },
  error: {
    position: 'fixed' as const,
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: '#ff5555',
    color: 'white',
    padding: '10px 20px',
    borderRadius: '4px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
    zIndex: 1000
  }
};