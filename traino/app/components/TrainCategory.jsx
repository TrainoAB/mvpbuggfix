import Link from 'next/link';
import Image from 'next/image';
import { setCookie, getCookie, deleteCookie } from '@/app/functions/functions';
import { playSound } from '@/app/components/PlaySound';
import { useAppState } from '@/app/hooks/useAppState';

import './TrainCategory.css';

export default function TrainCategory({ item }) {
  const { DEBUG, useTranslations, language } = useAppState();

  const { translate } = useTranslations('train', language);

  const handleClick = () => {
    playSound('popclick', '0.5');
    setCookie('category_link', item.category_link);
  };

  return (
    <>
      {item.is_show === 1 ? (
        <div className="traincategory">
          <Link
            href={`/train/${item.category_link}`}
            onMouseOver={() => playSound('tickclick', '0.5')}
            onClick={handleClick}
          >
            <span>{translate(`cat_${item.category_link}`)}</span>
            <div className="image">
              <div
                style={{
                  backgroundImage: `url(${item.category_image})`,
                  backgroundSize: 'cover', // Ensures the image covers the div
                  backgroundPosition: 'center center', // Centers the image
                  width: '100%', // Adjust the dimensions as needed
                  height: '100%', // Adjust the dimensions as needed
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                aria-label={translate(`cat_${item.category_link}`)} // Accessible label for the image
                role="img" // Marks the div as an image role for accessibility
              >
                <div className="counts">
                  <div>
                    {/* Pass */}
                    {translate('training_pass', language)}
                  </div>
                  <div>
                    {/* Online */}
                    {translate('online_training', language)}
                  </div>
                  <div>
                    {/* Program */}
                    {translate('training_program', language)}
                  </div>
                  <div>
                    {/* Diet */}
                    {translate('diet_program', language)}
                  </div>
                  {/* <div>Clipcard</div> */}
                  <div>{item.total_trainingpass}</div>
                  <div>{item.total_onlinetraining}</div>
                  <div>{item.total_trainprogram}</div>
                  <div>{item.total_dietprogram}</div>
                  {/* <div>{item.total_clipcard}</div> */}
                </div>
              </div>
            </div>
          </Link>
        </div>
      ) : (
        <div className="traincategory disabled">
          <div className="disabledlink">
            <span>{translate(`cat_${item.category_link}`)}</span>
            <div className="image">
              <Image
                src={item.category_image}
                alt={translate(`cat_${item.category_link}`)}
                width={500} // Set fixed width
                height={300} // Set fixed height
                priority // This enables high-priority loading
                style={{ objectFit: 'cover' }} // Ensures the image covers the area
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
