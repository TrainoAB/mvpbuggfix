import React, { useRef, useEffect, useState } from "react";
import "./MonthCalendar.css";
import { generateCalendar, getDayInRange } from "../old-schedule/utilities";

export default function MonthCalendar({ setOpenModal, startDate, endDate, onClick, editedDate, chosenDays }) {
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [days, setDays] = useState([]);
    const [weekNumbers, setWeekNumbers] = useState([]);
    const [month, setMonth] = useState("");
    const [year, setYear] = useState("");

    const dayNumRef = useRef(null);

    const months = [
        "Januari",
        "Februari",
        "Mars",
        "April",
        "Maj",
        "Juni",
        "Juli",
        "Augusti",
        "September",
        "Oktober",
        "November",
        "December",
    ];

    const renderCalendar = () => {
        const { liTag, weekNumbers } = generateCalendar(
            currentYear,
            currentMonth,
            startDate,
            endDate,
            onClickOnDay,
            editedDate,
            chosenDays
        );
        setDays(liTag);
        setMonth(months[currentMonth]);
        setYear(currentYear);
        setWeekNumbers(weekNumbers);
    };

    useEffect(() => {
        renderCalendar();
    }, [currentMonth, currentYear, startDate, endDate, chosenDays, editedDate]);

    const onClickArrowLeft = () => {
        setCurrentMonth((prevMonth) => {
            if (prevMonth === 0) {
                setCurrentYear((prevYear) => prevYear - 1);
                return 11;
            }
            return prevMonth - 1;
        });
    };

    const onClickArrowRight = () => {
        setCurrentMonth((prevMonth) => {
            if (prevMonth === 11) {
                setCurrentYear((prevYear) => prevYear + 1);
                return 0;
            }
            return prevMonth + 1;
        });
    };

    const onClickOnDay = (date, weekday) => {
        setOpenModal(true);
        const dayInRange = getDayInRange(date, startDate, endDate);
        const inRange = dayInRange !== null;
        onClick(date, inRange, weekday);
    };

    return (
        <div className="wrapper">
            <header>
                <div className="date">
                    <p className="current-date month">{month}</p>
                    <p className="current-date year">{year}</p>
                </div>
                <div className="icons">
                    <span id="prev" className="arrow" onClick={onClickArrowLeft}></span>
                    <span id="next" className="arrow" onClick={onClickArrowRight}></span>
                </div>
            </header>
            <div className="calendar">
                <div className="calendar-row">
                    <ul className="weekName">
                        <li className="week">Vecka</li>
                        {weekNumbers.map((week, index) => (
                            <li key={index} style={{ fontSize: "0.6rem", color: "var(--black)071" }}>
                                {week}
                            </li>
                        ))}
                    </ul>
                    <div className="days-and-weeks">
                        <ul className="weeks">
                            <li>Mån</li>
                            <li>Tis</li>
                            <li>Ons</li>
                            <li>Tor</li>
                            <li>Fre</li>
                            <li>Lör</li>
                            <li>Sön</li>
                        </ul>
                        <ul ref={dayNumRef} className="days">
                            {days}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
