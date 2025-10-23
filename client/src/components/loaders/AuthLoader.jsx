import React from "react";
import { motion } from "framer-motion";

/**
 * AuthLoader - A beautiful animated loader for authenticated pages
 * Features:
 * - Animated pulsing circles
 * - Smooth fade-in/out animations
 * - Optional loading text
 * - Dark theme design
 * - Fullscreen or inline display
 */
const AuthLoader = ({
  fullScreen = true,
  text = "Loading...",
  showText = true,
  size = "default", // "small", "default", "large"
}) => {
  const sizes = {
    small: { container: 40, circle: 8 },
    default: { container: 60, circle: 12 },
    large: { container: 80, circle: 16 },
  };

  const { container, circle } = sizes[size] || sizes.default;

  // Container variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.3,
        when: "beforeChildren",
        staggerChildren: 0.1,
      },
    },
    exit: {
      opacity: 0,
      transition: { duration: 0.2 },
    },
  };

  // Circle animation variants
  const circleVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: {
      scale: [0, 1, 1, 0],
      opacity: [0, 1, 1, 0],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  };

  // Rotating ring variant
  const ringVariants = {
    rotate: {
      rotate: 360,
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "linear",
      },
    },
  };

  // Text animation
  const textVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        delay: 0.2,
        duration: 0.5,
      },
    },
  };

  const LoaderContent = () => (
    <motion.div
      className="flex flex-col items-center justify-center gap-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      {/* Loader Animation */}
      <div className="relative" style={{ width: container, height: container }}>
        {/* Outer rotating ring */}
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-500 border-r-blue-500"
          variants={ringVariants}
          animate="rotate"
        />

        {/* Middle rotating ring (opposite direction) */}
        <motion.div
          className="absolute inset-2 rounded-full border-2 border-transparent border-b-purple-500 border-l-purple-500"
          animate={{ rotate: -360 }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "linear",
          }}
        />

        {/* Center pulsing circles */}
        <div className="absolute inset-0 flex items-center justify-center">
          {[0, 1, 2].map((index) => (
            <motion.div
              key={index}
              className="absolute rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
              style={{
                width: circle,
                height: circle,
              }}
              variants={circleVariants}
              animate="visible"
              transition={{
                delay: index * 0.3,
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>

        {/* Inner glow effect */}
        <motion.div
          className="absolute inset-4 rounded-full bg-blue-500/10 blur-md"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* Loading Text */}
      {showText && (
        <motion.div
          className="flex flex-col items-center gap-2"
          variants={textVariants}
        >
          <p className="text-sm font-medium text-gray-300">{text}</p>

          {/* Animated dots */}
          <div className="flex gap-1">
            {[0, 1, 2].map((index) => (
              <motion.div
                key={index}
                className="w-1.5 h-1.5 rounded-full bg-blue-500"
                animate={{
                  y: [0, -8, 0],
                  opacity: [0.3, 1, 0.3],
                }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  delay: index * 0.15,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );

  if (fullScreen) {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center z-50"
        style={{ backgroundColor: "#000000" }}
      >
        <LoaderContent />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center w-full h-full min-h-[200px]">
      <LoaderContent />
    </div>
  );
};

export default AuthLoader;
