import React, { useEffect, useRef, useState } from 'react';
import './Loader.css';
import { useAppState } from '@/app/hooks/useAppState';
// import soundFile from '../assets/sound/le-sejour-des-voix-200627.mp3'; // Import the MP3 file

export default function Loader({ containerId, onlyT = false }) {
  const { DEBUG, useTranslations, language } = useAppState();
  const { translate } = useTranslations('loader', language);
  /* const audioRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;

    // Play the audio when the component is mounted
    audio.play();

    return () => {
      // Pause and clean up the audio when the component is unmounted
      audio.pause();
      audio.currentTime = 0;
    };
  }, []); */

  const [showText, setShowText] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowText(true);
    }, 20000); // 1000 milliseconds = 1 seconds

    return () => clearTimeout(timer);
  }, []);

  const handleRefresh = () => {
    window.location.reload();
  };

  // MARK: Markup
  return (
    <>
      <div id="loader" className="loading-overlay" data-container={containerId}>
        <div className="loading-box">
          <div className="Loader" id="tload">
            <div className="ttop"></div>
            <div className="tstickcontain">
              <div className="tstick"></div>
            </div>
          </div>
        </div>

        {/* Use a ref to control the audio element */}
        {/* 
        <audio ref={audioRef} loop>
          <source src={soundFile} type="audio/mpeg" />
          Your browser does not support the audio element.
        </audio> 
        */}
        {showText && !onlyT && (
          <>
            <p className="loading-text">
              {/* Laddningen tar längre tid än vanligt... */}
              {translate('loading_long', language)}
            </p>
            <p className="small-text">
              {/* Om problemet kvarstår efter en refresh, kontakta support. */}
              {translate('loading_support', language)}
            </p>
            <button className="button" onClick={handleRefresh}>
              {/* Refresh */}
              {translate('refresh', language)}
            </button>
          </>
        )}
      </div>
    </>
  );
}
