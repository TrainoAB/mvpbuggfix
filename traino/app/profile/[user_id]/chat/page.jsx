'use client';
import React, { useState } from 'react';
import { useAppState } from '@/app/hooks/useAppState';
import Navigation from '../../../components/Menus/Navigation';
import ChatMessages from './ChatMessages';
import './page.css';
import { useEffect } from 'react';

export default function Chat() {
  const { isLoggedin } = useAppState();
  const [openChat, setOpenChat] = useState(false);
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

  const handleChatsClick = (event) => {
    const id = Number(event.currentTarget.getAttribute('data-id'));
    const selectedChat = chatdata.chats.find((chat) => chat.id === id);

    setMessages(selectedChat);
    setOpenChat(true);
  };

  useEffect(() => {
    const handleUnload = () => {
      // This event triggers when the page is unloaded and hopefully prevents bfcache from being used.
    };

    window.addEventListener('unload', handleUnload);

    return () => {
      window.removeEventListener('unload', handleUnload);
    };
  }, []);

  return (
    <>
      <Navigation />
      {openChat && messages.messages && <ChatMessages data={messages} onClose={setOpenChat} />}
      <main id="chat">
        <div className="categorytop">
          <div></div>
          <h1>Chat</h1>
          <div>
            <span className="amount">{chatdata && chatdata.total_newmessages}</span>
          </div>
        </div>
        <div className="scrollcontent">
          <div className="chats-container">
            {chatdata &&
              chatdata.chats.map((chatitem, index) => (
                <div className="chathead" key={index} onClick={handleChatsClick} data-id={chatitem.id}>
                  <div className="thumbnail">
                    <img src={chatitem.thumbnail} alt="" />
                  </div>
                  <div className="info">
                    <div className="name">{chatitem.firstname + ' ' + chatitem.lastname}</div>
                    <div className="date">{chatitem.lastdate}</div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </main>
    </>
  );
}
