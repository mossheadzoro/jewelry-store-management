"use client";

import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { Camera, Upload, Trash2, RefreshCw, Loader2, CheckCircle2, Image as ImageIcon, X } from "lucide-react";

interface UploadImageProps {
  onUpload: (url: string) => void;
  value?: string;
  autoCompress?: boolean;
}

export default function ProductImageUpload({ onUpload, value, autoCompress = false }: UploadImageProps) {
  const [previewUrl, setPreviewUrl] = useState<string>(value || "");
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<string>("");

  // Camera Modal States
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (value) {
      setPreviewUrl(value);
    }
  }, [value]);

  // Clean up camera stream when camera modal closes or component unmounts
  useEffect(() => {
    if (isCameraOpen && cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [isCameraOpen, cameraStream]);

  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  const stopCameraStream = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
  };

  // Helper function to compress image
  const compressImage = (file: File | Blob): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      if (!autoCompress) {
        resolve(file);
        return;
      }
      
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        
        // Target dimensions (e.g. max 800px)
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Compression failed"));
          }, "image/jpeg", 0.7); // Compress to 70% JPEG quality
        } else {
          resolve(file);
        }
      };
      img.onerror = () => resolve(file); // Fallback to original
    });
  };

  // Upload file automatically to backend
  const uploadFile = async (fileToUpload: File | Blob, filename = "image.jpg") => {
    setUploading(true);
    setUploadProgress("Compressing & Uploading...");

    try {
      const finalBlob = await compressImage(fileToUpload);
      const formData = new FormData();
      formData.append("file", finalBlob, filename);

      const { data } = await axios.post("/api/upload/productImage", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const uploadedUrl = data.imageUrl;
      if (uploadedUrl) {
        onUpload(uploadedUrl);
        setUploadProgress("Upload complete!");
      }
    } catch (err: any) {
      console.error("Auto upload failed:", err);
      setUploadProgress("Upload failed.");
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(""), 2000);
    }
  };

  // Handle file selection from local device (Auto-Upload)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Convert File to Base64 Data URL for instant, unbroken preview
    const reader = new FileReader();
    reader.onloadend = () => {
      if (reader.result) {
        setPreviewUrl(reader.result as string);
      }
    };
    reader.readAsDataURL(selectedFile);

    // Auto Upload immediately
    uploadFile(selectedFile, selectedFile.name);
  };

  // Start Laptop Webcam
  const startCamera = async () => {
    setIsCameraOpen(true);
    setCameraError(null);
    setCapturedBlob(null);
    setCapturedPreview(null);

    try {
      let stream: MediaStream | null = null;

      // Stage 1: Try simple video: true (Works on 99.9% of laptop webcams)
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      } catch (err1) {
        console.warn("video:true failed, trying facingMode user...", err1);
        try {
          // Stage 2: Try user facing camera
          stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        } catch (err2) {
          console.warn("facingMode user failed, trying resolution constraint...", err2);
          // Stage 3: Try standard resolution constraint
          stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 640 }, height: { ideal: 480 } }
          });
        }
      }

      if (stream) {
        setCameraStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } else {
        throw new Error("No video stream returned");
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      setCameraError(
        "Could not start video source. Please allow browser camera access and close any other apps using the webcam (e.g. Zoom/Teams)."
      );
    }
  };

  // Capture Frame from Video Stream
  const capturePhoto = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          setCapturedBlob(blob);
          const preview = URL.createObjectURL(blob);
          setCapturedPreview(preview);
        }
      },
      "image/jpeg",
      0.95
    );
  };

  // Retake Photo
  const retakePhoto = () => {
    setCapturedBlob(null);
    setCapturedPreview(null);
  };

  // Confirm & Upload Captured Webcam Photo
  const confirmCapturedPhoto = () => {
    if (!capturedBlob) return;

    const capturedFile = new File([capturedBlob], `captured_${Date.now()}.jpg`, {
      type: "image/jpeg",
    });

    // Permanent Data URL preview (never expires or breaks)
    const reader = new FileReader();
    reader.onloadend = () => {
      if (reader.result) {
        setPreviewUrl(reader.result as string);
      }
    };
    reader.readAsDataURL(capturedBlob);

    stopCameraStream();
    setIsCameraOpen(false);

    // Upload file automatically in background
    uploadFile(capturedFile, capturedFile.name);
  };

  // Close Camera Modal
  const closeCameraModal = () => {
    stopCameraStream();
    setIsCameraOpen(false);
    setCapturedBlob(null);
    setCapturedPreview(null);
  };

  // Clear Image
  const handleRemoveImage = () => {
    setPreviewUrl("");
    onUpload("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="w-full space-y-3">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        id="productFileInput"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Image Preview & Controls Box */}
      {previewUrl ? (
        <div className="relative w-full rounded-xl bg-[#111113] border border-[#2F2F36] overflow-hidden group">
          <div className="aspect-square w-full max-h-48 flex items-center justify-center bg-background/40 overflow-hidden relative">
            <img
              src={previewUrl}
              alt="Product Preview"
              className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
            />

            {/* Uploading Overlay */}
            {uploading && (
              <div className="absolute inset-0 bg-background/75 backdrop-blur-sm flex flex-col items-center justify-center space-y-2 text-gold">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="text-[11px] font-medium">{uploadProgress}</span>
              </div>
            )}
          </div>

          {/* Action Bar */}
          <div className="p-2 bg-[#16161A] border-t border-[#2F2F36] flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" /> Image Ready
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 py-1 rounded bg-[#22222A] hover:bg-[#2A2A35] text-platinum text-[11px] font-medium border border-[#33333F] transition-colors flex items-center gap-1"
              >
                <Upload className="w-3 h-3 text-cyan-400" /> Change
              </button>

              <button
                type="button"
                onClick={startCamera}
                className="px-2.5 py-1 rounded bg-[#22222A] hover:bg-[#2A2A35] text-platinum text-[11px] font-medium border border-[#33333F] transition-colors flex items-center gap-1"
              >
                <Camera className="w-3 h-3 text-gold" /> Camera
              </button>

              <button
                type="button"
                onClick={handleRemoveImage}
                className="p-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-colors"
                title="Remove image"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Empty Upload & Camera Buttons */
        <div className="w-full p-4 rounded-xl bg-[#111113] border border-dashed border-[#33333F] hover:border-gold/50 transition-all text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-[#1C1C22] border border-[#2A2A35] flex items-center justify-center mx-auto text-gold">
            <ImageIcon className="w-5 h-5" />
          </div>

          <div>
            <p className="text-[12px] font-semibold text-platinum">Add Product Image</p>
            <p className="text-[10px] text-platinum-muted mt-0.5">Upload a photo or capture live with laptop camera</p>
          </div>

          <div className="flex items-center justify-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="px-3 py-1.5 rounded-lg bg-gold hover:bg-gold-light text-foreground font-semibold text-[11px] flex items-center gap-1.5 transition-all shadow-md disabled:opacity-50"
            >
              <Upload className="w-3.5 h-3.5" /> Upload File
            </button>

            <button
              type="button"
              onClick={startCamera}
              disabled={uploading}
              className="px-3 py-1.5 rounded-lg bg-[#22222A] hover:bg-[#2A2A35] text-platinum font-semibold text-[11px] border border-[#33333F] flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              <Camera className="w-3.5 h-3.5 text-gold" /> Webcam Camera
            </button>
          </div>
        </div>
      )}

      {/* WEBCAM CAMERA MODAL */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-[100] bg-background/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#111113] border border-[#2A2A35] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl space-y-0">
            {/* Modal Header */}
            <div className="p-4 bg-[#16161A] border-b border-[#2A2A35] flex items-center justify-between">
              <h4 className="text-[14px] font-bold text-platinum flex items-center gap-2">
                <Camera className="w-4 h-4 text-gold" /> Live Laptop Camera Viewfinder
              </h4>
              <button
                type="button"
                onClick={closeCameraModal}
                className="text-platinum-muted hover:text-platinum p-1 rounded-lg hover:bg-[#22222A] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Camera Viewfinder Area */}
            <div className="relative aspect-video w-full bg-background flex items-center justify-center overflow-hidden">
              {cameraError ? (
                <div className="p-6 text-center text-red-400 text-xs space-y-2">
                  <p className="font-semibold">{cameraError}</p>
                  <button
                    type="button"
                    onClick={startCamera}
                    className="px-3 py-1.5 bg-[#22222A] text-platinum rounded-lg border border-[#33333F] hover:bg-[#2A2A35] text-[11px]"
                  >
                    Retry Camera Access
                  </button>
                </div>
              ) : capturedPreview ? (
                /* Show Captured Preview */
                <img
                  src={capturedPreview}
                  alt="Captured Snapshot"
                  className="w-full h-full object-contain"
                />
              ) : (
                /* Live Video Stream */
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              )}

              {/* Hidden Canvas for Frame Capture */}
              <canvas ref={canvasRef} className="hidden" />
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-[#16161A] border-t border-[#2A2A35] flex items-center justify-between">
              <button
                type="button"
                onClick={closeCameraModal}
                className="px-4 py-2 rounded-xl bg-[#22222A] text-platinum-muted hover:text-platinum text-xs font-medium border border-[#33333F]"
              >
                Cancel
              </button>

              {capturedPreview ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={retakePhoto}
                    className="px-4 py-2 rounded-xl bg-[#22222A] hover:bg-[#2A2A35] text-platinum text-xs font-semibold border border-[#33333F] flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Retake Photo
                  </button>
                  <button
                    type="button"
                    onClick={confirmCapturedPhoto}
                    className="px-5 py-2 rounded-xl bg-gold hover:bg-gold-light text-foreground font-bold text-xs flex items-center gap-1.5 shadow-md"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Upload Captured Photo
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={capturePhoto}
                  disabled={!!cameraError}
                  className="px-6 py-2.5 rounded-xl bg-gold hover:bg-gold-light text-foreground font-bold text-xs flex items-center gap-2 shadow-lg disabled:opacity-50"
                >
                  <Camera className="w-4 h-4" /> Capture Photo
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
