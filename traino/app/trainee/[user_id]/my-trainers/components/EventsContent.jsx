import './EventsContent.css';

export default function EventsContent ({ data }) {

  // Funktion för att konvertera datumformatet
  function formatDate(dateStr) {
    const monthNames = {
      "Januari": "01",
      "Februari": "02",
      "Mars": "03",
      "April": "04",
      "Maj": "05",
      "Juni": "06",
      "Juli": "07",
      "Augusti": "08",
      "September": "09",
      "Oktober": "10",
      "November": "11",
      "December": "12"
    };

    const parts = dateStr.split(" ");
    const day = parts[0].padStart(2, '0');
    const month = monthNames[parts[1]];
    const year = parts[2];

    return `${year}-${month}-${day}`;
  }

  // Konvertera händelser till nytt format
  const konverteradeHändelser = data.map(event => ({
    ...event,
    date: formatDate(event.date)
  }));

  // Filtrera kommande händelser
  const kommandeHändelser = konverteradeHändelser.filter(entry => entry.date >= new Date().toISOString().split('T')[0]);

  // Filtrera tidigare händelser och sortera i kronologisk ordning
  const tidigareHändelser = konverteradeHändelser
    .filter(entry => entry.date < new Date().toISOString().split('T')[0])
    .sort((a, b) => a.date.localeCompare(b.date)); // Sortera med localeCompare

  // Summera totalpriset för tidigare händelser
  const totalPrice = tidigareHändelser.reduce((accumulator, currentValue) => {
    return accumulator + currentValue.priceInSEK;
  }, 0);

  return (
    <div id="händelser-content">

      <div className="container-upcoming">
        <header className="content-header">Upcoming</header>
        {kommandeHändelser.map((entry) => (
          <div key={entry.id} className="content-item">
            <div className="content-item__title">{entry.activityType}</div>
            <div className="content-item__details-wrapper">
              <div className="content-item__details--left">
                <div>{entry.description}</div>
                <div>{entry.details}</div>
                <div>{entry.date}</div>
                <div>{entry.durationInMinutes} min</div>
              </div>
              <div className="content-item__details--right">
                {entry.priceInSEK} Kr
              </div>
            </div>
          </div>
        ))}
      </div>
      <hr className="horisontal-line" />
      <div className="container-previous">
        <header className="content-header">Previous</header>
        {tidigareHändelser.map((entry) => (
          <div key={entry.id} className="content-item">
            <div className="content-item__title">{entry.activityType}</div>
            <div className="content-item__details-wrapper">
              <div className="content-item__details--left">
                <div>{entry.description}</div>
                <div>{entry.details}</div>
                <div>{entry.date}</div>
                <div>{entry.durationInMinutes} min</div>
              </div>
              <div className="content-item__details--right">
                {entry.priceInSEK} SEK
              </div>
            </div>
          </div>
        ))}
        <hr className="horisontal-line" />
        <div className="total-sum">
          <div className="total-sum__left">
            Total Sum:
          </div>
          <div className="total-sum__right">
            {totalPrice} SEK
          </div>
        </div>
      </div>
    </div>
  );
};