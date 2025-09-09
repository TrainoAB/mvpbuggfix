import React from 'react';

import './UserButtonsEmailAndDelete.css';

export default function UserButtonsEmailAndDelete({ user, setDeleteUserId }) {
  return (
    <div className="admin-button-container">
      <a className="button mailto email-button" href={`mailto: ${user.email}`}>
        Email
      </a>
      <button
        id={user.id}
        onClick={() => setDeleteUserId(user.id)}
        className="button delete-button"
      >
        Delete
      </button>
    </div>
  );
}
