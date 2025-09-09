import React, { useEffect, useState } from 'react';

// Enkel cookie-helper
const setCookie = (name, value, days) => {
  const d = new Date();
  d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
  const expires = 'expires=' + d.toUTCString();
  document.cookie = `${name}=${value};${expires};path=/`;
};

const getCookie = (name) => {
  const decodedCookie = decodeURIComponent(document.cookie);
  const ca = decodedCookie.split(';');
  name = name + '=';
  for (let c of ca) {
    c = c.trim();
    if (c.indexOf(name) === 0) return c.substring(name.length, c.length);
  }
  return '';
};

const EventModal = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const seen = getCookie('bookingInfoSeen');
    if (!seen) {
      setVisible(true);
      setCookie('bookingInfoSeen', 'true', 30); // sparas i 30 dagar
    }
  }, []);

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: '#fff',
          maxWidth: '600px',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
        }}
      >
        <h2>Så här bokar du din aktivitet på eventdagen</h2>
        <p>
          För att testa <strong>TRAINO</strong>-plattformen har vi öppnat upp bokningssystemet exklusivt för er!
        </p>

        <h3 style={{ marginTop: '1rem' }}>Så här fungerar det:</h3>
        <ol style={{ marginLeft: '20px', marginTop: '1rem', marginBottom: '1rem' }}>
          <li>Skapa ett konto (det tar mindre än en minut).</li>
          <li>Välj aktivitet och tid i schemat för eventdagen.</li>
          <li>
            Boka som vanligt – <strong>priset är alltid 5 kr.</strong>
          </li>
          <li>
            Vid betalningen anger du testkortnummer:
            <br />
            <strong>4242 4242 4242 4242</strong>
            <br />
            <em>(alla andra fält fyller du med valfria siffror/datum)</em>.
          </li>
          <li>Klart – din bokning är registrerad!</li>
        </ol>

        <p>
          <strong>👉 OBS!</strong> Ingen riktig betalning sker. Detta är endast för att simulera hur bokningssystemet
          fungerar.
        </p>
        <br />
        <button className="button" onClick={() => setVisible(false)}>
          Stäng
        </button>
      </div>
    </div>
  );
};

export default EventModal;
