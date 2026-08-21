import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center min-h-[60vh]">
      <Loader2 className="w-8 h-8 text-[#D4A843] animate-spin mb-4" />
      <p className="text-[#888] text-sm animate-pulse">Loading workspace...</p>
    </div>
  );
}
