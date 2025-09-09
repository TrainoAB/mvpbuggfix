'use client';
import React from 'react';
import { useAppState } from '@/app/hooks/useAppState';
import Navigation from '@/app/components/Menus/Navigation';
import Link from 'next/link';
import './page.css';

const NotificationsPage = () => {
  const { notifications } = useAppState();

  // const handleBack = () => {
  //   if (navigation && navigation.back) {
  //     navigation.back()
  //   } else {
  //     window.history.back()
  //   }
  // }

  return (
    <main id="notifications-container">
      <Navigation />
      <div id="notifications">
        <div className="categorytop">
          <div className="btn-back" onClick={handleBack}></div>
          <h1>Notifications</h1>
        </div>
        <div className="scrollcontainer">
          <div className="content">
            <ul>
              {notifications.map((notification, index) => (
                <li key={index}>
                  <p className="date">
                    <strong>Date:</strong> {notification.date}
                  </p>
                  <strong>{notification.type}</strong>: {notification.message}
                </li>
              ))}
            </ul>
            <br />
          </div>
        </div>
      </div>
    </main>
  );
};

export default NotificationsPage;
