import { useCallback, useState, useRef } from 'react';
import { DEBUG } from '@/app/functions/functions';

export const useHoldTimer = (setMenuVisible = null, handleLongPress, handleShortPress, holdDuration = 500) => {
  const [menuData, setMenuData] = useState(null);
  const [pressType, setPressType] = useState(null);
  const [isHolding, setIsHolding] = useState(false);
  const holdTimeout = useRef(null);

  const startHoldTimer = useCallback(
    (e, data) => {
      e.persist();
      DEBUG && console.log('startHoldTimer called with data:', data);
      setMenuData(data); // Set data in state
      setIsHolding(false);
      setPressType(null);

      holdTimeout.current = setTimeout(() => {
        DEBUG && console.log('Hold duration reached, setting menu visible with data:', data);
        setIsHolding(true); // Mark as holding
        setPressType('long');
        handleLongPress(data); // Trigger long press logic with menuData
        if (setMenuVisible !== null) setMenuVisible(true, data); // Trigger menu visibility
      }, holdDuration);
    },
    [setMenuVisible, holdDuration],
  );

  const clearHoldTimer = useCallback(() => {
    DEBUG && console.log('clearHoldTimer called');
    if (holdTimeout.current) {
      clearTimeout(holdTimeout.current); // Clear the timeout
      holdTimeout.current = null; // Reset timeout ref
    }
    if (!isHolding) {
      setPressType('short'); // Set press type to 'short'
    }
    setIsHolding(false); // Reset holding state
  }, [isHolding]);

  const handleMouseDown = useCallback(
    (e, data) => {
      DEBUG && console.log('Mouse down', data);
      if (e.button === 2) e.preventDefault();
      startHoldTimer(e, data);
    },
    [startHoldTimer],
  );

  const handleMouseUp = useCallback(
    (e) => {
      DEBUG && console.log('Mouse up, clearing timer');
      clearHoldTimer();
      if (isHolding) {
        DEBUG && console.log('Long press detected with data:', menuData);
      } else {
        DEBUG && console.log('Short press detected with data:', menuData);
        handleShortPress(menuData); // Trigger short press logic with menuData
      }
    },
    [clearHoldTimer, handleShortPress, isHolding, menuData],
  );

  const handleTouchStart = useCallback(
    (e, data) => {
      DEBUG && console.log('Touch start', data);
      startHoldTimer(e, data);
    },
    [startHoldTimer],
  );

  const handleTouchEnd = useCallback(
    (e) => {
      DEBUG && console.log('Touch end');
      e.preventDefault();
      clearHoldTimer();
      if (isHolding) {
        DEBUG && console.log('Long press detected with data:', menuData);
      } else {
        DEBUG && console.log('Short press detected with data:', menuData);
        handleShortPress(menuData); // Trigger short press logic with menuData
      }
    },
    [clearHoldTimer, handleShortPress, isHolding, menuData],
  );

  const handleTouchCancel = useCallback(() => {
    DEBUG && console.log('Touch cancel');
    clearHoldTimer();
  }, [clearHoldTimer]);

  return {
    handleMouseDown,
    handleMouseUp,
    handleTouchStart,
    handleTouchEnd,
    handleTouchCancel,
    pressType,
    menuData, // Expose menuData to the outside world
  };
};
