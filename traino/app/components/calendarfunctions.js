/* const pass_set = [
    {
        autorepeat: 1,
        booked_count: 15,
        category_id: 2,
        category_link: "cs2",
        category_name: "Counter-Strike 2",
        duration: 30,
        enddate: null,
        id: 41135,
        intervals: [
            {
                id: "53c",
                start: "08:00",
                end: "09:00",
                pass_amount: "2",
            },
            {
                id: "53c8",
                start: "10:00",
                end: "12:00",
                pass_amount: "4",
            },
        ],
        isrepeat: 0,
        pa_alias: "samelward",
        pa_userid: 2010056,
        pass_repeat_id: "4356435678i",
        pass_set_id: 46,
        passcreated: "2025-01-07 00:00:00",
        product_type: "trainingpass",
        productcreated: "2025-01-07 00:00:00",
        singeldayrepeat: "tue",
        startdate: "2025-01-07",
    },
];

const pass_set = [
  {
    autorepeat: 1,
    booked_count: 15,
    category_id: 2,
    category_link: 'cs2',
    category_name: 'Counter-Strike 2',
    duration: 30,
    enddate: null,
    id: 41135,
    isrepeat: 1,
    pa_alias: 'samelward',
    pa_userid: 2010056,
    pass_repeat_id: '4356435678i',
    pass_set_id: 46,
    passcreated: '2025-01-07 00:00:00',
    product_type: 'trainingpass',
    productcreated: '2025-01-07 00:00:00',
    singeldayrepeat: null,
    startdate: '2025-01-07',
    intervals: [
      {
        day: 'tue',
        intervals: [
          { id: '234564299435', start: '08:00', end: '10:00', pass_amount: '4' },
          { id: '263995', start: '11:00', end: '14:00', pass_amount: '6' },
        ],
      },
      {
        day: 'wed',
        intervals: [{ id: '23456424399993235', start: '12:00', end: '13:00', pass_amount: '2' }],
      },
    ],
  },
];

const pass_booked = [
  {
    booked_date: '2025-01-07',
    canceled: 0,
    endtime: '08:00:00',
    id: 292,
    ispause: 0,
    paid: 0,
    pass_set_id: '46',
    pass_set_repeat_id: '677cff146c4085.35538747e92b15f87483e',
    payment_intent_id: null,
    product_id: '41135',
    product_type: 'trainingpass',
    reason: null,
    registered: '2025-01-07 06:20:08',
    rrule: null,
    starttime: '08:30:00',
    stripe_order_id: '',
    trainer_id: 2010056,
    user_id: 2010045,
  },
];
 */

const DEBUG = process.env.NEXT_PUBLIC_DEBUG === 'true';

export function generateDailyFreePasses(source) {
  const booked = source.pass_booked;
  const settings = source.pass_set;

  DEBUG && console.log('generateDailyFreePasses booked, settings', booked, settings);

  const generatedPasses = generatePassesFromSettings(settings);

  DEBUG && console.log('generatePassesFromSettings generated', generatedPasses);

  // Convert booked passes to the same format as generated passes
  const bookedPasses = booked.map((pass) => {
    const bookedStart = new Date(`${pass.booked_date}T${pass.starttime}`);
    const bookedEnd = new Date(`${pass.booked_date}T${pass.endtime}`);

    return {
      start: bookedStart,
      end: bookedEnd,
    };
  });

  DEBUG && console.log('Booked passes:', bookedPasses);

  let extraInfo;

  // Filter out any day whose passes have all expired or are older than the current date/time
  const now = new Date();

  // Filter out generated passes that overlap with any booked pass
  const filteredPasses = generatedPasses.map((day) => {
    if (bookedPasses.length === 0) {
      // If there are no bookings, return all generated passes for the day
      return day;
    }

    // Filter the passes for this specific day
    const filteredData = day.data.filter((generatedPass) => {
      const generatedStart = new Date(generatedPass.start);
      const generatedEnd = new Date(generatedPass.end);

      // Check if the generated pass overlaps with any booked pass
      const isOverlapping = bookedPasses.some((bookedPass) => {
        const bookedStart = bookedPass.start;
        const bookedEnd = bookedPass.end;

        // Ensure we're only considering exact overlaps
        return (
          (generatedStart >= bookedStart && generatedStart < bookedEnd) || // Generated pass starts before the end of booked pass
          (generatedEnd > bookedStart && generatedEnd <= bookedEnd) || // Generated pass ends after the start of booked pass
          (generatedStart < bookedStart && generatedEnd > bookedEnd) // Generated pass completely covers the booked pass
        );
      });

      // Only keep passes that don't overlap with booked ones
      return !isOverlapping;
    });

    extraInfo = day.extra;

    return {
      date: day.date,
      data: filteredData,
    };
  });

  DEBUG && console.log('Filtered passes, removing bookings', filteredPasses);

  const finalFilteredPasses = filteredPasses.map((day) => {
    // Keep only days that have at least one valid future pass
    const validPasses = day.data.filter((pass) => {
      const passStart = new Date(pass.start);
      const passEnd = new Date(pass.end);

      // Keep passes where the start time is in the future (allow current day bookings)
      return passStart > now;
    });

    // Return the filtered valid passes
    return {
      ...day,
      data: validPasses,
    };
  });

  // Only keep days with non-empty `data`
  const filteredResult = finalFilteredPasses.filter((day) => day.data.length > 0);

  DEBUG && console.log('Filtered passes, keeping valid days', filteredResult);

  const data = {
    passes: filteredResult,
    details: extraInfo,
  };

  DEBUG && console.log('generateDailyFreePasses done', data);

  return data;
}

function generatePassesFromSettings(setting) {
  DEBUG && console.log('generatePassesFromSettings source', setting);
  let result = [];
  setting.forEach((source) => {
    const duration = source.duration; // 30, 60
    const autorepeat = source.autorepeat; // 1 or 0
    const singeldayrepeat = source?.singeldayrepeat ?? null; // "tue", "mon" ... only used if isrepeat is 0
    const isrepeat = source.isrepeat; // 1 or 0 where 1 = intervals.intervals several days
    const startDate = source.startdate; // "2025-01-07"
    const endDate = source?.enddate ?? null; // "2025-01-08"
    const intervals = source.intervals; // Array of intervals

    const startDateSourceObj = new Date(startDate);

    const startDateObj = new Date();
    startDateObj.setMinutes(0);
    startDateObj.setSeconds(0);
    startDateObj.setMilliseconds(0);

    const repeatStartDateObj = new Date(startDateSourceObj);
    repeatStartDateObj.setMinutes(0);
    repeatStartDateObj.setSeconds(0);
    repeatStartDateObj.setMilliseconds(0);

    DEBUG && console.log('Start date:', startDateObj, 'Repeat Start date', repeatStartDateObj);

    const endDateObj = autorepeat
      ? new Date(new Date(startDateObj).setDate(startDateObj.getDate() + 90)) // Safer way to add 90 days
      : endDate
      ? new Date(endDate + 'T00:00:00+01:00')
      : startDateObj;

    DEBUG && console.log('End date:', endDateObj);

    const dayMap = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

    let currentDate = new Date(startDateObj);
    let currentRepeatDate = new Date(repeatStartDateObj);

    function getNextRepeatDate(currentRepeatDate) {
      const today = new Date();
      const targetDayIndex = currentRepeatDate.getDay(); // Get weekday of the target date
      const currentDayIndex = today.getDay(); // Get today's weekday

      // Calculate days until the next target day, allowing for today if it matches
      let daysUntilNext = (targetDayIndex - currentDayIndex + 7) % 7;

      // If it's the same day, use 0 (today) instead of 7 (next week)
      if (daysUntilNext === 0 && targetDayIndex === currentDayIndex) {
        daysUntilNext = 0; // Use today
      }

      // Set the next occurrence
      const nextDate = new Date(today);
      nextDate.setDate(today.getDate() + daysUntilNext);
      nextDate.setHours(0, 0, 0, 0); // Ensure it's at midnight

      return nextDate;
    }

    let nextRepeatDateObj = getNextRepeatDate(currentRepeatDate);

    DEBUG && console.log('Next repeat day:', nextRepeatDateObj.toISOString().split('T')[0]); // Outputs YYYY-MM-DD

    const extraData = {
      duration: source.duration,
      isbooked: false,
      pass_amount: 1,
      pass_repeat_id: source.pass_repeat_id,
      pass_set_id: source.pass_set_id,
      product_id: source.id,
      trainer_id: source.pa_userid,
      category_id: source.category_id,
      category_name: source.category_name,
      category_link: source.category_link,
    };
    DEBUG && console.log('Extra data', extraData);

    if (isrepeat === 0) {
      DEBUG && console.log('isrepeat 0...');
      // [{"id":"cc812d93-a741-43e1-9629-cec261cf15ec","start":"01:00","end":"02:00","pass_amount":"0"}]
      const dayRepeat = singeldayrepeat.toLowerCase();
      const targetDayIndex = dayMap.indexOf(dayRepeat);

      // Generate passes for 90 days or until endDate
      while (nextRepeatDateObj <= endDateObj) {
        // If current day matches the repeat day, add intervals
        if (nextRepeatDateObj.getDay() === targetDayIndex) {
          const dayPasses = []; // Holds passes for this specific date

          intervals.forEach((interval) => {
            const start = interval.start;
            const passAmount = parseInt(interval.pass_amount);

            // Generate passes based on pass_amount
            for (let i = 0; i < passAmount; i++) {
              // Calculate start time
              const startTime = new Date(nextRepeatDateObj);
              const [startHours, startMinutes] = start.split(':').map((num) => parseInt(num));
              startTime.setHours(startHours);
              startTime.setMinutes(startMinutes + i * duration); // Increment for each pass

              const endTime = new Date(startTime);
              endTime.setMinutes(startTime.getMinutes() + duration); // Add duration

              // Push pass to dayPasses array with ISO formatted times
              dayPasses.push({
                start: startTime.toISOString(),
                end: endTime.toISOString(),
                id: interval.id,
              });
            }
          });

          // Add the date header and the passes for that date
          result.push({
            extra: extraData,
            date: nextRepeatDateObj.toLocaleDateString('sv-SE', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            }),
            data: dayPasses, // The passes for this specific day
            // Ensure the extraData is correctly passed here
          });
        }
        // Increment current date by 7 days for the next week
        nextRepeatDateObj.setDate(nextRepeatDateObj.getDate() + 7);
      }
    } else {
      DEBUG && console.log('isrepeat 1...');
      // Handle case where isrepeat is 1 (e.g., repeating intervals every week with different days)
      // [{"day":"tue","intervals":[{"id":"234564299435","start":"08:00","end":"10:00","pass_amount":"2"},{"id":"263995","start":"11:00","end":"14:00","pass_amount":3}]},{"day":"wed","intervals":[{"id":"23456424399993235","start":"12:00","end":"13:00","pass_amount":"1"}]}]
      // Generate passes for 90 days or until endDate
      while (currentDate <= endDateObj) {
        const currentDayName = dayMap[currentDate.getDay()]; // Get current day (e.g., "sun", "mon", "tue")

        // Check if there are intervals for the current day
        const dayIntervals = intervals.find((intervalGroup) => intervalGroup.day.toLowerCase() === currentDayName);

        if (dayIntervals) {
          const dayPasses = []; // Holds passes for this specific date

          // Loop through each interval for the current day
          dayIntervals.intervals.forEach((interval) => {
            const start = interval.start;
            const passAmount = parseInt(interval.pass_amount);

            // Generate passes based on pass_amount
            for (let i = 0; i < passAmount; i++) {
              // Calculate start time
              const startTime = new Date(currentDate);
              const [startHours, startMinutes] = start.split(':').map((num) => parseInt(num));
              startTime.setHours(startHours);
              startTime.setMinutes(startMinutes + i * duration); // Increment for each pass

              const endTime = new Date(startTime);
              endTime.setMinutes(startTime.getMinutes() + duration); // Add duration

              // Push pass to dayPasses array with ISO formatted times
              dayPasses.push({
                start: startTime.toISOString(),
                end: endTime.toISOString(),
                id: interval.id,
              });
            }
          });

          // Add the date header and the passes for that date
          result.push({
            extra: extraData,
            date: currentDate.toLocaleDateString('sv-SE', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            }),
            data: dayPasses, // The passes for this specific day
          });
        }

        // Increment current date by 1 day for the next iteration
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }
  });
  return result;
}
