'use client';
import { use, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAppState } from '@/app/hooks/useAppState';
import { playSound } from '@/app/components/PlaySound';
import { getUserDetails, decryptData, getCookie } from '@/app/functions/functions';
import { GDPRPopup } from '@/app/components/GDPRPopup';
import Link from 'next/link';
import ProfileMenu from './ProfileMenu';
import RateTrainer from '@/app/components/Rating/RateTrainer';
// import NotificationIcon from '../../profile/[slug]/notifications/NotificationIcon';

import './Navigation.css';

export default function Navigation(props) {
  const { API_KEY, DEBUG, isLoggedin, userData, sessionObject, baseUrl, loginUpdate, useTranslations, language } =
    useAppState();
  const [chatNum, setChatNum] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const [profilePath, setProfilePath] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [rateTrainer, setRateTrainer] = useState(false);
  const pathname = usePathname();

  const { translate } = useTranslations('global', language);

  // Makes URL for train button if user has visited a sportspage before
  const categoryLink = getCookie('category_link') || '';
  const url = new URL(`/train/`, window.location.origin);
  url.pathname += categoryLink;

  useEffect(() => {
    DEBUG && console.log('loginUpdate Status:', loginUpdate);
  }, [loginUpdate]);

  useEffect(() => {
    const navigate = async () => {
      const enudata = getCookie('enudata');

      if (!userData.current && enudata) {
        try {
          userData.current = JSON.parse(enudata);
          DEBUG && console.log('Userdata, Navigation:', userData.current);
          isLoggedin.current = true;
        } catch (error) {
          DEBUG && console.log('Error, Navigation:', error);
        }
      }

      const sessionId = getCookie('session_id');
      const userId = getCookie('user_id');

      if (sessionId && userId) {
        isLoggedin.current = true;
      } else {
        isLoggedin.current = false;
      }

      if (!userData.current && userId) {
        const userDetails = await getUserDetails(userId);
        userData.current = userDetails;
      }

      let path = '';

      if (userData.current && userData.current.usertype && sessionId) {
        if (userData.current.usertype === 'trainee') {
          path = `/trainee/${userData.current.id}`;
        } else if (userData.current.alias) {
          path = `/trainer/@${userData.current.alias}`;
        }
        setProfilePath(path);
      }

      DEBUG && console.log('Profile Path Navigation:', path);
      DEBUG && console.log('User Data Navigation:', userData.current);

      const active = pathname.startsWith(path) && !pathname.includes('bookings') && !pathname.includes('schedule');
      setIsActive(active);
    };

    navigate();
  }, [pathname, loginUpdate]);

  useEffect(() => {
    // Separate effect to handle updating `isActive` when `profilePath` changes
    const active =
      pathname.startsWith(profilePath) &&
      !pathname.includes('bookings') &&
      !pathname.includes('schedule') &&
      !pathname.includes('stats') &&
      !pathname.includes('payments');

    setIsActive(active);
  }, [pathname, profilePath]);

  useEffect(() => {
    // Get how many new chat messages you have from DB
    setChatNum(5);
  }, [chatNum]);

  const handleMenuClick = () => {
    setShowMenu((prev) => !prev);
    if (!showMenu) {
      playSound('swish2', '0.2');
    }
  };
  // MARK: Markup
  return (
    <>
      {rateTrainer && <RateTrainer userinput={null} onClose={setRateTrainer} />}
      <GDPRPopup />

      <ProfileMenu showMenu={showMenu} setShowMenu={setShowMenu} />

      <div id="navigation">
        <ul>
          {isLoggedin.current &&
          userData.current &&
          userData.current.usertype &&
          userData.current.usertype === 'trainer' ? (
            <>
              {/* Future link for trainers to a statistics page
            <li>

              <Link
                href={`/trainer/${userData.current.alias}/stats`}
                className={`menubutton  ${pathname.endsWith('/stats') ? 'active' : ''}`}
                onMouseOver={() => playSound('tickclick', '0.5')}
              >
                <span className="icon-stats"></span>
                Stats
              </Link>

          </li>
             */}
              <li>
                <Link
                  href={`/trainer/@${userData.current.alias}/payments`}
                  className={`menubutton  ${pathname.endsWith('/payments') ? 'active' : ''}`}
                  onMouseOver={() => playSound('tickclick', '0.5')}
                  onClick={() => playSound('popclick', '0.5')}
                >
                  <span className="icon-payment"></span>
                  {translate('economy', language)}
                </Link>
              </li>
            </>
          ) : (
            <>
              {props.props === 'mapPage' ? (
                <li>
                  <Link
                    href={'/train'}
                    className={`menubutton  ${pathname.endsWith('/train') ? 'active' : ''}`}
                    onClick={() => playSound('popclick', '0.5')}
                    onMouseOver={() => playSound('tickclick', '0.5')}
                  >
                    <span className="icon-train"></span>
                    {translate('train', language)}
                  </Link>
                </li>
              ) : (
                <li>
                  <Link
                    href={url.href}
                    className={`menubutton  ${pathname.endsWith('/train') ? 'active' : ''}`}
                    onClick={() => playSound('popclick', '0.5')}
                    onMouseOver={() => playSound('tickclick', '0.5')}
                  >
                    <span className="icon-train"></span>
                    {translate('train', language)}
                  </Link>
                </li>
              )}
            </>
          )}

          {!isLoggedin.current && (
            <li>
              <Link
                href={'/login'}
                className={`menubutton`}
                onMouseOver={() => playSound('tickclick', '0.5')}
                onClick={() => playSound('popclick', '0.5')}
              >
                <span className="icon-booking"></span>
                {translate('bookings', language)}
              </Link>
            </li>
          )}
          {isLoggedin.current &&
            userData.current &&
            userData.current.usertype &&
            userData.current.usertype === 'trainee' && (
              <li>
                <Link
                  href={`/trainee/${userData.current.id}/bookings`}
                  className={`menubutton  ${pathname.includes('/bookings') ? 'active' : ''}`}
                  onClick={() => playSound('popclick', '0.5')}
                  onMouseOver={() => playSound('tickclick', '0.5')}
                >
                  <span className="icon-booking"></span>
                  {translate('bookings', language)}
                </Link>
              </li>
            )}
          {isLoggedin.current &&
            userData.current &&
            userData.current.usertype &&
            userData.current.usertype === 'trainer' && (
              <li>
                <Link
                  href={`/trainer/@${userData.current.alias}/schedule`}
                  className={`menubutton  ${pathname.includes('/schedule') ? 'active' : ''}`}
                  onMouseOver={() => playSound('tickclick', '0.5')}
                  onClick={() => playSound('popclick', '0.5')}
                >
                  <span className="icon-booking"></span>
                  {translate('schedule', language)}
                </Link>
              </li>
            )}

          {/* TODO: Navigation: No chat in MVPTT
          <li>
            <Link
              href={
                isLoggedin.current && userData.current && userData.current.id
                  ? `/profile/${userData.current.id}/chat`
                  : '/login'
              }
              className={`menubutton  ${pathname.includes('/chat') ? 'active' : ''}`}
            >
              <span className="icon-chat"></span>
              {chatNum > 0 && <span className="amount">{chatNum}</span>}
              Chat
            </Link>
          </li>
          */}
          <li>
            {profilePath !== '' ? (
              <Link
                href={isLoggedin.current ? profilePath : '/login'}
                passHref
                className={`menubutton ${isActive ? 'active' : ''}`}
                onMouseOver={() => playSound('tickclick', '0.5')}
                onClick={() => playSound('popclick', '0.5')}
              >
                <span className="icon-profile"></span>
                {translate('profile', language)}
              </Link>
            ) : (
              <Link
                href={'/login'}
                className={`menubutton`}
                onClick={() => playSound('popclick', '0.5')}
                onMouseOver={() => playSound('tickclick', '0.5')}
              >
                <span className="icon-profile"></span>
                {translate('profile', language)}
              </Link>
            )}
          </li>
          {isLoggedin.current ? (
            <li>
              <div className="menubutton" onClick={handleMenuClick} onMouseOver={() => playSound('tickclick', '0.5')}>
                <span className="icon-hamburger"></span>
                {/* TODO: Notifications not in MVPT
                 <NotificationIcon /> */}
                {translate('more', language)}
              </div>
            </li>
          ) : (
            <li>
              <div className="menubutton" onClick={handleMenuClick} onMouseOver={() => playSound('tickclick', '0.5')}>
                <span className="icon-threedots"></span>
                {translate('more', language)}
              </div>
            </li>
          )}
        </ul>
      </div>
    </>
  );
}
