import React, { useEffect, useRef, useState } from 'react';
import './ButtonLoader.css';


// import soundFile from '../assets/sound/le-sejour-des-voix-200627.mp3'; // Import the MP3 file

export default function ButtonLoader({ containerId, translate, language }) {

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
    // Find the closest parent button and add "loading" class
    const button = document.getElementById(containerId)?.closest('button');
  if (button) {
    button.classList.add('loading');
  }

    const timer = setTimeout(() => {
      setShowText(true);
    }, 20000);

    return () => {
      clearTimeout(timer);
      if (button) {
        button.classList.remove('loading'); // Remove class when unmounting
      }
    };
  }, [containerId]);

  return (
    
      <div id="buttonloader" className="buttonloading-overlay" data-container={containerId}>
        <div className="buttonloading-box">
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
        {showText && <p className="loading-text">{translate('loading', language)}</p>}
      </div>
    
  );
}
