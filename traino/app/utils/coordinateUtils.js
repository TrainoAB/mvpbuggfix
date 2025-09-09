/**
 * Utility functions for handling geographic coordinates
 */

/**
 * Standardizes coordinate precision to 8 decimal places
 * This provides accuracy to about 1.1 mm, which is more than sufficient for GPS coordinates
 * @param {number|string} coord - The coordinate value to standardize
 * @returns {number} - Standardized coordinate with 8 decimal places, or 0 if invalid
 */
export const standardizeCoordinate = (coord) => {
  if (coord === null || coord === undefined || coord === '') return 0;
  const num = parseFloat(coord);
  return isNaN(num) ? 0 : parseFloat(num.toFixed(8));
};

/**
 * Validates if a coordinate is within valid ranges
 * @param {number} lat - Latitude value
 * @param {number} lng - Longitude value
 * @returns {boolean} - True if coordinates are valid
 */
export const validateCoordinates = (lat, lng) => {
  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);

  return (
    !isNaN(latitude) && !isNaN(longitude) && latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180
  );
};

/**
 * Formats coordinates for display
 * @param {number} coord - The coordinate to format
 * @param {number} precision - Number of decimal places (default: 6)
 * @returns {string} - Formatted coordinate string
 */
export const formatCoordinate = (coord, precision = 6) => {
  const num = parseFloat(coord);
  return isNaN(num) ? '0.000000' : num.toFixed(precision);
};

/**
 * Standardizes a coordinate object
 * @param {Object} coordObj - Object containing latitude and longitude
 * @returns {Object} - Object with standardized coordinates
 */
export const standardizeCoordinateObject = (coordObj) => {
  return {
    ...coordObj,
    latitude: standardizeCoordinate(coordObj.latitude),
    longitude: standardizeCoordinate(coordObj.longitude),
  };
};
