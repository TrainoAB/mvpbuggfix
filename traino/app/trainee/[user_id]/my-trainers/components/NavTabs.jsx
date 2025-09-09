// app/components/ClientActivity/ActivityLogsComponent.jsx
'use client'
import { useState } from 'react';
import { activityLogsMockData } from '../mocks/mockdata-my-trainers';
import EventsContent from './EventsContent';
import ChallengesContent from './ChallengesContent';
import './NavTabs.css';

export default function NavTabs() {
  const [activeTab, setActiveTab] = useState('händelser');

  return (
    <div id="nav-tabs-section">
      <div className="nav-tabs">
        <button onClick={() => setActiveTab('händelser')} className={activeTab === 'händelser' ? 'active' : ''}>Events</button>
        <button onClick={() => setActiveTab('utmaningar')} className={activeTab ==='utmaningar' ? 'active' : ""}>Challenges</button>
      </div>
      <hr className="horisontal-line"/>
      <div className="tab-content">
        {activeTab === 'händelser' && <EventsContent data={activityLogsMockData.händelser} />}
        {activeTab === "utmaningar" && <ChallengesContent />} 
      </div>
    </div>
  );
};
