'use client';
import React from 'react';
import './AdminSearchInputs.css';

export default function AdminSearchInputs({
  setPostVal,
  postVal,
  error,
  setError,
}) {
  const onInputChange = (e) => {
    e.preventDefault();
    let max = 100000000000000;
    let min = 1;
    if (!isNaN(+e.target.value)) {
      setPostVal(e.target.value);
      e.target.value === ''
        ? setError('')
        : e.target.value < min
        ? setTimeout(() => {
            setError('');
          }, 3000) && setError(`Id:t är för litet! Min är ${min}`)
        : e.target.value > max
        ? setTimeout(() => {
            setError('');
          }, 3000) && setError(`Id:t är för stort! Max är ${max}`)
        : null;
    } else {
      setPostVal(e.target.value);
    }
  };

  return (
    <>
      <input
        type="search"
        id="userId"
        placeholder="Sök id/användare"
        className="search"
        /* value={postVal}
        onChange={(e) => onInputChange(e)} */
      />
      <div className="input-error">{error}</div>
    </>
  );
}
