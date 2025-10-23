import React from "react";
import { motion } from "framer-motion";

/**
 * SkeletonLoader - For content placeholders while loading
 * Features:
 * - Shimmer animation effect
 * - Customizable shapes and sizes
 * - Multiple skeleton types
 */
const SkeletonLoader = ({ 
  variant = "default", 
  count = 1,
  className = "",
  animate = true
}) => {
  const shimmerVariants = {
    initial: { x: "-100%" },
    animate: {
      x: "100%",
      transition: {
        repeat: Infinity,
        duration: 1.5,
        ease: "linear",
      },
    },
  };

  const Skeleton = ({ customClass = "" }) => (
    <div className={`relative overflow-hidden bg-gray-900 rounded-lg ${customClass}`}>
      {animate && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-800 to-transparent"
          variants={shimmerVariants}
          initial="initial"
          animate="animate"
        />
      )}
    </div>
  );

  const variants = {
    // Default rectangle
    default: (
      <Skeleton customClass={`h-4 w-full ${className}`} />
    ),
    
    // Text line
    text: (
      <Skeleton customClass={`h-4 w-full ${className}`} />
    ),
    
    // Title
    title: (
      <Skeleton customClass={`h-8 w-3/4 ${className}`} />
    ),
    
    // Circle/Avatar
    circle: (
      <Skeleton customClass={`h-12 w-12 rounded-full ${className}`} />
    ),
    
    // Card
    card: (
      <div className={`space-y-4 p-4 bg-gray-950 rounded-lg border border-gray-900 ${className}`}>
        <Skeleton customClass="h-32 w-full" />
        <Skeleton customClass="h-4 w-3/4" />
        <Skeleton customClass="h-4 w-full" />
      </div>
    ),
    
    // Task card
    taskCard: (
      <div className={`space-y-3 p-4 bg-gray-950 rounded-lg border border-gray-900 ${className}`}>
        <Skeleton customClass="h-5 w-full" />
        <Skeleton customClass="h-3 w-4/5" />
        <Skeleton customClass="h-3 w-3/5" />
        <div className="flex items-center justify-between pt-2">
          <Skeleton customClass="h-6 w-6 rounded-full" />
          <Skeleton customClass="h-3 w-16" />
        </div>
      </div>
    ),
    
    // Table row
    tableRow: (
      <div className={`flex items-center gap-4 p-4 ${className}`}>
        <Skeleton customClass="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton customClass="h-4 w-1/3" />
          <Skeleton customClass="h-3 w-1/4" />
        </div>
        <Skeleton customClass="h-8 w-20 rounded-lg" />
      </div>
    ),
  };

  const selectedVariant = variants[variant] || variants.default;

  if (count > 1) {
    return (
      <div className="space-y-4">
        {Array.from({ length: count }).map((_, index) => (
          <div key={index}>{selectedVariant}</div>
        ))}
      </div>
    );
  }

  return selectedVariant;
};

export default SkeletonLoader;

