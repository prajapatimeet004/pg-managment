import { useState } from "react";
import { Eye, User, FileText } from "lucide-react";

/**
 * Reusable DocumentCardBox component for displaying profile photos and identity documents.
 * Ensures the entire image is 100% visible inside the box without cropping off heads, faces,
 * or document edges (using object-contain), accompanied by an ambient blurred backdrop
 * that gracefully fills the card edges.
 */
export function DocumentCardBox({
  src,
  alt = "Document",
  type = "document",
  heightClass = "h-48 sm:h-52",
  onClick,
  title
}) {
  const [isSquished, setIsSquished] = useState(false);

  const handleImgLoad = (e) => {
    const { naturalWidth, naturalHeight } = e.target;
    if (naturalWidth && naturalHeight) {
      const ratio = naturalWidth / naturalHeight;
      // Auto-correct any legacy compressed images that were stored with an unnaturally thin ratio
      if (ratio < 0.35) {
        setIsSquished(true);
      }
    }
  };

  return (
    <div
      className={`relative w-full ${heightClass} rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center border border-gray-200 dark:border-gray-800 cursor-pointer group shadow-inner p-2 select-none`}
      onClick={onClick}
      title={title || `Click to view ${alt}`}
    >
      {src ? (
        <>
          {/* Ambient blurred backdrop so the box looks beautifully filled with natural colors */}
          <img
            src={src}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover blur-xl opacity-35 scale-125 pointer-events-none"
          />

          {/* Sharp, uncropped image completely visible inside the box */}
          <img
            src={src}
            alt={alt}
            onLoad={handleImgLoad}
            className={`relative z-10 max-h-full max-w-full w-auto h-auto object-contain rounded-xl drop-shadow-md group-hover:scale-105 transition-transform duration-300 mx-auto block ${
              isSquished ? "scale-x-[2.2] origin-center" : ""
            }`}
          />

          {/* Eye hover overlay */}
          <div className="absolute inset-0 z-20 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white rounded-2xl">
            <div className="p-2.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white shadow-lg">
              <Eye className="w-5 h-5" />
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center text-gray-500 gap-1.5 p-4 text-center">
          {type === "photo" ? (
            <User className="w-10 h-10 text-gray-600" />
          ) : (
            <FileText className="w-10 h-10 text-gray-600" />
          )}
          <span className="text-[11px] font-semibold text-gray-500">Not uploaded</span>
        </div>
      )}
    </div>
  );
}

export default DocumentCardBox;

