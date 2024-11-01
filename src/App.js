import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast';

import { Login, Home } from './pages'

const App = () => {
  return (
    <>
      <Routes>
        <Route path="login" element={<Login />} />
        <Route path="/*" element={<Home />} />
      </Routes>
      <Toaster toastOptions={{
        className: 'p-4 text-base-content bg-white text-center shadow-md'
      }} />
    </>
  )
}

export default App