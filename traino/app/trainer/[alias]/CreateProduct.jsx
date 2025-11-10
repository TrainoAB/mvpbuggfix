'use client';
import { useState, useEffect } from 'react';
import { useAppState } from '@/app/hooks/useAppState';
import { fileToBase64 } from '@/app/functions/functions';
import {
  getProduct,
  getStripeId,
  getProducts,
  getStripeUrl,
  checkStripeOnboardingStatus,
} from '@/app/functions/fetchDataFunctions';
import Confirmation from '@/app/components/Confirmation';
import ScheduleProduct from '@/app/components/Calendar/ScheduleProduct/ScheduleProduct';
import AddressAutoComplete from '@/app/components/Inputs/AddressAutoComplete';
import uploadImage from '@/app/api/aws/upload.js';
import Loader from '@/app/components/Loader';
import UpdateStripeID from '@/app/components/UpdateStripeID';
import { playSound } from '@/app/components/PlaySound';
import { standardizeCoordinate } from '@/app/utils/coordinateUtils';
import { useRouter } from 'next/navigation';
import './CreateProduct.css';

export default function CreateProduct({ sport, products, setProducts, toggle, refreshProducts }) {
  const {
    useTranslations,
    language,
    sessionObject,
    baseUrl,
    DEBUG,
    isMobile,
    isLoggedin,
    traincategories,
    setTraincategories,
    productObject,
    setProductObject,
    userData,
    openModal,
  } = useAppState();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showMobileDescription, setShowMobileDescription] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState('');
  // const [selectedSport, setSelectedSport] = useState("");
  const [selectedDuration, setSelectedDuration] = useState('');
  const [selectedPrice, setSelectedPrice] = useState('');

  const [buttonLoading, setButtonLoading] = useState(false);

  const [price, setPrice] = useState('');
  const [priceInput, setPriceInput] = useState(5);
  const [isDiscountEnabled, setIsDiscountEnabled] = useState(false);
  const [description, setDescription] = useState('');
  const [showDescriptionInput, setShowDescriptionInput] = useState(true);
  const [createdProducts, setCreatedProducts] = useState([]);
  const [file, setFile] = useState(null);
  const [showSportModal, setShowSportModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showDurationModal, setShowDurationModal] = useState(false);

  const [selectedAddress, setSelectedAddress] = useState(null);

  const [selectedType, setSelectedType] = useState('regular');
  const [showCategoryInput, setShowCategoryInput] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState(15);
  const [selectedSessions, setSelectedSessions] = useState(1);
  const [selectedWeeks, setSelectedWeeks] = useState(1);
  const [selectedPrices, setSelectedPrices] = useState([]);
  const [priceInputs, setPriceInputs] = useState({});

  const [checkedValues, setCheckedValues] = useState([]);
  const [showPriceInput, setShowPriceInput] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [filteredLocations, setFilteredLocations] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState('');

  const [showSheduleProduct, setShowSheduleProduct] = useState(false);

  const [selectedPass, setSelectedPass] = useState('');
  const [createStripeCount, setCreateStripeCount] = useState(0);

  const [updatedProductObject, setUpdatedProductObject] = useState('');

  const [availablePassDurations, setAvailablePassDurations] = useState([]);
  const [passDurationLoading, setPassDurationLoading] = useState(true);

  const [productsData, setProductsData] = useState([]);

  const [hasStripeId, setHasStripeId] = useState(false);
  const [stripeIdLoaded, setStripeIdLoaded] = useState(false);
  const [stripeButtonLoading, setStripeButtonLoading] = useState(false);
  const [stripeId, setStripeId] = useState(null);
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const [stripeOnboardingStatus, setStripeOnboardingStatus] = useState(null);

  const { translate } = useTranslations('createproduct', language);

  let fetchedProducts = false;

  // Check for stripe id and onboarding status

  useEffect(() => {
    const updateStripeId = async () => {
      if (isLoggedin.current) {
        setLoading(true);

        const data = await getStripeId(userData.current.id);
        // const data = await getStripeId(175);       // To test with user that has stripe ID
        DEBUG && console.log('Stripe ID:', data);
        setStripeId(data);

        if (data != null) {
          setHasStripeId(true);

          // Check if Stripe onboarding is complete
          const onboardingStatus = await checkStripeOnboardingStatus(data);
          DEBUG && console.log('Stripe onboarding status:', onboardingStatus);
          setStripeOnboardingStatus(onboardingStatus);
        } else {
          setStripeOnboardingStatus({ isComplete: false, canReceivePayments: false });
        }
        setStripeIdLoaded(true);
        setLoading(false);
      }
    };
    updateStripeId();
  }, []);

  async function handleCreateStripe() {
    console.log('Handle create');
    if (createStripeCount > 0) {
      try {
        setStripeButtonLoading(true);
        const response = await fetch(`${baseUrl}/api/stripe/gettrainerstripe_id_email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: userData.current.email,
            stripe_id: result.accountId,
          }),
        });

        const result = await response.json();

        if (response.ok) {
          DEBUG && console.log('API call succeeded:', result);
          const urlPath = `${baseUrl}/api/stripe/updatestripeid`;
          const bodyData = {
            stripe_id: result.accountId,
            email: userData.current.email,
          };

          const update = await fetch(`${baseUrl}/api/proxy`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${sessionObject.token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              url: urlPath,
              method: 'POST',
              body: JSON.stringify(bodyData),
            }),
          });

          const result2 = await update.json();

          DEBUG && console.log('Update stripe id:', result2);

          console.log(result.accountId);

          setStripeId(result.accountId);
          setHasStripeId(true);
          return;
        } else {
          DEBUG && console.error('API call failed:', result.error || 'Unknown error');
        }
      } catch (error) {
        DEBUG && console.log('API call failed:', error.message);
      } finally {
        setStripeButtonLoading(false);
      }
    }

    try {
      const newTab = window.open('', '_blank'); // Open an empty tab first

      const result = await getStripeUrl(userData.current.email, userData.current.id);
      console.log('Result from getStripeUrl:', result);

      if (result) {
        // Save the Stripe account ID returned from onboarding
        try {
          await saveStripeId(result.accountId, userData.current.email);
        } catch (e) {
          DEBUG && console.error('Failed to save Stripe ID:', e.message);
        }

        // Open onboarding tab
        DEBUG && console.log('Opening URL:', result.url);
        newTab.location.href = result.url;
      } else {
        newTab.close();
        DEBUG && console.log('No onboarding URL returned');
      }

      DEBUG && console.log('API call succeeded:', data);
    } catch (error) {
      DEBUG && console.log('API call failed:', error.message);
    } finally {
      setCreateStripeCount(createStripeCount + 1);
      setStripeButtonLoading(false);
    }
  }

  useEffect(() => {
    setCreatedProducts(productObject);

    if (!fetchedProducts) {
      const fetchProducts = async () => {
        const data = await getProducts(userData.current.alias);
        DEBUG && console.log(data);
        setProductsData(data);

        fetchedProducts = true;
        setPassDurationLoading(false);
      };

      fetchProducts();
    }
  }, []);

  useEffect(() => {
    DEBUG && console.log('ProductObject:', productObject);
  });

  const productData = {
    products: [
      translate('trainingpass', language),
      translate('onlinetraining', language),
      translate('dietprogram', language),
      translate('trainprogram', language),
      translate('clipcard', language),
    ],

    locations: ['Södermalm', 'Gamla Stan', 'Järfälla', 'Kista', 'Vallentuna', 'Täby', 'Södertälje'],
    hasDescription: false,
    hasInformation: true,
    hasQuestionnaire: false,
  };

  const clearForm = (product = '') => {
    const newProductObject = {
      product_type: 'regular',
      category_id: sport.id,
      category_name: sport.name,
      category_link: sport.link,
      product: product,
      duration: 15,
      price: 5,
      hasDescription: false,
      description: '',
      filelink: '',
      conversations: 15,
      product_sessions: 1,
      product_id_link: '',
      clipcard_5_price: '',
      clipcard_10_price: '',
      clipcard_20_price: '',
      address: '',
      longitude: 0,
      latitude: 0,
    };
    setFile('');
    setSelectedType('regular');
    setProductObject(newProductObject);
    setSelectedSessions(1);
    setSelectedProduct(product);
    setSelectedDuration(15);
    setPriceInput(5);
    setDescription('');
    setSelectedPlace('');
    setSearchInput('');
    setSelectedConversation(15);
    setCreatedProducts(productObject);
    setShowValidationErrors(false);
  };

  const handleCloseConfirmation = () => {
    clearForm();
    setShowConfirmation(false);
    setShowValidationErrors(false);
  };

  const handleLocationSelect = (location) => {
    setSelectedPlace(location);
  };
  const handlePriceInput = (e) => {
    const keyCode = e.keyCode || e.which;
    if (keyCode === 69 || keyCode === 190) {
      e.preventDefault();
    } else {
      const inputValue = e.target.value;
      const sanitizedInput = inputValue.replace(/[^\d]/g, '');
      setPriceInput(sanitizedInput);
    }
  };

  const handleSearchInputChange = (e) => {
    const inputValue = e.target.value;
    /*
    const sanitizedInput = inputValue.replace(/[^a-zA-Z\såäöÅÄÖ]/g, ''); // Include Swedish letters and spaces */
    setSearchInput(inputValue);

    const update = productObject;
    update.address = inputValue;
    setCreatedProducts(update);
  };

  const handleAddressSelect = (suggestion) => {
    // Standardize coordinates
    const standardizedLat = standardizeCoordinate(suggestion.latitude);
    const standardizedLng = standardizeCoordinate(suggestion.longitude);

    // Update productObject with new address details
    setProductObject((prevProductObject) => ({
      ...prevProductObject,
      address: `${suggestion.name} ${suggestion.streetNumber}, ${
        suggestion.city ? suggestion.city : suggestion.municipality
      }, ${suggestion.country}`,
      latitude: standardizedLat,
      longitude: standardizedLng,
    }));

    // Set the selected address separately
    setSelectedAddress({
      name: suggestion.name,
      streetNumber: suggestion.streetNumber,
      city: suggestion.city || suggestion.municipality,
      country: suggestion.country,
      latitude: standardizedLat,
      longitude: standardizedLng,
    });

    DEBUG &&
      console.log('Updated ProductObject:', {
        ...productObject,
        address: `${suggestion.name} ${suggestion.streetNumber}, ${
          suggestion.city ? suggestion.city : suggestion.municipality
        }, ${suggestion.country}`,
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
  };

  const handleTypeChange = (type) => {
    setSelectedType(type);
    const update = productObject;
    update.type = type;
    setCreatedProducts(update);
  };

  const handleConversationChange = (duration) => {
    setSelectedConversation(duration);
    const update = productObject;
    update.conversation = parseInt(duration);
    setCreatedProducts(update);
  };

  const handleDescriptionInputFocus = () => {
    if (isMobile) {
      setShowMobileDescription(true);
    }
  };

  const handleDescriptionInputBlur = (e) => {
    setProductObject((prevProductObject) => ({
      ...prevProductObject,
      description: e.target.value,
      hasDescription: true,
    }));

    if (isMobile) {
      setShowMobileDescription(false);
    }
  };

  const handleConfirmDescription = () => {
    setShowMobileDescription(false);
  };

  const handleProductChange = (event) => {
    const product = event.target.value;
    setSelectedProduct(product);

    clearForm(product);
    // Additional logic based on the selected product
    setShowProductModal(false);

    if (product === 'Kostprogram') {
      setShowCategoryInput(true); // Show the category input field
    } else {
      setShowCategoryInput(false); // Hide the category input field
    }
  };

  // const handleSportChange = (sport) => {
  //   setSelectedSport(sport);
  //   setShowSportModal(false);
  // };

  const handleDurationChange = (duration) => {
    setSelectedDuration(duration);
    setShowDurationModal(false);
  };

  const handlePrice = (e) => {
    const input = e.target.value; // Get the value from the input field
    const sanitizedInput = input.replace(/[^\d]/g, ''); // Remove non-digit characters

    if (!input.includes('e')) {
      setPriceInput(sanitizedInput); // Update the priceInput state with the sanitized, validated price
    }

    setCreatedProducts((prevProduct) => ({
      ...prevProduct,
      price: sanitizedInput, // Update price directly in the product object
    }));
  };

  const handlePriceBlur = (e) => {
    const newPrice = parseInt(e.target.value);

    let price;
    if (newPrice > 30000) {
      price = 30000;
    } else if (newPrice < 5) {
      price = 5;
    } else {
      price = newPrice;
    }

    setPriceInput(price);

    setCreatedProducts((prevProduct) => ({
      ...prevProduct,
      price: price, // Update price directly in the product object
    }));
  };

  const handleDescriptionChange = (e) => {
    const inputValue = e.target.value;
    const sanitizedInput = inputValue.replace(/[^a-zA-Z0-9\såäöÅÄÖ.,#%/_\-()?=!]/g, ''); // Include Swedish letters and special characters

    // Limit to 200 characters
    const limitedInput = sanitizedInput.slice(0, 200);

    setDescription(limitedInput);
    var update = productObject;
    update.description = limitedInput;
    setCreatedProducts(update);
  };

  // Function to validate description length
  const isDescriptionValid = (desc) => {
    return desc.length >= 10 && desc.length <= 200;
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    var update = productObject;
    update.filelink = e.target.files[0];

    // Set correct property based on uploaded file
    if (update.filelink && getFileExtension(update.filelink.type) === 'pdf') {
      update.hasfile = 1;
      update.hasimage = 0;
    } else if (update.filelink && getFileExtension(update.filelink.type).match(/(jpg|jpeg|png|webp)/)) {
      update.hasimage = 1;
      update.hasfile = 0;
    } else {
      update.hasimage = 0;
      update.hasfile = 0;
    }

    setCreatedProducts(update);
  };

  const handleButtonClick = () => {
    document.getElementById('file').click();
  };

  // MARK: Create product
  const handleCreateProduct = async () => {
    // Check if Stripe setup is complete first
    if (!stripeId || !stripeOnboardingStatus?.canReceivePayments) {
      handleStripeIncompleteClick();
      return;
    }

    setShowValidationErrors(true);

    // Check description validation first
    if (selectedProduct !== 'clipcard' && selectedProduct !== '' && !isDescriptionValid(description)) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      if (selectedProduct === 'clipcard' && selectedPass === '') {
        alert(translate('create_choosetrainingpassfirst', language));

        return;
      }

      if (selectedProduct === 'clipcard') {
        if (selectedPrices.length === 0) {
          alert('Du måste välja minst ett klippkort för att skapa produkten.');
          return;
        }

        if (selectedPrices.includes('5') && !priceInputs['5']) {
          alert('Du måste fylla i priset för klippkort 5.');
          return;
        }

        if (selectedPrices.includes('10') && !priceInputs['10']) {
          alert('Du måste fylla i priset för klippkort 10.');
          return;
        }

        if (selectedPrices.includes('20') && !priceInputs['20']) {
          alert('Du måste fylla i priset för klippkort 20.');
          return;
        }
      }

      if (selectedProduct === 'dietprogram' || selectedProduct === 'trainprogram') {
        if (productObject.filelink === '' && selectedType === 'regular') {
          alert('Du måste ladda upp en fil för att skapa produkten.');

          return;
        }
      }

      const newPrice = parseInt(priceInput);
      const newSessions = parseInt(selectedSessions);

      /*
      let base64File = '';

      if (productObject.product !== 'trainingpass' || productObject.product !== 'onlinetraining') {
        base64File = await fileToBase64(file);
      }
      */

      DEBUG && console.log('createdProducts:', createdProducts);

      let object = {
        user_id: parseInt(userData.current.id),
        alias: userData.current.alias,
        category_id: parseInt(sport.id),
        category_name: sport.name,
        category_link: sport.link,
        product: selectedProduct,
        product_type: selectedType,
        duration: parseInt(selectedDuration),
        price: parseInt(newPrice),
        hasDescription: description !== '',
        description: description,
        conversations: selectedConversation,
        sessions: parseInt(selectedSessions),
        product_id_link: productObject.product_id_link,
        //TODO: Change hasclipcard to actual value
        hasclipcard: 0,
        clipcard_5_price: productObject.clipcard_5_price,
        clipcard_10_price: productObject.clipcard_10_price,
        clipcard_20_price: productObject.clipcard_20_price,
        product_sessions: newSessions,
        longitude: standardizeCoordinate(productObject.longitude),
        latitude: standardizeCoordinate(productObject.latitude),
        address: productObject.address ? productObject.address : '',
        user_address: userData.current.user_address,
        user_longitude: standardizeCoordinate(userData.current.user_longitude),
        user_latitude: standardizeCoordinate(userData.current.user_latitude),
        filelink: productObject.filelink ? productObject.filelink : null,
        hasfile: createdProducts.hasfile ? createdProducts.hasfile : 0,
        hasimage: createdProducts.hasimage ? createdProducts.hasimage : 0,
      };

      DEBUG && console.log('User LNG & LAT:', userData.current.user_longitude, userData.current.user_latitude);

      // Add user address if the product is dietprogram or trainprogram
      if (productObject.product === 'dietprogram' || productObject.product === 'trainprogram') {
        object.user_address = userData.current.user_address;
      }

      setUpdatedProductObject(object);

      if (selectedProduct === 'trainingpass' && object.address === '') {
        alert('Du måste fylla i en adress där du håller din verksamhet.');
        return;
      }

      if (selectedProduct === 'trainingpass' && (!object.longitude || !object.latitude)) {
        alert('Du måste välja en adress ur förslagslistan för att registrera adressen.');
        return;
      }

      DEBUG && console.log('Sending updatedProductObject:', object);

      const response = await fetch(`${baseUrl}/api/proxy`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sessionObject.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: `${baseUrl}/api/products/create`,
          method: 'POST',
          body: JSON.stringify(object),
        }),
      });

      const data = await response.json();

      // Add detailed debugging for the response
      DEBUG && console.log('Create product response status:', response.status);
      DEBUG && console.log('Create product response data:', data);

      if (!response.ok) {
        throw new Error(`Failed to create product: ${data.error || 'Unknown error'}`);
      }

      if (!data.product || !data.product.id) {
        throw new Error(`Invalid response structure: ${JSON.stringify(data)}`);
      }

      const createdProductId = data.product.id; // Get the created product ID
      object.id = createdProductId; // Add the created product ID to the object

      if (object.filelink !== null) {
        DEBUG && console.log('Uploading object:', object);
        const fileExtension = getFileExtension(object.filelink.type);
        const updatedFile = new File([object.filelink], `${createdProductId}.${fileExtension}`, {
          type: object.filelink.type,
        });

        try {
          await uploadImage(updatedFile, object.user_id, object.product, 'doc');
        } catch (error) {
          throw new Error(error);
        }
      }

      if (data.error === 'Product already exists') {
        alert('Du har redan skapat en sådan produkt och kan inte skapa en likadan i denna sport.');
        throw new Error('Product already exists');
      }

      if (object.product === 'clipcard' && object.description === '') {
        object.description = 'Klippkort';
      }

      // Update products with the new created product
      DEBUG && console.log('New Product:', data.product);
      // Add the new product to the existing list of products

      const categoryIndex = products.findIndex((category) => category.category_link === data.product.category_link);

      const newProducts = [...products];
      if (categoryIndex !== -1) {
        products[categoryIndex].products.push(data.product);
      }
      DEBUG && console.log('New Products:', newProducts);
      setProducts(newProducts);

      // MARK: Create Stripe Product
      const createProductResponse = await fetch(`${baseUrl}/api/stripe/createproduct`, {
        method: 'POST',
        body: JSON.stringify({ data: data, object: object }),
      });

      const createProductData = await createProductResponse.json();

      DEBUG && console.log('Create Product Data:', createProductData);

      const sendObject = {
        product_id: createdProductId,
        priceId: createProductData.priceId,
      };

      if (createProductResponse.ok) {
        DEBUG && console.log('SendObject:', sendObject);

        const response = await fetch(`${baseUrl}/api/proxy`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${sessionObject.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: `${baseUrl}/api/products/updatepriceid`,
            method: 'POST',
            body: JSON.stringify(sendObject),
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to create product');
        }

        const data = await response.json();
        DEBUG && console.log('Update Price ID:', data);
      } else {
        alert('Produkten kunde inte skapas.');
      }

      // Refresh products data in parent component immediately after successful creation
      if (refreshProducts) {
        await refreshProducts();
      }

      if (selectedProduct === 'trainingpass' || selectedProduct === 'onlinetraining') {
        setShowSheduleProduct(true);
      } else {
        setShowConfirmation(true);
      }
    } catch (error) {
      DEBUG && console.error('Error:', error);
    } finally {
      setLoading(false);
      router.refresh();
    }
  };

  const handleSessionsChange = (e) => {
    setSelectedSessions(e.target.value);
    const update = productObject;
    update.sessions = parseInt(e.target.value);
    setCreatedProducts(update);
  };

  const handleSelect = (event) => {
    const selectedValue = event.target.value;

    // Update selected product state
    setSelectedProduct(selectedValue);

    // Update createdProducts state
    setCreatedProducts((prevState) => ({
      ...prevState,
      product: selectedValue,
    }));

    if (productsData && (selectedValue === 'trainingpass' || selectedValue === 'onlinetraining')) {
      // Filter products based on selected sport
      const data = productsData;
      const filteredProducts =
        selectedValue === 'trainingpass'
          ? data.product_trainingpass.data.filter((product) => product.category_link === sport.link)
          : data.product_onlinetraining.data.filter((product) => product.category_link === sport.link);

      DEBUG && console.log(filteredProducts);

      const durationArray = [15, 30, 60, 75, 90, 120];

      const availableDurations = durationArray.filter(
        (duration) => !filteredProducts.some((product) => product.duration === duration),
      );
      setAvailablePassDurations(availableDurations);
    }

    // Additional logic to clear form fields based on selected product
    clearForm(selectedValue);
  };

  const handleSelectPass = (item) => {
    setSelectedPass(item);
    const update = productObject;
    update.product_id_link = item.id;
    setProductObject(update);
    setShowProductModal(false);
  };

  const handleSelectedDuration = (e) => {
    setSelectedDuration(e.target.value);
    const update = productObject;
    update.duration = parseInt(e.target.value);
    setCreatedProducts(update);
  };

  const handleBrowsePass = () => {
    setShowProductModal(true);
  };

  const handleCloseSchedule = () => {
    setShowSheduleProduct(false);
    toggle(null);
  };

  const handleCloseConfirm = () => {
    toggle(null);
  };

  const handleStripeIncompleteClick = async () => {
    if (!stripeId || !stripeOnboardingStatus?.canReceivePayments) {
      // Try to get a fresh onboarding link for the user
      let onboardingUrl = null;

      try {
        const response = await getStripeUrl(userData.current.email, userData.current.id);
        if (response && response.url) {
          onboardingUrl = response.url;
        }
      } catch (error) {
        DEBUG && console.log('Failed to get Stripe onboarding URL:', error);
      }

      const message = (
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ color: 'var(--maincolor)', marginBottom: '1rem' }}>
            {translate('create_stripe_setup_required', language)}
          </h3>
          <p style={{ marginBottom: '1rem' }}>{translate('create_stripe_onboarding_incomplete', language)}</p>

          <div
            style={{
              backgroundColor: '#fff3cd',
              border: '1px solid #ffeaa7',
              borderRadius: '4px',
              padding: '1rem',
              margin: '1rem 0',
              color: '#856404',
            }}
          >
            <p style={{ whiteSpace: 'pre-line', margin: 0 }}>{translate('create_stripe_complete_steps', language)}</p>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', flexDirection: 'column' }}>
            {onboardingUrl && (
              <button
                className="button"
                onClick={() => {
                  window.open(onboardingUrl, '_blank');
                }}
                onMouseOver={() => playSound('tickclick', '0.5')}
                style={{
                  backgroundColor: 'var(--maincolor)',
                  borderColor: 'var(--maincolor)',
                  color: 'white',
                  fontWeight: 'bold',
                }}
              >
                {translate('create_stripe_setup_now', language)}
              </button>
            )}

            <button
              className="button"
              onClick={() => {
                toggle(null);
                router.push(`/trainer/@${userData.current.alias}/payments`);
              }}
              onMouseOver={() => playSound('tickclick', '0.5')}
              style={{
                backgroundColor: '#6c757d',
                borderColor: '#6c757d',
                color: 'white',
              }}
            >
              {translate('create_stripe_complete_setup', language)}
            </button>
          </div>
        </div>
      );
      openModal(message);
    }
  };

  // For ScheduleProduct component,
  // indicating it should get the latest product created
  const selectLatestProduct = true;

  const handlePriceCheckboxChange = (price) => {
    setSelectedPrices((prevSelectedPrices) => {
      if (prevSelectedPrices.includes(price)) {
        // Remove price if already selected
        return prevSelectedPrices.filter((p) => p !== price);
      } else {
        // Add price if not selected
        return [...prevSelectedPrices, price];
      }
    });
  };

  const handlePriceInputChange = (priceKey, value) => {
    // Update input field state
    setPriceInputs((prevPriceInputs) => ({
      ...prevPriceInputs,
      [priceKey]: value,
    }));

    // Update productObject state
    setProductObject((prevProductObject) => ({
      ...prevProductObject,
      [`clipcard_${priceKey}_price`]: parseInt(value),
    }));
  };

  const translatedMinutes = translate('minutes', language).toLowerCase();

  if (loading) {
    return (
      <>
        <div id="create_product">
          <Loader />
        </div>
        <div className="darkoverlay"></div>
      </>
    );
  }

  // MARK: Markup
  return (
    <>
      {!hasStripeId && stripeId === null ? (
        <div className="stripemodal">
          <div className="stripecontent">
            <h2>Du har inget Stripe konto</h2>
            <UpdateStripeID />
            {/* <button
              className="button stripebutton"
              onClick={handleCreateStripe}
              onMouseOver={() => playSound('tickclick', '0.5')}
              disabled={stripeButtonLoading}
            >
              Skapa Stripe konto
            </button> */}
          </div>
        </div>
      ) : (
        <>
          {showConfirmation ? (
            <Confirmation
              onBack={handleCloseConfirmation}
              onBackText="Skapa produkt"
              onClose={handleCloseConfirm}
              onCloseText="Klar"
              title="Din produkt är skapad"
              text="Nu finns din produkt i din profil under sporten du skapade den i."
              productObject={productObject}
            />
          ) : (
            <>
              {/* Schedule */}
              {showSheduleProduct && (
                <div id="addtoschedule">
                  <div className="categorytop">
                    <div></div>
                    <h1>{translate('create_schedulepass', language)}</h1>
                    <div>
                      <button onClick={handleCloseSchedule}>{translate('done', language)}</button>
                    </div>
                  </div>
                  <ScheduleProduct latest={selectLatestProduct} user_id={parseInt(userData.current.id)} />
                </div>
              )}

              <div id="create_product">
                <div className="content-container">
                  <div className="categorytop">
                    <div className="btn-back" onClick={() => toggle(null)}></div>
                    <h1>{translate('create_product', language)}</h1>
                    <div></div>
                  </div>
                  <div className="scrollablecontent">
                    <h2>{translate(`cat_${sport.link}`, language)}</h2>

                    {/* Modals */}
                    <div className="input-group">
                      <div className="btn-dropdown"></div>
                      <select name="" id="" value={selectedProduct} onChange={handleSelect}>
                        <option value="" disabled>
                          {translate('create_chooseproduct', language)}
                        </option>
                        <option value="trainingpass">{translate('trainingpass', language)}</option>
                        <option value="onlinetraining">{translate('onlinetraining', language)}</option>
                        <option value="dietprogram">{translate('dietprogram', language)}</option>
                        <option value="trainprogram">{translate('trainprogram', language)}</option>
                        {/* <option value="clipcard">{translate('clipcard', language)}</option> */}
                      </select>
                    </div>

                    {selectedProduct !== 'dietprogram' &&
                      selectedProduct !== 'trainprogram' &&
                      selectedProduct !== 'clipcard' &&
                      selectedProduct !== '' && (
                        <>
                          <div className="input-group">
                            <div className="btn-dropdown"></div>
                            <select
                              name=""
                              id=""
                              value={selectedDuration} // Use selectedDuration as the value of the select
                              onChange={handleSelectedDuration} // Update selectedDuration when the select value changes
                            >
                              {passDurationLoading ? (
                                <>
                                  <option>{translate('loading', language)}</option>
                                </>
                              ) : (
                                <>
                                  {availablePassDurations &&
                                    availablePassDurations.length > 0 &&
                                    availablePassDurations.map((duration) => (
                                      <option key={duration} value={duration}>
                                        {duration} {translatedMinutes}
                                      </option>
                                    ))}
                                </>
                              )}
                            </select>
                          </div>
                        </>
                      )}
                    {selectedProduct !== '' && selectedProduct !== 'onlinetraining' && (
                      <>
                        {selectedProduct === 'dietprogram' && selectedProduct !== '' && (
                          <>
                            <div className="box">
                              <div className="product-details custom-program">
                                <label htmlFor="regular">
                                  <input
                                    type="radio"
                                    id="regular"
                                    name="regular"
                                    checked={selectedType === 'regular'}
                                    onChange={() => handleTypeChange('regular')}
                                  />
                                  {translate('create_regular', language)}
                                </label>

                                <label htmlFor="custom">
                                  <input
                                    type="radio"
                                    id="custom"
                                    name="custom"
                                    checked={selectedType === 'custom'}
                                    onChange={() => handleTypeChange('custom')}
                                  />
                                  {translate('create_custom', language)}
                                </label>
                              </div>
                              <div className="conversation-session-container">
                                <div className="product-details session-container">
                                  <label htmlFor="sessions">{translate('create_numbersessions', language)}</label>

                                  <select id="sessions" value={selectedSessions} onChange={handleSessionsChange}>
                                    <option value="" disabled>
                                      {translate('create_chooseamount', language)}
                                    </option>
                                    {[...Array(12)].map((createdProducts, index) => (
                                      <option key={index + 1} value={index + 1}>
                                        {index + 1}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div className="product-details session-container" style={{ marginBottom: 0 }}>
                                  <label htmlFor="conversations">{translate('create_conversation')}</label>

                                  <select
                                    id="conversations"
                                    value={selectedConversation}
                                    onChange={(e) => handleConversationChange(e.target.value)}
                                  >
                                    <option value="" selected disabled>
                                      {translate('create_chooseamount', language)}
                                    </option>
                                    {[15, 30, 45, 60].map((minutes, index) => (
                                      <option key={minutes} value={minutes}>
                                        {minutes + ' ' + translatedMinutes}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            </div>
                          </>
                        )}

                        {selectedProduct === 'trainprogram' && (
                          <>
                            <div className="box">
                              <div className="product-details custom-program">
                                <label htmlFor="regular">
                                  <input
                                    type="radio"
                                    id="regular"
                                    name="regular"
                                    checked={selectedType === 'regular'}
                                    onChange={() => handleTypeChange('regular')}
                                  />
                                  {translate('create_regular', language)}
                                </label>

                                <label htmlFor="custom">
                                  <input
                                    type="radio"
                                    id="custom"
                                    name="custom"
                                    checked={selectedType === 'custom'}
                                    onChange={() => handleTypeChange('custom')}
                                  />
                                  {translate('create_custom', language)}
                                </label>
                              </div>
                              <div className="conversation-session-container">
                                {selectedType === 'custom' ? (
                                  <></>
                                ) : (
                                  <div className="product-details session-container">
                                    <label htmlFor="sessions">Antal veckor</label>
                                    <select id="sessions" value={selectedSessions} onChange={handleSessionsChange}>
                                      <option value="" disabled>
                                        {translate('create_chooseamount', language)}
                                      </option>
                                      {[...Array(12)].map((createdProducts, index) => (
                                        <option key={index + 1} value={index + 1}>
                                          {index + 1}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                )}
                                {/* träningstid */}

                                <div className="product-details session-container" style={{ marginBottom: 0 }}>
                                  <label htmlFor="conversations2">{translate('create_conversation', language)}</label>

                                  <select
                                    id="conversations2"
                                    value={selectedConversation}
                                    onChange={(e) => handleConversationChange(e.target.value)}
                                  >
                                    <option value="" selected disabled>
                                      {translate('create_chooseamount', language)}
                                    </option>
                                    {[15, 30, 45, 60].map((minutes, index) => (
                                      <option key={minutes} value={minutes}>
                                        {minutes + ' ' + translatedMinutes}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            </div>
                          </>
                        )}

                        {selectedProduct !== 'dietprogram' &&
                          selectedProduct !== 'trainprogram' &&
                          selectedProduct !== 'clipcard' &&
                          selectedProduct !== 'onlinetraining' &&
                          selectedProduct !== '' && (
                            <>
                              <label htmlFor="address">{translate('create_adress', language)}</label>
                              <p className="smalltop">You must select an address from the suggestions.</p>
                              <div className="input-group">
                                <AddressAutoComplete onSelect={handleAddressSelect} />
                              </div>
                            </>
                          )}

                        {selectedProduct === 'clipcard' && (
                          <div className="product-details clipcard-container">
                            {selectedPass === '' && (
                              <div className="browsepass button" onClick={handleBrowsePass}>
                                <strong>{translate('create_choosetrainingpass', language)}</strong>
                              </div>
                            )}
                            {selectedPass !== '' && (
                              <div className="browsepass" onClick={handleBrowsePass} data-id={selectedPass.id}>
                                <span>
                                  <strong>{selectedPass.category_name}</strong>
                                  <br />({selectedPass.duration} {translatedMinutes}) - {selectedPass.price} kr
                                </span>
                              </div>
                            )}

                            {selectedPass !== '' && (
                              <div className="content-container">
                                <p className="small">{translate('create_clipcardtext', language)}</p>
                                {/* Checkboxes for prices */}
                                <div className="price-options">
                                  <label>
                                    <input
                                      type="checkbox"
                                      checked={selectedPrices.includes('5')}
                                      onChange={() => handlePriceCheckboxChange('5')}
                                    />
                                    5
                                  </label>
                                  <label>
                                    <input
                                      type="checkbox"
                                      checked={selectedPrices.includes('10')}
                                      onChange={() => handlePriceCheckboxChange('10')}
                                    />
                                    10
                                  </label>
                                  <label>
                                    <input
                                      type="checkbox"
                                      checked={selectedPrices.includes('20')}
                                      onChange={() => handlePriceCheckboxChange('20')}
                                    />
                                    20
                                  </label>
                                  <div>
                                    {selectedPrices.includes('5') && (
                                      <input
                                        type="number"
                                        placeholder="Pris"
                                        value={priceInputs['5'] || ''}
                                        onChange={(e) => handlePriceInputChange('5', e.target.value)}
                                      />
                                    )}
                                  </div>

                                  <div>
                                    {selectedPrices.includes('10') && (
                                      <input
                                        type="number"
                                        placeholder="Pris"
                                        value={priceInputs['10'] || ''}
                                        onChange={(e) => handlePriceInputChange('10', e.target.value)}
                                      />
                                    )}
                                  </div>

                                  <div>
                                    {selectedPrices.includes('20') && (
                                      <input
                                        type="number"
                                        placeholder={translate('price', language)}
                                        value={priceInputs['20'] || ''}
                                        onChange={(e) => handlePriceInputChange('20', e.target.value)}
                                      />
                                    )}
                                  </div>
                                </div>

                                {/* Price input */}
                                {selectedPrice && (
                                  <div className="price-input">
                                    <input
                                      type="number"
                                      placeholder={translate('price', language)}
                                      value={priceInput}
                                      onChange={(e) => handlePriceInput(e)}
                                    />
                                    <button onClick={handleSubmitPrice}>{translate('submit', language)}</button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                    {/* modals */}

                    {selectedProduct !== '' &&
                    (selectedProduct === 'dietprogram' || selectedProduct === 'trainprogram') &&
                    selectedType !== 'custom' ? (
                      <div className="product-details upload">
                        <label htmlFor="file">{translate('create_uploadfile', language)}</label>
                        <div className="button" onClick={handleButtonClick}>
                          {file ? <>{file.name}</> : <>{translate('upload', language)}</>}
                        </div>

                        <div className="product-value" style={{ display: 'none' }}>
                          <input
                            id="file"
                            type="file"
                            accept=".jpg,.jpeg,.pdf,.png,.webp"
                            onChange={handleFileChange}
                          />
                        </div>
                      </div>
                    ) : null}

                    {selectedProduct !== 'clipcard' && selectedProduct !== '' && (
                      <>
                        <p className="smalltop">Price must be between 5 and 30,000 kr.</p>
                        <div className="input-group pricedetails">
                          <div className="labelinside">{translate('price', language)}</div>
                          <input type="number" value={priceInput} onChange={handlePrice} onBlur={handlePriceBlur} />
                          <div className="currency">Kr</div>
                        </div>
                      </>
                    )}

                    <div className="product-value">
                      {selectedProduct !== 'clipcard' && selectedProduct !== '' && (
                        <div className={`description-container ${showMobileDescription ? 'textmodal' : ''}`}>
                          <label htmlFor="description">{translate('description', language)}</label>
                          <div className="input-group">
                            <div className="closetext">{translate('done', language)}</div>
                            <textarea
                              value={description}
                              id="description"
                              onChange={handleDescriptionChange}
                              placeholder={translate('create_shortdescription', language)}
                              onFocus={handleDescriptionInputFocus}
                              onBlur={handleDescriptionInputBlur}
                              className="text-area"
                            />
                          </div>
                          <div
                            className="character-count"
                            style={{
                              fontSize: '12px',
                              color:
                                showValidationErrors && (description.length < 10 || description.length > 200)
                                  ? '#ff4444'
                                  : '#777',
                              marginTop: '-0.5rem',
                              marginBottom: '1rem',
                            }}
                          >
                            {description.length + ' / 200 characters'}
                            {showValidationErrors && description.length < 10 && (
                              <span style={{ color: '#ff4444', marginLeft: '10px' }}>
                                (Minimum 10 characters required)
                              </span>
                            )}
                            {showValidationErrors && description.length > 200 && (
                              <span style={{ color: '#ff4444', marginLeft: '10px' }}>
                                (Maximum 200 characters allowed)
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {selectedProduct !== '' && (
                      <>
                        {(() => {
                          switch (selectedProduct) {
                            case 'trainingpass':
                              {
                                /* MARK: Trainingpass */
                              }
                              return (
                                <button
                                  className="button"
                                  onClick={handleCreateProduct}
                                  disabled={
                                    !productObject.product ||
                                    !productObject.duration ||
                                    !isDescriptionValid(productObject.description) ||
                                    isNaN(productObject.price) ||
                                    buttonLoading ||
                                    productObject.address.length === 0 ||
                                    !selectedAddress
                                  }
                                  style={{
                                    opacity: !stripeId || !stripeOnboardingStatus?.canReceivePayments ? 0.7 : 1,
                                    position: 'relative',
                                  }}
                                >
                                  {!stripeId || !stripeOnboardingStatus?.canReceivePayments
                                    ? translate('create_stripe_setup_required', language)
                                    : translate('create_addtocalendar', language)}
                                </button>
                              );

                            case 'onlinetraining':
                              {
                                /* MARK: Onlinetraining */
                              }
                              return (
                                <button
                                  className="button"
                                  onClick={handleCreateProduct}
                                  disabled={
                                    !productObject.product ||
                                    !productObject.duration ||
                                    !isDescriptionValid(productObject.description) ||
                                    isNaN(productObject.price) ||
                                    buttonLoading
                                  }
                                  style={{
                                    opacity: !stripeId || !stripeOnboardingStatus?.canReceivePayments ? 0.7 : 1,
                                    position: 'relative',
                                  }}
                                >
                                  {!stripeId || !stripeOnboardingStatus?.canReceivePayments
                                    ? translate('create_stripe_setup_required', language)
                                    : translate('create_product', language)}
                                </button>
                              );

                            case 'clipcard':
                              {
                                /* MARK: Clipcard */
                              }
                              if (selectedPass !== '') {
                                return (
                                  <button
                                    className="button"
                                    onClick={handleCreateProduct}
                                    disabled={!productObject.product || buttonLoading}
                                    style={{
                                      opacity: !stripeId || !stripeOnboardingStatus?.canReceivePayments ? 0.7 : 1,
                                      position: 'relative',
                                    }}
                                  >
                                    {!stripeId || !stripeOnboardingStatus?.canReceivePayments
                                      ? translate('create_stripe_setup_required', language)
                                      : translate('create_product', language)}
                                  </button>
                                );
                              }
                              return null;

                            case 'trainprogram':
                            case 'dietprogram':
                              {
                                /* MARK: Program */
                              }
                              return (
                                <button
                                  className="button"
                                  onClick={handleCreateProduct}
                                  disabled={
                                    !productObject.product ||
                                    !productObject.duration ||
                                    (productObject.type === 'regular' && !productObject.filelink) ||
                                    !isDescriptionValid(productObject.description) ||
                                    buttonLoading
                                  }
                                  style={{
                                    opacity: !stripeId || !stripeOnboardingStatus?.canReceivePayments ? 0.7 : 1,
                                    position: 'relative',
                                  }}
                                >
                                  {!stripeId || !stripeOnboardingStatus?.canReceivePayments
                                    ? translate('create_stripe_setup_required', language)
                                    : translate('create_product', language)}
                                </button>
                              );

                            default:
                              return null;
                          }
                        })()}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
          {/* Render modals */}
          {showProductModal && (
            <>
              <Modal
                options={productData.products}
                products={products}
                handleClose={() => setShowProductModal(false)}
                handleSelect={handleSelectPass}
                translate={translate}
                language={language}
                translatedMinutes={translatedMinutes}
              />
              <div
                className="darkoverlay"
                style={{ zIndex: '100000' }}
                onClick={() => setShowProductModal(false)}
              ></div>
            </>
          )}
        </>
      )}
      <div className="darkoverlay" onClick={() => toggle(null)}></div>
    </>
  );
}

// Function to get the file extension from the MIME type
function getFileExtension(mimeType) {
  const mimeTypes = {
    'image/jpeg': 'jpg',
    'application/pdf': 'pdf',
    'application/pdf': 'pdf',

    // Add more MIME types and their corresponding extensions as needed
  };
  return mimeTypes[mimeType] || 'bin'; // Default to 'bin' if MIME type is not found
}

// MARK: Modal
function Modal({ options = [], products, handleClose, handleSelect, translate, language, translatedMinutes }) {
  function getFilteredProducts(data, categoryName, productType) {
    let filteredProducts = [];

    // Loop through each category
    data.forEach((category) => {
      // Check if the category name matches the provided category name
      if (category.category_name === categoryName) {
        // Filter products within the matching category
        const products = category.products.filter((product) => product.product === productType);
        filteredProducts = filteredProducts.concat(products);
      }
    });

    return filteredProducts;
  }

  // Example usage:
  const categoryName = document.querySelector('.scrollablecontent h2').textContent;
  const productType = 'trainingpass';
  const filteredProducts = getFilteredProducts(products, categoryName, productType);

  // MARK: Modal Markup
  return (
    <>
      <div className="select-trainpass">
        <div className="modal-content">
          <h2>{translate('create_choosetrainingpass', language)}</h2>

          <ul id="trainpassitem">
            {filteredProducts.map((item, index) => (
              <li key={index}>
                <div onClick={() => handleSelect(item)} data-id={item.id}>
                  <strong>{translate(`cat_${item.category_link}`, language)}</strong>
                  <br /> ({item.duration} {translatedMinutes}) / {item.price}
                </div>
              </li>
            ))}
          </ul>
          <button className="button" onClick={handleClose}>
            {translate('cancel', language)}
          </button>
        </div>
      </div>
      <div className="darkoverlay" onClick={handleClose}></div>
    </>
  );
}
