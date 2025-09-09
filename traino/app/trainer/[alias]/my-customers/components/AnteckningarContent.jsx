import ModalNoteAboutCustomer from './ModalNoteAboutCustomer';
import { useState, useEffect } from 'react';
import './AnteckningarContent.css';

export const AnteckningarContent = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notes, setNotes] = useState(() => {
    const savedNotes = sessionStorage.getItem('notes');
    return savedNotes ? JSON.parse(savedNotes) : null;
  });

  const handleSaveNote = (newNote) => {
    const newNoteObject = {
      id: Date.now(),
      date: new Date().toLocaleDateString(),
      note: newNote,
    };
    const updatedNotes = notes 
      ? [...notes, newNoteObject]
      : [newNoteObject];
    setNotes(updatedNotes);
    //ersätter det gamla värdet i notes med det nya
    sessionStorage.setItem('notes', JSON.stringify(updatedNotes));
  };

  const handleDeleteNote = (id) => {
    //filtrera ut de anteckningar som inte stämmer överens med id:t
    const updatedNotes = notes.filter(note => note.id !== id);
    setNotes(updatedNotes);
    sessionStorage.setItem('notes', JSON.stringify(updatedNotes));
  };

  return (
    <div id="notes-wrapper">
      <div className="modal-icon" onClick={() => setIsOpen(true)}>
        +
      </div>
      {isOpen && <ModalNoteAboutCustomer 
        setIsOpen={setIsOpen} 
        onSave={handleSaveNote} 
      />}
      {notes && notes.map((note) => (
        <div key={note.id} className="note-item">
          <div className="note-item__header">
            <div className="note-item__header--left">
              Anteckning
            </div>
            <div className="note-item__header--right">
              <div className="note-header">{note.date}
              <button className="delete-button" onClick={() => handleDeleteNote(note.id)}>✖</button>
              </div>
              
            </div>
          </div>
          <p className="note-item__text">{note.note}</p>
        </div>
      ))}
    </div>
  );
};