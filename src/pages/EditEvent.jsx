import React, { useState, useEffect } from 'react'
import { client, urlFor } from '../utils/client'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { Loader } from '../components'
import { toast } from 'react-hot-toast'
import DatePicker, { Calendar, DateObject } from "react-multi-date-picker";
import TimePicker from "react-multi-date-picker/plugins/time_picker";
import ImageModal from '../components/ImageModal'
import EditEventInstance from '../components/EditModal'
import { FiExternalLink, FiEdit2 } from 'react-icons/fi'
import { HiMiniBarsArrowUp } from 'react-icons/hi2'
import { MaterialReactTable } from 'material-react-table';
import Select from 'react-select'

import placeholderImage from '../assets/placeholder.png'

const EditEvent = ({ user }) => {
    let { eventId } = useParams()

    const [userId, setUserId] = useState(null)
    const [userRole, setUserRole] = useState(null)
    const [loading, setLoading] = useState(true)

    const [eventName, setEventName] = useState(null)
    const [creator, setCreator] = useState(null)
    const [published, setPublished] = useState(null)
    const [galleryEnabled, setGalleryEnabled] = useState(null)
    const [description, setDescription] = useState(null)
    const [image, setImage] = useState(null)
    const [location, setLocation] = useState(null)
    const [centers, setCenters] = useState([])
    const [categories, setCategories] = useState([])

    const centersArray = ["Edison", "Somerset", "Monroe", "Cherry Hill", "Chesterfield"];

    const categoriesArray = [
        "Biodiversity Conservation", 
        "Community Outreach & Engagement Events",
        "Diversity & Inclusion Efforts",
        "Educational Support Initiatives",
        "Environmental Conservation",
        "Environmental Education",
        "Environmental Protection",
        "Healthcare Services",
        "National/State Program",
        "Organic Gardening & Produce Donation",
        "Reduce Plastic Usage Efforts",
        "Soil Conservation",
        "Sewa at Places of Worship",
        "Sewa Blood Donation Drives",
        "Sewa Disaster Services",
        "Sewa Diwali",
        "Sewa Family Services",
        "Support for the Food Insecure",
        "Sewa Life Saving Skills",
        "Sewa Medical, Health & Yoga Camps",
        "SewaMeals for Hunger Relief",
        "Support for First Responders & Vulnerable Population",
        "Support for Medical & Healthcare Needs",
        "Support for Special Needs",
        "Support for the Under Resourced",
        "Support for Underpriviledged",
        "Support Servicemen",
        "Sustainable Agriculture",
        "Sustainable Gardening",
        "Sustainable Waste Management",
        "Climate Change Mitigation",
        "Advocacy & Policy Support",
        "Helpline",
        "Fundraisers",
        "Newsletter SM Public Relations",
        "Orgn & Chapter"
    ]

    const centerOptions = centersArray.map((x) => { return { value: x, label: x } });
    const categoryOptions = categoriesArray.map((x) => { return { value: x, label: x } });

    const [instances, setInstances] = useState([])
    const [instancesToShow, setInstancesToShow] = useState([])
    const [instanceName, setInstanceName] = useState(null)

    const [selectedCalendarValue, setSelectedCalendarValue] = useState([])

    const [startTime, setStartTime] = useState(new DateObject(new Date("1/1/1980 12:00 PM")))
    const [endTime, setEndTime] = useState(new DateObject(new Date("1/1/1980 1:00 PM")))
    const [hours, setHours] = useState()
    const [volunteersNumSlots, setVolunteersNumSlots] = useState()
    const [supervisorsNumSlots, setSupervisorsNumSlots] = useState()
    const [active, setActive] = useState(true)

    const [working, setWorking] = useState(false)
    const [imageWorking, setImageWorking] = useState(false)
    const [addWorking, setAddWorking] = useState(false)
    const [update, setUpdate] = useState()

    const [instanceToEdit, setInstanceToEdit] = useState(null)

    const navigate = useNavigate()

    useEffect(() => {
        const subscription = client.listen(`*[_type == "event" && _id == "${eventId}"]`).subscribe((updateQ) => {
            setTimeout(() => { setUpdate(updateQ) }, 1000);
        })
    }, [])

    const updateEventStates = () => {
        client.fetch(`*[_type == 'event' && _id == '${eventId}']{ name, published, galleryEnabled, description, creator -> { userName }, image, location, instances, categories, centers }`).then((data) => {
            if (data.length == 0) return navigate("/")
            data = data[0]
            setEventName(data.name)
            setCreator(data.creator.userName)
            setPublished(data.published)
            setDescription(data.description)
            setCategories(data.categories ? data.categories.map((x) => { return { value: x, label: x } }) : [])
            setCenters(data.centers ? data.centers.map((x) => { return { value: x, label: x } }) : [])
            setGalleryEnabled(data.galleryEnabled)
            setImage(data.image)
            setLocation(data.location)
            if (data.instances) setInstances(data.instances)
            setLoading(false)
        })
    }

    const addInstances = () => {
        if (!(instanceName && instanceName.length <= 100 && volunteersNumSlots >= 0 && supervisorsNumSlots >= 0 && hours > 0 && (volunteersNumSlots > 0 || supervisorsNumSlots > 0))) return;
        const sx = new Date("1/1/23 " + startTime.format("h:mm a"))
        const ex = new Date("1/1/23 " + endTime.format("h:mm a"))
        if (sx - ex > 0) return toast.error("Start time must be before end time.")
        const toAppend = []
        var calendarVals = selectedCalendarValue
        if (calendarVals.length == 0) calendarVals = [false]
        calendarVals.forEach((x) => {
            var s, e;
            if (x) s = new Date(x.format("MM/DD/YYYY ") + startTime.format("h:mm a"))
            if (x) e = new Date(x.format("MM/DD/YYYY ") + endTime.format("h:mm a"))
            toAppend.push({
                _type: 'eventInstance',
                start: s,
                end: e,
                numHours: parseInt(hours),
                volunteersNumSlots: parseInt(volunteersNumSlots),
                supervisorsNumSlots: parseInt(supervisorsNumSlots),
                signUps: [],
                active: active,
                name: instanceName,
                freeze: s ? new Date(new Date(s + 1000 * 60 * 60 * 24 * 7).toDateString()) : new Date(new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toDateString()),
                prerequisites: []
            })
        })
        const path = `instances`
        setWorking(true)
        setAddWorking(true)
        toast("Adding event instances...")
        client
            .patch(eventId)
            .setIfMissing({ [path]: [] })
            .append(path, toAppend)
            .commit({ autoGenerateArrayKeys: true })
            .then(() => {
                setWorking(false)
                setAddWorking(false)
                toast.dismiss()
                toast.success("Event instances added.")
                setInstanceName("")
            })
    }

    const updateMetadata = () => {
        if (!eventName && !published && !image && !location && !description) return
        setWorking(true)
        const patchDoc = {}
        if (eventName != null && eventName.length <= 100) patchDoc.name = eventName
        if (published != null) patchDoc.published = published
        if (image != null) patchDoc.image = image
        if (galleryEnabled != null) patchDoc.galleryEnabled = galleryEnabled
        if (categories != null) patchDoc.categories = categories.map((x) => x.value)
        if (centers != null) patchDoc.centers = centers.map((x) => x.value)
        if (location != null && location.length <= 100) patchDoc.location = location
        if (description != null && description.length <= 1000) patchDoc.description = description
        client
            .patch(eventId)
            .set(patchDoc)
            .commit()
            .then(() => {
                setWorking(false)
            })
    }

    const deleteEvent = () => {
        if (!window.confirm("Are you sure you want to delete this event? All signups and event data will be removed.")) return
        toast("Working...")
        client
            .delete({ query: `*[_type == "event" && _id == '${eventId}'][0]` })
            .then(() => {
                toast.dismiss()
                toast.success("Event deleted.")
                navigate("/")
            })
            .catch(console.error)
    }

    useEffect(() => {
        if (!user) return
        client.fetch(`*[_type == 'user' && email == '${user.email}']{ _id, role }`).then((data) => {
            setUserId(data[0]._id)
            setUserRole(data[0].role)
            if (data[0].role == "admin") updateEventStates()
        })
    }, [user])

    useEffect(() => {
        if (userRole && userRole != "admin") return navigate("/")
    }, [userRole])

    useEffect(() => {
        const newInstancesToShow = []
        instances?.forEach((x) => {
            if (!x.start && !x.end) newInstancesToShow.push(x)
            else selectedCalendarValue.forEach((y) => {
                if (
                    new DateObject(x.start).year == y.year &&
                    new DateObject(x.start).month.number == y.month.number &&
                    new DateObject(x.start).day == y.day
                ) newInstancesToShow.push(x)
            })
        })
        setInstancesToShow(newInstancesToShow)
    }, [instances, selectedCalendarValue])

    //useEffect(updateEventStates, [update])

    const publishEvent = () => {
        if (instances.length == 0) {
            setPublished(false)
            toast.error("Add at least one event instance before publishing.")
            return
        }
        if (categories.length == 0) {
            setPublished(false)
            toast.error("Add at least one category before publishing.")
            return
        }
        setPublished(true)
    }

    useEffect(updateMetadata, [published, galleryEnabled])

    useEffect(() => {
        if (!(image && image.name)) return
        setWorking(true)
        setImageWorking(true)
        client.assets
            .upload('image', image, { contentType: image.type, filename: image.name })
            .then((document) => {
                client
                    .patch(eventId)
                    .set({
                        image: {
                            _type: "image",
                            asset: {
                                _type: "reference",
                                _ref: document._id,
                            },
                        }
                    })
                    .commit()
                    .then(() => {
                        setWorking(false)
                        setImageWorking(false)
                    })
            })
    }, [image])

    const setCentersValidate = (m) => {
        if (m.length > 0) setCenters(m)
    }

    if (userRole == "admin") return !loading ?
        <>
            <ImageModal image={image} setImage={setImage} />
            <EditEventInstance eventId={eventId} instances={instances} instanceToEdit={instanceToEdit} setInstanceToEdit={setInstanceToEdit} working={working} setWorking={setWorking} />
            <div className="md:overflow-hidden md:h-[91.5%]">
                <div className="flex flex-col-reverse md:h-full md:flex-row overflow-hidden">
                    <div className="md:w-[calc(100%-18rem)] flex flex-col gap-4 overflow-y-scroll p-8">
                        <div className="sticky left-0">
                            <div className="flex flex-col lg:flex-row gap-6 items-center">
                                <div>
                                    <Calendar
                                        multiple
                                        value={selectedCalendarValue}
                                        onChange={setSelectedCalendarValue}
                                        mapDays={({ date, isSameDate }) => {
                                            var isPotential = false;
                                            for (var i = 0; i < instances.length; i++) {
                                                const m = new DateObject(new Date(new Date(instances[i].start).toDateString()))
                                                if (isSameDate(date, m)) {
                                                    isPotential = true;
                                                    break;
                                                }
                                            }
                                            var check = false;
                                            selectedCalendarValue.forEach((x) => {
                                                if (isSameDate(x, date)) check = true;
                                            })
                                            if (isPotential && !check) return {
                                                style: { color: "#0062ff", backgroundColor: "#c7e7ff" }
                                            }
                                        }}
                                    />
                                </div>
                                <div className="flex flex-col flex-1 gap-2 min-w-60">
                                    <div className="flex flex-col gap-2 xl:flex-row items-center w-full justify-around">
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
                                                    render={(value, openCalendar) => <button disabled={selectedCalendarValue.length == 0} onClick={openCalendar} className="nova btn min-w-max w-full">{value}</button>}
                                                />
                                            </div>
                                            <div className="nova uppercase text-sm">to</div>
                                            <div className="flex-1 flex justify-center">
                                                <DatePicker
                                                    value={endTime}
                                                    onChange={setEndTime}
                                                    disableDayPicker
                                                    format="h:mm a"
                                                    plugins={[
                                                        <TimePicker hideSeconds />
                                                    ]}
                                                    render={(value, openCalendar) => <button disabled={selectedCalendarValue.length == 0} onClick={openCalendar} className="nova btn min-w-max w-full">{value}</button>}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex flex-row items-center gap-3">
                                            <span className="nova uppercase text-sm">Active</span>
                                            <input type="checkbox" className="toggle" checked={active} onChange={(e) => setActive(e.target.checked)} />
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2 justify-center">
                                        <input value={instanceName} placeholder="Name" onChange={e => setInstanceName(e.target.value)} className="input input-bordered input-sm flex-1 w-28" maxLength={100} />
                                        <input value={hours} placeholder="Hours" onChange={e => setHours(e.target.value)} className="input input-bordered input-sm flex-1 w-28" type="number" min={0} />
                                        <input placeholder="Volunteer slots" value={volunteersNumSlots} onChange={e => setVolunteersNumSlots(e.target.value)} className="input input-bordered input-sm flex-1 w-28" type="number" min={0} />
                                        <input placeholder="Supervisor slots" value={supervisorsNumSlots} onChange={e => setSupervisorsNumSlots(e.target.value)} className="input input-bordered input-sm flex-1 w-28" type="number" min={0} />
                                    </div>
                                    <button className="btn shadow-md" disabled={!(instanceName && !addWorking && hours > 0 && volunteersNumSlots >= 0 && supervisorsNumSlots >= 0 && (volunteersNumSlots > 0 || supervisorsNumSlots > 0))} onClick={addInstances}>+ ADD</button>
                                </div>

                            </div>
                        </div>
                        <div className="flex flex-row gap-2">
                            <div className="overflow-hidden">
                                <MaterialReactTable
                                    columns={["name", "start", "end", "active", "numHours", "supervisorsNumSlots", "volunteersNumSlots"].map((x, i) => {
                                        var h = x;
                                        if (x == "supervisorsNumSlots") h = "Supervisor slots"
                                        else if (x == "volunteersNumSlots") h = "Volunteer slots"
                                        else if (x == "numHours") h = "Hours"
                                        const col = {
                                            accessorKey: x,
                                            header: h
                                        }
                                        if (x == "start" || x == "end" || x == "freeze") col.Cell = ({ cell }) => (
                                            <span>{cell.getValue() ? new DateObject(cell.getValue()).format("M/D/YY (h:mm a)") : "N/A"}</span>
                                        )
                                        if (x == "active") col.Cell = ({ cell }) => (
                                            <span>{cell.getValue() ? "Yes" : "No"}</span>
                                        )
                                        return col
                                    }).filter(x => x)}
                                    data={[...instancesToShow].sort((x, y) => x.start ? new Date(x.start) - new Date(y.start) : -1)}
                                    enablePinning
                                    getRowId={(row) => row._key}
                                    enableRowActions
                                    renderRowActions={({ row }) => (
                                        <button className="btn btn-sm btn-ghost btn-circle hover:brightness-90 transition-all" onClick={() => setInstanceToEdit(instances.find((x) => x._key == row.id))}><FiEdit2 /></button>
                                    )}
                                    renderTopToolbarCustomActions={() => (
                                        <div className="self-center text-base-content opacity-60">{selectedCalendarValue.length} date{selectedCalendarValue.length == 1 ? "" : "s"} selected ({instancesToShow.length} event instance{instancesToShow.length == 1 ? "" : "s"})</div>
                                    )}
                                    displayColumnDefOptions={{
                                        'mrt-row-actions': {
                                            header: 'Edit'
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
                        </div>
                    </div>
                    <div className="bg-base-300 flex flex-col md:overflow-y-scroll p-8 md:w-[22rem]">
                        <div className="flex flex-row justify-around md:justify-between items-center">
                            <div class="label-text text-base-content opacity-60">{working ? "Saving..." : "*All changes saved."}</div>
                            <div className="flex flex-col gap-2 items-center">
                                {
                                    !published ? <button className="btn btn-primary btn-circle" onClick={(e) => publishEvent()} ><HiMiniBarsArrowUp size="24" color="white" /></button> : <Link to={`/event/${eventId}`}><button className="btn btn-secondary btn-circle"><FiExternalLink size="24" color="white" /></button></Link>
                                }
                                <div className="text-base-content opacity-60 text-sm uppercase nova text-center font-bold">{published ? "View live" : "Publish"}</div>
                            </div>
                        </div>
                        <div>
                            <div class="form-control w-full">
                                <label class="label">
                                    <span class="label-text">Event name</span>
                                </label>
                                <input class="input input-bordered" value={eventName} onChange={(e) => setEventName(e.target.value)} onBlur={updateMetadata} maxLength="100" />
                            </div>
                            <div class="form-control w-full">
                                <label class="label">
                                    <span class="label-text">Image</span>
                                </label>
                                <div className="w-full h-48 rounded-lg relative cursor-pointer hover:brightness-90 transition-all overflow-hidden" onClick={() => !imageWorking && document.getElementById("imageModal").showModal()}>
                                    {
                                        imageWorking && <div className="absolute w-full h-full bg-black opacity-50">
                                            <span className="loading loading-spinner text-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></span>
                                        </div>
                                    }
                                    <div className="cursor-pointer w-full h-full" style={{ backgroundImage: `url(${image && !image.name ? urlFor(image).url() : placeholderImage})`, backgroundSize: "cover" }} />
                                </div>
                            </div>
                            <div class="form-control w-full">
                                <label class="label">
                                    <span class="label-text">Center</span>
                                </label>
                                <Select placeholder="" value={centers} onBlur={updateMetadata} options={centerOptions} isMulti isSearchable onChange={setCentersValidate} classNamePrefix="react-select" />
                            </div>
                            <div class="form-control w-full">
                                <label class="label">
                                    <span class="label-text">Category</span>
                                </label>
                                <Select placeholder="" value={categories} onBlur={updateMetadata} options={categoryOptions} isMulti isSearchable onChange={setCategories} classNamePrefix="react-select" />
                            </div>
                            <div class="form-control w-full">
                                <label class="label">
                                    <span class="label-text">Address</span>
                                </label>
                                <input maxLength="100" class="input input-bordered" value={location} onChange={(e) => setLocation(e.target.value)} onBlur={updateMetadata} />
                            </div>
                            <div class="form-control w-full">
                                <label class="label">
                                    <span class="label-text">Description</span>
                                </label>
                                <textarea maxLength="1000" class="textarea textarea-bordered" value={description} onChange={(e) => setDescription(e.target.value)} onBlur={updateMetadata} />
                            </div>
                            <div class="form-control w-full">
                                <label class="label">
                                    <span class="label-text">Gallery</span>
                                </label>
                                <input type="checkbox" className="toggle" checked={galleryEnabled} onChange={(e) => setGalleryEnabled(e.target.checked)} />
                            </div>
                            <div class="form-control w-full max-x-ws py-8">
                                <button class="btn btn-error w-24" onClick={deleteEvent}>DELETE</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div ></> : <Loader />
}

export default EditEvent