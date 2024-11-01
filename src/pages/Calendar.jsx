import React, { useState, useEffect } from 'react'
import { Loader } from '../components'
import { cdnClient, urlFor } from '../utils/client'
import { Link } from 'react-router-dom'
import { BsPersonLinesFill, BsFillCalendar2WeekFill } from 'react-icons/bs'
import { FaLocationDot } from 'react-icons/fa6'
import { DateObject } from "react-multi-date-picker";

import placeholderImg from '../assets/placeholder.png'

const Calendar = ({ user }) => {
    const [userId, setUserId] = useState(null)
    const [userRole, setUserRole] = useState(null)
    const [loading, setLoading] = useState(true)
    const [eventData, setEventData] = useState(null)
    const [appointments, setAppointments] = useState(null)
    const [dates, setDates] = useState(null)
    const [filter, setFilter] = useState("month")
    const [month, setMonth] = useState(new Date().getMonth())
    const [year, setYear] = useState(new Date().getFullYear())
    const monthArray = ["Jan", "Feb", "Mar", "Apr", "May", "June", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"]
    const lastDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    const [backBtnDisabled, setBackBtnDisabled] = useState(false)
    const [forwardBtnDisabled, setForwardBtnDisabled] = useState(false)

    const backMonth = (e) => {
        setBackBtnDisabled(true)
        if (month == 0) {
            setMonth(11)
            setYear(year - 1)
        } else setMonth(month - 1)
    }

    const forwardMonth = (e) => {
        setForwardBtnDisabled(true)
        if (month == 11) {
            setMonth(0)
            setYear(year + 1)
        } else setMonth(month + 1)
    }

    const leapYear = (y) => {
        return ((y % 4 == 0) && (y % 100 != 0)) || (y % 400 == 0);
    }

    useEffect(() => {
        if (!user) return
        cdnClient.fetch(`*[_type == 'user' && email == '${user.email}']{_id, role}`).then((data) => {
            setUserId(data[0]._id)
            setUserRole(data[0].role)
        })
    }, [user])

    useEffect(() => {
        if (!userId || !userRole) return
        const s = `${year}-${month + 1 < 10 ? "0" : ""}${month + 1}-01`
        const e = `${year}-${month + 1 < 10 ? "0" : ""}${month + 1}-${month == 1 && leapYear(year) ? 29 : lastDays[month]}`
        const q = `*[_type == "event" && published][0...50]{ _id, name, image, description, "creator": creator->userName, location, "instances": instances[][start != null && (dateTime(start) >= dateTime("${new Date(s).toISOString()}") && dateTime(end) < dateTime("${new Date(e).toISOString()}"))]{ _createdAt, _key, start, end, numHours, name }} | order(_createdAt desc)`
        cdnClient.fetch(q).then((data) => {
            console.log(data)
            setBackBtnDisabled(false)
            setForwardBtnDisabled(false)
            for (var i = data.length - 1; i >= 0; i--) {
                if (data[i].instances.length == 0) data.splice(i, 1)
            }
            data.forEach((x, i) => {
                data[i].instances.sort((a, b) => new Date(a.start) - new Date(b.start))
            })
            data.sort((a, b) => a.instances[0].start ? new Date(a.instances[0].start) - new Date(b.instances[0].start) : -1)
            setEventData(data)
            setTimeout(() => { setLoading(false) }, 300);
            const appointmentsQ = [];
            var totalHours = 0;
            data.forEach((x) => {
                x.instances.forEach((y) => {
                    totalHours += y.numHours;
                    console.log(y.start)
                    appointmentsQ.push({
                        _createdAt: x._createdAt,
                        _event_id: x._id,
                        _instance_key: y._key,
                        eventName: x.name + `${y.name && " (" + y.name + ")"}`,
                        start: new Date(y.start),
                        end: new Date(y.end),
                        full_day: y.start ? true : false,
                        hours: y.numHours,
                    })
                })
            })
            setAppointments(appointmentsQ);
        })
    }, [userId, userRole, month])

    useEffect(() => {
        const datesQ = []
        appointments?.forEach((x) => {
            const dateVar = x.full_day ? new Date(x.start.toDateString()) : "full_day"
            const obj = {
                _event_id: x._event_id,
                name: x.eventName,
                startTime: x.start,
                endTime: x.end,
                hours: x.hours,
            }
            const i = datesQ.findIndex((a) => a.date != "full_day" ? a.date.getDate() == dateVar.getDate() : a == "full_day");
            if (i >= 0) {
                datesQ[i].appointments.push(obj)
            } else {
                datesQ.push({
                    date: dateVar,
                    appointments: [obj]
                })
            }
        })
        datesQ.sort((a, b) => a.date != "full_day" ? new Date(a.date) - new Date(b.date) : -1)
        setDates(datesQ)
    }, [appointments])

    return (
        <>
            {
                !loading ? (
                    <div className="px-2 md:px-32 py-16">
                        <div className="flex w-full items-center">
                            <div className="mr-auto">
                                <div className="text-6xl mb-3 nova">Calendar</div>
                            </div>
                        </div>
                        <div className="flex justify-between items-center">
                            <div className="join">
                                <button className="join-item btn" onClick={backMonth} disabled={backBtnDisabled}>«</button>
                                <button className="join-item btn">{monthArray[month]}, {year}</button>
                                <button className="join-item btn" onClick={forwardMonth} disabled={forwardBtnDisabled}>»</button>
                            </div>
                            <div className="dropdown dropdown-bottom dropdown-end">
                                <label tabIndex={0} className="btn m-1">BY {filter.toUpperCase()}</label>
                                <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                                    <li onClick={() => { setFilter("month") }}><a>By month</a></li>
                                    <li onClick={() => { setFilter("event") }}><a>By event</a></li>
                                </ul>
                            </div>
                        </div>
                        {
                            dates.length == 0 && <div className="py-4 text-base-content opacity-60">Nothing to show.</div>
                        }
                        {
                            filter == "month" ?
                                <div className="flex my-6">
                                    <div className="flex-1">
                                        {
                                            dates.map((x) =>
                                                <div>
                                                    <div className="text-2xl grid p-4 card bg-base-300 rounded-box place-items-center glass">{x.date != "full_day" ? new DateObject(x.date).format("MMM DD, YYYY") : "No time specified"}</div>
                                                    <div className="flex flex-col my-3 gap-3">
                                                        {
                                                            x.appointments.map((y) =>
                                                                <div className="p-4 flex gap-3 flex-wrap" style={{ borderBottom: "1px solid hsl(var(--a))" }}>
                                                                    <Link to={"/event/" + y._event_id}>
                                                                        <div className="font-bold text-primary underline">{y.name}</div>
                                                                    </Link>
                                                                    {x.date != "full_day" && <div>{new DateObject(new Date(y.startTime)).format("h:mm a")} to {new DateObject(new Date(y.endTime)).format("h:mm a")}</div>}
                                                                    <div>{y.hours} hour{y.hours != 1 ? "s" : ""}</div>
                                                                </div>
                                                            )
                                                        }
                                                    </div>
                                                </div>
                                            )
                                        }
                                    </div>
                                </div>
                                :
                                <div className="flex flex-col my-6 gap-3">
                                    {
                                        eventData.map((x) =>
                                            <div tabIndex={0} className="collapse border border-base-300 bg-base-200 glass shadow-md hover:brightness-95 transition-all rounded-md">
                                                <input type="checkbox" />
                                                <div className="collapse-title">
                                                    <div className="flex gap-x-4 items-center">
                                                        <div className="relative flex justify-content items-center"><img src={x.image ? urlFor(x.image).url() : placeholderImg} alt="Event image" className="object-cover rounded-md" style={{ width: "100px", height: "100px", zIndex: 1 }} /><span className="loading loading-spinner text-primary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" style={{ zIndex: 0 }}></span>
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="text-2xl font-medium mb-3">{x.name}</div>
                                                            <div className="flex flex-wrap gap-2">
                                                                {
                                                                    x.instances.map((y) =>
                                                                        y.start && y.end && <div className="bg-primary text-primary-content glass p-2 rounded-md flex-1" style={{ minWidth: "200px", maxWidth: "200px" }}>
                                                                            <div className="flex gap-x-1 items-center">
                                                                                <BsFillCalendar2WeekFill />
                                                                                <div>
                                                                                    {new DateObject(new Date(y.start)).format("MMM DD, YYYY")}
                                                                                </div>
                                                                            </div>
                                                                            <div className="text-sm leading-[0.8rem]">{new DateObject(new Date(y.start)).format("h:mm a")} to {new DateObject(new Date(y.end)).format("h:mm a")}</div>
                                                                            <div className="text-sm leading-[0.8rem]">{y.numHours} hour{y.numHours != 1 ? "s" : ""}</div>
                                                                        </div>
                                                                    )
                                                                }
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="collapse-content">
                                                    <div className="p-8 px-16 bg-base-100 rounded-md gap-2 flex flex-col">
                                                        <div className="flex items-center gap-x-1">
                                                            <BsPersonLinesFill />
                                                            <div>{x.creator}</div>
                                                        </div>
                                                        {x.location &&
                                                            <div className="flex items-center gap-x-1">
                                                                <FaLocationDot />
                                                                <div>{x.location}</div>
                                                            </div>
                                                        }
                                                        <div>{x.description}</div>
                                                        <Link to={"/event/" + x._id}>
                                                            <button className="btn btn-outline">View event</button>
                                                        </Link>
                                                    </div>

                                                </div>
                                            </div>
                                        )
                                    }
                                </div>
                        }
                    </div>
                ) : <Loader />
            }
        </>
    )
}

export default Calendar