import ModalAddChallenge from './ModalAddChallenge';
import DisplayChallenge from './DisplayChallenge';
import ModalSendMotivation from './ModalSendMotivation';
import { useState, useEffect } from 'react';
import './UtmaningarContent.css';

export const UtmaningarContent = () => {
  //***********************************      States      ****************************************** */
  const [isAddChallengeModalOpen, setIsAddChallengeModalOpen] = useState(false);
  const [isSendMotivationModalOpen, setIsSendMotivationModalOpen] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [challenges, setChallenges] = useState(() => {
    const savedChallenges = sessionStorage.getItem('challenges');
    return savedChallenges ? JSON.parse(savedChallenges) : [];
  });
  const [ongoingChallenges, setOngoingChallenges] = useState([]);
  const [expiredChallenges, setExpiredChallenges] = useState([]);
  const [title, setTitle] = useState('');
  const [placeholderText, setPlaceholderText] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  //***********************************Handle Challenges****************************************** */

  const handleSaveChallenge = (challenge) => {
    const newChallengeObject = {
      id: Date.now(),
      date: new Date().toLocaleDateString(),
      title: challenge.title, // ny titel från modalen
      text: challenge.text,   // anteckning från modalen
      endDate: challenge.endDate, // slutdatum från modalen
    };
    const updatedChallenges = challenges
      ? [...challenges, newChallengeObject]
      : [newChallengeObject];
    setChallenges(updatedChallenges);
    sessionStorage.setItem('challenges', JSON.stringify(updatedChallenges));
  };

  const handleDeleteChallenge = (id) => {
    //filtrera ut de anteckningar som inte stämmer överens med id:t
    const updatedChallenges = challenges.filter(challenge => challenge.id !== id);
    setChallenges(updatedChallenges);
    sessionStorage.setItem('challenges', JSON.stringify(updatedChallenges));
  };

  // Uppdatera ongoingChallenges och expiredChallenges när challenges ändras
  useEffect(() => {
    const ongoing = challenges.filter(c => new Date(c.endDate) > new Date());
    const expired = challenges.filter(c => new Date(c.endDate) < new Date());
    setOngoingChallenges(ongoing);
    setExpiredChallenges(expired);
  }, [challenges]);

  //***********************************Handle Motivation****************************************** */

  // Funktion för att hantera visningen av modalen för att skicka motivering
  // När en utmaning väljs, sätts den valda utmaningen i state och modalen öppnas
  const handleSendMotivation = (challenge) => {
    // Kolla utmaningen är pågående eller ej
    if (ongoingChallenges.find(c => c.id === challenge.id)) {
      setTitle("Send Motivation");
      setSuggestions([
        "Great job! Keep it up!", "You're on the right track, don't give up!", "Fantastic work, keep up the motivation!"
      ]);
      setPlaceholderText('Skriv en peppande kommentar till din kund...');
      setSelectedChallenge(challenge); // Sätt den valda utmaningen i state
      setIsSendMotivationModalOpen(true); // Öppna modalen för att skicka motivering
    }
    if (expiredChallenges.find(c => c.id === challenge.id)) {
      setTitle('Send Feedback');
      setPlaceholderText('Skriv en feedback till din kund...');
      setSuggestions([
        "Really great that you persevered and completed the whole challenge!", "Strong effort to complete everything, even when it was challenging at times.", "Great job pushing through all the way – so inspiring!"
      ]);
      setSelectedChallenge(challenge); // Sätt den valda utmaningen i state
      setIsSendMotivationModalOpen(true); // Öppna modalen för att skicka motivering
    }
  };

  //*****************************************RETURN*********************************************** */
  return (
    <div id="challenges-wrapper">
      <div className="show-add-challange-modal-icon" onClick={() => setIsAddChallengeModalOpen(true)}>
        +
      </div>
      {isAddChallengeModalOpen && <ModalAddChallenge
        setIsOpen={setIsAddChallengeModalOpen}
        onSave={handleSaveChallenge}
        />}
      <header className="header">Ongoing Challenges</header>
      {!ongoingChallenges.length && <div className="no-challenges">No ongoing challenges available at the moment...</div>
      }
      {ongoingChallenges.map(challenge => (
        <DisplayChallenge
        key={challenge.id}
        challenge={challenge}
        handleDeleteChallenge={handleDeleteChallenge}
        handleSendMotivation={handleSendMotivation}
        />
      ))}
      <hr className="horizontal-line"/>
      <header className="header">Previous Challenges</header>
      {expiredChallenges.map(challenge => (
        <DisplayChallenge
        key={challenge.id}
        challenge={challenge}
        handleDeleteChallenge={handleDeleteChallenge}
        handleSendMotivation={handleSendMotivation}
        />
      ))}
      {isSendMotivationModalOpen && <ModalSendMotivation
        setIsOpen={setIsSendMotivationModalOpen}
        challenge={selectedChallenge}
        title={title}
        placeholderText={placeholderText}
        suggestions={suggestions}
      />}
    </div>
  );
};