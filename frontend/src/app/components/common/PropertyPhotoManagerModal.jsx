import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { Button } from "../ui/button";
import { Upload, X, Trash2, Star, Loader2, ImagePlus, CheckCircle2, Plus } from "lucide-react";
import { fileToCompressedDataUrl } from "../../lib/imageUtils";
import { api } from "../../lib/api";
import { notifyDataUpdated } from "../../lib/dataEvents";
import { toast } from "sonner";

/**
 * Reusable Photo Manager Modal for PG Properties.
 * Allows uploading multiple photos at once, reordering cover photo, deleting photos,
 * and saving directly to the database.
 */
export function PropertyPhotoManagerModal({
  isOpen,
  onClose,
  property,
  onSaved
}) {
  const [photos, setPhotos] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (property && Array.isArray(property.images)) {
      setPhotos([...property.images]);
    } else {
      setPhotos([]);
    }
  }, [property, isOpen]);

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
      setPhotos(prev => [...prev, ...compressedList]);
      toast.success(`Added ${compressedList.length} photo(s). Don't forget to click Save!`);
    } catch (err) {
      console.error("Error processing images:", err);
      toast.error("Failed to process one or more images.");
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemovePhoto = (index) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSetCoverPhoto = (index) => {
    if (index === 0) return;
    setPhotos(prev => {
      const selected = prev[index];
      const rest = prev.filter((_, i) => i !== index);
      return [selected, ...rest];
    });
    toast.info("Cover photo updated!");
  };

  const handleSave = async () => {
    if (!property?.id) return;
    try {
      setIsSaving(true);
      await api.updateProperty(property.id, { images: photos });
      toast.success(`Photos for ${property.name} updated successfully!`);
      notifyDataUpdated("properties");
      if (onSaved) onSaved(photos);
      onClose();
    } catch (err) {
      console.error("Failed to save property photos:", err);
      toast.error(err.message || "Failed to update property photos");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col rounded-3xl p-6 bg-white dark:bg-gray-900 border-none shadow-2xl">
        <DialogHeader className="pb-3 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-black text-gray-900 dark:text-white">
                Manage PG Photos
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {property?.name || "Property"} &bull; {photos.length} {photos.length === 1 ? "photo" : "photos"} uploaded
              </DialogDescription>
            </div>
            <Button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="rounded-xl text-xs font-bold h-9 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-100 dark:shadow-none"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Compressing...
                </>
              ) : (
                <>
                  <ImagePlus className="w-3.5 h-3.5 mr-1.5" /> Upload Photos
                </>
              )}
            </Button>
          </div>
        </DialogHeader>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFilesSelected}
          className="hidden"
        />

        {/* Body / Gallery Manager */}
        <div className="p-1 overflow-y-auto custom-scrollbar flex-1 space-y-4 my-2">
          {photos.length === 0 ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/20 transition-all group"
            >
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform mb-3">
                <Upload className="w-7 h-7" />
              </div>
              <p className="text-sm font-bold text-gray-900 dark:text-white">Upload Photos of this PG</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                Select multiple photos of rooms, building exterior, reception, dining area, etc. (JPG, PNG, WebP)
              </p>
              <Button type="button" size="sm" className="mt-4 rounded-xl font-bold bg-indigo-600">
                Browse Files
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {photos.map((photo, idx) => (
                <div
                  key={idx}
                  className="relative group rounded-2xl overflow-hidden bg-slate-900 aspect-[4/3] border border-gray-200 dark:border-gray-800 shadow-sm"
                >
                  <img
                    src={photo}
                    alt={`Property photo ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />

                  {/* Cover Badge */}
                  {idx === 0 ? (
                    <span className="absolute top-2 left-2 z-10 bg-indigo-600 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md shadow-md flex items-center gap-1">
                      <Star className="w-3 h-3 fill-white" /> Primary Cover
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSetCoverPhoto(idx)}
                      className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 bg-black/70 hover:bg-indigo-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-md backdrop-blur-sm transition-all"
                      title="Set as first/cover photo"
                    >
                      Make Cover
                    </button>
                  )}

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(idx)}
                    className="absolute top-2 right-2 z-10 p-1.5 rounded-xl bg-black/60 hover:bg-rose-600 text-white backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 shadow-md"
                    title="Remove Photo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  {/* Photo Index Tag */}
                  <span className="absolute bottom-2 right-2 z-10 text-[10px] font-bold text-white/80 bg-black/50 px-1.5 py-0.5 rounded backdrop-blur-sm">
                    #{idx + 1}
                  </span>
                </div>
              ))}

              {/* Add More Tile */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-indigo-400 aspect-[4/3] flex flex-col items-center justify-center text-center cursor-pointer hover:bg-indigo-50/20 transition-all text-muted-foreground hover:text-indigo-600 p-3"
              >
                <Plus className="w-6 h-6 mb-1" />
                <span className="text-xs font-bold">Add More</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between shrink-0">
          <p className="text-[11px] text-muted-foreground">
            {photos.length} photo{photos.length === 1 ? "" : "s"} &bull; First photo is shown on cards
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSaving}
              className="rounded-xl font-bold text-xs h-10 px-4"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={isSaving || isProcessing}
              className="rounded-xl font-bold text-xs h-10 px-6 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-100 dark:shadow-none"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default PropertyPhotoManagerModal;

