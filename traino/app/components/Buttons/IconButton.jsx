/*  IconButton props:

    className: Extra classes for the button,
    icon: Icon element to display,
    onClick: Function to call when clicked,
    sound: true/false for sound effect,
*/

import { useState } from 'react';
import { playSound } from '@/app/components/PlaySound';

import styles from './IconButton.module.css';

export default function IconButton({ className = null, icon = null, onClick = null, sound = false }) {
  // Optional: Handle the sound effect
  const handleClick = () => {
    if (sound) playSound('popclick', 0.5);
    if (onClick) onClick();
  };

  const handleMouseOver = () => {
    if (sound) playSound('tickclick', 0.5);
  };

  const classNameString = className ? `${styles.iconButton} ${className}` : styles.iconButton;

  return (
    <button onClick={handleClick} onMouseOver={handleMouseOver} className={classNameString}>
      <span>{icon}</span>
    </button>
  );
}
