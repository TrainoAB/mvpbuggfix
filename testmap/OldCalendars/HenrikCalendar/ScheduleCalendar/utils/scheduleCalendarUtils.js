import { RRule, RRuleSet, rrulestr } from 'rrule';
//date-fns imports
import { format } from 'date-fns/format';
import { parse } from 'date-fns/parse';
import { startOfWeek } from 'date-fns/startOfWeek';
import { getDay } from 'date-fns/getDay';
import { add } from 'date-fns/add';

/**
 * Creates an instance of Event.
 * @param {string} eventId - The unique identifier for the event.
 * @param {string} eventType - The type/category of the event.
 * @param {string} title - The title or name of the event.
 * @param {Date} start - The start date and time of the event.
 * @param {Date} end - The end date and time of the event.
 * @param {boolean} allDay - Indicates if the event lasts all day.
 * @param {boolean} isBooked - Indicates if the event is booked.
 */
export class Event {
  constructor(eventId, eventType, title, start, end, allDay, isBooked) {
    this.eventId = eventId;
    this.eventType = eventType;
    this.title = title;
    this.start = start;
    this.end = end;
    this.allDay = allDay;
    this.isBooked = isBooked;
  }
}

/**
 * Represents a scheduling rule.
 *
 * @class Rule
 * @param {string} ruleId - The unique identifier for the rule.
 * @param {string} intervalId - The unique identifier for the interval.
 * @param {string} ruleType - The type of the rule.
 * @param {string} rruleStr - The recurrence rule string.
 */
export class CalendarRule {
  constructor(ruleId , intervalId, ruleType, rruleStr) {
    this.ruleId = ruleId;
    this.intervalId = intervalId;
    this.ruleType = ruleType;
    this.rruleStr = rruleStr;
  }
}

/**
 * Create a new rule object
 * @param {string} ruleId - The unique identifier for the rule
 * @param {string} intervalId - The unique identifier for the interval.
 * @param {string} ruleType - The type of rule (event or exclude)
 * @param {string} rruleStr - The rrule string
 * @returns {CalendarRule} - The new CalendarRule object.
 */
export function createCalendarRuleObject(ruleId, intervalId, ruleType, rruleStr) {
  return new CalendarRule(ruleId, intervalId, ruleType, rruleStr);
}

/**
 * Get the string representation of an RRule object
 * @param {RRule} rruleObject - The RRule object
 * @returns {string} - The string representation of the RRule object
 */
export function getRRuleString(rruleObject) {
  return rruleObject.toString();
}

/**
 * Create a new RRule object
 * @param {string} freq - The frequency of the rule (DAILY, WEEKLY, MONTHLY, YEARLY)
 * @param {Date} startDate - The start date of the rule
 * @param {Date} endDate - The end date of the rule
 * @param {number} count - The number of occurrences
 * @param {number} intervals - The interval between occurrences
 * @param {Array} occuringDays - The days of the week the rule occurs
 * @returns {RRule} - The new RRule object
 */
export function createRRule(freq, startDate, endDate, count, intervals, occuringDays = []) {
  let freqency = RRule.DAILY; // default state

  switch (freq) {
    case 'DAILY':
      freqency = RRule.DAILY;
      break;
    case 'WEEKLY':
      freqency = RRule.WEEKLY;
      break;
    case 'MONTHLY':
      freqency = RRule.MONTHLY;
      break;
    case 'YEARLY':
      freqency = RRule.YEARLY;
      break;
    default:
      freqency = RRule.DAILY;
      break;
  }

  return new RRule({
    freq: freqency,
    dtstart: startDate,
    until: endDate,
    wkst: RRule.MO, // Week starts on monday
    byweekday: occuringDays,
    count: count,
    interval: intervals,
  });
}

/**
 * Generates an RRuleSet from an array of rule objects.
 *
 * @param {CalendarRule[]} rules - An array of rule objects, each containing an `rruleStr` property.
 * @returns {RRuleSet} The generated RRuleSet containing all the provided rules.
 */
export function generateEventRuleSet(rules) {
  let eventRuleSet = new RRuleSet();
  rules.forEach((rule) => {
    if(rule.ruleType === 'event') {
      let rruleStr = rrulestr(rule.rruleStr);
      console.log('Adding event rule to EventRuleSet: ', rule.rruleStr);
      eventRuleSet.rrule(rruleStr);
    }
  });
  return eventRuleSet;
}

/**
 * Generates an RRuleSet containing exclusion rules.
 * @param {CalendarRule[]} rules - An array of rule objects(!this is not a RRule object!), each containing an `rruleStr` property.
 * @returns {RRuleSet} - An RRuleSet populated with the exclusion rules.
 */
export function generateExcludeRuleSet(rules) {
  let excludeRuleSet = new RRuleSet();
  rules.forEach((rule) => {
    if(rule.ruleType === 'exclude') {
      let rruleStr = rrulestr(rule.rruleStr);
      console.log('Adding exclude rule to ExludeRuleSet: ', rule.rruleStr);
      excludeRuleSet.rrule(rruleStr);
    }
  });
  return excludeRuleSet;
}

/**
 * Creates an array of events from a given rule set.
 *
 * @param {RRuleSet} ruleSet - The rule set object containing date rules.
 * @returns {Event[]} An array of Event objects created from the rule set.
 */
export function createEventsFromRuleSet(ruleSet) {
  return ruleSet
    .all()
    .map((date, index) => new Event(`${1000 + index}`, 'event', `Interval ${index + 1}`, date, add(date, {hours: 1}), false, false));
}

/**
 * Creates an array of events to be excluded based on the provided rule set.
 *
 * @param {RRuleSet} ruleSet - The rule set containing dates to be excluded.
 * @returns {Event[]} An array of Event objects with exclusion details.
 */
export function createExcludeEventsFromRuleSet(ruleSet) {
  return ruleSet
    .all()
    .map((date, index) => new Event(`${2000 + index}`, 'exclude', `Undantag ${index + 1}`, date, date, true, false));
}

/**
 * Combines two arrays of events into one.
 *
 * @param {Event[]} events - The primary array of events.
 * @param {Event[]} excludeEvents - The array of events to be concatenated with the primary array.
 * @returns {Event[]} The combined array of events.
 */
export function combineEvents(events, excludeEvents) {
  return events.concat(excludeEvents);
}



/**
 * Converts a given date to its corresponding RRule weekday constant.
 *
 * @param {Date|string|number} date - The date to convert. Can be a Date object, a string, or a timestamp.
 * @returns {RRule.Weekday} The corresponding RRule weekday constant.
 */
export function getRRuleWeekDay(date) {
  const _date = new Date(date);
  const currentDay = _date.getDay();
  switch (currentDay) {
    case 0:
      return RRule.SU;
    case 1:
      return RRule.MO;
    case 2:
      return RRule.TU;
    case 3:
      return RRule.WE;
    case 4:
      return RRule.TH;
    case 5:
      return RRule.FR;
    case 6:
      return RRule.SA;
    default:
      return RRule.MO;
  }
}
