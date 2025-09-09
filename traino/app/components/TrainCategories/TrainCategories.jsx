import React, { memo } from 'react';
import TrainCategory from '@/app/components/TrainCategory';
import { playSound } from '@/app/components/PlaySound';
import Link from 'next/link';
import Image from 'next/image';

const TrainCategories = memo(
  ({ renderCategories, filteredTrainerDetails, handlePageChange, currentPage, totalPages }) => {
    return (
      <div className="results">
        {console.log('Render categories:', renderCategories)}
        <div className="searchcontent">
          <div className="traincategories">
            {renderCategories.map((item, index) => (
              <TrainCategory key={index} item={item} />
            ))}
          </div>
          {filteredTrainerDetails && filteredTrainerDetails.length > 0 && (
            <div className="trainer-details">
              <h2>Tränare</h2>
              <div className="trainer-details-container">
                <ul>
                  {filteredTrainerDetails.map((trainer, index) => (
                    <li key={index}>
                      <Link
                        href={'/trainer/@' + trainer.alias}
                        className="traineritem"
                        onMouseOver={() => playSound('tickclick', '0.5')}
                      >
                        <div className="img-container">
                          {trainer.thumbnail === 1 && (
                            <img
                              src={`https://traino.s3.eu-north-1.amazonaws.com/${trainer.id}/profile/profile-image.webp`}
                              alt=""
                              style={{ objectFit: 'cover' }}
                            />
                          )}
                        </div>
                        <div className="name-container">
                          <div className="alias">@{trainer.alias}</div>
                          {trainer.firstname + ' ' + trainer.lastname}
                        </div>
                        {trainer.rating !== null && <div className="rating-container">{trainer.rating}</div>}
                      </Link>
                    </li>
                  ))}
                </ul>
                <div className="pagination">
                  <button
                    className="icon-chevron-left"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  ></button>
                  <span>
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    className="icon-chevron-right"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  ></button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  },
);

export default TrainCategories;
