import React from 'react';
import PillButton from './PillButton';
import './InfoCard.css';

const InfoCard = (props) => {
  return (
    <div id="info-card">
      <h2 className="info-card-header">Om TRAINO Points</h2>
      <hr className="info-card-hr" />
      <h4 className="info-card-sub-header">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.
      </h4>
      <p className="info-card-paragraph">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore
        magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo
        consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
        pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est
        laborum.
      </p>
      <p className="info-card-paragraph">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore
        magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut.
      </p>
      <PillButton text="&nbsp;&nbsp;Tack för info&nbsp;&nbsp;" onClick={props.onClick} />
    </div>
  );
};

export default InfoCard;
