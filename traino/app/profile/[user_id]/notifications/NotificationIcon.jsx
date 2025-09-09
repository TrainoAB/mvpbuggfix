import React from 'react';
import { useAppState } from '@/app/hooks/useAppState';

const NotificationIcon = () => {
  const { notifications } = useAppState();
  const unreadCount = notifications.length;

  return (
    <div id="notification-icon">
      <div className="notification-icon">
        <div className="notification-container">
          {unreadCount > 0 && <span className="amount profile-page-amount">{unreadCount}</span>}
        </div>
      </div>
    </div>
  );
};

export default NotificationIcon;
