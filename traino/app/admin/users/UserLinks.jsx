import React from 'react';
import Link from 'next/link';
export default function UserLinks({ user }) {
  var profilePath = '';
  var profileLink = '';
  if (user.usertype === 'trainer') {
    profilePath = '/trainer/@';
    profileLink = user.alias;
  } else {
    profilePath = '/trainee/';
    profileLink = user.id;
  }
  return (
    <>
      <Link href={profilePath + profileLink} className="thumb">
        <img src={user.thumbnail === 1 ? `https://traino.s3.eu-north-1.amazonaws.com/${user.id}/profile/profile-image.webp` : '/assets/icon-profile.svg'} alt="" />
      </Link>
      <Link href={profilePath + profileLink} className="userinfo">
        <span className="alias">{user.alias ? '@' + user.alias : ''}</span>
        <div className="user-name">
          <span className="fname">{user.firstname + ' ' + user.lastname}</span>
        </div>
        <div className="rating">
          {user.age !== null ? user.age + ' år, ' : ''}
          {user.rating !== null ? user.rating : ''}
        </div>
      </Link>
    </>
  );
}
