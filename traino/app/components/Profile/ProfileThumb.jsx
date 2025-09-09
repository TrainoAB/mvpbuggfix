/*  ProfileThumb props:
   
    imageUrl: URL to the image to be displayed
    size: Size of the image
    --------------------------------------
      small: 42x42px
      medium: 62x62px
      large: 100x100px
    --------------------------------------
    alt: Alternative text for the image
    link: URL to redirect to when the image is clicked
    shadow: true/false to show a shadow around the image
    sound: true/false if a sound should play when the image is clicked and hovered
    online: true/false if the user is online
    disabled: true/false to show it grayed out or not
*/
import React from 'react';
import { playSound } from '@/app/components/PlaySound';
import Link from 'next/link';
import styles from './ProfileThumb.module.css';

function ProfileThumb({
  src = null,
  size = 'medium',
  link = null,
  alt = '',
  shadow = true,
  online = false,
  sound = false,
  disabled = false,
}) {
  if (src === null) {
    const randomSizeWidth = Math.floor(Math.random() * 101) + 100;
    const randomSizeHeight = Math.floor(Math.random() * 101) + 100;
    // Set default fallback image here
    src = `https://picsum.photos/${randomSizeWidth}/${randomSizeHeight}`;
  }

  const profileThumbClass = `${styles.profileThumb} ${styles[size]} ${shadow ? styles.shadow : ''} ${
    online ? styles.online : ''
  } ${disabled ? styles.disabled : ''}`;

  const handleClick = (e) => {
    if (typeof link === 'function') {
      e.preventDefault(); // Prevent default if it's a function
      if (sound) playSound('popclick', 0.5); // Play a sound
      link(); // Execute the function
    }
  };

  const handleMouseOver = () => {
    if (sound) playSound('tickclick', 0.5);
  };

  const handleLinkClick = () => {
    if (sound) playSound('popclick', 0.5);
  };

  // MARK: Markup
  return (
    <>
      {link ? (
        typeof link === 'string' ? (
          // Render as an anchor tag or Next.js Link for external/internal links
          <Link href={link} className={profileThumbClass} onClick={handleLinkClick} onMouseOver={handleMouseOver}>
            <div className={styles.profileImage}>
              {online && <div className={styles.onlineCircle}></div>}
              <img src={src} alt={alt} />
            </div>
          </Link>
        ) : (
          // Render as a div with an onClick handler for functions
          <div className={profileThumbClass} onClick={handleClick} onMouseOver={handleMouseOver}>
            <div className={styles.profileImage}>
              {online && <div className={styles.onlineCircle}></div>}
              <img src={src} alt={alt} />
            </div>
          </div>
        )
      ) : (
        // Render without a link
        <div className={profileThumbClass} onMouseOver={handleMouseOver}>
          <div className={styles.profileImage}>
            {online && <div className={styles.onlineCircle}></div>}
            <img src={src} alt={alt} />
          </div>
        </div>
      )}
    </>
  );
}

// Memoize the ProfileThumb component
export default React.memo(ProfileThumb); // So the component doesn't re-render if the props don't change
