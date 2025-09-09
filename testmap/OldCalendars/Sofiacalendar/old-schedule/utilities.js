import { addDays, getDay, getTime } from "date-fns";

const getWeekNumber = (date, weekOffset = 0) => {
  // Sätt veckodagen till söndag (0)
  date.setDate(date.getDate() - date.getDay());

  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
  let weekNum =
    Math.floor((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7) + 1; // Lägg till 1 för att börja från vecka 1
  return weekNum + weekOffset; // Lägg till veckooffset
};

export const generateCalendar = (
  year,
  month,
  startDate,
  endDate,
  onClickOnDay,
  editedDate,
  chosenDays,
) => {
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const lastDateOfMonth = new Date(year, month + 1, 0).getDate();
  const lastDateOfPreviousMonth = new Date(year, month, 0).getDate();

  const start = new Date(startDate);
  const end = new Date(endDate);
  let weekNumbers = [];
  let daysArray = [];
  const edited = new Date(editedDate);
  const today = new Date();
  const weekDays = ['sön', 'mån', 'tis', 'ons', 'tor', 'fre', 'lör'];

  // Generate days from the past month
  for (let i = firstDayOfMonth - 1; i > 0; i--) {
    daysArray.push(
      <li key={`prev-${i}`} className="item prev-date">
        {lastDateOfPreviousMonth - i + 1}
      </li>,
    );
  }

  // Generate days for the current month
  for (let i = 1; i <= lastDateOfMonth; i++) {
    const currentDate = new Date(Date.UTC(year, month, i));

    const isInRange =
      currentDate >=
        new Date(
          Date.UTC(start.getFullYear(), start.getMonth(), start.getDate()),
        ) &&
      currentDate <=
        new Date(Date.UTC(end.getFullYear(), end.getMonth(), end.getDate()));

    const isEditedDate =
      currentDate.getFullYear() === edited.getFullYear() &&
      currentDate.getMonth() === edited.getMonth() &&
      currentDate.getDate() === edited.getDate();

    const isToday =
      currentDate.getFullYear() === today.getFullYear() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getDate() === today.getDate();

    const weekday = currentDate.getDay();
    const dayName = weekDays[weekday];

    const isInRangeAndChosenDays = chosenDays.includes(dayName) && isInRange;

    let className = 'item';
    if (isInRangeAndChosenDays) {
      className += ' in-range';
    }
    if (isEditedDate) {
      className += ' edited-date';
    }

    if (isToday) {
      className += ' today';
    }

    daysArray.push(
      <li
        key={`current-${i}`}
        className={className}
        onClick={() => onClickOnDay(currentDate, weekday)}
      >
        {i}
      </li>,
    );

    const weekOffset = 0; // Justify so that week one starts from sunday
    if (
      (weekday === 0 || i === 1) &&
      !weekNumbers.includes(getWeekNumber(currentDate, weekOffset))
    ) {
      weekNumbers.push(getWeekNumber(currentDate, weekOffset));
    }
  }

  // Generate days for the next month
  const totalDays = firstDayOfMonth - 1 + lastDateOfMonth;
  const nextMonthDays = 42 - totalDays;

  for (let i = 1; i <= nextMonthDays; i++) {
    daysArray.push(
      <li key={`next-${i}`} className="item next-date">
        {i}
      </li>,
    );
  }

  return { liTag: daysArray, weekNumbers };
};

// Day
export const getMonday = () => {
  const today = new Date();
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(today.setDate(diff));
};

export const formatDate = (date) => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${year}-${month}-${day}`;
};

export const getDaysInRange = (date, startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const dayInRange = new Date(date);
  const isInRange = dayInRange >= start && dayInRange <= end;

  const className = isInRange ? 'day-content inRange' : 'day-content';
  return className;
};



export const getDayInRange = (date, startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const dayInRange = new Date(date);
  const isInRange = dayInRange >= start && dayInRange <= end;

  const day = isInRange ? dayInRange : null;
  return day;
};

export const getEditedDaysInRange = (
  date,
  startDate,
  endDate,
  daysTrainingList,
) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const dayInRange = new Date(date);
  const isInRange = dayInRange >= start && dayInRange <= end;

  // Array of days
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (daysTrainingList.length > 0 && isInRange) {
    const latestEntry = daysTrainingList[daysTrainingList.length - 1];
    const { date: latestdate, selectedTrainings, timeAvailable } = latestEntry;

    // Find the day of the edited date
    const editedDate = new Date(latestdate);
    const dayName = days[editedDate.getDay()];

    // Function to check if a date has the same day name
    const hasSameDayName = (date) => {
      return days[new Date(date).getDay()] === dayName;
    };

    // Find all dates within the range that match the day name
    const matchingDates = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      if (hasSameDayName(d)) {
        matchingDates.push({
          date: new Date(d),
          selectedTrainings,
          timeAvailable,
        });
      }
    }

    return matchingDates;
  } else {
    return [];
  }
};

  

  


export const getEditedDay = (date, startDate, endDate, editedData) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const dayInRange = new Date(date);
  const isInRange = dayInRange >= start && dayInRange <= end;

  // Control if the data is in the correct interval and matches the correct day
  if (isInRange) {
    const matchingData = editedData.filter((data) => {
      const dataDate = new Date(data.date);
      return dataDate.toDateString() === dayInRange.toDateString();
    });
    return matchingData;
  } else {
    return []; // Return empty array if no match
  }
};

export const getNextDay = (date, daysToAdd = 1) => {
  const nextDay = new Date(date);
  nextDay.setDate(date.getDate() + daysToAdd);
  return nextDay;
};

export const getPreviousDay = (date, daysToSubtract = 1) => {
  const prevDay = new Date(date);
  prevDay.setDate(date.getDate() - daysToSubtract);
  return prevDay;
};

/*Funktion för att testa om en tid kan läggas till eller om den överlappar med en tidigare tid
tar emot:
    newStartTime: nya starttiden som användaren försöker lägga till i form av ett Date-objekt
    newStopTime: nya sluttiden som användaren försöker lägga till i form av ett Date-objekt
    timeAvailable: Array av objekt {starttid, sluttid} som representerar de tidigare tillagda tiderna.  
returnerar true eller false
*/
export const isTimeOverlapping = (newStartTime, newStopTime, timeAvailable) => {
  for (const time of timeAvailable) {
    const existingStartTime = new Date(`1970-01-01T${time.startTime}:00`);
    const existingStopTime = new Date(`1970-01-01T${time.stopTime}:00`);

    if (
      (newStartTime >= existingStartTime && newStartTime < existingStopTime) ||
      (newStopTime > existingStartTime && newStopTime <= existingStopTime) ||
      (newStartTime <= existingStartTime && newStopTime >= existingStopTime)
    ) {
      return true;
    }
  }
  return false;
};
//Weeks
export const formatWeekRange = (startDate) => {
  const endDate = getNextDay(startDate, 6); // 6 days after the start date
  const startDay = startDate.getDate();
  const startMonth = startDate.toLocaleString('default', { month: 'short' });
  const endDay = endDate.getDate();
  const endMonth = endDate.toLocaleString('default', { month: 'short' });
  const ifDifferentMonth = startMonth === endMonth ? '' : startMonth;

  return `${startDay} ${ifDifferentMonth} - ${endDay} ${endMonth} `;
};

export const getWeek = (startDate) => {
  const weekNumber = getWeekNumber(startDate);
  return `Vecka ${weekNumber}`;
};
