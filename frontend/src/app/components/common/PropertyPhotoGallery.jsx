import { useState, useRef } from "react";
import { ChevronLeft, ChevronRight, Camera, Plus, Eye, Image as ImageIcon } from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { DocumentViewerModal } from "./DocumentViewerModal";

/**
 * Horizontal-scrolling photo gallery for PG properties.
 * Displays multiple photos with smooth horizontal scrolling, snap positioning,
 * full lightbox preview, and a quick-action button to manage photos.
 */
export function PropertyPhotoGallery({
  images = [],
  propertyName = "Property",
  heightClass = "h-40 sm:h-44",
  onManagePhotos,
  canManage = true,
  fallbackImage
}) {
  const scrollRef = useRef(null);
  const [viewerState, setViewerState] = useState({ isOpen: false, imageUrl: null, title: "" });
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const photoList = Array.isArray(images) ? images.filter(Boolean) : [];

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scroll = (direction) => {
    if (scrollRef.current) {
      const offset = scrollRef.current.clientWidth * 0.75;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -offset : offset,
        behavior: "smooth"
      });
      setTimeout(checkScroll, 300);
    }
  };

  return (
    <div className={`relative w-full ${heightClass} overflow-hidden rounded-2xl bg-slate-950 group select-none`}>
      {photoList.length > 0 ? (
        <>
          {/* Horizontal Scrolling Strip */}
          <div
            ref={scrollRef}
            onScroll={checkScroll}
            className="flex w-full h-full overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar gap-1.5 p-1"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {photoList.map((img, idx) => (
              <div
                key={idx}
                className={`relative flex-shrink-0 h-full snap-center overflow-hidden rounded-xl bg-slate-900 cursor-pointer ${
                  photoList.length === 1 ? "w-full" : "w-[85%] sm:w-[75%]"
                }`}
                onClick={() => setViewerState({
                  isOpen: true,
                  imageUrl: img,
                  title: `${propertyName} - Photo ${idx + 1}`
                })}
              >
                {/* Ambient blur behind portrait/unusual aspect ratios */}
                <img
                  src={img}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full object-cover blur-md opacity-30 scale-110 pointer-events-none"
                />
                {/* Main sharp image */}
                <img
                  src={img}
                  alt={`${propertyName} photo ${idx + 1}`}
                  className="relative z-10 w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                />

                {/* Cover badge on first image */}
                {idx === 0 && (
                  <span className="absolute bottom-2 left-2 z-20 bg-indigo-600/90 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md shadow-sm">
                    Cover
                  </span>
                )}

                {/* Hover Eye Overlay */}
                <div className="absolute inset-0 z-20 bg-black/30 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                  <div className="p-2 rounded-full bg-black/50 backdrop-blur-sm">
                    <Eye className="w-4 h-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Left Arrow Button */}
          {photoList.length > 1 && canScrollLeft && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); scroll("left"); }}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-white flex items-center justify-center shadow-lg transition-transform hover:scale-110"
              title="Previous Photo"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}

          {/* Right Arrow Button */}
          {photoList.length > 1 && canScrollRight && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); scroll("right"); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-white flex items-center justify-center shadow-lg transition-transform hover:scale-110"
              title="Next Photo"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}

          {/* Photo Count Pill */}
          <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1.5 pointer-events-none">
            <Badge className="bg-black/65 backdrop-blur-md border-none text-white font-bold px-2 py-0.5 rounded-full text-[10px] flex items-center gap-1">
              <Camera className="w-3 h-3" />
              <span>{photoList.length} {photoList.length === 1 ? "Photo" : "Photos"}</span>
            </Badge>
          </div>
        </>
      ) : (
        /* Empty / Fallback State */
        <div className="relative w-full h-full flex flex-col items-center justify-center text-center p-4">
          {fallbackImage ? (
            <>
              <img
                src={fallbackImage}
                alt={propertyName}
                className="absolute inset-0 w-full h-full object-cover opacity-70"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/30" />
            </>
          ) : (
            <div className="w-12 h-12 rounded-2xl bg-indigo-900/40 border border-indigo-700/50 flex items-center justify-center text-indigo-400 mb-2">
              <ImageIcon className="w-6 h-6" />
            </div>
          )}

          <div className="relative z-10 space-y-1">
            <p className="text-xs font-bold text-white drop-shadow-sm">No Property Photos Uploaded</p>
            {canManage && onManagePhotos && (
              <Button
                type="button"
                size="sm"
                onClick={(e) => { e.stopPropagation(); onManagePhotos(); }}
                className="mt-2 rounded-xl text-xs font-bold h-8 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/30"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Upload PG Photos
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Quick Manage / Upload Photos Button on Top Right */}
      {canManage && onManagePhotos && photoList.length > 0 && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onManagePhotos(); }}
          className="absolute top-2.5 right-2.5 z-30 p-1.5 rounded-xl bg-black/60 hover:bg-indigo-600 backdrop-blur-md text-white transition-all shadow-md group-hover:scale-105"
          title="Upload or Manage PG Photos"
        >
          <Camera className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Lightbox / Fullscreen Modal */}
      <DocumentViewerModal
        isOpen={viewerState.isOpen}
        onClose={() => setViewerState({ isOpen: false, imageUrl: null, title: "" })}
        imageUrl={viewerState.imageUrl}
        title={viewerState.title}
      />
    </div>
  );
}

export default PropertyPhotoGallery;

