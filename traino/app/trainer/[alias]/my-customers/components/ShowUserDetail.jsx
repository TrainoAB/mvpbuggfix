import React from 'react';
import './ShowUserDetail.css'; // Skapa en separat CSS-fil för denna komponent

const UserDetail = ({ value, defaultValue = "not provided" }) => {
    return (
        <span className={!value ? "unset-value" : ""}>
            {value || defaultValue}
        </span>
    );
};

export default UserDetail;