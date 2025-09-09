'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppState } from '@/app/hooks/useAppState';
import Loader from '@/app/components/Loader';
import Link from 'next/link';
import { deleteImage } from '@/app/api/aws/delete';
import { getBugreports, removeBugreport } from '@/app/functions/fetchDataFunctions.js';
import AdminNav from '@/app/admin/AdminNav';
import './page.css';
import '../page.css';

function BugReports() {
  const { DEBUG, baseUrl, sessionObject } = useAppState();
  const [bugReports, setBugReports] = useState([]);
  const [completedBugReports, setCompletedBugReports] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedReport, setSelectedReport] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [imageUrls, setImageUrls] = useState([]);
  const [completed, setCompleted] = useState(false);
  const [filterCompleted, setfilterCompleted] = useState(false);

  const router = useRouter();

  const fetchReportImages = async (folder) => {
    try {
      const response = await fetch(`/api/aws/fetch-imgs?folder=${encodeURIComponent(folder)}`, {
        method: 'GET',
      });
      const data = await response.json();

      if (response.ok) {
        setImageUrls(data.imageUrls);
      } else {
        console.error('Error:', data.error);
      }
    } catch (error) {
      console.error('Error fetching report images:', error);
    }
  };

  // Call the function when needed
  useEffect(() => {
    fetchReportImages('reports');
  }, []);

  useEffect(() => {
    console.log(imageUrls);
  }, [imageUrls]);

  useEffect(() => {
    if (selectedReport) {
      setCompleted(selectedReport.completed == 1);
    }
  }, [selectedReport]);

  const fetchBugReports = async (page) => {
    setLoading(true);

    try {
      const data = await getBugreports(page);
      const results = data.results;
      const completedResults = data.results.filter((item) => item.completed == 0);

      setBugReports(results);
      setCompletedBugReports(completedResults);

      DEBUG && console.log(data);
      DEBUG && console.log(results);
      DEBUG && console.log(completedResults);

      setCurrentPage(data.currentPage);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('Error fetching bug reports:', error);
    } finally {
      setLoading(false); // Set loading to false after fetch
    }
  };

  useEffect(() => {
    fetchBugReports(currentPage);
  }, [currentPage]);

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleDelete = async (id) => {
    DEBUG && console.log(`Deleted card with ID: ${id}`);

    try {
      removeBugreport(id);

      if (imageUrls.includes(`https://traino.s3.amazonaws.com/reports/${selectedReport.id}.webp`)) {
        try {
          deleteImage({ src: `https://traino.s3.amazonaws.com/reports/${selectedReport.id}.webp` });
        } catch (error) {
          console.error('Error deleting image:', error);
        }
      }

      setIsModalOpen(false);
      fetchBugReports(currentPage);

      return;
    } catch (error) {
      // Handle errors
      console.error('Error fetching data:', error);
    }
  };

  const toggleDeleteConfirmation = () => {
    const wrapper = document.querySelector('.confirm-delete-wrap');
    const deleteBtn = document.getElementById('delete-btn');

    wrapper.classList.toggle('hidden');
    deleteBtn.classList.toggle('hidden');
  };

  const toggleComplete = () => {
    const completeBtn = document.getElementById('complete-button');
    setCompleted(!completed);

    completeBtn.classList.toggle('complete');
  };

  const handleCardClick = (report) => {
    setSelectedReport(report);
    setIsModalOpen(true);
  };

  const closeModal = async () => {
    if (completed != selectedReport.completed) {
      try {
        const response = await fetch(`${baseUrl}/api/proxy`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${sessionObject.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: `${baseUrl}/api/admin/bugreports/update?id=${selectedReport.id}`,
            method: 'POST',
            body: JSON.stringify({ completed: completed }),
          }),
        });

        // Check if the response is ok (status code 200-299)
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        setIsModalOpen(false);
        setSelectedReport(null);
        fetchBugReports(currentPage);
        return;
      } catch (error) {
        // Handle errors
        console.error('Error updating data:', error);
      }
    } else {
      setIsModalOpen(false);
      setSelectedReport(null);
    }
  };

  const handleCheckboxChange = () => {
    setfilterCompleted(!filterCompleted);
  };

  return (
    <main id="admin-page" className="bugreportpage">
      <AdminNav page="bugreports" />
      <div className="scrollcontainer">
        <div className="content">
          <div>
            {loading ? (
              <Loader />
            ) : (
              <>
                <label className="filter-label">
                  <input
                    type="checkbox"
                    checked={filterCompleted}
                    onChange={handleCheckboxChange}
                    className="filter-checkbox"
                  />
                  Hide complete reports
                </label>
                {(filterCompleted ? completedBugReports : bugReports).map((report) => (
                  <div className="bug-report-card" key={report.id} onClick={() => handleCardClick(report)}>
                    <div className="bug-report-card-content">
                      <div className="bug-report-card-header">
                        <div>
                          <div className="bug-report-date">
                            <p>{report.created_at}</p>
                          </div>
                          <h3>
                            {report.firstname} {report.lastname}
                          </h3>
                        </div>
                        {report.completed == 1 && (
                          <div className="bug-report-complete-wrap">
                            <span className="icon-check-small"></span>
                            Complete
                          </div>
                        )}
                      </div>
                      <div className="bug-report-card-body">
                        <div>
                          <p>
                            <strong>Description:</strong> {report.description}
                          </p>
                          <p>
                            <strong>Severity:</strong> {report.severity}
                          </p>
                        </div>
                        {imageUrls.includes(`https://traino.s3.amazonaws.com/reports/${report.id}.webp`) && (
                          <img
                            className="bug-report-image"
                            src={`https://traino.s3.amazonaws.com/reports/${report.id}.webp`}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                <div className="pagination-container">
                  <button className="button" onClick={prevPage} disabled={currentPage === 1}>
                    Previous Page
                  </button>
                  <div className="current-page">
                    <span>
                      {currentPage}/{totalPages}
                    </span>
                  </div>
                  <button className="button" onClick={nextPage} disabled={currentPage === totalPages}>
                    Next Page
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      {isModalOpen && selectedReport && (
        <div className={`modal ${isModalOpen ? 'show' : ''}`}>
          <div className="modal-content">
            <span className="close-button" onClick={closeModal}>
              &times;
            </span>
            <h3>
              {selectedReport.firstname} {selectedReport.lastname}
            </h3>
            {selectedReport.user_id && (
              <p>
                <strong>User ID:</strong> {selectedReport.user_id}
              </p>
            )}
            {selectedReport.device && (
              <p>
                <strong>Device:</strong> {selectedReport.device}
              </p>
            )}
            <p>
              <strong>Severity:</strong> {selectedReport.severity}
            </p>
            <p>
              <strong>Description:</strong> {selectedReport.description}
            </p>
            <p>
              <strong>Bug ID:</strong> {selectedReport.id}
            </p>
            <p>
              <strong>Area:</strong> {selectedReport.area}
            </p>
            <p>
              <strong>Browser:</strong> {selectedReport.browser}
            </p>
            <p>
              <strong>Created at:</strong> {selectedReport.created_at}
            </p>
            {selectedReport.logs && (
              <p>
                <strong>Logs:</strong> {selectedReport.logs}
              </p>
            )}
            <p>
              <strong>Platform:</strong> {selectedReport.platform}
            </p>
            <p>
              <strong>Resolution:</strong> {selectedReport.resolution}
            </p>
            <p>
              <strong>Screenshot :</strong>
              {imageUrls.includes(`https://traino.s3.amazonaws.com/reports/${selectedReport.id}.webp`) ? (
                <a
                  href={`https://traino.s3.amazonaws.com/reports/${selectedReport.id}.webp`}
                  target="none"
                  title="Granska bild"
                >
                  <img
                    className="bug-report-image"
                    src={`https://traino.s3.amazonaws.com/reports/${selectedReport.id}.webp`}
                  />
                </a>
              ) : (
                ' Ingen bild'
              )}
            </p>
            <div className="modal-buttons">
              <div className="complete-button-wrap" onClick={toggleComplete}>
                <button className={`button ${completed ? 'complete' : ''}`} id="complete-button">
                  {completed ? 'Completed' : 'Mark as complete'}
                </button>
              </div>
              <button className="button" id="delete-btn" onClick={toggleDeleteConfirmation}>
                Delete
              </button>
              <div className="confirm-delete-wrap hidden">
                <button className="button" id="cancel-btn" onClick={toggleDeleteConfirmation}>
                  Cancel
                </button>
                <button className="button" id="confirm-btn" onClick={() => handleDelete(selectedReport.id)}>
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default BugReports;
