import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { getCommonEmojis } from "../../../utils/emojiUtils";

/**
 * Reaction Picker Modal Component
 * Modal for selecting emoji reactions
 */
const ReactionPicker = ({ isOpen, onClose, onSelect, position = { x: 0, y: 0 } }) => {
  const emojis = getCommonEmojis();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50" onClick={onClose}>
        <motion.div
          className="absolute bg-gray-900 rounded-xl border border-gray-800 shadow-2xl p-4"
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
            transform: "translate(-50%, -100%)",
          }}
          initial={{ opacity: 0, scale: 0.8, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 10 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="grid grid-cols-5 gap-2">
            {emojis.map((emojiData) => (
              <motion.button
                key={emojiData.name}
                onClick={() => {
                  onSelect(emojiData.emoji);
                  onClose();
                }}
                className="p-3 rounded-lg hover:bg-gray-800 transition-colors text-2xl"
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                title={emojiData.name}
              >
                {emojiData.emoji}
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ReactionPicker;

