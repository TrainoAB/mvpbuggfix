/* ChatMessage props:

    message: Object containing message data,
    name: Name of the user to compare with the sender,
    ...handlers: Event handlers for touch, mouse, and context menu to work with HoldDownMenu
*/

import { formatTimestamp } from '@/app/functions/formatFunctions.js';

import styles from './ChatMessage.module.css';

export default function ChatMessage({
  message = null,
  name = null,
  onTouchStart = null,
  onTouchEnd = null,
  onTouchCancel = null,
  onMouseDown = null,
  onMouseUp = null,
  onContextMenu = null,
}) {
  const renderMessageContent = () => {
    switch (message.type) {
      case 'text':
        return (
          <div className={styles.messageContent}>
            <pre>{message.content}</pre>
          </div>
        );

      case 'image':
        return <img src={message.content} alt="Sent image" className={styles.messageImage} />;

      case 'video':
        return (
          <video controls className={styles.messageVideo}>
            <source src={message.content} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        );

      case 'recording':
        return (
          <audio controls className={styles.messageAudio}>
            <source src={message.content} type="audio/mpeg" />
            Your browser does not support the audio element.
          </audio>
        );

      case 'file':
        return (
          <a href={message.content} download className={styles.messageFile}>
            Download File
          </a>
        );

      case 'link':
        return (
          <a href={message.content} target="_blank" rel="noopener noreferrer" className={styles.messageLink}>
            {message.content}
          </a>
        );

      default:
        return <div className={styles.messageContent}>Unsupported message type</div>;
    }
  };

  if (message === null) return null;

  // MARK: Markup
  return (
    <div
      className={`${styles.message} ${message.sender === name ? styles.messageSent : styles.messageReceived}`}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchCancel}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onContextMenu={onContextMenu}
    >
      <svg
        width="45"
        height="27"
        viewBox="0 0 45 27"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        className={styles.iconBubble}
      >
        <path d="M41 0H-2.28882e-05L20 26.5L41 5.5C45.5 1 46 0 41 0Z" className={styles.iconBubbleColor} />
      </svg>

      {renderMessageContent()}
      <div className={styles.messageTimestamp}>{formatTimestamp(message.timestamp)}</div>
    </div>
  );
}
