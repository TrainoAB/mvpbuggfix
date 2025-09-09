import { useState } from 'react';
import { useAppState } from '@/app/hooks/useAppState';
import uploadImage from '@/app/api/aws/upload.js';
import Loader from '@/app/components/Loader';


function S3Upload({ user = '', folder = '', onUpload, setUpLoading, setUploading, isUploading })  {
  const { DEBUG, useTranslations, language } = useAppState();

  const { translate } = useTranslations('uploadmodule', language);
  const [uploadStatus, setUploadStatus] = useState(null);
  // const [isUploading, setUploading] = useState(false);
  const handleFileChange = async (event) => {
    const file = event.target.files[0];

    if (!file) {
      setUploadStatus(alert(translate('upload_selectfile', language)));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setUploading(true)
        // Calculate the new dimensions while maintaining the aspect ratio
        let width = img.width;
        let height = img.height;
        const maxDimension = 1920;

        if (width > height) {
          if (width > maxDimension) {
            height *= maxDimension / width;
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width *= maxDimension / height;
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(async (blob) => {
          const webpFile = new File([blob], `${file.name.substring(0, file.name.lastIndexOf('.')) || file.name}.webp`, {
            type: 'image/webp',
          });
          
          try {
            const uploadedUrl = await uploadImage(webpFile, user, folder);
            
            
            setUploadStatus(alert(translate('upload_success', language)));
            onUpload(uploadedUrl); // Call the onUpload callback with the uploaded file URL
          } catch (error) {
            setUploadStatus(alert(translate('upload_error', language)));
           
          } finally {
            setUploading(false)
          }
        }, 
        'image/webp'
      );
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  return (
    <>
    {isUploading ? <div className="loader"> 
      <Loader />
      {/* {translate('Uploading', language)}... */}
  
    </div>
    :
      <div className="simple-upload-area">
        <input
          type="file"
          onChange={handleFileChange}
          title={translate('upload_image', language)}
          accept="image/jpeg, image/png, image/webp"
        />
      </div>}
    </>
  );
}

export default S3Upload;
