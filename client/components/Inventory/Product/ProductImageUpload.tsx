'use client';
import { useState } from 'react';
import axios from 'axios';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function UploadImage({ onUpload }: { onUpload: (url: string) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] || null);
  };

  const handleUpload = async () => {
  if (!file) return;
  setUploading(true);


  try {
    const formData = new FormData();
    formData.append('file', file);

    const { data } = await axios.post('/api/upload/productImage', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    const uploadedUrl = data.imageUrl;
    console.log("Uploaded URL ", uploadedUrl)
    onUpload(uploadedUrl);
     // send this to your DB
    alert('Image uploaded successfully');
  } catch (err) {
    console.error(err);
    alert('Failed to upload');
  } finally {
    setUploading(false);
  }
};

  return (
    <div className='flex gap-2 flex-row' >
     <div className="relative inline-block">
      <input
        type="file"
        accept="image/*"
        id="fileInput"
        className="hidden"
        onChange={handleFileChange}
      />
      <label
        htmlFor="fileInput"
        className="w-10 h-10 flex items-center justify-center bg-gray-200 border-2 border-dashed border-gray-400 rounded cursor-pointer hover:bg-gray-300 transition"
      >
        <Plus className="w-5 h-5 text-gray-600" />
      </label>
    </div>
      {/* <img src={""} alt="Uploaded Preview" className="w-32 h-auto mt-2" /> */}

      <Button onClick={handleUpload} disabled={uploading} className=" border-4 rounded-sm py-2 px-2 hover:bg-gray-300 text-black ">
        {uploading ? 'Uploading...' : 'Upload Image'}
      </Button>
    </div>
  );
}
