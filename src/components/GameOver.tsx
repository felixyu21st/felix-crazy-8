
import React from 'react';
import { motion } from 'motion/react';
import { Trophy, RotateCcw } from 'lucide-react';

interface GameOverProps {
  winner: 'player' | 'ai' | 'draw';
  onRestart: () => void;
}

const GameOver: React.FC<GameOverProps> = ({ winner, onRestart }) => {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50">
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white p-10 rounded-3xl shadow-2xl text-center max-w-md w-full mx-4"
      >
        <div className={`inline-flex p-4 rounded-full mb-6 ${
          winner === 'player' ? 'bg-yellow-100 text-yellow-600' : 
          winner === 'ai' ? 'bg-gray-100 text-gray-600' : 
          'bg-blue-100 text-blue-600'
        }`}>
          <Trophy size={48} />
        </div>
        
        <h2 className="text-4xl font-black text-gray-900 mb-2">
          {winner === 'player' ? '你赢了！' : winner === 'ai' ? 'AI 赢了' : '平局！'}
        </h2>
        <p className="text-gray-500 mb-8 text-lg">
          {winner === 'player' ? '太棒了，你清空了所有的手牌！' : 
           winner === 'ai' ? '别灰心，下次一定能赢！' : 
           '牌堆已空且双方都无法出牌。'}
        </p>

        <button
          onClick={onRestart}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-2xl transition-all transform hover:scale-[1.02] active:scale-95 shadow-lg"
        >
          <RotateCcw size={20} />
          再来一局
        </button>
      </motion.div>
    </div>
  );
};

export default GameOver;
