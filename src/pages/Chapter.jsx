import React, { useState, useEffect } from 'react'
import { Loader } from '../components'
import { cdnClient } from '../utils/client'
import { CSVLink } from "react-csv";
import * as XLSX from 'xlsx';
import { MaterialReactTable } from 'material-react-table';
import { BsPersonLinesFill } from 'react-icons/bs'
import { Link } from 'react-router-dom'

import { FaFileCsv, FaFileExcel } from 'react-icons/fa6'

const Chapter = ({ user }) => {
    const [userId, setUserId] = useState(null)
    const [userRole, setUserRole] = useState(null)
    const [userLocation, setUserLocation] = useState(null)
    const [loading, setLoading] = useState(true)
    const [csvData, setCsvData] = useState([])
    const [excelData, setExcelData] = useState([])

    const exportExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(excelData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
        XLSX.writeFile(workbook, `sewa-international-usa-${new Date().toISOString()}.xlsx`);
    }

    const setSpreadsheetData = () => {
        if (!userId || !userRole || !userLocation) return
        const query = `*[_type == "user" && ${userRole == "volunteer" ? `location == "${userLocation}" &&` : ""}role in ["volunteer"${userRole == "admin" ? `, "supervisor"` : ""}]]{
            _id,
            userName, 
            email, 
            role, 
            location, 
            "events": *[_type == "event" && published]{ 
              name,
              _id, 
              "hours": math::sum(instances[].signUps[][signedUpUser._ref match ^.^._id && verified == true && adminConfirmed == true].numHours)
          }
          } | order(lower(userName) asc)`
        cdnClient.fetch(query).then((data) => {
            const csvDataEvents = [];
            data[0].events.forEach((x) => {
                csvDataEvents.push(x.name)
            })
            const csvDataToUpdate = []
            data.forEach((x) => {
                const row = {
                    "_id": x._id,
                    "Name": x.userName,
                    "Email": x.email,
                    "Role": x.role.substring(0, 1).toUpperCase() + x.role.substring(1),
                    "Location": x.location
                }
                var m = 0;
                x.events.forEach((y, i) => {
                    row[csvDataEvents[i]] = y.hours
                    m += y.hours;
                })
                row["Total Hours"] = m
                if (userRole == "admin") row["Email"] = x.email
                csvDataToUpdate.push(row)
            })
            setCsvData(csvDataToUpdate)
            setExcelData(csvDataToUpdate)
            setTimeout(() => { setLoading(false) }, 300);
        })
    }

    useEffect(() => {
        if (!user) return
        cdnClient.fetch(`*[_type == 'user' && email == '${user.email}']{_id, role, location}`).then((data) => {
            setUserId(data[0]._id)
            setUserRole(data[0].role)
            setUserLocation(data[0].location)
        })
    }, [user])

    useEffect(setSpreadsheetData, [userId, userRole, userLocation])

    return (
        <>
            {
                !loading ?
                    <div className="px-2 md:px-32 py-16">
                        <div className="flex w-full">
                            <div className="text-6xl mb-3 nova">Chapter</div>
                        </div>
                        <div className="flex flex-col my-6 gap-4">
                            <div className="overflow-auto">
                                {
                                    csvData && csvData[0] &&
                                    <MaterialReactTable
                                        columns={Object.keys(csvData[0]).map((x, i) => {
                                            if (x != "_id") {
                                                const m = ["Name", "Email", "Role", "Location", "Total Hours"].includes(x) ? 150 : 300
                                                return {
                                                    accessorKey: x,
                                                    header: x,
                                                    size: m
                                                }
                                            } else return null
                                        }).filter(x => x)}
                                        data={csvData}
                                        enablePinning
                                        initialState={{ columnPinning: { left: ['Name'], right: ['Total Hours'] } }}
                                        renderTopToolbarCustomActions={({ table }) => (
                                            <div className="invisible md:visible flex flex-row gap-3">
                                                <CSVLink data={csvData} filename={`sewa-international-usa-${new Date().toISOString()}.csv`}>
                                                    <button className="btn btn-sm btn-circle">
                                                        <FaFileCsv />
                                                    </button>
                                                </CSVLink>
                                                <button className="btn btn-sm btn-circle" onClick={exportExcel}>
                                                    <FaFileExcel className="text-green-800" />
                                                </button>
                                            </div>
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
                                    />
                                }
                            </div>
                        </div></div> : <Loader />
            }
        </>
    )
}

export default Chapter