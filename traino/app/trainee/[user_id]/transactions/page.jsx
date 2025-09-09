'use client';
import { useEffect, useRef, useState } from 'react';
import { useAppState } from '@/app/hooks/useAppState';
import { useRouter } from 'next/navigation';
import { formatDateToWord, capitalizeFirstLetter, formatDateToYear, getCategoryName } from '@/app/functions/functions';
import { playSound } from '@/app/components/PlaySound';
import Navigation from '@/app/components/Menus/Navigation';
import TransactionsModal from './TransactionsModal';
import Loader from '@/app/components/Loader';
import './page.css';

export default function Transactions({ params }) {
  const { DEBUG, baseUrl, isLoggedin, userData, useTranslations, language, sessionObject, traincategories } =
    useAppState();
  const [transactionsModal, setTransactionsModal] = useState(false);
  const transactionsId = useRef(null);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageLimit = 25; // Set number of transactions per page

  const [groupedTransactions, setGroupedTransactions] = useState([]);
  const [reservedTransactions, setReservedTransactions] = useState([]);

  const { translate } = useTranslations('transactions', language);

  if (!isLoggedin.current) {
    router.push(`/login`);
    return;
  }

  useEffect(() => {
    if (params.user_id !== userData.current.id) {
      router.push(`/login`);
      return;
    }

    const fetchTransactions = async (page) => {
      setLoading(true);
      try {
        const response = await fetch(`${baseUrl}/api/proxy`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${sessionObject.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: `${baseUrl}/api/transactions?traineeid=${userData.current.id}&limit=${pageLimit}&page=${currentPage}`,
            method: 'GET',
          }),
        });
        const data = await response.json();
        DEBUG && console.log('Fetched Transactions:', data);

        setTransactions(data.data || []);
        setTotalPages(data.pagination.total_pages || 1);

        const grouped = groupTransactionsByMonth(data.data);
        DEBUG && console.log('Grouped: ', grouped);
        setGroupedTransactions(grouped);

        const reserved = groupReservedTransactionsByMonth(data.data);
        DEBUG && console.log('Reserved: ', reserved);
        setReservedTransactions(reserved);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, [userData.current.id, currentPage]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Function to group transactions by month
  const groupTransactionsByMonth = (transactions) => {
    const newGroupedTransactions = {};
    transactions
      .filter((transaction) => transaction.transaction_status === 'completed') // Only include completed transactions
      .forEach((transaction) => {
        const year = formatDateToYear(transaction.transaction_date);
        const month = translate(formatDateToWord(transaction.transaction_date), language);
        const monthYear = `${month} ${year}`;
        if (!newGroupedTransactions[monthYear]) {
          newGroupedTransactions[monthYear] = [];
        }
        newGroupedTransactions[monthYear].push(transaction);
      });
    return newGroupedTransactions;
  };

  const groupReservedTransactionsByMonth = (transactions) => {
    return transactions.filter((transaction) => transaction.transaction_status !== 'completed');
  };

  // Function to determine the icon class based on item.type
  const getIconClass = (type) => {
    switch (type) {
      case 'trainingpass':
        return 'icon-train';
      case 'clipcard':
        return 'icon-clipcard';
      case 'dietprogram':
        return 'icon-dietprogram';
      case 'trainprogram':
        return 'icon-trainprogram';
      case 'onlinetraining':
        return 'icon-onlinetraining';
      default:
        return 'icon-default'; // Define a default icon class if needed
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleClick = (id) => {
    DEBUG && console.log('click');
    DEBUG && console.log('transactionsModal:', transactionsModal);
    DEBUG && console.log('Clicked ID:', id);
    transactionsId.current = id;
    setTransactionsModal(true);
  };

  return (
    <>
      <Navigation />
      {transactionsModal && transactionsId.current && (
        <TransactionsModal transactionsId={transactionsId.current} onClose={setTransactionsModal} />
      )}
      <main id="transactions">
        <div className="categorytop">
          <div className="btn-back" onClick={handleBack}></div>
          <h1>{translate('paymenthistory', language)}</h1>
          <div></div>
        </div>
        {loading ? (
          <div className="content" style={{ height: '100%', alignItems: 'center', justifyContent: 'center' }}>
            <Loader />
          </div>
        ) : (
          <>
            <div className="scrollcontent">
              <div className="content">
                {reservedTransactions && reservedTransactions.length > 0 && (
                  <div className="reserved">
                    <h4>{translate('title_reserved', language)}</h4>
                    {reservedTransactions &&
                      reservedTransactions.length > 0 &&
                      reservedTransactions.map((item, index) => (
                        <div key={`transaction_item_${index}`} className="transaction-item">
                          <div className={getIconClass(item.product.product_type)}></div>
                          <div className="info">
                            <div className="name">
                              {getCategoryName(item.product.product_sport, traincategories) +
                                (item.product.product_duration ? `, ${item.product.product_duration} min` : '')}
                            </div>
                            <span>
                              {item.trainer.firstname + ' ' + item.trainer.lastname}, {item.booked_date}
                            </span>
                          </div>
                          <div className="date">
                            <div className="price">{item.transaction_price} kr</div>
                            <span>
                              {capitalizeFirstLetter(translate(formatDateToWord(item.transaction_date), language))}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                )}

                <div className="transactions">
                  {groupedTransactions &&
                    (!Array.isArray(groupedTransactions) || groupedTransactions.some(() => true)) &&
                    Object.keys(groupedTransactions).map((monthYear, index) => (
                      <div key={`transaction_month_${index}`} className="transaction-month">
                        <h4>{capitalizeFirstLetter(monthYear)}</h4>
                        {groupedTransactions[monthYear].map((item, index) => (
                          <div key={`grouped_transactions_${index}`} className="transaction-item">
                            <div className={getIconClass(item.product.product_type)}></div>
                            <div className="info">
                              <div className="name">
                                {getCategoryName(item.product.product_sport, traincategories) +
                                  (item.product.product_duration ? `, ${item.product.product_duration} min` : '')}
                              </div>
                              <span>{item.trainer.firstname + ' ' + item.trainer.lastname}</span>
                            </div>
                            <div className="date">
                              <div className="price">{item.transaction_price} kr</div>
                              <span>
                                {capitalizeFirstLetter(translate(formatDateToWord(item.transaction_date), language))}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                </div>
              </div>
            </div>
            {/* Pagination Controls */}
            <div className="pagination">
              {currentPage > 1 && (
                <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
                  {translate('prev', language)}
                </button>
              )}
              <span>
                {currentPage} / {totalPages}
              </span>
              {currentPage < totalPages && (
                <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
                  {translate('next', language)}
                </button>
              )}
            </div>
          </>
        )}
      </main>
    </>
  );
}
