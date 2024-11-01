import React, { useState, useEffect } from 'react'
import { Route, Routes, useNavigate, useLocation } from 'react-router-dom'
import JWT from 'expo-jwt'
import Cookies from 'universal-cookie'

import { Sidebar, Feed } from '../components'
import EventDesc from './EventDesc'
import Calendar from './Calendar'
import Profile from './Profile'
import Settings from './Settings'
import Chapter from './Chapter'
import EditEvent from './EditEvent'

import logo from '../assets/logo_purple.png'
import { MdLogout } from 'react-icons/md'

const Home = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const cookies = new Cookies()
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (cookies.get('user') == null) {
      var path = "login"
      const pathname = location.pathname.substring(1)
      if (pathname != "") path += "?url=" + pathname
      return navigate(path, { replace: true })
    }
    setUser(JWT.decode(cookies.get('user'), process.env.REACT_APP_JWT_KEY))
  }, [])

  const logOut = () => {
    cookies.remove('user', { path: '/' });
    if (cookies.get('user')) return logOut()
    navigate("/login")
    return false
  }

  return (
    <div className="flex w-screen h-screen">
      <Sidebar user={user} />
      <div className="h-screen overflow-y-scroll w-full">
        <div className="sticky top-0 z-10 shadow-lg flex justify-between items-center bg-base-300 glass">
          <img src={logo} width="100px" className="bg-purple-100 p-2" alt="Logo" />
          <div className="p-2 flex flex-row gap-3 items-center">
            <div className="text-base-content opacity-60 font-bold flex flex-col invisible md:visible">
              <div className="nova uppercase leading-none text-right">{user?.name}</div>
              <div className="text-xs font-normal leading-none text-right">{user?.email}</div>
            </div>
            <button className="btn btn-circle btn-sm btn-accent" onClick={logOut}><MdLogout /></button>
          </div>
        </div>
        <Routes>
          <Route path="/*" element={<Feed user={user} />} />
          <Route path="event">
            <Route path=":eventId" element={<EventDesc user={user} />} />
          </Route>
          <Route path="calendar" element={<Calendar user={user} />} />
          <Route path="profile" element={<Profile user={user} />} />
          <Route path="chapter" element={<Chapter user={user} />} />
          <Route path="settings" element={<Settings user={user} />} />
          <Route path="edit">
            <Route path=":eventId" element={<EditEvent user={user} />} />
          </Route>
        </Routes>
      </div>
    </div>
  )
}

export default Home