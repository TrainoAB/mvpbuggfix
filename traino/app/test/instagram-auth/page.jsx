'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export const InstagramAuth = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState({ name: '', email: '' });
  const [instagramAccessToken, setInstagramAccessToken] = useState('');
  const [instagramVideos, setInstagramVideos] = useState([]);
  const [selectedVideos, setSelectedVideos] = useState([]);
  const [code, setCode] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const urlCode = new URLSearchParams(window.location.search).get('code');
    setCode(urlCode);
  }, []);

  useEffect(() => {
    // Load selected videos from local storage when the component mounts
    const savedVideos = JSON.parse(localStorage.getItem('selectedVideos')) || [];
    setSelectedVideos(savedVideos);
  }, []);

  useEffect(() => {
    const loadFacebookSDK = () => {
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://connect.facebook.net/en_US/sdk.js';

      script.onload = () => {
        window.fbAsyncInit = function () {
          FB.init({
            appId: '1582352852349163',
            cookie: true,
            xfbml: true,
            version: 'v20.0',
          });

          FB.getLoginStatus((response) => {
            console.log(response.status, 'RESPONSE');
            if (response.status === 'connected') {
              setIsLoggedIn(true);
              fetchUserInfo();
            } else {
              console.log('User not authenticated');
            }
          });
        };
      };

      script.onerror = () => {
        console.error('Failed to load the Facebook SDK');
      };

      document.head.appendChild(script);
    };

    loadFacebookSDK();
  }, []);

  // Exchange short-lived token for long-lived token
  const exchangeForLongLivedToken = async (shortLivedToken) => {
    const clientId = '1079254513606837';
    const clientSecret = '4a4e6bc14a4f27b51241ab54709ce072';
    const tokenUrl = `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${clientSecret}&access_token=${shortLivedToken}`;

    try {
      const response = await fetch(tokenUrl);
      const data = await response.json();

      if (response.ok) {
        const longLivedToken = data.access_token;
        localStorage.setItem('instagramAccessToken', longLivedToken);
        setInstagramAccessToken(longLivedToken);
        setupAutoTokenRefresh(longLivedToken);
        fetchInstagramVideos(longLivedToken);  // Fetch videos using the new token
      } else {
        console.error('Error exchanging for long-lived token:', data.error_message);
      }
    } catch (error) {
      console.error('Error fetching long-lived token:', error);
    }
  };

  // Automatically refresh long-lived token
  const refreshLongLivedToken = async (currentToken) => {
    const refreshUrl = `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${currentToken}`;

    try {
      const response = await fetch(refreshUrl);
      const data = await response.json();

      if (response.ok) {
        const refreshedToken = data.access_token;
        localStorage.setItem('instagramAccessToken', refreshedToken);
        setInstagramAccessToken(refreshedToken);
        setupAutoTokenRefresh(refreshedToken); // Setup next refresh
      } else {
        console.error('Error refreshing token:', data.error_message);
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
    }
  };

  // Setup auto token refresh every 55 days
  const setupAutoTokenRefresh = (token) => {
    const refreshTime = 55 * 24 * 60 * 60 * 1000; // 55 days in milliseconds

    setTimeout(async () => {
      await refreshLongLivedToken(token);  // Automatically refresh token
    }, refreshTime);
  };

  useEffect(() => {
    if (code) {
      const exchangeCodeForToken = async () => {
        const clientId = '1079254513606837';
        const clientSecret = '4a4e6bc14a4f27b51241ab54709ce072';
        const redirectUri = 'https://localhost:3000/instagram-auth';
        const tokenUrl = 'https://api.instagram.com/oauth/access_token';
        const formData = new URLSearchParams();
        formData.append('client_id', clientId);
        formData.append('client_secret', clientSecret);
        formData.append('grant_type', 'authorization_code');
        formData.append('redirect_uri', redirectUri);
        formData.append('code', code);
        
        try {
          const response = await fetch(`https://cors-anywhere.herokuapp.com/${tokenUrl}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData.toString(),
          });

          const data = await response.json();

          if (response.ok) {
            const shortLivedToken = data.access_token;
            exchangeForLongLivedToken(shortLivedToken);  // Exchange for long-lived token
          } else {
            console.error('Error:', data.error_message);
          }
        } catch (error) {
          console.error('Error exchanging code for access token:', error);
        }
      };

      exchangeCodeForToken();
    }
  }, [code]);

  const fetchInstagramVideos = async (accessToken) => {
    try {
      const response = await fetch(
        `https://graph.instagram.com/me/media?fields=id,media_type,media_url&access_token=${accessToken}`
      );
      const data = await response.json();
      if (response.ok) {
        const videos = data.data.filter((item) => item.media_type === 'VIDEO');
        setInstagramVideos(videos);
      } else {
        console.error('Error fetching media:', data.error.message);
        if (data.error.code === 190) {
          console.error('Access token has expired or is invalid.');
        } else if (data.error.code === 4) {
          console.error('API rate limit exceeded.');
        }
      }
    } catch (error) {
      console.error('Error fetching Instagram videos:', error);
    }
  };

  const fetchUserInfo = () => {
    FB.api('/me', { fields: 'name,email' }, function (response) {
      if (response && !response.error) {
        setUserInfo({ name: response.name, email: response.email });
      }
    });
  };

  const handleFacebookLogin = () => {
    FB.login(
      (response) => {
        if (response.status === 'connected') {
          setIsLoggedIn(true);
          fetchUserInfo();
          console.log('Login successful', response);
        } else {
          console.log('Login failed', response);
        }
      },
      { scope: 'public_profile,email' }
    );
  };

  const handleLogout = () => {
    FB.logout((response) => {
      setIsLoggedIn(false);
      setUserInfo({ name: '', email: '' });
      console.log('Logged out', response);
    });
  };

  const handleInstagramLogin = () => {
    const clientId = '1079254513606837';
    const redirectUri = 'https://localhost:3000/instagram-auth';
    const instagramAuthUrl = `https://api.instagram.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&scope=user_profile,user_media&response_type=code`;

    window.location.href = instagramAuthUrl;
  };

  const handleVideoSelection = (video) => {
    const isSelected = selectedVideos.some((selected) => selected.id === video.id);
    let updatedSelection;

    if (isSelected) {
      updatedSelection = selectedVideos.filter((selected) => selected.id !== video.id);
    } else {
      updatedSelection = [...selectedVideos, video];
    }

    setSelectedVideos(updatedSelection);
    localStorage.setItem('selectedVideos', JSON.stringify(updatedSelection));
    console.log('Selected Videos:', updatedSelection);
  };

  return (
    <div>
      <h2>Log in with your account</h2>

      {isLoggedIn ? (
        <div>
          <p>You are logged in with Facebook!</p>
          <p>Logged in as: {userInfo.name}.</p>
          <p>Email: {userInfo.email}</p>
          <button onClick={handleLogout}>Logout</button>
        </div>
      ) : (
        <button onClick={handleFacebookLogin}>Login with Facebook</button>
      )}
      <div>
        <button onClick={handleInstagramLogin}>Login with Instagram</button>
        {instagramVideos.length > 0 && (
          <div>
            <h3>Instagram Videos</h3>
            {instagramVideos.map((video) => (
              <div key={video.id}>
                <input
                  type="checkbox"
                  checked={selectedVideos.some((selected) => selected.id === video.id)}
                  onChange={() => handleVideoSelection(video)}
                />
                <video controls width="320" height="240">
                  <source src={video.media_url} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            ))}
          </div>
        )}
        {selectedVideos.length > 0 && (
          <div>
            <h1>Chosen Videos</h1>
            {selectedVideos.map((video) => (
              <video key={video.id} controls width="320" height="240">
                <source src={video.media_url} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InstagramAuth;
