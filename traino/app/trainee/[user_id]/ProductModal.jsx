import { useState, useEffect } from 'react';
import { useAppState } from '@/app/hooks/useAppState';
import Link from 'next/link';

import './ProductModal.css';

export default function ProductModal({ data, onClose }) {
  const { DEBUG, useTranslations, language } = useAppState();

  const { translate } = useTranslations('global', language);

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

  const handleProductClick = (event) => {
    // Return early if the event target has the class 'button'
    if (event.target.classList.contains('button')) {
      return;
    }

    // Find the nearest parent with class 'product-item' to ensure we're targeting the correct container
    const productItem = event.currentTarget.closest('.product-item');
    if (productItem) {
      productItem.classList.toggle('extraon');
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

            <h1>{setProductName(data.product)}</h1>
            <div></div>
          </div>
          <div className="content">
            <div className="scrollable">
              {/* Trainprogram */}
              {data.product === 'trainprogram' &&
                data.products.map((item, index) => (
                  <div
                    key={index}
                    className={'product-item ' + item.product}
                    data-id={item.id}
                    data-product={item.product}
                    onClick={handleProductClick}
                  >
                    <div className="head">
                      <div className="icon-chevron"></div>

                      <div className="icon-dietprogram"></div>

                      <div className="info">
                        <div className="product_type">
                          <strong>{item.category_name}</strong>
                        </div>
                        <div className="icons">
                          <div className="amount">{item.product_sessions}</div>
                          <div className="clock">{item.conversations}min</div>
                        </div>
                      </div>
                      <div className="button icon-download"></div>
                    </div>
                    <div className="extra">
                      <div>
                        <span>{translate('trainer', language)}</span>
                      </div>
                      <div>
                        <Link href={'/trainer/@' + item.trainer.alias}>
                          <strong>{item.trainer.firstname + ' ' + item.trainer.lastname}</strong>
                        </Link>
                      </div>
                      <div>
                        <span>{translate('price', language)}</span>
                      </div>
                      <div>{item.price}kr</div>
                      <div>
                        <span>{translate('type', language)}</span>
                      </div>
                      <div>{item.product_type === 'regular' ? 'Vanlig' : 'Skräddarsydd'}</div>
                      <div>
                        <span>{translate('session', language)}</span>
                      </div>
                      <div>{item.product_sessions}</div>
                      <div>
                        <span>{translate('conversation', language)}</span>
                      </div>{' '}
                      <div>{item.conversations} min</div>
                      <div>
                        <span>{translate('adress', language)}</span>
                      </div>
                      <div>{item.address}</div>
                      <div>
                        <span>{translate('description', language)}</span>
                      </div>
                      <div>{item.description}</div>
                    </div>
                  </div>
                ))}

              {/* Dietprogram */}
              {data.product === 'dietprogram' &&
                data.products.map((item, index) => (
                  <div
                    key={index}
                    className={'product-item ' + item.product}
                    data-id={item.id}
                    data-product={item.product}
                    onClick={handleProductClick}
                  >
                    <div className="head">
                      <div className="icon-chevron"></div>

                      <div className="icon-dietprogram"></div>

                      <div className="info">
                        <div className="product_type">
                          <strong>{item.category_name}</strong>
                        </div>
                        <div className="icons">
                          <div className="amount">{item.product_sessions}</div>
                          <div className="clock">{item.conversations}min</div>
                        </div>
                      </div>
                      <div className="button icon-download"></div>
                    </div>
                    <div className="extra">
                      <div>
                        <span>{translate('trainer', language)}</span>
                      </div>
                      <div>
                        <Link href={'/trainer/@' + item.trainer.alias}>
                          <strong>{item.trainer.firstname + ' ' + item.trainer.lastname}</strong>
                        </Link>
                      </div>
                      <div>
                        <span>{translate('price', language)}</span>
                      </div>
                      <div>{item.price}kr</div>
                      <div>
                        <span>{translate('type', language)}</span>
                      </div>
                      <div>{item.product_type === 'regular' ? 'Vanlig' : 'Skräddarsydd'}</div>
                      <div>
                        {/* TODO: Translate this */}
                        <span>Veckor</span>
                      </div>
                      <div>{item.product_sessions}</div>
                      <div>
                        <span>{translate('conversation', language)}</span>
                      </div>{' '}
                      <div>{item.conversations} min</div>
                      <div>
                        <span>{translate('adress', language)}</span>
                      </div>
                      <div>{item.address}</div>
                      <div>
                        <span>{translate('description', language)}</span>
                      </div>
                      <div>{item.description}</div>
                    </div>
                  </div>
                ))}

              {/* Clipcard */}
              {data.product === 'clipcard' &&
                data.products.map((item, index) => (
                  <div
                    key={index}
                    className={'product-item ' + item.product}
                    data-id={item.id}
                    data-product={item.product}
                    onClick={handleProductClick}
                  >
                    <div className="head">
                      <div className="icon-chevron"></div>
                      {item.product === 'trainingpass' && <div className="icon-train"></div>}
                      {item.product === 'clipcard' && <div className="icon-clipcard"></div>}
                      {(item.product === 'trainprogram' || item.product === 'dietprogram') && (
                        <div className="icon-dietprogram"></div>
                      )}
                      <div className="info">
                        <div className="product_type">
                          <strong>{setProductName(item.product)}</strong>
                        </div>
                        <div className="price">{item.price}kr</div>
                      </div>
                      <div className="button">{translate('book', language)}</div>
                    </div>
                    <div className="extra">
                      <div>
                        <span>{translate('type', language)}</span>
                      </div>
                      <div>{item.product_type === 'regular' ? 'Vanlig' : 'Skräddarsydd'}</div>
                      <div>
                        <span>{item.product === 'dietprogram' ? 'Veckor' : 'Tillfällen'}</span>
                      </div>
                      <div>{item.product_sessions}</div>
                      <div>
                        <span>{translate('conversation', language)}</span>
                      </div>{' '}
                      <div>{item.conversations} min</div>
                      <div>
                        <span>{translate('adress', language)}</span>
                      </div>
                      <div>{item.address}</div>
                      <div>
                        <span>{translate('description', language)}</span>
                      </div>
                      <div>{item.description}</div>
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
