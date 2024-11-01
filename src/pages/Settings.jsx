import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { client } from '../utils/client'
import { Loader } from '../components'
import toast from 'react-hot-toast';
import bcrypt from 'bcryptjs-react';

const Settings = ({ user }) => {
    const [userId, setUserId] = useState(null)
    const [userName, setUserName] = useState(null)
    const [userEmail, setUserEmail] = useState(null)
    const [userRole, setUserRole] = useState(null)
    const [userLocation, setUserLocation] = useState(null)

    const [loading, setLoading] = useState(true)
    const [tab, setTab] = useState(0)

    const [resetPwd, setResetPwd] = useState("")
    const [confirmPwd, setConfirmPwd] = useState("")

    useEffect(() => {
        if (!user) return
        var query = `*[_type == 'user' && email == "${user.email}"][0]{ _id, role, location }`
        client.fetch(query).then((data) => {
            setUserId(data._id)
            setUserName(user.name)
            setUserEmail(user.email)
            setUserRole(data.role)
            setUserLocation(data.location)
            setLoading(false);
        })
    }, [user])

    const resetPassword = () => {
        if (resetPwd != confirmPwd) return
        if (resetPwd.length > 16 || resetPwd.length < 4) return
        if (!/[A-Z]/.test(resetPwd) || !/[a-z]/.test(resetPwd) || !/[0-9]/.test(resetPwd) || !/[ `!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/.test(resetPwd)) return
        toast("Working...")
        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = bcrypt.hashSync(resetPwd, salt);
        client
            .patch(userId)
            .set({ password: hashedPassword })
            .commit()
            .then(() => {
                toast.dismiss()
                toast.success("Password reset successfully.")
                setResetPwd("")
                setConfirmPwd("")
            })
    }

    return (
        <>
            {
                !loading ? (
                    <div className="px-2 md:px-32 py-16">
                        <div className="text-6xl nova pb-6">Settings</div>
                        <div className="flex flex-col md:flex-row gap-8">
                            <div className="md:w-48">
                                <ul className="menu bg-base-200 rounded-box shadow-md">
                                    <li onClick={() => setTab(0)}><a>Account information</a></li>
                                    <li onClick={() => setTab(1)}><a>Reset password</a></li>
                                    <li onClick={() => setTab(2)}><a>Notifications</a></li>
                                </ul>
                            </div>
                            <div className="md:flex-1">
                                {

                                    tab == 0 && <div className="flex flex-col gap-1 md:w-72">
                                        <div className="text-2xl">Account information</div>
                                        <div className="flex flex-col text-sm">
                                            <div>Name: {userName}</div>
                                            <div>Email: {userEmail}</div>
                                            <div>Center: {userLocation}</div>
                                        </div>
                                    </div>
                                }
                                {
                                    tab == 1 && <div className="flex flex-col gap-3 md:w-72">
                                        <div className="text-2xl">Reset password</div>
                                        <div className="flex flex-col gap-2">
                                            <input className="input input-sm" type="password" placeholder="New password" value={resetPwd} maxLength={16} minLength={4} onChange={(e) => setResetPwd(e.target.value)} />
                                            <input className="input input-sm" type="password" placeholder="Confirm new password" value={confirmPwd} maxLength={16} minLength={4} onChange={(e) => setConfirmPwd(e.target.value)} />
                                            <ul className="text-xs list-disc ml-4 text-red-600 py-2">
                                                <li className={resetPwd.length >= 4 && resetPwd.length <= 16 ? 'text-green-600' : ''}>Between 4 and 16 characters.</li>
                                                <li className={/[A-Z]/.test(resetPwd) ? 'text-green-600' : ''}>Contains at least one uppercase letter.</li>
                                                <li className={/[a-z]/.test(resetPwd) ? 'text-green-600' : ''}>Contains at least one lowercase letter.</li>
                                                <li className={/[0-9]/.test(resetPwd) ? 'text-green-600' : ''}>Contains at least one number.</li>
                                                <li className={/[`!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/.test(resetPwd) ? 'text-green-600' : ''}>Contains at least one special character.</li>
                                                <li className={resetPwd != "" && resetPwd == confirmPwd ? 'text-green-600' : ''}>Password is confirmed.</li>
                                            </ul>
                                            <button className="btn btn-md" onClick={resetPassword} disabled={resetPwd != confirmPwd || resetPwd.length > 16 || resetPwd.length < 4 || !/[A-Z]/.test(resetPwd) || !/[a-z]/.test(resetPwd) || !/[0-9]/.test(resetPwd) || !/[ `!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/.test(resetPwd)}>Reset</button>
                                        </div>
                                    </div>
                                }
                                {
                                    tab == 2 && <div className="flex flex-col gap-3 md:w-72">
                                        <div className="text-2xl">Notifications</div>
                                        <div className="flex flex-col gap-2 text-sm">
                                            <div className="flex flex-row gap-2 items-center">
                                                <input className="checkbox checkbox-sm" type="checkbox" checked={true} />
                                                <span>Email notifications</span>
                                            </div>
                                            <div className="flex flex-row gap-2 items-center">
                                                <input className="checkbox checkbox-sm" type="checkbox" checked={true} />
                                                <span>Push notifications</span>
                                            </div>
                                        </div>
                                    </div>
                                }
                            </div>
                        </div>
                    </div>
                ) : <Loader />
            }
        </>
    )
}

export default Settings