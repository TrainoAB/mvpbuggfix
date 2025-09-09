"use client";
// react related imports
import { useEffect, useState, useCallback } from "react";

//traino related imports
import { useAppState } from "@/app/hooks/useAppState";

//react-big-calendar imports
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import "react-big-calendar/lib/css/react-big-calendar.css";
const DragAndDropCalendar = withDragAndDrop(Calendar);

//date-fns imports
import { format } from "date-fns/format";
import { parse } from "date-fns/parse";
import { startOfWeek } from "date-fns/startOfWeek";
import { getDay } from "date-fns/getDay";
import { sv } from "date-fns/locale/sv";
import * as dateFns from "date-fns";

import Modal from "./modal/CalendarModal";
import Loader from "../Loader";
import "./ScheduleCalendar.css";

const locales = { sv: sv };
const calenderLocalizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

const intitalPasses = [
    {
        id: 1,
        user_id: 1,
        product_type: "Counter-Strike 2",
        trainer_id: 175, // fredrik id
        date: "2024-10-07",
        title: "Pass 1",
        start: new Date(2024, 9, 7, 8, 0, 0),
        end: new Date(2024, 9, 7, 20, 0, 0),
        allDay: false,
        duration: 60,
        pass_set_id: "1",
        pass_set_repeat_id: "1",
        isbooked: false,
        paid: false,
        canceled: false,
        reason: "something reason",
        registered: "2024-10-07", // current_timestamp
        stripe_order_id: "1",
    },
    {
        id: 2,
        user_id: 1,
        product_type: "Counter-Strike 2",
        trainer_id: 175, // fredrik id
        date: "2024-10-08",
        title: "Pass 2",
        start: new Date(2024, 9, 8, 10, 0, 0),
        end: new Date(2024, 9, 8, 11, 0, 0),
        allDay: false,
        duration: 30,
        pass_set_id: "1",
        pass_set_repeat_id: "1",
        isbooked: false,
        paid: false,
        canceled: false,
        reason: "something reason",
        registered: "2024-10-08", // current_timestamp
        stripe_order_id: "1",
    },
    {
        id: 3,
        user_id: 1,
        product_type: "Counter-Strike 2",
        trainer_id: 175, // fredrik id
        date: "2024-10-09",
        title: "Pass 3",
        start: new Date(2024, 9, 9, 13, 0, 0),
        end: new Date(2024, 9, 9, 14, 0, 0),
        allDay: false,
        duration: 15,
        pass_set_id: "1",
        pass_set_repeat_id: "1",
        isbooked: true,
        paid: false,
        canceled: false,
        reason: "something reason",
        registered: "2024-10-09", // current_timestamp
        stripe_order_id: "1",
    },
    {
        id: 4,
        user_id: 1,
        product_type: "golf",
        trainer_id: 175, // fredrik id
        date: "2024-10-10",
        title: "Pass 4",
        start: new Date(2024, 9, 10, 12, 0, 0),
        end: new Date(2024, 9, 10, 18, 0, 0),
        allDay: false,
        duration: 10,
        pass_set_id: "1",
        pass_set_repeat_id: "1",
        isbooked: false,
        paid: false,
        canceled: false,
        reason: "something reason",
        registered: "2024-10-10", // current_timestamp
        stripe_order_id: "1",
    },
    {
        id: 5,
        user_id: 1,
        product_type: "weight-lifting",
        trainer_id: 175, // fredrik id
        date: "2024-10-11",
        title: "Pass 5", // krävs för kalendern
        start: new Date(2024, 9, 11, 10, 0, 0), // krävs för kalendern
        end: new Date(2024, 9, 11, 11, 0, 0), // krävs för kalendern
        allDay: false, // krävs för kalendern
        duration: 5,
        pass_set_id: "1",
        pass_set_repeat_id: "1",
        isbooked: false,
        paid: false,
        canceled: false,
        reason: "something reason",
        registered: "2024-10-11", // current_timestamp
        stripe_order_id: "1",
    },
    {
        id: 6,
        user_id: 1,
        product_type: "golf",
        trainer_id: 175, // fredrik id
        date: "2024-10-12",
        title: "Pass 5", // krävs för kalendern
        start: new Date(2024, 9, 12, 11, 0, 0), // krävs för kalendern
        end: new Date(2024, 9, 12, 12, 0, 0), // krävs för kalendern
        allDay: false, // krävs för kalendern
        duration: 5,
        pass_set_id: "1",
        pass_set_repeat_id: "1",
        isbooked: false,
        paid: false,
        canceled: false,
        reason: "something reason",
        registered: "2024-10-12", // current_timestamp
        stripe_order_id: "1",
    },
];

const sportCategories = [
    {
        id: 2,
        category_name: "Counter-Strike 2",
        category_link: "cs2",
        category_image: "https://traino.nu/app/assets/counter-strike.jpg",
        is_show: 1,
    },
    {
        id: 12,
        category_name: "Dota 2",
        category_link: "dota2",
        category_image: "https://traino.nu/app/assets/dota.jpg",
        is_show: 0,
    },
    {
        id: 13,
        category_name: "League of Legends",
        category_link: "lol",
        category_image: "https://traino.nu/app/assets/league-of-legends.jpg",
        is_show: 0,
    },
    {
        id: 14,
        category_name: "Fortnite",
        category_link: "fortnite",
        category_image: "https://traino.nu/app/assets/fortnite.jpg",
        is_show: 0,
    },
    {
        id: 15,
        category_name: "Boxning",
        category_link: "boxing",
        category_image: "https://traino.nu/app/assets/boxning.jpg",
        is_show: 0,
    },
    {
        id: 16,
        category_name: "Thaiboxning",
        category_link: "muay-thai",
        category_image: "https://traino.nu/app/assets/thaiboxing.jpg",
        is_show: 0,
    },
    {
        id: 17,
        category_name: "Simning",
        category_link: "swimming",
        category_image: "https://traino.nu/app/assets/swimming.jpg",
        is_show: 0,
    },
    {
        id: 18,
        category_name: "Löpning",
        category_link: "running",
        category_image: "https://traino.nu/app/assets/running.jpg",
        is_show: 0,
    },
    {
        id: 19,
        category_name: "Amerikansk Fotboll",
        category_link: "american-football",
        category_image: "https://traino.nu/app/assets/american-football.jpg",
        is_show: 0,
    },
    {
        id: 20,
        category_name: "Badminton",
        category_link: "badminton",
        category_image: "https://traino.nu/app/assets/badminton.jpg",
        is_show: 0,
    },
    {
        id: 21,
        category_name: "Cykling",
        category_link: "cycling",
        category_image: "https://traino.nu/app/assets/cycling.jpg",
        is_show: 0,
    },
    {
        id: 22,
        category_name: "Friidrott",
        category_link: "track-and-field",
        category_image: "https://traino.nu/app/assets/track&field.jpg",
        is_show: 0,
    },
    {
        id: 23,
        category_name: "Klättring",
        category_link: "climbing",
        category_image: "https://traino.nu/app/assets/climbing.jpg",
        is_show: 0,
    },
    {
        id: 24,
        category_name: "MMA (Mixed Martial Arts)",
        category_link: "mma",
        category_image: "https://traino.nu/app/assets/mma.jpg",
        is_show: 0,
    },
    {
        id: 25,
        category_name: "Pingis",
        category_link: "table-tennis",
        category_image: "https://traino.nu/app/assets/ping-pong.jpg",
        is_show: 0,
    },
    {
        id: 26,
        category_name: "Skateboard",
        category_link: "skateboard",
        category_image: "https://traino.nu/app/assets/skating.jpg",
        is_show: 0,
    },
    {
        id: 27,
        category_name: "Skidor",
        category_link: "skiing",
        category_image: "https://traino.nu/app/assets/skiing.jpg",
        is_show: 0,
    },
    {
        id: 28,
        category_name: "Snowboard",
        category_link: "snowboard",
        category_image: "https://traino.nu/app/assets/wintersport.jpg",
        is_show: 0,
    },
    {
        id: 29,
        category_name: "Tennis",
        category_link: "tennis",
        category_image: "https://traino.nu/app/assets/tennis.jpg",
        is_show: 0,
    },
    {
        id: 31,
        category_name: "Trail biking",
        category_link: "trail-biking",
        category_image: "https://traino.nu/app/assets/mountain biking.jpg",
        is_show: 0,
    },
    {
        id: 32,
        category_name: "Senior Träning",
        category_link: "senior-training",
        category_image: "https://traino.nu/app/assets/senior-training.jpg",
        is_show: 0,
    },
    {
        id: 33,
        category_name: "Träning för Gravida",
        category_link: "prenatal-training",
        category_image: "https://traino.nu/app/assets/maternity-training.jpg",
        is_show: 0,
    },
    {
        id: 35,
        category_name: "BJJ (Brasiliansk Jiu Jitsu)",
        category_link: "bjj",
        category_image: "https://traino.nu/app/assets/jiujitsu.jpg",
        is_show: 0,
    },
    {
        id: 36,
        category_name: "Brottning",
        category_link: "wrestling",
        category_image: "https://traino.nu/app/assets/wrestling.jpg",
        is_show: 0,
    },
    {
        id: 1,
        category_name: "Styrkelyft",
        category_link: "weight-lifting",
        category_image: "https://traino.nu/app/assets/powerlifting.jpg",
        is_show: 0,
    },
    {
        id: 37,
        category_name: "Ridsport Hoppning",
        category_link: "show-jumping",
        category_image: "https://traino.nu/app/assets/show-jump.jpg",
        is_show: 0,
    },
    {
        id: 3,
        category_name: "Fotboll",
        category_link: "soccer",
        category_image: "https://traino.nu/app/assets/football.jpg",
        is_show: 0,
    },
    {
        id: 4,
        category_name: "Basket",
        category_link: "basketball",
        category_image: "https://traino.nu/app/assets/basketball.jpg",
        is_show: 0,
    },
    {
        id: 38,
        category_name: "Ridsport Dressyr",
        category_link: "dressage",
        category_image: "https://traino.nu/app/assets/dressyr.jpg",
        is_show: 0,
    },
    {
        id: 5,
        category_name: "Golf",
        category_link: "golf",
        category_image: "https://traino.nu/app/assets/golf.jpg",
        is_show: 0,
    },
    {
        id: 39,
        category_name: "Yoga",
        category_link: "yoga",
        category_image: "https://traino.nu/app/assets/yoga.jpg",
        is_show: 0,
    },
    {
        id: 6,
        category_name: "Ishockey",
        category_link: "icehockey",
        category_image: "https://traino.nu/app/assets/hockey.jpg",
        is_show: 0,
    },
    {
        id: 7,
        category_name: "Karate",
        category_link: "karate",
        category_image: "https://traino.nu/app/assets/pexels-artempodrez-6253310.jpg",
        is_show: 0,
    },
    {
        id: 8,
        category_name: "Padel",
        category_link: "padel",
        category_image: "https://traino.nu/app/assets/padel.jpg",
        is_show: 0,
    },
    {
        id: 9,
        category_name: "Ridsport",
        category_link: "horsesport",
        category_image: "https://traino.nu/app/assets/ridning.jpg",
        is_show: 0,
    },
    {
        id: 10,
        category_name: "Segling",
        category_link: "sailing",
        category_image: "https://traino.nu/app/assets/sailing.jpg",
        is_show: 0,
    },
    {
        id: 11,
        category_name: "Slalom",
        category_link: "slalom",
        category_image: "https://traino.nu/app/assets/snow-2591491_640.jpg",
        is_show: 0,
    },
];

//TODO: add more parameters for rest of pass structure.
const createNewPass = (title, sportCategory, start, end, duration) => {
    const newPass = {
        id: Math.floor(Math.random() * 1000), // random id, TODO: replace with real id
        user_id: 1, // user id, should be changed if pass is booked.
        product_type: sportCategory, // random sport category, TODO: replace with real category
        trainer_id: 175, // fredrik id, TODO: replace with real trainer id
        date: start, // example: '2024-10-07',
        title: title, // title: name of pass, needed for rendering in calendar. follows the format: Event: { title, start, end }.
        start: start, // start: start time of pass in Date format. example: new Date(2024, 9, 7, 8, 0, 0),
        end: end, // end: end time of pass in Date format. example: new Date(2024, 9, 7, 20, 0, 0),
        allDay: false, // allDay: boolean, true if pass is all day.
        duration: duration, // duration: duration of pass in minutes. each interval will be the duration.
        pass_set_id: "1", // pass_set_id: id of pass set.
        pass_set_repeat_id: "1", // pass_set_repeat_id: id of pass set repeat.
        isbooked: false, // isbooked: boolean, true if pass is booked.
        paid: false, // paid: boolean, true if pass is paid.
        canceled: false, // canceled: boolean, true if pass is canceled.
        reason: "cancel reason", // reason: reason for canceling pass.
        registered: new Date(), // registered: date of registration. example: '2024-10-07',
        stripe_order_id: "1", // stripe_order_id: id of stripe order.
    };
    return newPass;
};

//updates existing pass with new values.
//returns an updated array of events.
const updateCalendarEvents = (existingPass, updatedPass, events) => {
    const filtered = events.filter((event) => event.id !== existingPass.id);
    return [...filtered, updatedPass];
};

//inserts new pass into events array.
//returns an updated array of events.
const insertNewPass = (newPass, events) => {
    const filtered = events.filter((event) => event.id !== newPass.id);
    const updatedEvents = [...filtered, newPass];
    return updatedEvents;
};

const EventDetails = ({ event, modalClose, onDelete, onEdit }) => {
    const startTime = format(event.start, "HH:mm", { locale: sv });
    const endTime = format(event.end, "HH:mm", { locale: sv });
    const [showIntervals, setShowIntervals] = useState(false);
    const [intervals, setIntervals] = useState([]);
    const [isEditing, setIsEditing] = useState(false);

    const handleShowIntervals = () => {
        if (!showIntervals) {
            setShowIntervals(true);
        } else {
            setShowIntervals(false);
        }
    };

    const handleEditExistingPass = () => {
        const newPassTitle = String(document.getElementById("pass-name").value);
        const newPassDuration = Number(document.getElementById("pass-duration").value);
        const newPassCategory = String(document.getElementById("pass-category").value);

        const updatedPass = {
            ...event,
            product_type: newPassCategory,
            title: newPassTitle,
            start: dateFns.addHours(event.start, 1),
            end: dateFns.addHours(event.end, 1),
            duration: newPassDuration,
        };
        onEdit(updatedPass);
        setIsEditing(false);
    };

    const createIntervals = (start, end, duration) => {
        const startTime = start;
        const endTime = dateFns.addMinutes(end, -duration); // subtract duration from end time to get correct amount of intervals
        const intervalTime = duration;

        let intervals = [];
        dateFns.eachMinuteOfInterval({ start: startTime, end: endTime }, { step: intervalTime }).forEach((interval) => {
            const formattedInterval = format(interval, "HH:mm", { locale: sv });
            intervals.push(formattedInterval);
        });
        return intervals;
    };

    const formatHeaderDate = (date) => {
        return format(date, "EEEE, d MMMM", { locale: sv });
    };

    useEffect(() => {
        const intervalArray = createIntervals(event.start, event.end, event.duration);
        setIntervals(intervalArray);
    }, [event]);

    return (
        <>
            {!isEditing ? (
                <div className="event-modal">
                    <div className="event-modal-header">
                        <button className="btn-back" onClick={() => modalClose(false)}></button>
                        <h3 style={{ fontSize: "2rem", color: "#FFF" }}>{formatHeaderDate(event.date)}</h3>
                        <button className="btn-delete" onClick={onDelete}></button>
                    </div>
                    <div className="event-modal-container">
                        <h2
                            style={{
                                margin: "0 0 5px 0",
                                fontSize: "18px",
                                color: "#333",
                                borderBottom: "0.125rem solid var(--maincolor)",
                                paddingBottom: "0.125rem",
                            }}
                        >{`${event.product_type}, ${event.duration} min`}</h2>
                        <ul className="edit-intervals">
                            <li>
                                <button className="btn-expand" onClick={handleShowIntervals}></button>
                                <p
                                    style={{ margin: "0", fontSize: "14px", color: "#333" }}
                                >{`${startTime} - ${endTime}`}</p>
                                <span
                                    style={{
                                        fontSize: "12px",
                                        color: "#333",
                                        padding: "0.25rem 0.5rem",
                                    }}
                                >
                                    {`${intervals.length} st pass`}
                                </span>
                                <button className="btn-edit" onClick={() => setIsEditing(true)}></button>
                            </li>
                        </ul>
                        {showIntervals && (
                            <ul
                                style={{
                                    listStyle: "none",
                                    padding: "0",
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "center",
                                    textAlign: "center",
                                }}
                            >
                                {intervals.map((interval, index) => {
                                    return (
                                        <li
                                            key={index}
                                            style={{
                                                marginTop: "0.25rem",
                                                marginBottom: "0.25rem",
                                                padding: "0.5rem",
                                                backgroundColor: "#f2f2f2",
                                            }}
                                        >
                                            {interval}
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                </div>
            ) : (
                <div className="event-modal">
                    <div className="event-modal-header">
                        <button className="btn-back" onClick={() => setIsEditing(false)}></button>
                        <h3 style={{ fontSize: "2rem", color: "#FFF" }}>Redigera pass</h3>
                    </div>
                    <div className="event-modal-container">
                        <label htmlFor="pass-category">Pass kategori:</label>
                        <select id="pass-category" required>
                            {sportCategories.map((category) => (
                                <option key={category.id} value={category.category_name}>
                                    {category.category_name}
                                </option>
                            ))}
                        </select>
                        <label htmlFor="pass-name">Pass namn:</label>
                        <input type="text" id="pass-name" required />
                        <label htmlFor="pass-duration">Pass längd:</label>
                        <input type="text" id="pass-duration" required />
                        <button className="button event-modal-button" onClick={handleEditExistingPass}>
                            Spara
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

const CreatePass = ({ newPass, modalClose, onCreate }) => {
    const [passCategory, setPassCategory] = useState("");
    const [passTitle, setPassTitle] = useState("");
    const [passDuration, setPassDuration] = useState(5);

    const handleCreateNewPass = () => {
        const createdPassCategory = passCategory;
        const createdPassTitle = passTitle;
        const createdPassDuration = passDuration;

        const createdPass = createNewPass(
            createdPassTitle,
            createdPassCategory,
            newPass.start,
            newPass.end,
            createdPassDuration
        );
        onCreate(createdPass);
    };

    const handleSetCategory = (e) => {
        setPassCategory(e.target.value);
    };

    return (
        <div className="event-modal">
            <div className="event-modal-header">
                <button className="btn-back" onClick={modalClose}></button>
                <h3 style={{ fontSize: "2rem", color: "#FFF" }}>Schemalägg nytt pass</h3>
            </div>
            <div className="event-modal-container">
                <label htmlFor="pass-category">Pass kategori:</label>
                <select id="pass-category" required value={passCategory} onChange={handleSetCategory}>
                    {sportCategories.map((category) => (
                        <option key={category.id} value={category.category_name}>
                            {category.category_name}
                        </option>
                    ))}
                </select>
                <label htmlFor="pass-name">Pass titel:</label>
                <input
                    type="text"
                    id="pass-name"
                    required
                    value={passTitle}
                    onChange={(e) => setPassTitle(e.target.value)}
                />
                <label htmlFor="pass-duration">{`Pass Längd(min):`}</label>
                <input
                    type="number"
                    id="pass-duration"
                    step={5}
                    min={5}
                    max={60}
                    required
                    value={passDuration}
                    onChange={(e) => setPassDuration(e.target.value)}
                />
                <button className="button event-modal-button" onClick={handleCreateNewPass}>
                    Schemalägg nytt pass
                </button>
            </div>
        </div>
    );
};

const Event = ({ event }) => {
    const formattedCategory = event.product_type.charAt(0).toUpperCase() + event.product_type.slice(1);
    return (
        <>
            <div>
                {event.isbooked ? (
                    <div className="booked-event">
                        <p>
                            <strong>{`${event.title}`}</strong>
                            {` | ${formattedCategory} | ${event.duration} min`}
                        </p>
                    </div>
                ) : (
                    <div>
                        <p>
                            <strong>{`${event.title}`}</strong>
                            {` | ${formattedCategory} | ${event.duration} min`}
                        </p>
                    </div>
                )}
            </div>
        </>
    );
};

export default function ScheduleCalendar({ user_id }) {
    const { sessionObject, baseUrl, DEBUG } = useAppState();

    const [loading, setLoading] = useState(true);
    const [events, setEvents] = useState([]);

    const [selectedEvent, setSelectedEvent] = useState(null);
    const [eventDetailModal, setEventDetailModal] = useState(false);

    const [newPass, setNewPass] = useState(null);
    const [createPassModal, setCreatePassModal] = useState(false);

    //TODO: remove fake loading
    useEffect(() => {
        setLoading(true);
        setEvents(intitalPasses);
        setTimeout(() => {
            setLoading(false);
        }, 450);
    }, []);

    const handleSelectSlot = useCallback(
        ({ start, end }) => {
            setNewPass({ start, end });
            setCreatePassModal(true);
        },
        [setEvents]
    );

    const handleSelectEvent = useCallback(
        (event) => {
            setSelectedEvent(event);
            setEventDetailModal(true);
        },
        [setEventDetailModal, setSelectedEvent]
    );

    const handleEditEvent = (editedPass) => {
        DEBUG && console.log("editedPass: ", editedPass);
        setEvents((prev) => updateCalendarEvents(selectedEvent, editedPass, prev));
        handleCloseModal();
    };

    const handleCreatePass = (newPass) => {
        const createdPass = createNewPass(
            newPass.title,
            newPass.product_type,
            newPass.start,
            newPass.end,
            newPass.duration
        );
        DEBUG && console.log("createdPass: ", createdPass);
        setEvents((prev) => insertNewPass(newPass, prev));
        handleCloseCreatePassModal();
    };

    const handleDeleteEvent = () => {
        if (window.confirm("Är du säker på att du vill ta bort detta pass?")) {
            setEventDetailModal(false);
            setEvents((prev) => prev.filter((ev) => ev.id !== selectedEvent.id));
            setSelectedEvent(null);
        }
    };

    const handleCloseModal = () => {
        DEBUG && console.warn("handleCloseModal: closing modal & resetting selected event");
        setEventDetailModal(false);
        setSelectedEvent(null);
    };

    const handleCloseCreatePassModal = () => {
        DEBUG && console.warn("handleCloseCreatePassModal: closing create pass modal & resetting new pass");
        setCreatePassModal(false);
        setNewPass(null);
    };

    const moveEvent = useCallback(
        ({ event, date, start, end, isAllDay: droppedOnAllDaySlot = false }) => {
            if (event.isbooked || event.canceled || event.paid) {
                alert("Du kan inte ändra detta pass!");
                return;
            }
            const { allDay } = event;
            if (!allDay && droppedOnAllDaySlot) {
                event.allDay = true;
            }
            if (allDay && !droppedOnAllDaySlot) {
                event.allDay = false;
            }

            setEvents((prev) => {
                const existing = prev.find((ev) => ev.id === event.id) ?? {};
                const filtered = prev.filter((ev) => ev.id !== event.id);
                return [...filtered, { ...existing, date: start, start, end, allDay: event.allDay }];
            });
        },
        [setEvents]
    );

    const resizeEvent = useCallback(
        ({ event, start, end }) => {
            if (event.isbooked || event.canceled || event.paid) {
                alert("Du kan inte ändra detta pass!");
                return;
            }
            setEvents((prev) => {
                const existing = prev.find((ev) => ev.id === event.id) ?? {};
                const filtered = prev.filter((ev) => ev.id !== event.id);
                return [...filtered, { ...existing, start, end }];
            });
        },
        [setEvents]
    );

    const eventPropGetter = (event) => {
        let backgroundColor = "#f2f2f2";
        let border = "1px solid rgb(255,255,255)";
        let color = "black";
        let boxShadow = "0 0 2px 0 rgba(0,0,0,0.2)";

        if (event.isbooked) {
            color = "white";
            border = "1px solid white";
            backgroundColor = "var(--maincolor)";
        } else {
            //TODO: better way of handling different product types(sporter)
            switch (event.product_type) {
                case "Counter-Strike 2":
                    backgroundColor = "lightblue";
                    border = "1px solid rgb(100,200,255)";
                    break;
                case "weight-lifting":
                    backgroundColor = "lightgreen";
                    border = "1px solid rgb(100,255,100)";
                    break;
                case "golf":
                    backgroundColor = "lightcoral";
                    border = "1px solid rgb(255,100,100)";
                    break;
                default:
                    backgroundColor = "#f2f2f2";
                    color = "black";
            }
        }

        return {
            style: {
                backgroundColor,
                boxShadow,
                border,
                borderRadius: "5px",
                opacity: 0.8,
                color,
            },
        };
    };

    return (
        <div>
            {loading ? (
                <Loader />
            ) : (
                <div id="schedulecalendar-container" style={{ width: "90vw", height: "75vh", overflow: "hidden" }}>
                    <DragAndDropCalendar
                        localizer={calenderLocalizer}
                        events={events}
                        culture="sv"
                        defaultView="week"
                        startAccessor="start"
                        endAccessor="end"
                        selectable
                        popup
                        resizable
                        components={{ event: Event }}
                        onEventDrop={moveEvent}
                        onEventResize={resizeEvent}
                        eventPropGetter={eventPropGetter}
                        onSelectEvent={handleSelectEvent}
                        onSelectSlot={handleSelectSlot}
                    />
                    <Modal openModal={eventDetailModal} closeModal={handleCloseModal}>
                        {selectedEvent && (
                            <>
                                <EventDetails
                                    event={selectedEvent}
                                    modalClose={handleCloseModal}
                                    onDelete={handleDeleteEvent}
                                    onEdit={handleEditEvent}
                                />
                            </>
                        )}
                    </Modal>
                    <Modal openModal={createPassModal} closeModal={handleCloseCreatePassModal}>
                        {newPass && (
                            <CreatePass
                                newPass={newPass}
                                modalClose={handleCloseCreatePassModal}
                                onCreate={handleCreatePass}
                            />
                        )}
                    </Modal>
                </div>
            )}
        </div>
    );
}
