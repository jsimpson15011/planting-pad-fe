"use client"
import React, {useCallback, useEffect, useRef, useState} from "react";

const Canvas = () => {
    const [prevX, setPrevX] = useState(0);
    const [prevY, setPrevY] = useState(0);

    const [viewportX, setViewportX] = useState(0);
    const [viewportY, setViewportY] = useState(0);
    const [viewportScale, setViewportScale] = useState(1);

    const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
    const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
    const [isDragging, setIsDragging] = useState<boolean>(false);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const drawRect = useCallback((x: number, y: number, width: number, height: number, color: string | CanvasGradient | CanvasPattern) => {
        if (!ctx) return;
        ctx.fillStyle = color
        ctx.fillRect(x, y, width, height)
    }, [ctx])


    const render = useCallback(() => {
        if (!ctx || !canvas) return;

        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.setTransform(viewportScale, 0, 0, viewportScale, viewportX, viewportY);
        ctx.fillStyle = "#dbf4d8";
        ctx.fillRect(-viewportX, -viewportY, canvas.width + Math.abs(viewportX), canvas.height + Math.abs(viewportY));


        ctx.fillStyle = "#2f5c2f";
        const gridSpacing = 20;

        for (let i = -viewportX; i < canvas.width - viewportX; i++) {
            if (i % gridSpacing === 0) {
                for (let j = -viewportY; j < canvas.height - viewportY; j++) {
                    if (j % gridSpacing === 0) {
                        ctx.fillRect(i, j, 2, 2);
                    }
                }

            }
        }

        drawRect(0, 0, 50, 50, "blue")
        drawRect(50, 100, 50, 50, "red")
    }, [canvas, ctx, drawRect, viewportScale, viewportX, viewportY]);


    const updatePanning = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const localX = e.clientX;
        const localY = e.clientY;

        setViewportX(viewportX + (localX - prevX));
        setViewportY(viewportY + (localY - prevY));

        setPrevX(localX);
        setPrevY(localY);
    }

    const reOffset = useCallback(() => {
        if (!canvas) return;
        const BB = canvas.getBoundingClientRect();
        setPrevX(BB.left);
        setPrevY(BB.top);
    }, [canvas]);

    useEffect(() => {
        window.addEventListener("resize", reOffset);
        window.addEventListener("scroll", reOffset);
    }, [reOffset]);

    useEffect(() => {
        if (!canvasRef.current) return;

        setCanvas(canvasRef.current);
        const context = canvasRef.current.getContext("2d");
        setCtx(context);
        if (!context) return;

        render();

    }, [canvasRef, ctx, render]);

    const handlePan = (e: React.MouseEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        if (!isDragging) return;

        updatePanning(e);

        render();
    }

    return <canvas onMouseLeave={() => {
        setIsDragging(false)
    }} onMouseUp={() => {
        setIsDragging(false)
    }} onMouseDown={(e) => {
        setPrevY(e.clientY);
        setPrevX(e.clientX);
        setIsDragging(true)
    }} onMouseMove={(e) => {
        handlePan(e)
    }} className="absolute" width={1000} height={1000} ref={canvasRef}></canvas>
}

export default Canvas;