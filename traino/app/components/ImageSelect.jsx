'use client';
import React, { useState, useRef } from 'react';
import { useAppState } from '@/app/hooks/useAppState';

import './ImageSelect.css';

export default function ImageSelect({ formData, setFormData }) {
  const { DEBUG, useTranslations, language } = useAppState();
  const [showFileMenu, setShowFileMenu] = useState(false);

  const { translate } = useTranslations('global', language);
  const fileInputRef = useRef(null);

  const handleFileInputChange = (e) => {
    const files = e.target.files;
    handleFiles(files);
  };

  const handleFileMenu = () => {
    setShowFileMenu((prevState) => !prevState);
  };

  const handleImageDrop = (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    handleFiles(files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleFiles = (files) => {
    const file = files[0];
    const reader = new FileReader();
    reader.onload = () => {
      setFormData({
        ...formData,
        image: reader.result, // Set image as base64 data URL
      });
    };
    reader.readAsDataURL(file);
  };

  const handleFileMenuClick = (event) => {
    event.stopPropagation();
    fileInputRef.current.click();
    setShowFileMenu(false);
  };

  return (
    <>
      <div className="imageupload" onDrop={handleImageDrop} onClick={handleFileMenu} onDragOver={handleDragOver}>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }} // Hide the file input
          onChange={handleFileInputChange}
          accept=".jpg, .jpeg, .png" // Allow only jpg, jpeg, and png files
          multiple={false} // Allow only one file
        />
        {/* Show image when uploaded  */}
        {formData.image && <img src={formData.image} alt="Uploaded Image" />}
        <div className={`filemenu ${showFileMenu ? 'show' : ''}`} onClick={handleFileMenuClick}>
          <div>{translate('browse', language)}</div>
        </div>
      </div>
    </>
  );
}
