import { motion, AnimatePresence } from "motion/react";

export function LoginBackground({ children, isOpen, isError }) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#030303] flex items-center justify-center font-sans">
      {/* Dynamic Mesh Gradient Background */}
      <motion.div 
        animate={{ 
          scale: isOpen ? 2 : 1,
          opacity: isOpen ? 0 : 1,
          filter: isOpen ? "blur(60px)" : "blur(0px)"
        }}
        transition={{ duration: 1.5, ease: [0.4, 0, 0.2, 1] }}
        className="absolute inset-0 z-0 overflow-hidden"
      >
        {/* Animated Color Blobs */}
        <motion.div
          animate={{
            x: [0, 100, -50, 0],
            y: [0, -100, 50, 0],
            scale: [1, 1.2, 0.9, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] bg-indigo-600/30 blur-[120px] rounded-full"
        />
        <motion.div
          animate={{
            x: [0, -120, 80, 0],
            y: [0, 150, -100, 0],
            scale: [1, 1.3, 0.8, 1],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] bg-blue-600/20 blur-[130px] rounded-full"
        />
        <motion.div
          animate={{
            x: [0, 200, -150, 0],
            y: [0, 100, -150, 0],
          }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="absolute top-[20%] right-[10%] w-[50%] h-[50%] bg-purple-600/20 blur-[140px] rounded-full"
        />

        {/* Noise / Grain Texture */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
        
        {/* Subtle Grid Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
      </motion.div>

      {/* Main Content Container with Tilt Effect Support */}
      <motion.div
        animate={isError ? {
          x: [-4, 4, -4, 4, 0],
          transition: { duration: 0.4 }
        } : {}}
        className="relative z-10 w-full flex items-center justify-center p-6"
      >
        <AnimatePresence mode="wait">
          {!isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ 
                opacity: 0, 
                scale: 1.5,
                filter: "blur(20px)",
                transition: { duration: 0.8, ease: [0.4, 0, 0.2, 1] }
              }}
            >
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Global Ambient Glow */}
      <div className="absolute inset-0 pointer-events-none bg-radial-gradient from-transparent via-transparent to-black/40" />
    </div>
  );
}
