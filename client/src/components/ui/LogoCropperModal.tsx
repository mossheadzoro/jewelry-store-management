"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  Circle,
  Square,
  RefreshCw,
  X,
  Upload,
} from "lucide-react";

export type LogoShape = "circle" | "square";

export interface LogoCropperModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageFileOrUrl: File | string | null;
  onCropComplete: (file: File, previewUrl: string) => Promise<void> | void;
  title?: string;
  initialShape?: LogoShape;
  isSaving?: boolean;
}

export default function LogoCropperModal({
  isOpen,
  onClose,
  imageFileOrUrl,
  onCropComplete,
  title = "Customize Shop Logo",
  initialShape = "circle",
  isSaving = false,
}: LogoCropperModalProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);
  const [shape, setShape] = useState<LogoShape>(initialShape);

  // Transform states
  const [scale, setScale] = useState<number>(1);
  const [minScale, setMinScale] = useState<number>(0.2);
  const [maxScale] = useState<number>(3.5);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [rotation, setRotation] = useState<number>(0); // 0, 90, 180, 270

  // Dragging states
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const positionStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Canvas refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [processing, setProcessing] = useState<boolean>(false);

  // YouTube-style sizing
  const CANVAS_WIDTH = 420;
  const CANVAS_HEIGHT = 420;
  const CROP_SIZE = 300;

  // Load image when imageFileOrUrl changes
  useEffect(() => {
    if (!imageFileOrUrl || !isOpen) {
      setImageElement(null);
      setImageLoaded(false);
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";

    if (typeof imageFileOrUrl === "string") {
      img.src = imageFileOrUrl;
    } else {
      const url = URL.createObjectURL(imageFileOrUrl);
      img.src = url;
    }

    img.onload = () => {
      setImageElement(img);
      setImageLoaded(true);

      // YouTube style: cover/fit the crop box nicely
      const minDim = Math.min(img.width, img.height);
      const baseScale = minDim > 0 ? CROP_SIZE / minDim : 1;
      setMinScale(Math.max(0.1, Number((baseScale * 0.5).toFixed(2))));
      setScale(Math.max(0.2, Number(baseScale.toFixed(2))));
      setPosition({ x: 0, y: 0 });
      setRotation(0);
    };

    img.onerror = () => {
      console.error("Failed to load image for cropping");
      setImageLoaded(false);
    };

    return () => {
      if (typeof imageFileOrUrl !== "string" && img.src.startsWith("blob:")) {
        URL.revokeObjectURL(img.src);
      }
    };
  }, [imageFileOrUrl, isOpen]);

  // Main YouTube-Style Canvas Render
  const drawMainCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 1. Dark canvas background
    ctx.fillStyle = "#121214";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const centerX = CANVAS_WIDTH / 2;
    const centerY = CANVAS_HEIGHT / 2;
    const cropX = (CANVAS_WIDTH - CROP_SIZE) / 2;
    const cropY = (CANVAS_HEIGHT - CROP_SIZE) / 2;
    const radius = CROP_SIZE / 2;

    // 2. Draw image with transformations
    if (imageElement && imageLoaded) {
      ctx.save();
      ctx.translate(centerX + position.x, centerY + position.y);
      const totalAngle = (rotation * Math.PI) / 180;
      ctx.rotate(totalAngle);
      ctx.scale(scale, scale);

      ctx.drawImage(
        imageElement,
        -imageElement.width / 2,
        -imageElement.height / 2,
        imageElement.width,
        imageElement.height
      );
      ctx.restore();
    }

    // 3. YouTube-style Dark Overlay Mask with Cutout
    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
    ctx.beginPath();
    ctx.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    if (shape === "circle") {
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2, true);
    } else {
      ctx.rect(cropX + CROP_SIZE, cropY, -CROP_SIZE, CROP_SIZE);
    }
    ctx.fill();
    ctx.restore();

    // 4. Clean YouTube-style border ring
    ctx.save();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";

    if (shape === "circle") {
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.strokeRect(cropX, cropY, CROP_SIZE, CROP_SIZE);
    }
    ctx.restore();
  }, [imageElement, imageLoaded, shape, scale, position, rotation]);

  // Redraw when state updates
  useEffect(() => {
    drawMainCanvas();
  }, [drawMainCanvas]);

  // Mouse / Touch handlers for Panning
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    positionStartRef.current = { ...position };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPosition({
      x: positionStartRef.current.x + dx,
      y: positionStartRef.current.y + dy,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      positionStartRef.current = { ...position };
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDragging || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - dragStartRef.current.x;
    const dy = e.touches[0].clientY - dragStartRef.current.y;
    setPosition({
      x: positionStartRef.current.x + dx,
      y: positionStartRef.current.y + dy,
    });
  };

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomDelta = e.deltaY < 0 ? 0.05 : -0.05;
    setScale((prev) => Math.max(minScale, Math.min(maxScale, Number((prev + zoomDelta).toFixed(2)))));
  };

  // Rotate 90 degrees
  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // Reset to center
  const handleReset = () => {
    if (!imageElement) return;
    const minDim = Math.min(imageElement.width, imageElement.height);
    const baseScale = minDim > 0 ? CROP_SIZE / minDim : 1;
    setScale(Math.max(0.2, Number(baseScale.toFixed(2))));
    setPosition({ x: 0, y: 0 });
    setRotation(0);
  };

  // Replace file
  const handleNewFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = url;
    img.onload = () => {
      setImageElement(img);
      setImageLoaded(true);
      const minDim = Math.min(img.width, img.height);
      const baseScale = minDim > 0 ? CROP_SIZE / minDim : 1;
      setMinScale(Math.max(0.1, Number((baseScale * 0.5).toFixed(2))));
      setScale(Math.max(0.2, Number(baseScale.toFixed(2))));
      setPosition({ x: 0, y: 0 });
      setRotation(0);
    };
  };

  // Export cropped image (Clean, high-DPI YouTube style)
  const handleSaveCrop = async () => {
    if (!imageElement || !imageLoaded) return;
    setProcessing(true);

    try {
      const exportCanvas = document.createElement("canvas");
      const exportSize = 800; // Crisp high-res output
      exportCanvas.width = exportSize;
      exportCanvas.height = exportSize;
      const ctx = exportCanvas.getContext("2d");

      if (!ctx) throw new Error("Could not create canvas context");

      // Transparent cutout for circle shape
      if (shape === "circle") {
        ctx.beginPath();
        ctx.arc(exportSize / 2, exportSize / 2, exportSize / 2, 0, Math.PI * 2);
        ctx.clip();
      }

      const scaleFactor = exportSize / CROP_SIZE;

      ctx.save();
      ctx.translate(
        exportSize / 2 + position.x * scaleFactor,
        exportSize / 2 + position.y * scaleFactor
      );
      const totalAngle = (rotation * Math.PI) / 180;
      ctx.rotate(totalAngle);
      ctx.scale(scale * scaleFactor, scale * scaleFactor);

      ctx.drawImage(
        imageElement,
        -imageElement.width / 2,
        -imageElement.height / 2,
        imageElement.width,
        imageElement.height
      );
      ctx.restore();

      exportCanvas.toBlob(
        async (blob) => {
          if (!blob) {
            setProcessing(false);
            return;
          }

          const file = new File([blob], `shop_logo_${shape}_${Date.now()}.png`, {
            type: "image/png",
          });
          const previewUrl = exportCanvas.toDataURL("image/png");

          await onCropComplete(file, previewUrl);
          setProcessing(false);
          onClose();
        },
        "image/png",
        1.0
      );
    } catch (err) {
      console.error("Failed to export cropped image:", err);
      setProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[480px] bg-[#1e1e24] border border-white/10 text-white p-0 overflow-hidden shadow-2xl rounded-2xl">
        {/* HEADER: SIMPLE YOUTUBE STYLE */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <DialogTitle className="text-base font-semibold text-white tracking-wide">
            {title}
          </DialogTitle>
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleNewFile}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10"
              title="Change photo"
            >
              <Upload className="w-3.5 h-3.5" /> Change Photo
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-1 rounded-md hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* CROPPER VIEWPORT (CENTERED) */}
        <div className="p-6 flex flex-col items-center bg-[#121214] select-none">
          <div className="relative group flex items-center justify-center">
            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleMouseUp}
              onWheel={handleWheel}
              className={`rounded-xl shadow-inner ${
                isDragging ? "cursor-grabbing" : "cursor-grab"
              }`}
              style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
            />

            {/* Instruction tooltip */}
            <div className="absolute bottom-3 px-3 py-1 rounded-full bg-black/75 backdrop-blur text-[11px] text-gray-300 pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity">
              Drag to reposition • Scroll to zoom
            </div>
          </div>
        </div>

        {/* YOUTUBE-STYLE CONTROLS TOOLBAR */}
        <div className="px-6 py-4 bg-[#1e1e24] space-y-4 border-t border-white/10">
          {/* 1. Zoom Slider Row */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setScale((prev) => Math.max(minScale, Number((prev - 0.1).toFixed(2))))}
              className="text-gray-400 hover:text-white p-1 rounded hover:bg-white/10 transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <input
              type="range"
              min={minScale}
              max={maxScale}
              step="0.02"
              value={scale}
              onChange={(e) => setScale(parseFloat(e.target.value))}
              className="flex-1 accent-white h-1 bg-white/20 rounded-lg cursor-pointer"
            />
            <button
              type="button"
              onClick={() => setScale((prev) => Math.min(maxScale, Number((prev + 0.1).toFixed(2))))}
              className="text-gray-400 hover:text-white p-1 rounded hover:bg-white/10 transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          {/* 2. Shape Switcher & Rotate Row (Clean YouTube Pill Buttons) */}
          <div className="flex items-center justify-between pt-1">
            {/* Shape Switcher */}
            <div className="inline-flex p-1 bg-black/40 rounded-xl border border-white/10">
              <button
                type="button"
                onClick={() => setShape("circle")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  shape === "circle"
                    ? "bg-white text-black font-semibold shadow-sm"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <Circle className="w-3.5 h-3.5" />
                <span>Circle</span>
              </button>
              <button
                type="button"
                onClick={() => setShape("square")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  shape === "square"
                    ? "bg-white text-black font-semibold shadow-sm"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <Square className="w-3.5 h-3.5" />
                <span>Square</span>
              </button>
            </div>

            {/* Rotate & Reset */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRotate}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-medium transition-colors border border-white/10"
                title="Rotate 90°"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Rotate</span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors border border-white/10"
                title="Reset Position"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* FOOTER: CANCEL & DONE (YOUTUBE STYLE) */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/10 bg-[#1e1e24]">
          <button
            type="button"
            onClick={onClose}
            disabled={processing || isSaving}
            className="px-4 py-2 rounded-full text-xs font-medium text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveCrop}
            disabled={!imageLoaded || processing || isSaving}
            className="px-6 py-2 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition-all shadow-md disabled:opacity-50 flex items-center gap-2"
          >
            {processing || isSaving ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving...
              </>
            ) : (
              "Done"
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
