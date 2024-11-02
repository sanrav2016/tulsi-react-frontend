import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import JWT from 'expo-jwt';
import { client } from '../utils/client'
import Cookies from 'universal-cookie'
import toast from 'react-hot-toast';
import bcrypt from 'bcryptjs-react';
import { FaUser, FaKey } from 'react-icons/fa6'

import logo from '../assets/logo_white_b.png'
import logoOrg from '../assets/logo_white.png'

const Login = () => {
    const navigate = useNavigate();
    const [emailInput, setEmailInput] = useState("")
    const [passwordInput, setPasswordInput] = useState("")
    const [searchParams, setSearchParams] = useSearchParams();
    const [rememberMe, setRememberMe] = useState(true)
    const cookies = new Cookies();

    useEffect(() => {
        if (cookies.get('user') == null) return
        navigate('/', { replace: true })
        document.addEventListener("keyup", (e) => e.key == 13 ? startLogin() : null)
    }, [])

    const postLogin = (u, c) => {
        if (cookies.get('user')) return
        const t = rememberMe ? 2.592e+9 : 1.8e+6
        cookies.set('user', c,
            {
                path: '/',
                expires: new Date(Date.now() + t)
            }
        );
        toast("Welcome, " + u.name + "!")
        navigate('/' + (searchParams.get("url") ? searchParams.get("url") : ""), { replace: true })
    }

    const startLogin = () => {
        if (emailInput == "" || passwordInput == "") return
        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = bcrypt.hashSync(passwordInput, salt);
        toast.loading("Signing in...");
        client.fetch(`*[_type == 'user' && email == '${emailInput.trim().toLowerCase()}']`).then((data) => {
            toast.dismiss();
            if (data.length != 1)
                return toast.error("Account not found.")
            if (!bcrypt.compareSync(passwordInput, data[0].password))
                return toast.error("Incorrect password.")
            const user = {
                name: data[0].userName,
                email: data[0].email,
                role: data[0].role
            }
            const jwt = JWT.encode(user, process.env.REACT_APP_JWT_KEY)
            postLogin(user, jwt)
        })
    }

    return (
        <div className="flex justify-start items-center flex-col h-screen">
            <div className="relative w-full h-full">
                <div className="absolute w-full h-full flex flex-col justify-center items-end top-0 left-0 bg-gradient-to-br from-[#570DF8] to-[#EF00B8]">
                    { window.innerWidth >= 768 &&
                        <div className="absolute top-0 left-0 w-[calc(100%-300px)] h-full opacity-50 z-0 overflow-hidden pointer-events-none">
                            <iframe style={{display:"block"}} className="w-[300%] h-full ml-[-100%] scale-150"
                                src="https://www.youtube.com/embed/hJx55F3HLtY?playlist=hJx55F3HLtY&mute=1&loop=1&controls=0&autoplay=1">
                            </iframe>
                        </div>
                    }
                    <div className="z-10 flex flex-col gap-10 bg-gradient-to-tr from-[#ffffff4d] to-[#ffff00b0] p-10 h-full w-full md:w-[300px] shadow-xl justify-center items-center">
                        <div className="flex flex-col gap-2 justify-center items-center">
                            <img src={logo} width="150px" alt="Tulsi Logo" />
                            <div className="w-24 h-[1px] bg-white rounded-lg" />
                            <img src={logoOrg} width="150px" alt="SEWA Logo" />
                        </div>
                        <div className="flex flex-col items-center max-w-sm w-full">
                            <div className="flex flex-row items-center input input-bordered w-full py-4 px-0 input-sm rounded-b-none focus:outline-offset-0">
                                <div className="w-10 flex justify-center opacity-80"><FaUser /></div>
                                <input type="text" placeholder="Email" className="flex-1 bg-transparent outline-none" value={emailInput} onChange={(e) => { setEmailInput(e.target.value) }} />
                            </div>
                            <div className="flex flex-row items-center input input-bordered w-full py-4 px-0 input-sm rounded-none focus:outline-offset-0">
                                <div className="w-10 flex justify-center opacity-80"><FaKey /></div>
                                <input type="password" placeholder="Password" className="flex-1 bg-transparent outline-none" value={passwordInput} onChange={(e) => { setPasswordInput(e.target.value) }} />
                            </div>
                            <label className="cursor-pointer flex flex-row gap-1 items-center bg-[#ffffff5b] w-full justify-center p-1">
                                <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="checkbox checkbox-xs" />
                                <span className="label-text text-xs">Remember me</span>
                            </label>
                            <button onClick={startLogin} className="nova btn btn-neutral w-full rounded-t-none">
                                Login
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Login