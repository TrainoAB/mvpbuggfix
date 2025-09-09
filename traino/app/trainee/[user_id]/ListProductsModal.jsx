import { useState, useEffect } from 'react';
import { useAppState } from '@/app/hooks/useAppState';
import Link from 'next/link';
import './ListProductsModal.css';
import Loader from '@/app/components/Loader';

export default function ListProductsModal({ data, onClose }) {
  const { DEBUG, useTranslations, language, isLoggedin, userData, sessionObject, baseUrl } = useAppState();
  const [productsName, setProductsName] = useState('');
  const [productModal, setProductModal] = useState(false);
  const [selectedProductUrl, setSelectedProductUrl] = useState(null);

  const { translate } = useTranslations('global', language);

  useEffect(() => {
    const initialSetup = async () => {
      if (data[0].clipcard_id !== undefined) {
        setProductsName(translate('clipcard', language));
      } else {
        const productName = setProductName(data[0].product_type);
        setProductsName(productName);
      }
    };
    initialSetup();

    DEBUG && console.log('data:', data);
  }, []);

  useEffect(() => {
    DEBUG && console.log('selectedProductUrl:', selectedProductUrl);
  }, [selectedProductUrl]);

  const setProductName = (name) => {
    if (name === 'dietprogram') {
      return translate('dietprogram', language);
    } else if (name === 'trainprogram') {
      return translate('trainprogram', language);
    } else if (name === 'onlinetraining') {
      return translate('onlinetraining', language);
    } else if (name === 'clipcard') {
      return translate('clipcard', language);
    } else if (name === 'trainpass') {
      return translate('trainpass', language);
    } else if (name === 'product_dietprogram') {
      return translate('dietprogram', language);
    }
  };

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

  const handleViewProductClick = async (product_type, user_id, file_name) => {
    const url = await fetchPresignedUrl('traino', `${user_id}/${product_type}/${file_name}`);
    setSelectedProductUrl(url);
    setProductModal(!productModal);

    // remove second scrollbar beside modal
    const profileDiv = document.getElementById('profile');

    if (profileDiv) {
      if (productModal) {
        profileDiv.style.overflow = 'auto';
      } else if (!productModal) {
        profileDiv.style.overflow = 'hidden';
      }
    }
  };

  const handleBack = () => {
    onClose('closed');
  };

  // MARK: Markup
  return (
    <>
      {productModal && (
        <div id="product-modal" className="product-modal">
          <div className="categorytop">
            <div className="btn-back" onClick={handleBack}></div>

            <h1>{translate('product', language)}</h1>
            <div></div>
            <span className="closeBoughtModal" onClick={() => handleViewProductClick()}>
              &times;
            </span>
          </div>
          {selectedProductUrl ? (
            <iframe src={selectedProductUrl} className="embeddedPdf" frameborder="0"></iframe>
          ) : (
            <Loader />
          )}
        </div>
      )}
      <div id="listed-modal-container">
        <div id="listed-modal">
          <div className="categorytop">
            <div
              className="btn-back"
              onClick={() => {
                onClose('closed');
              }}
            ></div>

            <h1>{productsName}</h1>
            <div></div>
          </div>
          <div className="content">
            <div className="scrollable">
              {data.map((item, index) => (
                <div key={index} className={'product-item ' + item.product_type}>
                  <div className="head">
                    <div></div>

                    {/* ICONS */}
                    {(item.product_type === 'trainingpass' || item.product_type === 'onlinetraining') && (
                      <div className="icon-train"></div>
                    )}
                    {item.product_type === 'clipcard' && <div className="icon-clipcard"></div>}
                    {(item.product_type === 'trainprogram' || item.product_type === 'dietprogram') && (
                      <div className="icon-dietprogram"></div>
                    )}

                    <div className="info">
                      <div className="product_type">
                        <strong>{item.category_name}</strong>
                      </div>
                      <div className="">
                        <Link href={`/trainer/@${item.alias}/`}>
                          {item.firstname} {item.lastname}
                        </Link>
                      </div>
                    </div>
                    <button
                      className="button"
                      onClick={() => {
                        const fileType = item.hasfile ? `${item.id}.pdf` : item.hasimage ? `${item.id}.webp` : null;
                        handleViewProductClick(item.product_type, item.user_id, fileType);
                      }}
                    >
                      {translate('show', language)}
                    </button>
                  </div>
                  <div className="extra">
                    {item.product_type !== 'trainingpass' &&
                      item.product_type !== 'onlinetraining' &&
                      item.product_type !== 'clipcard' && (
                        <>
                          <div>
                            <span>{translate('type', language)}</span>
                          </div>

                          {/* TODO: Fix translation here */}
                          <div>{item.product_type === 'regular' ? 'Vanlig' : 'Skräddarsydd'}</div>
                          <div>
                            <span>{item.product_type === 'dietprogram' ? 'Veckor' : 'Tillfällen'}</span>
                          </div>
                          <div>{item.product_sessions}</div>
                          <div>
                            <span>{translate('conversation', language)}</span>
                          </div>
                          <div>{item.conversations} min</div>
                        </>
                      )}

                    {item.product === 'clipcard' && (
                      <>
                        <div>
                          <span>{translate('price', language)}</span>
                        </div>
                        <div>
                          {item.clipcard_5_price ? `5x (${item.clipcard_5_price}kr)` : null}
                          {item.clipcard_10_price ? `, 10x (${item.clipcard_10_price}kr)` : null}
                          {item.clipcard_20_price ? `, 20x (${item.clipcard_20_price}kr)` : null}
                        </div>
                      </>
                    )}
                    <div>
                      <span>{translate('adress', language)}</span>
                    </div>
                    <div>{item.address}</div>
                    {item.product_type !== 'clipcard' && (
                      <>
                        <div>
                          <span>{translate('description', language)}</span>
                        </div>
                        <div>{item.description}</div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div
          className="darkoverlay"
          onClick={() => {
            onClose('closed');
          }}
        ></div>
      </div>
    </>
  );
}
