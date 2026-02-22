
import React from 'react';
import { motion } from 'motion/react';
import { Suit } from '../types';
import { SUITS, SUIT_SYMBOLS, SUIT_COLORS } from '../constants';

interface SuitPickerProps {
  onSelect: (suit: Suit) => void;
}

const SuitPicker: React.FC<SuitPickerProps> = ({ onSelect }) => {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white p-8 rounded-3xl shadow-2xl text-center max-w-sm w-full mx-4"
      >
        <h2 className="text-2xl font-bold text-gray-800 mb-6">选择一个花色</h2>
        <div className="grid grid-cols-2 gap-4">
          {SUITS.map((suit) => (
            <button
              key={suit}
              onClick={() => onSelect(suit)}
              className={`
                flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-gray-100
                hover:border-blue-500 hover:bg-blue-50 transition-all group
                ${SUIT_COLORS[suit]}
              `}
            >
              <span className="text-5xl mb-2 group-hover:scale-110 transition-transform">
                {SUIT_SYMBOLS[suit]}
              </span>
              <span className="text-sm font-semibold uppercase tracking-wider">
                {suit === 'hearts' ? '红心' : suit === 'diamonds' ? '方块' : suit === 'clubs' ? '梅花' : '黑桃'}
              </span>
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default SuitPicker;
