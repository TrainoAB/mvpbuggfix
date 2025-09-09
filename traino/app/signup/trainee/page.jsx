'use client';
import { useState, useEffect, useRef } from 'react';
import { useAppState } from '@/app/hooks/useAppState';
import {
  isValidEmail,
  ifEmailExist,
  getCategories,
  shortenText,
  sanitizeInput,
  validatePassword,
  debounce,
  debounceReturn,
} from '@/app/functions/functions';
import { playSound } from '@/app/components/PlaySound';
import Loader from '@/app/components/Loader';
import SignupDone from '@/app/components/SignupDone';
import Terms from '@/app/components/Terms';
import Link from 'next/link';
import DropdownMenu from '@/app/components/DropdownMenu';
import PasswordToggle from '@/app/components/Inputs/PasswordToggle';
import 'react-phone-number-input/style.css';
import PhoneInput from 'react-phone-number-input';
import { isValidPhoneNumber } from 'react-phone-number-input';
import AddSportProposal from '@/app/components/AddSportProposal';
import StepIndicator from '@/app/components/StepIndicator';
import { set } from 'date-fns';
import TextInput from '@/app/components/Inputs/TextInput';
import PasswordInput from '@/app/components/Inputs/PasswordInput';
import EmailInput from '@/app/components/Inputs/EmailInput';
import GenderSelection from '@/app/components/GenderSelection';
import SignupFormButton from '@/app/components/Buttons/SignupFormButton';

import '../page.css';

const debouncedEmailExistCheck = debounceReturn(ifEmailExist, 300);
const debouncedPasswordValidation = debounceReturn(validatePassword, 200);

export default function SignupTrainee() {
  const {
    useTranslations,
    language,
    sessionObject,
    baseUrl,
    DEBUG,
    showTerms,
    setShowTerms,
    isKeyboardOpen,
    setIsKeyboardOpen,
    isMobile,
    traincategories,
    setTraincategories,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    togglePasswordVis,
  } = useAppState();
  const [emailExistsMessage, setEmailExistsMessage] = useState('');
  const [emailValidationLoading, setEmailValidationLoading] = useState(false);
  const [passwordValidationMessage, setPasswordValidationMessage] = useState('');
  const [showFileMenu, setShowFileMenu] = useState(false);
  const [loading, setLoading] = useState(false);

  const [currentStep, setCurrentStep] = useState(1); // Initialisera currentStep till 1
  const [totalSteps] = useState(2); // Antal steg i din stegindikator
  const [termsError, setTermsError] = useState(false); // State for terms error
  const [mobilephoneError, setMobilephoneError] = useState(false);
  const [stepStatus, setStepStatus] = useState(Array(totalSteps).fill('default'));
  const [sports, setSports] = useState('');
  const [userId, setUserId] = useState('');
  const [mobilephone, setMobilephone] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState([]);

  const inputRefs = useRef([]);
  const categoriesRef = useRef([]);
  const selectInputRef = useRef();

  const { translate } = useTranslations('signup', language);

  // Get categories from DB
  useEffect(() => {
    if (!traincategories) {
      getCategories(setTraincategories)
        .then((data) => {
          DEBUG && console.log('Categories fetched:', data);
          setTraincategories(data);
          categoriesRef.current = data;
        })
        .catch((error) => {
          console.error('Error fetching categories:', error);
        });
    } else {
      categoriesRef.current = traincategories;
    }
  }, [traincategories, setTraincategories]);

  const handleProposalSubmit = (proposal) => {
    // Hantera förslag på nya sporter här.
    DEBUG && console.log('Proposal for new sport:', proposal);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);

    // Filter options based on search term
    const filtered = traincategories.filter((sport) =>
      sport.category_name.toLowerCase().startsWith(event.target.value.toLowerCase()),
    );
    setFilteredOptions(filtered);
    setShowOptions(true); // Show options when user starts typing
  };

  const handleInputClick = () => {
    setShowOptions(true); // Always show options when input field is clicked
  };

  const handleOptionClick = (sportName) => {
    handleAddSport(sportName); // Add sport when user clicks on an option
  };

  // Vilket steg i registreringen
  // Skapa objekt för inputs
  const [formData, setFormData] = useState({
    type: 'trainee',
    firstname: '',
    lastname: '',
    gender: 'male',
    email: '',
    mobilephone: '',
    password: '',
    sports: [],
    image: null,
    terms: false,
  });

  const [isEmailValid, setIsEmailValid] = useState(null); // Add state for email validation

  const handleEmailChange = (e) => {
    handleChange(e);

    // Always validate on change - even for empty values to reset state
    const email = e.target.value.trim();

    if (!email || email === '') {
      setEmailExistsMessage('');
      setIsEmailValid(null);
      setEmailValidationLoading(false);
      e.target.classList.remove('error');
      DEBUG && console.log('Email is empty, resetting validation state');
    } else {
      // Start validation for non-empty emails
      handleEmailDebounce(e);
    }
  };

  useEffect(() => {
    DEBUG && console.log(formData);
  }, [formData]);

  // const togglePasswordVis = (e) => {
  //   e.preventDefault();
  //   setShowPassword((p) => !p);
  // };

  // Function to handle input focus
  const handleInputFocus = (index) => {
    if (isMobile) {
      // Check if ref is defined
      setIsKeyboardOpen(true);
      // Scroll to the focused input
      inputRefs.current[index].scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  };

  // Function to handle input blur
  const handleInputBlur = () => {
    if (isMobile) {
      setIsKeyboardOpen(false);
    }
  };

  const handleEmailDebounce = async (event) => {
    // Check if the keyboard is open (mobile-specific)
    if (isMobile) {
      setIsKeyboardOpen(false);
    }

    const email = event.target.value.trim();

    // Check if email format is valid first
    if (!isValidEmail(email)) {
      setEmailExistsMessage('Invalid email format');
      setIsEmailValid(false);
      setEmailValidationLoading(false);
      event.target.classList.add('error');
      DEBUG && console.log('Email is invalid');
      return;
    }

    try {
      setEmailValidationLoading(true);
      setEmailExistsMessage('');
      setIsEmailValid(null); // Set to null while checking

      // Call the debounced function to check email existence
      const emailExists = await debouncedEmailExistCheck(email);

      console.log('Email check result - Email:', email, 'Exists:', emailExists);

      if (emailExists) {
        setEmailExistsMessage('E-postadress finns redan, välj en annan');
        setIsEmailValid(false);
        event.target.classList.add('error');
      } else {
        setEmailExistsMessage('');
        setIsEmailValid(true);
        event.target.classList.remove('error');
        DEBUG && console.log('Email is available');
      }
    } catch (error) {
      console.error('Error checking email:', error);
      // Don't assume email is available on error - show error state
      setEmailExistsMessage('Unable to verify email. Please try again.');
      setIsEmailValid(false);
      event.target.classList.add('error');
    } finally {
      setEmailValidationLoading(false);
    }
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

  // Lägg in data i objektet on input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    let sanitizedValue;

    switch (name) {
      case 'firstname':
      case 'lastname':
        sanitizedValue = sanitizeInput(value, 'name');
        break;
      case 'email':
        sanitizedValue = sanitizeInput(value, 'email');
        break;
      case 'password':
        sanitizedValue = sanitizeInput(value, 'password');
        break;
      default:
        sanitizedValue = sanitizeInput(value, 'text');
    }

    setFormData({ ...formData, [name]: sanitizedValue });

    // Validate the input field
    if (sanitizedValue === '') {
      e.target.classList.add('error');
    } else {
      e.target.classList.remove('error');
    }

    // Additional validation for specific fields (skip email as it's handled by debounced validation)
    if (name === 'email') {
      // Email validation is handled by handleEmailDebounce
      return;
    }

    if (name === 'password' && sanitizedValue.length < 8) {
      e.target.classList.add('error');
    } else if (name === 'password') {
      e.target.classList.remove('error');
    }
  };

  // Lägg in data i objektet on checkbox change
  const handleChangeCheck = (e) => {
    const { name, checked } = e.target;
    setFormData({ ...formData, [name]: checked });
    const termsContainer = document.querySelector('.terms-container');
    if (termsContainer) {
      if (checked) {
        termsContainer.classList.remove('error');
      } else {
        termsContainer.classList.add('error');
      }
    }
  };

  //MARK: Uppdatera indikatorn
  const updateIndicator = (step) => {
    // Uppdatera indikatorn baserat på det aktuella steget
    const indicatorElement = document.getElementById('step-indicator');
    if (indicatorElement) {
      indicatorElement.textContent = `Steg ${step} av 4`;
    }
  };

  //MARK: Stegen i registeringen
  const handlePageNumberClick = (step) => {
    // Additional email validation check when navigating from step 1
    if (currentStep === 1) {
      if (emailValidationLoading) {
        alert('Email validation is in progress. Please wait for it to complete.');
        return;
      }

      if (formData.email && !isEmailValid) {
        alert('Please enter a valid and available email address.');
        return;
      }

      if (emailExistsMessage !== '') {
        alert(emailExistsMessage);
        return;
      }

      if (isEmailValid !== true && formData.email.trim() !== '') {
        alert('Please wait for email validation to complete or enter a valid email.');
        return;
      }
    }

    const isValid = validateStep(currentStep, formData, emailExistsMessage, translate, language);
    if (isValid) {
      setCurrentStep(step);
    }
  };

  //MARK: Valideringen av formuläret
  const validateStep = (step, formData, emailExistsMessage, translate, language) => {
    let isValid = true;

    if (step === 1) {
      const email = formData.email.trim();
      const firstname = formData.firstname.trim();
      const lastname = formData.lastname.trim();
      const mobilephone = formData.mobilephone ? formData.mobilephone.trim() : '';

      const emailInput = document.querySelector('input[name="email"]');
      const firstnameInput = document.querySelector('input[name="firstname"]');
      const lastnameInput = document.querySelector('input[name="lastname"]');
      const mobilephoneInput = document.querySelector('input[name="mobilephone"]');
      const passwordInput = document.querySelector('input[name="password"]');

      if (firstname === '') {
        if (firstnameInput) firstnameInput.classList.add('error');
        alert(translate('signup_entername', language));
        isValid = false;
      } else {
        if (firstnameInput) firstnameInput.classList.remove('error');
      }

      if (lastname === '') {
        if (lastnameInput) lastnameInput.classList.add('error');
        alert(translate('signup_entername', language));
        isValid = false;
      } else {
        if (lastnameInput) lastnameInput.classList.remove('error');
      }

      if (!isValidEmail(email)) {
        if (emailInput) emailInput.classList.add('error');
        alert(translate('signup_entervalidemail', language));
        isValid = false;
      } else if (emailValidationLoading) {
        if (emailInput) emailInput.classList.add('error');
        alert('Email validation is in progress. Please wait.');
        isValid = false;
      } else if (emailExistsMessage !== '') {
        if (emailInput) emailInput.classList.add('error');
        alert(emailExistsMessage);
        isValid = false;
      } else if (isEmailValid === false) {
        if (emailInput) emailInput.classList.add('error');
        alert('Please enter a valid email address');
        isValid = false;
      } else if (isEmailValid !== true) {
        if (emailInput) emailInput.classList.add('error');
        alert('Please wait for email validation to complete');
        isValid = false;
      } else {
        if (emailInput) emailInput.classList.remove('error');
      }

      // Check if the phone number is not valid or is empty
      if (!isValidPhoneNumber(mobilephone) || mobilephone === '') {
        if (mobilephoneInput) mobilephoneInput.classList.add('error');
        setMobilephoneError(true);
        alert(translate('signup_entercorrectphone', language));
        isValid = false;
      } else {
        if (mobilephoneInput) mobilephoneInput.classList.remove('error');
        setMobilephoneError(false);
        // If phone number is valid set to formData
        setFormData({ ...formData, ['mobilephone']: mobilephone });
      }

      if (!formData.password) {
        if (passwordInput) passwordInput.classList.add('error');
        alert(translate('signup_passwordleastchars', language));
        isValid = false;
      } else {
        if (passwordInput) passwordInput.classList.remove('error');
      }

      const passwordValidationMessage = validatePassword(formData.password);
      if (passwordValidationMessage !== '') {
        if (passwordInput) passwordInput.classList.add('error');
        isValid = false;
      }

      if (!formData.terms) {
        const termsInput = document.querySelector('input[name="terms"]');
        if (termsInput) termsInput.classList.add('error');
        setTermsError(true);
        alert(translate('signup_mustacceptterms', language));
        isValid = false;
      } else {
        const termsInput = document.querySelector('input[name="terms"]');
        if (termsInput) termsInput.classList.remove('error');
        setTermsError(false);
      }
    }

    return isValid;
  };

  //MARK: Handle Submit
  const handleSubmit = (e) => {
    if (e) {
      e.preventDefault();
    }

    // Additional email validation check on submit for step 1
    if (currentStep === 1) {
      if (emailValidationLoading) {
        alert('Email validation is in progress. Please wait for it to complete.');
        return;
      }

      if (formData.email && !isEmailValid) {
        alert('Please enter a valid and available email address.');
        return;
      }

      if (emailExistsMessage !== '') {
        alert(emailExistsMessage);
        return;
      }

      if (isEmailValid !== true && formData.email.trim() !== '') {
        alert('Please wait for email validation to complete or enter a valid email.');
        return;
      }
    }

    const isValid = validateStep(currentStep, formData, emailExistsMessage, translate, language);

    if (!isValid) {
      setStepStatus((prevStatus) => {
        const newStatus = [...prevStatus];
        newStatus[currentStep - 1] = 'failed';
        return newStatus;
      });

      // Highlight invalid fields
      const invalidFields = document.querySelectorAll('.form-field');
      invalidFields.forEach((field) => {
        if (
          field instanceof HTMLInputElement ||
          field instanceof HTMLSelectElement ||
          field instanceof HTMLTextAreaElement
        ) {
          if (!field.checkValidity()) {
            field.classList.add('error');
          }
        }
      });

      return; // Prevent navigation if validation fails
    }

    setStepStatus((prevStatus) => {
      const newStatus = [...prevStatus];
      newStatus[currentStep - 1] = 'completed';
      return newStatus;
    });

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      updateIndicator(currentStep + 1);
    } else if (currentStep === totalSteps) {
      DEBUG && console.log('Form Data to Send to PHP:', formData);
      const formDataJson = JSON.stringify(formData);
      DEBUG && console.log(formDataJson);
      setLoading(true);

      async function handleSubmitForm(formDataJson) {
        try {
          const response = await fetch(`${baseUrl}/api/proxy`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${sessionObject.token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              url: `${baseUrl}/api/signup`,
              method: 'POST',
              body: formDataJson,
            }),
          });

          if (!response.ok) {
            alert(translate('networkresponseerror', language));
            throw new Error('Network response was not ok');
          }

          const data = await response.json();

          if (data.error) {
            throw new Error(data.error);
          } else if (data.message) {
            alert(data.message);
          } else {
            DEBUG && console.log('Sign up successful!');
            setUserId(data.user_id);
            setCurrentStep(currentStep + 1);
            updateIndicator(currentStep + 1);
          }
        } catch (error) {
          DEBUG && console.log(error.message);
        } finally {
          setLoading(false);
        }
      }

      handleSubmitForm(formDataJson);
    }
  };

  // Minus 1 steg per varje tillbaka knapp
  const handleBack = () => {
    console.log('Step:', currentStep);
    playSound('plopclick', '0.5');
    setShowFileMenu(false);
    setCurrentStep(currentStep - 1);
  };

  const handleOpenTerms = () => {
    playSound('check', '0.5');
    setShowTerms(true);
  };

  const [selectedGender, setSelectedGender] = useState('male');

  const handleGenderChange = (genderinput) => {
    setSelectedGender(genderinput);
    setFormData({ ...formData, gender: genderinput });
  };

  const handleAddSport = (sportName) => {
    const sport = traincategories.find((sport) => sport.category_name === sportName);
    if (sport && !formData.sports.some((s) => s.id === sport.id)) {
      setFormData((prevFormData) => ({
        ...prevFormData,
        sports: [...prevFormData.sports, sport],
      }));
      setSearchTerm('');
      setFilteredOptions([]);
      setShowOptions(false);
    } else {
      alert(translate('signup_sportalreadyexists', language));
    }
  };

  const handleDeleteSports = (index) => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      sports: prevFormData.sports.filter((_, i) => i !== index),
    }));
  };

  const handleMobilePhone = (value) => {
    setMobilephone(value);

    setFormData((prevFormData) => {
      const newFormData = {
        ...prevFormData,
        mobilephone: value,
      };
      DEBUG && console.log(newFormData);
      return newFormData;
    });

    // Update mobilephoneError state based on input value
    if (value && value.trim() !== '') {
      setMobilephoneError(false);
    } else {
      setMobilephoneError(true);
    }
  };

  // MARK: RenderFormStep
  // Switch att rendrera, mellan de olika registrerings stegen
  const renderFormStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <>
            <form
              onSubmit={handleSubmit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                }
              }}
            >
              <TextInput
                id="firstname"
                name="firstname"
                value={formData.firstname}
                onChange={handleChange}
                placeholder={translate('firstname', language)}
                className="form-field"
                ref={(el) => (inputRefs.current[0] = el)}
              />
              <TextInput
                id="lastname"
                name="lastname"
                value={formData.lastname}
                onChange={handleChange}
                placeholder={translate('lastname', language)}
                className="form-field"
                ref={(el) => (inputRefs.current[1] = el)}
              />
              <EmailInput
                id="email"
                name="email"
                value={formData.email}
                onChange={handleEmailChange} // Use the new handleEmailChange function
                placeholder={translate('email', language)}
                className="form-field email-input"
                ref={(el) => (inputRefs.current[2] = el)}
                emailExistsMessage={emailExistsMessage}
                isValidEmail={isEmailValid} // Pass the email validation state
                isLoading={emailValidationLoading}
                iconClassName="input-email-icon-user" // Pass the specific icon class name
              />
              <div className="column2">
                <div className="checkboxes">
                  <GenderSelection
                    selectedGender={selectedGender}
                    handleGenderChange={handleGenderChange}
                    translate={translate}
                    language={language}
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="mobilephone">{translate('mobilephone', language)}</label>
                  <div className={`phone-input-container ${mobilephoneError ? 'error' : ''}`}>
                    <PhoneInput
                      placeholder={translate('mobilephone', language)}
                      value={formData.mobilephone || ''}
                      onChange={handleMobilePhone}
                      defaultCountry="SE"
                      ref={(el) => (inputRefs.current[3] = el)}
                    />
                  </div>
                </div>
              </div>

              <PasswordInput
                id="password"
                name="password"
                value={formData.password}
                onChange={(e) => {
                  handleChange(e);
                  debouncedPasswordValidation(e.target.value);
                  handlePasswordDebounce(e);
                }}
                placeholder={translate('password', language)}
                ref={(el) => (inputRefs.current[4] = el)}
                showPassword={showPassword}
                togglePasswordVis={togglePasswordVis}
                validationMessage={passwordValidationMessage}
              />

              <div className="checkboxes">
                <div className="input-group">
                  <label htmlFor="terms" className={`terms-container ${termsError ? 'error' : ''}`}>
                    <input
                      className="hiddencheckbox"
                      type="checkbox"
                      id="terms"
                      name="terms"
                      checked={formData.terms}
                      onClick={() => playSound('check', '0.5')}
                      onChange={handleChangeCheck}
                    />
                    <span className="customcheckbox"></span>
                    {translate('acceptour', language)}
                    <span className="showterms" onClick={handleOpenTerms}>
                      {translate('terms', language).toLowerCase()}
                    </span>
                  </label>
                </div>
              </div>
              <SignupFormButton
                emailExistsMessage={emailExistsMessage}
                emailValidationLoading={emailValidationLoading}
                isValidEmail={isEmailValid}
                formData={formData}
                translate={translate}
                language={language}
                currentStep={currentStep}
                totalSteps={totalSteps}
              />
            </form>
          </>
        );
      // MARK: Step 2
      case 2:
        return (
          <>
            {loading ? (
              <Loader />
            ) : (
              <>
                <form onSubmit={handleSubmit} id="register-step2">
                  <div className="sports-items">
                    <div className="input-group">
                      <label htmlFor="training">{translate('training', language)}</label>
                      <DropdownMenu
                        style={{ scrollbarColor: 'black' }}
                        sportsCategories={traincategories}
                        handleAddSport={handleAddSport}
                        selectInputRef={selectInputRef}
                      />
                    </div>
                    <div className="education-items">
                      {formData.sports.length > 0 &&
                        formData.sports.map((item, index) => (
                          <div key={index} className="education-item">
                            {translate(`cat_${item.category_link}`, language)}
                            <span className="delete-item" onClick={() => handleDeleteSports(index)}>
                              X
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                  <button type="submit" className="button">
                    {translate('done', language)}
                  </button>
                  <button type="button" className="button onlyborder mt-05" onClick={handleBack}>
                    {translate('back', language)}
                  </button>
                </form>
              </>
            )}
          </>
        );
      // MARK: Step 3
      case 3:
        return (
          <>
            <SignupDone />
          </>
        );

      default:
        return null;
    }
  };
  // MARK: Markup
  return (
    <main id="signup-user" className={isKeyboardOpen ? 'showkeyboard' : ''}>
      <StepIndicator
        currentStep={currentStep}
        totalSteps={totalSteps}
        onPageNumberClick={handlePageNumberClick}
        handleSubmit={handleSubmit}
        stepStatus={stepStatus}
      />
      <Terms type="trainee" />
      <div className="categorytop">
        <Link href="/signup" className="btn-back"></Link>
        <h1>{translate('createtrainee', language)}</h1>
        <span className="icon-profile"></span>
      </div>
      <div className="content">
        <div className="scrollcontent">{renderFormStep()}</div>
      </div>
    </main>
  );
}
