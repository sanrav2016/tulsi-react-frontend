import React, { useState, useEffect } from 'react'
import DatePicker, { DateObject } from "react-multi-date-picker";
import TimePicker from "react-multi-date-picker/plugins/time_picker";
import { FaEraser } from 'react-icons/fa6'
import { MaterialReactTable } from 'material-react-table';
import { FaTrash } from 'react-icons/fa6'
import toast from 'react-hot-toast'
import { client } from '../utils/client'

const EditEventInstance = ({ eventId, instances, instanceToEdit, setInstanceToEdit, working, setWorking }) => {
    const [instanceName, setInstanceName] = useState(null)
    const [date, setDate] = useState(null)
    const [startTime, setStartTime] = useState(new DateObject(new Date("1/1/1980 12:00 PM")))
    const [endTime, setEndTime] = useState(new DateObject(new Date("1/1/1980 1:00 PM")))
    const [active, setActive] = useState(null)
    const [hours, setHours] = useState(null)
    const [volunteerSlots, setVolunteerSlots] = useState(null)
    const [supervisorSlots, setSupervisorSlots] = useState(null)
    const [freeze, setFreeze] = useState(null)
    const [showPrereqs, setShowPrereqs] = useState(false)
    const [prerequisites, setPrerequisites] = useState({})

    useEffect(() => {
        document.getElementById("editModal").addEventListener("close", () => setTimeout(() => setInstanceToEdit(null), 100))
    }, [])

    useEffect(() => {
        if (!instanceToEdit) return
        setInstanceName(instanceToEdit.name)
        if (instanceToEdit.start) setDate(new DateObject(new Date(instanceToEdit.start)))
        else setDate(null)
        if (instanceToEdit.start) setStartTime(new DateObject(new Date(instanceToEdit.start)))
        else setStartTime(new DateObject(new Date("1/1/1980 12:00 PM")))
        if (instanceToEdit.end) setEndTime(new DateObject(new Date(instanceToEdit.end)))
        else setEndTime(new DateObject(new Date("1/1/1980 1:00 PM")))
        setActive(instanceToEdit.active)
        setHours(instanceToEdit.numHours)
        setVolunteerSlots(instanceToEdit.volunteersNumSlots)
        setSupervisorSlots(instanceToEdit.supervisorsNumSlots)
        setFreeze(new DateObject(new Date(instanceToEdit.freeze)))
        const p = {}
        instanceToEdit.prerequisites?.forEach((x) => p[x] = true)
        setPrerequisites(p)
        setShowPrereqs(instanceToEdit.prerequisites && instanceToEdit.prerequisites.length > 0)
        setTimeout(() => document.getElementById("editModal").showModal(), 1);
    }, [instanceToEdit])

    const saveEventInstance = () => {
        if (!(hours > 0 && volunteerSlots >= 0 && supervisorSlots >= 0 && (volunteerSlots > 0 || supervisorSlots > 0) && (date == null || new Date("1/1/23 " + startTime.format("h:mm a")) - new Date("1/1/23 " + endTime.format("h:mm a")) < 0))) return
        if (!working) toast("Working...")
        setWorking(true)
        client.fetch(`*[_type == "event" && _id == "${eventId}"][0]{ _rev, instances, "instance": instances[_key=="${instanceToEdit._key}"][0]{ "volunteerSignUps": count(signUps[signedUpUser->role=="volunteer"]), "supervisorSignUps": count(signUps[signedUpUser->role=="supervisor"]), prerequisites } }`).then((d) => {
            if (d.instance.volunteerSignUps > volunteerSlots) {
                setWorking(false)
                toast.dismiss()
                return toast.error("Cannot reduce number of volunteer slots.")
            }
            if (d.instance.supervisorSignUps > supervisorSlots) {
                setWorking(false)
                toast.dismiss()
                return toast.error("Cannot reduce number of supervisor slots.")
            }
            var flag = false
            Object.keys(prerequisites).forEach((x) => {
                const p = d.instances.find((y) => y._key == x)
                if (p.prerequisites.includes(instanceToEdit._key))
                    flag = true
            })
            if (flag) {
                setWorking(false)
                toast.dismiss()
                return toast.error("Prerequisites have circular dependency.")
            }
            const doc = instanceToEdit
            if (instanceName) doc.name = instanceName
            if (date) {
                doc.start = new Date(date.format("MM/DD/YYYY ") + startTime.format("h:mm a"))
                doc.end = new Date(date.format("MM/DD/YYYY ") + endTime.format("h:mm a"))
            } else {
                doc.start = null;
                doc.end = null;
            }
            if (active != null) doc.active = active
            if (hours > 0) doc.numHours = parseInt(hours)
            if (volunteerSlots >= 0) doc.volunteersNumSlots = parseInt(volunteerSlots)
            if (supervisorSlots >= 0) doc.supervisorsNumSlots = parseInt(supervisorSlots)
            if (freeze) doc.freeze = new Date(freeze.format("MM/DD/YYYY"))
            if (prerequisites) doc.prerequisites = Object.keys(prerequisites)
            const path = `instances[_key == "${instanceToEdit._key}"]`
            client
                .patch(eventId)
                .ifRevisionId(d._rev)
                .set({ [path]: doc })
                .commit({ autoGenerateArrayKeys: true })
                .then((doc) => {
                    toast.dismiss()
                    toast.success("Event instance updated.")
                    setWorking(false)
                })
                .catch((err) => {
                    if (err.includes("unexpected revision ID")) setTimeout(() => saveEventInstance(), 100)
                });
        })
    }

    const deleteEventInstance = () => {
        if (!window.confirm("Are you sure you want to delete this event instance? All signups will be removed.")) return
        var flag = false
        instances.forEach((x) => {
            if (x._key == instanceToEdit._key) return
            x.prerequisites.forEach((y) => {
                if (y == instanceToEdit._key) flag = true
            })
        })
        if (flag) return toast.error("Prerequisites are dangling.")
        setWorking(true)
        toast("Deleting event instance...")
        client
            .patch(eventId)
            .unset([`instances[_key == "${instanceToEdit._key}"]`])
            .commit()
            .then(() => {
                setWorking(false)
                toast.dismiss()
                toast.success("Event instance deleted.")
            })
    }

    return (
        <dialog id="editModal" className="modal">
            <div className="modal-box overflow-visible min-w-[calc(100%-30px)] md:min-w-[32rem]">
                <div className="pb-4">
                    <h3 className="font-bold text-2xl nova">Edit event instance</h3>
                </div>
                <div className="flex flex-col md:flex-row gap-3">
                    <div className="flex-1">
                        <div className="flex flex-col gap-2">
                            <div className="flex flex-row gap-2 items-center h-8 justify-between">
                                <span className="text-sm text-base-content opacity-60 w-12">Name</span>
                                <input value={instanceName} onChange={e => setInstanceName(e.target.value)} className="input input-bordered input-sm w-full" maxLength={100} />
                            </div>
                            <div className="flex flex-row gap-2 items-center h-8 justify-between">
                                <span className="text-sm text-base-content opacity-60 w-12">Date</span>
                                <div className="flex flex-row gap-1 items-center">
                                    <DatePicker
                                        value={date}
                                        onChange={setDate}
                                        format="MM/DD/YYYY"
                                        render={(value, openCalendar) => (
                                            <button className="btn btn-sm font-normal" onClick={openCalendar}>{value ? value : "N/A"}</button>
                                        )}
                                    />
                                    <button className="btn btn-sm btn-circle btn-ghost" onClick={() => setDate(null)}><FaEraser color="hsl(var(--a))" size="20" /></button>
                                </div>
                            </div>
                            <div className="flex flex-row gap-2 items-center h-8 justify-between">
                                <span className="text-sm text-base-content opacity-60 w-12">Time</span>
                                <div className="flex flex-row items-center gap-2">
                                    <div className="flex-1 flex justify-center">
                                        <DatePicker
                                            value={startTime}
                                            onChange={setStartTime}
                                            disableDayPicker
                                            format="h:mm a"
                                            plugins={[
                                                <TimePicker hideSeconds />
                                            ]}
                                            render={(value, openCalendar) => <button disabled={date == null} onClick={openCalendar} className="btn btn-sm font-normal w-24">{value}</button>}
                                        />
                                    </div>
                                    <div className="text-sm">to</div>
                                    <div className="flex-1 flex justify-center">
                                        <DatePicker
                                            value={endTime}
                                            onChange={setEndTime}
                                            disableDayPicker
                                            format="h:mm a"
                                            plugins={[
                                                <TimePicker hideSeconds />
                                            ]}
                                            render={(value, openCalendar) => <button disabled={date == null} onClick={openCalendar} className="btn btn-sm font-normal w-24">{value}</button>}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-row gap-2 items-center h-8 justify-between">
                                <span className="text-sm text-base-content opacity-60 w-12">Freeze</span>
                                <DatePicker
                                    value={freeze}
                                    onChange={setFreeze}
                                    format="MM/DD/YYYY"
                                    render={(value, openCalendar) => (
                                        <button className="btn btn-sm font-normal" onClick={openCalendar}>{value}</button>
                                    )}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2">
                        <div className="flex flex-row gap-2 items-center h-8 justify-between">
                            <span className="text-sm text-base-content opacity-60 w-12">Active</span>
                            <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} className="toggle toggle-sm" />
                        </div>
                        <div className="flex flex-row gap-2 items-center h-8 justify-between">
                            <span className="text-sm text-base-content opacity-60">Hours</span>
                            <input type="number" min={0} value={hours} onChange={e => setHours(e.target.value)} className="input input-bordered input-sm w-16" />
                        </div>
                        <div className="flex flex-row gap-2 items-center h-8 justify-between">
                            <span className="text-sm text-base-content opacity-60">Supervisors</span>
                            <input type="number" min={0} value={supervisorSlots} onChange={e => setSupervisorSlots(e.target.value)} className="input input-bordered input-sm w-16" />
                        </div>
                        <div className="flex flex-row gap-2 items-center h-8 justify-between">
                            <span className="text-sm text-base-content opacity-60">Volunteers</span>
                            <input type="number" min={0} value={volunteerSlots} onChange={e => setVolunteerSlots(e.target.value)} className="input input-bordered input-sm w-16" />
                        </div>
                    </div>
                </div>
                <div className="mt-2">
                    <div className="flex flex-row gap-2 items-center h-8 justify-between">
                        <span className="text-sm text-base-content opacity-60 w-12">Prerequisites</span>
                        {
                            (!showPrereqs || showPrereqs && Object.keys(prerequisites).length == 0) &&
                            <input type="checkbox" checked={showPrereqs} onChange={e => setShowPrereqs(e.target.checked)} className="toggle toggle-sm" />
                        }
                    </div>
                    <div className="max-h-48 overflow-scroll">
                        {
                            showPrereqs && instanceToEdit &&
                            <>
                                <div className="overflow-hidden">
                                    <MaterialReactTable
                                        columns={["_key", "name", "start", "end"].map((x, i) => {
                                            const col = {
                                                accessorKey: x,
                                                header: x
                                            }
                                            if (x == "start" || x == "end") col.Cell = ({ cell }) => (
                                                <span>{cell.getValue() ? new DateObject(cell.getValue()).format("M/D/YY (h:mm a)") : "N/A"}</span>
                                            )
                                            return col
                                        }).filter(x => x)}
                                        data={[...instances].filter((x) => x._key != instanceToEdit._key).sort((x, y) => x.start ? new Date(x.start) - new Date(y.start) : -1)}
                                        enableRowSelection={true}
                                        getRowId={(row) => row._key}
                                        onRowSelectionChange={setPrerequisites}
                                        state={{ rowSelection: prerequisites }}
                                        enableBottomToolbar={false}
                                        initialState={{ density: 'compact', columnVisibility: { _key: false }, showGlobalFilter: true }}
                                        positionToolbarAlertBanner="none"
                                        renderToolbarInternalActions={({ table }) => (
                                            <></>
                                        )}
                                        positionGlobalFilter="left"
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
                <form method="dialog">
                    <div className="absolute right-2 top-2 flex flex-row items-center gap-1">
                        <button className="btn btn-sm btn-circle btn-ghost" onClick={deleteEventInstance}><FaTrash /></button>
                        <button disabled={!(hours > 0 && volunteerSlots >= 0 && supervisorSlots >= 0 && (volunteerSlots > 0 || supervisorSlots > 0) && (date ? new Date("1/1/23 " + startTime.format("h:mm a")) - new Date("1/1/23 " + endTime.format("h:mm a")) < 0 : true))} className="btn btn-primary btn-sm" onClick={saveEventInstance}>Save</button>
                        <button className="btn btn-sm btn-circle btn-ghost">✕</button>
                    </div>
                </form>
            </div>
        </dialog>
    )
}

export default EditEventInstance