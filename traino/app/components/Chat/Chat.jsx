'use client';
import { useState, useEffect, useRef } from 'react';
import { useAppState } from '@/app/hooks/useAppState';
import { useHoldTimer } from '@/app/components/Menus/useHoldTimer';
import { playSound } from '@/app/components/PlaySound';
import ChatMessage from '@/app/components/Chat/ChatMessage';
import ChatInput from '@/app/components/Chat/ChatInput';
import BackButton from '@/app/components/Buttons/BackButton';
import ProfileThumb from '@/app/components/Profile/ProfileThumb';
import IconButton from '@/app/components/Buttons/IconButton';
import HoldDownMenu from '@/app/components/Menus/HoldDownMenu';

// Import SVG icons
import IconDelete from '@/app/components/SVG/IconDelete';
import IconVideo from '@/app/components/SVG/IconVideo';
import IconPhoneCall from '@/app/components/SVG/IconPhoneCall';

// Import CSS
import styles from './Chat.module.css';
import globalStyles from '@/app/styles/global.module.css';

// Fake data object
const chatDataObject = {
  user_id: 175,
  alias: 'fredrikberglund',
  name: 'Fredrik Berglund',
  thumb: 'https://picsum.photos/100/100',
  unreadMessages: 2,
  online: true,
  messages: [
    {
      id: 1,
      user_id: 175,
      alias: 'fredrikberglund',
      sender: 'Fredrik Berglund',
      content: 'Hello! How are you?',
      timestamp: '2023-10-01T10:00:00Z',
      type: 'text',
    },
    {
      id: 2,
      user_id: 200166,
      alias: null,
      sender: 'Jane Smith',
      content: 'I am good, thank you! How about you?',
      timestamp: '2023-10-01T10:05:00Z',
      type: 'text',
    },
    {
      id: 3,
      user_id: 175,
      alias: 'fredrikberglund',
      sender: 'Fredrik Berglund',
      content: 'I am doing well, thanks for asking.',
      timestamp: '2023-10-01T10:10:00Z',
      type: 'text',
    },
    {
      id: 4,
      user_id: 200166,
      sender: 'Jane Smith',
      alias: null,
      content: 'Check out this picture!',
      timestamp: '2023-10-01T10:15:00Z',
      type: 'text',
    },
    {
      id: 5,
      user_id: 200166,
      sender: 'Jane Smith',
      alias: null,
      content: 'https://picsum.photos/1080/1920',
      timestamp: '2023-10-01T10:16:00Z',
      type: 'image',
    },
  ],
};

// Chat component
export default function Chat() {
  const { DEBUG, settingsSound, settingsTheme, chatVisible, setChatVisible, chatData, setChatData } = useAppState();
  const [menuVisible, setMenuVisible] = useState(false);
  const [clickedId, setClickedId] = useState(null);

  const inputRef = useRef(null);
  const messagesEndRef = useRef(null); // Ref to the bottom of the chat

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    // Focus on the textarea when Chat.jsx loads
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [chatVisible]);

  useEffect(() => {
    // Scroll to bottom whenever chatData.messages changes
    scrollToBottom();
  }, [setChatData, chatData]);

  useEffect(() => {
    if (chatVisible) {
      const existingMessages = chatData?.messages || [];
      const newMessages = chatDataObject.messages;

      // Merge new messages and remove duplicates based on message ID
      const mergedMessages = [
        ...existingMessages,
        ...newMessages.filter((newMessage) => !existingMessages.some((msg) => msg.id === newMessage.id)),
      ];

      DEBUG && console.log('Merged Messages Before Updating State:', mergedMessages);

      // Update the state with merged data
      setChatData((prevChatData) => ({
        ...prevChatData,
        ...chatDataObject,
        messages: mergedMessages,
      }));
    }
  }, [chatVisible]);

  const handleDeleteMessage = () => {
    DEBUG && console.log('Delete message clicked, ID:', clickedId);
    if (typeof clickedId === 'number') {
      // Your delete conversation logic here
      setChatData((prevData) => ({
        ...prevData, // Keep other parts of chatData intact
        messages: prevData.messages.filter((message) => message.id !== clickedId), // Remove only the selected message
      }));
      if (settingsSound) playSound('delete', 0.5);
      DEBUG && console.log(`Message with ID ${clickedId} deleted.`);
      setMenuVisible(false); // Close the menu
    }
  };

  const handleLongPress = (message) => {
    DEBUG && console.log(chatData);
    DEBUG && console.log('Sender:', JSON.stringify(message.sender), 'Name:', JSON.stringify(chatDataObject.name));

    // Ensure sender and name are normalized and comparable
    const normalize = (str) => String(str).trim().toLowerCase();

    if (normalize(message.sender) !== normalize(chatDataObject.name)) {
      DEBUG && console.log('Condition failed: No menu should appear.');
      return;
    } // Only allow long press on own messages

    DEBUG && console.log('Long press detected with data:', message); // Long press action
    if (settingsSound) playSound('swish', 1); // Play sound
    setClickedId(message.id); // Set the clicked ID
    setMenuVisible(true); // Show menu on long press
  };

  const handleShortPress = (message) => {
    DEBUG && console.log('Short click detected, return data:', message); // Short click action
  };

  // Handle click, tap, and hold events
  const { handleMouseDown, handleMouseUp, handleTouchStart, handleTouchEnd, handleTouchCancel } = useHoldTimer(
    null,
    handleLongPress,
    handleShortPress,
    300,
  );

  if (!chatVisible) return null;

  if (chatData === null) {
    alert('No chat data available');
    setChatVisible(false);
    return null;
  }

  // MARK: Markup
  return (
    <>
      <HoldDownMenu
        data={clickedId}
        buttons={[
          {
            icon: <IconDelete />,
            text: 'Ta bort',
            action: handleDeleteMessage, // Call delete function
          },
        ]}
        visible={menuVisible}
        setShow={setMenuVisible}
        sound={settingsSound}
      />
      {chatData !== null && (
        <>
          <div className={`${styles.main} ${globalStyles.fixedPosition} ${styles.chatContainer}`}>
            <div className={styles.chat}>
              <div className={`${styles.header} ${styles.headerSmallLeft}`}>
                <BackButton
                  src={chatData.thumb}
                  online={chatData.online}
                  buttonStyle="smallarrow"
                  onClick={() => setChatVisible(false)}
                  sound={settingsSound}
                />
                <div className={styles.chatHeader}>
                  <ProfileThumb size="small" online={chatData.online} sound={false} />
                  <div className={styles.chatName}>
                    <h3>{chatData.name}</h3>
                  </div>
                </div>
                <div className={styles.chatMenu}>
                  <IconButton icon={<IconVideo className={styles.iconVideo} />} sound={settingsSound} />
                  <IconButton icon={<IconPhoneCall className={styles.iconPhoneCall} />} sound={settingsSound} />
                </div>
              </div>
              <div className={styles.mainContainer}>
                <div className={styles.mainContent}>
                  {chatData &&
                    chatData.messages &&
                    chatData.messages.map((message, index) => (
                      <ChatMessage
                        message={message}
                        name={chatData.name}
                        key={index}
                        onTouchStart={(e) => handleTouchStart(e, message)}
                        onTouchEnd={(e) => handleTouchEnd(e, message)}
                        onTouchCancel={handleTouchCancel}
                        onMouseDown={(e) => handleMouseDown(e, message)}
                        onMouseUp={(e) => handleMouseUp(e, message)}
                        onContextMenu={(e) => e.preventDefault()}
                      />
                    ))}
                  <div ref={messagesEndRef} /> {/* Scroll target */}
                </div>
              </div>
              <ChatInput data={chatData} setData={setChatData} textAreaRef={inputRef} />
            </div>
          </div>
        </>
      )}
    </>
  );
}
