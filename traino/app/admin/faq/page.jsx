'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppState } from '@/app/hooks/useAppState';
import { sanitizeInput } from '@/app/functions/functions';
import { addFaq } from '@/app/functions/fetchDataFunctions.js';
import Loader from '@/app/components/Loader';
import FAQList from '@/app/faq/FAQList';
import Link from 'next/link';
import AdminNav from '@/app/admin/AdminNav';
import './../page.css';
import './page.css';

export default function AdminFAQ() {
  const { DEBUG, baseUrl, sessionObject } = useAppState();
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const [formData, setFormData] = useState({
    question: '',
    answer: '',
  });

  const handleChange = (e) => {
    const { id, value } = e.target;
    const sanitizedValue = sanitizeInput(value, 'text');
    setFormData((prevData) => ({
      ...prevData,
      [id]: sanitizedValue,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    DEBUG && console.log(formData);

    async function createFAQ(formData) {
      setLoading(true);
      try {
        const data = await addFaq(formData);

        DEBUG && console.log(data); // Optionally log data for debugging

        setFormData({
          question: '',
          answer: '',
        });
      } catch (error) {
        console.error('Error creating FAQ:', error.message);
      } finally {
        setLoading(false);
      }
    }

    createFAQ(formData);
  };

  return (
    <main id="admin-page" className="adminfaq">
      <AdminNav page="faq" />
      <div className="scrollcontainer">
        <div className="content">
          <div className="create">
            <h2>Skapa ny FAQ</h2>
            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <label htmlFor="question">Rubrik/Fråga </label>
                <input
                  id="question"
                  type="text"
                  placeholder="Skriv fråga här..."
                  value={formData.question}
                  onChange={handleChange}
                />
              </div>
              <div className="input-group">
                <label htmlFor="answer">Text/Svar </label>
                <textarea
                  id="answer"
                  placeholder="Skriv ditt svar här..."
                  value={formData.answer}
                  onChange={handleChange}
                />
              </div>
              {loading ? (
                <div className="button">
                  <Loader />
                </div>
              ) : (
                <button type="submit" className="button">
                  Spara
                </button>
              )}
            </form>
            <br />
            <h2>Nuvarande FAQ Lista</h2>
          </div>
          {loading ? <></> : <FAQList admin={true} />}
        </div>
      </div>
    </main>
  );
}
