'use client';
import React, { use } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Header } from '../../../components/Header';
import { Header_DisplayButton } from '../../../components/Header_DisplayButton';
import {
  formatDateToWord,
  capitalizeFirstLetter,
  formatDateToYear,
  formatMoney,
  formatKnumber,
} from '@/app/functions/functions';
import './page.css';
import PaymentDiv from './PaymentDiv';
import Navigation from '@/app/components/Menus/Navigation';
import UpdateStripeID from '@/app/components/UpdateStripeID';
import { Slider_MinMax } from '../../../components/Inputs/Slider_MinMax';
import PaymentHistory from './PaymentHistory';
import { useRouter } from 'next/navigation';
import { useAppState } from '@/app/hooks/useAppState';
import Link from 'next/link';
import Loader from '@/app/components/Loader';
import { getStripeId, getStripeUrl, getStripeIdWithEmail, saveStripeId } from '@/app/functions/fetchDataFunctions.js';
import { playSound } from '@/app/components/PlaySound';

export default function Payments({ params }) {
  const appState = useAppState();
  const router = useRouter();

  // Safety check to prevent destructuring errors
  if (!appState) {
    return (
      <main id="payments">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
          <Loader />
        </div>
      </main>
    );
  }

  // Safely destructure with fallbacks to prevent errors during state initialization
  const {
    DEBUG = false,
    baseUrl = '',
    sessionObject = null,
    useTranslations = () => ({ translate: () => '' }),
    language = 'sv',
    isLoggedin = { current: false },
    userData = { current: null },
  } = appState || {};

  const [display, setDisplay] = useState('Min ekonomi');
  const [slider, setSlider] = useState({ min: 0, max: 100 });
  const [transactions, setTransactions] = useState([]);
  const [groupedTransactions, setGroupedTransactions] = useState([]);
  const [sum, setSum] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [loading, setLoading] = useState(true);
  const [gradientPercent, setGradientPercent] = useState(0);
  const [email, setEmail] = useState('');

  const [buttonLoading, setButtonLoading] = useState(false);

  // States for pagination
  const [transactionData, setTransactionData] = useState([]);
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [stripeId, setStripeId] = useState(null);
  const [stripeIdLoaded, setStripeIdLoaded] = useState(false);
  const [balance, setBalance] = useState(0);
  const [pending, setPending] = useState(0);
  const [dashboardLink, setDashboardLink] = useState(null);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [onboardingRequired, setOnboardingRequired] = useState(false);

  // Additional safety check for user authentication
  if (!isLoggedin || !userData || !userData.current) {
    return (
      <main id="payments">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
          <Loader />
        </div>
      </main>
    );
  }

  const { translate } = useTranslations('myeconomy', language);

  // Global error handler för att fånga oväntade fel
  useEffect(() => {
    const handleError = (event) => {
      console.error('Global error caught in payments:', event.error);
      if (event.error?.message?.includes('Cannot destructure')) {
        console.error('Destructuring error - likely API response is null:', event.error);
      }
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  useEffect(() => {
    if (!isLoggedin.current) {
      router.push('/login');
    }
  }, []);

  useEffect(() => {
    const fetchStripeId = async () => {
      // Kontrollera att alla nödvändiga värden finns
      if (isLoggedin?.current && userData?.current?.id && sessionObject?.token) {
        try {
          DEBUG && console.log('Fetching Stripe ID for user:', userData.current.id);
          const data = await getStripeId(userData.current.id);

          // Validera response innan setState
          if (data && typeof data === 'string' && data !== 'null') {
            DEBUG && console.log('Valid Stripe ID fetched:', data);
            setStripeId(data);

            DEBUG && console.log('Calling updateStripeAccount...');
            await updateStripeAccount(userData.current.id, 1);
          } else {
            DEBUG && console.log('No valid Stripe ID found:', data);
            setStripeId(null);
          }
        } catch (error) {
          DEBUG && console.log('Error fetching Stripe ID:', error.message);
          setStripeId(null); // Sätt explicit till null vid fel
        } finally {
          setStripeIdLoaded(true);
        }
      } else {
        DEBUG &&
          console.log('Missing required data for Stripe ID fetch:', {
            isLoggedin: isLoggedin?.current,
            userId: userData?.current?.id,
            token: !!sessionObject?.token,
          });
        setStripeIdLoaded(true);
      }
    };

    fetchStripeId();
  }, [isLoggedin?.current, userData?.current?.id, sessionObject?.token]);

  const updateStripeAccount = async (userId, status) => {
    DEBUG && console.log(`Updating stripe_account for user ID: ${userId} to ${status}`);
    try {
      const response = await fetch(`https://traino.nu/php/changeuserstripestatus.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trainer_id: userId,
          stripe_account: status,
        }),
      });

      const data = await response.json();
      DEBUG && console.log('Stripe account update response:', data);
    } catch (error) {
      DEBUG && console.log('Error updating stripe account:', error);
    }
  };

  // Handle Stripe redirect completion
  useEffect(() => {
    const fromRedirect = sessionStorage.getItem('from_stripe_redirect');

    if (fromRedirect) {
      DEBUG && console.log('User returned from Stripe redirect - payments-redirect should have handled ID setting');

      // Clear the session storage flag
      sessionStorage.removeItem('from_stripe_redirect');

      // Show a success message if they now have a Stripe ID
      if (stripeId) {
        DEBUG && console.log('Stripe ID confirmed after redirect:', stripeId);
        // Optionally show a success notification here
      } else {
        DEBUG && console.log('No Stripe ID found after redirect - user may need to try again');
      }
    }
  }, [stripeId]);

  const milestones = [
    { milestone: 1000, name: 'Starter Champion' },
    { milestone: 3000, name: 'Rising Star' },
    { milestone: 5000, name: 'Fitness Guru' },
    { milestone: 10000, name: 'Wellness Warrior' },
    { milestone: 20000, name: 'Health Hero' },
    { milestone: 30000, name: 'Vitality Virtuoso' },
    { milestone: 40000, name: 'Stamina Superstar' },
    { milestone: 50000, name: 'Endurance Expert' },
    { milestone: 75000, name: 'Power Player' },
    { milestone: 100000, name: 'Peak Performer' },
    { milestone: 150000, name: 'Supreme Specialist' },
    { milestone: 200000, name: 'Ultimate Trainer' },
    { milestone: 300000, name: 'Elite Coach' },
    { milestone: 400000, name: 'Transformation Titan' },
    { milestone: 500000, name: 'Health Heavyweight' },
    { milestone: 750000, name: 'Wellness Master' },
    { milestone: 1000000, name: 'Ultimate Legend' },
  ];

  // Setting current and next milestone
  let nextMilestone = milestones.find((item) => item.milestone > totalEarnings);
  let index = milestones.findIndex((item) => item.milestone > totalEarnings);
  let currentMilestone = milestones[0];
  if (totalEarnings < milestones[milestones.length - 1].milestone) {
    currentMilestone = milestones[index - 1];
  } else {
    currentMilestone = milestones[milestones.length - 1];
  }

  function calcTotalIncome(transactions) {
    let total = 0;

    // Check if transactions is an array before using forEach
    if (Array.isArray(transactions)) {
      transactions.forEach((transaction) => {
        // Check if transaction_price exists and is a number
        if (transaction.transaction_price && typeof transaction.transaction_price === 'number') {
          total += transaction.transaction_price;
        }
      });
    }

    return total;
  }

  useEffect(() => {
    if (!sessionObject || !sessionObject.token) {
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${baseUrl}/api/proxy`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${sessionObject.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: `${baseUrl}/api/transactions?trainerid=${userData.current.id}`,
            method: 'GET',
          }),
        });
        const data = await response.json();
        DEBUG && console.log('Data:', data);

        // Ensure data is an array, or set to empty array if not
        const transactionsArray = Array.isArray(data) ? data : [];

        setTransactionData(transactionsArray);
        setTotalIncome(calcTotalIncome(transactionsArray));
        setTransactions(transactionsArray);
        sortData(transactionsArray);
      } catch (error) {
        console.error('Error fetching payments / No payments found:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [sessionObject, sessionObject.token]);

  const sortData = async (data) => {
    DEBUG && console.log('Sort data: ', data);
    // Sort transactions by date and slice by nr shown per page
    if (data && data.length > 0) {
      data.sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date));
      const shownData = data.slice((page - 1) * itemsPerPage, (page - 1) * itemsPerPage + itemsPerPage);

      // Group transactions by month
      const groupedData = groupTransactionsByMonth(shownData);
      setGroupedTransactions(groupedData);
      DEBUG && console.log('Grouped Data:', groupedData);
    } else {
      DEBUG && console.log('No data to sort');
    }
  };

  useEffect(() => {
    sortData(transactionData);
  }, [page, itemsPerPage]);

  useEffect(() => {
    const totalMilestones = milestones.length;
    const activeMilestones = milestones.filter((item) => item.milestone <= totalEarnings).length;

    if (totalMilestones > 0) {
      const percentage = (activeMilestones / totalMilestones) * 100;
      DEBUG && console.log(`gradientPercentage: (${activeMilestones} / ${totalMilestones}) * 100 = ${percentage}`);

      if (activeMilestones === 1) {
        setGradientPercent(0);
      } else if (activeMilestones >= 10) {
        setGradientPercent(percentage - 1);
      } else {
        setGradientPercent(percentage - 4);
      }
    } else {
      setGradientPercent(0);
    }
  }, [milestones, totalEarnings]);

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

  const getProductType = (type) => {
    switch (type) {
      case 'trainingpass':
        return 'Träningspass';
      case 'clipcard':
        return 'Klippkort';
      case 'dietprogram':
        return 'Kostprogram';
      case 'trainprogram':
        return 'Träningsprogram';
      case 'onlinetraining':
        return 'Onlineträning';
      default:
        return ''; // Define a default icon class if needed
    }
  };

  const groupTransactionsByMonth = (transactions) => {
    const groupedTransactions = {};

    // Check if transactions is an array before using forEach
    if (Array.isArray(transactions)) {
      transactions.forEach((transaction) => {
        const monthYear = formatDateToYear(transaction.transaction_date);
        if (!groupedTransactions[monthYear]) {
          groupedTransactions[monthYear] = [];
        }
        groupedTransactions[monthYear].push(transaction);
      });
    }

    return groupedTransactions;
  };

  const handleBack = () => {
    router.back();
  };

  useEffect(() => {
    if (stripeId && sessionObject?.token) {
      const fetchStripeData = async () => {
        try {
          setLoading(true);

          // Kontrollera att stripeId är giltigt innan API-anrop
          if (!stripeId || stripeId === 'null' || stripeId === '') {
            console.warn('Invalid stripe ID, skipping Stripe data fetch');
            return;
          }

          // Kör alla fetchar samtidigt med bättre error handling
          const fetchPromises = [
            fetch('/api/stripe/getbalance', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${sessionObject.token}`,
              },
              body: JSON.stringify({ stripe_id: stripeId }),
            }).catch((err) => ({ error: true, message: 'Balance fetch failed', details: err })),

            fetch('/api/stripe/createdashboardlink', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${sessionObject.token}`,
              },
              body: JSON.stringify({ stripe_id: stripeId }),
            }).catch((err) => ({ error: true, message: 'Dashboard fetch failed', details: err })),

            fetch('/api/stripe/gettotalearnings', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${sessionObject.token}`,
              },
              body: JSON.stringify({ stripe_id: stripeId }),
            }).catch((err) => ({ error: true, message: 'Earnings fetch failed', details: err })),
          ];

          const [balanceResponse, dashboardResponse, earningsResponse] = await Promise.all(fetchPromises);

          // Kontrollera för fetch-fel
          if (balanceResponse.error) {
            console.error('Balance fetch error:', balanceResponse);
          } else {
            const balanceData = await balanceResponse.json().catch((err) => ({ error: true }));
            if (!balanceData.error && balanceData.balance) {
              setBalance(balanceData.balance.available?.[0]?.amount / 100 || 0);
              setPending(balanceData.balance.pending?.[0]?.amount / 100 || 0);
            }
          }

          if (dashboardResponse.error) {
            console.error('Dashboard fetch error:', dashboardResponse);
          } else {
            const dashboardData = await dashboardResponse.json().catch((err) => ({ error: true }));
            if (!dashboardData.error) {
              if (dashboardResponse.ok && dashboardData.dashboardUrl) {
                setDashboardLink(dashboardData.dashboardUrl);
                setOnboardingRequired(false);
              } else if (dashboardData.onboardingRequired) {
                setDashboardLink(null);
                setOnboardingRequired(true);
              }
            }
          }

          if (earningsResponse.error) {
            console.error('Earnings fetch error:', earningsResponse);
          } else {
            const earningsData = await earningsResponse.json().catch((err) => ({ error: true }));
            if (!earningsData.error && typeof earningsData.total === 'number') {
              setTotalEarnings(earningsData.total);
            }
          }

          DEBUG && console.log('Stripe Data fetch completed');
        } catch (error) {
          console.error('Error fetching Stripe data:', error);
        } finally {
          setLoading(false);
        }
      };

      // Lägg till en kort delay för att säkerställa att allt är redo
      const timer = setTimeout(fetchStripeData, 500);
      return () => clearTimeout(timer);
    }
  }, [stripeId, sessionObject?.token]);

  // MARK: Markup
  return (
    <>
      <Navigation />
      <main id="payments">
        <div className="categorytop">
          <div className="btn-back" onClick={handleBack}></div>
          <h1>{translate('myeconomy_title', language)}</h1>
          <div></div>
        </div>
        <div className="scrollcontent">
          <div className="economycontent">
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <Loader />
              </div>
            ) : (
              <>
                {/* Welcome message for new trainers */}
                {userData?.current?.usertype === 'trainer' && userData?.current?.stripe_id === null && (
                  <div
                    style={{
                      padding: '1.5rem',
                      backgroundColor: '#e8f5e8',
                      border: '1px solid #4caf50',
                      borderRadius: '8px',
                      marginBottom: '1.5rem',
                      textAlign: 'center',
                    }}
                  >
                    <h3 style={{ color: '#2e7d32', marginBottom: '0.5rem' }}>
                      {translate('myeconomy_welcome_title', language)}
                    </h3>
                    <p style={{ color: '#2e7d32', marginBottom: '1rem' }}>
                      {translate('myeconomy_welcome_message', language)}
                    </p>
                    <p style={{ color: '#2e7d32', fontSize: '0.9rem' }}>
                      {translate('myeconomy_welcome_info', language)}
                    </p>
                  </div>
                )}

                <>
                  <UpdateStripeID
                    mode={stripeId === null ? 'nostripe' : 'gotstripe'}
                    stripeId={stripeId}
                    onStripeUpdate={async (newStripeId) => {
                      DEBUG && console.log('Payments page: Stripe ID updated to:', newStripeId);
                      setStripeId(newStripeId);

                      // If user signed out (newStripeId is null), reset related states
                      if (newStripeId === null) {
                        setBalance(0);
                        setPending(0);
                        setTotalEarnings(0);
                        setDashboardLink(null);
                        setOnboardingRequired(false);
                        DEBUG && console.log('Reset Stripe-related states after sign out');

                        try {
                          if (userData?.current?.id) {
                            await updateStripeAccount(userData.current.id, 0); // sätt stripe_account till 0 i databasen
                            DEBUG && console.log('stripe_account set to 0 after sign out');
                          }
                        } catch (err) {
                          DEBUG && console.log('Error updating stripe_account on sign out:', err);
                        }
                      }
                    }}
                  />

                  {dashboardLink && stripeId && (
                    <div className="button" onClick={() => window.open(dashboardLink, '_blank')}>
                      {translate('myeconomy_stripe_dashboard', language)}
                    </div>
                  )}
                  {onboardingRequired && stripeId && (
                    <div
                      style={{
                        padding: '1.5rem',
                        backgroundColor: '#fff3cd',
                        border: '1px solid #ffeaa7',
                        borderRadius: '8px',
                        marginBottom: '1.5rem',
                        color: '#856404',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                        <span style={{ fontSize: '1.5rem', marginRight: '0.5rem' }}>⚠️</span>
                        <strong>{translate('myeconomy_onboarding_required', language)}</strong>
                      </div>
                      <div style={{ marginBottom: '1rem', lineHeight: '1.6' }}>
                        <p style={{ margin: '0 0 0.5rem 0' }}>För att slutföra din Stripe-inställning måste du:</p>
                        <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
                          <li>Verifiera din identitet</li>
                          <li>Bekräfta din e-postadress</li>
                          <li>Tillhandahålla bankuppgifter för utbetalningar</li>
                        </ul>
                        <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>
                          Du kan inte skapa produkter eller ta emot betalningar förrän detta är klart.
                        </p>
                      </div>
                      <div style={{ marginTop: '1rem' }}>
                        <Link href={dashboardLink} target="_blank">
                          <button className="button">{translate('myeconomy_stripe_setup_now', language)}</button>
                        </Link>
                      </div>
                    </div>
                  )}

                  {stripeId && (
                    <>
                      <PaymentDiv
                        icon={null}
                        title={translate('myeconomy_pending_balance', language)}
                        titleSize={0.875}
                        titleColor={'black'}
                        iconBG={'5432cd'}
                        amount={formatMoney(pending) + ' kr'}
                        amountSize={2}
                      />

                      <PaymentDiv
                        icon={null}
                        title={translate('myeconomy_total_earnings', language)}
                        titleSize={0.875}
                        titleColor={'black'}
                        iconBG={'#5432cd'}
                        amount={formatMoney(totalEarnings) + ' kr'}
                        amountSize={2}
                      />
                      {totalEarnings > 1000 && (
                        <PaymentDiv
                          icon={null}
                          title={translate('myeconomy_achievement_reached', language) + ' '}
                          titleSize={0.875}
                          titleColor={'black'}
                          iconBG={'#5432cd'}
                          amount={currentMilestone.name}
                          amountSize={1.5}
                        />
                      )}

                      {totalEarnings < 1000000 && (
                        <PaymentDiv
                          icon={null}
                          title={
                            formatMoney(nextMilestone.milestone - totalEarnings) +
                            ' ' +
                            translate('myeconomy_remaining_to_milestone', language) +
                            ' ' +
                            nextMilestone.name
                          }
                          titleSize={0.875}
                          titleColor={'black'}
                          iconBG={'#5432cd'}
                          amount={''}
                          amountSize={2}
                        />
                      )}
                      <div className="paymentHighlights">
                        <h2>{translate('myeconomy_milestones', language)}</h2>
                      </div>
                      <div
                        className="timeline-wrap"
                        style={{
                          '--gradient-percent': `${gradientPercent}%`,
                        }}
                      >
                        {milestones.map((item, index) => {
                          const isInactive = item.milestone > totalEarnings;
                          return (
                            <div className="timeline-item" key={index}>
                              <div className="timeline-marker">
                                {!isInactive ? (
                                  <svg
                                    width="40"
                                    height="40"
                                    viewBox="0 0 40 40"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="timeline-active"
                                  >
                                    <circle cx="20" cy="20" r="20" fill="#8468EA" />
                                    <path
                                      d="M12 20.1111L16.9231 25L28 14"
                                      stroke="white"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                ) : (
                                  <svg
                                    width="30"
                                    height="30"
                                    viewBox="0 0 30 30"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <circle cx="15" cy="15" r="15" fill="var(--secondary-light-grey)" />
                                  </svg>
                                )}
                              </div>
                              <div
                                className="timeline-content-wrap"
                                style={isInactive ? { opacity: 0.5, filter: 'saturate(0)' } : {}}
                              >
                                <div className="timeline-content">
                                  <div className="timeline-header">
                                    <h1 className="icon-title">{'Milestone -> ' + item.name}</h1>
                                  </div>
                                  <p className="icon-amount">{formatMoney(item.milestone)}</p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </>
              </>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
