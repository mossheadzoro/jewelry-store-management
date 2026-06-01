import { toast } from "sonner";

export async function downloadFile(url: string, filename: string): Promise<void> {
  const toastId = toast.loading("Preparing file download...");
  try {
    const res = await fetch(url);
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText || "Download request failed");
    }

    const blob = await res.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(blobUrl);

    toast.success("Ready ✅", { id: toastId });
  } catch (error) {
    const err = error as Error;
    console.error("Download failed:", err);
    toast.error(`Download failed: ${err.message || "Unknown error"} ❌`, { id: toastId });
  }
}
