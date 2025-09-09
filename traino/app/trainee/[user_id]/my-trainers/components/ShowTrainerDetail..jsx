import React from 'react';
import './ShowTrainerDetail.css'; // Skapa en separat CSS-fil för denna komponent

export default function ShowTrainerDetail ({ value, defaultValue = "Not specified" }) {
    return (
        <span className={!value ? "unset-value" : ""}>
            {value || defaultValue}
        </span>
    );
};
