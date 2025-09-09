'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { signInWithPopup, signOut, onAuthStateChanged, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../../firebase';

export const LoginAuth = () => {
  const [user, setUser] = useState(null);
  const [videos, setVideos] = useState([]);
  const [selectedVideos, setSelectedVideos] = useState([]);
  const [error, setError] = useState(null);

  const API_KEY = 'AIzaSyACKOyUJQgYY8m9Emlp-qhfzNP8___5N2k'; // Consider using environment variables

  const refreshToken = async () => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      try {
        await currentUser.getIdToken(true);
        const result = await signInWithPopup(auth, new GoogleAuthProvider());
        const credential = GoogleAuthProvider.credentialFromResult(result);
        return credential?.accessToken;
      } catch (error) {
        console.error('Error refreshing token:', error);
        throw error;
      }
    }
  };

  const fetchYouTubeVideos = useCallback(
    async (token) => {
      try {
        setError(null);
        const channelResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/channels?part=id&mine=true&key=${API_KEY}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );

        if (!channelResponse.ok) {
          if (channelResponse.status === 401) {
            const newToken = await refreshToken();
            if (newToken) return fetchYouTubeVideos(newToken);
          }
          throw new Error(`HTTP error! status: ${channelResponse.status}`);
        }

        const channelData = await channelResponse.json();
        if (channelData.items.length === 0) {
          throw new Error('No YouTube channel found for this user.');
        }

        const channelId = channelData.items[0].id;
        const videoResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=5&channelId=${channelId}&type=video&key=${API_KEY}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );

        if (!videoResponse.ok) {
          throw new Error(`HTTP error! status: ${videoResponse.status}`);
        }

        const videoData = await videoResponse.json();
        setVideos(videoData.items);
      } catch (error) {
        console.error('Error fetching YouTube videos:', error);
        setError(error.message);
      }
    },
    [API_KEY],
  );

  const googleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/youtube.readonly');
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        fetchYouTubeVideos(credential.accessToken);
      } else {
        throw new Error('No access token available');
      }
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      setError(error.message);
    }
  };

  const logOut = () => signOut(auth).catch(console.error);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        currentUser
          .getIdToken(true)
          .then(() => {
            const credential = GoogleAuthProvider.credentialFromResult(auth.currentUser);
            if (credential?.accessToken) {
              fetchYouTubeVideos(credential.accessToken);
            } else {
              console.error('No access token available. User may need to re-authenticate.');
              setError('Authentication error. Please sign in again.');
            }
          })
          .catch((error) => {
            console.error('Error getting token:', error);
            setError('Authentication error. Please try again.');
          });
      }
    });
    return () => unsubscribe();
  }, [fetchYouTubeVideos]);

  const handleCheckboxChange = (video) => {
    const alreadySelected = selectedVideos.find((v) => v.id === video.id.videoId);
    let updatedSelectedVideos;
    if (alreadySelected) {
      // Remove if already selected
      updatedSelectedVideos = selectedVideos.filter((v) => v.id !== video.id.videoId);
    } else {
      // Add to selected videos
      updatedSelectedVideos = [
        ...selectedVideos,
        { id: video.id.videoId, src: `https://www.youtube.com/embed/${video.id.videoId}`, title: video.snippet.title },
      ];
    }
    setSelectedVideos(updatedSelectedVideos);
    localStorage.setItem('selectedVideos', JSON.stringify(updatedSelectedVideos));
  };

  return (
    <>
      <div>Login with your Google account to view your YouTube videos</div>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {user ? (
        <div>
          <button onClick={logOut}>Logout</button>
          <div>
            {videos.map((video) => (
              <div key={video.id.videoId}>
                <h3>{video.snippet.title}</h3>
                <iframe
                  width="560"
                  height="315"
                  src={`https://www.youtube.com/embed/${video.id.videoId}`}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={video.snippet.title}
                ></iframe>
                <label>
                  <input
                    type="checkbox"
                    checked={!!selectedVideos.find((v) => v.id === video.id.videoId)}
                    onChange={() => handleCheckboxChange(video)}
                  />
                  Select
                </label>
              </div>
            ))}
          </div>

          <h1>Chosen Videos</h1>
          <div>
            {selectedVideos.length > 0 ? (
              selectedVideos.map((video) => (
                <div key={video.id}>
                  <h4>{video.title}</h4>
                  <iframe
                    width="560"
                    height="315"
                    src={video.src}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={video.title}
                  ></iframe>
                </div>
              ))
            ) : (
              <p>No videos selected.</p>
            )}
          </div>
        </div>
      ) : (
        <button onClick={googleSignIn}>Login</button>
      )}
    </>
  );
};

export default LoginAuth;
