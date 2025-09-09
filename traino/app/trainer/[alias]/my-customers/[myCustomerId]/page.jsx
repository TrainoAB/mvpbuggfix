'use client';
import ShowTraineeInfo from '../components/ShowTraineeInfo';
import ActivityLogs from '../components/ActivityLogs';
import mockDataMyCustomers from '../mocks/mockdata-my-customers';
import HeaderMyTrainee from '../components/HeaderMyTrainee';
import './page.css';
import Navigation from '@/app/components/Menus/Navigation';

export default function MyTrainee({ params }) {
  // Hämta kund från mockdata
  const customer = mockDataMyCustomers.find((customer) => customer.id === Number(params.myCustomerId));
  if (!customer) {
    return <div>404 Customer not found</div>;
  }

  return (
    <div id="my-trainee">
      <HeaderMyTrainee title="Customer" />
      <div className="page-wrapper">
        <ShowTraineeInfo
          className="trainee-info"
          photo={customer.photo}
          firstname={customer.firstname}
          lastname={customer.lastname}
          age={customer.age}
          gender={customer.gender}
          sports={customer.sports}
        />
        <ActivityLogs />
      </div>
      <Navigation />
    </div>
  );
}
