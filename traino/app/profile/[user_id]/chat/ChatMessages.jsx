'use client';
import { useEffect, useState, useRef } from 'react';
import { useAppState } from '@/app/hooks/useAppState';
import Link from 'next/link';
import './ChatMessages.css';

export default function ChatMessages({ data, onClose }) {
  const initialMessages = data && data.messages ? data.messages : [];
  const [openChat, setOpenChat] = useState(initialMessages);
  const [input, setInput] = useState('');
  const scrollContentRef = useRef(null);

  const responses = [
    'Bra jobbat! Fortsätt kämpa!',
    'Kom ihåg att hålla dig hydrerad.',
    'Det är fantastiskt! Berätta mer.',
    'Du är fantastisk! Vad är nästa steg?',
    'Konsistens är nyckeln. Fortsätt så!',
    'Håll fokus på dina mål!',
    'Du blir starkare för varje dag som går!',
    'Utmana dig själv!',
    'Du är på rätt spår! Fortsätt så!',
    'Fantastiskt jobbat! Jag är imponerad.',
    'Fortsätt så! Din uthållighet ger resultat.',
    'Var stolt över din framsteg!',
    'Du inspirerar andra med ditt engagemang!',
  ];

  const responsesWithHej = [
    'Hej! Vad kan jag hjälpa dig med?',
    'Hej! Hoppas din dag är fantastisk!',
    'Hej! Har du haft en bra dag?',
    'Hej! Vad har du haft för dig idag?',
    'Hej! Jag är här för att stötta dig!',
  ];

  useEffect(() => {
    if (scrollContentRef.current) {
      scrollContentRef.current.scrollTop = scrollContentRef.current.scrollHeight;
    }
  }, [openChat]);

  const handleSendMessage = () => {
    if (input.trim()) {
      const userMessage = {
        id: Date.now(), // temporary ID
        thumbnail: 'https://picsum.photos/200/209', // example thumbnail
        alias: 'currentuser',
        firstname: 'You',
        lastname: '',
        message: input,
        date: new Date().toISOString(),
      };

      const newMessages = [...openChat, userMessage];
      setOpenChat(newMessages);
      setInput('');

      // Show "Kevin is typing" message
      setOpenChat((prevMessages) => [
        ...prevMessages,
        {
          id: Date.now() + 1, // temporary ID
          thumbnail: 'https://picsum.photos/200/201',
          alias: 'kevinBot',
          firstname: 'Kevin',
          lastname: '',
          message: 'Kevin is typing...', // Temporary message
          date: new Date().toISOString(),
        },
      ]);

      // Respond after a random delay between 0.5 to 1 second
      const randomDelay = Math.floor(Math.random() * (2500 - 1500)) + 1500;
      setTimeout(() => {
        let botResponse;
        if (input.trim().toLowerCase() === 'hej') {
          botResponse = {
            id: Date.now() + 2, // temporary ID
            thumbnail: 'https://picsum.photos/200/201',
            alias: 'kevinBot',
            firstname: 'Kevin',
            lastname: '',
            message: responsesWithHej[Math.floor(Math.random() * responsesWithHej.length)],
            date: new Date().toISOString(),
          };
        } else if (input.trim().toLowerCase() === 'hejdå') {
          botResponse = {
            id: Date.now() + 2, // temporary ID
            thumbnail: 'https://picsum.photos/200/201',
            alias: 'kevinBot',
            firstname: 'Kevin',
            lastname: '',
            message: 'Hejdå! Ha en bra dag!', // Temporary message
            date: new Date().toISOString(),
          };
        } else {
          botResponse = {
            id: Date.now() + 2, // temporary ID
            thumbnail: 'https://picsum.photos/200/201',
            alias: 'kevinBot',
            firstname: 'Kevin',
            lastname: '',
            message: responses[Math.floor(Math.random() * responses.length)],
            date: new Date().toISOString(),
          };
        }
        // Replace "Kevin is typing" message with actual message
        setOpenChat((prevMessages) => {
          const updatedMessages = prevMessages.map((message) => {
            if (message.message === 'Kevin is typing...') {
              return botResponse;
            }
            return message;
          });
          return updatedMessages;
        });
      }, randomDelay);
    }
  };

  return (
    <>
      {onClose && (
        <>
          <main id="chatmessages">
            <div className="categorytop">
              <div className="btn-back" onClick={() => onClose(false)}>
                {'<'}
              </div>
              <h1>{data && data.firstname + ' ' + data.lastname}</h1>
              <div></div>
            </div>
            <div className="chatcontent" ref={scrollContentRef}>
              <div className="chatting-container">
                {openChat.map((chatitem, index) =>
                  chatitem.firstname === 'You' ? (
                    <div className="chatitem reverse" key={index}>
                      <div className="info">
                        <div className="name">{chatitem.firstname}</div>
                        <div className="message">{chatitem.message}</div>
                        <span className="date">{chatitem.date}</span>
                      </div>
                      <div className="thumbnail">
                        <img src={chatitem.thumbnail} alt="" />
                      </div>
                    </div>
                  ) : (
                    <div className="chatitem" key={index}>
                      <div className="thumbnail">
                        <img src={chatitem.thumbnail} alt="" />
                      </div>
                      <div className="info">
                        <div className="name">{chatitem.firstname}</div>
                        <div className="message">{chatitem.message}</div>
                        <span className="date">{chatitem.date}</span>
                      </div>
                    </div>
                  ),
                )}
                <br />
              </div>
            </div>
          </main>
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
        </>
      )}
    </>
  );
}
