'use client';

import './ContactUs.css';
import Link from 'next/link';
import { useAppState } from '@/app/hooks/useAppState';
export const ContactUs = () => {
  const { DEBUG, useTranslations, language } = useAppState();
  const { translate } = useTranslations('contactus', language);
  return (
    <div id="contact-wrap">
      <div>
        <h4>
          {/* Kontakta oss */}
          {translate('contact_us', language)}
        </h4>
        <p>
          {/* Har du frågor? Tveka inte att kontakta oss! */}
          {translate('contact_us_description', language)}
        </p>

        <a href="mailto:support@traino.com">
          <button className="button">
            <span className="icon-email"></span>
            {/* Mejla oss */}
            {translate('email_us', language)}
          </button>
        </a>
      </div>
      <div>
        <h5>
          {/* Sociala medier */}
          {translate('social_media', language)}
        </h5>
        <div className="socialmedia">
          <Link href="https://youtube.com/@trainoofficial?feature=shared" target="_blank" className="icon-youtube">
            {' '}
          </Link>
          <Link
            href="https://www.tiktok.com/@trainoofficial?_t=8nFINogV9zF&_r=1"
            target="_blank"
            className="icon-tiktok"
          ></Link>
          <Link
            href="https://www.instagram.com/trainotheapp?igsh=c3ljenRzbGNlajRv"
            target="_blank"
            className="icon-instagram"
          ></Link>
        </div>
      </div>
    </div>
  );
};
