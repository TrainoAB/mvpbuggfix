'use client';
import { useState, useEffect, useRef, forwardRef } from 'react';
import { useAppState } from '@/app/hooks/useAppState';
import {
  shortenText,
  getCategories,
  isValidEmail as validateEmailFormat,
  ifEmailExist,
  ifAliasExist,
  debounce,
  debounceReturn,
  sanitizeInput,
  validatePassword,
  validateNewSport,
  saveToDB,
} from '@/app/functions/functions';
import { playSound } from '@/app/components/PlaySound';
import { isValidPhoneNumber } from 'react-phone-number-input';
import { sweden } from 'verifiera';
import { validate } from 'uuid';
import PhoneInput, { PhoneNumber } from 'react-phone-number-input';
import Loader from '@/app/components/Loader';
import ImageSelect from '@/app/components/ImageSelect';
import SignupDone from '@/app/components/SignupDone';
import Terms from '@/app/components/Terms';
import Link from 'next/link';
import TrainCategory from '@/app/components/TrainCategory';
import PasswordToggle from '@/app/components/Inputs/PasswordToggle';
import AddressAutoComplete from '@/app/components/Inputs/AddressAutoComplete';
import UploadModule from '@/app/components/UploadModule/UploadModule';
import AddSportProposal from '@/app/components/AddSportProposal';
import DropdownMenu from '@/app/components/DropdownMenu';
import uploadImage from '@/app/api/aws/upload.js';
// import BankIDComponent from '@/app/components/BankId/BankIdComponent';
import StepIndicator from '@/app/components/StepIndicator';
import TextInput from '@/app/components/Inputs/TextInput';
import PasswordInput from '@/app/components/Inputs/PasswordInput';
import EmailInput from '@/app/components/Inputs/EmailInput';
import GenderSelection from '@/app/components/GenderSelection';
import SignupFormButton from '@/app/components/Buttons/SignupFormButton';
import PersonalNumberInput from '@/app/components/Inputs/PersonalNumberInput';
import AliasInput from '@/app/components/Inputs/AliasInput';

import '../page.css';
import 'react-phone-number-input/style.css';

// Debounced functions
const debouncedEmailExistCheck = debounceReturn(ifEmailExist, 300);
const debouncedAliasExistCheck = debounceReturn(ifAliasExist, 300);
const debouncedPasswordValidation = debounceReturn(validatePassword, 200);

// Function start
export default function SignupTrainer() {
  const {
    DEBUG,
    useTranslations,
    language,
    traincategories,
    setTraincategories,
    sessionObject,
    baseUrl,
    showTerms,
    setShowTerms,
    isKeyboardOpen,
    setIsKeyboardOpen,
    isMobile,
    openModal,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    togglePasswordVis,
  } = useAppState();

  const [bankIdDisabled, setBankIdDisabled] = useState(true);
  const [licenseSkipped, setLicenseSkipped] = useState(false);
  const [showFileMenu, setShowFileMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailExistsMessage, setEmailExistsMessage] = useState('');
  const [emailValidationLoading, setEmailValidationLoading] = useState(false);
  const [aliasExistsMessage, setAliasExistsMessage] = useState('');
  const [addressEmptyMessage, setAddressEmptyMessage] = useState('');
  const [education, setEducation] = useState('');
  const [sports, setSports] = useState('');
  const [sportsArray, setSportsArray] = useState([]);
  const [passwordValidationMessage, setPasswordValidationMessage] = useState('');
  const [mobilephone, setMobilephone] = useState('');
  const [mobilephoneError, setMobilephoneError] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [termsError, setTermsError] = useState(false);
  const [sportsError, setSportsError] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState([]);
  const [newSport, setNewSport] = useState('');
  const [userId, setUserId] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isValidPersonalNumber, setIsValidPersonalNumber] = useState(null);
  const [isValidEmail, setIsValidEmail] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState(null);
  //const [traincategoriesTranslated, setTraincategoriesTranslated] = useState([]);
  const categoriesRef = useRef([]);

  const totalSteps = 4;
  const [stepStatus, setStepStatus] = useState(Array(totalSteps).fill('default'));
  const [currentStep, setCurrentStep] = useState(1);

  const inputRefs = useRef([]);
  const selectInputRef = useRef();
  const dropdownRef = useRef(null);

  const { translate } = useTranslations('signup', language);
  const { translate: translateGlobal } = useTranslations('global', language);

  // Vilket steg i registreringen
  // Skapa objekt för inputs
  const [formData, setFormData] = useState({
    type: 'trainer',
    firstname: '',
    lastname: '',
    gender: 'male',
    alias: '',
    email: '',
    mobilephone: '',
    password: '',
    personalnumber: '',
    address: '',
    latitude: '',
    longitude: '',
    education: [],
    sports: [],
    newsport: [],
    files: [],
    image: null,
    bankid: false,
    terms: false,
  });

  const [errors, setErrors] = useState({
    firstname: false,
    lastname: false,
  });

  // Translate categories
  // useEffect(() => {
  //   const updateLanguage = () => {
  //     const translatedCategories = traincategories.map((cat) => ({
  //       ...cat, // Keep other properties of the category
  //       category_name: translate(`cat_${cat.category_link}`, language), // Translate the category name
  //     }));
  //     setTraincategoriesTranslated(translatedCategories);
  //   };

  //   updateLanguage();
  // }, [traincategories]);

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

  useEffect(() => {
    DEBUG && console.log(selectedFiles);
  }, [selectedFiles]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        !event.target.classList.contains('option')
      ) {
        setShowOptions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownRef]);

  const handleProposalSubmit = (proposal) => {
    // Hantera förslag på nya sporter här.
    DEBUG && console.log('Förslag på ny sport:', proposal);
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

  const validateEmail = (email) => {
    DEBUG && console.log('Calling isValidEmail with:', email);
    const result = isValidEmail(email);
    DEBUG && console.log('Validation result:', result);
    return result;
  };

  const handleAddEducation = (event) => {
    const newEducation = inputRefs.current[8].value.trim();
    addUniqueEducation(newEducation);
  };

  const handleKeyDownEducation = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      const newEducation = event.target.value.trim();
      addUniqueEducation(newEducation);
    }
  };

  const handleNewSportChange = (event) => {
    setNewSport(event.target.value);
  };

  const addUniqueEducation = (newEducation) => {
    if (newEducation !== '' && !formData.education.includes(newEducation)) {
      setFormData((prevFormData) => ({
        ...prevFormData,
        education: [...prevFormData.education, newEducation],
      }));
      inputRefs.current[8].value = ''; // Clear the input field directly
      setEducation('');
      DEBUG && console.log(formData.education);
    } else {
      inputRefs.current[8].value = ''; // Clear the input field directly
      setEducation('');
      DEBUG && console.log('This education already exists or is empty.');
    }
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
      setSportsError(false); // Clear the error state when a sport is added
    } else {
      alert(translate('signup_sportalreadyexists', language));
    }
  };

  const handleAddNewSport = (newSport) => {
    if (newSport !== '' && formData.newsport.includes(newSport)) {
      // alert(translate('signup_sportalreadyexists', language));
      return;
    }

    if (validateNewSport(newSport, traincategories) === 'too-long') {
      // alert(translate('signup_sportnametolong', language));
      setNewSport('');
      return;
    }

    if (validateNewSport(newSport, traincategories) === 'existing-sport') {
      // alert(translate('signup_sportexistsinsystem', language));
      return;
    }

    if (validateNewSport(newSport, traincategories) === 'invalid-characters') {
      // alert(translate('signup_sporthaveilegalcharacters', language));
      setNewSport('');
      return;
    }

    if (validateNewSport(newSport, traincategories) === 'valid') {
      setFormData((prevFormData) => {
        // Create the new form data object
        const newFormData = {
          ...prevFormData,
          newsport: [...prevFormData.newsport, newSport], // Add the new sport to the array
        };

        // Debugging log
        DEBUG && console.log(newFormData);

        // Return the new form data
        return newFormData;
      });
      setNewSport('');
    }
  };

  const validateAlias = async (alias, aliasInput) => {
    if (alias.trim() === '') {
      setAliasExistsMessage('Alias cannot be empty');
      aliasInput.classList.add('error');
      return false;
    }

    try {
      const aliasExists = await debouncedAliasExistCheck(alias);
      DEBUG && console.log('Alias exists:', aliasExists);

      if (aliasExists) {
        setAliasExistsMessage('Alias already exists, please choose another');
        aliasInput.classList.add('error');
        return false;
      } else {
        setAliasExistsMessage('');
        aliasInput.classList.remove('error');
        DEBUG && console.log('Alias does not exist or an error occurred');
        return true;
      }
    } catch (error) {
      console.error('Error:', error);
      setAliasExistsMessage('An error occurred while checking the alias.');
      aliasInput.classList.add('error');
      return false;
    }
  };

  const handleAddFiles = async (event) => {
    const newFiles = Array.from(inputRefs.current[11].files);
    const updatedFiles = [...selectedFiles, ...newFiles];
    setSelectedFiles(updatedFiles);

    const fileNames = updatedFiles.map((file) => file.name);

    if (fileNames.length > 0) {
      setFormData((prevFormData) => ({
        ...prevFormData,
        files: [...prevFormData.files, ...fileNames], // Append new files to the existing files array
      }));
      // Clear the input field directly
      inputRefs.current[11].value = '';
      DEBUG && console.log(formData.files);
    } else {
      // Clear the input field directly
      inputRefs.current[11].value = '';
      DEBUG && console.log('No files selected.');
    }
  };

  const handleInputFocus = (index) => {
    if (isMobile) {
      setIsKeyboardOpen(true);
      inputRefs.current[index].scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  };

  const handleInputBlur = () => {
    if (isMobile) {
      setIsKeyboardOpen(false);
    }
  };

  const handleEmailChange = (e) => {
    handleChange(e);

    // Always validate on change - even for empty values to reset state
    const email = e.target.value.trim();

    if (!email || email === '') {
      setEmailExistsMessage('');
      setIsValidEmail(null);
      setEmailValidationLoading(false);
      e.target.classList.remove('error');
      DEBUG && console.log('Email is empty, resetting validation state');
    } else {
      // Start validation for non-empty emails
      handleEmailDebounce(e);
    }
  };

  const handleEmailDebounce = async (event) => {
    if (isMobile) {
      setIsKeyboardOpen(false);
    }

    const email = event.target.value.trim();

    // Check if email format is valid first
    if (!validateEmailFormat(email)) {
      setEmailExistsMessage('Invalid email format');
      setIsValidEmail(false);
      setEmailValidationLoading(false);
      event.target.classList.add('error');
      DEBUG && console.log('Email is invalid');
      return;
    }

    try {
      setEmailValidationLoading(true);
      setEmailExistsMessage('');
      setIsValidEmail(null); // Set to null while checking

      // Call the debounced function to check email existence
      const emailExists = await debouncedEmailExistCheck(email);

      console.log('Email check result - Email:', email, 'Exists:', emailExists);

      if (emailExists) {
        setEmailExistsMessage('E-postadress finns redan, välj en annan');
        setIsValidEmail(false);
        event.target.classList.add('error');
      } else {
        setEmailExistsMessage('');
        setIsValidEmail(true);
        event.target.classList.remove('error');
        DEBUG && console.log('Email is available');
      }
    } catch (error) {
      console.error('Error checking email:', error);
      setEmailExistsMessage('Unable to verify email. Please try again.');
      setIsValidEmail(false);
      event.target.classList.add('error');
    } finally {
      setEmailValidationLoading(false);
    }
  };

  const handleAliasDebounce = async (event) => {
    DEBUG && console.log('handleAliasDebounce called');

    if (isMobile) {
      setIsKeyboardOpen(false);
    }

    const alias = event.target.value;
    DEBUG && console.log('Alias input value:', alias);

    await validateAlias(alias, event.target);
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
        DEBUG && console.log('Password is valid or an error occurred');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleChange = (e) => {
    let lowerCaseValue = '';

    const { name, value } = e.target;
    DEBUG && console.log(`Input changed: ${name}, Value: ${value}`);

    // Apply max length check for alias, firstname, and lastname
    if (['alias', 'firstname', 'lastname'].includes(e.target.id)) {
      if (value.length > 30) {
        DEBUG && console.log(`${e.target.id} too long:`, value);
        return;
      }
    }

    // Check if alias contains invalid characters or is too long
    if (e.target.id === 'alias') {
      const newChar = e.nativeEvent?.data;

      // Block disallowed characters
      if (/[^\dA-Za-z]/.test(newChar)) {
        DEBUG && console.log('Character not allowed:', newChar);
        return;
      }

      // Convert to lowercase
      lowerCaseValue = value.toLowerCase();
    } else {
      lowerCaseValue = value;
    }

    // Treat all input values as strings
    const newValue = lowerCaseValue !== '' ? lowerCaseValue.toString() : '';

    // Use sanitized value for specific fields
    let sanitizedValue;
    switch (name) {
      case 'firstname':
      case 'lastname':
        sanitizedValue = sanitizeInput(newValue, 'name');
        break;
      case 'email':
        sanitizedValue = sanitizeInput(newValue, 'email');
        break;
      case 'password':
        sanitizedValue = sanitizeInput(newValue, 'password');
        break;
      case 'alias':
        sanitizedValue = sanitizeInput(newValue, 'alias');
        break;
      case 'personalnumber':
        sanitizedValue = sanitizeInput(newValue, 'personalnumber');
        break;
      case 'address':
        sanitizedValue = sanitizeInput(newValue, 'address');
        break;
      default:
        sanitizedValue = sanitizeInput(newValue, 'text');
    }

    setFormData((prevFormData) => {
      const newFormData = {
        ...prevFormData,
        [name]: sanitizedValue,
      };
      DEBUG && console.log(newFormData);
      return newFormData;
    });

    // Update formData state
    setFormData((prevFormData) => ({
      ...prevFormData,
      [name]: value,
    }));

    if (e.target instanceof Element && 'classList' in e.target) {
      if (value.trim() !== '') {
        e.target.classList.remove('error');
      } else {
        e.target.classList.add('error');
      }
    }
  };

  //MARK: updateIndicator
  const updateIndicator = (step) => {
    // Uppdatera indikatorn baserat på det aktuella steget
    const indicatorElement = document.getElementById('step-indicator');
    if (indicatorElement) {
      indicatorElement.textContent = `Steg ${step} av 4`;
    }
  };

  const handleAddressSelect = (suggestion) => {
    const formattedAddress = `${suggestion.name} ${suggestion.streetNumber}, ${
      suggestion.city ? suggestion.city : suggestion.municipality
    }, ${suggestion.country}`;

    // Update productObject with new address details
    setFormData((prevFormData) => {
      const updatedData = {
        ...prevFormData,
        address: formattedAddress,
        latitude: suggestion.latitude,
        longitude: suggestion.longitude,
      };

      DEBUG && console.log('Updated ProductObject:', updatedData);
      return updatedData;
    });

    // Set the selected address separately
    setSelectedAddress({
      name: suggestion.name,
      streetNumber: suggestion.streetNumber,
      city: suggestion.city || suggestion.municipality,
      country: suggestion.country,
      latitude: suggestion.latitude,
      longitude: suggestion.longitude,
    });

    DEBUG &&
      console.log('Selected Address:', {
        name: suggestion.name,
        streetNumber: suggestion.streetNumber,
        city: suggestion.city || suggestion.municipality,
        country: suggestion.country,
        latitude: suggestion.latitude,
        longitude: suggestion.longitude,
      });

    // Validate if the address is empty
    if (formattedAddress.trim() !== '') {
      setAddressEmptyMessage(false);
    } else {
      setAddressEmptyMessage(true);
    }
  };

  const handleChangeEducation = (e) => {
    const { value } = e.target;
    const sanitizedValue = sanitizeInput(value, 'text');
    setEducation(sanitizedValue);
  };

  const handleChangeCheck = (e) => {
    const { name, checked } = e.target;
    setFormData((prevFormData) => ({
      ...prevFormData,
      [name]: checked,
    }));
    // Remove or add error class based on checkbox state
    const termsContainer = document.querySelector('.terms-container');
    if (termsContainer) {
      if (checked) {
        termsContainer.classList.remove('error');
      } else {
        termsContainer.classList.add('error');
      }
    }
  };

  // MARK: personnummer validation
  const validatePersonalNumber = () => {
    if (formData.personalnumber) {
      const personalnumber = formData.personalnumber;

      if (!personalnumber.includes('-')) {
        setIsValidPersonalNumber(false);
        alert(translate('signup_wrongpersonalnumber', language));
        return;
      }

      const formattedPersonalNumber = personalnumber.replace(/(\d{8})(\d{4})$/, '$1-$2');
      DEBUG && console.log('After', formattedPersonalNumber);

      const formattedForValidation = formattedPersonalNumber.slice(2);

      DEBUG && console.log('For validation:', formattedForValidation);

      const ssn = sweden(formattedForValidation);
      const isValid = ssn.validate();
      setIsValidPersonalNumber(isValid);

      DEBUG && console.log(formattedForValidation);

      if (!isValid) {
        alert(translate('signup_wrongpersonalnumber', language));
        return;
      }
    } else {
      setIsValidPersonalNumber(false);
      alert(translate('signup_enterpersonalnumber', language));
      return;
    }
  };

  const validateStep = async (step, formData, emailExistsMessage, translate, language) => {
    let isValid = true;

    if (step === 1) {
      DEBUG && console.log('Validate step 1');
      //MARK: Valideringslogik för steg 1
      const emailInput = document.querySelector('input[name="email"]');
      const firstnameInput = document.querySelector('input[name="firstname"]');
      const lastnameInput = document.querySelector('input[name="lastname"]');
      const mobilephoneContainer = document.querySelector('.phone-input-container');
      const passwordInput = document.querySelector('input[name="password"]');

      if (emailExistsMessage !== '') {
        if (emailInput) emailInput.classList.add('error');
        alert(translate('signup_changeemail', language));
        isValid = false;
      } else {
        if (emailInput) emailInput.classList.remove('error');
      }

      // Sanitize the input fields for submission
      const email = sanitizeInput(formData.email.trim(), 'email');
      const firstname = sanitizeInput(formData.firstname.trim(), 'name');
      const lastname = sanitizeInput(formData.lastname.trim(), 'name');
      const mobilephone = formData.mobilephone ? formData.mobilephone.trim() : '';
      const password = formData.password ? formData.password.trim() : '';

      if (firstname === '') {
        if (firstnameInput) firstnameInput.classList.add('error');
        //alert(translate('signup_enterfirstname', language));
        isValid = false;
      } else {
        if (firstnameInput) firstnameInput.classList.remove('error');
      }

      if (lastname === '') {
        if (lastnameInput) lastnameInput.classList.add('error');
        isValid = false;
      } else {
        if (lastnameInput) lastnameInput.classList.remove('error');
      }

      DEBUG && console.log('isValidEmail:', isValidEmail);
      DEBUG && console.log('email:', email);

      if (!validateEmailFormat(email)) {
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
      } else if (isValidEmail === false) {
        if (emailInput) emailInput.classList.add('error');
        alert('Please enter a valid email address');
        isValid = false;
      } else if (isValidEmail !== true) {
        if (emailInput) emailInput.classList.add('error');
        alert('Please wait for email validation to complete');
        isValid = false;
      } else {
        if (emailInput) emailInput.classList.remove('error');
      }

      if (!isValidPhoneNumber(mobilephone) || mobilephone === '') {
        if (mobilephoneContainer) mobilephoneContainer.classList.add('error');
        setMobilephoneError(true);
        // alert(translate('signup_entercorrectphone', language));
        isValid = false;
      } else {
        if (mobilephoneContainer) mobilephoneContainer.classList.remove('error');
        setMobilephoneError(false);
        // If phone number is valid set to formData
        setFormData({ ...formData, ['mobilephone']: mobilephone });
      }

      if (!password) {
        if (passwordInput) passwordInput.classList.add('error');
        // alert(translate('signup_passwordleastchars', language));
        isValid = false;
      } else {
        if (passwordInput) passwordInput.classList.remove('error');
      }

      // Check if validatePassword returns an error
      const passwordValidationMessage = validatePassword(formData.password);
      if (passwordValidationMessage !== '') {
        if (passwordInput) passwordInput.classList.add('error');
        //alert(translate('signup_passwordleastchars', language));
        alert(passwordValidationMessage);
        isValid = false;
      } else {
        if (passwordInput) passwordInput.classList.remove('error');
      }

      if (!formData.terms) {
        const termsInput = document.querySelector('input[name="terms"]');
        if (termsInput) termsInput.classList.add('error');
        setTermsError(true);
        // alert(translate('signup_mustacceptterms', language));
        isValid = false;
      } else {
        const termsInput = document.querySelector('input[name="terms"]');
        if (termsInput) termsInput.classList.remove('error');
        setTermsError(false);
      }
    } else if (step === 2) {
      DEBUG && console.log('Validate step 2');
      //MARK: Valideringslogik för steg 2
      const personalnumberInput = document.querySelector('input[name="personalnumber"]');
      const aliasInput = document.querySelector('input[name="alias"]');
      const addressInput = inputRefs.current[7]; // Reference to AddressAutoComplete

      if (!selectedAddress) {
        alert('Välj en adress för att fortsätta');
        return;
      }

      if (!formData.personalnumber) {
        if (personalnumberInput) personalnumberInput.classList.add('error');
        // alert(translate('signup_enterpersonalnumber', language));
        isValid = false;
      } else {
        if (personalnumberInput) personalnumberInput.classList.remove('error');
      }

      const personalnumber = formData.personalnumber;
      if (!personalnumber.includes('-')) {
        if (personalnumberInput) personalnumberInput.classList.add('error');
        //  alert(translate('signup_wrongpersonalnumber', language));
        isValid = false;
      } else {
        if (personalnumberInput) personalnumberInput.classList.remove('error');
      }

      const formattedPersonalNumber = personalnumber.replace(/(\d{8})(\d{4})$/, '$1-$2');
      const formattedForValidation = formattedPersonalNumber.slice(2);
      const ssn = sweden(formattedForValidation);
      const isValidSSN = ssn.validate();
      const address = sanitizeInput(formData.address ? formData.address.trim() : '', 'address');

      if (!isValidSSN) {
        if (personalnumberInput) personalnumberInput.classList.add('error');
        //    alert(translate('signup_wrongpersonalnumber', language));
        isValid = false;
      } else {
        if (personalnumberInput) personalnumberInput.classList.remove('error');
      }

      const isAliasValid = await validateAlias(formData.alias, aliasInput);
      if (!isAliasValid) {
        isValid = false;
      }

      if (!address) {
        if (addressInput) {
          addressInput.classList.add('error');
          setAddressEmptyMessage('Adressen får inte vara tom');
          DEBUG && console.log('***addressInput Empty: ', addressInput);
        } else {
          // Create a dummy element to add the class to
          const dummyElement = document.createElement('div');
          dummyElement.classList.add('error');
          setAddressEmptyMessage('Adressen får inte vara tom');
          DEBUG && console.log('***addressInput is undefined, added error class to dummy element');
        }
        isValid = false;
      } else {
        if (addressInput) addressInput.classList.remove('error');
        setAddressEmptyMessage('');
      }
    } else if (step === 3) {
      DEBUG && console.log('Validate step 3');
      //MARK: Valideringslogik för steg 3
      if (formData.sports.length === 0) {
        setSportsError(true); // Sets the error state if no sport is chosen
        alert('Choose a sport to continue.');
        isValid = false;
      } else {
        setSportsError(false);
      }
    } else if (step === 4) {
      DEBUG && console.log('Validate step 4');
      //MARK: Valideringslogik för steg 4
      const filesInput = document.querySelector('input[name="files"]');

      // OBS!! DEN utmarkerade checken för uppladdad fil nedanför visar ALLTID false om man inte ens laddar upp fil.
      // !! Kommentera INTE in den igen utan att göra om den. Då kan man inte skapa konto !!
      // if (formData.files.length === 0) {
      //   if (filesInput) filesInput.classList.add('error');
      //   // alert(translate('signup_uploadfiles', language));
      //   isValid = false;
      // } else {
      //   if (filesInput) filesInput.classList.remove('error');
      // }
    }

    return isValid;
  };

  //MARK: handleSubmit
  const handleSubmit = async (e) => {
    if (e) {
      e.preventDefault();
    }

    // Additional email validation check on submit for step 1
    if (currentStep === 1) {
      if (emailValidationLoading) {
        alert('Email validation is in progress. Please wait for it to complete.');
        setIsLoading(false);
        return;
      }

      if (formData.email && !isValidEmail) {
        alert('Please enter a valid and available email address.');
        setIsLoading(false);
        return;
      }

      if (emailExistsMessage !== '') {
        alert(emailExistsMessage);
        setIsLoading(false);
        return;
      }

      if (isValidEmail !== true && formData.email.trim() !== '') {
        alert('Please wait for email validation to complete or enter a valid email.');
        setIsLoading(false);
        return;
      }
    }

    setIsLoading(true);
    const isValid = await validateStep(currentStep, formData, emailExistsMessage, translate, language);

    if (!isValid) {
      DEBUG && console.log('Validate step failed');
      setStepStatus((prevStatus) => {
        const newStatus = [...prevStatus];
        newStatus[currentStep - 1] = 'failed';
        return newStatus;
      });

      // Mark invalid fields
      const invalidFields = document.querySelectorAll('.form-field');
      invalidFields.forEach((field) => {
        if (!field.checkValidity()) {
          field.classList.add('invalid');
        }
      });

      return;
    }

    DEBUG && console.log('Validate step done');
    // Remove invalid class from all fields
    const allFields = document.querySelectorAll('.form-field');
    allFields.forEach((field) => {
      field.classList.remove('invalid');
    });

    setStepStatus((prevStatus) => {
      const newStatus = [...prevStatus];
      newStatus[currentStep - 1] = 'completed';
      return newStatus;
    });

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      updateIndicator(currentStep + 1);
      setIsLoading(false);
    } else if (currentStep === totalSteps) {
      DEBUG && console.log('Form Data to Send to PHP:', formData);
      const formDataJson = JSON.stringify(formData);
      DEBUG && console.log(formDataJson);
      setIsLoading(true);

      async function handleSubmitForm(formDataJson) {
        setIsLoading(true);
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
          if (selectedFiles.length > 0) {
            for (const file of selectedFiles) {
              try {
                await uploadImage(file, data.user_id, 'certificates', 'doc');
              } catch (e) {
                console.error(e);
              }
            }
          }

          const uploadedFileNames = formData.files;

          if (uploadedFileNames && uploadedFileNames.length > 0) {
            await saveToDB('user_files', uploadedFileNames, data.user_id);
          }

          if (data.error) {
            throw new Error(data.error);
          } else {
            if (data.message) alert(data.message);
            DEBUG && console.log('Sign up successful!');
            setUserId(data.user_id);
            setCurrentStep((prev) => {
              const newStep = prev + 1;
              updateIndicator(newStep);
              return newStep;
            });
          }
        } catch (error) {
          DEBUG && console.log(error.message);
        } finally {
          setIsLoading(false);
        }
      }

      handleSubmitForm(formDataJson);
    }
  };

  const handleBack = () => {
    DEBUG && console.log('Step:', currentStep);
    playSound('plopclick', '0.5');
    setShowFileMenu(false);
    setCurrentStep(currentStep - 1);
  };

  const handleOpenTerms = () => {
    setShowTerms(true);
  };

  const handleDeleteEducation = (index) => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      education: prevFormData.education.filter((_, i) => i !== index),
    }));
  };

  const handleDeleteNewSport = (index) => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      newsport: prevFormData.newsport.filter((_, i) => i !== index),
    }));
  };

  const handleDeleteSports = (index) => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      sports: prevFormData.sports.filter((_, i) => i !== index),
    }));
  };

  const handleDeleteFiles = (index) => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      files: prevFormData.files.filter((_, i) => i !== index),
    }));

    const updatedFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(updatedFiles);
  };

  const handleOpenFiles = () => {
    inputRefs.current[11].click();
  };

  const [selectedGender, setSelectedGender] = useState('male');

  const handleGenderChange = (genderinput) => {
    setSelectedGender(genderinput);
    setFormData((prevFormData) => ({
      ...prevFormData,
      gender: genderinput,
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
    if (value && value.trim() !== '') {
      setMobilephoneError(false);
    } else {
      setMobilephoneError(true);
    }
  };

  // MARK: BankID complete
  const handleBankIDVerificationComplete = (bankidStatus) => {
    if (bankidStatus) setFormData((prevData) => ({ ...prevData, bankid: bankidStatus }));
    // TODO: FIX BANKID Just nu tillåts både false eller true för bankid. Detta för att vi kör emot testmiljö.
    handleSubmit();
    setCurrentStep(currentStep + 1);
  };

  //MARK: Stegen i registeringen
  const handlePageNumberClick = async (step) => {
    // Allow backward navigation without validation
    if (step < currentStep) {
      setCurrentStep(step);
      return;
    }

    // Additional email validation check when navigating from step 1
    if (currentStep === 1) {
      if (emailValidationLoading) {
        alert('Email validation is in progress. Please wait for it to complete.');
        return;
      }

      if (formData.email && !isValidEmail) {
        alert('Please enter a valid and available email address.');
        return;
      }

      if (emailExistsMessage !== '') {
        alert(emailExistsMessage);
        return;
      }

      if (isValidEmail !== true && formData.email.trim() !== '') {
        alert('Please wait for email validation to complete or enter a valid email.');
        return;
      }
    }

    // Only validate when moving forward
    const isValid = await validateStep(currentStep, formData, emailExistsMessage, translate, language);
    if (isValid) {
      setCurrentStep(step);
    } else {
      setStepStatus((prevStatus) => {
        const newStatus = [...prevStatus];
        newStatus[currentStep - 1] = 'failed';
        return newStatus;
      });
    }
  };

  // Switch att rendrera, mellan de olika registrerings stegen
  // MARK: 1/4
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
                className={errors.firstname ? 'error' : ''}
                ref={(el) => (inputRefs.current[0] = el)}
              />
              <TextInput
                id="lastname"
                name="lastname"
                value={formData.lastname}
                onChange={handleChange}
                placeholder={translate('lastname', language)}
                className={errors.lastname ? 'error' : ''}
                ref={(el) => (inputRefs.current[1] = el)}
              />
              <EmailInput
                id="email"
                name="email"
                value={formData.email}
                onChange={handleEmailChange}
                placeholder={translate('email', language)}
                className={isValidEmail === true ? 'valid' : isValidEmail === false ? 'invalid' : ''}
                ref={(el) => (inputRefs.current[2] = el)}
                emailExistsMessage={emailExistsMessage}
                isValidEmail={isValidEmail}
                isLoading={emailValidationLoading}
                iconClassName="input-email-icon-user" // Pass the specific icon class name for trainer
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
                      id="mobilephone"
                      placeholder={translate('mobilephone', language)}
                      value={formData.mobilephone || ''}
                      onChange={handleMobilePhone}
                      defaultCountry="SE"
                      // onFocus={() => handleInputFocus(3)}
                      // onBlur={handleInputBlur}
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
                      {translate('terms', language)}
                    </span>
                  </label>
                </div>
              </div>
              <SignupFormButton
                emailExistsMessage={emailExistsMessage}
                emailValidationLoading={emailValidationLoading}
                isValidEmail={isValidEmail}
                formData={formData}
                translate={translate}
                language={language}
                currentStep={currentStep}
                totalSteps={totalSteps}
              />
            </form>
          </>
        );
      // MARK: 2/4
      case 2:
        return (
          <>
            <form onSubmit={handleSubmit}>
              <div className="input-group" id="addressInputField">
                <label htmlFor="address">{translate('signup_choosecity', language)}</label>
                <AddressAutoComplete
                  id="address"
                  onSelect={handleAddressSelect}
                  ref={(el) => (inputRefs.current[7] = el)}
                  error={!!addressEmptyMessage} // Passing the error prop
                  value={formData.address} // Passing the address value from formData
                />
                {addressEmptyMessage && <div className="error-message">{addressEmptyMessage}</div>}
                {/*
                <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Välj Adress, Stad"
                // onFocus={() => handleInputFocus(7)}
                // onBlur={handleInputBlur}
                ref={(el) => (inputRefs.current[7] = el)}
                />
                */}
              </div>

              <div className="input-group">
                <div id="alias-container" className="input-with-icon">
                  <AliasInput
                    id="alias"
                    name="alias"
                    value={formData.alias}
                    onChange={(e) => {
                      handleChange(e); // Call handleChange to update the form data
                      debouncedAliasExistCheck(e.target.value); // Call debouncedAliasExistCheck separately
                      handleAliasDebounce(e);
                    }}
                    onBlur={handleAliasDebounce}
                    placeholder={translate('signup_choosealias', language)}
                    className={formData.alias ? (aliasExistsMessage === '' ? 'valid' : 'invalid') : ''}
                    isValid={formData.alias === '' ? null : aliasExistsMessage === ''}
                    aliasExistsMessage={aliasExistsMessage}
                    ref={(el) => (inputRefs.current[5] = el)}
                  />
                </div>
                {/* {aliasExistsMessage && <p className="error-message">{aliasExistsMessage}</p>} */}
              </div>

              {/* MARK: Personnummer */}
              <div className="input-group">
                <label htmlFor="personalnumber">{translate('signup_personalnumber', language)}</label>
                <PersonalNumberInput
                  id="personalnumber"
                  name="personalnumber"
                  value={formData.personalnumber}
                  onChange={handleChange}
                  onBlur={validatePersonalNumber}
                  placeholder={translate('personalnumber', language)}
                  className={
                    isValidPersonalNumber === true ? 'valid' : isValidPersonalNumber === false ? 'invalid' : ''
                  }
                  isValid={isValidPersonalNumber}
                  ref={(el) => (inputRefs.current[6] = el)}
                />
              </div>

              <SignupFormButton
                emailExistsMessage={emailExistsMessage}
                emailValidationLoading={emailValidationLoading}
                isValidEmail={isValidEmail}
                formData={formData}
                translate={translate}
                language={language}
                currentStep={currentStep}
                totalSteps={totalSteps}
              />

              <button type="button" className="button onlyborder" onClick={handleBack}>
                {translate('back', language)}
              </button>
            </form>
          </>
        );
      case 3:
        // MARK: 3/4
        return (
          <>
            <form onSubmit={handleSubmit}>
              <div className="input-group" ref={dropdownRef}>
                <label htmlFor="education">{translate('education', language)}</label>
                <input
                  type="text"
                  id="education"
                  name="education"
                  value={education}
                  onChange={handleChangeEducation}
                  onKeyDown={handleKeyDownEducation}
                  placeholder={translate('education', language)}
                  // onFocus={() => handleInputFocus(8)}
                  // onBlur={handleInputBlur}
                  ref={(el) => (inputRefs.current[8] = el)}
                />
                <div className="addeducation" onClick={handleAddEducation}>
                  +
                </div>
              </div>
              <div className="education-items">
                {formData.education.length > 0 &&
                  formData.education.map((item, index) => (
                    <div key={index} className="education-item">
                      {shortenText(item, 30)}
                      <span className="delete-item" onClick={() => handleDeleteEducation(index)}>
                        X
                      </span>
                    </div>
                  ))}
              </div>

              <div className="sports-items">
                <div className="input-group">
                  <label htmlFor="training">{translate('signup_trainerin', language)}</label>
                  <DropdownMenu
                    sportsCategories={traincategories}
                    handleAddSport={handleAddSport}
                    selectInputRef={selectInputRef}
                    sportsError={sportsError}
                  />
                </div>
                <div className="education-items">
                  {formData.sports.length > 0 &&
                    formData.sports.map((item, index) => (
                      <div key={index} className="education-item">
                        {translateGlobal(`cat_${item.category_link}`, language)}
                        <span className="delete-item" onClick={() => handleDeleteSports(index)}>
                          X
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              <div className="sports-items">
                <div className="input-group">
                  <label htmlFor="training">{translate('signup_cantfindyoursport', language)}</label>
                  <span className="small">{translate('signup_sendusandweadd', language)}</span>
                  <input
                    type="text"
                    placeholder={translate('signup_sportthatdoesnotexist', language)}
                    value={newSport}
                    onChange={handleNewSportChange}
                    // onFocus={() => handleInputFocus(10)}
                    // onBlur={handleInputBlur}
                    ref={(el) => (inputRefs.current[10] = el)}
                  />
                  <div className="addeducation" onClick={(e) => handleAddNewSport(newSport)}>
                    +
                  </div>
                </div>
                <div className="education-items">
                  {formData.newsport.length > 0 &&
                    formData.newsport.map((item, index) => (
                      <div key={index} className="education-item">
                        {shortenText(item, 30)}
                        <span className="delete-item" onClick={() => handleDeleteNewSport(index)}>
                          X
                        </span>
                      </div>
                    ))}
                </div>
              </div>
              {/* <div className="bankid-wrap">
                <label htmlFor="bankid">BankID</label>
                <span className="small">Du måste verifiera dig med BankID * (Inte ännu)</span>
                <BankIDComponent personalnumber={formData.personalnumber} />
              </div> */}
              <SignupFormButton
                emailExistsMessage={emailExistsMessage}
                emailValidationLoading={emailValidationLoading}
                isValidEmail={isValidEmail}
                formData={formData}
                translate={translate}
                language={language}
                currentStep={currentStep}
                totalSteps={totalSteps}
              />
              <button type="button" className="button onlyborder mt-05" onClick={handleBack}>
                {translate('back', language)}
              </button>
            </form>
          </>
        );
      case 4:
        return (
          <>
            <form onSubmit={handleSubmit}>
              <h3 className="signup-user-header">{translate('signup_uploadlicense', language)}</h3>
              <div className="input-group">
                <label htmlFor="upload-files">{translate('signup_choosecorrectfile', language)}</label>
                <div className="button" onClick={handleOpenFiles}>
                  {translate('signup_browsefiles', language)}
                </div>
                <input
                  id="upload-files"
                  type="file"
                  className="upload-files"
                  multiple
                  accept=".jpg, .jpeg, .pdf, .webp, .png"
                  onChange={handleAddFiles}
                  ref={(el) => (inputRefs.current[11] = el)}
                />

                <div className="education-items">
                  {selectedFiles.length > 0 &&
                    selectedFiles.map((item, index) => (
                      <div key={index} className="education-item">
                        {shortenText(item.name, 30)}
                        <span className="delete-item" onClick={() => handleDeleteFiles(index)}>
                          X
                        </span>
                      </div>
                    ))}
                </div>

                <p className="small">{translate('signup_uploadlicensetext', language)}</p>
              </div>

              {/* Add the required checkbox */}
              <div className="checkboxes">
                <div className="input-group">
                  <label htmlFor="terms">
                    <input
                      className="hiddencheckbox"
                      type="checkbox"
                      id="terms"
                      name="terms"
                      checked={licenseSkipped}
                      onChange={(e) => {
                        playSound('check', '0.5');
                        setLicenseSkipped(e.target.checked);
                      }}
                      required={selectedFiles.length === 0}
                    />
                    <span className="customcheckbox"></span>
                    {translate('signup_ihavenolicense', language)}
                  </label>
                </div>
              </div>

              {/* MARK: bankID component */}
              {
                // <div>
                //   {
                //   <BankIDComponent
                //     personalnumber={formData.personalnumber}
                //     onVerificationComplete={handleBankIDVerificationComplete}
                //     disabled={0}
                //   />
                //    }
                // </div>
              }

              {/* Remove 'Klar' and 'Hoppa över' buttons */}
              <SignupFormButton
                onclick={(e) => handleSubmit(e)}
                emailExistsMessage={emailExistsMessage}
                emailValidationLoading={emailValidationLoading}
                isValidEmail={isValidEmail}
                formData={formData}
                translate={translate}
                language={language}
                currentStep={currentStep}
                totalSteps={totalSteps}
                licenseSkipped={licenseSkipped}
                isLoading={isLoading}
              />
              <button type="button" className="button onlyborder" onClick={handleBack}>
                {translate('back', language)}
              </button>
            </form>
          </>
        );

      case 5:
        return (
          <>
            <SignupDone status={'trainer'} formData={formData} />
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
      <Terms type="trainer" />
      <div className="categorytop">
        <Link href="/signup" className="btn-back"></Link>
        <h1>{translate('createtrainer', language)}</h1>
        <span className="icon-profile"></span>
      </div>
      <div className="content">
        <div className="scrollcontent">{renderFormStep()}</div>
      </div>
    </main>
  );
}
