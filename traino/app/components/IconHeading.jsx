import React from 'react';
import './IconHeading.css';

export default function IconHeading({ text, iconUrl, size, color, border, padding, smallPadding, justify }) {
  return (
    <>
      <div className="icon-heading-container" style={{ padding: padding, justifyContent: justify }}>
        <img src={iconUrl} className="icon-heading icon" />

        <h4
          style={{
            color: color,
            fontSize: size,
            borderBottom: border,
            padding: smallPadding,
          }}
          className="icon-heading"
        >
          {text}
        </h4>
      </div>
    </>
  );
}
