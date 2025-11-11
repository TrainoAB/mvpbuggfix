import { useState, useEffect } from 'react';
import { useAppState } from '@/app/hooks/useAppState';
import { playSound } from '@/app/components/PlaySound';

import './ProductModal.css';
import deleteImage from '@/app/api/aws/delete';
import React from 'react';

export default function ProductModal({ data, onClose, allData, setAllData, refreshProducts }) {
  const { DEBUG, useTranslations, language, isLoggedin, userData, sessionObject, baseUrl } = useAppState();
  const [products, setProducts] = useState(data.products);

  const { translate } = useTranslations('products', language);

  const setProductName = (name) => {
    if (name === 'dietprogram') {
      return translate('dietprogram', language);
    } else if (name === 'trainprogram') {
      return translate('trainprogram', language);
    } else if (name === 'onlinetraining') {
      return translate('onlinetraining', language);
    } else if (name === 'clipcard') {
      return translate('clipcard', language);
    } else if (name === 'trainingpass') {
      return translate('trainingpass', language);
    }
  };

  const handleProductClick = (event) => {
    // Return early if the event target has the class 'button'
    if (event.target.classList.contains('button')) {
      return;
    }

    // Find the nearest parent with class 'product-item' to ensure we're targeting the correct container
    const productItem = event.currentTarget.closest('.product-item');
    if (productItem) {
      playSound('swipe', '0.5');
      productItem.classList.toggle('extraon');
    }
  };

  const handleRemoveItem = (event, item, index) => {
    event.preventDefault();
    event.stopPropagation();
    DEBUG && console.log('Deleting item', index, item);

    let confirmText;
    if (item.product === 'trainingpass' || item.product === 'onlinetraining') {
      confirmText = translate('prod_deletepassproduct', language);
    } else if (item.product === 'trainprogram' || item.product === 'dietprogram') {
      confirmText = translate('prod_deleteprogramproduct', language);
    } else {
      confirmText = translate('prod_deleteclipcard', language);
    }

    const check = confirm(confirmText);

    if (check) {
      playSound('delete', '0.5');
      // Handle successful deletion
      const updatedProducts = products.filter((_, i) => i !== index);
      setProducts(updatedProducts);

      const updatedData = allData.map((dataItem) => ({
        ...dataItem, // Spread the other properties of the dataItem
        products: dataItem.products.filter((product) => product.id !== item.id), // Filter the products array
      }));

      setAllData(updatedData);

      const deleteProduct = async () => {
        try {
          if (item.hasfile) {
            deleteImage({ src: `https://traino.s3.amazonaws.com/${item.user_id}/${item.product_type}/${item.id}.pdf` });
          } else if (item.hasimage) {
            deleteImage({
              src: `https://traino.s3.amazonaws.com/${item.user_id}/${item.product_type}/${item.id}.webp`,
            });
          }
        } catch (error) {
          console.error('Error deleting product file:', error);
          return;
        }

        try {
          const response = await fetch(`${baseUrl}/api/proxy`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${sessionObject.token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              url: `${baseUrl}/api/products/delete`,
              method: 'POST',
              body: JSON.stringify(item),
            }),
          });

          if (response.ok) {
            DEBUG && console.log('Product deleted successfully');
            // Refresh products data in parent component
            if (refreshProducts) {
              await refreshProducts();
            }
          } else {
            // Handle error
            console.error('Failed to delete product');
          }
        } catch (error) {
          console.error('Error deleting product:', error);
        }
      };

      deleteProduct();
    }
  };

  // MARK: Markup
  return (
    <>
      <div id="modal-container">
        <div id="modal">
          <div className="categorytop">
            <div
              className="btn-back"
              onClick={() => {
                onClose('closed');
              }}
            ></div>

            <h1>{data.category_name}</h1>
            <div></div>
          </div>
          <div className="content">
            <div className="scrollable">
              {products.map((item, index) => (
                <div
                  key={index}
                  className={'product-item ' + item.product}
                  data-id={item.id}
                  data-product={item.product}
                  onMouseOver={() => playSound('tickclick', '0.5')}
                  onClick={handleProductClick}
                >
                  <div className="head">
                    <div className="icon-chevron"></div>
                    {(item.product_type === 'trainingpass' || item.product_type === 'onlinetraining') && (
                      <div className="icon-train"></div>
                    )}
                    {item.product_type === 'clipcard' && <div className="icon-clipcard"></div>}
                    {(item.product_type === 'trainprogram' || item.product_type === 'dietprogram') && (
                      <div className="icon-dietprogram"></div>
                    )}
                    <div className="info">
                      <div className="product_type">
                        <strong>
                          {setProductName(item.product_type)}
                          {(item.product === 'trainingpass' ||
                            item.product === 'onlinetraining' ||
                            item.product === 'clipcard') &&
                            `, ${item.duration}min`}
                        </strong>
                      </div>
                      {item.product === 'clipcard' ? (
                        <div className="price">
                          {item.clipcard_5_price ? `5x` : null}
                          {item.clipcard_10_price ? `, 10x` : null}
                          {item.clipcard_20_price ? `, 20x` : null}
                        </div>
                      ) : (
                        <div className="price">{item.formatted_price}</div>
                      )}
                    </div>
                    <div
                      className="button"
                      onMouseOver={() => playSound('popclick', '0.5')}
                      onClick={() => {
                        handleRemoveItem(event, item, index);
                      }}
                    >
                      {translate('remove', language)}
                    </div>
                  </div>
                  <div className="extra">
                    {item.product !== 'trainingpass' &&
                      item.product !== 'onlinetraining' &&
                      item.product !== 'clipcard' && (
                        <>
                          <div>
                            <span>{translate('type', language)}</span>
                          </div>

                          <div>{item.product_type === 'regular' ? 'Vanlig' : 'Skräddarsydd'}</div>
                          <div>
                            <span>{item.product === 'dietprogram' ? 'Veckor' : 'Tillfällen'}</span>
                          </div>
                          <div>{item.product_sessions}</div>
                          <div>
                            <span>{translate('conversations', language)}</span>
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
                    {item.product !== 'clipcard' && (
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
