import { useState } from 'react';
import { shortenText } from '../functions/functions';

const AboutHistory = () => {
  const [expandedItems, setExpandedItems] = useState({});

  const toggleReadMore = (id) => {
    setExpandedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const timelineEvents = [
    {
      year: 2020,
      title: 'TRAINO grundas',
      description:
        'Idén för TRAINO kom utifrån en passion för att förenkla och förbättra tillgången till personlig träning. En dag mottog Kevin ett samtal från sin vän Emma, som frustrerat berättade om sina problem med att ta med sin tränare till gymmet. Gymmet krävde en extra avgift för externa tränare, vilket fick Kevin att undra varför hon inte kunde använda gymmets egna tränare. Svaret var enkelt – de kunde inte tillgodose hennes specifika träningsintressen. Många har svårt att hitta en  tränare som kan uppfylla deras unika mål och behov. Med dagens teknologi såg Kevin och Emma en möjlighet att skapa en lösning. De började utveckla Traino, en plattform som sammanför tränare och utövare baserat på deras specifika träningsintressen och behov.',
      image: 'whatistraino1.jpg',
    },
    {
      year: 2020,
      title: 'Utvecklingen påbörjas',
      description:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. In eros ipsum, porta ac neque eget, maximus aliquam massa. Quisque consectetur felis non felis ultrices varius. Pellentesque sagittis suscipit tellus, eu tincidunt ante pharetra dictum. Morbi risus ligula, mattis commodo lacinia a, rhoncus ac justo. Suspendisse hendrerit vestibulum nisi, eu tristique risus dictum vitae. Vestibulum aliquet risus ipsum, nec tincidunt turpis dignissim non. Morbi sed euismod quam, nec tempor leo. Fusce a massa rhoncus sem elementum egestas. In mi massa, pulvinar congue tincidunt eu, semper et massa. Integer id enim fermentum, lacinia neque quis, euismod odio. Integer id ex semper dolor laoreet bibendum. Phasellus ornare porttitor ante nec efficitur. In hac habitasse platea dictumst. Quisque rutrum felis non sapien sagittis, vitae tristique odio condimentum. Nam arcu nisi, hendrerit non tristique quis, lacinia vel orci. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae;',
      image: 'whatistraino2.jpg',
    },
    {
      year: 2020,
      title: 'Utvecklingen forsätter',
      description:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. In eros ipsum, porta ac neque eget, maximus aliquam massa. Quisque consectetur felis non felis ultrices varius. Pellentesque sagittis suscipit tellus, eu tincidunt ante pharetra dictum.',
      image: null,
    },
  ];

  return (
    <div className="content story">
      <h3>Vår historia</h3>
      <div className="timeline-wrap">
        {timelineEvents.map((event, index) => {
          const isExpanded = expandedItems[index];
          return (
            <div className="timeline-item" key={index}>
              {event.id == 0 ? (
                <div className="timeline-marker start">
                  <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <ellipse cx="30" cy="30" rx="30" ry="30" />
                    <path
                      d="M20.7901 16L19.6401 22.9018H43.0404L44.1904 16H20.7901ZM25.9221 33.3909L25.2336 37.0982L23.9461 44H30.9561L32.2436 37.0982L32.932 33.3909L34.2195 26.489H27.2096L25.9221 33.3909Z"
                      fill="white"
                    />
                  </svg>
                </div>
              ) : (
                <div className="timeline-marker">
                  <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="10" cy="10" r="10" />
                  </svg>
                </div>
              )}
              <div className="timeline-content-wrap">
                <div className="timeline-content">
                  <div className="timeline-header">
                    <h6>{event.year}</h6>
                    <h5>{event.title}</h5>
                  </div>
                  <p>{isExpanded ? event.description : shortenText(event.description, 400)}</p>
                  {event.description.length >= 400 &&
                    (isExpanded ? (
                      <div className="read-more" onClick={() => toggleReadMore(index)}>
                        <span className="icon-chevron up"></span>
                        Läs mindre
                      </div>
                    ) : (
                      <div className="read-more" onClick={() => toggleReadMore(index)}>
                        <span className="icon-chevron"></span>
                        Läs mer
                      </div>
                    ))}
                </div>
                {event.image && (
                  <div className="timeline-image">
                    <img src={'./assets/' + event.image} alt="Placeholder" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AboutHistory;
