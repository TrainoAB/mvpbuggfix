import React from 'react';
import './editProfileImageModal.css';
import { useAppState } from '@/app/hooks/useAppState';
import UploadModule from './UploadModule/UploadModule';
import Loader from '@/app/components/Loader';

function EditProfileImageModal({ onClose, uploaded, hasProfile, onDelete, deleteLoading }) {
  const { userData, useTranslations, language } = useAppState();

  const { translate } = useTranslations('edit', language);

  return (
    <>
      <div id="editProfileImageModal">
        <div className="categorytop">
          <div className="btn-back" onClick={onClose}></div>
          <h1>{translate('edit_editprofilephoto', language)}</h1>
          <div></div>
        </div>
        <div className="modal-content-profile">
          {hasProfile &&
            (deleteLoading ? (
              <div
                className="button"
                style={{ width: '200px', padding: '0', height: '43.59px', marginBottom: '1.5rem' }}
              >
                <Loader />
              </div>
            ) : (
              <button className="button red" onClick={onDelete}>
                {translate('edit_removecurrentimage', language)}
              </button>
            ))}
          {userData.current && (
            <div className="upload-module-wrap">
              <h3>{translate('edit_chooseimage', language)}</h3>
              <div className="upload-module-container">
                <UploadModule user={userData.current.id} width="18rem" uploaded={uploaded} folder={'profile'} />
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="darkoverlay" onClick={onClose}></div>
    </>
  );
}

export default EditProfileImageModal;
