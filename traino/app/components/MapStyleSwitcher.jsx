"use client";
// app/components/MapStyleSwitcher.jsx
import { useEffect, useMemo, useState } from 'react';
import { getStadiaStyleKeysWithLabels } from '@/app/config/tileStyles';

export default function MapStyleSwitcher({ value, onChange, options }) {
  const [open, setOpen] = useState(false);

  // Cache options list, default to stadia style list
  const opts = useMemo(() => options || getStadiaStyleKeysWithLabels(), [options]);

  useEffect(() => {
    // Persist user choice
    if (value) {
      try {
        localStorage.setItem('traino:mapStyle', value);
      } catch (_) {}
    }
  }, [value]);

  // Subtle Leaflet-like control styling
  const containerStyle = {
    position: 'absolute',
    top: '10px',
    right: '10px',
    zIndex: 500, // below popups but above map
  };

  const controlStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  };

  const buttonStyle = {
    background: '#fff',
    border: '1px solid rgba(0,0,0,0.2)',
    borderRadius: 4,
    width: 32,
    height: 32,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
  };

  const panelStyle = {
    background: 'rgba(255,255,255,0.95)',
    border: '1px solid rgba(0,0,0,0.2)',
    borderRadius: 6,
    padding: '6px 8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  };

  const selectStyle = {
    border: '1px solid #ccc',
    borderRadius: 4,
    padding: '4px 6px',
    fontSize: 12,
    background: '#fff',
    color: '#333',
  };

  return (
    <div className="leaflet-top leaflet-right" style={containerStyle}>
      <div className="leaflet-control" style={controlStyle}>
        <button
          type="button"
          title="Map style"
          aria-label="Map style"
          onClick={() => setOpen((v) => !v)}
          style={buttonStyle}
        >
          {/* simple layers icon */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
            <polyline points="2 17 12 22 22 17"></polyline>
            <polyline points="2 12 12 17 22 12"></polyline>
          </svg>
        </button>

        {open && (
          <div role="dialog" aria-label="Select map style" style={panelStyle}>
            <label style={{ display: 'block', fontSize: 11, color: '#666', marginBottom: 4 }}>Map style</label>
            <select
              value={value}
              onChange={(e) => {
                onChange(e.target.value);
                setOpen(false);
              }}
              style={selectStyle}
              aria-label="Map style select"
            >
              {opts.map(({ key, label }) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
