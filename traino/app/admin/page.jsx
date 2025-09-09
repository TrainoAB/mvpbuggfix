'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formatMoney } from '@/app/functions/functions';
import { useAppState } from '@/app/hooks/useAppState';
import { getCompanyStats } from '@/app/functions/fetchDataFunctions.js';
import Loader from '@/app/components/Loader';

import Link from 'next/link';
import AdminNav from '@/app/admin/AdminNav';

import './page.css';

export default function Admin() {
  const { DEBUG, useTranslations, language, baseUrl, sessionObject, userData, isLoggedin } = useAppState();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState([]);
  const { translate } = useTranslations('profile', language);

  const router = useRouter();

  useEffect(() => {
    if (isLoggedin.current === false || !userData.current || userData.current.roll !== 'admin') {
      router.push(`${baseUrl}/login`);
    }
  }, []);

  useEffect(() => {
    DEBUG && console.log('Admin page session:', sessionObject.tokenVersion, sessionObject.token);

    const fetchStats = async () => {
      setLoading(true);

      try {
        const data = await getCompanyStats();
        DEBUG && console.log(data); // Optionally log data for debugging
        setStats(data);
      } catch (error) {
        console.error('Error fetching stats:', error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats(); // Fetch stats from the server
    // setTempStats(); // Set temporary stats for testing
  }, [sessionObject, sessionObject.token]);

  function setTempStats() {
    // Simulate fetching data from an API or database
    setStats({
      avg_rating: 4.6,
      transactions: {
        total_transactions: 1480,
        total_payment_in: 1250000,
        total_payment_out: 980000,
        total_traino_percent: 270000,
      },
      users: {
        total_users: 3200,
        total_males: 1800,
        total_females: 1400,
        total_trainers: 800,
        total_male_trainers: 500,
        total_female_trainers: 300,
        avg_age_trainers: 33.4,
        total_trainees: 2400,
        total_male_trainees: 1300,
        total_female_trainees: 1100,
        avg_age_trainees: 29.2,
        min_age: 18,
        max_age: 65,
        avg_age_total: 31.6,
      },
      product_trainingpass: {
        total: 890,
        min_price: 200,
        max_price: 1200,
        avg_price: 580.5,
      },
      product_onlinetraining: {
        total: 640,
        min_price: 150,
        max_price: 1000,
        avg_price: 450.75,
      },
      product_trainprogram: {
        total: 720,
        min_price: 100,
        max_price: 900,
        avg_price: 390,
      },
      product_dietprogram: {
        total: 500,
        min_price: 100,
        max_price: 850,
        avg_price: 340.25,
      },
      product_clipcard: {
        total: 410,
        min_price: 250,
        max_price: 1100,
        avg_price: 620,
      },
    });
    setLoading(false);
  }

  return (
    <main id="admin-page" className="adminstats">
      <AdminNav page="stats" />
      <div className="scrollcontainer">
        <div className="content">
          {loading ? (
            <Loader />
          ) : (
            <>
              {stats && stats.avg_rating && (
                <>
                  <div className="statsgrid">
                    <div className="block">
                      <div className="th">
                        {/* Total transactions */}
                        {translate('total_transactions', language)}
                      </div>
                      <div className="stats">{formatMoney(parseInt(stats.transactions.total_transactions))}</div>
                    </div>

                    <div className="block">
                      <div className="th">
                        {/* Total payment in */}
                        {translate('total_payment_in', language)}
                      </div>
                      <div className="stats">{formatMoney(parseInt(stats.transactions.total_payment_in)) + 'kr'}</div>
                    </div>

                    <div className="block">
                      <div className="th">
                        {/* Total payment out */}
                        {translate('total_payment_out', language)}
                      </div>
                      <div className="stats">{formatMoney(parseInt(stats.transactions.total_payment_out)) + 'kr'}</div>
                    </div>

                    <div className="block">
                      <div className="th">
                        {/* Total Traino % */}
                        {translate('total_traino_percent', language)}
                      </div>
                      <div className="stats">
                        {formatMoney(parseInt(stats.transactions.total_traino_percent)) + 'kr'}
                      </div>
                    </div>
                  </div>

                  <div className="statsgrid">
                    <div className="block">
                      <div className="th">
                        {/* Total users */}
                        {translate('total_users', language)}
                      </div>
                      <div className="stats">{formatMoney(parseInt(stats.users.total_users))}</div>
                    </div>
                    <div className="block">
                      <div className="th">
                        {/* Avg rating */}
                        {translate('avg_rating', language)}
                      </div>
                      <div className="stats">{parseInt(stats.avg_rating).toFixed(2)}</div>
                    </div>
                    <div className="block">
                      <div className="th">
                        {/* Total males */}
                        {translate('total_males', language)}
                      </div>
                      <div className="stats">{formatMoney(parseInt(stats.users.total_males))}</div>
                    </div>
                    <div className="block">
                      <div className="th">
                        {/* Total females */}
                        {translate('total_females', language)}
                      </div>
                      <div className="stats">{formatMoney(parseInt(stats.users.total_females))}</div>
                    </div>
                    <div className="block">
                      <div className="th">
                        {/* Total trainers */}
                        {translate('total_trainers', language)}
                      </div>
                      <div className="stats">{formatMoney(parseInt(stats.users.total_trainers))}</div>
                      <div className="block">
                        <div className="th">
                          {/* Total male trainers */}
                          {translate('total_male_trainers', language)}
                        </div>
                        <div className="stats">{formatMoney(parseInt(stats.users.total_male_trainers))}</div>
                      </div>
                      <div className="block">
                        <div className="th">
                          {/* Total female trainers */}
                          {translate('total_female_trainers', language)}
                        </div>
                        <div className="stats">{formatMoney(parseInt(stats.users.total_female_trainers))}</div>
                      </div>
                      <div className="block">
                        <div className="th">
                          {/* Avg age trainers */}
                          {translate('avg_age_trainers', language)}
                        </div>
                        <div className="stats">{parseInt(stats.users.avg_age_trainers).toFixed(2)}</div>
                      </div>
                    </div>
                    <div className="block">
                      <div className="th">
                        {/* Total trainees */}
                        {translate('total_trainees', language)}
                      </div>
                      <div className="stats">{formatMoney(parseInt(stats.users.total_trainees))}</div>
                      <div className="block">
                        <div className="th">
                          {/* Total male trainees */}
                          {translate('total_male_trainees', language)}
                        </div>
                        <div className="stats">{formatMoney(parseInt(stats.users.total_male_trainees))}</div>
                      </div>
                      <div className="block">
                        <div className="th">
                          {/* Total female trainees */}
                          {translate('total_female_trainees', language)}
                        </div>
                        <div className="stats">{formatMoney(parseInt(stats.users.total_female_trainees))}</div>
                      </div>
                      <div className="block">
                        <div className="th">
                          {/* Avg age trainees */}
                          {translate('avg_age_trainees', language)}
                        </div>
                        <div className="stats">{parseInt(stats.users.avg_age_trainees).toFixed(2)}</div>
                      </div>
                    </div>
                    <div className="block">
                      <div className="th">
                        {/* Low/High age */}
                        {translate('low_high_age', language)}
                      </div>
                      <div className="stats">{stats.users.min_age + ' / ' + stats.users.max_age}</div>
                    </div>
                    <div className="block">
                      <div className="th">
                        {/* Avg age total */}
                        {translate('avg_age_total', language)}
                      </div>
                      <div className="stats">{parseInt(stats.users.avg_age_total).toFixed(2)}</div>
                    </div>
                  </div>
                  <div className="statsgrid">
                    <div className="block">
                      <div className="th">
                        {/* Total trainingpass */}
                        {translate('total_trainingpass', language)}
                      </div>
                      <div className="stats">{formatMoney(parseInt(stats.product_trainingpass.total))}</div>
                      <div className="block">
                        <div className="th">
                          {/* Low/High price */}
                          {translate('low_high_price', language)}
                        </div>
                        <div className="stats">
                          {formatMoney(stats.product_trainingpass.min_price) +
                            ' / ' +
                            formatMoney(stats.product_trainingpass.max_price)}
                        </div>
                      </div>
                      <div className="block">
                        <div className="th">
                          {/* Avg price */}
                          {translate('avg_price', language)}
                        </div>
                        <div className="stats">
                          {formatMoney(parseInt(stats.product_trainingpass.avg_price).toFixed(2))} /tim
                        </div>
                      </div>
                    </div>

                    <div className="block">
                      <div className="th">
                        {/* Total online training */}
                        {translate('total_online_training', language)}
                      </div>
                      <div className="stats">{formatMoney(parseInt(stats.product_onlinetraining.total))}</div>
                      <div className="block">
                        <div className="th">
                          {/* Low/High price */}
                          {translate('low_high_price', language)}
                        </div>
                        <div className="stats">
                          {formatMoney(stats.product_onlinetraining.min_price) +
                            ' / ' +
                            formatMoney(stats.product_onlinetraining.max_price)}
                        </div>
                      </div>
                      <div className="block">
                        <div className="th">
                          {/* Avg price */}
                          {translate('avg_price', language)}
                        </div>
                        <div className="stats">
                          {formatMoney(parseInt(stats.product_onlinetraining.avg_price).toFixed(2))} /tim
                        </div>
                      </div>
                    </div>

                    <div className="block">
                      <div className="th">
                        {/* Total training programs */}
                        {translate('total_training_programs', language)}
                      </div>
                      <div className="stats">{formatMoney(parseInt(stats.product_trainprogram.total))}</div>
                      <div className="block">
                        <div className="th">
                          {/* Low/High price */}
                          {translate('low_high_price', language)}
                        </div>
                        <div className="stats">
                          {formatMoney(stats.product_trainprogram.min_price) +
                            ' / ' +
                            formatMoney(stats.product_trainprogram.max_price)}
                        </div>
                      </div>
                      <div className="block">
                        <div className="th">
                          {/* Avg price */}
                          {translate('avg_price', language)}
                        </div>
                        <div className="stats">
                          {formatMoney(parseInt(stats.product_trainprogram.avg_price).toFixed(2))}
                        </div>
                      </div>
                    </div>

                    <div className="block">
                      <div className="th">
                        {/* Total diet programs */}
                        {translate('total_diet_programs', language)}
                      </div>
                      <div className="stats">{formatMoney(parseInt(stats.product_dietprogram.total))}</div>
                      <div className="block">
                        <div className="th">
                          {/* Low/High price */}
                          {translate('low_high_price', language)}
                        </div>
                        <div className="stats">
                          {formatMoney(stats.product_dietprogram.min_price) +
                            ' / ' +
                            formatMoney(stats.product_dietprogram.max_price)}
                        </div>
                      </div>
                      <div className="block">
                        <div className="th">
                          {/* Avg price */}
                          {translate('avg_price', language)}
                        </div>
                        <div className="stats">
                          {formatMoney(parseInt(stats.product_dietprogram.avg_price).toFixed(2))}
                        </div>
                      </div>
                    </div>

                    <div className="block">
                      <div className="th">
                        {/* Total clipcards */}
                        {translate('total_clipcards', language)}
                      </div>
                      <div className="stats">{formatMoney(parseInt(stats.product_clipcard.total))}</div>
                      <div className="block">
                        <div className="th">
                          {/* Low/High price */}
                          {translate('low_high_price', language)}
                        </div>
                        <div className="stats">
                          {formatMoney(stats.product_clipcard.min_price) +
                            ' / ' +
                            formatMoney(stats.product_clipcard.max_price)}
                        </div>
                      </div>
                      <div className="block">
                        <div className="th">
                          {/* Avg price */}
                          {translate('avg_price', language)}
                        </div>
                        <div className="stats">
                          {formatMoney(parseInt(stats.product_clipcard.avg_price).toFixed(2))}
                        </div>
                      </div>
                    </div>

                    <div></div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
