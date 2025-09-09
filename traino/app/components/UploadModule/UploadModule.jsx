'use client';
import { useState, useCallback, useEffect, useRef } from 'react';
import { useAppState } from '@/app/hooks/useAppState';
import Image from 'next/image';
import Cropper from 'react-easy-crop';
import getCroppedImg from './functions/cropImage.js';
import * as uploadarea from './functions/uploadarea.js';
import * as buttonlocalfile from './functions/buttonlocalfile.js';
import uploadImage from '@/app/api/aws/upload.js';
import Loader from '@/app/components/Loader';

import './UploadModule.css';

export default function UploadModule({ width = '100%', user = 'user', folder = '', aspect = 1, uploaded }) {
  const { DEBUG, useTranslations, language } = useAppState();

  const { translate } = useTranslations('uploadmodule', language);

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(undefined);
  const [val, setVal] = useState(undefined);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [cropWidth, setCropWidth] = useState(null);
  const [cropHeight, setCropHeight] = useState(null);
  const [showCancel, setShowCancel] = useState(false);
  const fileLoaded = useRef(false);
  const [originalFile, setOriginalFile] = useState(null);
  const [originalVal, setOriginalVal] = useState(null);

  useEffect(() => {
    if (data && !fileLoaded.current) {
      setShowCropper(true);
      fileLoaded.current = true;
      setOriginalFile(data);
      setOriginalVal(val);
    }
  }, [data, val]);
  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  useEffect(() => {
    console.log('Cropped Area Pixels:', croppedAreaPixels);
  }, [croppedAreaPixels]);

  // Set default crop based on picture type
  useEffect(() => {
    if (folder === 'cover') {
      setCropWidth(768);
      setCropHeight(384);
    } else {
      setCropWidth(284);
      setCropHeight(284);
    }
  }, [folder]);

  const resetAll = useCallback(() => {
    setData(undefined);
    setVal(undefined);
    setOriginalFile(null);
    setOriginalVal(null);
    setShowCropper(false);
    setShowCancel(false);
    fileLoaded.current = false;
  }, []);

  const handleCrop = useCallback(async () => {
    try {
      const croppedImage = await getCroppedImg(val, croppedAreaPixels);
      console.log('Cropped Image:', croppedImage);
      const img = new window.Image(); // Use the native Image object
      img.src = croppedImage;
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = cropWidth;
        canvas.height = cropHeight;

        // Draw the image on the canvas with the desired dimensions
        ctx.drawImage(img, 0, 0, cropWidth, cropHeight);

        // Convert the canvas to a blob
        canvas.toBlob(async (blob) => {
          console.log('Blob:', blob);
          const newFile = new File([blob], `${folder}-image.webp`, {
            type: 'image/webp',
          });
          console.log('New File:', newFile);
          setVal(URL.createObjectURL(newFile));
          setData(newFile);
          setShowCropper(false);
          setShowCancel(true);
        }, 'image/webp');
      };
    } catch (e) {
      console.error(e);
    }
  }, [val, croppedAreaPixels]);

  return (
    <>
      <section className="upload-picture">
        <object
          className={`upload-zone ${data && 'upload-zone--uploaded'}`}
          style={{ aspectRatio: aspect, width: width }}
          onDragOver={uploadarea.onDragOver}
          onDragLeave={uploadarea.onDragLeave}
          onDrop={(e) => uploadarea.onDrop(e, setData, setVal)}
        >
          {!data && (
            <>
              <section className="zone-content">
                <span className="content-icon"></span>
                <span className="content-text">{translate('upload_dragandropimage', language)}</span>
              </section>
            </>
          )}

          {data && !showCropper && (
            <>
              <Image src={val} fill className="zone-image" alt="cropped image preview" />
            </>
          )}
          {showCropper && (
            <div className="cropper-container">
              <Cropper
                image={val}
                crop={crop}
                zoom={zoom}
                aspect={aspect}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
          )}
        </object>

        {!data && (
          <button
            className="content-uploadLocal button"
            onClick={(e) => buttonlocalfile.onClick(e, setData, setVal, folder)}
          >
            {translate('upload_uploadfrom', language)}
          </button>
        )}

        {data && !showCropper && (
          <div style={{ display: 'flex', gap: '0.25rem', width: '100%' }}>
            {loading ? (
              <>
                <div className="button">
                  <Loader />
                </div>
                <button className="button" disabled>
                  {translate('change', language)}
                </button>
                <button className="button onlyborder" disabled>
                  {translate('cancel', language)}
                </button>
              </>
            ) : (
              <>
                <button
                  className="button"
                  onClick={async () => {
                    setLoading(true);
                    try {
                      await uploadImage(data, user, folder);
                      uploaded();
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                >
                  {translate('save', language)}
                </button>
                <button
                  className="button"
                  onClick={() => {
                    setData(originalFile);
                    setVal(originalVal);
                    setCrop({ x: 0, y: 0 });
                    setZoom(1);
                    setShowCropper(true);
                  }}
                >
                  {translate('change', language)}
                </button>
                <button className="button onlyborder" onClick={resetAll}>
                  {translate('cancel', language)}
                </button>
              </>
            )}
          </div>
        )}
        {showCropper && (
          <div style={{ display: 'flex', gap: '0.25rem', margin: '0.25rem' }}>
            <button className="button" onClick={handleCrop}>
              {translate('done', language)}
            </button>
            {showCancel && (
              <button className="button onlyborder" onClick={() => setShowCropper(false)}>
                {translate('cancel', language)}
              </button>
            )}
          </div>
        )}
      </section>
    </>
  );
}
