'use client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/app/components/Menus/Navigation';

import './page.css';

export default function Stats() {
  return (
    <>
      <main className="stats">
        <Navigation />
        <div className="categorytop">
          {/* <div className="btn-back"></div> */}
          <div></div>
          <h1>Statistik</h1>
          <div></div>
        </div>
      </main>
    </>
  );
}
