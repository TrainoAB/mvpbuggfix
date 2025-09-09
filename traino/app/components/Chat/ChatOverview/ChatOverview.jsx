'use client';
import { useState, useEffect, useRef } from 'react';
import { useHoldTimer } from '@/app/components/Menus/useHoldTimer';
import { playSound } from '@/app/components/PlaySound';
import { useAppState } from '@/app/hooks/useAppState';
import { useLiveContext } from '@/app/context/LiveContext';

import BackButton from '@/app/components/Buttons/BackButton';
import ChatItem from '@/app/components/Chat/ChatOverview/ChatItem';
import HoldDownMenu from '@/app/components/Menus/HoldDownMenu';

import IconDelete from '@/app/components/SVG/IconDelete';

import styles from './ChatOverview.module.css';
import globalStyles from '@/app/styles/global.module.css';

const conversationDataObject = [
  {
    id: 1,
    name: 'John Doe',
    thumb: 'https://picsum.photos/100/100',
    lastMessage: 'Hello there! How are you?',
    lastMessageTime: '2024-12-22T10:00:00Z',
    unreadMessages: 2,
    online: false,
  },
  {
    id: 2,
    name: 'Jane Doe',
    thumb: 'https://picsum.photos/102/103',
    lastMessage: 'Hi',
    lastMessageTime: '2024-12-22T10:00:00Z',
    unreadMessages: 0,
    online: true,
  },
  {
    id: 3,
    name: 'Kevin McLaughlin Önder',
    thumb: 'https://picsum.photos/101/102',
    lastMessage: "Let's get this party started!",
    lastMessageTime: '2024-12-22T16:00:00Z',
    unreadMessages: 1,
    online: true,
  },
  {
    id: 4,
    name: 'Abbas Mansoori',
    thumb: 'https://picsum.photos/104/102',
    lastMessage: 'Vad gör du?',
    lastMessageTime: '2024-12-21T12:00:00Z',
    unreadMessages: 0,
    online: false,
  },
];

export default function ChatOverview() {
  const { DEBUG, settingsSound } = useAppState();
  const { chatVisible, setChatVisible, setChatData } = useLiveContext();

  const [conversationData, setConversationData] = useState(conversationDataObject);
  const [unreadChats, setUnreadChats] = useState(0);
  const [readChats, setReadChats] = useState(0);
  const [menuVisible, setMenuVisible] = useState(false);
  const [clickedId, setClickedId] = useState(null);

  useEffect(() => {
    DEBUG && console.log('Menu visible:', menuVisible, 'Clicked ID:', clickedId);
  }, [menuVisible, clickedId]);

  const handleDeleteConversation = () => {
    DEBUG && console.log('Delete conversation clicked, ID:', clickedId);
    if (typeof clickedId === 'number') {
      // Your delete conversation logic here
      setConversationData(conversationData.filter((chat) => chat.id !== clickedId)); // Remove the conversation from the list
      if (settingsSound) playSound('delete', 0.5);
      DEBUG && console.log(`Conversation with ID ${clickedId} deleted.`);
      setMenuVisible(false); // Close the menu
    }
  };

  const handleLongPress = (chat) => {
    DEBUG && console.log('Long press detected with data:', chat); // Long press action
    if (settingsSound) playSound('swish', 1); // Play sound
    setClickedId(chat.id); // Set the clicked ID
    setMenuVisible(true); // Show menu on long press
  };

  const handleShortPress = (chat) => {
    DEBUG && console.log('Short click detected, return data:', chat); // Short click action
    if (settingsSound) playSound('popclick', 0.5); // Play sound
    setClickedId(chat.id); // Set the clicked ID
    setConversationData((prevData) =>
      prevData.map((item) => (item.id === chat.id ? { ...item, unreadMessages: 0 } : item)),
    );
    setChatData({ chatId: chat.id });
    setChatVisible(false);
    setTimeout(() => {
      setChatVisible(true);
    }, 1);
  };

  // Handle click, tap, and hold events
  const { handleMouseDown, handleMouseUp, handleTouchStart, handleTouchEnd, handleTouchCancel } = useHoldTimer(
    setMenuVisible,
    handleLongPress,
    handleShortPress,
    300,
  );

  useEffect(() => {
    setUnreadChats(conversationData.filter((chat) => chat.unreadMessages > 0).length);
    setReadChats(conversationData.filter((chat) => chat.unreadMessages === 0).length);
  }, [conversationData]);

  // MARK: Markup
  return (
    <>
      <HoldDownMenu
        data={clickedId}
        buttons={[
          {
            icon: <IconDelete />,
            text: 'Ta bort konversation',
            action: handleDeleteConversation, // Call delete function
          },
        ]}
        visible={menuVisible}
        setShow={setMenuVisible}
        sound={settingsSound}
      />

      <main className={globalStyles.main}>
        <div className={globalStyles.topColor}></div>
        <div className={styles.header}>
          <BackButton buttonStyle="regular" sound={settingsSound} />
          <h1>Chat</h1>
          <div></div>
        </div>
        <div className={styles.mainContainer}>
          <div className={styles.mainContent}>
            {unreadChats !== 0 && (
              <>
                <h2>
                  Olästa <span className={styles.number}>{unreadChats}</span>
                </h2>

                <div style={{ marginBottom: '1.875rem' }}>
                  {conversationData
                    .filter((chat) => chat.unreadMessages > 0)
                    .map((chat, index) => (
                      <ChatItem
                        key={index}
                        chat={chat}
                        read={false}
                        sound={settingsSound}
                        onTouchStart={(e) => handleTouchStart(e, chat)}
                        onTouchEnd={(e) => handleTouchEnd(e, chat)}
                        onTouchCancel={handleTouchCancel}
                        onMouseDown={(e) => handleMouseDown(e, chat)}
                        onMouseUp={(e) => handleMouseUp(e, chat)}
                        onContextMenu={(e) => e.preventDefault()}
                      />
                    ))}
                </div>
              </>
            )}

            {readChats !== 0 && (
              <>
                <h2>
                  Lästa <span className={styles.number}>{readChats}</span>
                </h2>
                <div style={{ marginBottom: '1.875rem' }}>
                  {conversationData
                    .filter((chat) => chat.unreadMessages === 0)
                    .map((chat, index) => (
                      <ChatItem
                        key={index}
                        chat={chat}
                        read={true}
                        sound={settingsSound}
                        onTouchStart={(e) => handleTouchStart(e, chat)}
                        onTouchEnd={(e) => handleTouchEnd(e, chat)}
                        onTouchCancel={(e) => handleTouchCancel(e, chat)}
                        onMouseDown={(e) => handleMouseDown(e, chat)}
                        onMouseUp={(e) => handleMouseUp(e, chat)}
                        onContextMenu={(e) => e.preventDefault()}
                      />
                    ))}
                </div>
              </>
            )}
          </div>
        </div>
      </main>
      <div className={globalStyles.extraGrayBg}></div>
    </>
  );
}
