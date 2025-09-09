import Link from 'next/link';
import mockDataMyCustomers from './mocks/mockdata-my-customers';
import HeaderMyTrainee from './components/HeaderMyTrainee';
import './page.css';
import Navigation from '@/app/components/Menus/Navigation';

export default function MyCustomers() {
  const activeCustomers = mockDataMyCustomers
    .filter((customer) => customer.isActiveCustomer)
    .map((filteredCustomer) => {
      return (
        <Link href={`./my-customers/${filteredCustomer.id}`}>
          <div className="trainee" key={filteredCustomer.id}>
            <div className="trainee__left">
              <div className="trainee__left--photo-container">
                <img src={filteredCustomer.photo} alt="profile photo of customer" />
              </div>
              <h4>
                {filteredCustomer.firstname}
                &nbsp;
                {filteredCustomer.lastname}
              </h4>
            </div>
            <div className="trainee__right">&gt;</div>
          </div>
        </Link>
      );
    });
  const inactiveCustomers = mockDataMyCustomers
    .filter((customer) => !customer.isActiveCustomer)
    .map((filteredCustomer) => {
      return (
        <Link href={`./my-customers/${filteredCustomer.id}`} key={filteredCustomer.id}>
          <div className="trainee">
            <div className="trainee__left">
              <div className="trainee__left--photo-container">
                <img src={filteredCustomer.photo} alt="profile photo of customer" />
              </div>
              <h4>
                {filteredCustomer.firstname}
                &nbsp;
                {filteredCustomer.lastname}
              </h4>
            </div>

            <div className="trainee__right">&gt;</div>
          </div>
        </Link>
      );
    });

  return (
    <div id="my-customers">
      <div className="page-wrapper">
        <HeaderMyTrainee title="My customers" />
        <div className="customer-header">
          <h3 className="customer-title">Active customers</h3>
          <p className="customer-text">{activeCustomers.length} people have training sessions booked with you</p>
          <hr />
          {activeCustomers}
        </div>
        <div className="customer-header">
          <h3 className="customer-title">Inactive customers</h3>
          <p className="customer-text">{inactiveCustomers.length} people have previously trained with you</p>
          <hr />
          {inactiveCustomers}
        </div>
      </div>
      <Navigation />
    </div>
  );
}
