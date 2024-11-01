import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { cdnClient, urlFor } from '../utils/client'
import { Loader } from '../components'
import { MdOutlineVerified, MdOutlineOpenInNew } from 'react-icons/md'
import { FaRegClock, FaCalendarDay } from 'react-icons/fa6'
import { DateObject } from "react-multi-date-picker";
import { MaterialReactTable } from 'material-react-table';

import placeholderImg from '../assets/placeholder.png'

const Profile = ({ user }) => {
    const [userId, setUserId] = useState(null)
    const [userName, setUserName] = useState(null)
    const [userEmail, setUserEmail] = useState(null)
    const [userRole, setUserRole] = useState(null)
    const [userLocation, setUserLocation] = useState(null)
    const [signUpData, setSignUpData] = useState(null)
    const [totalHours, setTotalHours] = useState(0)
    const [verifiedHours, setVerifiedHours] = useState(0)
    const [signupCount, setSignupCount] = useState(0)
    const [upcomingEvents, setUpcomingEvents] = useState(null)
    const [completedEvents, setCompletedEvents] = useState(null)
    const [loading, setLoading] = useState(true)
    const [tableData, setTableData] = useState(null)

    useEffect(() => {
        if (!user) return
        var query = `*[_type == 'user' && email == "${user.email}"][0]{ _id, role, location }`
        cdnClient.fetch(query).then((data) => {
            setUserId(data._id)
            setUserName(user.name)
            setUserEmail(user.email)
            setUserRole(data.role)
            setUserLocation(data.location)
            cdnClient.fetch(`*[_type == "event" && published]{ _id, name, image, "instances": instances[][signUps[].signedUpUser._ref match "${data._id}"]{ _key, start, end, name, "numHours": signUps[signedUpUser._ref match "${data._id}"][0].numHours, "verified": signUps[signedUpUser._ref match "${data._id}"][0].verified, "adminConfirmed": signUps[signedUpUser._ref match "${data._id}"][0].adminConfirmed, "comment": signUps[signedUpUser._ref match "${data._id}"][0].comment }}`).then((data) => {
                var st = [], td = [], s = 0, h = 0, v = 0
                data.forEach((x) => {
                    x.instances.forEach((y) => {
                        st.push({
                            name: x.name + `${y.name && " (" + y.name + ")"}`,
                            _id: x._id,
                            image: x.image,
                            start: y.start,
                            end: y.end,
                            numHours: y.numHours,
                            verified: y.verified && y.adminConfirmed,
                            comment: y.comment,
                        })
                        td.push({
                            "_id": x._id,
                            "Event": x.name + `${y.name && " (" + y.name + ")"}`,
                            "Date": y.start ? new Date(y.start) : null,
                            "Start": y.start ? new DateObject(new Date(y.start)).format("h:mm a") : "N/A",
                            "End": y.start ? new DateObject(new Date(y.end)).format("h:mm a") : "N/A",
                            "Hours": y.numHours,
                            "Verified": y.verified && y.adminConfirmed ? "Yes" : "No",
                            "Comment": y.comment
                        })
                        const z = parseInt(y.numHours)
                        s++
                        if (z != null) {
                            h += z;
                            if (y.verified && y.adminConfirmed) v += z
                        }
                    })
                })
                setSignUpData(st)
                setTableData(td)
                setSignupCount(s)
                setTotalHours(h)
                setVerifiedHours(v)
                setUpcomingEvents([...st.filter(x => x.start && new Date(x.start) - new Date() > 0)].sort((a, b) => new Date(a.start) - new Date(b.start)))
                setCompletedEvents([...st.filter(x => x.start && new Date(x.start) - new Date() < 0)].sort((a, b) => new Date(b.start) - new Date(a.start)))
                setLoading(false);
            })
        })
    }, [user])

    return (
        <>
            {
                !loading ? (
                    <div className="px-2 md:px-32 py-16">
                        <div className="text-6xl nova pb-6">Profile</div>
                        <div className="flex flex-col gap-10">
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="stats shadow">
                                    <div className="stat">
                                        <div className="stat-title">{userRole.substring(0, 1).toUpperCase() + userRole.substring(1)} ({userLocation})</div>
                                        <div className="stat-value nova">
                                            <div className="break-all">
                                                {
                                                    userName.split(" ").map((x) => <div>{x}</div>)
                                                }
                                            </div>
                                        </div>
                                        <div className="stat-desc">{userEmail}</div>
                                    </div>
                                </div>
                                {userRole != "admin" &&
                                    <div className="stats stats-vertical md:stats-horizontal shadow flex-1">
                                        <div className="stat">
                                            <div className="stat-figure text-primary">
                                                <MdOutlineVerified size="40" color="text-primary" />
                                            </div>
                                            <div className="stat-title">Verified Hours</div>
                                            <div className="stat-value text-primary nova text-6xl">{verifiedHours}</div>
                                        </div>
                                        <div className="stat">
                                            <div className="stat-figure text-secondary">
                                                <FaRegClock size="40" color="text-secondary" />
                                            </div>
                                            <div className="stat-title">Total Hours</div>
                                            <div className="stat-value text-secondary nova text-6xl">{totalHours}</div>
                                        </div>
                                        <div className="stat">
                                            <div className="stat-figure text-accent">
                                                <FaCalendarDay size="40" color="text-accent" />
                                            </div>
                                            <div className="stat-title">Signups</div>
                                            <div className="stat-value nova text-accent text-6xl">{signupCount}</div>
                                        </div>
                                    </div>
                                }
                            </div>
                            {userRole != "admin" &&
                                <div className="flex flex-col md:flex-row gap-4">
                                    <div className="flex-1">
                                        <div className="text-3xl font-bold pb-3 nova">Upcoming</div>
                                        <div className="flex flex-col gap-3">
                                            {
                                                upcomingEvents && upcomingEvents.length > 0 ? upcomingEvents.slice(0, 4).map((x) => (
                                                    <Link to={`/event/${x._id}`}>
                                                        <div className="rounded-lg bg-slate-100 flex flex-row overflow-hidden hover:brightness-90 cursor-pointer transition-all">
                                                            <div className="min-h-full w-48" style={{ backgroundImage: `url(${x.image ? urlFor(x.image).url() : placeholderImg})`, backgroundSize: "cover" }}>
                                                                <div className="w-full h-full flex justify-end items-center p-2 bg-gradient-to-l from-[#000000cc] to-transparent">
                                                                    <div>
                                                                        <div className="text-xl text-white nova text-right">{x.numHours} hour{x.numHours > 1 ? "s" : ""}</div>
                                                                        {x.verified && <div className="text-green-300 text-sm nova text-right">VERIFIED</div>}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="p-4">
                                                                <div className="text-xl font-bold text-slate-700">{x.name}</div>
                                                                <div className="text-slate-400 text-sm">{x.start ? new DateObject(new Date(x.start)).format("dddd, MMMM D (h:mm a)") : ""}</div>
                                                            </div>
                                                        </div>
                                                    </Link>
                                                )) : <div className="text-base-content opacity-60">Nothing to show.</div>
                                            }</div>
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-3xl font-bold pb-3 nova">Completed</div>
                                        <div className="flex flex-col gap-3">
                                            {
                                                completedEvents && completedEvents.length > 0 ? completedEvents.slice(0, 4).map((x) => (
                                                    <Link to={`/event/${x._id}`}>
                                                        <div className="rounded-lg bg-slate-100 flex flex-row overflow-hidden hover:brightness-90 cursor-pointer transition-all">
                                                            <div className="min-h-full w-48" style={{ backgroundImage: `url(${x.image ? urlFor(x.image).url() : placeholderImg})`, backgroundSize: "cover" }}>
                                                                <div className="w-full h-full flex justify-end items-center p-2 bg-gradient-to-l from-[#000000cc] to-transparent">
                                                                    <div>
                                                                        <div className="text-xl text-white nova text-right">{x.numHours} hour{x.numHours > 1 ? "s" : ""}</div>
                                                                        {x.verified && <div className="text-green-300 text-sm nova text-right">VERIFIED</div>}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="p-4">
                                                                <div className="text-xl font-bold text-slate-700">{x.name}</div>
                                                                <div className="text-slate-400 text-sm">{x.start ? new DateObject(new Date(x.start)).format("dddd, MMMM D (h:mm a)") : ""}</div>
                                                            </div>
                                                        </div>
                                                    </Link>
                                                )) : <div className="text-base-content opacity-60">Nothing to show.</div>
                                            }</div>
                                    </div>
                                </div>
                            }
                            {
                                userRole != "admin" && tableData && tableData.length > 0 &&
                                <>
                                    <div className="overflow-auto">
                                        <MaterialReactTable
                                            isFullScreen={true}
                                            columns={Object.keys(tableData[0]).map((x, i) => {
                                                if (x != "_id") {
                                                    const col = {
                                                        accessorKey: x,
                                                        header: x
                                                    }
                                                    if (x == "Date") col.Cell = ({ cell }) => (
                                                        <span>{cell.getValue() ? new DateObject(cell.getValue()).format("MMMM D, YYYY") : "N/A"}</span>
                                                    )
                                                    return col
                                                }
                                            }).filter(x => x)}
                                            data={tableData}
                                            enablePinning
                                            enableRowActions
                                            renderRowActions={({ row }) => (
                                                <Link to={`/event/${tableData[row.id]._id}`}>
                                                    <button
                                                        className="btn btn-sm btn-ghost btn-circle hover:brightness-90 transition-all"
                                                    ><MdOutlineOpenInNew /></button>
                                                </Link>
                                            )}
                                            displayColumnDefOptions={{
                                                'mrt-row-actions': {
                                                    header: 'Open'
                                                }
                                            }}
                                            muiTopToolbarProps={{
                                                sx: {
                                                    backgroundColor: 'hsl(var(--b1))',
                                                }
                                            }}
                                            muiBottomToolbarProps={{
                                                sx: {
                                                    backgroundColor: 'hsl(var(--b1))',
                                                }
                                            }}
                                            muiTableBodyCellProps={{
                                                sx: {
                                                    fontFamily: 'Inter',
                                                    backgroundColor: 'hsl(var(--b1))'
                                                },
                                            }}
                                            muiTableHeadCellProps={{
                                                sx: {
                                                    fontFamily: 'Proxima Nova',
                                                    fontSize: 12,
                                                    color: "hsl(var(--a))",
                                                    textTransform: "uppercase",
                                                    backgroundColor: 'hsl(var(--b2))'
                                                },
                                            }}
                                        />
                                    </div>
                                </>
                            }
                        </div>
                    </div>
                ) : <Loader />
            }
        </>
    )
}

export default Profile