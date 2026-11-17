import { useState, useRef } from "react";
import { Upload, X, Eye, Camera, FileText, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { fileToCompressedDataUrl } from "../../lib/imageUtils";
import { toast } from "sonner";

export function DocumentUploadField({
  label,
  sublabel,
  value,
  onChange,
  required = false,
  isAvatar = false,
  accept = "image/*"
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file (JPG, PNG, WebP)");
      return;
    }

    try {
      setIsProcessing(true);
      const dataUrl = await fileToCompressedDataUrl(file, {
        maxWidth: isAvatar ? 600 : 1200,
        maxHeight: isAvatar ? 600 : 1200,
        quality: 0.82
      });
      onChange(dataUrl);
    } catch (err) {
      console.error("Error processing image:", err);
      toast.error("Failed to process image. Please try another file.");
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          {label}
          {required && <span className="text-red-500">*</span>}
        </label>
        {value && (
          <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Uploaded
          </span>
        )}
      </div>
      {sublabel && (
        <p className="text-[11px] text-muted-foreground leading-tight">{sublabel}</p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />

      {isAvatar ? (
        // Avatar style layout
        <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
          <div
            onClick={() => {
              if (value) setIsPreviewOpen(true);
              else fileInputRef.current?.click();
            }}
            className="relative w-16 h-16 rounded-2xl overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center cursor-pointer group shadow-inner"
          >
            {value ? (
              <>
                <img src={value} alt={label} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                  <Eye className="w-5 h-5" />
                </div>
              </>
            ) : isProcessing ? (
              <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
            ) : (
              <Camera className="w-6 h-6 text-gray-400 group-hover:text-indigo-600 transition-colors" />
            )}
          </div>

          <div className="flex-1 flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="rounded-xl text-xs font-bold h-8"
              >
                <Upload className="w-3.5 h-3.5 mr-1.5" />
                {value ? "Change Photo" : "Upload Photo"}
              </Button>
              {value && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  className="rounded-xl text-xs font-bold h-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                >
                  <X className="w-3.5 h-3.5 mr-1" /> Remove
                </Button>
              )}
            </div>
            <span className="text-[10px] text-muted-foreground">JPG, PNG, WebP up to 10MB</span>
          </div>
        </div>
      ) : (
        // Document Card style layout
        <div
          onClick={() => {
            if (!value) fileInputRef.current?.click();
          }}
          className={`relative rounded-2xl border border-dashed p-3 transition-all ${
            value
              ? "bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800"
              : "bg-gray-50 dark:bg-gray-800/40 border-gray-200 dark:border-gray-700 hover:border-indigo-300 hover:bg-gray-100/50 cursor-pointer"
          }`}
        >
          {isProcessing ? (
            <div className="py-6 flex flex-col items-center justify-center gap-2 text-indigo-600">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="text-xs font-semibold">Compressing and uploading...</span>
            </div>
          ) : value ? (
            <div className="flex items-center gap-3">
              <div
                onClick={() => setIsPreviewOpen(true)}
                className="relative w-16 h-12 rounded-xl overflow-hidden bg-gray-900 cursor-pointer group flex-shrink-0 shadow-sm"
                title="Click to view full size"
              >
                <img src={value} alt={label} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                  <Eye className="w-4 h-4" />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">{label}</p>
                <button
                  type="button"
                  onClick={() => setIsPreviewOpen(true)}
                  className="text-[11px] font-semibold text-indigo-600 hover:underline flex items-center gap-1 mt-0.5"
                >
                  <Eye className="w-3 h-3" /> Preview Document
                </button>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-8 w-8 rounded-lg hover:bg-white dark:hover:bg-gray-700"
                  title="Replace"
                >
                  <Upload className="w-3.5 h-3.5 text-gray-600" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleClear}
                  className="h-8 w-8 rounded-lg text-red-500 hover:text-red-600 hover:bg-red-50"
                  title="Remove"
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="py-3 flex flex-col items-center justify-center text-center gap-1">
              <div className="w-8 h-8 rounded-xl bg-white dark:bg-gray-700 shadow-sm flex items-center justify-center text-gray-500">
                <FileText className="w-4 h-4 text-indigo-500" />
              </div>
              <p className="text-xs font-bold text-gray-700 dark:text-gray-300">
                Click to upload {label}
              </p>
              <p className="text-[10px] text-muted-foreground">Front/back image of original card</p>
            </div>
          )}
        </div>
      )}

      {/* Lightbox / Preview Modal */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center justify-between">
              <span>{label} Preview</span>
            </DialogTitle>
          </DialogHeader>
          <div className="mt-2 rounded-2xl overflow-hidden bg-slate-900/95 flex items-center justify-center min-h-[300px] max-h-[68vh] p-3 shadow-inner">
            {value && (
              <img
                src={value}
                alt={label}
                className="max-h-[65vh] w-auto max-w-full object-contain rounded-xl shadow-md"
              />
            )}
          </div>
          <div className="flex justify-end gap-2 mt-4 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsPreviewOpen(false)}
              className="rounded-xl font-bold"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

