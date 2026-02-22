
import React from 'react';
import { motion } from 'motion/react';
import { Card as CardType } from '../types';
import { SUIT_SYMBOLS, SUIT_COLORS } from '../constants';

interface CardProps {
  card: CardType;
  isFaceUp?: boolean;
  onClick?: () => void;
  isPlayable?: boolean;
  className?: string;
}

const Card: React.FC<CardProps> = ({ card, isFaceUp = true, onClick, isPlayable = false, className = '' }) => {
  return (
    <motion.div
      layout
      initial={{ scale: 0.8, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      whileHover={isPlayable ? { y: -10, scale: 1.05 } : {}}
      onClick={isPlayable ? onClick : undefined}
      className={`
        relative w-20 h-28 sm:w-24 sm:h-36 rounded-lg shadow-xl cursor-pointer
        ${isFaceUp ? 'bg-white' : 'bg-blue-800 border-4 border-white'}
        ${isPlayable ? 'ring-4 ring-yellow-400' : ''}
        transition-shadow duration-200
        ${className}
      `}
    >
      {isFaceUp ? (
        <div className={`flex flex-col h-full p-2 ${SUIT_COLORS[card.suit]}`}>
          <div className="text-lg font-bold leading-none">{card.rank}</div>
          <div className="text-sm leading-none">{SUIT_SYMBOLS[card.suit]}</div>
          <div className="flex-grow flex items-center justify-center text-4xl">
            {SUIT_SYMBOLS[card.suit]}
          </div>
          <div className="text-sm leading-none self-end rotate-180">{SUIT_SYMBOLS[card.suit]}</div>
          <div className="text-lg font-bold leading-none self-end rotate-180">{card.rank}</div>
        </div>
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-12 h-16 border-2 border-white/20 rounded opacity-20" />
        </div>
      )}
    </motion.div>
  );
};

export default Card;
