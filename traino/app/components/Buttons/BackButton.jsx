/*  BackButton props:

    buttonStyle: The style the button should have  
    --------------------------------------  
      regular: White background with shadow and a black arrow pointing left  
      arrowdown: White background with shadow and a black arrow pointing down  
      blur: Blurred background with a white arrow pointing left  
      smallarrow: Only a black arrow pointing left with smaller width  
    --------------------------------------  
    onClick: Function that runs when the button is clicked  
    sound: true/false if sound should play when the button is clicked  
*/

import { useState } from 'react';
import { playSound } from '@/app/components/PlaySound';
import IconArrow from '@/app/components/SVG/IconArrow';

import styles from './BackButton.module.css';

export default function BackButton({ buttonStyle = 'arrowdown', onClick = null, sound = true }) {
  const [clicked, setClicked] = useState(false);

  const handleBack = (e) => {
    e.preventDefault();
    if (sound) playSound('popclick', 0.5);
    if (clicked) return;
    if (onClick) {
      onClick();
      return;
    } else {
      window.history.back();
    }
    setClicked(true);
  };

  const handleMouseOver = () => {
    if (sound) playSound('tickclick', 0.5);
  };

  const buttonClass = `${styles.backButton} ${styles[buttonStyle]}`;
  const arrowClass = buttonStyle === 'arrowdown' ? `${styles.arrow} ${styles.down}` : styles.arrow;

  // MARK: Markup
  return (
    <button type="button" className={buttonClass} onClick={handleBack} onMouseOver={handleMouseOver}>
      <span className={styles.arrowContainer}>
        <IconArrow className={arrowClass} />
      </span>
    </button>
  );
}
