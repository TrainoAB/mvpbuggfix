// app/components/ClientActivity/ActivityLogsComponent.jsx
'use client';
import { useState } from 'react';
import { activityLogsMockData } from '../mocks/mockdata-activity-logs.js';
import { HändelserContent } from './HändelserContent.jsx';
import { UtmaningarContent } from './UtmaningarContent.jsx';
import { AnteckningarContent } from './AnteckningarContent.jsx';
import { DokumentContent } from './DokumentContent.jsx';
import './ActivityLogs.css';

// Activity logs component displaying history, notes, and documents tabs
export default function ActivityLogs() {
  const [activeTab, setActiveTab] = useState('händelser');

  return (
    <div id="tabs-section">
      <div className="tabs">
        <button onClick={() => setActiveTab('händelser')} className={activeTab === 'händelser' ? 'active' : ''}>
          Events
        </button>
        <button onClick={() => setActiveTab('utmaningar')} className={activeTab === 'utmaningar' ? 'active' : ''}>
          Challenges
        </button>
        <button onClick={() => setActiveTab('anteckningar')} className={activeTab === 'anteckningar' ? 'active' : ''}>
          Notes
        </button>
        <button onClick={() => setActiveTab('dokument')} className={activeTab === 'dokument' ? 'active' : ''}>
          Documents
        </button>
      </div>
      <hr className="horisontal-line" />
      <div className="tab-content">
        {activeTab === 'händelser' && <HändelserContent data={activityLogsMockData.händelser} />}
        {activeTab === 'utmaningar' && <UtmaningarContent />}
        {activeTab === 'anteckningar' && <AnteckningarContent />}
        {activeTab === 'dokument' && <DokumentContent data={activityLogsMockData.dokument} />}
      </div>
    </div>
  );
}
