'use client';
import { useState } from 'react';
import ScheduleProduct from '@/app/components/Calendar/ScheduleProduct/ScheduleProduct';

import './page.css';

export default function TestSchedule({ params }) {
  const user_id = params.user_id;

  return (
    <>
      <ScheduleProduct user_id={user_id} />
    </>
  );
}
