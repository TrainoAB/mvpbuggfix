import React, { useState } from 'react';
import './startChatComponent.css';

/**
 * StartChatComponent är en modal där en användare kan starta en chat med en annan användare
 *
 * Props:
 * onClose - funktion för att stänga modalen
 *
 */

/* Just for testing the chat with dummy data

const ChatHead = ({ chat, onClick }) => (
  <div className="chathead" onClick={onClick} data-id={chat.id}>
    <div className="thumbnail">
      <img src={chat.thumbnail} alt={`${chat.firstname} ${chat.lastname}`} />
    </div>
    <div className="info">
      <div className="name">{`${chat.firstname} ${chat.lastname}`}</div>
      <div className="date">{chat.lastdate}</div>
    </div>
  </div>
);
*/

const ChatMessage = ({ msg }) => (
  <div className={`message ${msg.alias === 'you' ? 'your-message' : 'their-message'}`}>
    <div className="message-thumbnail">
      <img src={msg.thumbnail} alt={msg.alias} />
    </div>
    <div className="message-content">
      <div className="message-alias">{msg.alias}</div>
      <div className="message-text">{msg.message}</div>
      <div className="message-date">{msg.date}</div>
    </div>
  </div>
);

function StartChatComponent({ onClose }) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);

  const chatdata = {
    total_chats: 1,
    total_newmessages: 10,
    chats: [
      {
        id: 200564,
        thumbnail: 'https://picsum.photos/200/200',
        alias: 'kevinflurry',
        firstname: 'Kevin',
        lastname: 'Flurry',
        lastdate: '2024-04-01 10:43:23',
        messages: [
          {
            id: 200564,
            thumbnail: 'https://picsum.photos/200/201',
            alias: 'kevinflurry',
            firstname: 'Kevin',
            lastname: 'Flurry',
            message: 'Hur går det med din diet den här veckan?',
            date: '2024-04-01 10:43:23',
          },
          {
            id: 173,
            thumbnail: 'https://picsum.photos/200/208',
            alias: 'you',
            firstname: 'You',
            lastname: '',
            message: 'Det går ganska bra. Jag försöker hålla mig till planen.',
            date: '2024-04-01 10:45:23',
          },
          {
            id: 200564,
            thumbnail: 'https://picsum.photos/200/201',
            alias: 'kevinflurry',
            firstname: 'Kevin',
            lastname: 'Flurry',
            message: 'Det är fantastiskt att höra! Fortsätt så och kom ihåg att balansera dina makronäringsämnen.',
            date: '2024-04-01 10:46:23',
          },
          {
            id: 173,
            thumbnail: 'https://picsum.photos/200/208',
            alias: 'you',
            firstname: 'You',
            lastname: '',
            message: 'Jag ska göra det. Har du några specifika tips för intag av protein?',
            date: '2024-04-01 10:47:23',
          },
          {
            id: 200564,
            thumbnail: 'https://picsum.photos/200/201',
            alias: 'kevinflurry',
            firstname: 'Kevin',
            lastname: 'Flurry',
            message: 'Sikta på magra källor som kyckling, fisk och baljväxter. Sprid ditt intag över dagen.',
            date: '2024-04-01 10:48:23',
          },
          {
            id: 173,
            thumbnail: 'https://picsum.photos/200/208',
            alias: 'you',
            firstname: 'You',
            lastname: '',
            message: 'Tack för tipsen! Jag ska försöka implementera dem.',
            date: '2024-04-01 10:50:23',
          },
          {
            id: 200564,
            thumbnail: 'https://picsum.photos/200/201',
            alias: 'kevinflurry',
            firstname: 'Kevin',
            lastname: 'Flurry',
            message: 'Hur går det med din vattenkonsumtion? Har du några frågor eller bekymmer?',
            date: '2024-04-01 10:52:23',
          },
          {
            id: 173,
            thumbnail: 'https://picsum.photos/200/208',
            alias: 'you',
            firstname: 'You',
            lastname: '',
            message: 'Jag har märkt att jag behöver öka min vattenkonsumtion. Några rekommendationer?',
            date: '2024-04-01 10:52:23',
          },
          {
            id: 200564,
            thumbnail: 'https://picsum.photos/200/201',
            alias: 'kevinflurry',
            firstname: 'Kevin',
            lastname: 'Flurry',
            message:
              'Det är bra att du är medveten om det. Se till att dricka tillräckligt med vatten genom hela dagen och undvik att vänta tills du är törstig.',
            date: '2024-04-01 10:54:23',
          },
          {
            id: 173,
            thumbnail: 'https://picsum.photos/200/208',
            alias: 'you',
            firstname: 'You',
            lastname: '',
            message: 'Tack för råden! Jag ska försöka hålla mig hydrerad.',
            date: '2024-04-01 10:56:23',
          },
        ],
      },
    ],
  };

  function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}`;
  }

  const handleChatsClick = (event) => {
    const id = Number(event.currentTarget.getAttribute('data-id'));
    const selectedChat = chatdata.chats.find((chat) => chat.id === id);
    setMessages(selectedChat.messages);
  };

  const handleSendMessage = () => {
    const formattedDate = formatDate(new Date());
    console.log(formattedDate);
    if (input.trim()) {
      const userMessage = {
        id: Date.now(),
        thumbnail: 'https://picsum.photos/200/209',
        alias: 'you',
        firstname: 'you',
        lastname: '',
        message: input,
        date: formattedDate,
      };
      setMessages((prevMessages) => [...prevMessages, userMessage]);
      setInput('');
    }
  };

  return (
    <div id="chat-modal">
      <div className="modal">
        <button className="x-btn" onClick={() => onClose(field)}></button>
        <div className="modal-header">
          <h2 className="title">Skicka meddelande</h2>
          <div className="modal-line"></div>
        </div>

        <div className="scrollcontent">
          <div className="message-receiver">
            <div className="receiver-thumbnail">
              <img
                src={chatdata.chats[0].thumbnail}
                alt={`${chatdata.chats[0].firstname} ${chatdata.chats[0].lastname}`}
              />
            </div>
            <div className="receiver-name">{`${chatdata.chats[0].firstname} ${chatdata.chats[0].lastname}`}</div>
          </div>

          {/** Just for testing the chat with dummy data
          <div className="chats-container">
            {chatdata.chats.map((chat) => (
              <ChatHead key={chat.id} chat={chat} onClick={handleChatsClick} />
            ))}
          </div>
          */}

          <div className="chat-messages">
            {messages.map((msg) => (
              <ChatMessage key={msg.id} msg={msg} />
            ))}
          </div>
        </div>

        <div className="chatinput">
          <input
            type="text"
            placeholder="Skriv ditt meddelande..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          />
          <button onClick={handleSendMessage}>Send</button>
        </div>
      </div>
      <div className="darkoverlay" onClick={() => onClose(field)}></div>
    </div>
  );
}

export default StartChatComponent;
