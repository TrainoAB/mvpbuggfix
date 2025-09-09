import { useState, useEffect } from "react";
import { useAppState } from "@/app/hooks/useAppState";
import { formatDayName, formatDuration } from "@/app/functions/functions";
import { generatePasses, formatPassAmount } from "@/app/components/Calendar/calendarfunctions";
import { RRule, rrulestr } from "rrule";
import CalendarModule from "@/app/components/Calendar/CalendarModule";
import ConfirmationModal from "./ConfirmationModal";
import Select from "react-select";
import Loader from "@/app/components/Loader";
import { add, format } from "date-fns";

import {
    CalendarRule,
    createRRule,
    createCalendarRuleObject,
    generateExcludeRuleSet,
    getRRuleWeekDay,
} from "../../HenrikCalendar/ScheduleCalendar/utils/scheduleCalendarUtils";

import "./ScheduleProduct.css";

export default function ScheduleProduct({ latest = false, user_id }) {
    const { sessionObject, baseUrl, DEBUG, API_KEY, userData } = useAppState();
    const [selectedOptions, setSelectedOptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newEvent, setNewEvent] = useState([]);
    const [confirmation, setConfirmation] = useState("");
    const [createNew, setCreateNew] = useState(latest === false);
    const [selectedPasses, setSelectedPasses] = useState([]);
    const [fetchedPasses, setFetchedSchedule] = useState([]);
    const [stripeId, setStripeId] = useState(null);
    const [hasStripeIdLoaded, setHasStripeIdLoaded] = useState(null);

    const [start, setStart] = useState("");
    const [end, setEnd] = useState("");

    const [intervalTime, setIntervalTime] = useState([]);

    const [isRepeat, setIsRepeat] = useState(false);
    const [isExceptions, setIsExceptions] = useState(false);
    const [selectedDays, setSelectedDays] = useState([]);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const [startExceptionDateTime, setStartExceptionDateTime] = useState("");
    const [endExceptionDateTime, setEndExceptionDateTime] = useState("");

    const [schedule, setSchedule] = useState({
        isRepeat: isRepeat,
        passes: [],
    });
    const [_updatedSchedule, setUpdatedSchedule] = useState([]);

    const [calendarSchedule, setCalendarSchedule] = useState([]);

    const [accordionVisibility, setAccordionVisibility] = useState(
        Array(schedule.passes ? schedule.passes.length : 0).fill(true)
    );

    const daysArray = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

    const [allProducts, setAllProducts] = useState([]);
    const [allPasses, setAllPasses] = useState([]);

    useEffect(() => {
        setLoading(true);
        const fetchUserProducts = async (user_id) => {
            try {
                const response = await fetch(`${baseUrl}/api/proxy`, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${sessionObject.token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        url: `${baseUrl}/api/products/user?onlypass=true&id=${user_id}`,
                        method: "GET",
                    }),
                });

                if (!response.ok) {
                    alert("Network response was not ok");
                    throw new Error("Network response was not ok");
                }

                const data = await response.json();

                if (data.error) {
                    throw new Error(data.error);
                } else if (data.message) {
                    alert(data.message);
                } else {
                    setAllProducts(data.data);

                    if (latest && data.data.length > 0) {
                        const passes = data.data.map((product, index) => ({
                            ...product,
                            index: index,
                            label: `${product.category_name}, ${product.duration}, ${product.address}`,
                            value: `${product.product_id}`,
                            intervals: [],
                        }));
                        // setAllPasses(passes);
                        // set the schedule dates to the first pass
                        setSchedule({
                            ...schedule,
                            passes: [passes[0]],
                        });
                        if (passes.length > 0) {
                            setSelectedPasses(passes[0]);
                        }
                    }

                    DEBUG && console.log("test", data.data);
                }
            } catch (error) {
                DEBUG && console.log(error.message);
            } finally {
                setLoading(false);
            }
        };
        fetchUserProducts(user_id);
    }, []);

    useEffect(() => {
        const passes = allProducts.map((product, index) => ({
            ...product,
            index: index,
            label: `${product.category_name}, ${product.duration},  ${product.address}`,
            value: `${product.product_id}`,
            intervals: [],
        }));
        setAllPasses(passes);
    }, [allProducts]);

    useEffect(() => {
        setLoading(true);

        const fetchTrainerSchedule = async (user_id) => {
            const allCookies = document.cookie;
            const enudata = (allCookies.match(/(?:^|;\s*)enudata=([^;]*)/) || [])[1] || "";
            try {
                const response = await fetch(`${baseUrl}/api/proxy`, {
                    method: "POST",
                    headers: {
                        xcookie: enudata,
                        Authorization: `Bearer ${sessionObject.token}`,
                        "Content-Type": "application/json",
                    },
                    credentials: "include",
                    body: JSON.stringify({
                        url: `${baseUrl}/api/schedule?trainer=true&id=${user_id}`,
                        method: "GET",
                    }),
                });

                if (!response.ok) {
                    alert("Network response was not ok");
                    throw new Error("Network response was not ok");
                }

                const data = await response.json();

                if (data.error) {
                    throw new Error(data.error);
                } else if (data.message) {
                    alert(data.message);
                } else {
                    // Construct the array/object with passes and bookings for the calendar
                    let newPasses = generatePasses(data);
                    // Set the new object
                    setCalendarSchedule(newPasses);
                    setFetchedSchedule(data);
                    DEBUG && console.log("Data fetched:", data);
                }
            } catch (error) {
                alert(error.message);
                DEBUG && console.log(error.message);
            } finally {
                setLoading(false);
            }
        };

        // Example call to the fetchTrainerSchedule function
        fetchTrainerSchedule(user_id);
    }, []);

    useEffect(() => {
        const checkUserStatus = async (user_id) => {
            try {
                DEBUG && console.log("Checking user status...");
                const response = await fetch(`${baseUrl}/api/proxy`, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${sessionObject.token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        url: `${baseUrl}/api/stripe/gettrainerstripe_id`,
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            trainer_id: user_id,
                        }),
                    }),
                });
                if (!response.ok) {
                    throw new Error("Network response was not ok");
                }

                const data = await response.json();
                DEBUG && console.log("Response:", response);
                DEBUG && console.log("User status:", data);
                DEBUG && console.log("UserData:", userData.current.email);
                setStripeId(data.stripe_id);
                setHasStripeIdLoaded(true);
            } catch (error) {
                DEBUG && console.log(error.message);
            }
        };

        checkUserStatus(user_id);
    }, [user_id]);

    async function handleCreateStripe() {
        try {
            const response = await fetch(`${baseUrl}/api/stripe/onboarding`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${sessionObject.token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: userData.current.email,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to create Stripe account");
            }

            // First, await and parse the JSON response
            const data = await response.json();
            if (data.url) {
                DEBUG && console.log("Opening URL:", data.url);
                window.open(data.url, "_blank");
            } else {
                DEBUG && console.log("No URL found in response:", data);
            }
            // Then, check if data.url exists and open it in a new tab
            if (data.url) {
                window.open(data.url, "_blank"); // Open the URL in a new tab with '_blank'
            }

            DEBUG && console.log("API call succeeded:", data);
        } catch (error) {
            DEBUG && console.log("API call failed:", error.message);
        }
    }

    const toggleAccordionVisibility = (index) => {
        setAccordionVisibility((prevVisibility) => ({
            ...prevVisibility,
            [index]: !prevVisibility[index],
        }));
    };

    const resetInsertForm = () => {
        setIsRepeat(false);
        setStartDate("");
        setSchedule("");
        setEndDate("");
        setSelectedDays([]);
        setStart("");
        setEnd("");
        setIntervalTime([]);
        setSelectedPasses([]);
    };

    // Function to select passes
    const handleChange = (selectedOptions) => {
        // Limit on 3 passes
        if (selectedOptions.length > 3) {
            alert("Du kan bara välja upp till 3 pass samtidigt.");
            return;
        }

        // Update selectedOptions state
        setSelectedOptions(selectedOptions);

        // Construct updated passes array
        const updatedPasses = selectedOptions.map((option) => ({
            ...option,
            days: option.days ? [...option.days] : [],
        }));

        // Update selectedPasses state
        setSelectedPasses(updatedPasses);

        // Update schedule state
        setSchedule((prevSchedule) => ({
            ...prevSchedule,
            user_id: user_id,
            isRepeat: isRepeat,
            passes: updatedPasses,
        }));

        // Reset form if no passes are selected
        if (updatedPasses.length === 0) {
            resetInsertForm();
        } else {
            // Update newEvent state if passes are selected
            setNewEvent((prevNewEvent) => ({
                ...prevNewEvent,
                latest: latest,
            }));
        }

        // Update selectedDays state based on the selected passes
        const selectedDays = updatedPasses.flatMap((pass) => pass.days);
        setSelectedDays(selectedDays);
    };
    // Function to handle changes in new interval input fields
    const handleIntervalChange = (sportIndex, dayIndex, field, value) => {
        setSchedule((prevSchedule) => {
            const updatedSchedule = { ...prevSchedule };
            const currentDayIntervals = updatedSchedule.passes[sportIndex].days[dayIndex];
            const newField = `newInterval${field.charAt(0).toUpperCase() + field.slice(1)}`;

            // Temporary store the new value
            const tempIntervals = { ...currentDayIntervals, [newField]: value };

            // Ensure the start time is not after the end time
            if (tempIntervals.newIntervalStart && tempIntervals.newIntervalEnd) {
                const newStartTime = new Date(`1970-01-01T${tempIntervals.newIntervalStart}:00`);
                const newEndTime = new Date(`1970-01-01T${tempIntervals.newIntervalEnd}:00`);

                // Ensure the start time is not after the end time
                if (newStartTime >= newEndTime) {
                    alert("Starttiden kan inte vara efter sluttiden.");
                    return prevSchedule;
                }

                // Check for overlapping intervals
                for (let interval of currentDayIntervals.intervals) {
                    const existingStartTime = new Date(`1970-01-01T${interval.start}:00`);
                    const existingEndTime = new Date(`1970-01-01T${interval.end}:00`);

                    if (
                        (newStartTime >= existingStartTime && newStartTime < existingEndTime) ||
                        (newEndTime > existingStartTime && newEndTime <= existingEndTime) ||
                        (newStartTime <= existingStartTime && newEndTime >= existingEndTime)
                    ) {
                        alert("Den nya intervalltiden överlappar nuvarande intervaller, byt tider.");
                        return prevSchedule;
                    }
                }
            }

            // Update the schedule with the new values
            updatedSchedule.passes[sportIndex].days[dayIndex][newField] = value;

            return updatedSchedule;
        });
    };

    // Function to add new interval to the day
    const handleAddInterval = (sportIndex, dayIndex, duration) => {
        setSchedule((prevSchedule) => {
            const updatedSchedule = { ...prevSchedule };
            const { newIntervalStart, newIntervalEnd } = updatedSchedule.passes[sportIndex].days[dayIndex];

            // Check if start or end is empty
            if (!newIntervalStart || !newIntervalEnd) {
                alert("Både start- och sluttid måste anges.");
                return prevSchedule;
            }

            const newStartTime = new Date(`1970-01-01T${newIntervalStart}:00`);
            const newEndTime = new Date(`1970-01-01T${newIntervalEnd}:00`);

            // Check if end is before start
            if (newStartTime >= newEndTime) {
                alert("Sluttiden kan inte vara före eller samma som starttiden.");
                return prevSchedule;
            }

            const passAmount = formatPassAmount(duration, newIntervalStart, newIntervalEnd);

            DEBUG &&
                console.log(
                    "Duration:",
                    duration,
                    "Start:",
                    newIntervalStart,
                    "End:",
                    newIntervalEnd,
                    "Pass amount",
                    passAmount
                );

            // Add the new interval
            updatedSchedule.passes[sportIndex].days[dayIndex].intervals.push({
                start: newIntervalStart,
                end: newIntervalEnd,
                pass_amount: passAmount,
            });

            // Sort the intervals by start time
            updatedSchedule.passes[sportIndex].days[dayIndex].intervals.sort((a, b) => {
                const startA = new Date(`1970-01-01T${a.start}:00`);
                const startB = new Date(`1970-01-01T${b.start}:00`);
                return startA - startB;
            });

            // Reset the input fields
            updatedSchedule.passes[sportIndex].days[dayIndex].newIntervalStart = "";
            updatedSchedule.passes[sportIndex].days[dayIndex].newIntervalEnd = "";
            return updatedSchedule;
        });
    };

    // Function to delete an interval from the day
    const handleDeleteInterval = (sportIndex, dayIndex, intervalIndex) => {
        setSchedule((prevSchedule) => {
            const updatedSchedule = { ...prevSchedule };
            updatedSchedule.passes[sportIndex].days[dayIndex].intervals.splice(intervalIndex, 1);
            return updatedSchedule;
        });
    };

    const handleDeleteException = (index) => {
        setSchedule((prevSchedule) => {
            const newExceptions = [...prevSchedule.exceptions];
            newExceptions.splice(index, 1);
            return {
                ...prevSchedule,
                exceptions: newExceptions,
            };
        });
    };

    // Handle intervals when days are not repeating
    const handleSingleIntervalChange = (sportIndex, type, value) => {
        setSchedule((prevSchedule) => {
            const updatedSchedule = { ...prevSchedule };
            const newIntervalType = `newInterval${type.charAt(0).toUpperCase() + type.slice(1)}`;

            // Update the new interval value
            updatedSchedule.passes[sportIndex].intervals[newIntervalType] = value;

            // Check if the new interval is valid
            const { newIntervalStart, newIntervalEnd } = updatedSchedule.passes[sportIndex].intervals;
            if (newIntervalStart && newIntervalEnd) {
                // Ensure end time is not before start time
                const newStartTime = new Date(`1970-01-01T${newIntervalStart}:00`);
                const newEndTime = new Date(`1970-01-01T${newIntervalEnd}:00`);

                // Check if end is before start
                if (newStartTime >= newEndTime) {
                    alert("Sluttiden kan inte vara före eller samma som starttiden.");
                    return prevSchedule;
                }

                // Check for overlap with existing intervals
                const overlaps = updatedSchedule.passes[sportIndex].intervals.some((interval) => {
                    return !(newIntervalEnd <= interval.start || newIntervalStart >= interval.end);
                });

                if (overlaps) {
                    // Handle error: new interval overlaps with existing intervals
                    alert("De nya intervalltiderna kan inte överlappa nuvarande intervalltider.");
                    return prevSchedule; // Do not update schedule if validation fails
                }
            }

            return updatedSchedule;
        });
    };

    const handleAddSingleInterval = (sportIndex, duration) => {
        setSchedule((prevSchedule) => {
            const updatedSchedule = { ...prevSchedule };
            const { newIntervalStart, newIntervalEnd } = updatedSchedule.passes[sportIndex].intervals;

            // Check if start and end times are not empty
            if (!newIntervalStart || !newIntervalEnd) {
                updatedSchedule.passes[sportIndex].intervals.newIntervalStart = "";
                updatedSchedule.passes[sportIndex].intervals.newIntervalEnd = "";
                alert("Du måste sätta både start och sluttid.");
                return prevSchedule; // Do not update schedule if validation fails
            }

            const newStartTime = new Date(`1970-01-01T${newIntervalStart}:00`);
            const newEndTime = new Date(`1970-01-01T${newIntervalEnd}:00`);

            // Check if end is before start
            if (newStartTime >= newEndTime) {
                alert("Sluttiden kan inte vara före eller samma som starttiden.");
                return prevSchedule;
            }

            // Check if the new interval overlaps with existing intervals
            const overlaps = updatedSchedule.passes[sportIndex].intervals.some((interval) => {
                return !(newIntervalEnd <= interval.start || newIntervalStart >= interval.end);
            });

            if (overlaps) {
                updatedSchedule.passes[sportIndex].intervals.newIntervalStart = "";
                updatedSchedule.passes[sportIndex].intervals.newIntervalEnd = "";
                alert("Den nya intervall tiden överlappar tidigare intervaller, byt tid.");
                return prevSchedule; // Do not update schedule if validation fails
            }

            const passAmount = formatPassAmount(duration, newIntervalStart, newIntervalEnd);

            DEBUG &&
                console.log(
                    "Duration:",
                    duration,
                    "Start:",
                    newIntervalStart,
                    "End:",
                    newIntervalEnd,
                    "Pass amount:",
                    passAmount
                );

            // Add the new interval if validations pass
            updatedSchedule.passes[sportIndex].intervals.push({
                start: newIntervalStart,
                end: newIntervalEnd,
                pass_amount: passAmount,
            });

            // Sort the intervals by start time
            updatedSchedule.passes[sportIndex].intervals.sort((a, b) => {
                const startA = new Date(`1970-01-01T${a.start}:00`);
                const startB = new Date(`1970-01-01T${b.start}:00`);
                return startA - startB;
            });

            // Reset the new interval fields
            updatedSchedule.passes[sportIndex].intervals.newIntervalStart = "";
            updatedSchedule.passes[sportIndex].intervals.newIntervalEnd = "";

            return updatedSchedule;
        });
    };

    const handleSingleDeleteInterval = (sportIndex, intervalIndex) => {
        setSchedule((prevSchedule) => {
            const updatedSchedule = { ...prevSchedule };
            updatedSchedule.passes[sportIndex].intervals = updatedSchedule.passes[sportIndex].intervals.filter(
                (_, index) => index !== intervalIndex
            );
            return updatedSchedule;
        });
    };

    // Function to add new exception
    const handleAddException = () => {
        if (startExceptionDateTime && endExceptionDateTime) {
            const newStart = new Date(startExceptionDateTime);
            const newEnd = new Date(endExceptionDateTime);

            // Check if the end date is before the start date
            if (newEnd <= newStart) {
                alert("Slutdatum kan inte vara före startdatum.");
                return;
            }

            // Check for overlapping exceptions
            const isOverlapping = schedule.exceptions.some((exception) => {
                const existingStart = new Date(exception.start.replace(" ", "T"));
                const existingEnd = new Date(exception.end.replace(" ", "T"));

                return newStart < existingEnd && newEnd > existingStart;
            });

            if (isOverlapping) {
                alert("Den nya undantaget överlappar med ett befintligt undantag.");
                return;
            }

            const newException = {
                start: newStart.toISOString().replace("T", " ").split(".")[0],
                end: newEnd.toISOString().replace("T", " ").split(".")[0],
            };

            setSchedule((prevSchedule) => ({
                ...prevSchedule,
                exceptions: [...prevSchedule.exceptions, newException],
            }));

            // Clear the input fields
            setStartExceptionDateTime("");
            setEndExceptionDateTime("");
        } else {
            alert("Du behöver fylla i båda start och slut datum.");
        }
    };

    const handleResetEndDate = () => {
        setEndDate("");

        setSchedule((prevSchedule) => {
            // Destructure the previous schedule object excluding 'endData'
            const { endData, ...updatedSchedule } = prevSchedule;
            return updatedSchedule;
        });
    };

    // Function to handle checkbox change for isRepeat
    const handleCheckboxChange = (e) => {
        const isChecked = e.target.checked;
        setIsRepeat(isChecked);
        setSchedule((prevSchedule) => ({
            ...prevSchedule,
            isRepeat: isChecked,
            passes: prevSchedule.passes.map((pass) => ({
                ...pass,
                intervals: [],
            })),
        }));

        if (!isChecked) {
            setSelectedDays([]);
            // Remove all days records
            setSchedule((prevSchedule) => ({
                ...prevSchedule,
                passes: prevSchedule.passes.map((pass) => ({
                    ...pass,
                    days: pass.days ? [] : pass.days, // Set days to empty array if it exists
                })),
            }));
        }
    };

    // Function to handle checkbox change for isRepeat
    const handleCheckboxChangeExceptions = (e) => {
        const isChecked = e.target.checked;
        setIsExceptions(isChecked);
        setSchedule((prevSchedule) => ({
            ...prevSchedule,
            exceptions: [],
        }));

        if (!isChecked) {
            setIsExceptions(isChecked);
            // Remove exceptions
            setSchedule((prevSchedule) => {
                const { exceptions, ...rest } = prevSchedule; // Destructure to exclude exceptions
                return rest;
            });
        }
    };

    //  Handle select repeated days
    const handleDayCheckboxChange = (sportIndex, day) => {
        setSchedule((prevSchedule) => {
            const newSchedule = { ...prevSchedule };
            const sportData = newSchedule.passes[sportIndex] || { days: [] };

            // Check if the day is already in the selected days array
            const existingDayIndex = sportData.days && sportData.days.findIndex((d) => d.day === day);

            if (existingDayIndex !== -1 && sportData.days) {
                sportData.days.splice(existingDayIndex, 1);
            } else {
                // Add the day with an empty intervals array
                sportData.days = sportData.days || [];
                sportData.days.push({ day, intervals: [] });
            }

            // Define the order of days
            const dayOrder = daysArray;

            // Sort the days according to the predefined order
            sportData.days.sort((a, b) => dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day));

            // Update the schedule with the modified sportData
            newSchedule.passes[sportIndex] = sportData;
            return newSchedule;
        });
    };

    const handleStartDate = (event) => {
        const newStartDate = event.target.value;
        const today = new Date().toISOString().split("T")[0]; // Get today's date in 'YYYY-MM-DD' format

        // Ensure startDate is not before today
        if (newStartDate < today) {
            alert("Startdatum kan inte vara före dagens datum.");
            return;
        }

        // Ensure startDate is not set if it makes it after a non-empty endDate
        if (endDate && newStartDate > endDate) {
            alert("Startdatum kan inte vara efter slutdatum.");
            return;
        }

        setStartDate(newStartDate);
        setSchedule((prevSchedule) => ({
            ...prevSchedule,
            startDate: newStartDate,
        }));
        DEBUG && console.log("Set new startdate:", newStartDate);
    };

    const handleEndDate = (event) => {
        const newEndDate = event.target.value;

        // Check if the start date is set
        if (!startDate) {
            alert("Startdatum måste vara satt innan sluttiden kan ställas in.");
            return;
        }
        // Ensure endDate is not set if it makes it before startDate
        if (newEndDate && newEndDate < startDate) {
            alert("Slutdatum kan inte vara före startdatum.");
            return;
        }

        setEndDate(newEndDate);
        setSchedule((prevSchedule) => ({
            ...prevSchedule,
            endDate: newEndDate,
        }));
        DEBUG && console.log("Set new enddate:", newEndDate);
    };

    const validateDates = (selectedDays, startDate, endDate) => {
        // Map string days to their respective numeric values
        const dayMap = {
            sun: 0,
            mon: 1,
            tue: 2,
            wed: 3,
            thu: 4,
            fri: 5,
            sat: 6,
        };

        // Convert the selectedDays strings to their numeric equivalents
        const selectedDaysNumeric = selectedDays.map((day) => dayMap[day.toLowerCase()]);

        // Convert startDate and endDate to Date objects
        startDate = new Date(startDate);
        endDate = new Date(endDate);

        // Calculate the difference in days between startDate and endDate
        const timeDifference = endDate - startDate;
        const dayDifference = timeDifference / (1000 * 3600 * 24);

        // Check if the difference is at least the number of selectedDays
        if (dayDifference < selectedDaysNumeric.length) {
            return false;
        }

        // Iterate through each day in the date range and check if it matches the selectedDays
        const currentDay = new Date(startDate);
        const selectedDaysSet = new Set(selectedDaysNumeric);
        let validDaysCount = 0;

        while (currentDay <= endDate) {
            if (selectedDaysSet.has(currentDay.getDay())) {
                validDaysCount++;
            }
            currentDay.setDate(currentDay.getDate() + 1);
        }

        // Check if the number of valid days in the range matches the length of selectedDays
        return validDaysCount === selectedDaysNumeric.length;
    };

    const saveScheduleProduct = async (schedule) => {
        setLoading(true);
        try {
            const response = await fetch(`${baseUrl}/api/proxy`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${sessionObject.token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    url: `${baseUrl}/api/schedule/createpass`,
                    method: "POST",
                    body: JSON.stringify(schedule),
                }),
            });

            if (!response.ok) {
                setLoading(false);
                alert("Network response was not ok");
                throw new Error("Network response was not ok");
            }

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            } else if (data.message) {
                alert(data.message);
            } else {
                setConfirmation("success");
                DEBUG && console.log("Saved successfully!");
            }
        } catch (error) {
            DEBUG && console.log(error.message);
            throw new Error(error.message, "Error");
        } finally {
            setLoading(false);
        }
    };

    // MARK: Create pass
    function createPass() {
        if (isRepeat) {
            if (schedule.passes.every((pass) => pass.days.length === 0)) {
                alert("När du valt att repetera dagar bör du välja minst en dag.");
                return;
            }

            if (endDate) {
                const daysValid = validateDates(selectedDays, startDate, endDate);
                if (!daysValid) {
                    alert("För att repetera dessa dagar behöver du ett senare slutdatum.");
                    return;
                }
            }
        }

        if (hasOverlappingTimes(schedule, isRepeat)) {
            alert("Du kan inte lägga in dessa träningspass samtidigt då dem inte har samma adress.");
            return;
        }

        let updatedSchedule = { ...schedule };

        // Clone passes array and remove newIntervalStart and newIntervalEnd from intervals
        updatedSchedule.passes = updatedSchedule.passes.map((pass) => {
            const updatedPass = { ...pass };
            updatedPass.intervals = updatedPass.intervals.map((interval) => {
                const { newIntervalStart, newIntervalEnd, ...intervalWithoutNewIntervals } = interval;
                return intervalWithoutNewIntervals;
            });

            if (isRepeat) {
                updatedPass.days = updatedPass.days.map((day) => {
                    const { newIntervalStart, newIntervalEnd, ...dayWithoutNewIntervals } = day;
                    return dayWithoutNewIntervals;
                });
            }
            return updatedPass;
        });

        if (!isRepeat) {
            if (schedule.passes[0].intervals) {
                DEBUG && console.log("Intervals found. Adding unique ids to intervals");
                // Generate unique ids for each interval
                let intervals = schedule.passes[0].intervals;
                intervals.forEach((interval) => {
                    let generatedId = crypto.randomUUID();
                    interval.id = generatedId;
                });
            }

            if (schedule.exceptions) {
                DEBUG && console.log("Exceptions found. Adding unique ids to exceptions.");
                // generate unique ids for exceptions
                let exceptions = schedule.exceptions;
                exceptions.forEach((exception) => {
                    let generatedId = crypto.randomUUID();
                    exception.id = generatedId;
                });
            }

            //create rules from schedule intervals
            if (schedule.passes) {
                DEBUG && console.log("schedule passes found!", schedule.passes);
                const passStartDate = new Date(startDate);
                let passEndDate;
                if ((endDate === "") | (startDate === undefined)) {
                    const newEndDate = add(passStartDate, { days: 90 });
                    DEBUG && console.log("No end date found. Adding 90 days to start date.");
                    passEndDate = newEndDate;
                    updatedSchedule = { ...updatedSchedule, endDate: format(newEndDate, "yyyy-MM-dd") };
                } else {
                    passEndDate = new Date(endDate);
                }

                const amountOfWeeks = Math.floor((passEndDate - passStartDate) / (7 * 24 * 60 * 60 * 1000));
                const currentDay = getRRuleWeekDay(passStartDate.getDay());

                let intervalRules = [];
                schedule.passes[0].intervals.forEach((interval) => {
                    const passAmount = formatPassAmount(schedule.passes[0].duration, interval.start, interval.end);
                    const formattedIntervalStartDate = new Date(
                        Date.UTC(
                            passStartDate.getFullYear(),
                            passStartDate.getMonth(),
                            passStartDate.getDate(),
                            interval.start.split(":")[0],
                            interval.start.split(":")[1]
                        )
                    );
                    const formattedIntervalEndDate = new Date(
                        Date.UTC(
                            passEndDate.getFullYear(),
                            passEndDate.getMonth(),
                            passEndDate.getDate(),
                            interval.end.split(":")[0],
                            interval.end.split(":")[1]
                        )
                    );

                    const intervalRRule = new RRule({
                        freq: RRule.WEEKLY,
                        wkst: RRule.MO,
                        byweekday: currentDay,
                        dtstart: formattedIntervalStartDate,
                        until: formattedIntervalEndDate,
                        count: passAmount,
                        interval: amountOfWeeks,
                    });
                    const intervalRRuleString = intervalRRule.toString();
                    const calendarRule = createCalendarRuleObject(
                        crypto.randomUUID(),
                        interval.id,
                        "interval",
                        intervalRRuleString
                    );
                    intervalRules.push(calendarRule);
                });
                updatedSchedule = { ...updatedSchedule, intervalRules: intervalRules }; //Update schedule with interval rules
                setUpdatedSchedule(updatedSchedule);
            }

            //create exlude rules from exceptions
            if (schedule.exceptions) {
                DEBUG && console.log("exceptions found!", schedule.exceptions);
                let exceptionRules = [];
                schedule.exceptions.forEach((exception) => {
                    const exceptionStartDate = new Date(exception.start);
                    const exceptionEndDate = new Date(exception.end);
                    const formattedStartDate = exceptionStartDate
                        .toISOString()
                        .replace(/[-:]/g, "")
                        .replace(/\.\d{3}/, "")
                        .replace(/T/, "T");
                    const formattedEndDate = exceptionEndDate
                        .toISOString()
                        .replace(/[-:]/g, "")
                        .replace(/\.\d{3}/, "")
                        .replace(/T/, "T");

                    const exceptionRRuleString = `DTSTART:${formattedStartDate}\nRRULE:FREQ=DAILY;UNTIL=${formattedEndDate};WKST=MO`;
                    const exceptionRRuleObject = rrulestr(exceptionRRuleString);

                    const calendarExceptionRule = createCalendarRuleObject(
                        crypto.randomUUID(),
                        exception.id,
                        "exception",
                        exceptionRRuleObject.toString()
                    );
                    exceptionRules.push(calendarExceptionRule);
                });
                updatedSchedule = { ...updatedSchedule, exceptionRules: exceptionRules }; //Update schedule with exception rules
                setUpdatedSchedule(updatedSchedule);
            }
        }

        if (isRepeat) {
            const passStartDate = new Date(startDate);
            let passEndDate;
            if ((endDate === "") | (startDate === undefined)) {
                const newEndDate = add(passStartDate, { days: 90 });
                DEBUG && console.log("No end date found. Adding 90 days to start date.");
                passEndDate = newEndDate;
                updatedSchedule = { ...updatedSchedule, endDate: format(newEndDate, "yyyy-MM-dd") };
            } else {
                passEndDate = new Date(endDate);
            }

            const amountOfWeeks = Math.floor((passEndDate - passStartDate) / (7 * 24 * 60 * 60 * 1000));

            let intervalRules = [];
            //going through each day in the schedule
            schedule.passes[0].days.forEach((day) => {
                //generate unique ids for each interval
                let dayInterval = day.intervals;
                let generatedId = crypto.randomUUID();
                dayInterval.forEach((interval) => {
                    interval.id = generatedId;
                });
                const passAmount = formatPassAmount(
                    schedule.passes[0].duration,
                    dayInterval[0].start,
                    dayInterval[0].end
                );
                const formattedIntervalStartDate = new Date(
                    Date.UTC(
                        passStartDate.getFullYear(),
                        passStartDate.getMonth(),
                        passStartDate.getDate(),
                        dayInterval[0].start.split(":")[0],
                        dayInterval[0].start.split(":")[1]
                    )
                );
                const formattedIntervalEndDate = new Date(
                    Date.UTC(
                        passEndDate.getFullYear(),
                        passEndDate.getMonth(),
                        passEndDate.getDate(),
                        dayInterval[0].end.split(":")[0],
                        dayInterval[0].end.split(":")[1]
                    )
                );

                const intervalRRule = new RRule({
                    freq: RRule.WEEKLY,
                    wkst: RRule.MO,
                    byweekday: getRRuleWeekDay(day.day),
                    dtstart: formattedIntervalStartDate,
                    until: formattedIntervalEndDate,
                    count: passAmount,
                    interval: amountOfWeeks,
                });
                const intervalRRuleString = intervalRRule.toString();
                const calendarRule = createCalendarRuleObject(
                    crypto.randomUUID(),
                    generatedId,
                    "interval",
                    intervalRRuleString
                );
                intervalRules.push(calendarRule);
            });
            updatedSchedule = { ...updatedSchedule, intervalRules: intervalRules }; //Update schedule with interval rules

            //exceptions
            if (schedule.exceptions) {
                DEBUG && console.log("exceptions found!", schedule.exceptions);

                //generate unique ids for exceptions
                let exceptions = schedule.exceptions;
                exceptions.forEach((exception) => {
                    let generatedId = crypto.randomUUID();
                    exception.id = generatedId;
                });

                let exceptionRules = [];
                schedule.exceptions.forEach((exception) => {
                    const exceptionStartDate = new Date(exception.start);
                    const exceptionEndDate = new Date(exception.end);
                    const formattedStartDate = exceptionStartDate
                        .toISOString()
                        .replace(/[-:]/g, "")
                        .replace(/\.\d{3}/, "")
                        .replace(/T/, "T");
                    const formattedEndDate = exceptionEndDate
                        .toISOString()
                        .replace(/[-:]/g, "")
                        .replace(/\.\d{3}/, "")
                        .replace(/T/, "T");

                    const exceptionRRuleString = `DTSTART:${formattedStartDate}\nRRULE:FREQ=DAILY;UNTIL=${formattedEndDate};WKST=MO`;
                    const exceptionRRuleObject = rrulestr(exceptionRRuleString);

                    const calendarExceptionRule = createCalendarRuleObject(
                        crypto.randomUUID(),
                        exception.id,
                        "exception",
                        exceptionRRuleObject.toString()
                    );
                    exceptionRules.push(calendarExceptionRule);
                });
                updatedSchedule = { ...updatedSchedule, exceptionRules: exceptionRules }; //Update schedule with exception rules
                setUpdatedSchedule(updatedSchedule);
            }
        }
        setUpdatedSchedule(updatedSchedule);
        DEBUG && console.log("Updated schedule:", updatedSchedule);

        return; // TODO: Remove this

        saveScheduleProduct(_updatedSchedule);
        resetInsertForm();
    }

    function hasOverlappingTimes(schedule, ifRepeat) {
        const passes = schedule.passes;
        const overlappingIndices = [];

        // Helper function to check if two time intervals overlap
        function timesOverlap(t1, t2) {
            return t1.start < t2.end && t2.start < t1.end;
        }

        // Helper function to check for overlaps within a single pass
        function checkOverlapWithinPass(pass) {
            const times = ifRepeat ? pass.days : pass.intervals;
            for (let i = 0; i < times.length; i++) {
                for (let j = i + 1; j < times.length; j++) {
                    if (timesOverlap(times[i], times[j])) {
                        return true;
                    }
                }
            }
            return false;
        }

        // Check for overlaps between different passes
        for (let i = 0; i < passes.length; i++) {
            for (let j = i + 1; j < passes.length; j++) {
                const times1 = ifRepeat ? passes[i].days : passes[i].intervals;
                const times2 = ifRepeat ? passes[j].days : passes[j].intervals;

                for (const t1 of times1) {
                    for (const t2 of times2) {
                        if (timesOverlap(t1, t2)) {
                            overlappingIndices.push(i, j);
                            break;
                        }
                    }
                }
            }
        }

        // Remove duplicate indices
        const uniqueOverlappingIndices = [...new Set(overlappingIndices)];

        if (uniqueOverlappingIndices.length > 0) {
            // Check if any overlapping passes have the same address
            for (let i = 0; i < uniqueOverlappingIndices.length; i++) {
                for (let j = i + 1; j < uniqueOverlappingIndices.length; j++) {
                    if (passes[uniqueOverlappingIndices[i]].address === passes[uniqueOverlappingIndices[j]].address) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    // Check that all intervals is set before showing save button
    const allIntervalsSet = () => {
        return schedule.passes.every((pass) => {
            if (isRepeat) {
                return (
                    pass.days &&
                    pass.days.length > 0 &&
                    pass.days.every((day) => day.intervals && day.intervals.length > 0)
                );
            } else {
                return pass.intervals && pass.intervals.length > 0;
            }
        });
    };

    // MARK: Markup
    return (
        <>
            <main id="schedule-product">
                {confirmation !== "" && <ConfirmationModal type={confirmation} onClose={setConfirmation} />}
                <div className="scrollcontainer">
                    <div className="content">
                        {loading ? (
                            <Loader />
                        ) : (
                            <>
                                <div className="content">
                                    {!createNew ? (
                                        <>
                                            <h3>Välj skapade pass</h3>
                                            <div className="input-group">
                                                {/* Select multiple pass */}
                                                <Select
                                                    id="select_passes"
                                                    isMulti
                                                    options={allPasses}
                                                    value={selectedPasses}
                                                    onChange={handleChange}
                                                    className="custom-select-container"
                                                    classNamePrefix="custom-select"
                                                />
                                            </div>

                                            {/* If one or more passes selected */}
                                            {schedule && schedule.passes && schedule.passes.length > 0 && (
                                                <>
                                                    <div className="grid2">
                                                        <div className="input-group">
                                                            <label htmlFor="startdate">Startdatum</label>
                                                            <input
                                                                id="startdate"
                                                                type="date"
                                                                value={startDate}
                                                                onChange={handleStartDate}
                                                            />
                                                        </div>
                                                        <div className="input-group">
                                                            <label htmlFor="endate">Slutdatum</label>
                                                            <input
                                                                id="endate"
                                                                type="date"
                                                                value={endDate}
                                                                onChange={handleEndDate}
                                                            />
                                                        </div>
                                                    </div>
                                                    {endDate && (
                                                        <button
                                                            className="button onlytext"
                                                            onClick={handleResetEndDate}
                                                        >
                                                            Ta bort sluttid
                                                        </button>
                                                    )}
                                                    {!endDate && (
                                                        <p className="explain">
                                                            Om du inte väljer ett slutdatum, fortsätter detta
                                                            automatiskt tills du tar bort det.
                                                        </p>
                                                    )}

                                                    {schedule &&
                                                        schedule.passes.length > 0 &&
                                                        startDate &&
                                                        startDate !== "" && (
                                                            <>
                                                                <div className="input-group">
                                                                    <div className="checkboxes">
                                                                        <label
                                                                            htmlFor="repeat"
                                                                            className={`customcheckboxcontainer ${
                                                                                isRepeat ? "checked-label" : ""
                                                                            }`}
                                                                        >
                                                                            <input
                                                                                className="hiddencheckbox"
                                                                                type="checkbox"
                                                                                id="repeat"
                                                                                checked={isRepeat}
                                                                                onChange={handleCheckboxChange}
                                                                            />
                                                                            <span className="customcheckbox"></span>
                                                                            Repetera dagar
                                                                        </label>
                                                                    </div>
                                                                </div>
                                                                {!isRepeat && (
                                                                    <p className="explain">
                                                                        Om du inte väljer repetera dagar, och inget
                                                                        slutdatum, så repeteras den dagen du valt som
                                                                        startdatum tills du stänger av det.
                                                                    </p>
                                                                )}
                                                            </>
                                                        )}

                                                    {startDate &&
                                                        startDate !== "" &&
                                                        schedule &&
                                                        schedule.passes.length > 0 &&
                                                        schedule.passes.map((sport, sportIndex) => (
                                                            <div key={sportIndex} className="sport">
                                                                <div
                                                                    className="calendar-sport-container"
                                                                    onClick={() =>
                                                                        toggleAccordionVisibility(sportIndex)
                                                                    }
                                                                >
                                                                    <h3>
                                                                        {sport.category_name +
                                                                            ", " +
                                                                            sport.duration +
                                                                            "min "}
                                                                        <span>{sport.address}</span>
                                                                    </h3>

                                                                    {accordionVisibility[sportIndex] ? (
                                                                        <div className="chev-left"></div>
                                                                    ) : (
                                                                        <div className="chev-down"></div>
                                                                    )}
                                                                </div>
                                                                {!accordionVisibility[sportIndex] && (
                                                                    <div className="accordion">
                                                                        {isRepeat && (
                                                                            <div className="checkboxes">
                                                                                <div className="daysgrid">
                                                                                    {daysArray.map((day) => {
                                                                                        // Find the day object in schedule.passes[sportIndex].days
                                                                                        const dayObject =
                                                                                            schedule.passes[sportIndex]
                                                                                                ?.days &&
                                                                                            schedule.passes[
                                                                                                sportIndex
                                                                                            ].days.find(
                                                                                                (d) => d.day === day
                                                                                            );

                                                                                        return (
                                                                                            <div
                                                                                                key={day}
                                                                                                className="gridinput"
                                                                                            >
                                                                                                <label
                                                                                                    htmlFor={day}
                                                                                                    className={
                                                                                                        dayObject
                                                                                                            ? "checked-label"
                                                                                                            : ""
                                                                                                    }
                                                                                                >
                                                                                                    <input
                                                                                                        className="hiddencheckbox"
                                                                                                        type="checkbox"
                                                                                                        id={day}
                                                                                                        checked={
                                                                                                            dayObject !==
                                                                                                            undefined
                                                                                                        }
                                                                                                        onChange={() =>
                                                                                                            handleDayCheckboxChange(
                                                                                                                sportIndex,
                                                                                                                day
                                                                                                            )
                                                                                                        }
                                                                                                    />
                                                                                                    <span className="customdaycheck"></span>
                                                                                                    {formatDayName(
                                                                                                        day,
                                                                                                        "short"
                                                                                                    )}
                                                                                                </label>
                                                                                            </div>
                                                                                        );
                                                                                    })}
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                        {isRepeat &&
                                                                            schedule.passes[sportIndex]?.days &&
                                                                            schedule.passes[sportIndex].days.length >
                                                                                0 && (
                                                                                <>
                                                                                    {schedule.passes[
                                                                                        sportIndex
                                                                                    ].days.map((day, dayIndex) => (
                                                                                        <div
                                                                                            key={dayIndex}
                                                                                            className="dayinterval"
                                                                                        >
                                                                                            <h5>
                                                                                                {formatDayName(
                                                                                                    day.day,
                                                                                                    "longer"
                                                                                                )}
                                                                                            </h5>
                                                                                            <div>
                                                                                                <div className="grid3">
                                                                                                    <div className="input-group">
                                                                                                        <label
                                                                                                            htmlFor={`start-${dayIndex}`}
                                                                                                        >
                                                                                                            Start
                                                                                                        </label>
                                                                                                        <input
                                                                                                            type="time"
                                                                                                            id={`start-${dayIndex}`}
                                                                                                            value={
                                                                                                                day.newIntervalStart ||
                                                                                                                ""
                                                                                                            }
                                                                                                            onChange={(
                                                                                                                e
                                                                                                            ) =>
                                                                                                                handleIntervalChange(
                                                                                                                    sportIndex,
                                                                                                                    dayIndex,
                                                                                                                    "start",
                                                                                                                    e
                                                                                                                        .target
                                                                                                                        .value
                                                                                                                )
                                                                                                            }
                                                                                                        />
                                                                                                    </div>
                                                                                                    <div className="input-group">
                                                                                                        <label
                                                                                                            htmlFor={`end-${dayIndex}`}
                                                                                                        >
                                                                                                            Slut
                                                                                                        </label>
                                                                                                        <input
                                                                                                            type="time"
                                                                                                            id={`end-${dayIndex}`}
                                                                                                            value={
                                                                                                                day.newIntervalEnd ||
                                                                                                                ""
                                                                                                            }
                                                                                                            onChange={(
                                                                                                                e
                                                                                                            ) =>
                                                                                                                handleIntervalChange(
                                                                                                                    sportIndex,
                                                                                                                    dayIndex,
                                                                                                                    "end",
                                                                                                                    e
                                                                                                                        .target
                                                                                                                        .value
                                                                                                                )
                                                                                                            }
                                                                                                        />
                                                                                                    </div>
                                                                                                    <button
                                                                                                        className="button"
                                                                                                        onClick={() =>
                                                                                                            handleAddInterval(
                                                                                                                sportIndex,
                                                                                                                dayIndex,
                                                                                                                schedule
                                                                                                                    .passes[
                                                                                                                    sportIndex
                                                                                                                ]
                                                                                                                    .duration
                                                                                                            )
                                                                                                        }
                                                                                                    >
                                                                                                        +
                                                                                                    </button>
                                                                                                </div>

                                                                                                {day.intervals.length >
                                                                                                    0 && (
                                                                                                    <ul className="intervals">
                                                                                                        {day.intervals.map(
                                                                                                            (
                                                                                                                interval,
                                                                                                                intervalIndex
                                                                                                            ) => (
                                                                                                                <li
                                                                                                                    key={
                                                                                                                        intervalIndex
                                                                                                                    }
                                                                                                                >
                                                                                                                    {
                                                                                                                        interval.start
                                                                                                                    }{" "}
                                                                                                                    -{" "}
                                                                                                                    {
                                                                                                                        interval.end
                                                                                                                    }{" "}
                                                                                                                    <span>
                                                                                                                        {formatDuration(
                                                                                                                            interval.start,
                                                                                                                            interval.end
                                                                                                                        ) +
                                                                                                                            " "}
                                                                                                                        <strong>
                                                                                                                            {interval.pass_amount +
                                                                                                                                " pass"}
                                                                                                                        </strong>
                                                                                                                    </span>
                                                                                                                    <button
                                                                                                                        onClick={() =>
                                                                                                                            handleDeleteInterval(
                                                                                                                                sportIndex,
                                                                                                                                dayIndex,
                                                                                                                                intervalIndex
                                                                                                                            )
                                                                                                                        }
                                                                                                                    >
                                                                                                                        x
                                                                                                                    </button>
                                                                                                                </li>
                                                                                                            )
                                                                                                        )}
                                                                                                    </ul>
                                                                                                )}
                                                                                            </div>
                                                                                        </div>
                                                                                    ))}
                                                                                </>
                                                                            )}

                                                                        {!isRepeat && (
                                                                            <div>
                                                                                <div className="grid3" key={sportIndex}>
                                                                                    <div className="input-group">
                                                                                        <label
                                                                                            htmlFor={`start-${sportIndex}`}
                                                                                        >
                                                                                            Start
                                                                                        </label>
                                                                                        <input
                                                                                            type="time"
                                                                                            id={`start-${sportIndex}`}
                                                                                            value={
                                                                                                sport.intervals
                                                                                                    .newIntervalStart ||
                                                                                                ""
                                                                                            }
                                                                                            onChange={(e) =>
                                                                                                handleSingleIntervalChange(
                                                                                                    sportIndex,
                                                                                                    "start",
                                                                                                    e.target.value
                                                                                                )
                                                                                            }
                                                                                        />
                                                                                    </div>
                                                                                    <div className="input-group">
                                                                                        <label
                                                                                            htmlFor={`end-${sportIndex}`}
                                                                                        >
                                                                                            Slut
                                                                                        </label>
                                                                                        <input
                                                                                            type="time"
                                                                                            id={`end-${sportIndex}`}
                                                                                            value={
                                                                                                sport.intervals
                                                                                                    .newIntervalEnd ||
                                                                                                ""
                                                                                            }
                                                                                            onChange={(e) =>
                                                                                                handleSingleIntervalChange(
                                                                                                    sportIndex,
                                                                                                    "end",
                                                                                                    e.target.value
                                                                                                )
                                                                                            }
                                                                                        />
                                                                                    </div>
                                                                                    <button
                                                                                        className="button"
                                                                                        onClick={() =>
                                                                                            handleAddSingleInterval(
                                                                                                sportIndex,
                                                                                                sport.duration
                                                                                            )
                                                                                        }
                                                                                    >
                                                                                        +
                                                                                    </button>
                                                                                </div>

                                                                                {sport.intervals.length > 0 && (
                                                                                    <ul className="intervals">
                                                                                        {sport.intervals.map(
                                                                                            (
                                                                                                interval,
                                                                                                intervalIndex
                                                                                            ) => (
                                                                                                <li key={intervalIndex}>
                                                                                                    {interval.start} -{" "}
                                                                                                    {interval.end}{" "}
                                                                                                    <span>
                                                                                                        {formatDuration(
                                                                                                            interval.start,
                                                                                                            interval.end
                                                                                                        ) + " "}
                                                                                                        <strong>
                                                                                                            {interval.pass_amount +
                                                                                                                " pass"}
                                                                                                        </strong>
                                                                                                    </span>
                                                                                                    <button
                                                                                                        onClick={() =>
                                                                                                            handleSingleDeleteInterval(
                                                                                                                sportIndex,
                                                                                                                intervalIndex
                                                                                                            )
                                                                                                        }
                                                                                                    >
                                                                                                        x
                                                                                                    </button>
                                                                                                </li>
                                                                                            )
                                                                                        )}
                                                                                    </ul>
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                </>
                                            )}

                                            {schedule &&
                                                schedule.passes.length > 0 &&
                                                startDate &&
                                                startDate !== "" && (
                                                    <>
                                                        <div className="input-group">
                                                            <div className="checkboxes">
                                                                <label
                                                                    htmlFor="exceptions"
                                                                    className={`customcheckboxcontainer ${
                                                                        isRepeat ? "checked-label" : ""
                                                                    }`}
                                                                >
                                                                    <input
                                                                        className="hiddencheckbox"
                                                                        type="checkbox"
                                                                        id="exceptions"
                                                                        checked={isExceptions}
                                                                        onChange={handleCheckboxChangeExceptions}
                                                                    />
                                                                    <span className="customcheckbox"></span>
                                                                    Undantag/Semester
                                                                </label>
                                                            </div>
                                                        </div>
                                                        {!isExceptions ? (
                                                            <p className="explain">
                                                                Du kan välja att lägga till datum tider då du har
                                                                semester eller datum som du vet du är borta, och
                                                                exkludera pass tider.
                                                            </p>
                                                        ) : (
                                                            <>
                                                                <div className="grid3">
                                                                    <div className="input-group">
                                                                        <label htmlFor="startdatetime">
                                                                            Startdatum
                                                                        </label>
                                                                        <input
                                                                            type="date"
                                                                            id="startdatetime"
                                                                            name="startdatetime"
                                                                            value={startExceptionDateTime}
                                                                            onChange={(e) =>
                                                                                setStartExceptionDateTime(
                                                                                    e.target.value
                                                                                )
                                                                            }
                                                                        />
                                                                    </div>
                                                                    <div className="input-group">
                                                                        <label htmlFor="enddatetime">Slutdatum</label>
                                                                        <input
                                                                            type="date"
                                                                            id="enddatetime"
                                                                            name="enddatetime"
                                                                            value={endExceptionDateTime}
                                                                            onChange={(e) =>
                                                                                setEndExceptionDateTime(e.target.value)
                                                                            }
                                                                        />
                                                                    </div>

                                                                    <button
                                                                        className="button"
                                                                        onClick={handleAddException}
                                                                    >
                                                                        +
                                                                    </button>
                                                                </div>
                                                                <div className="exceptions-container">
                                                                    <ul>
                                                                        {schedule.exceptions &&
                                                                            schedule.exceptions.length > 0 &&
                                                                            schedule.exceptions.map(
                                                                                (exception, index) => (
                                                                                    <li
                                                                                        className="exceptions"
                                                                                        key={index}
                                                                                    >
                                                                                        {`${exception.start.slice(
                                                                                            0,
                                                                                            -9
                                                                                        )} - ${exception.end.slice(
                                                                                            0,
                                                                                            -9
                                                                                        )}`}
                                                                                        <button
                                                                                            onClick={() =>
                                                                                                handleDeleteException(
                                                                                                    index
                                                                                                )
                                                                                            }
                                                                                        >
                                                                                            x
                                                                                        </button>
                                                                                    </li>
                                                                                )
                                                                            )}
                                                                    </ul>
                                                                </div>
                                                            </>
                                                        )}
                                                    </>
                                                )}
                                            {/* Check that everything is filled correctly before showing button */}
                                            {startDate !== "" && allIntervalsSet() && (
                                                <button className="button" onClick={createPass}>
                                                    Lägg till i kalendern
                                                </button>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            {stripeId === null && hasStripeIdLoaded === true ? (
                                                <div>
                                                    <p>You need a Stripe account to add a product.</p>
                                                    <button className="button" onClick={handleCreateStripe}>
                                                        Setup Stripe
                                                    </button>
                                                </div>
                                            ) : (
                                                stripeId !== null &&
                                                hasStripeIdLoaded === true && (
                                                    <div className="button" onClick={() => setCreateNew(false)}>
                                                        Schemalägg nytt pass
                                                    </div>
                                                )
                                            )}
                                        </>
                                    )}
                                </div>
                                {/* Calendar Module */}
                                {calendarSchedule && calendarSchedule.length > 0 && (
                                    <CalendarModule data={calendarSchedule} fetchedPasses={fetchedPasses} />
                                )}
                            </>
                        )}
                    </div>
                </div>
            </main>
        </>
    );
}
