'use client';
import React from 'react';
import { useEffect, useRef, useState } from 'react';
import { useAppState } from '@/app/hooks/useAppState';

import './page.css';

export default function LocationInput({ mapCtx }) {
  const { DEBUG, useTranslations, language } = useAppState();
  const { translate } = useTranslations('global', language);

  DEBUG && console.log('Rendering LocationInput component', mapCtx);

  const [searchQuery, setSearchQuery] = useState('');
  const [streetSuggestions, setStreetSuggestions] = useState([]);
  const [searchResult, setSearchResult] = useState(null);

  const debounceTimer = useRef(null);

  // Debounced version of handleInputChange
  const debouncedHandleInputChange = useRef((inputValue) => {
    fetchStreetSuggestions(inputValue);
  });

  const handleInputChange = (e) => {
    const inputValue = e.target.value;
    setSearchQuery(inputValue);

    // Clear previous typing timer
    clearTimeout(debounceTimer.current);

    // Start a new typing timer after 1 second
    debounceTimer.current = setTimeout(() => {
      debouncedHandleInputChange.current(inputValue);
    }, 1000);
  };

  // Function to fetch street name suggestions
  const fetchStreetSuggestions = (partialStreetName) => {
    // Construct the API request URL
    const apiUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(partialStreetName)}`;

    // Make the API request
    fetch(apiUrl)
      .then((response) => response.json())
      .then((data) => {
        // Extract street name suggestions from the response
        const suggestions = data.map((item) => item.display_name);
        // Update streetSuggestions state with the suggestions
        setStreetSuggestions(suggestions);
      })
      .catch((error) => {
        console.error('Error fetching data:', error);
      });
  };

  const handleSearch = async (index = 0) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${searchQuery}&format=json`);
      const data = await response.json();
      if (data.length > 0) {
        const result = data[index < data.length ? index : 0];
        setSearchResult({ latitude: result.lat, longitude: result.lon });
        DEBUG && console.log(result);
        // Determine zoom level based on location type and importance
        const zoomLevel = calculateZoomForPlace(result);
        DEBUG && console.log('Zoom level:', zoomLevel);

        // Center the map around the search result with the adjusted zoom level
        if (mapCtx.setCenter && mapCtx.setZoom && mapCtx.setMapInstance) {
          mapCtx.setCenter([result.lat, result.lon]);
          mapCtx.setZoom(zoomLevel);
          mapCtx.setMapInstance(result.lat, result.lon);
        } else {
          DEBUG && console.error('One or more map functions are not available in mapCtx');
        }
      } else {
        setSearchResult(null);
        DEBUG && console.log('No results found');
      }
      setStreetSuggestions([]);
    } catch (error) {
      console.error('Error searching:', error);
    }
  };

  // Function to calculate zoom level based on place_rank and importance
  const calculateZoomForPlace = (object) => {
    return object.place_rank > 13 ? 13 : object.place_rank; // + object.importance * object.importance;
  };

  //Init map context
  if (!mapCtx.setStreetSuggestions) {
    mapCtx.setStreetSuggestions = setStreetSuggestions;
  }

  return (
    <div className="searchmap">
      <div className="input-group">
        <span className="icon-search"></span>
        <input
          type="text"
          placeholder={translate('searchmap', language)}
          value={searchQuery}
          onChange={handleInputChange}
          onKeyDown={(e) => {
            if (e.keyCode === 13) {
              // Check if the Enter key is pressed
              handleSearch();
            }
          }}
        />
      </div>
      {/* Display street name suggestions */}
      <div className="suggestions">
        {streetSuggestions.map((suggestion, index) => (
          <div
            key={index}
            className="suggestion"
            onClick={() => {
              // Set searchQuery and execute handleSearch
              setSearchQuery(suggestion);
              handleSearch(index);
            }}
          >
            {suggestion}
          </div>
        ))}
      </div>
    </div>
  );
}
