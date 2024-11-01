import React from 'react'
import { FaUpload } from 'react-icons/fa6'

const images = require.context('../assets/banners', true);
const imageList = images.keys().map(image => images(image));

const ImageModal = ({ image, setImage }) => {

    const handleImageChange = (e) => {
        if (e.target.files[0]) {
            document.getElementById("imageModal").close()
            setImage(e.target.files[0])
        }
    }

    const handleBrowseImageChange = (i) => {
        const img = imageList[i]
        fetch(img)
            .then(async response => {
                const contentType = response.headers.get('content-type')
                const blob = await response.blob()
                const file = new File([blob], `${i + 1}.png`, { contentType })
                document.getElementById("imageModal").close()
                setImage(file)
            })
    }

    return (
        <dialog id="imageModal" className="modal">
            <div className="modal-box">
                <div className="flex flex-col gap-2">
                    <h3 className="font-bold text-2xl nova">Add image</h3>
                    <div className="flex flex-col gap-3">
                        <div className="h-48 w-full bg-slate-100 p-4 grid grid-cols-2 gap-2 overflow-y-scroll rounded-lg">
                            {imageList.map((img, i) => (
                                <div className="rounded-lg h-36 w-full p-0 cursor-pointer hover:brightness-75 transition-all" style={{ backgroundImage: `url(${img})`, backgroundSize: "cover" }} key={i} onClick={() => handleBrowseImageChange(i)} />
                            ))}
                        </div>
                        <div className="text-center text-sm text-accent">or</div>
                        <div className="flex justify-center items-center h-full bg-slate-100 rounded-lg relative hover:brightness-90 transition-all cursor-pointer p-4">
                            <div className="flex flex-row gap-3 justify-center items-center">
                                <FaUpload size="28" color="rgb(148 163 184)" />
                                <span className="text-slate-400 text-sm text-center nova">UPLOAD</span>
                            </div>
                            <input type="file" accept=".png,.jpg" onChange={handleImageChange} className="cursor-pointer absolute top-0 left-0 w-full h-full opacity-0" />
                        </div>
                    </div>
                </div>
                <form method="dialog">
                    <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
                </form>
            </div>
        </dialog>
    )
}

export default ImageModal