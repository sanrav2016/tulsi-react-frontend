import React from 'react'
import { urlFor } from '../utils/client'
import { BsPersonLinesFill, BsCalendarEvent, BsFillCalendar2WeekFill } from 'react-icons/bs'
import { Link } from 'react-router-dom'
import { DateObject } from "react-multi-date-picker";
import placeholderImage from '../assets/placeholder.png'
import hdate from 'human-date'

const Pin = ({ pin }) => {
  if (pin._type == "event") {
    const arrayToMap = pin.published ? [...pin.instances.filter((x) => x.active && new Date(x.start).getTime() > new Date())].sort((a, b) => a.start ? new Date(a.start) - new Date(b.start) : -1).slice(0, 2) : null
    return (
      <Link to={pin.published ? `/event/${pin._id}` : `/edit/${pin._id}`} >
        <div className={`text-base-content bg-${pin.published ? 'primary' : 'neutral'} card glass shadow-lg rounded-md cursor-pointer hover:scale-[1.03] transition-all`}>
          <div className="text-secondary-content card-body p-4 border-b-2 border-accent-content text-sm">
            <span className="flex items-center gap-x-2 h-3"><BsPersonLinesFill /> {pin.creator}</span>
            <span className="flex items-center gap-x-2 h-3"><BsCalendarEvent />{hdate.relativeTime(new Date(pin._updatedAt.toString()))}</span>
          </div>
          <div className="relative flex justify-content items-center">
            <figure>
              <img src={pin.image ? urlFor(pin.image).url() : placeholderImage} style={{ zIndex: 1 }} alt="User post" />
            </figure>
            <span className="loading loading-spinner text-primary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></span>
          </div>
          <div className="card-body p-1 gap-0">
            <div className="p-2 flex flex-col">
              {
                pin.published && arrayToMap.map((y) => {
                  return y.start && y.end ?
                    <div className="bg-secondary text-secondary-content glass p-1 pl-2 rounded-md mb-1">
                      <div className="flex flex-wrap gap-x-2 items-center">
                        <div style={{ maxWidth: "300px" }}>
                          <div className="flex gap-x-2 items-center">
                            <BsFillCalendar2WeekFill />
                            <div>
                              {new DateObject(new Date(y.start)).format("MMM DD")}
                            </div>
                          </div>
                        </div>
                        <div>
                          <div className="text-sm">{new DateObject(new Date(y.start)).format("h:mm a")}-{new DateObject(new Date(y.end)).format("h:mm a")} ({y.numHours} hr{y.numHours != 1 ? "s" : ""})</div>
                        </div>
                      </div>
                    </div>
                    :
                    <div className="bg-secondary text-secondary-content glass p-1 pl-2 rounded-md mb-1">
                      {y.numHours} hr{y.numHours != 1 ? "s" : ""}
                    </div>
                })
              }
              {
                pin.published && arrayToMap.length > 2 &&
                <div className="bg-accent text-accent-content glass p-1 rounded-md mb-1 text-center">
                  +{arrayToMap.length - 2} more
                </div>
              }
              {
                pin.published && arrayToMap.length == 0 &&
                <div className="bg-neutral text-neutral-content glass p-1 rounded-md mb-1 text-center">Closed</div>
              }
            </div>
            <div className="bg-base-100 p-4 rounded-md glass">
              <h1 className="text-3xl nova">{!pin.published ? <span className="text-accent">(DRAFT) </span> : <></>}{pin.name}</h1>
              <p className="text-sm">{pin.description?.length > 200 ? pin.description?.substring(0, 200).trim() + "..." : pin.description}</p>
            </div>
          </div>
        </div>
      </Link>
    )
  } else {
    return (
      <Link to={`/event/${pin.eventId}`} >
        <div className="text-base-content bg-accent card glass shadow-lg rounded-md cursor-pointer hover:scale-105 transition-all overflow-hidden">
          <div className="text-accent-content card-body p-4 border-b-2 border-accent-content text-sm">
            <span className="flex items-center gap-x-2 h-3"><BsPersonLinesFill /> {pin.creator}</span>
            <span className="flex items-center gap-x-2 h-3"><BsCalendarEvent />{hdate.relativeTime(new Date(pin.uploaded.toString()))}</span>
          </div>
          <div className="relative flex justify-content items-center">
            <figure>
              <img src={urlFor(pin.image).url()} style={{ zIndex: 1 }} alt="User post" />
            </figure>
            <span className="loading loading-spinner text-primary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></span>
          </div>
        </div>
      </Link>
    )
  }
}

export default Pin