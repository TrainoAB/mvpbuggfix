/* HoldDownMenu props:

    data: Data to pass to the menu
    buttons: Array of objects with button data
    visible: Show or hide the menu
    setShow: Function to set the menu visibility
    sound: true/false if sound should play when a button is clicked and hovered
*/

import { playSound } from '@/app/components/PlaySound';
import styles from './HoldDownMenu.module.css';

export default function HoldDownMenu({ data = null, buttons = [], visible = false, setShow = null, sound = true }) {
  // Handle closing the menu after an action
  const handleShow = () => {
    if (typeof setShow === 'function') {
      setShow(false); // Close the menu
    }
  };

  // Handle menu item actions
  const handleClick = (button) => {
    if (typeof button.action === 'function') {
      if (sound) playSound('popclick', 0.5);
      button.action(data); // Execute the action directly
      handleShow(); // Close the menu after executing the action
    } else {
      console.error('Action is not a function:', button);
    }
  };

  const handleMouseOver = () => {
    if (sound) playSound('tickclick', 0.5);
  };

  return (
    <>
      {visible && buttons.length > 0 && (
        <>
          <div className={styles.menuContainer}>
            <ul className={styles.menuList}>
              {buttons.map((button, index) => (
                <li
                  key={index}
                  className={styles.menuItem}
                  onClick={() => handleClick(button)}
                  onMouseOver={handleMouseOver}
                >
                  {button.icon && <span className={styles.icon}>{button.icon}</span>}
                  <span className={styles.text}>{button.text}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className={styles.darkoverlay} onClick={handleShow}></div>
        </>
      )}
    </>
  );
}
