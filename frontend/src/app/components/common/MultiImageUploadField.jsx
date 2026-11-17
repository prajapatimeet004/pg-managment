import { useState, useRef } from "react";
import { Upload, X, Trash2, Star, Loader2, ImagePlus, Plus } from "lucide-react";
import { Button } from "../ui/button";
import { fileToCompressedDataUrl } from "../../lib/imageUtils";
import { toast } from "sonner";

/**
 * Reusable multi-image upload field for forms (e.g. Add Property Wizard, Edit Property Modal).
 * Manages an array of base64 compressed photos with cover photo selection and removal.
 */
export function MultiImageUploadField({
  label = "Property Photos",
  sublabel = "Upload photos of the PG building, rooms, and facilities (multiple allowed)",
  value = [],
  onChange
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef(null);

  const photos = Array.isArray(value) ? value : [];

  const handleFilesSelected = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const validFiles = files.filter(f => f.type.startsWith("image/"));
    if (validFiles.length !== files.length) {
      toast.warning("Some selected files were not images and were skipped.");
    }
    if (!validFiles.length) return;

    try {
      setIsProcessing(true);
      const compressedList = [];
      for (const file of validFiles) {
        const dataUrl = await fileToCompressedDataUrl(file, {
          maxWidth: 1200,
          maxHeight: 1200,
          quality: 0.82
        });
        if (dataUrl) compressedList.push(dataUrl);
      }
      onChange([...photos, ...compressedList]);
    } catch (err) {
      console.error("Error processing images:", err);
      toast.error("Failed to process one or more images.");
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemove = (index) => {
    const updated = photos.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleSetCover = (index) => {
    if (index === 0) return;
    const selected = photos[index];
    const rest = photos.filter((_, i) => i !== index);
    onChange([selected, ...rest]);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {label}
          </label>
          {sublabel && (
            <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">{sublabel}</p>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
          className="rounded-xl text-xs font-bold h-8 border-dashed"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-3 h-3 mr-1 animate-spin" /> Compressing...
            </>
          ) : (
            <>
              <ImagePlus className="w-3 h-3 mr-1 text-indigo-600" /> Browse Photos
            </>
          )}
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFilesSelected}
        className="hidden"
      />

      {photos.length === 0 ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/20 transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform mb-2">
            <Upload className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold text-gray-700 dark:text-gray-300">Click to upload multiple PG photos</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">JPG, PNG, WebP up to 10MB each</p>
        </div>
      ) : (
        <div className="flex gap-2 overflow-x-auto pb-2 pt-1 custom-scrollbar">
          {photos.map((photo, idx) => (
            <div
              key={idx}
              className="relative flex-shrink-0 w-24 h-20 rounded-xl overflow-hidden bg-slate-900 border border-gray-200 dark:border-gray-700 group shadow-sm"
            >
              <img src={photo} alt={`Upload ${idx + 1}`} className="w-full h-full object-cover" />

              {/* Cover Indicator */}
              {idx === 0 ? (
                <span className="absolute top-1 left-1 bg-indigo-600 text-white text-[8px] font-black uppercase px-1.5 py-0.2 rounded shadow-sm">
                  Cover
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSetCover(idx)}
                  className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 bg-black/70 hover:bg-indigo-600 text-white text-[8px] font-bold px-1.5 py-0.2 rounded backdrop-blur-sm transition-all"
                  title="Make Cover Photo"
                >
                  Cover
                </button>
              )}

              {/* Delete button */}
              <button
                type="button"
                onClick={() => handleRemove(idx)}
                className="absolute top-1 right-1 p-1 rounded-lg bg-black/60 hover:bg-rose-600 text-white backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
                title="Remove"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}

          {/* Add more inline button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex-shrink-0 w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-indigo-400 flex flex-col items-center justify-center text-muted-foreground hover:text-indigo-600 transition-all text-[11px] font-bold gap-1"
          >
            <Plus className="w-4 h-4" />
            <span>Add</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default MultiImageUploadField;

