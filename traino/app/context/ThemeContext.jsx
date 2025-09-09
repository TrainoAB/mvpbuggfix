'use client';
import React, { createContext, useState, useContext, useRef, useEffect } from 'react';
import { DEBUG, logout, checkSession, getUserDetails, getCookie, setCookie } from '@/app/functions/functions';
import globalTranslations from '@/translations/global.json';

// Create a context
const ThemeContext = createContext();

// Create a provider component
export const ThemeContextProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => getCookie('language') || 'en');
  const [fullscreen, setFullscreen] = useState(() => {
    const cookieValue = getCookie('fullscreen');
    return cookieValue !== null ? cookieValue === 'true' : false;
  });

  const [settingsSound, setSettingsSound] = useState(() => {
    const cookieValue = getCookie('settingsSound');
    if (cookieValue !== null) {
      return cookieValue === 'true';
    } else {
      setCookie('settingsSound', 'false', { path: '/' }); // or adjust expiration/path as needed
      return false;
    }
  });

  const [settingsTheme, setSettingsTheme] = useState(() => {
    const cookieValue = getCookie('settingsTheme');
    if (cookieValue !== null) {
      return cookieValue === 'true';
    } else {
      setCookie('settingsTheme', 'false', { path: '/' }); // set the cookie
      return false;
    }
  });

  useEffect(() => {
    let theme = '';
    if (settingsTheme) {
      theme = 'dark';
    } else {
      theme = 'light';
    }
    document.documentElement.setAttribute('data-theme', theme);
  }, [settingsTheme]);

  useEffect(() => {
    // Ensure we are only attempting fullscreen operations if the document is valid
    const enterFullscreen = () => {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen();
      } else if (document.documentElement.mozRequestFullScreen) {
        // Firefox
        document.documentElement.mozRequestFullScreen();
      } else if (document.documentElement.webkitRequestFullscreen) {
        // Chrome, Safari, Opera
        document.documentElement.webkitRequestFullscreen();
      } else if (document.documentElement.msRequestFullscreen) {
        // IE/Edge
        document.documentElement.msRequestFullscreen();
      }
    };

    const exitFullscreen = () => {
      // Check if we are in fullscreen mode before calling exitFullscreen
      if (
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreen ||
        document.msFullscreenElement
      ) {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.mozCancelFullScreen) {
          // Firefox
          document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
          // Chrome, Safari, Opera
          document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
          // IE/Edge
          document.msExitFullscreen();
        }
      }
    };

    if (fullscreen) {
      enterFullscreen();
    } else {
      exitFullscreen();
    }
  }, [fullscreen]);

  // MARK: Language translation
  async function fetchPageTranslations(page) {
    try {
      return await import(`@/translations/${page}.json`);
    } catch (error) {
      console.warn(`Translation file for page "${page}" not found.`);
      return {}; // Return an empty object if the file doesn't exist
    }
  }

  const useTranslations = (page, language) => {
    const [translations, setTranslations] = useState(globalTranslations); // Default to global translations

    useEffect(() => {
      let isMounted = true; // Förhindrar att state uppdateras om komponenten unmountas

      async function loadTranslations() {
        try {
          if (!page || page === 'global') {
            if (isMounted) setTranslations(globalTranslations);
          } else {
            const pageTranslations = await fetchPageTranslations(page);
            if (isMounted) {
              setTranslations((prev) => {
                const merged = { ...prev, ...pageTranslations };
                return JSON.stringify(prev) !== JSON.stringify(merged) ? merged : prev;
              });
            }
          }
        } catch (error) {
          console.log('Error loading translations:', error);
        }
      }

      loadTranslations();
      return () => (isMounted = false); // Cleanup för att förhindra minnesläckor
    }, [page, language]);

    const translate = (key) => {
      if (translations[key]) {
        if (translations[key][language]) {
          return translations[key][language];
        } else if (translations[key]['en']) {
          DEBUG &&
            console.log(`Translation for key "${key}" not found for language "${language}", using English as fallback`);
          return translations[key]['en'];
        } else {
          DEBUG && console.log(`Translation for key "${key}" not found for language "${language}" or English`);
          return key;
        }
      } else {
        DEBUG && console.log(`Translation key "${key}" not found`);
        return key;
      }
    };

    return { translate };
  };

  return (
    <ThemeContext.Provider
      value={{
        language,
        fullscreen,
        setFullscreen,
        setLanguage,
        useTranslations,
        settingsSound,
        setSettingsSound,
        settingsTheme,
        setSettingsTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use the context
export const useThemeContext = () => {
  return useContext(ThemeContext);
};
