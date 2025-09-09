import DisplayChallenge from './DisplayChallenge';
import Navigation from '@/app/components/Menus/Navigation';
import { challenges } from '../mocks/mockdata-my-trainers';
import { useState, useEffect } from 'react';
import './ChallengesContent.css';
import ApiQuotes from './ApiQuotes';

export default function ChallengesContent() {
  const [quotes, setQuotes] = useState([]);

  const ongoingChallenges = challenges && challenges.filter((c) => new Date(c.endDate) > new Date());
  const expiredChallenges = challenges && challenges.filter((c) => new Date(c.endDate) < new Date());

  //*****************************************RETURN*********************************************** */
  return (
    <div id="challenges-wrapper">
      <ApiQuotes />
      <hr className="horizontal-line" />
      <header className="header-challanges">Ongoing Challenges</header>
      {ongoingChallenges &&
        ongoingChallenges.map((challenge) => <DisplayChallenge key={challenge.id} challenge={challenge} />)}
      <header className="header-challanges">Previous Challenges</header>
      {expiredChallenges &&
        expiredChallenges.map((challenge) => <DisplayChallenge key={challenge.id} challenge={challenge} />)}
      <Navigation />
    </div>
  );
}
