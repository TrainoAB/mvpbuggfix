'use client';
import { formatDateToWord, formatDateToNumber, getTimeRange, formatTimeRange } from '@/app/functions/functions';
import { playSound } from '@/app/components/PlaySound';
import { useAppState } from '@/app/hooks/useAppState';
import Link from 'next/link';
import Image from 'next/image';
import CancellationModal from '@/app/components/CancellationModal';

import './BookingDetails.css';
import { baseUrl, sessionObject } from '@/app/functions/functions';
import { useEffect, useState } from 'react';

export default function BookingDetails({ data, onClose, onCancel }) {
  const { DEBUG, useTranslations, language } = useAppState();
  const { translate } = useTranslations('global', language);
  const [isWithin24Hours, setIsWithin24Hours] = useState(false);

  useEffect(() => {
    DEBUG && console.log('data:', data);

    const bookingDate = new Date(data.date);
    const now = new Date();
    const diffMs = bookingDate - now;
    setIsWithin24Hours(diffMs > 0 && diffMs <= 24 * 60 * 60 * 1000);
  }, [data]);

  const handleCancel = async () => {
    onCancel(data);
    onClose(false);
  };

  return (
    <>
      <main id="bookingdetails">
        <div className="categorytop">
          <div className="btn-back" onClick={() => onClose(false)}></div>
          <h1>{translate(`cat_${data.sport.category_link}`)}</h1>
          <div></div>
        </div>

        <div className="scrollcontainer">
          <div className="sport">
            <Image src={data.sport.category_image} alt="" fill="all" style={{ objectFit: 'cover' }} priority />
          </div>
          <div className="trainer">
            <div className="thumbnail">
              <img
                src={
                  data.details.thumbnail === 1
                    ? `https://traino.s3.eu-north-1.amazonaws.com/${data.trainer.trainer_id}/profile/profile-image.webp`
                    : '/assets/icon-profile.svg'
                }
                alt=""
              />
            </div>
          </div>
          <div className="scrollbox">
            <div className="content">
              <Link href={`/trainer/@${data.trainer.alias}`} className="name">
                {data.trainer.trainer_name}
              </Link>
              <h4>{translate('trainingpass', language)}</h4>

              <div className="details">
                <div className="date">
                  {formatDateToNumber(data.date)} {translate(formatDateToWord(data.date), language)}
                </div>
                <div className="time">{data.time} min</div>
                <div className="duration">
                  {data.starttime && data.endtime
                    ? formatTimeRange(data.starttime, data.endtime)
                    : getTimeRange(data.date, data.time)}
                </div>
                <div className="address">{data.address}</div>
              </div>
              {!isWithin24Hours && (
                <button className="button onlyborder" onClick={handleCancel}>
                  {translate('cancelbooking', language)}
                </button>
              )}
              <br />
              <h5>{translate('productdescription', language)}</h5>
              <div className="description">{data.details.description}</div>
            </div>
          </div>
        </div>
      </main>
      <div className="darkoverlay" onClick={() => onClose(false)}></div>
    </>
  );
}
