"use client"
import React, {useCallback, useEffect, useRef, useState} from "react";
import {LayoutItem} from "@/app/plantingPad/types";

const Canvas = () => {
    const [prevX, setPrevX] = useState(0);
    const [prevY, setPrevY] = useState(0);

    const [viewportX, setViewportX] = useState(0);
    const [viewportY, setViewportY] = useState(0);
    const [viewportScale, setViewportScale] = useState(1);
    const [layoutItems, setLayoutItems] = useState<LayoutItem[]>([
        {
            x: 51,
            y: 52,
            id: "red-square",
            bg: "#9e2067",
            width: 50,
            height: 50,
            boundingBoxHeight: 60,
            boundingBoxWidth: 60
        }
    ]);//todo fetch data

    const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
    const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
    const [currentMode, setCurrentMode] = useState<"panning" | "moving" | null>(null);
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const drawRect = useCallback((x: number, y: number, width: number, height: number, color: string | CanvasGradient | CanvasPattern) => {
        if (!ctx) return;
        ctx.fillStyle = color
        ctx.fillRect(x, y, width, height)
    }, [ctx]);

    const render = useCallback(() => {
        if (!ctx || !canvas) return;

        // Get the current canvas dimensions
        const width = canvas.width;
        const height = canvas.height;

        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, width, height);
        ctx.setTransform(viewportScale, 0, 0, viewportScale, viewportX, viewportY);
        ctx.fillStyle = "#dbf4d8";
        ctx.fillRect(
            -viewportX / viewportScale,
            -viewportY / viewportScale,
            width / viewportScale,
            height / viewportScale
        );

        ctx.fillStyle = "#2f5c2f";

        // Calculate grid boundaries based on current viewport
        const startX = Math.floor(-viewportX / viewportScale / gridSpacing) * gridSpacing;
        const endX = startX + Math.ceil(width / viewportScale / gridSpacing) * gridSpacing;
        const startY = Math.floor(-viewportY / viewportScale / gridSpacing) * gridSpacing;
        const endY = startY + Math.ceil(height / viewportScale / gridSpacing) * gridSpacing;

        // Draw grid dots
        for (let i = startX; i <= endX; i += gridSpacing) {
            for (let j = startY; j <= endY; j += gridSpacing) {
                ctx.fillRect(i, j, gridDotSize, gridDotSize);
            }
        }

        // Draw layout items
        layoutItems.forEach(layoutItem => {
            drawRect(layoutItem.x, layoutItem.y, layoutItem.width, layoutItem.height, layoutItem.bg);
        });
    }, [canvas, ctx, drawRect, layoutItems, viewportScale, viewportX, viewportY]);

    // Set up resize observer in a useEffect to avoid recreating it on each render
    useEffect(() => {
        if (!canvasRef.current) return;

        const updateCanvasSize = () => {
            if (!canvasRef.current || !ctx) return;

            // Get the parent container dimensions
            const container = canvasRef.current.parentElement;
            if (!container) return;

            // Get the parent's dimensions
            const parentRect = container.getBoundingClientRect();
            const newWidth = parentRect.width;
            const newHeight = parentRect.height;

            // Update the canvas dimensions
            canvasRef.current.width = newWidth;
            canvasRef.current.height = newHeight;
            
            // Trigger a render with the new dimensions
            render();
        };

        const resizeObserver = new ResizeObserver(() => {
            updateCanvasSize();
        });

        resizeObserver.observe(canvasRef.current.parentElement as Element);
        
        // Initial size update
        updateCanvasSize();

        // Clean up the observer when the component unmounts
        return () => {
            if (canvasRef.current && canvasRef.current.parentElement) {
                // eslint-disable-next-line react-hooks/exhaustive-deps
                resizeObserver.unobserve(canvasRef.current.parentElement);
            }
            resizeObserver.disconnect();
        };
    }, [canvasRef, ctx, render]);

    const getCursorPosition = useCallback(
        (canvas: HTMLCanvasElement, event: React.MouseEvent): [number, number] => {
            const rect = canvas.getBoundingClientRect();
            const x = (event.clientX - rect.left - (viewportX)) / viewportScale
            const y = (event.clientY - rect.top - (viewportY)) / viewportScale
            return [x, y];
        },[viewportScale, viewportX, viewportY]
    )

    function getLayoutItemBounds(item: LayoutItem) {
        const leftBound = item.x - ((item.boundingBoxWidth - item.width) / 2);
        const rightBound = leftBound + item.boundingBoxWidth;
        const bottomBound = item.y - ((item.boundingBoxHeight - item.height) / 2);
        const topBound = bottomBound + item.boundingBoxHeight;

        return {
            x: [leftBound, rightBound],
            y: [bottomBound, topBound]
        }
    }

    function getSelectedElement(position: [number, number]) {
        return layoutItems.find(item => {
            const bounds = getLayoutItemBounds(item);
            return bounds.x[0] < position[0] && bounds.x[1] > position[0] && bounds.y[0] < position[1] && bounds.y[1] > position[1]
        });
    }

    const gridSpacing = 25;
    const gridDotSize = 2;

    const updatePanning = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const localX = e.clientX;
        const localY = e.clientY;

        setViewportX(viewportX + (localX - prevX));
        setViewportY(viewportY + (localY - prevY));

        setPrevX(localX);
        setPrevY(localY);
    }

    function roundToGrid(number: number): number {
        return (Math.round(number / gridSpacing) * gridSpacing) + (gridDotSize / 2);
    }

    const updateElement = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!selectedItemId || !canvas) return;
        const cursorPosition = getCursorPosition(canvas, e);

        setLayoutItems(layoutItems.map(item => {
            if (item.id === selectedItemId) {
                return {...item, x: roundToGrid(cursorPosition[0]), y: roundToGrid(cursorPosition[1])};
            }
            return item;
        }))
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
        
        return () => {
            window.removeEventListener("resize", reOffset);
            window.removeEventListener("scroll", reOffset);
        };
    }, [reOffset]);

    useEffect(() => {
        if (!canvasRef.current) return;

        setCanvas(canvasRef.current);
        const context = canvasRef.current.getContext("2d");
        setCtx(context);
        if (!context) return;

        render();

    }, [canvasRef, ctx, render]);

    const updateZooming = (e: React.WheelEvent) => {
        const oldX = viewportX;
        const oldY = viewportY;

        const localX = e.clientX;
        const localY = e.clientY;

        const previousScale = viewportScale;
        const newScale = Math.max(viewportScale + (e.deltaY * -0.001), 1);
        setViewportScale(newScale)

        const newX = localX - (localX - oldX) * (newScale / previousScale);
        const newY = localY - (localY - oldY) * (newScale / previousScale);

        setViewportX(newX);
        setViewportY(newY);
        setViewportScale(newScale);
    }

    const handleScroll = (e: React.WheelEvent) => {
        updateZooming(e);
        render();
    }

    const findItemClicked = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!canvas) return;

        const currPosition = getCursorPosition(canvas, e);
        return getSelectedElement(currPosition);
    }

    const handlePan = (e: React.MouseEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        if (currentMode !== "panning") return;

        updatePanning(e);
        render();
    }
    
    const handleMoveElement = (e: React.MouseEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        if (currentMode !== "moving") return;

        updateElement(e);
        render();
    }

    return <canvas
        onWheel={handleScroll}
        onMouseLeave={() => {
            setCurrentMode(null);
        }} 
        onMouseUp={() => {
            setCurrentMode(null);
        }} 
        onMouseDown={(e) => {
            setPrevY(e.clientY);
            setPrevX(e.clientX);
            const selectedElement = findItemClicked(e);
            if (selectedElement) {
                setCurrentMode("moving");
                setSelectedItemId(selectedElement.id);
                return;
            }
            setCurrentMode("panning");
        }} 
        onMouseMove={(e) => {
            handlePan(e)
            handleMoveElement(e);
        }} 
        className="w-full h-full"
        ref={canvasRef}
    ></canvas>
}

export default Canvas;