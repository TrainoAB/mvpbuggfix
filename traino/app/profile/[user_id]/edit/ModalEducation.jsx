import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAppState } from '@/app/hooks/useAppState';
import { shortenText, sanitizeInput } from '@/app/functions/functions';
import Loader from '@/app/components/Loader';
import uploadImage from '@/app/api/aws/upload';

function ModalEducation({
  onClose,
  onSave,
  onDelete,
  field,
  title,
  text,
  data,
  buttonText,
  userId,
  certificates,
  setCertificates,
  verified,
}) {
  const [userData, setUserData] = useState(data || []);
  const [addedEducations, setAddedEducations] = useState([]);
  const [education, setEducation] = useState('');
  const [educationSpec, setEducationSpec] = useState('');
  const [startdate, setStartdate] = useState('');
  const [stopdate, setStopdate] = useState('');
  const [showUploadButton, setShowUploadButton] = useState(false);
  const [disableLicenseUpload, setDisableLicenseUpload] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadedFileNames, setUploadedFileNames] = useState([]);
  const [fileObj, setFileObj] = useState(null);
  const [educationDeleteIds, setEducationDeleteIds] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const { DEBUG, isKeyboardOpen, baseUrl, sessionObject, setIsKeyboardOpen, isMobile, language, useTranslations } =
    useAppState();
  const inputRefs = useRef([]);
  const { translate } = useTranslations('editaccount', language);

  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, 1);

    if (certificates != 'Inga licenser uppladdade') {
      setShowUploadButton(true);
      setDisableLicenseUpload(true);
    }

    fetchEducations();
  }, []);

  useEffect(() => {
    DEBUG && console.log('Education Data:', userData);
  }, [userData]);

  useEffect(() => {
    DEBUG && console.log('addedEducations:', addedEducations);
  }, [addedEducations]);

  useEffect(() => {
    DEBUG && console.log('Education ID:s to delete:', educationDeleteIds);
  }, [educationDeleteIds]);

  useEffect(() => {
    DEBUG && console.log('Uploaded files:', uploadedFiles);
    DEBUG && console.log('Uploaded file names:', uploadedFileNames);
  }, [uploadedFiles, uploadedFileNames]);

  useEffect(() => {
    DEBUG && console.log('Certificates: ', certificates);
  }, [certificates]);

  const fetchEducations = async () => {
    // Get educations
    try {
      DEBUG && console.log('Education User ID:', userId.current);
      const educationUrl = `${baseUrl}/api/users/edit/education?user_id=${userId.current}`;

      const response = await fetch(`${baseUrl}/api/proxy`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sessionObject.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: educationUrl,
          method: 'GET',
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      setLoading(false);

      // Set userData if educations exist
      if (Array.isArray(data)) {
        setUserData(data);
      }
    } catch (error) {
      console.error('Error fetching education:', error);
      alert(translate('education_fetch_error', language));
    }
  };

  const handleChange = (modalField, value) => {
    let sanitizedValue;

    switch (modalField) {
      case 'education':
        sanitizedValue = sanitizeInput(value, 'text');
        setEducation(sanitizedValue);
        break;
      case 'educationSpec':
        sanitizedValue = sanitizeInput(value, 'text');
        setEducationSpec(sanitizedValue);
        break;
      case 'startdate':
        sanitizedValue = sanitizeInput(value, 'number');
        setStartdate(sanitizedValue);
        break;
      case 'stopdate':
        sanitizedValue = sanitizeInput(value, 'number');
        setStopdate(sanitizedValue);
        break;
      default:
        break;
    }
  };

  const handleAdd = () => {
    const sanitizedEducation = education.trim();
    DEBUG && console.log('handleAdd userData: ', userData);
    if (sanitizedEducation === '') {
      setErrorMessage(translate('education_empty', language));
    } else if (userData.some((user) => user.education.toLowerCase() === sanitizedEducation.toLowerCase())) {
      setErrorMessage(translate('education_exists', language));
    } else {
      setAddedEducations([...addedEducations, { education: sanitizedEducation }]);
      setUserData([...userData, { education: sanitizedEducation }]);
      setEducation(''); // Clear input after adding education
    }
  };

  const checkAndSave = async (field) => {
    const educationArray = addedEducations.map((item) => item.education);
    const sanitizedInput = educationArray.map((item) => item.trim()); // Trims each string in the array

    if (addedEducations.length > 0 || uploadedFileNames.length > 0) {
      onSave(
        field,
        userData.map((item) => item.education),
        sanitizedInput,
        uploadedFileNames,
      );
    }

    if (educationDeleteIds.length > 0) {
      onDelete(
        educationDeleteIds,
        userData.map((item) => item.education),
      );
    }

    if (uploadedFiles && uploadedFiles.length > 0) {
      for (const file of uploadedFiles) {
        await uploadImage(file, userId.current, 'certificates', 'doc');
      }
    }
  };

  const handleRemove = (id) => {
    DEBUG && console.log('Delete Education ID:', id);
    const updatedUserData = userData.filter((item) => item.id !== id);
    setUserData(updatedUserData);
    setEducationDeleteIds((educationDeleteIds) => [...educationDeleteIds, id]);
  };

  const handleDeleteUploadedFile = (index) => {
    setUploadedFiles((prevState) => prevState.filter((_, i) => i !== index));
    setUploadedFileNames((prevState) => prevState.filter((_, i) => i !== index));
  };

  const handleCheckboxChange = () => {
    setShowUploadButton(!showUploadButton);
  };

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

  const handleFileChange = useCallback(
    (e) => {
      const files = e.target.files;
      if (!files) return; // Exit if no files are selected

      for (const file of files) {
        const fileName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        const fileNameNoSpaces = fileName.replace(/\s+/g, '');

        // Check if the filename already exists
        if (uploadedFileNames.includes(file.name.toString())) {
          alert(`${translate('file_with_name', language)} ${file.name} ${translate('already_exists', language)}`);
          continue; // Skip processing this file
        }

        DEBUG && console.log('handleFileChange:', { file });

        // Check if the file is an image
        const isImage = file.type.startsWith('image/');
        const reader = new FileReader();

        if (isImage) {
          // Image file processing
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
                // Save the processed file as a WebP
                const newFile = new File([blob], `${fileNameNoSpaces}.webp`, {
                  type: 'image/webp',
                });

                setFileObj(newFile);
                setUploadedFiles((prevState) => [...prevState, newFile]);
                setUploadedFileNames((prevState) => [...prevState, newFile.name]);
              }, 'image/webp');
            };
            img.src = e.target.result;
          };
        } else {
          // Non-image file processing: Just read the file without conversion
          reader.readAsArrayBuffer(file);
          reader.onload = (e) => {
            setFileObj(file); // Directly set the file object
            setUploadedFiles((prevState) => [...prevState, file]);
            setUploadedFileNames((prevState) => [...prevState, file.name]);
          };
        }

        reader.onerror = (error) => {
          console.error('Error reading file:', error);
        };
      }
    },
    [uploadedFileNames],
  );

  return (
    <>
      <div>
        <div className="modal">
          <button className="x-btn" onClick={() => onClose(field)}></button>
          <h2 className="title">{title}</h2>
          <p className="info-text">{text}</p>
          <div className="modal-line"></div>

          <div className="education-input-container">
            <input
              className="input education-input"
              id="education-input"
              type="text"
              placeholder={translate('education', language)}
              value={education}
              ref={(el) => (inputRefs.current[0] = el)}
              onFocus={() => handleInputFocus(0)}
              onBlur={handleInputBlur}
              onChange={(e) => handleChange('education', e.target.value)}
            />
          </div>

          <button className="button" onClick={() => handleAdd()}>
            {translate('add_education', language)}
          </button>

          <div className="education-wrap">
            <p className="value-type">{translate('educations', language)}</p>
            {loading ? (
              <p className="education-load">Läser in...</p>
            ) : Array.isArray(userData) && userData.length > 0 ? (
              <div className="education-list">
                {userData.map((item, index) => (
                  <div key={item.id || index} className="modal-list-item">
                    <span className="data-item">{item.education}</span>
                    {item.id && <button className="remove-btn" onClick={() => handleRemove(item.id)}></button>}
                  </div>
                ))}
              </div>
            ) : (
              <p>{translate('no_educations', language)}</p>
            )}
          </div>
          <div className="modal-line"></div>
          <br />

          <h4>{translate('upload_licenses', language)}</h4>
          <div className="checkbox-container">
            <label>
              <input
                type="checkbox"
                checked={showUploadButton}
                onChange={handleCheckboxChange}
                className="customcheckbox"
                disabled={disableLicenseUpload}
              />
              {translate('licensed_dietitian', language)}
            </label>
          </div>
          {showUploadButton && (
            <>
              <div>
                {!disableLicenseUpload && (
                  <div className="license-upload">
                    <label htmlFor="license" className="button">
                      {translate('select_files', language)}
                    </label>
                    <div className="certificate-wrap">
                      <div className="education-items">
                        {uploadedFiles.length > 0 && Array.isArray(uploadedFiles)
                          ? uploadedFiles.map((item, index) => (
                              <div key={index} className="education-item">
                                {shortenText(item.name.split('/').pop(), 15)}
                                <span className="delete-item" onClick={() => handleDeleteUploadedFile(index)}>
                                  X
                                </span>
                              </div>
                            ))
                          : uploadedFiles}
                      </div>
                    </div>
                    <input
                      type="file"
                      name="license"
                      className="file-input"
                      onChange={handleFileChange}
                      aria-label="Ladda upp dokument"
                      accept=".jpg, .jpeg, .pdf, .webp, .png"
                      id="license"
                      multiple
                      disabled={disableLicenseUpload}
                    />
                  </div>
                )}
                {verified ? (
                  <p>Du är redan verifierad.</p>
                ) : (
                  <>
                    <p>{translate('uploaded_sent_for_review', language)}</p>
                    <div className="certificate-wrap">
                      <p className="value-type">{translate('uploaded_licenses', language)}</p>
                      <div className="education-items">
                        {certificates.length > 0 && Array.isArray(certificates)
                          ? certificates.map((item, index) => (
                              <div key={index} className="education-item">
                                {shortenText(item.split('/').pop(), 15)}
                              </div>
                            ))
                          : certificates}
                      </div>
                    </div>
                  </>
                )}
              </div>
              <div className="modal-line"></div>
            </>
          )}
          {errorMessage && <p className="error-message">{errorMessage}</p>}
          <div className="modal-buttons">
            <button className="save-modal button" onClick={() => checkAndSave(field)}>
              {buttonText}
            </button>
            <button className="button onlyborder" onClick={() => onClose(field)}>
              {translate('cancel', language)}
            </button>
          </div>
        </div>
        <div className="darkoverlay" onClick={() => onClose(field)}></div>
      </div>
    </>
  );
}

export default ModalEducation;
