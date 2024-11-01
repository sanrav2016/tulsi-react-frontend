import React from 'react'
import { MutatingDots } from 'react-loader-spinner'

const Loader = ({ full = true }) => {
  return (
    <div className={full ? "flex justify-center items-center h-screen" : "flex justify-center items-center"}>
      <MutatingDots
        height="100"
        width="100"
        color="white"
        secondaryColor='#002e73'
        radius='12.5'
        ariaLabel="mutating-dots-loading"
        wrapperStyle={{}}
        wrapperClass=""
        visible={true}
      />
    </div>
  )
}

export default Loader