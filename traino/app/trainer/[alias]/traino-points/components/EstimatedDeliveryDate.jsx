import React, { useState, useEffect } from 'react';

export default function EstimatedDeliveryDate(props) {
  
    const [formattedDate, setFormattedDate] = useState('');

  useEffect(() => {
    const today = new Date();
    today.setDate(today.getDate() + props.daysFromNow); // Lägg till 3 dagar

    const year = String(today.getFullYear());
    const month = String(today.getMonth() + 1).padStart(2, '0'); // Månader är nollindexerade
    const day = String(today.getDate()).padStart(2, '0');

    setFormattedDate(`${year}-${month}-${day}`);
  }, []); // Körs bara en gång när komponenten laddas

  return (
    <div id="estimated-delivery-date">
        <p className='subheader-adress-and-delivery'>Beräknad leverans</p>
        <p>{formattedDate}</p>
    </div>
  );
}
