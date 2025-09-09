'use client';
import { useState, useEffect } from 'react';
import { useAppState } from '@/app/hooks/useAppState';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Loader from '@/app/components/Loader';
import PasswordToggle from '@/app/components/Inputs/PasswordToggle';
import { validatePassword, debounceReturn } from '@/app/functions/functions';
import './page.css';

const debouncedPasswordValidation = debounceReturn(validatePassword, 200);

export default function ForgotPassword({ params }) {
  const { DEBUG, useTranslations, language, isMobile, setIsKeyboardOpen, sessionObject, baseUrl } = useAppState();

  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [passwordset, setPasswordset] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const [profileFound, setProfileFound] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // State for password visibility
  const [showPassword2, setShowPassword2] = useState(false); // State for the second password visibility
  const [passwordValidationMessage, setPasswordValidationMessage] = useState('');
  const [password2ValidationMessage, setPassword2ValidationMessage] = useState('');

  const { translate } = useTranslations('forgotpassword', language);

  const router = useRouter();

  useEffect(() => {
    const email = decodeURIComponent(params.slug[0]);
    const hashkey = decodeURIComponent(params.slug[1]);

    const data = {
      email: email,
      hashkey: hashkey,
    };

    async function checkResetPassword(data) {
      try {
        const response = await fetch(`${baseUrl}/api/proxy`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${sessionObject.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: `${baseUrl}/api/check_reset_password`,
            method: 'POST',
            body: JSON.stringify(data),
          }),
        });

        const result = await response.json();

        if (result.error === 'No user found') {
          console.error('Error:', result.error);
          router.push('/login');
          return;
        }

        if (response.ok) {
          DEBUG && console.log('Success:', result.message);
          setProfileFound(true);
        } else {
          console.error('Error:', result.error);
          router.push('/login');
          return;
        }
      } catch (error) {
        console.error('Error:', error.message);
        router.push('/login');
        return;
      }
    }

    checkResetPassword(data);
  }, [params.slug]);

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    handlePasswordDebounce(e);
  };

  const handlePassword2Change = (e) => {
    setPassword2(e.target.value);
    handlePassword2Validation(e);
  };

  const handlePasswordDebounce = async (event) => {
    try {
      const password = event.target.value;
      const validationMessage = await debouncedPasswordValidation(password);

      if (validationMessage) {
        setPasswordValidationMessage(validationMessage);
        event.target.classList.add('error');
      } else {
        setPasswordValidationMessage('');
        event.target.classList.remove('error');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handlePassword2Validation = (event) => {
    const password2Value = event.target.value;
    if (password2Value && password2Value !== password) {
      setPassword2ValidationMessage(translate('password_mustmatch', language));
      event.target.classList.add('error');
    } else {
      setPassword2ValidationMessage('');
      event.target.classList.remove('error');
    }
  };

  const handleLinkClick = (event) => {
    event.preventDefault();
    setLoading(true);
    DEBUG && console.log('Credentials: ', password, password2);
    DEBUG && console.log(params.slug[0], params.slug[1]);

    if (password === '' || password2 === '') {
      alert(translate('password_cantbeempty', language));
      setLoading(false);
      return;
    }

    // Use the same validation as signup
    const passwordValidationMessage = validatePassword(password);
    if (passwordValidationMessage !== '') {
      alert(passwordValidationMessage);
      setLoading(false);
      return;
    }

    if (password !== password2) {
      alert(translate('password_mustmatch', language));
      setLoading(false);
      return;
    }

    const email = decodeURIComponent(params.slug[0]);
    const hashkey = decodeURIComponent(params.slug[1]);

    const passwordtrim = password.trim();

    const data = {
      email: email,
      hashkey: hashkey,
      password: passwordtrim,
    };

    async function resetPassword(data) {
      try {
        const response = await fetch(`${baseUrl}/api/proxy`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${sessionObject.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: `${baseUrl}/api/reset_password`,
            method: 'POST',
            body: JSON.stringify(data),
          }),
        });
        const result = await response.json();

        if (response.ok) {
          DEBUG && console.log('Success:', result.message);
          setPasswordset(true);
          setLoading(false);
        } else {
          console.error('Error:', result.error);
          alert('Error:', result.error);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error:', error.message);
        alert('Error:', error.message);
        setLoading(false);
      }
    }

    resetPassword(data);
  };

  return (
    <main id="resetpassword">
      <button className="back-btn" onClick={() => router.push('/login')}></button>
      <div className="content-container">
        {!profileFound ? (
          <div className="firstloader">
            <Loader />
          </div>
        ) : (
          <>
            <div className="icon-div"></div>

            {!passwordset ? (
              <>
                <h1 className="header">{translate('reset_password', language)}</h1>
                <div className="text-div">{translate('reset_passwordtext', language)}</div>
                <form className="input-container">
                  <label htmlFor="password" className="label">
                    {translate('new_password', language)}
                  </label>
                  <div className="input-group">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      placeholder={translate('new_password', language)}
                      value={password}
                      onChange={handlePasswordChange}
                      className="input"
                    />
                    <PasswordToggle
                      showPassword={showPassword}
                      togglePasswordVis={() => setShowPassword(!showPassword)}
                    />
                  </div>
                  {passwordValidationMessage && (
                    <div className="validation-message error">{passwordValidationMessage}</div>
                  )}
                  <br />
                  <label htmlFor="password2" className="label">
                    {translate('confirm_password', language)}
                  </label>
                  <div className="input-group">
                    <input
                      type={showPassword2 ? 'text' : 'password'}
                      id="password2"
                      placeholder={translate('confirm_password', language)}
                      value={password2}
                      onChange={handlePassword2Change}
                      className="input"
                    />
                    <PasswordToggle
                      showPassword={showPassword2}
                      togglePasswordVis={() => setShowPassword2(!showPassword2)}
                    />
                  </div>
                  {password2ValidationMessage && (
                    <div className="validation-message error">{password2ValidationMessage}</div>
                  )}
                  <br />

                  <button className="button" onClick={handleLinkClick} disabled={isLoading}>
                    {translate('create_new_password', language)}
                  </button>
                </form>
              </>
            ) : (
              <>
                <h1 className="header">{translate('password_changed', language)}</h1>
                <div className="text-div">{translate('password_changetext', language)}</div>
                <Link href="/login" className="button">
                  {translate('login', language)}
                </Link>
              </>
            )}
          </>
        )}
      </div>
    </main>
  );
}
