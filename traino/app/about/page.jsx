'use client';

import Navigation from '@/app/components/Menus/Navigation';
import { useRouter } from 'next/navigation';
import { ContactUs } from '../components/ContactUs';

import AboutMembers from './AboutMembers';
import AboutContributors from './AboutContributors';
import AboutHistory from './AboutHistory';

import './page.css';
import '../train/page.css';

export default function About() {
  const router = useRouter();

  const handleBack = () => {
    if (router && router.back) {
      router.back();
    } else {
      window.history.back(); // Fallback för äldre webbläsare
    }
  };

  return (
    <>
      <main id="about-page" className="train-wrapper-one">
        <Navigation />
        <div className="about-container">
          <div className="heading-container">
            <div className="categorytop">
              <div className="btn-back" onClick={handleBack}></div>
              <h1>Om oss</h1>
              <div></div>
            </div>
            <div className="content-wrap">
              <div className="content header">
                <h2>Team Traino</h2>
                <p>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. In eros ipsum, porta ac neque eget, maximus
                  aliquam massa. Quisque consectetur felis non felis ultrices varius. Pellentesque sagittis suscipit
                  tellus, eu tincidunt ante pharetra dictum. Morbi risus ligula, mattis commodo lacinia a, rhoncus ac
                  justo. Suspendisse hendrerit vestibulum nisi, eu tristique risus dictum vitae.
                </p>
              </div>
              <AboutMembers />
              <AboutContributors />
              <AboutHistory />
              <ContactUs />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
