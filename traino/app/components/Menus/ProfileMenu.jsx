import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppState } from '@/app/hooks/useAppState';
import { logout, setCookie, getCookie } from '@/app/functions/functions';
import { playSound } from '@/app/components/PlaySound';
import Loader from '@/app/components/Loader';
import Link from 'next/link';
import LanguageSelect from '@/app/components/LanguageSelect';

import Image from 'next/image';
// import '../profile/[slug]/notifications/NotificationIcon.css';
// import NotificationIcon from '../../profile/[slug]/notifications/NotificationIcon';

import './ProfileMenu.css';

export default function ProfileMenu({ showMenu, setShowMenu }) {
  const {
    DEBUG,
    isLoggedin,
    userData,
    settingsSound,
    setSettingsSound,
    settingsTheme,
    setSettingsTheme,
    useTranslations,
    language,
    setLanguage,
    fullscreen,
    setFullscreen,
  } = useAppState();
  const [loading, setLoading] = useState(false);
  const [toggleSound, setToggleSound] = useState(settingsSound);
  const [toggleTheme, setToggleTheme] = useState(settingsTheme);
  const [toggleFullscreen, setToggleFullscreen] = useState(fullscreen);
  const [showLanguageSelect, setShowLanguageSelect] = useState(false);

  const { translate } = useTranslations('profile', language);

  const router = useRouter();

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFullscreen =
        !!document.fullscreenElement ||
        !!document.webkitFullscreenElement || // Safari
        !!document.mozFullScreenElement || // Firefox
        !!document.msFullscreenElement; // IE/Edge (old)

      setToggleFullscreen(isFullscreen);
      setFullscreen(isFullscreen);
    };

    // Add event listeners for different browser vendors
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange); // Safari
    document.addEventListener('mozfullscreenchange', handleFullscreenChange); // Firefox
    document.addEventListener('MSFullscreenChange', handleFullscreenChange); // IE/Edge

    return () => {
      // Remove event listeners to prevent memory leaks
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
    // setShowLanguageSelect(false);
    // setShowMenu(true);
  };

  const handleBackToProfile = () => {
    setShowLanguageSelect(false);
    setShowMenu(true);
  };

  const handleCloseClick = () => {
    setShowMenu(false);
  };

  const handleLogout = () => {
    setLoading(true);
    playSound('correct', '0.5');
    DEBUG && console.log('Executing logout...');
    logout(isLoggedin, userData, router);
  };

  const handleLinkClick = (event, href) => {
    event.preventDefault();
    playSound('popclick', '0.5');
    if (window.location.pathname === href) {
      setShowMenu(false);
    } else {
      if (href === '/traino') {
        href = 'https://howitworks.traino.nu/';
        window.open(href, '_blank');
        return;
      } else if (href === '/support') {
        href = 'https://howitworks.traino.nu/support';
        window.open(href, '_blank');
        return;
      } else if (href === '/about') {
        href = 'https://company.traino.nu/about';
        window.open(href, '_blank');
        return;
      } else if (href === '/faq') {
        href = 'https://howitworks.traino.nu/faq';
        window.open(href, '_blank');
        return;
      } else if (href === '/companytraining') {
        href = 'https://companytraining.traino.nu';
        window.open(href, '_blank');
        return;
      } else if (href === '/events') {
        href = 'https://events.traino.nu';
        window.open(href, '_blank');
        return;
      } else {
        setLoading(true);
        router.push(href);
      }
    }
    DEBUG && console.log('Pathnames:', window.location.pathname, href);
  };

  const handleToggleSoundChange = (e) => {
    playSound('check', '0.5');
    const localValue = getCookie('settingsSound');
    const currentSetting = localValue !== null ? localValue === 'true' : true;
    const newSetting = !currentSetting;
    setCookie('settingsSound', newSetting);
    setSettingsSound(!settingsSound);
    setToggleSound(e.target.checked);
    DEBUG && console.log('Before Sound Value: ', localValue);
    DEBUG && console.log('Play Sound: ', newSetting);
  };

  const handleToggleThemeChange = (e) => {
    playSound('check', '0.5');
    const localValue = getCookie('settingsTheme');
    const currentSetting = localValue !== null ? localValue === 'true' : true;
    const newSetting = !currentSetting;
    localStorage.setItem('settingsTheme', newSetting);
    setSettingsTheme(!settingsTheme);
    setToggleTheme(e.target.checked);
    setCookie('settingsTheme', e.target.checked);
  };

  const handleToggleFullscreenChange = (e) => {
    playSound('check', '0.5');
    setToggleFullscreen(e.target.checked);
    if (e.target.checked) {
      setFullscreen(true);
    } else {
      setFullscreen(false);
    }
  };

  // MARK: Markup
  return (
    <>
      {showMenu && (
        <>
          <div id="profilemenu" className={`${showMenu ? 'showing' : ''} ${loading ? 'isloading' : ''}`}>
            {loading ? (
              <Loader />
            ) : (
              <>
                <div className="menutop">
                  <div className="btn-closemenu" onClick={handleCloseClick}></div>
                  <div className="logo"></div>
                </div>
                <div className="menuscrollcontainer">
                  <div className="content">
                    <div className="menucontainer">
                      {!showLanguageSelect && (
                        <>
                          {userData && userData.current && userData.current.id && (
                            <>
                              <ul>
                                {userData.current.id && userData.current.usertype === 'trainee' ? (
                                  <>
                                    <li>
                                      <Link
                                        href={`/trainee/${userData.current.id}/transactions`}
                                        onMouseOver={() => playSound('tickclick', '0.5')}
                                        onClick={(event) =>
                                          handleLinkClick(event, `/trainee/${userData.current.id}/transactions`)
                                        }
                                        className="icon-transactions"
                                      >
                                        {translate('paymenthistory', language)}
                                      </Link>
                                    </li>
                                  </>
                                ) : (
                                  <>{/* Add more trainer options here */}</>
                                )}

                                {/* TODO: ProfileMenu: Notifications not ready */}

                                <li>
                                  <Link
                                    href={`/profile/${userData.current.id}/edit`}
                                    onMouseOver={() => playSound('tickclick', '0.5')}
                                    onClick={(event) => handleLinkClick(event, `/profile/${userData.current.id}/edit`)}
                                    className="icon-settings"
                                  >
                                    {translate('editaccount', language)}
                                  </Link>
                                </li>

                                <li>
                                  <div
                                    className="icon-logout"
                                    onMouseOver={() => playSound('tickclick', '0.5')}
                                    onClick={handleLogout}
                                  >
                                    {translate('logout', language)}
                                  </div>
                                </li>

                                {userData.current.roll === 'admin' && (
                                  <li>
                                    <Link href="/login" onMouseOver={() => playSound('tickclick', '0.5')}>
                                      {translate('switchaccount', language)}
                                    </Link>
                                  </li>
                                )}
                                {userData.current.roll === 'admin' && (
                                  <li>
                                    <Link href="/admin" onMouseOver={() => playSound('tickclick', '0.5')}>
                                      {translate('admin', language)}
                                    </Link>
                                  </li>
                                )}
                              </ul>
                            </>
                          )}
                        </>
                      )}
                      {/* Show either Secondary Menu or Language Select */}
                      {showLanguageSelect ? (
                        <LanguageSelect
                          currentLanguage={language}
                          onChangeLanguage={handleLanguageChange}
                          onBackToProfile={handleBackToProfile}
                        />
                      ) : (
                        <>
                          <ul className="secondarymenu">
                            {!isLoggedin.current && (
                              <>
                                <li>
                                  <Link
                                    href="/login"
                                    onMouseOver={() => playSound('tickclick', '0.5')}
                                    onClick={(event) => handleLinkClick(event, '/login')}
                                  >
                                    {translate('login', language)}
                                  </Link>
                                </li>
                                <li>
                                  <Link
                                    href="/signup"
                                    onMouseOver={() => playSound('tickclick', '0.5')}
                                    onClick={(event) => handleLinkClick(event, '/signup')}
                                  >
                                    {translate('createaccount', language)}
                                  </Link>
                                </li>
                              </>
                            )}
                            <li>
                              <Link
                                href="/support"
                                onMouseOver={() => playSound('tickclick', '0.5')}
                                onClick={(event) => handleLinkClick(event, '/support')}
                              >
                                {translate('support', language)}
                              </Link>
                            </li>
                            <li>
                              <Link
                                href="/companytraining"
                                onMouseOver={() => playSound('tickclick', '0.5')}
                                onClick={(event) => handleLinkClick(event, '/companytraining')}
                              >
                                {translate('companytraining', language)}
                              </Link>
                            </li>
                            <li>
                              <Link
                                href="/traino"
                                onMouseOver={() => playSound('tickclick', '0.5')}
                                onClick={(event) => handleLinkClick(event, '/traino')}
                              >
                                {translate('howitworks', language)}
                              </Link>
                            </li>
                            <li>
                              <Link
                                href="/about"
                                onMouseOver={() => playSound('tickclick', '0.5')}
                                onClick={(event) => handleLinkClick(event, '/about')}
                              >
                                {translate('aboutus', language)}
                              </Link>
                            </li>
                            <li>
                              <Link
                                href="/events"
                                onMouseOver={() => playSound('tickclick', '0.5')}
                                onClick={(event) => handleLinkClick(event, '/events')}
                                target="_blank"
                              >
                                {translate('events', language)}
                                {/* Events */}
                              </Link>
                            </li>
                            <li>
                              <Link
                                href="/faq"
                                onMouseOver={() => playSound('tickclick', '0.5')}
                                onClick={(event) => handleLinkClick(event, '/faq')}
                              >
                                {translate('faq', language)}
                              </Link>
                            </li>

                            {/* Language Change Option */}

                            <li style={{ marginTop: '1rem' }}>
                              <div className="checkboxes">
                                <div className="input-group">
                                  <label
                                    htmlFor="togglesound"
                                    className="rememberme"
                                    onMouseOver={() => playSound('tickclick', '0.5')}
                                  >
                                    <input
                                      className="hiddencheckbox"
                                      type="checkbox"
                                      id="togglesound"
                                      checked={toggleSound}
                                      onChange={handleToggleSoundChange}
                                    />
                                    <span className="customcheckbox"></span>
                                    {toggleSound === true
                                      ? translate('soundon', language)
                                      : translate('soundoff', language)}
                                  </label>
                                </div>
                              </div>
                            </li>
                            <li>
                              <div className="checkboxes">
                                <div className="input-group">
                                  <label
                                    htmlFor="toggletheme"
                                    className="rememberme"
                                    onMouseOver={() => playSound('tickclick', '0.5')}
                                  >
                                    <input
                                      className="hiddencheckbox"
                                      type="checkbox"
                                      id="toggletheme"
                                      checked={toggleTheme}
                                      onChange={handleToggleThemeChange}
                                    />
                                    <span className="customcheckbox"></span>
                                    {toggleTheme === true
                                      ? translate('darktheme', language)
                                      : translate('lighttheme', language)}
                                  </label>
                                </div>
                              </div>
                            </li>
                            <li>
                              <div className="checkboxes">
                                <div className="input-group">
                                  <label
                                    htmlFor="togglefullscreen"
                                    className="rememberme"
                                    onMouseOver={() => playSound('tickclick', '0.5')}
                                  >
                                    <input
                                      className="hiddencheckbox"
                                      type="checkbox"
                                      id="togglefullscreen"
                                      checked={toggleFullscreen}
                                      onChange={handleToggleFullscreenChange}
                                    />
                                    <span className="customcheckbox"></span>
                                    {toggleFullscreen === true
                                      ? translate('fullscreen', language)
                                      : translate('fullscreen', language)}
                                  </label>
                                </div>
                              </div>
                            </li>
                            <li>
                              <div
                                className="icon-language"
                                onClick={() => {
                                  setShowLanguageSelect(true); // Show LanguageSelect component and hide secondary menu
                                }}
                                onMouseOver={() => playSound('tickclick', '0.5')}
                              >
                                <div
                                  style={{
                                    backgroundImage: `url(/flags/${language}.svg)`, // Adjust the path if necessary
                                    width: '28px',
                                    height: '20px',
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center center',
                                    marginRight: '1rem', // Spacing
                                    padding: '0',
                                    borderRadius: '4px',
                                  }}
                                  className="flag-icon"
                                  aria-label={`${language} flag`}
                                  role="img"
                                />
                                {translate('language', language)}
                              </div>
                            </li>
                          </ul>
                        </>
                      )}
                    </div>
                    <div className="menubottom">
                      <div className="socialmedias">
                        <Link
                          href="https://youtube.com/@trainoofficial?feature=shared"
                          target="_blank"
                          className="icon-youtube"
                          onMouseOver={() => playSound('tickclick', '0.5')}
                        >
                          Youtube
                        </Link>
                        <Link
                          href="https://www.tiktok.com/@trainoofficial?_t=8nFINogV9zF&_r=1"
                          target="_blank"
                          className="icon-tiktok"
                          onMouseOver={() => playSound('tickclick', '0.5')}
                        >
                          TikTok
                        </Link>
                        <Link
                          href="https://www.instagram.com/trainoofficial/"
                          target="_blank"
                          className="icon-instagram"
                          onMouseOver={() => playSound('tickclick', '0.5')}
                        >
                          Instagram
                        </Link>
                      </div>
                      <div className="links">
                        {isLoggedin.current && userData.current && userData.current.usertype === 'trainer' && (
                          <Link
                            href="/terms/general-terms-trainer"
                            onClick={(event) => handleLinkClick(event, '/terms/general-terms-trainer')}
                          >
                            {translate('terms', language)}
                          </Link>
                        )}
                        {((isLoggedin.current && userData.current && userData.current.usertype === 'trainee') ||
                          !isLoggedin.current) && (
                          <Link
                            href="/terms/general-terms"
                            onClick={(event) => handleLinkClick(event, '/terms/general-terms')}
                          >
                            {translate('terms', language)}
                          </Link>
                        )}

                        <Link href="/terms/cookies/" onClick={(event) => handleLinkClick(event, '/terms/cookies/')}>
                          Cookies
                        </Link>
                        <Link href="/terms/gdpr/" onClick={(event) => handleLinkClick(event, '/terms/gdpr/')}>
                          GDPR
                        </Link>
                      </div>
                      <span>Copyright © 2024 TRAINO AB</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
          <div className="darkoverlay" onClick={handleCloseClick}></div>
        </>
      )}
    </>
  );
}
