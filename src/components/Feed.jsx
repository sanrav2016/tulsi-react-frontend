import React, { useState, useEffect } from 'react'
import Masonry from 'react-masonry-css'
import Pin from './Pin'
import Loader from './Loader'
import { client } from '../utils/client'
import { BiSearchAlt } from 'react-icons/bi'
import { FiPlus } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast';

const Feed = ({ user }) => {
  const [userId, setUserId] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [userLocation, setUserLocation] = useState(null)
  const navigate = useNavigate()
  const breakPointColumns = {
    default: 5,
    1300: 4,
    950: 3,
    800: 2,
    600: 1
  };

  useEffect(() => {
    if (!user) return
    client.fetch(`*[_type == 'user' && email == '${user.email}']{_id, role, location}`).then((data) => {
      setUserId(data[0]._id)
      setUserRole(data[0].role)
      setUserLocation(data[0].location)
    })
  }, [user])

  const [loading, setLoading] = useState(true);
  const [pins, setPins] = useState([]);
  const [pinsToShow, setPinsToShow] = useState([]);
  const [search, setSearch] = useState("");

  const createEvent = () => {
    toast("Creating event...")
    client.create({
      _type: 'event',
      name: "New event",
      creator: {
        _type: 'user',
        _ref: userId,
        _weak: true
      },
      published: false,
      instances: [],
      categories: [],
      centers: [userLocation],
      galleryEnabled: true
    }).then((res) => {
      toast.dismiss()
      navigate(`edit/${res._id}`)
    })
  }

  useEffect(() => {
    if (!userRole || !userLocation) return
    client.fetch(`*[_type == 'event'${userRole != "admin" ? ` && "${userLocation}" in centers` : ""}][0...50]{ _type, _id, name, image, "gallery": gallery[]{ _type, "eventId": ^._id, "eventName": ^.name, uploaded, "creator": creator->userName, image }, description, 'creator': creator->userName, _updatedAt, instances, published } | order(_updatedAt desc)`).then((data) => {
      var d = data;
      if (userRole != "admin")
        d = data.filter(x => x.published)
      var p = []
      d.forEach((x) => {
        if (x.gallery) p = p.concat(x.gallery)
      })
      d = d.concat(p)
      d = d.sort((a, b) => {
        const ax = a.uploaded ? new Date(a.uploaded) : new Date(a._updatedAt)
        const bx = b.uploaded ? new Date(b.uploaded) : new Date(b._updatedAt)
        return bx - ax
      })
      setPins(d)
      setPinsToShow(d)
      setTimeout(() => { setLoading(false) }, 300);
    })
  }, [userRole])

  useEffect(() => {
    if (search == "") return setPinsToShow(pins)
    const pinsQ = []
    pins.forEach((pin) => {
      const arr = [pin.creator, pin.name, pin.description, pin.eventName, !pin.published && !pin.eventName ? "draft" : null]
      var found = false;
      arr.forEach((n) => {
        if (n && n.toLowerCase().trim().includes(search.toLowerCase().trim())) found = true;
      })
      if (found) pinsQ.push(pin)
    })
    setPinsToShow(pinsQ)
  }, [search])

  return (
    <>
      {
        !loading ? (
          <div className="relative h-full w-full">
            {
              userRole == "admin" ?
                <div className="flex justify-center items-center h-14 w-14 mr-3 mb-6 rounded-3xl fixed right-0 bottom-0 z-[999] bg-secondary text-center text-6xl text-white glass hover:bg-primary transition-all cursor-pointer hover:scale-105 shadow-lg" onClick={createEvent}>
                  <FiPlus size="36" color="white" />
                </div>
                : <></>
            }
            <div className="p-6 flex flex-col gap-6">
              <div className="flex justify-center">
                <div className="relative">
                  <input type="text" placeholder="Search..." className="input input-bordered w-full max-w-xs pl-10 focus:outline-none focus:ring focus:border-blue-500" value={search} onChange={(e) => { setSearch(e.target.value) }} />
                  <div className="absolute left-3 top-4 text-lg"><BiSearchAlt /></div>
                </div>
              </div>
              <Masonry
                breakpointCols={breakPointColumns}
                className="flex gap-4"
                columnClassName='flex flex-col gap-4'>
                {
                  pinsToShow?.map((pin) => <Pin key={pin._id} pin={pin} className="w-max" />)
                }
              </Masonry>
              {
                pinsToShow.length == 0 &&
                <div className="text-center">
                  Nothing to show.
                </div>
              }
            </div>
          </div>
        ) : (
          <Loader />
        )
      }
    </>
  )
}

export default Feed