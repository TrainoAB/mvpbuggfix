import React, { useState, useEffect, useRef } from 'react';
import { useAppState } from '@/app/hooks/useAppState';
import { playSound } from '@/app/components/PlaySound';
import Image from 'next/image';
import './LanguageSelect.css';

// TODO: Somehow make the svg's not be fetched over and over again, use as background images or something else?

const LanguageSelect = ({ currentLanguage, onChangeLanguage, onBackToProfile }) => {
  const { language, setLanguage, useTranslations } = useAppState();
  const { translate } = useTranslations('profile', language);
  const languages = [
    { code: 'en', name: 'English', flag: '/flags/en.svg' },
    { code: 'sv', name: 'Swedish', flag: '/flags/sv.svg' },
    /* 
    { code: 'no', name: 'Norwegian', flag: '/flags/no.svg' },
    { code: 'da', name: 'Danish', flag: '/flags/da.svg' },
    { code: 'fi', name: 'Finnish', flag: '/flags/fi.svg' },
    { code: 'is', name: 'Icelandic', flag: '/flags/is.svg' },
    { code: 'lt', name: 'Lithuanian', flag: '/flags/lt.svg' },
    { code: 'lv', name: 'Latvian', flag: '/flags/lv.svg' },
    { code: 'et', name: 'Estonian', flag: '/flags/et.svg' },
    { code: 'fr', name: 'French', flag: '/flags/fr.svg' },
    { code: 'es', name: 'Spanish', flag: '/flags/es.svg' },
    { code: 'de', name: 'German', flag: '/flags/de.svg' },
    { code: 'it', name: 'Italian', flag: '/flags/it.svg' },
    { code: 'pl', name: 'Polish', flag: '/flags/pl.svg' },
    { code: 'ru', name: 'Russian', flag: '/flags/ru.svg' },
    { code: 'pt', name: 'Portuguese', flag: '/flags/pt.svg' },
    { code: 'nl', name: 'Dutch', flag: '/flags/nl.svg' },
    { code: 'hu', name: 'Hungarian', flag: '/flags/hu.svg' },
    { code: 'cz', name: 'Czech', flag: '/flags/cz.svg' },
    { code: 'sk', name: 'Slovak', flag: '/flags/sk.svg' },
    { code: 'sl', name: 'Slovenian', flag: '/flags/sl.svg' },
    { code: 'hr', name: 'Croatian', flag: '/flags/hr.svg' },
    { code: 'sr', name: 'Serbian', flag: '/flags/sr.svg' },
    { code: 'bg', name: 'Bulgarian', flag: '/flags/bg.svg' },
    { code: 'ro', name: 'Romanian', flag: '/flags/ro.svg' },
    { code: 'gr', name: 'Greek', flag: '/flags/gr.svg' },
    { code: 'jp', name: 'Japanese', flag: '/flags/jp.svg' },
    { code: 'ch', name: 'Chinese', flag: '/flags/ch.svg' },
    { code: 'kr', name: 'Korean', flag: '/flags/kr.svg' },
    { code: 'ar', name: 'Arabic', flag: '/flags/ar.svg' },
    { code: 'hu', name: 'Hindi', flag: '/flags/hu.svg' }, */
  ];

  // Search languages text placeholders
  const placeholders = {
    en: 'Search languages...',
    sv: 'Sök språk...',
    no: 'Søk språk...',
    da: 'Søg sprog...',
    fi: 'Etsi kieliä...',

    /*  fr: 'Rechercher des langues...',
    es: 'Buscar idiomas...',
    de: 'Sprachen suchen...',
    it: 'Cerca lingue...',
    pl: 'Szukaj języków...',
    ru: 'Поиск языков...',
    is: 'Leita að tungumálum...',
    lt: 'Ieškoti kalbų...',
    lv: 'Meklēt valodas...',
    et: 'Otsi keeli...',
    nl: 'Zoek talen...',
    hu: 'Nyelvek keresése...',
    cs: 'Hledat jazyky...',
    sk: 'Hľadať jazyky...',
    sl: 'Išči jezike...',
    hr: 'Pretraži jezike...',
    sr: 'Pretraži jezike...',
    bg: 'Търсене на езици...',
    ro: 'Căutați limbi...',
    gr: 'Αναζήτηση γλωσσών...',
    ja: '言語を検索...',
    zh: '搜索语言...',
    ko: '언어 검색...',
    ar: 'ابحث عن اللغات...',
    hi: 'भाषाओं को खोजें...', */
  };

  const [selectedLanguage, setSelectedLanguage] = useState(currentLanguage || language);
  const [filteredLanguages, setFilteredLanguages] = useState(languages);
  const [searchQuery, setSearchQuery] = useState('');
  const [showTopIndicator, setShowTopIndicator] = useState(false); // Added this line
  const [showBottomIndicator, setShowBottomIndicator] = useState(false); // Added this line
  const listRef = useRef(null);
  const setCookie = (name, value, days = 365) => {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${value}; expires=${expires}; path=/`;
  };

  const handleLanguageChange = (language) => {
    playSound('popclick', 0.5);
    setSelectedLanguage(language.code);
    onChangeLanguage(language.code);
    setLanguage(language.code);
    setCookie('language', language.code);
    onBackToProfile();
  };

  const handleScroll = () => {
    const list = listRef.current;
    const scrollTop = list.scrollTop;
    const clientHeight = list.clientHeight;
    const scrollHeight = list.scrollHeight;

    setShowTopIndicator(scrollTop > 0);
    setShowBottomIndicator(scrollTop + clientHeight < scrollHeight);

    // const topIndicator = document.querySelector('.scroll-indicator.top');
    const bottomIndicator = document.querySelector('.scroll-indicator.bottom');

    // Toggle the 'show' class based on the indicators' visibility
    // topIndicator.classList.toggle('show', scrollTop > 0);
    bottomIndicator.classList.toggle('showindicator', scrollTop + clientHeight < scrollHeight);
  };

  useEffect(() => {
    const list = listRef.current;
    if (list) {
      handleScroll();
      list.addEventListener('scroll', handleScroll);
      return () => list.removeEventListener('scroll', handleScroll);
    }
  }, []);

  const handleSearchChange = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    const filtered = languages.filter((lang) => lang.name.toLowerCase().includes(query));
    setFilteredLanguages(filtered);
  };

  // MARK: Markup
  return (
    <div id="language-select">
      <div className="language-select-modal">
        <div className="header">
          <div className="icon-back" onClick={onBackToProfile}></div>
          <div className="current-language">
            <span>
              {/* Current Language: */}
              {translate('current_language', language)}
            </span>
            <div
              style={{
                backgroundImage: `url(${languages.find((lang) => lang.code === selectedLanguage)?.flag})`,
                width: '28px',
                height: '20px',
                backgroundSize: 'cover',
                backgroundPosition: 'center center',
                marginLeft: '1rem',
              }}
              className="flag-icon"
              aria-label={`${selectedLanguage} flag`}
              role="img"
            />
          </div>
        </div>

        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder={placeholders[selectedLanguage]}
          className="search-bar"
        />
        {/* <div className={`scroll-indicator top ${showTopIndicator ? 'show' : ''}`}></div> */}
        <ul ref={listRef}>
          {filteredLanguages.length > 0 ? (
            filteredLanguages.map((lang) => (
              <li
                onMouseOver={() => playSound('tickclick', '0.5')}
                key={lang.code}
                className={lang.code === selectedLanguage ? 'selected' : ''}
                onClick={() => handleLanguageChange(lang)}
              >
                <div
                  style={{
                    backgroundImage: `url(${lang.flag})`,
                    width: '28px',
                    height: '20px',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center center',
                    padding: '0',
                  }}
                  className="flag-icon"
                  aria-label={`${lang.name} flag`}
                  role="img"
                />
                {lang.name}
              </li>
            ))
          ) : (
            <li>No languages found</li>
          )}
        </ul>
        <div className={`scroll-indicator bottom ${showBottomIndicator ? 'showindicator' : ''}`}></div>
      </div>
    </div>
  );
};

export default LanguageSelect;
