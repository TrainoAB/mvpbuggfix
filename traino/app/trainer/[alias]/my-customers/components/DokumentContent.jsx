import React, { useState, useEffect } from 'react';
import './DokumentContent.css';

export const DokumentContent = ({ data }) => {
  const [isMeatballMenuVisible, setIsMeatballMenuVisible] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);

  useEffect(() => {
    console.log('Component rendered');
  }, []);

  const handleFileClick = () => {
    document.getElementById('fileInput').click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    console.log('Selected file:', file);
  };

  const handleMeatballMenuClick = (documentId) => {
    // Om selectedDocument inte är samma som det klickade dokumentet (vilket det inte kommer att vara om menyn inte är öppen eftersom selectedDocument inte ännu fått något värde)
    if (selectedDocument !== documentId) {
      // Tilldela selectedDocument värdet från det klickade dokumentets ID
      setSelectedDocument(documentId);
      // Visa menyn
      setIsMeatballMenuVisible(true);
    } else {
      // Om selectedDocument är samma som det klickade dokumentet, växla menyns synlighet
      setIsMeatballMenuVisible(previousState => !previousState);
      // så ovanstående kod stänger bara menyn. LÄGG TILL KOD FÖR ATT GÖRA NÅGOT MED MENYVALET
    }
  };

  const handleCloseMeatballMenu = () => {
    if (isMeatballMenuVisible) {
      setIsMeatballMenuVisible(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      // Kontrollera om klicket är utanför menyn
      if (!event.target.closest('.document-menu-container') && !event.target.closest('.document-item__right')) {
        handleCloseMeatballMenu();
      }
    };

    // Lägg till eventlistener för klick på dokumentet
    document.addEventListener('click', handleClickOutside);

    // Ta bort eventlistener när komponenten avmonteras
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isMeatballMenuVisible]);

  useEffect(() => {
    console.log('isMeatballMenuVisible:', isMeatballMenuVisible);
    console.log('selectedDocument:', selectedDocument);
  }, [isMeatballMenuVisible, selectedDocument]);

  return (
    <div id="trainer-documents">
      <div className="file-upload-icon" onClick={handleFileClick}></div>
      <input
        type="file"
        id="fileInput"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      {data.map((doc) => (
        <div 
          key={doc.id} 
          className={`document-item ${doc.isOngoing ? 'ongoing' : 'completed'}`}
        >
          <div className="document-item__left"></div>
          <div className="document-item__middle">
            <div className="document-item__middle--title">{doc.name}</div>
            <div className="document-item__middle--date">{doc.date}</div>
          </div>
          <div 
            className="document-item__right" 
            onClick={() => handleMeatballMenuClick(doc.id)} 
          >
            {isMeatballMenuVisible && selectedDocument === doc.id && (
              <div className="document-menu-container">
                <div className="document-menu__item">
                  <div className="document-menu__item--icon icon-edit"/>
                  <div>
                    Edit name
                  </div>
                </div>

                <div className="document-menu__item">
                  <div className="document-menu__item--icon icon-ladda-ner"/>
                  <div>
                    Download
                  </div>
                </div>

                <div className="document-menu__item">
                  <div className="document-menu__item--icon icon-delete"/>
                  <div className='document-menu__item--text-delete'>
                    Delete
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className={`document-label ${doc.isOngoing ? 'ongoing-label' : 'completed-label'}`}>
            {doc.isOngoing ? 'Requieres Action' : 'Completed'}
          </div>
        </div>
      ))}
    </div>
  );
};