'use client';
import React, { useEffect, useState } from 'react';
import { useAppState } from '@/app/hooks/useAppState';
import { Header_DisplayButton } from '@/app/components/Header_DisplayButton';
import { InformationModal } from '@/app/components/InformationModal';
import Loader from '@/app/components/Loader';
import Navigation from '@/app/components/Menus/Navigation';
import FullCalendar from './FullCalendar';
import './page.css';

export default function Schedule({ params }) {
  return (
    <div>
      <FullCalendar />
    </div>
  );
}
