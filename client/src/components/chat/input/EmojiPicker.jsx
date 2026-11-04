import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Smile, X } from "lucide-react";
import { getCommonEmojis } from "../../../utils/emojiUtils";

/**
 * Emoji Picker Component
 * Picker for selecting emojis
 */
const EmojiPicker = ({ onSelect, position = "top" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const emojis = getCommonEmojis();

  const handleSelect = (emoji) => {
    onSelect(emoji);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <motion.button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <Smile className="w-5 h-5" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              className={`absolute ${
                position === "top" ? "bottom-full mb-2" : "top-full mt-2"
              } left-0 bg-gray-900 border border-gray-800/50 rounded-lg shadow-xl p-3 z-50`}
              initial={{
                opacity: 0,
                scale: 0.8,
                y: position === "top" ? 10 : -10,
              }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{
                opacity: 0,
                scale: 0.8,
                y: position === "top" ? 10 : -10,
              }}
            >
              <div className="grid grid-cols-5 gap-2 w-64">
                {emojis.map((emojiData) => (
                  <motion.button
                    key={emojiData.name}
                    onClick={() => handleSelect(emojiData.emoji)}
                    className="p-2 text-2xl hover:bg-gray-800 rounded transition-colors"
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    title={emojiData.name}
                  >
                    {emojiData.emoji}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EmojiPicker;
