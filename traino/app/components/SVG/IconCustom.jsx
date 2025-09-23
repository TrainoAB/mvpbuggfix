import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export default function IconCustom({ icon, className = ''}) {
  return <FontAwesomeIcon icon={icon} className={className} />;
}