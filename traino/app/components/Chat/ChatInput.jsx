import { useState, useRef } from 'react';
import { useAppState } from '@/app/hooks/useAppState';
import { playSound } from '@/app/components/PlaySound';

// Import SVG icons
import IconPaperclip from '@/app/components/SVG/IconPaperclip';
import IconCamera from '@/app/components/SVG/IconCamera';
import IconSmiley from '@/app/components/SVG/IconSmiley';
import IconButton from '@/app/components/Buttons/IconButton';
import IconSend from '@/app/components/SVG/IconSend';
import IconSoundRecord from '@/app/components/SVG/IconSoundRecord';

// Import CSS
import styles from './ChatInput.module.css';

// ChatInput component
export default function ChatInput({ data = null, setData = null, textAreaRef }) {
  const { DEBUG, settingsSound } = useAppState();
  const [inputValue, setInputValue] = useState('');

  // Function to send the message (Type: text)
  const sendMessage = () => {
    if (!inputValue.trim()) return;

    const newMessage = {
      id: Date.now(), // Use timestamp as a unique ID
      user_id: data.user_id, // Example sender ID (adjust based on context)
      alias: data.alias, // Alias can be dynamic
      sender: data.name, // Example sender name
      content: inputValue,
      timestamp: new Date().toISOString(),
      type: 'text',
    };

    // Append the new message to the existing data
    setData((prevData) => ({
      ...prevData,
      messages: [...prevData.messages, newMessage],
    }));

    if (settingsSound) playSound('notification', 0.05); // Play sound effect

    DEBUG && console.log('Message Sent:', newMessage);

    // Clear the input field
    setInputValue('');
    textAreaRef.current.style.height = '2.9rem';
  };

  // Handle keydown event  (Type: text)
  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault(); // Prevent the default 'Enter' behavior (new line in input)
      if (inputValue.trim() === '') return; // Prevent sending empty messages
      if (settingsSound) playSound('popclick', 0.5);
      sendMessage(); // Trigger sending the message
    }
  };

  const startVoiceRecord = () => {
    // Function to start voice recording
    console.log('Voice recording started');
  };

  const handleSmiley = () => {
    // Function to handle smiley
    console.log('Smiley clicked');
  };

  const handleTakePhoto = () => {
    // Function to handle smiley
    console.log('Take photo clicked');
  };

  const handleBrowse = () => {
    // Function to handle smiley
    console.log('Browse clicked');
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);

    // Auto-expand the textarea height based on content
    textAreaRef.current.style.height = '2.9rem'; // Reset height to auto before adjusting
    textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`; // Set the height to scrollHeight
  };

  // MARK: Markup
  return (
    <div className={styles.chatInput}>
      <div className={styles.chatInputContent}>
        <div className={styles.chatInputContainer}>
          <IconButton
            className={styles.iconSmileyButton}
            icon={<IconSmiley className={styles.iconSmiley} />}
            sound={settingsSound}
            onClick={handleSmiley} // Function to start video
          />
          <IconButton
            className={styles.iconBrowseButton}
            icon={<IconPaperclip className={styles.iconBrowse} />}
            sound={settingsSound}
            onClick={handleBrowse} // Function to start video
          />
          <IconButton
            className={styles.iconTakePhotoButton}
            icon={<IconCamera className={styles.iconTakePhoto} />}
            sound={settingsSound}
            onClick={handleTakePhoto} // Function to start video
          />
          <textarea
            ref={textAreaRef}
            placeholder="Meddelande"
            value={inputValue}
            onChange={handleInputChange} // Handle input change
            onKeyDown={handleKeyDown} // Handle keydown event for 'Enter' key
            className={styles.textArea}
          />
        </div>
        {/* Show the IconVideo button if the input is empty, else show IconSend */}
        {!inputValue.trim() ? (
          <IconButton
            className={`${styles.iconRounded} ${styles.iconRecordSound}`}
            icon={<IconSoundRecord />}
            sound={settingsSound}
            onClick={startVoiceRecord} // Function to start video
          />
        ) : (
          <IconButton
            className={`${styles.iconRounded} ${styles.iconSendButton}`}
            icon={<IconSend className={styles.iconSend} />}
            sound={settingsSound}
            onClick={sendMessage} // Function to send message
          />
        )}
      </div>
    </div>
  );
}
