"use client"
import dynamic from "next/dynamic";

const Canvas = dynamic(() => import("@/app/plantingPad/components/Canvas"),{
    ssr: false,
})

export default function Home() {
    return (
        <div className="flex h-screen">
            <div className="h-full w-2/12 bg-green-100 border-l-2 border-l-black"></div>
            <div className="h-full w-10/12">
                <Canvas/>
            </div>

        </div>
    );
}
