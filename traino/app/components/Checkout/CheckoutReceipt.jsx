import React from 'react';
import { useAppState } from '@/app/hooks/useAppState';

export default function CheckoutReceipt({ selectedProducts, totalCost }) {
  const { DEBUG, useTranslations, language } = useAppState(); // This should be inside the function

  const { translate } = useTranslations('checkout', language);

  // DEBUG && console.log('CheckoutReceipt entered', selectedProducts[0]);

  // Helper function to determine VAT percentage
  const calculateVATPercentage = (product) => {
    if (product.product_type === 'trainingpass' || product.product_type === 'onlinetraining') {
      return 6; // Training passes and online training have 6% VAT
    }
    return 25; // All other cases have 25% VAT
  };

  // Helper function to calculate VAT amount
  const calculateVATAmount = (product) => {
    const vatPercentage = calculateVATPercentage(product);
    const amount = product.amount || 1; // Default to 1 if amount is undefined
    const priceWithoutVAT = product.price * amount;
    return (priceWithoutVAT * vatPercentage) / 100;
  };

  // MARK: Markup
  return (
    <>
      <section>
        {selectedProducts.map((product, index) => (
          <div id="booking-sum" key={`product-${index}`}>
            <h3 className="product-name">{product.product}</h3>
            <div className="product-details">
              <div className="icon-profile" aria-hidden="true"></div>
              <span className="name">
                <strong>{product.name}</strong>
              </span>
              <div className="icon-booking" aria-hidden="true"></div>
              <span className="date"> {product.date} </span>
              <div className="icon-clock" aria-hidden="true"></div>
              <span className="time">{product.time} min</span>
              <div className="icon-positionpoint" aria-hidden="true"></div>
              {/* <span className="location">{product.location}</span> */}
              <div className="icon-card" aria-hidden="true"></div>
            </div>
          </div>
        ))}
      </section>
      <hr />
      <h3 className="spec">{translate('checkout_specification', language)}</h3>
      <section className="summary-section">
        {selectedProducts.map((product, index) => {
          const vatPercentage = calculateVATPercentage(product);
          const vatAmount = calculateVATAmount(product);

          return (
            <React.Fragment key={`summary-${index}`}>
              <div className="sumhead">{translate('product', language)}</div>
              <div className="sumhead">{translate('price', language)}</div>
              <div className="product">
                {product.product === 'clipcard' && `${product.clipcard_amount || 1}x ${product.product_type} `}
                {product.product !== 'clipcard' && `${product.amount || 1}x ${product.product_type} `}
              </div>
              <div className="product">{product.price * (product.amount || 1)} kr</div>

              <div className="sumhead">
                {translate('checkout_incl', language)} {vatPercentage}% {translate('checkout_vat', language)} (
                {vatAmount} kr)
              </div>
            </React.Fragment>
          );
        })}
        <div></div>
        <div>{translate('checkout_sum', language)}</div>
        <div id="checkout-price">{totalCost} kr</div>
      </section>
    </>
  );
}
