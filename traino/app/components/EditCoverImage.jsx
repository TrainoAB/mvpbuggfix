'use client';
import { useState, useEffect } from 'react';
import { playSound } from '@/app/components/PlaySound';
import { useAppState } from '@/app/hooks/useAppState';
import UploadModule from './UploadModule/UploadModule';
import Loader from '@/app/components/Loader';
import { updateYtId } from '../lib/actions/profile';
import { usePathname } from 'next/navigation';

import './EditCoverImage.css';

export default function EditCoverImage({ data, onClose, uploaded, onDelete, deleteLoading }) {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [youtubeid, setYoutubeid] = useState(data.youtube_id || ''); // Store the extracted YouTube ID
  const [youtubehelp, setYoutubehelp] = useState(false);
  const [changeImage, setChangeImage] = useState(false);
  const { DEBUG, userData, baseUrl, sessionObject, useTranslations, language } = useAppState();

  const { translate } = useTranslations('edit', language);

  const hasCover = data.coverimage ? true : false;

  useEffect(() => {
    DEBUG && console.log('Initial data:', data);
  }, [data]);

  const extractYoutubeId = (url) => {
    const regex =
      /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const handleChangeYoutube = (e) => {
    const url = e.target.value;
    const youtube_ID = extractYoutubeId(url);
    DEBUG && console.log('Extracted youtube_ID:', youtube_ID);
    setYoutubeid(youtube_ID || '');
  };

  const handleHelp = () => {
    setYoutubehelp(!youtubehelp);
  };

  const handleSave = async () => {
    setLoading(true);

    try {
      const data = await updateYtId(youtubeid, pathname, userData, baseUrl, sessionObject);

      setLoading(false);
      playSound('success', '0.5');
      onClose(false);
    } catch (error) {
      console.error('EditCover error:', error);
      alert(translate('unexpectederror', language));
    } finally {
      setLoading(false);
    }
  };

  // MARK: Markup

  return (
    <>
      <div id="coverimage_modal">
        <div className="categorytop">
          <div className="btn-back" onClick={() => onClose(false)}></div>
          <h1>{translate('edit_editcoverimage', language)}</h1>
          <div></div>
        </div>

        {!changeImage ? (
          <>
            <div
              className="button"
              onClick={() => {
                playSound('popclick', '0.5');
                setChangeImage(true);
              }}
            >
              {translate('edit_changeimage', language)}
            </div>
            <br />
            <div className="input-group">
              <label htmlFor="">{translate('edit_youtubelink', language)}</label>
              <input
                type="text"
                placeholder={translate('edit_youtubelink', language)}
                value={`https://youtu.be/${youtubeid}`}
                onChange={handleChangeYoutube}
              />

              <div className="icon-help" onClick={handleHelp}>
                ?
                {youtubehelp && (
                  <div>
                    <h4>{translate('edit_youtubevideo', language)}</h4>
                    <p>{translate('edit_pasteyoutubelink', language)}</p>
                    <p>Ex: https://youtu.be/y9p0-NSirQA?si=dSkxfl6LB1kf_9u3.</p>
                  </div>
                )}
              </div>
            </div>
            <span className="small">{translate('upload', language)}</span>
            <div className="modalbuttons">
              <div className="modalbuttons__info">{translate('edit_replacecovertext', language)}</div>
              {loading ? (
                <div className="button">
                  <Loader />
                </div>
              ) : (
                <div className="button" onClick={handleSave}>
                  {translate('save', language)}
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <button className="x-btn" onClick={onClose}></button>
            <div className="upload-module-container">
              {hasCover &&
                (deleteLoading ? (
                  <div className="button" style={{ width: '200px', padding: '0', height: '43.59px' }}>
                    <Loader />
                  </div>
                ) : (
                  <button className="button red" onClick={onDelete}>
                    {translate('edit_removecurrentimage', language)}
                  </button>
                ))}
              {userData.current && (
                <div className="upload-module-wrap">
                  <h3>{translate('upload', language)}</h3>
                  <UploadModule user={userData.current.id} folder="cover" aspect={2 / 1} uploaded={uploaded} />
                </div>
              )}
            </div>
          </>
        )}
      </div>
      <div className="darkoverlay" onClick={() => onClose(false)}></div>
    </>
  );
}
