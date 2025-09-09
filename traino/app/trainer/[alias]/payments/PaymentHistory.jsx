import Link from 'next/link';

export default function PaymentHistory({
  icon,
  product,
  customer_id,
  customer,
  payment,
  date,
}) {

  const formatNumberWithCommas = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  return (
    <>
      <div
        className="payment-history"
        style={{
          display: 'flex',
          gap: '1rem',
        }}
      >
        <div
          className={'icon ' + icon}
          style={{ aspectRatio: 1, width: '2.5rem' }}
        ></div>
        <div
          className="prod-cust"
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            justifyContent: 'center',
          }}
        >
          <p>{product}</p>
          <Link className="userlink" href={'/trainee/' + customer_id}>
            {customer}
          </Link>
        </div>
        <div
          className="pay-date"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            justifyContent: 'center',
          }}
        >
          <p>{formatNumberWithCommas(payment)}</p>
          <p>{date}</p>
        </div>
      </div>
    </>
  );
}
