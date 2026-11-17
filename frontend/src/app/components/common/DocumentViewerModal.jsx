import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Download, Maximize2, Minimize2, Sparkles } from "lucide-react";

export function DocumentViewerModal({ isOpen, onClose, title, imageUrl }) {
  const [isSquished, setIsSquished] = useState(false);
  const [fitMode, setFitMode] = useState("fit"); // "fit" (contain) or "fill" (cover)

  useEffect(() => {
    // Reset on image change
    setIsSquished(false);
    setFitMode("fit");
  }, [imageUrl, isOpen]);

  if (!imageUrl) return null;

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `${(title || "document").toLowerCase().replace(/\s+/g, "_")}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImgLoad = (e) => {
    const { naturalWidth, naturalHeight } = e.target;
    if (naturalWidth && naturalHeight) {
      const ratio = naturalWidth / naturalHeight;
      // If aspect ratio is unnaturally thin (< 0.35, e.g. 1:6 or 1:7 from older compression),
      // auto-correct its aspect ratio so it fills and fits normally
      if (ratio < 0.35) {
        setIsSquished(true);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[620px] max-h-[92vh] overflow-hidden flex flex-col rounded-3xl p-6 bg-white dark:bg-gray-900 border-none shadow-2xl">
        <DialogHeader className="pb-2 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-bold text-gray-900 dark:text-white truncate">
              {title || "Document Preview"}
            </DialogTitle>
            {isSquished && (
              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-full flex items-center gap-1 border border-indigo-200">
                <Sparkles className="w-3 h-3" /> Auto-corrected
              </span>
            )}
          </div>
        </DialogHeader>

        {/* Image Display Box */}
        <div className="mt-3 rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center min-h-[360px] max-h-[66vh] w-full p-2 relative shadow-inner">
          <img
            src={imageUrl}
            alt={title}
            onLoad={handleImgLoad}
            className={`transition-all duration-300 rounded-xl shadow-lg ${
              fitMode === "fill"
                ? "w-full h-full object-cover min-h-[360px] max-h-[65vh]"
                : isSquished
                ? "max-h-[63vh] w-auto scale-x-[2.5] object-contain origin-center"
                : "max-h-[63vh] max-w-full w-auto object-contain"
            }`}
          />
        </div>

        {/* Controls Footer */}
        <div className="flex justify-between items-center mt-4 pt-1">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="rounded-xl font-bold h-9 text-xs"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" /> Download
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setFitMode(fitMode === "fit" ? "fill" : "fit")}
              className="rounded-xl font-bold h-9 text-xs"
              title={fitMode === "fit" ? "Expand image to fill the entire box" : "Fit image keeping original edges"}
            >
              {fitMode === "fit" ? (
                <>
                  <Maximize2 className="w-3.5 h-3.5 mr-1.5 text-indigo-600" /> Fill Box
                </>
              ) : (
                <>
                  <Minimize2 className="w-3.5 h-3.5 mr-1.5 text-indigo-600" /> Fit Normal
                </>
              )}
            </Button>
          </div>

          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={onClose}
            className="rounded-xl font-bold h-9 px-5 bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
