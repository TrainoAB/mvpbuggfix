'use client';
import { deleteImage } from '../api/aws/delete';
import { useEffect, useState, useRef } from 'react';
import { useAppState } from '@/app/hooks/useAppState';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import Image from 'next/image';
import './ImageGallery.css';
import S3Upload from './UploadModule/functions/S3Upload';
import Loader from './Loader';
export const ImageGallery = ({ userDetails }) => {
  const { DEBUG, isLoggedin, userData, useTranslations, language } = useAppState();
  const [loading, setLoading] = useState(true);
  const [loadedCount, setLoadedCount] = useState(0);
  const [isModalOpen, setModalOpen] = useState(false);
  const [currentMedia, setCurrentMedia] = useState(null);
  const [s3URLs, setS3URLs] = useState([]);
  const [galleryItems, setGalleryItems] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(null);
  const [slideDirection, setSlideDirection] = useState(null);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [gestureType, setGestureType] = useState(null); // 'pan' or 'swipe'
  const [isImageZoomed, setIsImageZoomed] = useState(false); // Track if image is zoomed
  const [isUploading, setUploading] = useState(false); // Track if uploading
  const imageCache = useRef(new Map()); // Cache map to store fetched images

  const { translate } = useTranslations('profile', language);

  const fetchGalleryImages = async (folder, subFolder) => {
    try {
      setLoading(true);

      // Fetch the image URLs
      const response = await fetch(
        `/api/aws/fetch-imgs?folder=${encodeURIComponent(folder)}&subfolder=${encodeURIComponent(subFolder)}`,
      );
      const data = await response.json();

      if (!response.ok) {
        console.error('Error fetching image URLs:', data.error);
        setLoading(false);
        return;
      }

      const imageUrls = data.imageUrls;

      // Separate new and cached images
      const newUrls = imageUrls.filter((url) => !imageCache.current.has(url));
      const cachedImages = imageUrls
        .filter((url) => imageCache.current.has(url))
        .map((url) => imageCache.current.get(url));

      if (newUrls.length > 0) {
        // Fetch only new images' upload dates
        const dateResponse = await fetch('/api/aws/get-upload-dates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ urls: newUrls }),
        });

        const dateData = await dateResponse.json();

        if (!dateResponse.ok) {
          console.error('Error fetching upload dates:', dateData.error);
          return;
        }

        // Store new images in the cache
        dateData.forEach((item) => imageCache.current.set(item.url, item));

        // Combine cached and new images
        setS3URLs([...cachedImages, ...dateData]);
      } else {
        // Only use cached images if no new ones exist
        setS3URLs(cachedImages);
      }
    } catch (error) {
      console.error('Error fetching gallery images:', error);
    } finally {
      setLoading(false);
    }
  };

  // Call the function when needed
  useEffect(() => {
    fetchGalleryImages(userDetails.id, 'gallery');
  }, [userDetails]);

  // Effect to update loading status once all items are loaded
  useEffect(() => {
    if (loadedCount === galleryItems.length && galleryItems.length > 0) {
      setLoading(false);
    }
  }, [loadedCount, galleryItems.length]);

  // Load selected videos from localStorage and combine with images
  useEffect(() => {
    const savedVideos = JSON.parse(localStorage.getItem('selectedVideos')) || [];

    console.log('Saved videos from localStorage:', savedVideos); // Log saved videos to verify format

    const videos = savedVideos
      .map((video) => {
        console.log('Processing video:', video); // Log each video to verify format

        // Ensure video and video.src exist before using includes()
        if (video && video.src && video.src.includes('youtube')) {
          return { type: 'video', id: video.id, src: video.src, platform: 'youtube' };
        } else if (video && video.media_url) {
          return { type: 'video', id: video.id, src: video.media_url, platform: 'instagram' };
        } else {
          console.warn('Unexpected video format:', video); // Log unexpected format
          return null; // or filter out later
        }
      })
      .filter(Boolean); // Remove any null values

    const images = s3URLs.map((item, index) => ({
      type: 'image',
      id: `image-${index}`,
      src: item.url,
      date: item.uploadDate,
    }));

    DEBUG && console.log('s3URLS: ', s3URLs);
    DEBUG && console.log('Images: ', images);

    setGalleryItems([...images, ...videos]);
  }, [s3URLs]);

  const openModal = (item) => {
    const index = galleryItems.findIndex((galleryItem) => galleryItem.id === item.id);
    DEBUG && console.log('Current index:', index);

    setCurrentMedia(item);
    setCurrentIndex(index);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setCurrentMedia(null);
  };

  const handleUpload = (uploadedUrl) => {
    setUploading(true);
    setGalleryItems([...galleryItems, { type: 'image', id: Date.now(), src: uploadedUrl }]);
    fetchGalleryImages(userDetails.id, 'gallery');
  };

  const handleDelete = (e, item) => {
    e.stopPropagation();
    if (item.type === 'image') {
      console.log('item.src:', item.src);
      deleteImage({ src: item.src }).then(() => {
        setGalleryItems((prevItems) => prevItems.filter((img) => img.src !== item.src));
      });
    } else {
      // For videos, just remove from the local state, no server call needed
      setGalleryItems((prevItems) => prevItems.filter((vid) => vid.src !== item.src));
    }
  };

  const goToNextImage = () => {
    setSlideDirection('next');
    setCurrentIndex((prevIndex) => (prevIndex + 1) % galleryItems.length);
  };

  const goToPrevImage = () => {
    setSlideDirection('prev');
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? galleryItems.length - 1 : prevIndex - 1));
  };

  // Touch event handlers
  const handleTouchStart = (e) => {
    setStartX(e.touches[0].clientX);
    setStartY(e.touches[0].clientY);
    setIsSwiping(true);
    setGestureType(null);
  };

  const handleTouchMove = (e) => {
    if (!isSwiping) return;

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = startX - currentX;
    const diffY = startY - currentY;

    if (isImageZoomed) {
      setGestureType('pan');
    } else if (Math.abs(diffY) > 50 && Math.abs(diffY) > Math.abs(diffX)) {
      setGestureType('swipe');
      e.preventDefault();
    }
  };

  useEffect(() => {
    DEBUG && console.log('Gesture Type:', gestureType);
    DEBUG && console.log('Image Zoomed:', isImageZoomed);
  }, [gestureType, isImageZoomed]);

  const handleTouchEnd = (e) => {
    if (!isSwiping) return;

    const currentY = e.changedTouches[0].clientY;
    const diffY = startY - currentY;

    if (gestureType === 'swipe' && galleryItems.length > 1) {
      if (diffY > 50) {
        goToNextImage(); // Swipe up action
      } else if (diffY < -50) {
        goToPrevImage(); // Swipe down action
      }
    }

    setIsSwiping(false);
    setGestureType(null);
  };

  // Mouse event handlers (for desktop testing)
  const handleMouseDown = (e) => {
    setStartX(e.clientX);
    setStartY(e.clientY);
    setIsSwiping(true);
    setGestureType(null);
  };

  const handleMouseMove = (e) => {
    if (!isSwiping) return;

    const currentX = e.clientX;
    const currentY = e.clientY;
    const diffX = startX - currentX;
    const diffY = startY - currentY;

    if (isImageZoomed) {
      setGestureType('pan');
    } else if (Math.abs(diffY) > 50 && Math.abs(diffY) > Math.abs(diffX)) {
      setGestureType('swipe');
      e.preventDefault();
    }
  };

  const handleMouseUp = (e) => {
    if (!isSwiping) return;

    const currentY = e.clientY;
    const diffY = startY - currentY;

    if (gestureType === 'swipe' && galleryItems.length > 1) {
      if (diffY > 50) {
        goToNextImage(); // Swipe up action
      } else if (diffY < -50) {
        goToPrevImage(); // Swipe down action
      }
    }

    setIsSwiping(false);
    setGestureType(null);
  };

  // Handler to increment the loaded count
  const handleLoad = () => setLoadedCount((prevCount) => prevCount + 1);

  useEffect(() => {
    DEBUG && console.log('Loaded count:', loadedCount);
  }, [loadedCount]);

  let percentage = Math.max(100 / galleryItems.length, 33.333);
  let galleryCount = galleryItems.length;

  // Dynamic percentage for gallery items
  if (isLoggedin.current && userData.current && parseInt(userData.current.id) === parseInt(userDetails.id)) {
    percentage = Math.max(100 / (galleryItems.length + 1), 25);
    galleryCount += 1;
  }

  // MARK: Markup
  return (
    <div id="gallery">
      {loading && <Loader />}
      <div
        className={`gallery-content ${loading ? 'hidden' : ''}`}
        style={{ width: `${galleryCount * 213}px`, maxWidth: `100%` }}
      >
        {isLoggedin.current && userData.current && parseInt(userData.current.id) === parseInt(userDetails.id) && (
          <div
            className={`gallery-item gallery-add ${isUploading ? 'hidden' : ''}`}
            style={{ flex: `1 1 ${percentage}%`, maxWidth: `${percentage}%` }}
          >
            <S3Upload
              user={userData.current.id}
              folder="gallery"
              onUpload={handleUpload}
              setUploading={setUploading}
              isUploading={isUploading}
            />
          </div>
        )}
        {galleryItems.map((item) => (
          <div
            key={item.id}
            className="gallery-item"
            onClick={() => openModal(item)}
            style={{ flex: `1 1 ${percentage}%`, maxWidth: `${percentage}%` }}
          >
            {item.type === 'image' ? (
              <Image src={item.src} alt="" onLoad={handleLoad} layout="fill" style={{ objectFit: 'cover' }} />
            ) : item.platform === 'youtube' ? (
              <iframe
                width="560"
                height="315"
                src={item.src}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={item.id}
                onLoad={handleLoad}
              ></iframe>
            ) : (
              <video controls width="320" height="240" onCanPlayThrough={handleLoad}>
                <source src={item.src} type="video/mp4" />
                {/* Your browser does not support the video tag. */}
                {translate('your_browser_not_support_video', language)}
              </video>
            )}
            {isLoggedin.current && userData.current && parseInt(userData.current.id) === parseInt(userDetails.id) && (
              <button className="delete-button" onClick={(e) => handleDelete(e, item)}></button>
            )}
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="modal-overlay" /* onClick={closeModal} */>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={() => setIsSwiping(false)} // Handle mouse leaving to reset swipe state
          >
            <button id="close-btn" onClick={closeModal}>
              <span className="icon-x"></span>
            </button>
            {galleryItems.length > 1 && (
              <button id="prev-btn" onClick={goToPrevImage}>
                <span className="icon-chevron"></span>
              </button>
            )}
            <TransformWrapper
              initialScale={1}
              minScale={0.5}
              maxScale={6}
              onTransformed={(ref) => {
                const scale = ref.state.scale;
                setIsImageZoomed(scale > 1);
                console.log('Scale from onTransformed:', scale);
              }}
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                width: '100vw',
                height: 'calc(100vh - 3.5rem)',
                backgroundColor: 'rgba(0, 0, 0, 1)',
              }}
            >
              <TransformComponent
                wrapperStyle={{
                  width: '100vw',
                  height: 'calc(100vh - 3.5rem)',
                  backgroundColor: 'rgba(0, 0, 0, 1)',
                }}
              >
                {currentMedia?.type === 'image' ? (
                  <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
                    <Image
                      src={galleryItems[currentIndex].src}
                      alt="Enlarged"
                      layout="fill"
                      objectFit="contain" // ✅ Next.js accepts this instead of inline styles
                      className={`gallery-image ${slideDirection}`}
                      onAnimationEnd={() => setSlideDirection(null)}
                    />
                  </div>
                ) : (
                  <video controls style={{ width: '100vw', height: '100vh', objectFit: 'contain' }}>
                    <source src={currentMedia.src} type="video/mp4" />
                    {/* Your browser does not support the video tag. */}
                    {translate('your_browser_not_support_video', language)}
                  </video>
                )}
              </TransformComponent>
            </TransformWrapper>
            <div className="image-info">
              <div className="image-info-alias">
                <p>@{userDetails.alias}</p>
                {userDetails.verified === 1 && <span className="icon-verified"></span>}
              </div>
              <p className="image-info-date">
                {/* Uploaded at:  */}
                {translate('uploaded_at', language)}
                {galleryItems[currentIndex].date}
              </p>
            </div>
            {galleryItems.length > 1 && (
              <button id="next-btn" onClick={goToNextImage}>
                <span className="icon-chevron"></span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageGallery;
