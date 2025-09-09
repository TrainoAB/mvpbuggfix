'use client';
import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useDebounce } from '../hooks';
import { useAppState } from '@/app/hooks/useAppState';
import { getUserName, getLicenses, removeLicense } from '@/app/functions/fetchDataFunctions.js';
import { deleteImage } from '@/app/api/aws/delete';
import { shortenText } from '@/app/functions/functions';
import Loader from '@/app/components/Loader';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import AdminNav from '@/app/admin/AdminNav';

import './page.css';
import '../page.css';

export default function AdminLicenses() {
  const { DEBUG, baseUrl, sessionObject } = useAppState();
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [filterAccepted, setFilterAccepted] = useState(false);
  const [licenses, setLicenses] = useState([]);
  const [acceptedLicenses, setAcceptedLicenses] = useState([]);
  const [selectedLicense, setSelectedLicense] = useState(null);
  const [signedUrls, setSignedUrls] = useState([]);
  const [userName, setUserName] = useState('');

  const fetchPresignedUrl = async (bucketName, objectKey) => {
    try {
      const response = await fetch(`${baseUrl}/api/aws/generate-url?bucketName=${bucketName}&objectKey=${objectKey}`);
      const data = await response.json();
      if (data.url) {
        return data.url;
      } else {
        console.error('Error fetching pre-signed URL:', data.error);
      }
    } catch (error) {
      console.error('Error fetching pre-signed URL:', error);
    }
  };

  const fetchLicenses = async () => {
    setLoading(true);

    try {
      const data = await getLicenses();

      DEBUG && console.log('Fetched licenses:', data);

      if (Array.isArray(data)) {
        // Parse file_names for each license
        const parsedLicenses = await Promise.all(
          data.map(async (license) => {
            try {
              const fileNames = JSON.parse(license.file_names); // Parse the file_names string into an array
              const username = await getUserName(license.user_id); // Fetch username for each license's user_id

              return {
                ...license,
                file_names: fileNames,
                username, // Add username to the license object
              };
            } catch (error) {
              console.error('Error parsing file_names:', error);
              return {
                ...license,
                file_names: [], // Default to an empty array if parsing fails
              };
            }
          }),
        );

        setLicenses(parsedLicenses);
        setAcceptedLicenses(parsedLicenses.filter((item) => item.accepted == 0));
      }
    } catch (error) {
      console.error('Error fetching licenses:', error);
    } finally {
      setLoading(false); // Set loading to false after fetch
    }
  };

  useEffect(() => {
    fetchLicenses();
  }, []);

  const handleDelete = async (id) => {
    DEBUG && console.log(`Deleted license with ID: ${id}`);

    try {
      for (const file_name of selectedLicense.file_names) {
        await deleteImage({
          src: `https://traino.s3.amazonaws.com/${selectedLicense.user_id}/certificates/${file_name}`,
        });
      }
    } catch (error) {
      console.error('Error deleting license images:', error);
      return;
    }

    setLicenses((prevLicenses) => prevLicenses.filter((license) => license.id !== id));
    removeLicense(id);
    setIsModalOpen(false);
    setSelectedLicense(null);
  };

  const handleCardClick = (license) => {
    setSelectedLicense(license);
    setIsModalOpen(true);
    console.log('Card clicked, modal should open');
  };

  useEffect(() => {
    if (selectedLicense) {
      setAccepted(selectedLicense.accepted == 1);
    }
  }, [selectedLicense]);

  const closeModal = async () => {
    if (accepted != selectedLicense.accepted) {
      try {
        const response = await fetch(`${baseUrl}/api/proxy`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${sessionObject.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: `${baseUrl}/api/admin/licenses/update?id=${selectedLicense.id}`,
            method: 'POST',
            body: JSON.stringify({ accepted: accepted }),
          }),
        });

        // Check if the response is ok (status code 200-299)
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        setIsModalOpen(false);
        setSelectedLicense(null);
        fetchLicenses();
        return;
      } catch (error) {
        // Handle errors
        console.error('Error updating data:', error);
      }
    } else {
      setIsModalOpen(false);
      setSelectedLicense(null);
    }
  };

  function getFileNameFromUrl(url) {
    return url.substring(url.lastIndexOf('/') + 1);
  }

  const toggleDeleteConfirmation = () => {
    const wrapper = document.querySelector('.confirm-delete-wrap');
    const deleteBtn = document.getElementById('delete-btn');

    wrapper.classList.toggle('hidden');
    deleteBtn.classList.toggle('hidden');
  };

  const toggleAccept = () => {
    const acceptBtn = document.getElementById('complete-button');
    setAccepted(!accepted);

    acceptBtn.classList.toggle('complete');
  };

  const handleCheckboxChange = () => {
    setFilterAccepted(!filterAccepted);
  };

  useEffect(() => {
    const fetchUrls = async () => {
      if (isModalOpen && selectedLicense && Array.isArray(selectedLicense.file_names)) {
        const urls = {};
        for (const file_name of selectedLicense.file_names) {
          const url = await fetchPresignedUrl('traino', `${selectedLicense.user_id}/certificates/${file_name}`);
          urls[file_name] = url;
        }
        setSignedUrls(urls);
        const username = await getUserName(selectedLicense.user_id);
        setUserName(username);
      }
    };

    if (isModalOpen && selectedLicense) {
      fetchUrls();
    }
  }, [isModalOpen, selectedLicense]);

  return (
    <>
      <main id="admin-page" className="bugreportpage">
        <AdminNav page="licenses" />
        <label className="filter-label">
          <input type="checkbox" className="filter-checkbox" onChange={handleCheckboxChange} />
          Hide accepted licenses
        </label>
        {loading ? (
          <Loader />
        ) : (
          <>
            {(filterAccepted ? acceptedLicenses : licenses).map((license) => (
              <div className="bug-report-card" key={license.id} onClick={() => handleCardClick(license)}>
                <div className="bug-report-card-content">
                  <div className="bug-report-card-header">
                    <div>
                      <div className="bug-report-date">
                        <p>{license.created_at}</p>
                      </div>
                      <h3>{license.username}</h3>
                    </div>
                    {license.accepted == 1 && (
                      <div className="bug-report-complete-wrap">
                        <span className="icon-check-small"></span>
                        Accepted
                      </div>
                    )}
                  </div>
                  <div className="bug-report-card-body">
                    <div>
                      <p>{Array.isArray(license.file_names) ? `${license.file_names.length} files` : '0 files'}</p>
                    </div>
                    <div className="license-file-wrap">
                      {Array.isArray(license.file_names) &&
                        license.file_names.map((file_name, index) => (
                          <div className="license-file" key={index}>
                            <span className="icon-file"></span>
                            <h4>{shortenText(file_name.split('/').pop(), 15)}</h4>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
        {isModalOpen && selectedLicense && (
          <div className={`modal ${isModalOpen ? 'show' : ''}`}>
            <div className="modal-content">
              <span className="close-button" onClick={closeModal}>
                &times;
              </span>
              <h3>{selectedLicense.username}</h3>
              <p>
                {Array.isArray(selectedLicense.file_names) ? `${selectedLicense.file_names.length} files` : '0 files'}
              </p>
              {Array.isArray(selectedLicense.file_names) &&
                selectedLicense.file_names.map((file_name, index) => (
                  <div key={index}>
                    <p className="license-file-name">{file_name}</p>
                    {signedUrls[file_name] ? (
                      file_name.endsWith('.pdf') ? (
                        <iframe
                          className="pdf-viewer"
                          src={signedUrls[file_name]}
                          width="100%"
                          height="500px"
                          title={`PDF-${index}`}
                        ></iframe>
                      ) : (
                        <img className="bug-report-image" src={signedUrls[file_name]} alt={`File-${index}`} />
                      )
                    ) : (
                      <Loader />
                    )}
                  </div>
                ))}
              <div className="modal-buttons">
                <div className="complete-button-wrap" onClick={toggleAccept}>
                  <button className={`button ${accepted ? 'complete' : ''}`} id="complete-button">
                    {accepted ? 'Accepted' : 'Accept license'}
                  </button>
                </div>
                <button className="button" id="delete-btn" onClick={toggleDeleteConfirmation}>
                  Delete
                </button>
                <div className="confirm-delete-wrap hidden">
                  <button className="button" id="cancel-btn" onClick={toggleDeleteConfirmation}>
                    Cancel
                  </button>
                  <button className="button" id="confirm-btn" onClick={() => handleDelete(selectedLicense.id)}>
                    Confirm Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
