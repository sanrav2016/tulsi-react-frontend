import React, { useState, useEffect } from 'react'
import { Calendar, DateObject } from "react-multi-date-picker";
import { useParams } from 'react-router-dom'
import { client } from '../utils/client'
import toast from 'react-hot-toast';
import { RiVipCrownFill } from 'react-icons/ri'
import { MdOutlineVerified } from 'react-icons/md'
import { FaRegClock } from 'react-icons/fa6'
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";

const EventSignUp = ({ eventData, calendarData, dataToDisplay, setDataToDisplay, value, setValue, user, userId, userRole }) => {
    let { eventId } = useParams()
    const [cancellationInProgress, setCancellationInProgress] = useState(false)

    const signUpInstance = (button, instance, signUpinProgress = false) => {
        button.disabled = true;
        if (!signUpinProgress)
            toast("Working...");
        const eventDataInstance = eventData.instances.find((x) => x._key == instance._instance_key)
        client.fetch(`*[_type == "event" && "${userId}" in instances[].signUps[].signedUpUser._ref]{ _id, "instances": instances[][signUps[].signedUpUser._ref match "${userId}"]{ _createdAt, _key, start, end, numHours }}`).then((data) => {
            var scheduleCleared = true, preReqCleared = eventDataInstance.prerequisites && eventDataInstance.prerequisites.length > 0 ? false : true;
            data.forEach((x) => {
                x.instances.forEach((y) => {
                    const range1Start = new Date(y.start);
                    const range1End = new Date(y.end);
                    const range2Start = new Date(eventDataInstance.start);
                    const range2End = new Date(eventDataInstance.end);
                    if (range1Start < range2End && range2Start < range1End) {
                        scheduleCleared = false;
                    }
                    if (!preReqCleared && eventDataInstance.prerequisites.includes(y._key)) preReqCleared = true;
                })
            })
            if (!scheduleCleared) {
                button.disabled = false;
                toast.dismiss()
                return toast.error("Can't sign up because of a schedule conflict.")
            }
            if (!preReqCleared) {
                button.disabled = false;
                toast.dismiss()
                return toast.error("Please sign up for at least one of the prerequisites first.")
            }
            client.fetch(`*[_type == "event" && _id == "${eventId}"]{ _rev, "active": instances[_key=="${instance._instance_key}"][0].active, "count": count(instances[_key=="${instance._instance_key}"][0].signUps[signedUpUser->role=="${userRole}"]) }[0]`).then((d) => {
                if (d.active == false) {
                    toast.dismiss()
                    return toast.error("Signup closed.")
                }
                const q = userRole == "volunteer" ? eventDataInstance.volunteersNumSlots : eventDataInstance.supervisorsNumSlots
                if (d.count >= q) {
                    toast.dismiss()
                    return toast.error("Signup is full.")
                }
                const doc = {
                    _type: 'signUp',
                    signedUpUser: {
                        _type: 'user',
                        _ref: userId,
                        _weak: true
                    },
                    verified: null,
                    primary: false,
                    numHours: instance.hours
                }
                const path = `instances[_key == "${instance._instance_key}"].signUps`
                client
                    .patch(eventId)
                    .ifRevisionId(d._rev)
                    .setIfMissing({ [path]: [] })
                    .append(path, [doc])
                    .commit({ autoGenerateArrayKeys: true })
                    .then((doc) => {
                        toast.dismiss()
                        toast.success("You are signed up for " + eventData.name + ".")
                    })
                    .catch((err) => {
                        if (String(err).includes("unexpected revision ID")) setTimeout(() => signUpInstance(button, instance, true), 100)
                    });
            })
        })
    }

    const cancelInstance = (button, instance, access, _id) => {
        button.disabled = true;
        const eventDataInstance = eventData.instances.find((x) => x._key == instance._instance_key)
        if (!access && eventDataInstance.start && new Date(eventDataInstance.start).getTime() - new Date().getTime() <= (1000 * 60 * 60 * 24)) {
            setTimeout(() => { button.disabled = false; }, 4000);
            return toast.error("Can't cancel less than 24 hours before the event starts.")
        }
        const path = `instances[_key=="${instance._instance_key}"].signUps[signedUpUser._ref=="${_id}"]`
        setCancellationInProgress(true)
        toast("Working...");
        client
            .patch(eventId)
            .unset([path])
            .commit()
            .then((doc) => {
                toast.dismiss()
                toast.success(`Sign up ${access ? "removed" : "cancelled"}.`)
                setCancellationInProgress(false)
            })
    }

    const toggleVerified = (checkbox, toSet, userIdQ, instanceKey, signedUp) => {
        if (userRole == "volunteer" || (userRole == "supervisor" && !signedUp)) return
        const path = `instances[_key=="${instanceKey}"].signUps[signedUpUser._ref=="${userIdQ}"].verified`
        toast("Working...")
        checkbox.disabled = true
        client
            .patch(eventId)
            .set({ [path]: toSet })
            .commit()
            .then(() => {
                toast.dismiss()
                toast.success(toSet ? "Signup verified." : "Verification removed.")
                checkbox.disabled = false
            })
    }

    const togglePrimary = (checkbox, toSet, userIdQ, instanceKey, signedUp) => {
        if (userRole != "admin") return
        const path = `instances[_key=="${instanceKey}"].signUps[signedUpUser._ref=="${userIdQ}"].primary`
        toast("Working...")
        checkbox.disabled = true
        client
            .patch(eventId)
            .set({ [path]: toSet })
            .commit()
            .then(() => {
                toast.dismiss()
                toast.success(toSet ? "Primary supervisor added." : "Primary supervisor removed.")
                checkbox.disabled = false
            })
    }

    const changeHours = (newHours, userIdQ, instanceKey, signedUp) => {
        if (userRole == "volunteer" || (userRole == "supervisor" && !signedUp)) return
        if (newHours < 0) return toast.error("Cannot set hours less than 0")
        const numHours = eventData.instances.find((x) => x._key == instanceKey).signUps.find((x) => x._id == userIdQ).numHours
        if (numHours == newHours) return
        if (!newHours || newHours == "") newHours = 0
        const path = `instances[_key=="${instanceKey}"].signUps[signedUpUser._ref=="${userIdQ}"].numHours`
        toast("Working...")
        client
            .patch(eventId)
            .set({ [path]: parseFloat(newHours) })
            .commit()
            .then(() => {
                toast.dismiss()
                toast.success("Hours updated.")
            })
    }

    const changeComment = (newComment, userIdQ, instanceKey, signedUp) => {
        if (userRole == "volunteer" || (userRole == "supervisor" && !signedUp)) return
        if (newComment.length > 100) return toast.error("Comment cannot exceed 100 characters.")
        const comment = eventData.instances.find((x) => x._key == instanceKey).signUps.find((x) => x._id == userIdQ).comment
        if (comment == newComment) return
        const path = `instances[_key=="${instanceKey}"].signUps[signedUpUser._ref=="${userIdQ}"].comment`
        toast("Working...")
        client
            .patch(eventId)
            .set({ [path]: newComment })
            .commit()
            .then(() => {
                toast.dismiss()
                toast.success("Comment updated.")
            })
    }

    const changeTableView = (instanceKey, volunteerIndexNew, supervisorIndexNew) => {
        const m = dataToDisplay.find((x) => x._instance_key == instanceKey);
        const a = (m.volunteers.length - 1) - (m.volunteers.length - 1) % 5
        const b = (m.supervisors.length - 1) - (m.supervisors.length - 1) % 5
        if (volunteerIndexNew < 0) volunteerIndexNew = 0
        if (supervisorIndexNew < 0) supervisorIndexNew = 0
        if (volunteerIndexNew > a) volunteerIndexNew = a
        if (supervisorIndexNew > b) supervisorIndexNew = b
        m.volunteerIndex = volunteerIndexNew
        m.supervisorIndex = supervisorIndexNew
        const d = [...dataToDisplay]
        setDataToDisplay(d)
    }

    return (
        <>
            <div className="flex flex-col md:flex-row overflow-x-scroll">
                <div className="flex bg-white p-8 justify-center items-center h-96">
                    <div>
                        <Calendar
                            value={value}
                            onChange={setValue}
                            mapDays={({ date, isSameDate }) => {
                                var isDisabled = true;
                                for (var i = 0; i < calendarData.length; i++) {
                                    if (isSameDate(date, new DateObject(new Date(calendarData[i].start)))) {
                                        isDisabled = false;
                                        break;
                                    }
                                }
                                if (isDisabled) return {
                                    disabled: true,
                                    style: { color: "#ccc" }
                                }
                            }}
                        />
                    </div>
                </div>
                <div className="flex-1">
                    <div className="p-4 border-accent bg-primary h-full shadow-md overflow-hidden glass">
                        <div className="text-lg mb-2 text-primary-content">{value ? value.format("MMMM D") : "No date specified"}</div>
                        <div className="overflow-y-scroll overflow-x-hidden max-h-72">
                            {
                                dataToDisplay?.map((instance, i) => {
                                    return (
                                        <div className="p-4 m-2 bg-base-100 rounded-md w-full" key={instance._instance_key}>
                                            <div className="flex items-center gap-3">
                                                <div className="nova flex flex-col md:flex-row md:gap-3 w-full justify-center md:items-center">
                                                    <div className="text-2xl">{instance.name}</div>
                                                    <div className="text-lg text-base-content opacity-60 flex-1">{instance.startTime && instance.endTime ? <>{instance.startTime} to {instance.endTime} </> : "No time specified "}({instance.hours} hour{instance.hours != 1 ? "s" : ""})</div>
                                                </div>
                                                {(!instance.active || Date.now() - new Date(instance.freeze) >= 0 || eventData.instances.find((q) => q._key == instance._instance_key).start && new Date().getTime() > new Date(eventData.instances.find((q) => q._key == instance._instance_key).start).getTime()) && <div class="badge badge-secondary">{Date.now() - new Date(instance.freeze) >= 0 ? "Locked" : "Closed"}</div>}
                                            </div>
                                            <div className="flex flex-col md:flex-row">
                                                {instance.volunteersNumSlots > 0 && <div className="flex-1 overflow-x-scroll">
                                                    <p className="nova capitalize text-sm font-bold py-2 text-base-content">VOLUNTEERS ({instance.vSlotsLeft} SLOT{instance.vSlotsLeft != 1 ? "S" : ""} LEFT)</p>
                                                    <table className="table table-xs">
                                                        <thead>
                                                            <tr>
                                                                <th></th>
                                                                <th></th>
                                                                <th><FaRegClock size="18" /></th>
                                                                <th><MdOutlineVerified size="22" /></th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {
                                                                instance.volunteers.length > 0 ? instance.volunteers.slice(instance.volunteerIndex, instance.volunteerIndex + 5).map((x, i) => {
                                                                    const access = (userRole == "admin" || (userRole == "supervisor" && instance.isUserSignedUp && instance.supervisors.find((x) => x._id == userId).primary)) && Date.now() - new Date(instance.freeze) < 0
                                                                    return (
                                                                        <tr>
                                                                            <th>{instance.volunteerIndex + i + 1}</th>
                                                                            <td><div className="items-center flex gap-x-2 flex-col md:flex-row"><div>{x.name}</div>{(!eventData.instances.find((q) => q._key == instance._instance_key).start || new Date().getTime() < new Date(eventData.instances.find((q) => q._key == instance._instance_key).start).getTime()) && (access || x._id == userId && x.verified == null && instance.active) && (<div className="badge badge-accent badge-outline text-xs cursor-pointer hover:bg-accent-focus hover:text-accent-content"><button onClick={(e) => { cancelInstance(e.target, instance, access, x._id) }}>{access ? "Remove" : "Cancel"}</button></div>)
                                                                            }</div></td>
                                                                            <th className="font-normal">
                                                                                {access ?
                                                                                    <input className="rounded-md bg-white w-12 border-solid border-[1px] border-slate-300 p-1 font-normal focus:outline-none focus:ring focus:border-blue-500" type="number" value={x.numHours} onChange={(e) => {
                                                                                        x.numHours = e.target.value
                                                                                        setDataToDisplay([...dataToDisplay])
                                                                                    }} onBlur={(e) => changeHours(e.target.value, x._id, instance._instance_key, instance.isUserSignedUp)} />
                                                                                    : x.numHours}
                                                                            </th>
                                                                            <th className="">
                                                                                <label>
                                                                                    <input disabled={!access} type="checkbox" className={`checkbox checkbox-sm ${!access ? "cursor-not-allowed" : ""}`} checked={x.verified} onClick={(e) => { toggleVerified(e.target, !x.verified, x._id, instance._instance_key, instance.isUserSignedUp) }} />
                                                                                </label>
                                                                            </th>
                                                                            <th>
                                                                                {
                                                                                    x.verified != null ?
                                                                                        access ?
                                                                                            <input maxLength={100} className="w-24 font-normal p-1 border-solid border-[1px] border-slate-300 rounded-md focus:outline-none focus:ring focus:border-blue-500" value={x.comment} onChange={(e) => {
                                                                                                x.comment = e.target.value
                                                                                                setDataToDisplay([...dataToDisplay])
                                                                                            }}
                                                                                                placeholder="Comment" onBlur={(e) => changeComment(e.target.value, x._id, instance._instance_key, instance.isUserSignedUp)} />
                                                                                            : x.comment
                                                                                        : <></>
                                                                                }
                                                                            </th>
                                                                        </tr>
                                                                    )

                                                                }) : <tr><td>No signups</td>
                                                                </tr>
                                                            }
                                                        </tbody>
                                                    </table>
                                                    {
                                                        instance.volunteers.length > 5 &&
                                                        <div className="flex flex-row justify-end">
                                                            <div className="flex flex-row gap-2">
                                                                <div className={`hover:opacity-75 ${instance.volunteerIndex == 0 ? "" : "cursor-pointer"}`} onClick={() => changeTableView(instance._instance_key, instance.volunteerIndex - 5, instance.supervisorIndex)}>
                                                                    <IoIosArrowBack size="20" color={instance.volunteerIndex == 0 ? "hsl(var(--b3))" : "hsl(var(--a))"} />
                                                                </div>
                                                                <div className={`hover:opacity-75 ${instance.volunteerIndex == (instance.volunteers.length - 1) - (instance.volunteers.length - 1) % 5 ? "" : "cursor-pointer"}`} onClick={() => changeTableView(instance._instance_key, instance.volunteerIndex + 5, instance.supervisorIndex)}>
                                                                    <IoIosArrowForward size="20" color={instance.volunteerIndex == (instance.volunteers.length - 1) - (instance.volunteers.length - 1) % 5 ? "hsl(var(--b3))" : "hsl(var(--a))"} />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    }
                                                </div>}
                                                {instance.supervisorsNumSlots > 0 && <div className="flex-1 overflow-x-scroll">
                                                    <p className="nova capitalize text-sm font-bold py-2 text-base-content">SUPERVISORS ({instance.sSlotsLeft} SLOT{instance.sSlotsLeft != 1 ? "S" : ""} LEFT)</p>
                                                    <table className="table table-xs">
                                                        <thead>
                                                            <tr>
                                                                <th></th>
                                                                <th></th>
                                                                <th><FaRegClock size="18" /></th>
                                                                <th><RiVipCrownFill size="21" /></th>
                                                                <th><MdOutlineVerified size="22" /></th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {
                                                                instance.supervisors.length > 0 ? instance.supervisors.slice(instance.supervisorIndex, instance.supervisorIndex + 5).map((x, i) => {
                                                                    const access = userRole == "admin" && Date.now() - new Date(instance.freeze) < 0
                                                                    return (
                                                                        <tr><th>{i + 1}</th>
                                                                            <td><div className="items-center flex gap-x-2 flex-col md:flex-row"><div>{x.name}</div>{(!eventData.instances.find((q) => q._key == instance._instance_key).start || new Date().getTime() < new Date(eventData.instances.find((q) => q._key == instance._instance_key).start).getTime()) && (access || x._id == userId && x.verified == null && instance.active) && (<div className="badge badge-accent badge-outline text-xs cursor-pointer hover:bg-accent-focus hover:text-accent-content"><button onClick={(e) => { cancelInstance(e.target, instance, access, x._id) }}>{access ? "Remove" : "Cancel"}</button></div>)
                                                                            }</div></td>
                                                                            <th className="font-normal">
                                                                                {access ?
                                                                                    <input className="rounded-md bg-white w-12 border-solid border-[1px] border-slate-300 p-1 font-normal focus:outline-none focus:ring focus:border-blue-500" type="number" value={x.numHours} onChange={(e) => {
                                                                                        x.numHours = e.target.value
                                                                                        setDataToDisplay([...dataToDisplay])
                                                                                    }} onBlur={(e) => changeHours(e.target.value, x._id, instance._instance_key, instance.isUserSignedUp)} />
                                                                                    : x.numHours}
                                                                            </th>
                                                                            <th>
                                                                                <label>
                                                                                    <input type="checkbox" disabled={!access} className={`checkbox checkbox-sm ${!access ? "cursor-not-allowed" : ""}`} checked={x.primary} onClick={(e) => { togglePrimary(e.target, !x.primary, x._id, instance._instance_key) }} />
                                                                                </label>
                                                                            </th>
                                                                            <th>
                                                                                <label>
                                                                                    <input type="checkbox" disabled={!access} className={`checkbox checkbox-sm ${!access ? "cursor-not-allowed" : ""}`} checked={x.verified} onClick={(e) => { toggleVerified(e.target, !x.verified, x._id, instance._instance_key) }} />
                                                                                </label>
                                                                            </th>
                                                                            <th>
                                                                                <th>
                                                                                    {
                                                                                        x.verified != null ?
                                                                                            access ?
                                                                                                <input maxLength={100} className="w-24 font-normal p-1 border-solid border-[1px] border-slate-300 rounded-md focus:outline-none focus:ring focus:border-blue-500" value={x.comment} onChange={(e) => {
                                                                                                    x.comment = e.target.value
                                                                                                    setDataToDisplay([...dataToDisplay])
                                                                                                }} placeholder="Comment" onBlur={(e) => changeComment(e.target.value, x._id, instance._instance_key, instance.isUserSignedUp)} />
                                                                                                : x.comment
                                                                                            : <></>
                                                                                    }
                                                                                </th>
                                                                            </th>
                                                                        </tr>)
                                                                }) : <tr><td>No signups</td></tr>
                                                            }
                                                        </tbody>
                                                    </table>
                                                    {
                                                        instance.supervisors.length > 5 &&
                                                        <div className="flex flex-row justify-end">
                                                            <div className="flex flex-row gap-2">
                                                                <div className={`hover:opacity-75 ${instance.supervisorIndex == 0 ? "" : "cursor-pointer"}`} onClick={() => changeTableView(instance._instance_key, instance.volunteerIndex, instance.supervisorIndex - 5)}>
                                                                    <IoIosArrowBack size="20" color={instance.supervisorIndex == 0 ? "hsl(var(--b3))" : "hsl(var(--a))"} />
                                                                </div>
                                                                <div className={`hover:opacity-75 ${instance.supervisorIndex == (instance.supervisors.length - 1) - (instance.supervisors.length - 1) % 5 ? "" : "cursor-pointer"}`} onClick={() => changeTableView(instance._instance_key, instance.volunteerIndex, instance.supervisorIndex + 5)}>
                                                                    <IoIosArrowForward size="20" color={instance.supervisorIndex == (instance.supervisors.length - 1) - (instance.supervisors.length - 1) % 5 ? "hsl(var(--b3))" : "hsl(var(--a))"} />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    }
                                                </div>}
                                            </div>
                                            {
                                                userRole != "admin" && Date.now() - new Date(instance.freeze) < 0 && instance.active && (!eventData.instances.find((q) => q._key == instance._instance_key).start || new Date().getTime() < new Date(eventData.instances.find((q) => q._key == instance._instance_key).start).getTime()) && !instance.isUserSignedUp && (instance.vSlotsLeft > 0 && userRole == "volunteer" || instance.sSlotsLeft > 0 && userRole == "supervisor") &&
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        {
                                                            eventData.instances.find((q) => q._key == instance._instance_key).prerequisites && eventData.instances.find((q) => q._key == instance._instance_key).prerequisites.length > 0 &&
                                                            <>
                                                                <p className="text-sm nova uppercase text-base-content opacity-60">Prerequisites: </p>
                                                                <span className="text-sm">{eventData.instances.find((q) => q._key == instance._instance_key).prerequisites.map((x) => eventData.instances.find((q) => q._key == x).name).join(", ")}</span>
                                                            </>
                                                        }
                                                    </div>
                                                    <button className="btn btn-accent m-2" onClick={(e) => { signUpInstance(e.target, instance) }}>Sign up</button>
                                                </div>
                                            }
                                        </div>
                                    )
                                })
                            }
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default EventSignUp