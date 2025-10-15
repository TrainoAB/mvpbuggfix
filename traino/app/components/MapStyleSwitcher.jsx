"use client";
// app/components/MapStyleSwitcher.jsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { getStadiaStyleKeysWithLabels } from '@/app/config/tileStyles';

export default function MapStyleSwitcher({
  value,
  onChange,
  options,
  disabled = false,
  disabledReason,
  variant = 'map-control',
  className = '',
  ...rest
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  // Cache options list, default to stadia style list
  const opts = useMemo(() => options || getStadiaStyleKeysWithLabels(), [options]);

  useEffect(() => {
    if (disabled && open) {
      setOpen(false);
    }
  }, [disabled, open]);

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

  const computedButtonStyle = {
    ...buttonStyle,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
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

  const stopPropagation = (event) => {
    event.stopPropagation();
  };

  const title = disabled ? disabledReason || 'Map style unavailable' : 'Map style';

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  if (variant === 'toolbar') {
    const toolbarClass = ['btn-mapfilter', 'btn-mapstyle', className, disabled ? 'disabled' : '']
      .filter(Boolean)
      .join(' ');
    return (
      <div
        ref={containerRef}
        className={toolbarClass}
        title={title}
        role="button"
        aria-label="Map style"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-disabled={disabled}
        onClick={(event) => {
          event.stopPropagation();
          if (disabled) return;
          setOpen((prev) => !prev);
        }}
        onMouseDown={stopPropagation}
        onTouchStart={stopPropagation}
        {...rest}
      >
        {open && !disabled && (
          <div className="mapstyle-panel" role="menu">
            <div className="mapstyle-header">Map style</div>
            <ul className="mapstyle-list">
              {opts.map(({ key, label }) => (
                <li key={key} role="none">
                  <button
                    type="button"
                    role="menuitemradio"
                    aria-checked={value === key}
                    className={`mapstyle-option${value === key ? ' selected' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onChange(key);
                      setOpen(false);
                    }}
                  >
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="leaflet-top leaflet-right"
      style={containerStyle}
      onMouseDown={stopPropagation}
      onTouchStart={stopPropagation}
      onClick={stopPropagation}
      {...rest}
    >
      <div className="leaflet-control" style={controlStyle}>
        <button
          type="button"
          title={title}
          aria-label="Map style"
          aria-expanded={open}
          aria-disabled={disabled}
          disabled={disabled}
          onClick={() => {
            if (disabled) return;
            setOpen((v) => !v);
          }}
          style={computedButtonStyle}
        >
          {/* simple layers icon */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
            <polyline points="2 17 12 22 22 17"></polyline>
            <polyline points="2 12 12 17 22 12"></polyline>
          </svg>
        </button>

        {open && !disabled && (
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
