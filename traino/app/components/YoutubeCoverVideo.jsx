import React, { useState, useEffect, useRef } from 'react';

import './YoutubeCoverVideo.css';

export default function YoutubeCoverVideo({ videoId, uniqueKey }) {
  const [srcUrl, setSrcUrl] = useState('');

  useEffect(() => {
    // Update the iframe src whenever the videoId or uniqueKey changes
    setSrcUrl(
      `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=1&rel=0&modestbranding=1&fs=0&cc_load_policy=0&iv_load_policy=3&disablekb=0&loop=1&origin=${window.location.origin}&playlist=${videoId}`,
    );
  }, [videoId, uniqueKey]);

  return (
    <div
      id="youtubeCover"
      className={`container`}
      key={uniqueKey} // Ensure remount when key changes
    >
      <iframe
        id="youtube-iframe"
        width="100%"
        height="100%"
        src={srcUrl}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen={false}
        title={`YouTube Video ${uniqueKey}`}
      ></iframe>
    </div>
  );
}
