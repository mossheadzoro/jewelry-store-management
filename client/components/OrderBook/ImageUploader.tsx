"use client";

import React, { useCallback, useEffect } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";

interface ImageUploaderProps {
  images: File[];
  onChange: (images: File[]) => void;
  maxImages?: number;
}

export function ImageUploader({ images, onChange, maxImages = 5 }: ImageUploaderProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const combined = [...images, ...newFiles].slice(0, maxImages);
      onChange(combined);
    }
  };

  const removeImage = (idx: number) => {
    const newImages = [...images];
    newImages.splice(idx, 1);
    onChange(newImages);
  };

  const handlePaste = useCallback((e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const newFiles: File[] = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        if (file) newFiles.push(file);
      }
    }

    if (newFiles.length > 0) {
      e.preventDefault();
      const combined = [...images, ...newFiles].slice(0, maxImages);
      onChange(combined);
    }
  }, [images, maxImages, onChange]);

  useEffect(() => {
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [handlePaste]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      const newFiles = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"));
      const combined = [...images, ...newFiles].slice(0, maxImages);
      onChange(combined);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="mt-3">
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {images.map((file, idx) => {
            const url = URL.createObjectURL(file);
            return (
              <div key={idx} className="relative w-16 h-16 rounded-md overflow-hidden border border-[#333] group">
                <img src={url} alt={`Upload ${idx}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {images.length < maxImages && (
        <label
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-[#2a2a2a] rounded-xl bg-[#0a0a0a] hover:bg-[#111] hover:border-[#D4A843]/40 cursor-pointer transition-colors"
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className="w-5 h-5 text-[#555] mb-2" />
            <p className="mb-1 text-[11px] text-[#888]">
              <span className="font-semibold text-[#D4A843]">Click to upload</span> or drag and drop
            </p>
            <p className="text-[10px] text-[#555]">SVG, PNG, JPG or GIF (max {maxImages} images)</p>
            <p className="text-[10px] text-[#D4A843]/70 mt-1">Ctrl+V / Cmd+V to paste from clipboard</p>
          </div>
          <input type="file" className="hidden" multiple accept="image/*" onChange={handleFileChange} />
        </label>
      )}
    </div>
  );
}
