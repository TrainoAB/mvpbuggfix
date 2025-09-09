/* ChatItem props:

   chat: Object containing chat mapped data
   read: true/false if the chat is read or not
   onClick: Function that runs when the chat is clicked
   sound: true/false if sound should play when the chat is clicked or hovered
   ...handlers: Event handlers for touch, mouse, and context menu to work with HoldDownMenu
*/

import { useState } from 'react';
import { playSound } from '@/app/components/PlaySound';
import { formatTimestamp } from '@/app/functions/formatFunctions';
import ProfileThumb from '@/app/components/Profile/ProfileThumb';

import styles from './ChatItem.module.css';

export default function ChatItem({
  chat = null,
  read = false,
  onClick = null,
  sound = true,
  onTouchStart,
  onTouchEnd,
  onTouchCancel,
  onMouseDown,
  onMouseUp,
  onContextMenu,
}) {
  const [clicked, setClicked] = useState(false);

  const handleClick = (e) => {
    if (sound) playSound('popclick', 0.5);
    if (clicked) return;
    if (typeof onClick === 'function') {
      onClick(chat);
    }
    setClicked(true);
  };

  const handleMouseOver = () => {
    if (sound) playSound('tickclick', 0.5);
  };

  // MARK: Markup
  return (
    <>
      {chat !== null && (
        <div
          className={read ? `${styles.chatItem} ${styles.chatItemRead}` : styles.chatItem}
          onMouseOver={handleMouseOver}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          onTouchCancel={onTouchCancel}
          onMouseDown={onMouseDown}
          onMouseUp={onMouseUp}
          onContextMenu={onContextMenu}
        >
          <ProfileThumb src={chat.thumb} online={chat.online} disabled={read} />
          <div className={styles.chatDetails}>
            <h3>{chat.name}</h3>
            <p>{chat.lastMessage}</p>
            <span>{formatTimestamp(chat.lastMessageTime)}</span>
          </div>
          {!read && <span className={styles.unreadMessages}>{chat.unreadMessages}</span>}
        </div>
      )}
    </>
  );
}
