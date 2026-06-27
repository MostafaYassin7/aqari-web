'use client';
import { useRef, useState } from 'react';
import Image from 'next/image';
import { useAddListingStore } from '@/store/add-listing.store';
import { uploadMedia } from '@/lib/api';
import { X, ImagePlus } from 'lucide-react';

const MAX_SIZE = 15 * 1024 * 1024; // 15MB

export default function Step2Media() {
  const store = useAddListingStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<string[]>([]); // filenames uploading
  const [sizeError, setSizeError] = useState('');
  const dragItem = useRef<number | null>(null);
  const dragOver = useRef<number | null>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    setSizeError('');
    const toUpload: File[] = [];
    for (const f of Array.from(files)) {
      if (f.size > MAX_SIZE) {
        setSizeError(`"${f.name}" أكبر من 15MB`);
        continue;
      }
      toUpload.push(f);
    }
    if (!toUpload.length) return;

    setUploading(toUpload.map((f) => f.name));
    store.setField('isUploading', true);
    try {
      const urls = await uploadMedia(toUpload);
      urls.forEach((url) => store.addUploadedUrl(url));
    } catch {
      setSizeError('فشل رفع الصور، يرجى المحاولة مجدداً');
    } finally {
      setUploading([]);
      store.setField('isUploading', false);
    }
  };

  const handleDragSort = (fromIdx: number, toIdx: number) => {
    const newUrls = [...store.uploadedUrls];
    const [moved] = newUrls.splice(fromIdx, 1);
    newUrls.splice(toIdx, 0, moved);
    store.setField('uploadedUrls', newUrls);
    store.setField('coverPhoto', newUrls[0] ?? null);
  };

  return (
    <div className="px-4 py-6 space-y-4">
      <h2 className="text-base font-bold text-[#222222]">صور الإعلان</h2>

      {/* Upload area */}
      <div
        className="border-2 border-dashed border-gray-300 rounded-2xl p-8 flex flex-col items-center gap-3 cursor-pointer hover:border-[#F5A623] hover:bg-orange-50 transition-all"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
      >
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
          <ImagePlus size={24} className="text-gray-400" />
        </div>
        <p className="text-sm font-medium text-[#444444]">اسحب الصور هنا أو انقر للرفع</p>
        <p className="text-xs text-[#717171]">JPG، PNG، WEBP — حتى 15MB لكل صورة</p>
        <input
          ref={inputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {sizeError && (
        <p className="text-red-500 text-xs bg-red-50 px-3 py-2 rounded-lg">{sizeError}</p>
      )}

      {/* Uploading indicators */}
      {uploading.length > 0 && (
        <div className="space-y-2">
          {uploading.map((name) => (
            <div key={name} className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 shadow-sm">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#F5A623] border-t-transparent shrink-0" />
              <p className="text-xs text-[#717171] truncate flex-1">{name}</p>
            </div>
          ))}
        </div>
      )}

      {/* Uploaded photos grid */}
      {store.uploadedUrls.length > 0 && (
        <div>
          <p className="text-xs text-[#717171] mb-2">اسحب لإعادة الترتيب • الصورة الأولى هي الغلاف</p>
          <div className="grid grid-cols-3 gap-2">
            {store.uploadedUrls.map((url, i) => (
              <div
                key={url}
                draggable
                onDragStart={() => { dragItem.current = i; }}
                onDragEnter={() => { dragOver.current = i; }}
                onDragEnd={() => {
                  if (dragItem.current !== null && dragOver.current !== null && dragItem.current !== dragOver.current) {
                    handleDragSort(dragItem.current, dragOver.current);
                  }
                  dragItem.current = null;
                  dragOver.current = null;
                }}
                className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 cursor-grab active:cursor-grabbing"
              >
                <Image src={url} alt="" fill className="object-cover" unoptimized />
                {i === 0 && (
                  <span className="absolute top-1 start-1 bg-[#F5A623] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                    غلاف
                  </span>
                )}
                <button
                  onClick={() => store.removeUploadedUrl(url)}
                  className="absolute top-1 end-1 w-5 h-5 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center transition-colors"
                >
                  <X size={10} className="text-white" />
                </button>
              </div>
            ))}
            {/* Add more */}
            <button
              onClick={() => inputRef.current?.click()}
              className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center hover:border-[#F5A623] hover:bg-orange-50 transition-all"
            >
              <ImagePlus size={20} className="text-gray-300" />
            </button>
          </div>
        </div>
      )}

      {store.uploadedUrls.length === 0 && uploading.length === 0 && (
        <p className="text-xs text-[#717171] text-center">يمكنك المتابعة بدون صور وإضافتها لاحقاً</p>
      )}
    </div>
  );
}
