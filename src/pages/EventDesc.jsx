import hdate from 'human-date'
import React, { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { client, urlFor } from '../utils/client'
import { Loader, EventSignUp } from '../components'
import { BsPersonLinesFill } from 'react-icons/bs'
import { FaLocationDot, FaTrash } from 'react-icons/fa6'
import { FiEdit2 } from 'react-icons/fi'
import { DateObject } from "react-multi-date-picker";
import { FaUpload } from 'react-icons/fa6'
import toast from 'react-hot-toast'
import { BiSolidCategoryAlt } from "react-icons/bi"
import { IoCheckmarkDoneSharp } from "react-icons/io5";
import Sparkle from 'react-sparkle'
import { MaterialReactTable } from 'material-react-table';

import placeholderImage from '../assets/placeholder.png'

const EventDesc = ({ user }) => {
  let { eventId } = useParams();

  const [userId, setUserId] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [userLocation, setUserLocation] = useState(null)

  const [eventData, setEventData] = useState(null);
  const [calendarData, setCalendarData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [value, setValue] = useState(null);
  const [dataToDisplay, setDataToDisplay] = useState([]);
  const [update, setUpdate] = useState(null);
  const [approveList, setApproveList] = useState([]);

  const [galleryEnabled, setGalleryEnabled] = useState(true)
  const [galleryMode, setGalleryMode] = useState(false)
  const [approveTableSelect, setApproveTableSelect] = useState({})

  const navigate = useNavigate()

  useEffect(() => {
    if (!user) return
    client.fetch(`*[_type == 'user' && email == '${user.email}']{_id, role, location}`).then((data) => {
      setUserId(data[0]._id)
      setUserRole(data[0].role)
      setUserLocation(data[0].location)
    })
  }, [user])

  useEffect(() => {
    const subscription = client.listen(`*[_type == "event" && _id == "${eventId}"]`).subscribe((updateQ) => {
      setTimeout(() => { setUpdate(updateQ) }, 1000);
    })
  }, [])

  useEffect(() => {
    approveAllHours()
    client.fetch(`*[_type == "event" && _id == "${eventId}" && published]{ name, categories, description, "creator": creator->userName, location, _id, image, 
    galleryEnabled, "gallery": gallery[]{ _key, uploaded, "creator": creator->userName, "creatorId": creator->_id, image }, "instances": instances[]{ _key, name, freeze, prerequisites, numHours, volunteersNumSlots, supervisorsNumSlots, start, end, active, signUps[]{ _key, "_id": signedUpUser->_id, "name": signedUpUser->userName, "role": signedUpUser->role, verified, numHours, comment, primary, adminConfirmed } } }`).then((data) => {
      if (data.length == 0) return navigate("/")
      setEventData(data[0])
      data[0].instances.forEach((x, i) => {
        var volunteerCount = 0, supervisorCount = 0;
        x.signUps?.forEach((y) => {
          if (y.role == "volunteer") volunteerCount++
          else supervisorCount++
        })
        data[0].instances[i].volunteerSlotsLeft = x.volunteersNumSlots - volunteerCount
        data[0].instances[i].supervisorSlotsLeft = x.supervisorsNumSlots - supervisorCount
      })
      setCalendarData(data[0].instances)
      const premier = data[0].instances?.filter((x) => x.start && x.end).sort((a, b) => new Date(a.start) - new Date(b.start))[0]
      if (!value) setValue(premier?.start ? new DateObject(premier.start) : null)
      setGalleryEnabled(data[0].galleryEnabled)
      if (data[0].gallery && data[0].gallery.length == 0 && galleryMode) setGalleryMode(false);
      setTimeout(() => { setLoading(false) }, 300);
    })
  }, [userRole, update])

  useEffect(() => {
    const instances = calendarData?.filter(item =>
      value == null || !item.start && !item.end ||
      (
        new DateObject(item.start).year == value.year &&
        new DateObject(item.start).month.number == value.month.number &&
        new DateObject(item.start).day == value.day
      )
    ).sort((a, b) => a.start && new Date(a.start) - new Date(b.start))
    const dataToDisplayProp = []
    instances?.forEach((instance) => {
      dataToDisplayProp.push({
        _instance_key: instance._key,
        name: instance.name,
        startTime: instance.start ? new DateObject(instance.start).format("h:mm a") : null,
        endTime: instance.end ? new DateObject(instance.end).format("h:mm a") : null,
        hours: instance.numHours,
        volunteers: instance.signUps ? instance.signUps.filter((x) => x.role == "volunteer").map((x) => { return { _key: x._key, _id: x._id, name: x.name, verified: x.verified, numHours: x.numHours, comment: x.comment ? x.comment : "" } }) : [],
        supervisors: instance.signUps ? instance.signUps.filter((x) => x.role == "supervisor").map((x) => { return { _key: x._key, _id: x._id, name: x.name, verified: x.verified, numHours: x.numHours, comment: x.comment ? x.comment : "", primary: x.primary } }) : [],
        vSlotsLeft: instance.volunteerSlotsLeft,
        sSlotsLeft: instance.supervisorSlotsLeft,
        volunteersNumSlots: instance.volunteersNumSlots,
        supervisorsNumSlots: instance.supervisorsNumSlots,
        isUserSignedUp: instance.signUps ? instance.signUps.map((x) => x._id).includes(userId) : false,
        active: instance.active,
        prerequisites: instance.prerequisites,
        freeze: instance.freeze,
        volunteerIndex: dataToDisplay.find((x) => x._instance_key = instance._key)?.volunteerIndex || 0,
        supervisorIndex: dataToDisplay.find((x) => x._instance_key = instance._key)?.supervisorIndex || 0,
      })
    })
    setDataToDisplay(dataToDisplayProp)
  }, [calendarData, value])

  useEffect(() => {
    const a = document.createElement("a")
    if (galleryMode) {
      a.href = "#" + galleryMode
      setTimeout(() => a.click(), 1)
    } else navigate("")
  }, [galleryMode])

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      toast("Uploading image...")
      const image = e.target.files[0]
      client.assets
        .upload('image', image, { contentType: image.type, filename: image.name })
        .then((document) => {
          client
            .patch(eventId)
            .setIfMissing({ gallery: [] })
            .append('gallery', [{
              _type: 'eventImage',
              creator: {
                _type: 'user',
                _ref: userId,
                _weak: true
              },
              uploaded: new Date(),
              image: {
                _type: "image",
                asset: {
                  _type: "reference",
                  _ref: document._id,
                },
              }
            }])
            .commit({ autoGenerateArrayKeys: true })
            .then(() => {
              toast.dismiss()
            })
        })
    }
  }

  const deleteGalleryImage = (x) => {
    setGalleryMode(false)
    toast("Deleting...")
    client
      .patch(eventId)
      .unset([`gallery[_key=="${x}"]`])
      .commit()
      .then(() => {
        toast.dismiss()
      })
  }

  const approveAllHours = (open = false) => {
    if (userRole != "admin") return
    client.fetch(`*[_type == "event" && _id == "${eventId}"]{ "signUps": instances[].signUps[adminConfirmed != true]{ _key, "instanceKey": ^.instances[^._key in signUps[]._key][0]._key, "eventName": ^.instances[^._key in signUps[]._key][0].name, "name": signedUpUser->userName, verified, numHours } }.signUps`).then((d) => {
      setApproveList(d[0].filter((x) => x != null))
      if (open) document.getElementById("approveModal")?.showModal()
    })
  }

  const approveAllHoursFinal = () => {
    if (userRole != "admin") return
    document.getElementById("approveModal").close()
    const toSet = {}
    Object.keys(approveTableSelect).forEach((x) => {
      if (!x) return
      const m = approveList.find((y) => y._key == x)
      if (!m) return
      toSet[`instances[_key=="${m.instanceKey}"].signUps[_key=="${m._key}"].adminConfirmed`] = true
      if (!m.verified) toSet[`instances[_key=="${m.instanceKey}"].signUps[_key=="${m._key}"].verified`] = true
    })
    if (Object.keys(toSet).length == 0) return
    toast("Working...")
    client
      .patch(eventId)
      .set(toSet)
      .commit()
      .then(() => {
        toast.dismiss()
        toast.success("Hours published.")
      })
  }

  return (
    <>
      {
        !loading ? (
          <div>
            {
              userRole == "admin" &&
              <dialog id="approveModal" className="modal">
                <div className="modal-box">
                  <div className="flex flex-col gap-2">
                    <h3 className="font-bold text-2xl nova pb-2">Pubish hours</h3>
                    {approveList.length > 0 ?
                      <>
                        <div className="overflow-hidden">
                          <MaterialReactTable
                            columns={["_key", "name", "eventName", "verified", "numHours"].map((x, i) => {
                              const col = {
                                accessorKey: x,
                                header: x,
                                size: x == "Name" ? 150 : 50
                              }
                              if (x == "numHours") col.header = "Hours"
                              if (x == "eventName") col.header = "Event"
                              if (x == "verified") col.Cell = ({ cell }) => (
                                <span>{cell.getValue() ? "Yes" : "No"}</span>
                              )
                              return col
                            }).filter(x => x)}
                            data={[...approveList]}
                            enableRowSelection={true}
                            getRowId={(row) => row._key}
                            onRowSelectionChange={setApproveTableSelect}
                            state={{ rowSelection: approveTableSelect }}
                            enableTopToolbar={false}
                            enableBottomToolbar={false}
                            enablePagination={false}
                            initialState={{ density: 'compact', columnVisibility: { _key: false } }}
                            positionToolbarAlertBanner="none"
                            renderToolbarInternalActions={({ table }) => (
                              <></>
                            )}
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
                          /></div>
                        <button className="btn" disabled={Object.keys(approveTableSelect).length == 0} onClick={approveAllHoursFinal}>Publish</button></> : <div className="text-sm italic text-center">No pending hours to publish.</div>}
                  </div>
                  <form method="dialog">
                    <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
                  </form>
                </div>
              </dialog>
            }
            <div className="h-fit">
              <div className="relative hero min-h-full bg-slate-200" style={{ backgroundImage: `url(${eventData.image ? urlFor(eventData.image).url() : placeholderImage})` }}>
                {userRole == "admin" ? <Link to={`/edit/${eventId}`}><button className="z-[1] absolute top-2 right-2 btn btn-primary btn-circle m-2 border-white"><FiEdit2 size="24" color="white" /></button></Link> : <></>}
                {userRole == "admin" ?
                  <div className="indicator z-[1] absolute top-4 right-20">
                    {approveList.length > 0 && <span className="indicator-item badge badge-base-100">{approveList.length}</span>}
                    <button className="btn btn-secondary btn-circle border-white m-0" onClick={() => approveAllHours(true)}>
                      <IoCheckmarkDoneSharp size="26" color="white" />
                    </button>
                  </div>
                  : <></>}
                <div className="hero-overlay bg-opacity-80"></div>
                <div className="hero-content text-center text-neutral-content pt-16 pb-16">
                  <div className="max-w-lg">
                    <div style={{ position: 'relative' }}>
                      <Sparkle
                        color={'random'}
                        overflowPx={5}
                        fadeOutSpeed={20}
                        flickerSpeed={'slowest'}
                      />
                      <div className="mb-5 text-7xl font-bold nova break-all md:break-normal" style={{ filter: 'drop-shadow(3px 3px 0px black)' }}>{eventData.name}</div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-center">
                        <div className="flex flex-row items-center gap-2"><BsPersonLinesFill />{eventData.creator}</div>
                      </div>
                      {
                        eventData.location &&
                        <div className="flex justify-center">
                          <div className="flex flex-row items-center gap-2"><FaLocationDot />{eventData.location}</div>
                        </div>
                      }
                      {
                        eventData.categories && eventData.categories.length > 0 &&
                        <div className="flex justify-center">
                          <div className="flex flex-row items-center gap-2"><BiSolidCategoryAlt />{eventData.categories.join(", ")}</div>
                        </div>
                      }
                      <div className="max-h-48 overflow-y-scroll flex flex-col gap-2">{
                        eventData.description?.split("\n").map((x) => <p>{x}</p>)
                      }</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {
              galleryEnabled &&
              <div className={`bg-base-content ${galleryMode && "absolute w-full h-full top-0 left-0 z-[9999]"}`}>
                <div class="carousel w-full h-full">
                  <div className={`${!galleryMode && "carousel-item"} relative h-48 w-24 bg-neutral flex flex-col gap-3 justify-center items-center cursor-pointer hover:brightness-90 transition-all`}>
                    <FaUpload size="28" color="rgb(148 163 184)" />
                    <span className="text-slate-400 text-sm text-center nova">UPLOAD</span>
                    <input type="file" accept=".png,.jpg" onChange={handleImageChange} className="cursor-pointer absolute top-0 left-0 w-full h-full opacity-0" />
                  </div>
                  {
                    eventData.gallery?.length > 0 ? [...eventData.gallery].sort((a, b) => new Date(b.uploaded) - new Date(a.uploaded)).map((x, i) =>
                      <div className={`relative carousel-item h-48 w-48 ${galleryMode && "w-full h-full"} cursor-pointer group`} onClick={() => !galleryMode && setGalleryMode(i.toString())}>
                        <div className="absolute top-0 left-0 w-full h-full">
                          <span className="loading loading-spinner text-primary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></span>
                        </div>
                        <div style={{ backgroundImage: !galleryMode ? `url(${urlFor(x.image).url()})` : "", backgroundSize: "cover" }} className={`z-[1] w-full h-full ${galleryMode && "w-auto"}`} >
                          <div id={i} className={`relative h-full w-full flex justify-center items-center ${!galleryMode && "opacity-0 group-hover:opacity-100"} transition-all`}>
                            {
                              galleryMode && <img src={urlFor(x.image).url()} className="max-h-full max-w-full" />
                            }
                            <div className="bg-gradient-to-t from-[#0000008c] to-transparent absolute bottom-0 left-0 p-4 text-white nova uppercase flex flex-row justify-between w-full items-center">
                              <div>
                                <div className="font-bold">{x.creatorId == userId ? "You" : x.creator}</div>
                                <div className="text-sm">{hdate.relativeTime(new Date(x.uploaded))}</div>
                              </div>
                              {(x.creatorId == userId || userRole == "admin") && galleryMode && <FaTrash className="hover:scale-110 transition-all cursor-pointer" color="white" size="20" onClick={() => deleteGalleryImage(x._key)} />}
                            </div>
                            {
                              galleryMode &&
                              <>
                                <button className="btn btn-sm btn-ghost text-white absolute right-1 top-3 text-xl hover:scale-110 transition-all cursor-pointer" onClick={() => setGalleryMode(false)}>✕</button>
                                <div className="absolute flex justify-between transform -translate-y-1/2 left-5 right-5 top-1/2">
                                  <a href={`#${i - 1}`} className={`btn btn-circle text-2xl ${i > 0 ? "visible" : "invisible"}`}>❮</a>
                                  <a href={`#${i + 1}`} className={`btn btn-circle text-2xl ${i + 1 < eventData.gallery?.length ? "visible" : "invisible"}`}>❯</a>
                                </div>
                              </>
                            }
                          </div>
                        </div>
                      </div>
                    ) : <div className="flex items-center text-slate-400 p-4">Upload an image to the gallery!</div>
                  }
                </div>
              </div>
            }
            <EventSignUp
              eventData={eventData}
              calendarData={calendarData}
              dataToDisplay={dataToDisplay}
              setDataToDisplay={setDataToDisplay}
              value={value}
              setValue={setValue}
              user={user}
              userId={userId}
              userRole={userRole}
            />
          </div >
        ) : (
          <Loader />
        )
      }
    </>
  )
}

export default EventDesc