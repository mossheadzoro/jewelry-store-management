"use client";

import React, { useState, useRef } from "react";
import { Mic, Square, Trash2, Play, Pause } from "lucide-react";

interface VoiceRecorderProps {
  onRecordingComplete: (file: File | null) => void;
  existingFile: File | null;
}

export function VoiceRecorder({ onRecordingComplete, existingFile }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        const audioFile = new File([audioBlob], `voice_note_${Date.now()}.webm`, {
          type: "audio/webm",
        });
        onRecordingComplete(audioFile);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= 59) {
            stopRecording();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.error("Failed to start recording:", err);
      alert("Microphone access denied or not available.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const deleteRecording = () => {
    onRecordingComplete(null);
  };

  if (existingFile) {
    const url = URL.createObjectURL(existingFile);
    return (
      <div className="flex items-center gap-2 h-10 px-3 rounded-lg bg-[#0a0a0a] border border-[#D4A843]/30">
        <audio src={url} controls className="h-6 w-40" />
        <button
          onClick={deleteRecording}
          className="p-1.5 text-red-400 hover:bg-red-400/10 rounded-full transition-colors"
          title="Delete Voice Note"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {isRecording ? (
        <div className="flex items-center gap-2 h-10 px-3 rounded-lg bg-red-500/10 border border-red-500/30">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-red-400 text-[11px] font-mono">
            0:{recordingTime.toString().padStart(2, "0")}
          </span>
          <button
            onClick={stopRecording}
            className="p-1.5 ml-2 text-red-400 hover:bg-red-400/20 rounded-md transition-colors"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
          </button>
        </div>
      ) : (
        <button
          onClick={startRecording}
          className="flex items-center gap-1.5 h-10 px-3 rounded-lg bg-[#141414] border border-[#2a2a2a] hover:border-[#D4A843]/50 text-[12px] text-[#888] hover:text-[#D4A843] transition-colors"
          title="Record Voice Note"
        >
          <Mic className="w-4 h-4" />
          <span>Record</span>
        </button>
      )}
    </div>
  );
}
