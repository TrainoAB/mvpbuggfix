import { useEffect, useState } from 'react';
import { playSound } from '@/app/components/PlaySound';
import Image from 'next/image';
import { useAppState } from '@/app/hooks/useAppState';

import './List.css';

export default function List({ filteredMarkers, handleListClick, showList, handleMapClick }) {
  const { DEBUG, useTranslations, language } = useAppState();
  const [sortedMarkers, setSortedMarkers] = useState(filteredMarkers);
  const [sortType, setSortType] = useState('name'); // Default sort type

  const [activeIndex, setActiveIndex] = useState(null);
  const { translate } = useTranslations('train', language);

  const buttons = [
    { label: `${translate('name', language)}`, sortType: 'name' },
    { label: `${translate('distance', language)}`, sortType: 'distance' },
    { label: `${translate('price', language)}`, sortType: 'price' },
  ];

  const handleSort = (sortType, index) => {
    if (index === activeIndex) return;
    setSortType(sortType);
    setActiveIndex(index);
  };

  const sortName = () => {
    const sorted = [...filteredMarkers].sort((a, b) => {
      // Handle cases where firstname or lastname is null
      const nameA = (a.firstname || '').toLowerCase() + ' ' + (a.lastname || '').toLowerCase();
      const nameB = (b.firstname || '').toLowerCase() + ' ' + (b.lastname || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });
    setSortedMarkers(sorted);
  };

  const sortDistance = () => {
    const sorted = [...filteredMarkers].sort((a, b) => a.distance - b.distance);
    setSortedMarkers(sorted);
  };

  const sortPrice = () => {
    const sorted = [...filteredMarkers].sort((a, b) => a.price - b.price);
    setSortedMarkers(sorted);
  };

  // Start set sort and button
  useEffect(() => {
    if (sortType === 'name') {
      sortName();
      setActiveIndex(0);
    } else if (sortType === 'distance') {
      sortDistance();
      setActiveIndex(1);
    } else if (sortType === 'price') {
      sortPrice();
      setActiveIndex(2);
    }
  }, []);

  // Sort if filteredMarkers updates
  useEffect(() => {
    if (sortType === 'name') {
      sortName();
      setActiveIndex(0);
    } else if (sortType === 'distance') {
      sortDistance();
      setActiveIndex(1);
    } else if (sortType === 'price') {
      sortPrice();
      setActiveIndex(2);
    }
  }, [filteredMarkers]);

  // Sort when changing sortType
  useEffect(() => {
    console.log('Sorting by:', sortType);
    if (sortType === 'name') {
      sortName();
    } else if (sortType === 'distance') {
      sortDistance();
    } else if (sortType === 'price') {
      sortPrice();
    }
  }, [sortType]);

  const handleListOver = (e) => {
    playSound('tickclick', '0.5');
    const id = e.target.id.split('-')[1];
    const marker = document.querySelector('.markerid-' + id);
    if (marker) {
      marker.classList.add('activemarker');
    }
    const parent = document.getElementById('listid-' + id);
    parent.classList.add('liston');
  };

  const handleListOut = (e) => {
    const id = e.target.id.split('-')[1];
    const marker = document.querySelector('.markerid-' + id);
    if (marker) {
      marker.classList.remove('activemarker');
    }
    const parent = document.getElementById('listid-' + id);
    parent.classList.remove('liston');
  };

  const handleListClickOld = (e, item) => {
    alert(
      `Marker Details:\nLatitude: ${item.lat}\nLongitude: ${item.lng}\nProduct: ${item.product}\nPrice: ${item.price}\nDuration: ${item.duration}\nGender: ${item.gender}`,
    );
  };

  // MARK: Markup
  return (
    <div className="listview">
      <div className="listfilter">
        {buttons.map((btn, index) => (
          <button
            key={btn.sortType}
            className={activeIndex === index ? 'active' : ''}
            onClick={() => handleSort(btn.sortType, index)}
            onMouseOver={() => playSound('tickclick', '0.5')}
          >
            {btn.label}
          </button>
        ))}
      </div>
      <div onClick={handleMapClick} className="scrollinside">
        {sortedMarkers.map((item, index) => (
          <div
            className="listitem"
            id={`listid-${item.id}`}
            key={item.id}
            onClick={(e) => handleListClick(e, item)}
            onMouseOver={(e) => handleListOver(e)}
            onMouseOut={(e) => handleListOut(e)}
          >
            <div className="thumbnail">
              <img
                src={
                  item.thumbnail === 1
                    ? `https://traino.s3.eu-north-1.amazonaws.com/${item.user_id}/profile/profile-image.webp`
                    : '/assets/icon-profile.svg'
                }
                alt=""
                style={{ objectFit: 'cover' }}
              />
            </div>
            <div className="listinfo">
              <span className="listalias">@{item.alias.toLowerCase()}</span>
              <div>{item.firstname + ' ' + item.lastname}</div>
            </div>
            <span className="listprice">{item.price} kr</span>
          </div>
        ))}
      </div>
    </div>
  );
}
