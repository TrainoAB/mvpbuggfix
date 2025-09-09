'use client';
import Navigation from '@/app/components/Menus/Navigation';
import FAQList from './FAQList';
import './page.css';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function FAQ() {
  const router = useRouter();

  const handleBack = () => {
    if (router && router.back) {
      router.back();
    } else {
      window.history.back();
    }
  };

  return (
    <main id="faq">
      <Navigation />
      <div className="categorytop">
        <div className="btn-back" onClick={handleBack}></div>
        <h1>FAQ</h1>
        <div></div>
      </div>
      <div className="scrollcontainer">
        <div className="content">
          <FAQList admin={false} />
        </div>
      </div>
    </main>
  );
}
