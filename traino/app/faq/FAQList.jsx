'use client';
import { useState, useEffect } from 'react';
import { useAppState } from '@/app/hooks/useAppState';
import { useDebounce } from '@/app/admin/hooks';
import { sanitizeInput } from '@/app/functions/functions';
import { playSound } from '@/app/components/PlaySound';
import Loader from '@/app/components/Loader';

import './FAQList.css';

export default function FAQList({ admin }) {
  const { DEBUG, sessionObject, baseUrl } = useAppState();
  const [loading, setLoading] = useState(true);
  const [faqData, setFaqData] = useState({ faqs: [], totalPages: 0 });
  const [expandedItem, setExpandedItem] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  const [editIndex, setEditIndex] = useState(null);
  const [editFormData, setEditFormData] = useState({
    question: '',
    answer: '',
  });

  const debouncedSearch = useDebounce(searchQuery, 300);

  const toggleAccordion = (index) => {
    playSound('swipe', '0.5');
    if (expandedItem === index) {
      setExpandedItem(null);
    } else {
      setExpandedItem(index);
    }
  };

  const handleEdit = (index, question, answer) => {
    setEditIndex(index);
    setEditFormData({ question, answer });
  };

  const handleChangeEdit = (e) => {
    const { id, value } = e.target;

    const sanitizedValue = sanitizeInput(value, 'text');

    setEditFormData((prevData) => ({
      ...prevData,
      [id]: sanitizedValue,
    }));
  };

  const handleSaveEdit = async (index, id) => {
    setLoading(true);
    try {
      // Update the FAQ item locally
      const updatedFaqs = [...faqData.faqs];
      updatedFaqs[index] = {
        ...updatedFaqs[index],
        question: editFormData.question,
        answer: editFormData.answer,
      };
      setFaqData({ ...faqData, faqs: updatedFaqs });

      const response = await fetch(`${baseUrl}/api/proxy`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sessionObject.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: `${baseUrl}/api/admin/faq?crud=update`,
          method: 'POST',
          body: JSON.stringify({
            id: id,
            question: editFormData.question,
            answer: editFormData.answer,
          }),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update FAQ item');
      }

      setEditIndex(null); // Reset edit mode
    } catch (error) {
      console.error('Update error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFaqData = async (query = '') => {
    setLoading(true);
    try {
      const url = query
        ? `${baseUrl}/api/faq?query=${encodeURIComponent(query)}&page=${currentPage}`
        : `${baseUrl}/api/faq?page=${currentPage}`;

      const response = await fetch(`${baseUrl}/api/proxy`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sessionObject.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: url,
          method: 'GET',
        }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      DEBUG && console.log(data);
      setFaqData(data);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaqData(debouncedSearch);
  }, [debouncedSearch, currentPage]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleSearchInput = (event) => {
    const query = event.target.value;
    setSearchQuery(query);
  };

  const handleDelete = async (index, id) => {
    DEBUG && console.log('Deleting id', id);

    try {
      const response = await fetch(`${baseUrl}/api/proxy`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sessionObject.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: `${baseUrl}/api/admin/faq?crud=delete`,
          method: 'POST',
          body: JSON.stringify({ id }),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete FAQ item');
      }

      // Update the UI after successful deletion
      const updatedFaqs = [...faqData.faqs];
      updatedFaqs.splice(index, 1); // Remove the deleted item from the array
      setFaqData({ ...faqData, faqs: updatedFaqs });
    } catch (error) {
      console.error('Delete error:', error);
    }
  };
  // MARK: Markup
  return (
    <div className="faq">
      <div className="input-group">
        <input type="search" placeholder="Sök i FAQ" value={searchQuery} onChange={handleSearchInput} />
      </div>
      {loading ? (
        <Loader />
      ) : (
        <>
          {faqData.faqs.map((item, index) => (
            <div
              className="faqitem"
              key={index}
              onMouseOver={() => playSound('tickclick', '0.5')}
              onClick={() => toggleAccordion(index)}
            >
              {editIndex === index ? (
                <>
                  <div className="edititems">
                    <input id="question" type="text" value={editFormData.question} onChange={handleChangeEdit} />
                    <textarea id="answer" value={editFormData.answer} onChange={handleChangeEdit} />
                    {loading ? (
                      <div className="button">
                        <Loader />
                      </div>
                    ) : (
                      <button className="button" onClick={() => handleSaveEdit(index, item.id)}>
                        Save
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <h2>{item.question}</h2>
                  {admin && (
                    <>
                      <button className="edit" onClick={() => handleEdit(index, item.question, item.answer)}>
                        Edit
                      </button>
                      <button className="delete" onClick={() => handleDelete(index, item.id)}>
                        Delete
                      </button>
                    </>
                  )}
                  {expandedItem === index && <p>{item.answer}</p>}
                </>
              )}
            </div>
          ))}
          <div className="pagination">
            <button disabled={currentPage === 1} onClick={() => handlePageChange(currentPage - 1)}>
              Back
            </button>
            <span>
              Page {currentPage} av {faqData.totalPages}
            </span>
            <button disabled={currentPage >= faqData.totalPages} onClick={() => handlePageChange(currentPage + 1)}>
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
