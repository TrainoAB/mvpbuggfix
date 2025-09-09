import { mockDataMyTrainers } from '../mocks/mockdata-my-trainers';
import HeaderMyTrainee from '@/app/trainer/[alias]/my-customers/components/HeaderMyTrainee';
import ShowTrainerInfo from '../components/ShowTrainerInfo';
import NavTabs from '../components/NavTabs';
import './page.css';
import Navigation from '@/app/components/Menus/Navigation';

export default function MyTrainer({ params }) {
  // Hämta tränare från mockdata
  const trainer = mockDataMyTrainers.find((trainer) => trainer.id === Number(params.myTrainerId));
  if (!trainer) {
    return <div>404 Trainer was not found</div>;
  }

  return (
    <div id="my-trainer">
      <HeaderMyTrainee title="Trainer" />
      <div className="page-wrapper">
        <ShowTrainerInfo
          className="trainer-info"
          photo={trainer.photo}
          firstname={trainer.firstname}
          lastname={trainer.lastname}
          age={trainer.age}
          gender={trainer.gender}
          sports={trainer.sports}
        />
      </div>
      <div className="nav-tab-wrapper">
        <NavTabs />
      </div>
      <Navigation />
    </div>
  );
}
