import Link from 'next/link';
import { mockDataMyTrainers } from './mocks/mockdata-my-trainers';
import HeaderMyTrainee from '@/app/trainer/[alias]/my-customers/components/HeaderMyTrainee';
import './page.css';
import Navigation from '@/app/components/Menus/Navigation';

export default function MyTrainers() {
  const activeTrainers = mockDataMyTrainers
    .filter((trainer) => trainer.isActiveCustomer)
    .map((filteredTrainer) => {
      return (
        <Link href={`./my-trainers/${filteredTrainer.id}`} key={filteredTrainer.id}>
          <div className="trainer">
            <div className="trainer__left">
              <div className="trainer__left--photo-container">
                <img src={filteredTrainer.photo} alt="profile photo of trainer" />
              </div>
              <h4>
                {filteredTrainer.firstname}
                &nbsp;
                {filteredTrainer.lastname}
              </h4>
            </div>
            <div className="trainer__right">&gt;</div>
          </div>
        </Link>
      );
    });

  const inactiveTrainers = mockDataMyTrainers
    .filter((trainer) => !trainer.isActiveCustomer)
    .map((filteredTrainer) => {
      return (
        <Link href={`./my-trainers/${filteredTrainer.id}`} key={filteredTrainer.id}>
          <div className="trainer">
            <div className="trainer__left">
              <div className="trainer__left--photo-container">
                <img src={filteredTrainer.photo} alt="profile photo of trainer" />
              </div>
              <h4>
                {filteredTrainer.firstname}
                &nbsp;
                {filteredTrainer.lastname}
              </h4>
            </div>
            <div className="trainer__right">&gt;</div>
          </div>
        </Link>
      );
    });

  return (
    <div id="my-trainers">
      <div className="page-wrapper">
        <HeaderMyTrainee title="My Trainers" />
        <div className="trainer-header">
          <h3 className="trainer-title">Active Trainers</h3>
          <p className="trainer-text">You have scheduled sessions with {activeTrainers.length} trainers</p>
          <hr />
          {activeTrainers}
        </div>

        <div className="trainer-header">
          <h3 className="trainer-title">Inactive Trainers</h3>
          <p className="trainer-text">You have previously trained with {inactiveTrainers.length} trainers</p>
          <hr />
          {inactiveTrainers}
        </div>
      </div>
      <Navigation />
    </div>
  );
}
