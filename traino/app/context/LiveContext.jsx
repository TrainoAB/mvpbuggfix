'use client';
import React, { createContext, useState, useContext, useEffect } from 'react';
import { DEBUG, getCookie, setCookie } from '@/app/functions/functions';

// Create a context
const LiveContext = createContext();

// Create a provider component
export const LiveContextProvider = ({ children }) => {
  const [chatVisible, setChatVisible] = useState(false);
  const [chatData, setChatData] = useState(null);

  const [videoChat, setVideoChat] = useState(false);
  const [phoneCall, setPhoneCall] = useState(false);
  const [videoChatOverlay, setVideoChatOverlay] = useState(false);

  // MARK: Notifications (Not currently used)
  const [notifications, setNotifications] = useState([
    {
      type: 'Reminder',
      message: "Don't forget your training session with John",
      date: '2024-06-20',
    },
    {
      type: 'Update',
      message: 'A new version of the app is available. Click here to update.',
      date: '2024-06-07',
    },
    {
      type: 'Meeting',
      message: 'You have a meeting scheduled with your personal trainer at 2:00 PM.',
      date: '2024-06-04',
    },
    {
      type: 'Error',
      message: "Failed to upload 'training-journey.pdf'. The file might be too large or in an unsupported format.",
      date: '2024-06-01',
    },
    {
      type: 'Meeting',
      message: 'You have a meeting scheduled with your personal trainer at 2:00 PM.',
      date: '2024-06-04',
    },
    {
      type: 'Error',
      message: "Failed to upload 'training-journey.pdf'. The file might be too large or in an unsupported format.",
      date: '2024-06-01',
    },
  ]);

  const addNotification = (type, message) => {
    const newNotification = {
      type,
      message,
      date: new Date().toISOString(),
    };

    setNotifications((prevNotifications) => [...prevNotifications, newNotification]);
    DEBUG && console.log('from notification', notifications);
  };

  useEffect(() => {
    // Load notifications from cookie on component mount
    const storedNotifications = getCookie('notifications');
    if (storedNotifications) {
      setNotifications(JSON.parse(storedNotifications));
    }
  }, []);

  useEffect(() => {
    // Store notifications in cookie whenever the notifications state changes
    setCookie('notifications', JSON.stringify(notifications), 365);
  }, [notifications]);

  return (
    <LiveContext.Provider
      value={{
        videoChat,
        setVideoChat,
        phoneCall,
        setPhoneCall,
        videoChatOverlay,
        setVideoChatOverlay,
        chatData,
        setChatData,
        chatVisible,
        setChatVisible,
      }}
    >
      {children}
    </LiveContext.Provider>
  );
};

// Custom hook to use the context
export const useLiveContext = () => {
  return useContext(LiveContext);
};
