'use client';
import { useEffect, useRef, useState } from 'react';
import { useAppState } from '@/app/hooks/useAppState';
import { useRouter } from 'next/navigation';
import { formatDateToWord, capitalizeFirstLetter, formatDateToMonthYear } from '@/app/functions/functions';
import './TransactionsModal.css';

export default function TransactionsModal({ transactionsId, onClose }) {
  const { DEBUG, useTranslations, language, isLoggedin, userData } = useAppState();

  const { translate } = useTranslations('transactions', language);

  const router = useRouter();

  /* Go to login if not loggedin
  if (!isLoggedin.current) {
    router.push(`/login`);
    return;
  }
*/

  /* Go to login if not loggedin with right id
  useEffect(() => {
    if (params.slug !== userData.current.id) {
      router.push(`/login`);
      return;
    }
  }, [userData.current.id]);
  */

  const data = [
    {
      id: 1,
      product_id: 13,
      payment_method: 'Swish',
      type: 'trainpass',
      text: 'Styrketräning 60 min',
      transaction: -450,
      name: 'Amanda Johansson',
      date: '2024-10-10 12:56:54',
    },
  ];

  const vat = data[0].transaction * 0.06;
  const netto = data[0].transaction - vat;

  const address = 'Seminarievägen 20, 3538';
  const orgNr = '559323-2621';

  // Function to determine the icon class based on item.type
  const getIconClass = (type) => {
    switch (type) {
      case 'trainpass':
        return 'icon-train';
      case 'clipcard':
        return 'icon-clipcard';
      case 'dietprogram':
        return 'icon-dietprogram';
      case 'trainprogram':
        return 'icon-trainprogram';
      case 'onlinetraining':
        return 'icon-onlinetraining';
      default:
        return 'icon-default'; // Define a default icon class if needed
    }
  };

  const handleBack = () => {
    onClose(false);
  };
  // MARK: Markup
  return (
    <>
      <main id="transactions-modal">
        <div className="categorytop">
          <div className="btn-back" onClick={handleBack}></div>
          <h1>{translate('details', language)}</h1>
          <div></div>
        </div>
        <div className="scrollcontent">
          <div className="content">
            <div className="transactions">
              {data.map((item, index) => (
                <>
                  <div key={index} className="transaction-item">
                    <div className={getIconClass(item.type)}></div>
                    <div className="info">
                      <div className="name">{item.text}</div>
                    </div>
                    <div className="date">
                      <div className="price">{item.transaction} kr</div>
                    </div>
                  </div>
                  <div className="list">
                    <div>{translate('paymentmethod', language)}</div>
                    <div>
                      <span className={item.payment_method}>{item.payment_method}</span>
                    </div>
                    <div>{translate('reciver', language)}</div>
                    <div>{item.name}</div>
                    <div>{translate('grossamount', language)}</div>
                    <div>{item.transaction} kr</div>
                    <div>
                      {translate('vat', language)} 6% ({translate('including', language)})
                    </div>
                    <div>{vat} kr</div>
                    <div> {translate('netamount', language)}</div>
                    <div>{netto} kr</div>
                    <div> {translate('transactionsday', language)}</div>
                    <div>{formatDateToWord(item.date)}</div>

                    <div> {translate('productid', language)}</div>
                    <div>{item.product_id}</div>
                    <div> {translate('trainoadress', language)}</div>
                    <div>{address}</div>
                    <div> {translate('orgnr', language)}</div>
                    <div>{orgNr}</div>
                  </div>
                </>
              ))}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
