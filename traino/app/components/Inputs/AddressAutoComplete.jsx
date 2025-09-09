'use client';
import React, { useState, useCallback, useEffect, useRef, forwardRef } from 'react';
import { useAppState } from '@/app/hooks/useAppState';
import { debounce } from '@/app/functions/functions';
import { standardizeCoordinate } from '@/app/utils/coordinateUtils';
import './AddressAutoComplete.css';

const AddressAutoComplete = forwardRef(({ onSelect, error, value }, ref) => {
  const { DEBUG, useTranslations, language } = useAppState();
  const [query, setQuery] = useState(value || ''); // Initialize with value prop
  const [suggestions, setSuggestions] = useState([]);
  const [fetchError, setFetchError] = useState(null); // Renamed state variable
  const suggestionsRef = useRef(null); // Ref for suggestions dropdown
  const [selectedAddress, setSelectedAddress] = useState(null); // New state variable

  const { translate } = useTranslations('signup', language);

  const fetchSuggestions = async (searchQuery) => {
    const tryFetch = async (query) => {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          query,
        )}&format=json&addressdetails=1&limit=20`,
        {
          mode: 'cors', // Ensure CORS headers are included
        },
      );
      return response.json();
    };

    try {
      let data = await tryFetch(searchQuery);

      DEBUG && console.log('AddressAutoComplete: Initial data:', data);

      if (Array.isArray(data) && data.length > 0) {
        const filteredData = data.filter((result) => {
          const address = result.address;
          const queryParts = searchQuery
            .toLowerCase()
            .split(/[\s,]+/)
            .filter(Boolean);
          return queryParts.every(
            (part) =>
              address.road?.toLowerCase().includes(part) ||
              address.house_number?.toLowerCase().includes(part) ||
              address.city?.toLowerCase().includes(part) ||
              address.municipality?.toLowerCase().includes(part) ||
              address.town?.toLowerCase().includes(part) ||
              address.suburb?.toLowerCase().includes(part) ||
              address.village?.toLowerCase().includes(part) ||
              address.hamlet?.toLowerCase().includes(part) ||
              address.county?.toLowerCase().includes(part) ||
              address.state?.toLowerCase().includes(part) ||
              address.country?.toLowerCase().includes(part) ||
              address.postcode?.toLowerCase().includes(part),
          );
        });

        // Remove duplicate entries
        const uniqueData = filteredData.filter(
          (result, index, self) =>
            index ===
            self.findIndex(
              (r) =>
                r.address.road === result.address.road &&
                r.address.house_number === result.address.house_number &&
                r.address.city === result.address.city &&
                r.address.municipality === result.address.municipality &&
                r.address.country === result.address.country,
            ),
        );

        DEBUG && console.log('AddressAutoComplete: Filtered data:', uniqueData);

        setSuggestions(
          uniqueData.map((result) => ({
            name: result.address.road || '',
            streetNumber: result.address.house_number || '',
            city:
              result.address.city ||
              result.address.municipality ||
              result.address.town ||
              result.address.suburb ||
              result.address.village ||
              result.address.hamlet ||
              '',
            county: result.address.county || '',
            state: result.address.state || '',
            country: result.address.country || '',
            postcode: result.address.postcode || '',
            latitude: standardizeCoordinate(result.lat),
            longitude: standardizeCoordinate(result.lon),
          })),
        );
        setFetchError(null);
      } else {
        setFetchError(translate('nosuggestionsfound', language));
      }
    } catch (err) {
      DEBUG && console.error('AddressAutoComplete: Fetch error:', err);
      setFetchError('Error occurred while fetching suggestions');
    }
  };

  const formatSuggestion = (suggestion) => {
    const parts = [
      suggestion.name,
      suggestion.streetNumber,
      suggestion.city,
      suggestion.county,
      suggestion.state,
      suggestion.country,
      suggestion.postcode,
    ].filter(Boolean);
    return parts.join(', ');
  };

  // Create a debounced version of fetchSuggestions
  const debouncedFetchSuggestions = useCallback(debounce(fetchSuggestions, 300), []);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);

    if (value.length > 2) {
      debouncedFetchSuggestions(value);
    } else {
      setSuggestions([]);
    }
  };

  const handleSelect = (suggestion) => {
    setSelectedAddress(
      `${suggestion.name || ''}${suggestion.streetNumber ? ' ' + suggestion.streetNumber : ''}, ${
        suggestion.city ? suggestion.city : suggestion.municipality
      }, ${suggestion.country}`,
    );
    setQuery('');
    setSuggestions([]);
    if (onSelect) {
      onSelect(suggestion); // Pass the full suggestion object including lat/lng
    }
  };

  const handleClickOutside = (event) => {
    if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
      setSuggestions([]);
    }
  };

  const handleEscapePress = (event) => {
    if (event.key === 'Escape') {
      setSuggestions([]);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapePress);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapePress);
    };
  }, []);

  const handleRemoveAddress = () => {
    setSelectedAddress(null);
    setQuery('');
    setSuggestions([]);
  };

  // MARK: Markup
  return (
    <>
      <div id="address_suggestion" ref={suggestionsRef}>
        <div className="addressinput">
          {selectedAddress && (
            <div className="selected_address">
              {selectedAddress} <button onClick={handleRemoveAddress}>X</button>
            </div>
          )}
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            placeholder={translate('signup_streetnamecity', language)}
            autoComplete="off"
            className={error ? 'error' : ''}
          />
        </div>

        {suggestions.length > 0 && (
          <ul>
            {suggestions.map((suggestion, index) => (
              <li key={index} onClick={() => handleSelect(suggestion)}>
                {formatSuggestion(suggestion)}
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
});

export default AddressAutoComplete;
