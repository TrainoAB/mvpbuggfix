/*
 * BugReport Component
 *
 * This component provides a form for users to report bugs they encounter.
 *
 * Information Collected:
 * 1. Browser Information:
 *    - Browser Name and Version
 *    - Operating System
 *    - Device Type
 *    - Screen Resolution
 *
 * 2. Additional Information:
 *    - Current URL
 *    - Timestamp of the report
 *
 * 3. Console Logs and Errors:
 *    - Captures console.log and console.error messages during the user's session
 *
 * 4. Form Fields:
 *    - Areas affected by the bug (checkboxes)
 *    - Severity of the bug (radio buttons)
 *    - Platform (radio buttons)
 *    - Description of the bug
 *    - Screenshot (optional)
 *
 * Data Handling:
 * - The collected information is stored in the component's state.
 * - Console logs and errors are captured and stored in the state.
 * - Form data is validated before submission.
 * - On successful submission, the data is sent to the server endpoint '/api/submit-bug-report' via a POST request.
 * - The user is redirected back to the previous page upon successful submission.
 *
 * Usage:
 * - Import and render the BugReport component where needed.
 * - Ensure the server endpoint '/api/submit-bug-report' is implemented to handle the bug report data.
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Image from 'next/image';
import Bowser from 'bowser';
import Loader from '@/app/components/Loader';
import '../assets/icon-bug.svg';
import './BugReport.css';
import { useAppState } from '@/app/hooks/useAppState';
import { setCookie, getCookie, deleteCookie } from '@/app/functions/functions';
import uploadImage from '@/app/api/aws/upload.js';

const getBrowserInfo = () => {
  if (typeof window !== 'undefined') {
    const browser = Bowser.getParser(window.navigator.userAgent);
    const name = browser.getBrowserName();
    const version = browser.getBrowserVersion();
    const os = browser.getOSName();
    const device = browser.getPlatformType();
    const resolution = `${window.screen.width}x${window.screen.height}`;
    return { browser: name, version, os, device, resolution };
  }
  return {
    browser: 'unknown',
    version: 'unknown',
    os: 'unknown',
    device: 'unknown',
    resolution: 'unknown',
  };
};

const getAdditionalInfo = () => {
  if (typeof window !== 'undefined') {
    return {
      url: window.location.href,
      timestamp: new Date().toISOString(),
    };
  }
  return { url: 'unknown', timestamp: 'unknown' };
};

const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  };
};

const BugReport = () => {
  const { DEBUG, baseUrl, sessionObject, useTranslations, language } = useAppState();

  const { translate } = useTranslations('bugreport', language);

  const userId = useRef(null);
  const [fileObj, setFileObj] = useState(null);

  useEffect(() => {
    // Function to fetch user_id from cookie
    const storedUserId = getCookie('user_id');
    if (storedUserId) {
      userId.current = parseInt(storedUserId); // Assuming user_id is stored as integer
    } else {
      userId.current = null; // Set to null if user_id is not found in cookie
    }

    DEBUG && console.log('User id:', userId.current);
  }, [DEBUG]);

  const [formState, setFormState] = useState({
    user_id: userId.current,
    area: [],
    severity: [],
    platform: [],
    browser: '',
    os: '',
    device: '',
    resolution: '',
    description: '',
    screenshotPreview: null,
    url: '',
    timestamp: '',
    logs: '',
    errors: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const browserInfo = useMemo(getBrowserInfo, []);
  const additionalInfo = useMemo(getAdditionalInfo, []);

  // Capture console logs and errors
  useEffect(() => {
    const logs = [];
    const errors = [];

    const originalLog = console.log;
    const originalError = console.error;

    console.log = (...args) => {
      logs.push(args.join(' '));
      originalLog.apply(console, args);
    };

    console.error = (...args) => {
      errors.push(args.join(' '));
      originalError.apply(console, args);
    };

    return () => {
      console.log = originalLog;
      console.error = originalError;
    };
  }, []);

  useEffect(() => {
    setFormState((prevState) => ({
      ...prevState,
      user_id: userId.current,
      browser: `${browserInfo.browser} ${browserInfo.version}`,
      os: browserInfo.os,
      device: browserInfo.device,
      resolution: browserInfo.resolution,
      url: additionalInfo.url,
      timestamp: additionalInfo.timestamp,
    }));
    DEBUG && console.log(formState);
  }, [browserInfo, additionalInfo, DEBUG]); // Removed formState from dependencies

  const handleChange = useCallback(
    (e) => {
      const { name, value, type } = e.target;
      DEBUG && console.log('handleChange:', { name, value, type });

      setFormState((prevState) => {
        if (type === 'radio') {
          return {
            ...prevState,
            [name]: [value],
          };
        } else if (type === 'checkbox') {
          return {
            ...prevState,
            [name]: prevState[name].includes(value)
              ? prevState[name].filter((item) => item !== value)
              : [...prevState[name], value],
          };
        } else {
          return {
            ...prevState,
            [name]: value,
          };
        }
      });
    },
    [DEBUG],
  );

  const debouncedHandleChange = useMemo(() => debounce(handleChange, 300), [handleChange]);

  const handleFileChange = useCallback(
    (e) => {
      const file = e.target.files[0];
      const fileName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      const fileNameNoSpaces = fileName.replace(/\s+/g, '');

      DEBUG && console.log('handleFileChange:', { file });
      if (file) {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
          const img = new window.Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');

            ctx.drawImage(img, 0, 0, img.width, img.height);
            canvas.toBlob((blob) => {
              setFormState((prevState) => ({
                ...prevState,
                screenshotPreview: reader.result,
              }));

              setFileObj(new File([blob], `${fileNameNoSpaces}.webp`));
            }, 'image/webp');
          };
          img.src = e.target.result;
        };
        reader.onerror = (error) => {
          console.error('Error reading file:', error);
        };
      }
    },
    [DEBUG],
  );

  const validateForm = useCallback(() => {
    const newErrors = {};
    if (formState.area.length === 0) newErrors.area = translate('report_choosearea', language);
    if (formState.severity.length === 0) newErrors.severity = translate('report_chooseseriousness', language);
    if (formState.platform.length === 0) newErrors.platform = translate('report_chooseplatform', language);
    if (formState.browser === '') newErrors.browser = translate('report_choosebrowser', language);
    if (formState.description.trim().length < 10)
      newErrors.description = translate('report_descriptionatleast10char', language);
    setErrors(newErrors);
    DEBUG && console.log('newErrors: ', newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formState, translate, language]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    const storedUserId = getCookie('user_id');
    if (storedUserId) {
      userId.current = parseInt(storedUserId); // Assuming user_id is stored as integer
    } else {
      userId.current = null; // Set to null if user_id is not found in cookie
    }

    setFormState((prevState) => ({
      ...prevState,
      user_id: userId.current,
    }));

    setIsSubmitting(true);

    DEBUG && console.log('Submitting form with data:', formState);

    try {
      const response = await fetch(`${baseUrl}/api/proxy`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sessionObject.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: `${baseUrl}/api/bugreports`,

          method: 'POST',
          body: JSON.stringify(formState),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const successMessage = data.success;
        const reportId = data.report_id;

        if (fileObj != null) {
          const updatedFile = new File([fileObj], reportId + '.webp', { type: 'image/webp' });
          await uploadImage(updatedFile, 'reports').catch((e) => console.error(e));
        }

        DEBUG && console.log(`${successMessage} - ID: ${reportId}`);

        handleReset();
      } else {
        const errorResponse = await response.json();
        DEBUG && console.error('Failed to submit bug report', errorResponse.message);
        setErrors({ submit: translate('report_error', language) });
      }
    } catch (error) {
      DEBUG && console.error('Error submitting form', error);
      setErrors({ submit: translate('unexpectederror', language) });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = useCallback(() => {
    setFormState({
      user_id: userId.current,
      area: [],
      severity: [],
      platform: [],
      browser: '',
      os: '',
      device: '',
      resolution: '',
      description: '',
      screenshotPreview: null,
      url: '',
      timestamp: '',
      logs: '',
      errors: '',
    });
    setErrors({});
    DEBUG && console.log('Form reset');
  }, [DEBUG]);

  return (
    <div className="form-container">
      {isSubmitting ? (
        <Loader />
      ) : (
        <form onSubmit={handleSubmit}>
          <fieldset>
            <legend>1. {translate('report_choosearea', language)}</legend>
            <div className="radio-group">
              {[
                translate('train', language),
                translate('bookings', language),
                translate('chat', language),
                translate('profile', language),
                translate('menu', language),
                translate('login', language),
                translate('schedule', language),
                translate('economy', language),
                translate('withdrawal', language),
                translate('calendar', language),
                translate('signup', language),
                translate('map', language),
                translate('payment', language),
                translate('editaccount', language),
                translate('other', language),
              ].map((item) => (
                <label key={item}>
                  <input
                    type="checkbox"
                    name="area"
                    value={item.toLowerCase()}
                    checked={formState.area.includes(item.toLowerCase())}
                    onChange={debouncedHandleChange}
                    aria-label={item}
                  />{' '}
                  {item}
                </label>
              ))}
            </div>
            {errors.area && <p className="error">{errors.area}</p>}
          </fieldset>
          <hr />
          <fieldset>
            <legend>2. {translate('report_seriousness', language)}</legend>
            <div className="radio-group">
              {[
                translate('report_block', language),
                translate('report_critical', language),
                translate('report_big', language),
                translate('report_small', language),
                translate('report_preposal', language),
              ].map((item) => (
                <label key={item}>
                  <input
                    type="radio"
                    name="severity"
                    value={item.toLowerCase()}
                    checked={formState.severity.includes(item.toLowerCase())}
                    onChange={debouncedHandleChange}
                    aria-label={item}
                  />{' '}
                  {item}
                </label>
              ))}
            </div>
            {errors.severity && <p className="error">{errors.severity}</p>}
          </fieldset>
          <hr />
          <fieldset>
            <legend>3. {translate('report_platform', language)}</legend>
            <div className="radio-group">
              {['Android', 'iOS', 'Desktop'].map((item) => (
                <label key={item}>
                  <input
                    type="radio"
                    name="platform"
                    value={item.toLowerCase()}
                    checked={formState.platform.includes(item.toLowerCase())}
                    onChange={debouncedHandleChange}
                    aria-label={item}
                  />{' '}
                  {item}
                </label>
              ))}
            </div>
            {errors.platform && <p className="error">{errors.platform}</p>}
          </fieldset>
          <hr />
          <fieldset>
            <legend>4. {translate('description', language)}</legend>
            <textarea
              name="description"
              placeholder={translate('description', language)}
              value={formState.description}
              onChange={(e) =>
                setFormState((prevState) => ({
                  ...prevState,
                  description: e.target.value,
                }))
              }
              className="textarea"
              aria-label={translate('description', language)}
            ></textarea>
            {errors.description && <p className="error">{errors.description}</p>}
          </fieldset>
          <hr />
          <fieldset>
            <legend>5. {translate('report_screenshot', language)}</legend>
            <input
              type="file"
              name="screenshot"
              className="file-input"
              onChange={handleFileChange}
              aria-label={translate('report_screenshot', language)}
              id="screenshot"
            />
            <label htmlFor="screenshot">{translate('upload', language)}</label>
            {formState.screenshotPreview && (
              <div className="screenshot-preview">
                <Image
                  src={formState.screenshotPreview}
                  alt="Screenshot Preview"
                  width={500}
                  height={300}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', layout: 'fill' }}
                />
              </div>
            )}
          </fieldset>
          <div className="form-actions">
            <button type="submit" className="button" aria-label={translate('report', language)} disabled={isSubmitting}>
              {isSubmitting ? translate('report_sending', language) : translate('report', language)}
            </button>
            <button
              type="button"
              className="button onlyborder"
              onClick={handleReset}
              aria-label={translate('clear', language)}
            >
              {translate('clear', language)}
            </button>
          </div>
          {errors.submit && <p className="error">{errors.submit}</p>}
        </form>
      )}
    </div>
  );
};

export default BugReport;
