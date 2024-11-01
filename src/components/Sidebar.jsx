import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { BsFillClipboardDataFill } from 'react-icons/bs'
import { MdViewAgenda } from 'react-icons/md'
import { FaHome, FaUserAlt } from 'react-icons/fa'
import { FaGear } from 'react-icons/fa6'
import { GiHamburgerMenu } from 'react-icons/gi'

const Sidebar = ({ user }) => {
  const [sideBar, setSideBar] = useState(false);
  const sideNavRef = useRef(null);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    }
  }, []);

  const handleClickOutside = (e) => {
    if (sideNavRef.current && !sideNavRef.current.contains(e.target))
      setSideBar(false)
  }

  return (
    <div ref={sideNavRef} className="h-screen z-20">
      <div className={sideBar ? "w-20 py-4 gap-1 flex flex-col bg-neutral shadow-lg transition-all h-screen" : "-ml-20 md:ml-0 w-20 py-4 gap-1 flex flex-col bg-neutral shadow-lg h-screen transition-all"}>
        <Link to="/" onClick={() => { setSideBar(!sideBar) }} >
          <SideBarIcon icon={<FaHome size="32" />} text="Home" />
        </Link>
        <Link to="/profile" onClick={() => { setSideBar(!sideBar) }} >
          <SideBarIcon icon={<FaUserAlt size="28" />} text="Profile" />
        </Link>
        <Link to="/calendar" onClick={() => { setSideBar(!sideBar) }} >
          <SideBarIcon icon={<MdViewAgenda size="32" />} text="Calendar" />
        </Link>
        <Link to="/chapter" onClick={() => { setSideBar(!sideBar) }} >
          <SideBarIcon icon={<BsFillClipboardDataFill size="32" />} text="Chapter" />
        </Link>
        <Link to="/settings" onClick={() => { setSideBar(!sideBar) }} >
          <SideBarIcon icon={<FaGear size="32" />} text="Settings" />
        </Link>
      </div>
      <div className="fixed p-3 bottom-0 left-0 transition-all ml-0 md:-ml-20" onClick={() => { setSideBar(!sideBar) }}>
        <SideBarIcon icon={<GiHamburgerMenu size="30" />} />
      </div>
    </div>
  )
}

const SideBarIcon = ({ icon, text }) => (
  <div className="relative flex items-center justify-center h-14 w-14 mt-3 mb-3 mx-auto bg-secondary-content text-secondary hover:bg-secondary-focus hover:text-secondary-content rounded-3xl hover:scale-105 transition-all cursor-pointer group glass">
    {icon}
    {text && <span className="absolute w-auto p-2 m-5 min-w-max left-14 rounded-md shadow-md text-neutral-content bg-neutral text-xs transition-all scale-0 origin-left group-hover:scale-100">
      {text}
    </span>}
  </div>
)

export default Sidebar