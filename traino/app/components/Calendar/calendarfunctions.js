import moment from 'moment-timezone';

const DEBUG = process.env.NEXT_PUBLIC_DEBUG === 'true';

const swedishToEnglishDayMap = {
  Måndag: 'mon',
  Tisdag: 'tue',
  Onsdag: 'wed',
  Torsdag: 'thu',
  Fredag: 'fri',
  Lördag: 'sat',
  Söndag: 'sun',
};

export const getEnglishDay = (swedishDay) => {
  return swedishToEnglishDayMap[swedishDay];
};

// Function to get the day of the week in Swedish
export function getSwedishDay(dateString) {
  // Create a new Date object
  let date = new Date(dateString);

  // Array of days in Swedish
  let days = ['Söndag', 'Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag'];

  // Get the day of the week (0-6)
  let dayIndex = date.getDay();

  // Return the corresponding day in Swedish
  return days[dayIndex];
}

// MARK: Form Pass Amount
export function formatPassAmount(duration, startTime, endTime) {
  // Convert time strings to minutes from midnight
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);

  const startTotalMinutes = startHour * 60 + startMinute;
  const endTotalMinutes = endHour * 60 + endMinute;

  // Calculate the number of passes
  const totalMinutes = endTotalMinutes - startTotalMinutes;
  const numberOfPasses = Math.floor(totalMinutes / duration);

  return numberOfPasses;
}

// MARK: Gen Free Passes
export const generateFreePasses = (source) => {
  DEBUG && console.log('Generate free passes');
  // Generate all passes from the source
  const allPasses = generatePasses(source);

  // Initialize an array to hold free passes
  const freePasses = [];

  // Iterate over each pass
  allPasses.forEach((p) => {
    // Skip if the pass is booked
    if (p.isbooked) return;

    // Split the pass into separate passes and add to freePasses
    freePasses.push(...splitToSeparatePasses(p));
  });

  // Sort the free passes by their start time
  freePasses.sort((p1, p2) => p1.start - p2.start);

  // Return the sorted list of free passes
  return freePasses;
};

// MARK: Gen Daily Free Passes
export const generateDailyFreePasses = (source) => {
  DEBUG && console.log('Generate Daily Free passes');
  // Generate all free passes from the source
  const freePasses = generateFreePasses(source);

  // Initialize an array to hold passes grouped by day
  let sameDayPasses = [];

  // Iterate over the free passes
  for (let i = 0; i < freePasses.length; ) {
    // Store the index of the current pass
    const currentDateIx = i;

    // Get the start date of the current pass and set the time to midnight
    const currentDate = new Date(freePasses[i].start);
    currentDate.setHours(0, 0, 0, 0);

    // Iterate over the remaining passes to group them by the same day
    for (i++; i < freePasses.length; i++) {
      const date = new Date(freePasses[i].start);
      date.setHours(0, 0, 0, 0);
      if (date.getTime() !== currentDate.getTime()) break;
    }

    // Add the grouped passes to the sameDayPasses array
    sameDayPasses.push({
      date: dateText(currentDate),
      data: freePasses.slice(currentDateIx, i),
    });
  }

  // Return the list of passes grouped by day
  return sameDayPasses;
};

// MARK: Gen Passes
export const generatePasses = (source) => {
  DEBUG && console.log('Generate passes');
  // Initialize an array to hold the generated passes
  const result = [];

  // Generate passes from settings and add them to the result array
  result.push(...generatePassesFromSettings(source.pass_set));

  // Convert booked passes from the source
  const booked = convertBookedPasses(source.pass_booked);
  DEBUG && console.log('Booked passes...', booked);

  // Merge the booked passes into the result array
  const merged = mergeBookedPasses(booked, result);
  DEBUG && console.log('Merged passes...', merged);

  // Return the list of generated passes
  return merged;
};

const dateText = (date) => {
  let tx = date.toLocaleDateString('sv-SE', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  tx = tx.at(0).toUpperCase() + tx.slice(1);
  return tx;
};

// MARK: Split to separate (Only on booking)
const splitToSeparatePasses = (pass) => {
  // If the pass amount is 1, return the pass as is
  if (pass.pass_amount == 1) return [pass];

  // If the pass amount is less than 1, return an empty array
  if (pass.pass_amount < 1) return [];

  // Initialize an array to hold the separate passes
  const result = [];

  // Calculate the start and end times in seconds
  let startSec = Math.round(pass.start.getTime() / 1000);
  let endSec = Math.round(pass.end.getTime() / 1000);

  // Calculate the length of each separate pass in seconds
  const passLenSec = Math.floor((endSec - startSec) / pass.pass_amount);

  // Split the pass into separate passes
  for (; startSec + passLenSec <= endSec; startSec += passLenSec) {
    const separatePass = { ...pass };
    separatePass.start = new Date(startSec * 1000);
    separatePass.end = new Date((startSec + passLenSec) * 1000);
    separatePass.pass_amount = 1;
    result.push(separatePass);
  }

  // Return the array of separate passes
  return result;
};

// MARK: Convert Booked Passes
const convertBookedPasses = (passes) => {
  // Initialize an array to hold the converted passes
  const result = [];

  // Iterate over each pass in the passes array
  for (let pass of passes) {
    // Convert the pass and add it to the result array
    result.push(convertBookedPass(pass));
  }

  // Return the array of converted booked passes
  return result;
};

const convertBookedPass = (pass) => {
  const prod = Array.isArray(pass.product) && pass.product.length > 0 ? pass.product[0] : null;

  const result = {
    start: moment(`${pass.booked_date} ${pass.starttime}`, 'YYYY-MM-DD HH:mm').toDate(),
    end: moment(`${pass.booked_date} ${pass.endtime}`, 'YYYY-MM-DD HH:mm').toDate(),
    isbooked: true,
    ispause: pass ? pass.ispause : 0,
    pass_id: pass ? pass.pass_id : undefined,
    product_type: prod ? prod.product_type : undefined,
    trainer_id: pass ? pass.trainer_id : undefined,
    product_id: prod ? prod.product_id : undefined,
    category_id: prod ? prod.category_id : undefined,
    category_name: prod ? prod.category_name : undefined,
    category_link: prod ? prod.category_link : undefined,
    category_image: prod ? prod.category_image : undefined,
    duration: prod ? prod.duration : undefined,
    description: prod ? prod.description : undefined,
    duration: prod ? prod.duration : undefined,
    starttime: pass ? pass.starttime : undefined,
    endtime: pass ? pass.endtime : undefined,
    address: prod ? prod.address : undefined,
    user_email: pass?.user?.email ? pass.user.email : undefined,
    user_firstname: pass?.user?.firstname ? pass.user.firstname : undefined,
    user_id: pass ? pass.user_id : undefined,
    user_lastname: pass?.user?.lastname ? pass.user.lastname : undefined,
    registered: prod ? prod.registered : undefined,
  };

  return result;
};

// MARK: Gen Pass from Settings
const generatePassesFromSettings = (settings) => {
  DEBUG && console.log('Generate passes from settings...');
  const passes = [];
  for (let setting of settings) {
    passes.push(...generatePassesFromSetting(setting));
  }
  passes.sort((p1, p2) => p1.start - p2.start);
  return passes;
};

const generatePassesFromSetting = (setting) => {
  DEBUG && console.log('Generate passes from setting');
  let today = moment().startOf('day').toDate();
  let startDate = moment(setting.startdate, 'YYYY-MM-DD').startOf('day').toDate();
  if (startDate < today) startDate = today;

  const day90 = moment(today).add(90, 'days').endOf('day').toDate();
  let endDate = setting.enddate ? moment(setting.enddate, 'YYYY-MM-DD').endOf('day').toDate() : null;
  if (!endDate || endDate > day90) {
    endDate = day90;
  }

  const intervals = getIntervals(setting.isrepeat, setting.singeldayrepeat, setting.intervals);

  const passes = [];

  for (let i = 0; i < intervals.length; i++) {
    passes.push(...generatePassesFromInterval(startDate, endDate, intervals[i]));
  }

  // applyExceptions(passes, setting);

  passes.forEach((p) => {
    p.pass_set_id = setting.pass_set_id;
    p.trainer_id = setting.pa_userid;
    p.product_id = setting.product_id;
    p.pass_repeat_id = setting.pass_repeat_id;
    p.category_id = setting.category_id;
    p.category_name = setting.category_name;
    p.category_link = setting.category_link;
    p.duration = setting.duration;
    p.description = setting.description;
    p.address = setting.address;
    p.isbooked = false;
  });

  return passes;
};

// MARK: Apply Exceptions
const applyExceptions = (passes, setting) => {
  const exceptions = Array.isArray(setting.exceptions) ? setting.exceptions : [];
  const durationMs = (typeof setting.duration === 'number' ? setting.duration : 60) * 60000;

  //Remove
  exceptions
    .filter((ex) => ex.remove)
    .forEach((ex) => {
      const exStart = moment(ex.start, 'YYYY-MM-DD HH:mm').toDate();
      const exEnd = moment(ex.end, 'YYYY-MM-DD HH:mm').toDate();
      for (let i = 0; i < passes.length; i++) {
        let pass = passes[i];
        if (exEnd <= pass.start || pass.end <= exStart) continue;
        if (exStart <= pass.start && pass.end <= exEnd) {
          passes.splice(i, 1);
          i--;
          continue;
        }
        if (pass.start < exStart && exEnd < pass.end) {
          extraPass = { start: exEnd, end: pass.end };
          extraPass = adjustPassToDuration(extraPass, durationMs);

          pass.end = exStart;
          pass = adjustPassToDuration(pass, durationMs);
          if (!pass) passes.splice(i--, 1);
          if (extraPass) passes.push(extraPass);
        } else {
          if (pass.start < exStart) pass.end = exStart;
          else pass.start = exEnd;
          pass = adjustPassToDuration(pass, durationMs);
          if (!pass) passes.splice(i--, 1);
        }
      }
    });

  //Add
  exceptions
    .filter((ex) => !ex.remove)
    .forEach((ex) => {
      let startDate = moment(ex.start, 'YYYY-MM-DD HH:mm').toDate();
      let endDate = moment(ex.end, 'YYYY-MM-DD HH:mm').toDate();
      let nrOfPasses = Math.floor((endDate - startDate) / durationMs);

      passes.push({ start: startDate, end: endDate, pass_amount: nrOfPasses });
    });
};

const adjustPassToDuration = (pass, durationMs) => {
  pass.pass_amount = Math.floor((pass.end - pass.start) / durationMs);
  return pass.pass_amount < 1 ? null : pass;
};

const generatePassesFromInterval = (
  startDate,
  endDate,
  { id, weekDay, startTimeOfDaySec, endTimeOfDaySec, passCount },
) => {
  const events = [];
  const weekDayStart = moment(startDate).day();
  const dayDiff = (7 + weekDay - weekDayStart) % 7;
  let date = moment(startDate).add(dayDiff, 'days').startOf('day').unix();

  const limitDate = moment(endDate).endOf('day').unix();
  while (date < limitDate) {
    events.push({
      id: id,
      start: moment.unix(date + startTimeOfDaySec).toDate(),
      end: moment.unix(date + endTimeOfDaySec).toDate(),
      pass_amount: passCount,
    });
    date += 7 * 86400;
  }

  return events;
};

const weekdayToInt = (weekday) => {
  switch (weekday) {
    case 'sun':
      return 0;
    case 'mon':
      return 1;
    case 'tue':
      return 2;
    case 'wed':
      return 3;
    case 'thu':
      return 4;
    case 'fri':
      return 5;
    case 'sat':
      return 6;
  }
  return -1;
};

//e.g 01:00 => 3600
const timeToSeconds = (time) => (new Date('1970-01-02T' + time) - new Date('1970-01-02T00:00')) / 1000;

const getSimpleIntervals = (singeldayrepeat, intervals) => {
  return intervals.map((i) => {
    return {
      id: i.id,
      weekDay: weekdayToInt(singeldayrepeat),
      startTimeOfDaySec: timeToSeconds(i.start),
      endTimeOfDaySec: timeToSeconds(i.end),
      passCount: Number(i.pass_amount),
    };
  });
};
const getComplexIntervals = (cplxIntervals) => {
  const intervals = [];
  console.log(cplxIntervals);
  cplxIntervals.forEach((ci) => {
    intervals.push(...getSimpleIntervals(ci.day, ci.intervals));
  });
  return intervals;
};

const getIntervals = (isrepeat, singeldayrepeat, intervals) => {
  if (!isrepeat) return getSimpleIntervals(singeldayrepeat, intervals);
  return getComplexIntervals(intervals);
};

// MARK: Merge Booked Passes
const mergeBookedPasses = (bookedPasses, passes) => {
  for (let booked of bookedPasses) {
    DEBUG && console.log('Booked pass');
    mergeBookedPass(booked, passes);
  }
  passes.push(...bookedPasses);
  passes.sort((p1, p2) => p1.start - p2.start);

  return passes;
};

const isPassMatch = (pass1, pass2) => pass1.product_id === pass2.product_id;

// Merges a booked pass into an array of passes.
const mergeBookedPass = (booked, passes) => {
  // Iterate over the passes array
  for (let i = 0; i < passes.length; i++) {
    const pass = passes[i];
    // Check if the booked pass overlaps with the current pass and matches criteria
    // && isPassMatch(booked, pass) removed from if check
    // Ex: 13:00 - 11:00 && 12:00 - 13:00

    const passDate = new Date(pass.start).setHours(0, 0, 0, 0);
    const bookedDate = new Date(booked.start).setHours(0, 0, 0, 0);

    if (passDate !== bookedDate) {
      DEBUG && console.log('Pass and booking is not same date');
    } else {
      DEBUG &&
        console.log(
          'Pass Start:',
          pass.start,
          'Pass End:',
          pass.end,
          'Booked Start:',
          booked.start,
          'Booked End:',
          booked.end,
        );
      if (booked.start <= pass.start && booked.end >= pass.end) {
        DEBUG && console.log('Booking is bigger');
        passes.splice(i, 1);
        // Decrement `i` to adjust the index after removing the current item
        i--;
      } else if (pass.end >= booked.start && pass.start <= booked.end) {
        // Merge the booked pass with the current pass and replace the current pass with the result
        DEBUG && console.log('Merge Booked with pass');
        const restPasses = mergeBookedWithPass(booked, pass);
        passes.splice(i, 1, ...restPasses);
      } else if (!(pass.end >= booked.start) && pass.start <= booked.end) {
        // Booking is before the pass start
        DEBUG && console.log('Booking is before');
      } else if (pass.end >= booked.start && !(pass.start <= booked.end)) {
        // Booking is after the pass start
        DEBUG && console.log('Booking is after');
      }
    }
  }
};

// MARK: Merge booked with pass
const mergeBookedWithPass = (booked, pass) => {
  DEBUG && console.log('Merge booked with pass...');
  // Initialize an array to hold the remaining parts of the pass
  let rests = [];
  DEBUG && console.log('mergeBookedWithPass', booked.start, pass.start, booked.end, pass.end);
  // If the booked pass starts after the existing pass, create a pre-booked pass
  // Ex: 13:00 - 12:00
  if (booked.start >= pass.start) {
    DEBUG && console.log('mergeBookedWithPass-start');
    let restPrePass = { ...pass };
    restPrePass.end = booked.start;
    rests.push(restPrePass);
  }

  // If the booked pass ends before the existing pass, create a post-booked pass
  // Ex: 12:00 - 16:00
  if (booked.end <= pass.end) {
    // DEBUG && console.log('mergeBookedWithPass-end');
    let restPostPass = { ...pass };
    restPostPass.start = booked.end;
    rests.push(restPostPass);
  }

  // Fill in missing information in the booked pass
  booked.pass_set_id = pass.pass_set_id;
  booked.product = pass.product;

  // Return the array of remaining parts of the pass
  return rests;
};

// MARK: Separate Passes

const separatePasses = (passes) => {};
