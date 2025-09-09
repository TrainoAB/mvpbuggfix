import React from 'react';
import UserLinks from './UserLinks';
import UserButtonsEmailAndDelete from './UserButtonsEmailAndDelete';

export default function ListItem({ user, setDeleteUserId }) {
  return (
    <>
      <div className="row">
        <UserLinks user={user} />
        <UserButtonsEmailAndDelete setDeleteUserId={setDeleteUserId} user={user} />
      </div>
    </>
  );
}
