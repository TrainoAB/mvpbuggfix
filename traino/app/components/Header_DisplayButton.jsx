import { useEffect, useState } from 'react';

import './Header_DisplayButton.css';

export const Header_DisplayButton = ({ links = ['test', 'test2'], value }) => {
  const [active, setActive] = useState(links[0]);

  useEffect(() => {
    active && value(active);
  }, [active]);

  return (
    <div className="hdb-wrap">
      {links.map((link) => (
        <p
          className={`hdb-button ${active === link ? 'hdb-active' : ''}`}
          key={link}
          onClick={() => setActive(link)}
        >
          {link}
        </p>
      ))}
    </div>
  );
};
