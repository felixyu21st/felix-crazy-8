/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { Layers, User, Cpu, Info } from 'lucide-react';

import { Card as CardType, Suit, Rank, GameStatus, GameState } from './types';
import { SUITS, INITIAL_HAND_SIZE, SUIT_SYMBOLS, SUIT_COLORS } from './constants';
import { createDeck, isPlayable, shuffle } from './utils';

import Card from './components/Card';
import SuitPicker from './components/SuitPicker';
import GameOver from './components/GameOver';

export default function App() {
  const [gameState, setGameState] = useState<GameState>({
    deck: [],
    playerHand: [],
    aiHand: [],
    discardPile: [],
    currentSuit: 'hearts',
    currentRank: 'A',
    turn: 'player',
    status: 'dealing',
    winner: null,
  });

  const [pendingEightCard, setPendingEightCard] = useState<CardType | null>(null);
  const [message, setMessage] = useState<string>('正在发牌...');
  const aiThinkingRef = useRef<boolean>(false);

  const initGame = useCallback(() => {
    const fullDeck = createDeck();
    const playerHand = fullDeck.slice(0, INITIAL_HAND_SIZE);
    const aiHand = fullDeck.slice(INITIAL_HAND_SIZE, INITIAL_HAND_SIZE * 2);
    let remainingDeck = fullDeck.slice(INITIAL_HAND_SIZE * 2);

    // Find first non-8 card for discard pile
    let firstCardIndex = 0;
    while (remainingDeck[firstCardIndex].rank === '8') {
      firstCardIndex++;
    }
    const firstCard = remainingDeck[firstCardIndex];
    remainingDeck.splice(firstCardIndex, 1);

    setGameState({
      deck: remainingDeck,
      playerHand,
      aiHand,
      discardPile: [firstCard],
      currentSuit: firstCard.suit,
      currentRank: firstCard.rank,
      turn: 'player',
      status: 'playing',
      winner: null,
    });
    setMessage('你的回合');
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const checkWinner = (state: GameState) => {
    if (state.playerHand.length === 0) return 'player';
    if (state.aiHand.length === 0) return 'ai';
    
    // Check for draw: deck is empty and no one can play
    if (state.deck.length === 0) {
      const playerCanPlay = state.playerHand.some(c => isPlayable(c, state.currentSuit, state.currentRank));
      const aiCanPlay = state.aiHand.some(c => isPlayable(c, state.currentSuit, state.currentRank));
      if (!playerCanPlay && !aiCanPlay) return 'draw';
    }
    
    return null;
  };

  const handleDraw = () => {
    if (gameState.turn !== 'player' || gameState.status !== 'playing') return;

    if (gameState.deck.length === 0) {
      setMessage('没牌可摸了，跳过回合');
      const winner = checkWinner(gameState);
      if (winner === 'draw') {
        setGameState(prev => ({ ...prev, status: 'game_over', winner: 'draw' }));
      } else {
        setTimeout(() => endTurn('ai'), 1000);
      }
      return;
    }

    // Draw until playable or deck empty
    let currentDeck = [...gameState.deck];
    let currentHand = [...gameState.playerHand];
    let drawnCards: CardType[] = [];
    let foundPlayable = false;

    while (currentDeck.length > 0 && !foundPlayable) {
      const card = currentDeck.shift()!;
      drawnCards.push(card);
      currentHand.push(card);
      if (isPlayable(card, gameState.currentSuit, gameState.currentRank)) {
        foundPlayable = true;
      }
    }

    setGameState(prev => ({
      ...prev,
      deck: currentDeck,
      playerHand: currentHand,
    }));

    if (foundPlayable) {
      setMessage(`摸了 ${drawnCards.length} 张牌，现在你可以出牌了`);
    } else {
      setMessage('摸完了所有牌仍然无法出牌，换 AI');
      const tempState = { ...gameState, deck: currentDeck, playerHand: currentHand };
      const winner = checkWinner(tempState);
      if (winner === 'draw') {
        setGameState(prev => ({ ...prev, status: 'game_over', winner: 'draw' }));
      } else {
        setTimeout(() => endTurn('ai'), 1000);
      }
    }
  };

  const playCard = (card: CardType, isPlayer: boolean) => {
    if (card.rank === '8') {
      if (isPlayer) {
        setPendingEightCard(card);
        setGameState(prev => ({ ...prev, status: 'picking_suit' }));
      } else {
        // AI logic for 8
        const aiSuits = gameState.aiHand.map(c => c.suit);
        const mostCommonSuit = SUITS.reduce((a, b) => 
          aiSuits.filter(s => s === a).length >= aiSuits.filter(s => s === b).length ? a : b
        );
        executePlay(card, mostCommonSuit, isPlayer);
      }
    } else {
      executePlay(card, card.suit, isPlayer);
    }
  };

  const executePlay = (card: CardType, newSuit: Suit, isPlayer: boolean) => {
    setGameState(prev => {
      const handKey = isPlayer ? 'playerHand' : 'aiHand';
      const newHand = prev[handKey].filter(c => c.id !== card.id);
      const newState = {
        ...prev,
        [handKey]: newHand,
        discardPile: [...prev.discardPile, card],
        currentSuit: newSuit,
        currentRank: card.rank,
        status: 'playing' as GameStatus,
      };

      const winner = checkWinner(newState);
      if (winner) {
        newState.status = 'game_over';
        newState.winner = winner;
        if (winner === 'player') {
          confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 }
          });
        }
      }

      return newState;
    });

    if (gameState.status !== 'game_over') {
      endTurn(isPlayer ? 'ai' : 'player');
    }
  };

  const endTurn = (nextTurn: 'player' | 'ai') => {
    setGameState(prev => ({ ...prev, turn: nextTurn }));
    setMessage(nextTurn === 'player' ? '你的回合' : 'AI 正在思考...');
  };

  const handleSuitSelect = (suit: Suit) => {
    if (pendingEightCard) {
      executePlay(pendingEightCard, suit, true);
      setPendingEightCard(null);
    }
  };

  // AI Logic
  useEffect(() => {
    if (gameState.turn === 'ai' && gameState.status === 'playing' && !aiThinkingRef.current) {
      aiThinkingRef.current = true;
      
      const timer = setTimeout(() => {
        const playableCards = gameState.aiHand.filter(c => 
          isPlayable(c, gameState.currentSuit, gameState.currentRank)
        );

        if (playableCards.length > 0) {
          // AI plays a card (prefer non-8s first, or strategic choice)
          const nonEight = playableCards.find(c => c.rank !== '8');
          const cardToPlay = nonEight || playableCards[0];
          playCard(cardToPlay, false);
        } else {
          // AI draws until playable or deck empty
          let currentDeck = [...gameState.deck];
          let currentAiHand = [...gameState.aiHand];
          let foundPlayable = false;
          let lastDrawn: CardType | null = null;

          while (currentDeck.length > 0 && !foundPlayable) {
            const card = currentDeck.shift()!;
            currentAiHand.push(card);
            lastDrawn = card;
            if (isPlayable(card, gameState.currentSuit, gameState.currentRank)) {
              foundPlayable = true;
            }
          }

          setGameState(prev => ({
            ...prev,
            deck: currentDeck,
            aiHand: currentAiHand,
          }));

          if (foundPlayable && lastDrawn) {
            setMessage('AI 摸到了可以出的牌');
            playCard(lastDrawn, false);
          } else {
            setMessage('AI 摸完了牌仍然无法出牌，跳过');
            const tempState = { ...gameState, deck: currentDeck, aiHand: currentAiHand };
            const winner = checkWinner(tempState);
            if (winner === 'draw') {
              setGameState(prev => ({ ...prev, status: 'game_over', winner: 'draw' }));
            } else {
              endTurn('player');
            }
          }
        }
        aiThinkingRef.current = false;
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [gameState.turn, gameState.status, gameState.aiHand, gameState.currentSuit, gameState.currentRank]);

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden font-sans">
      {/* Header */}
      <header className="p-4 flex justify-between items-center bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center shadow-lg">
            <Layers className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tighter uppercase">Felix疯狂 8 点</h1>
            <div className="flex items-center gap-2 text-[10px] text-white/60 uppercase tracking-widest font-bold">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              实时对战中
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
            <Info size={14} className="text-white/40" />
            <span className="text-xs font-medium text-white/80">规则：数字 8 是万能牌</span>
          </div>
          <button 
            onClick={() => {
              if (gameState.deck.length === 0 || gameState.status === 'game_over') {
                initGame();
              }
            }}
            disabled={gameState.deck.length > 0 && gameState.status !== 'game_over'}
            title={gameState.deck.length > 0 && gameState.status !== 'game_over' ? "需摸完所有牌才能重新开始" : "重新开始"}
            className={`p-2 rounded-full transition-colors ${
              (gameState.deck.length === 0 || gameState.status === 'game_over')
                ? 'hover:bg-white/10 text-white cursor-pointer' 
                : 'text-white/20 cursor-not-allowed'
            }`}
          >
            <RotateCcwIcon size={20} />
          </button>
        </div>
      </header>

      {/* Main Game Area */}
      <main className="flex-grow relative flex flex-col items-center justify-between p-4 sm:p-8">
        
        {/* AI Hand */}
        <div className="w-full flex flex-col items-center">
          <div className="flex items-center gap-2 mb-4 bg-black/30 px-4 py-1 rounded-full border border-white/10">
            <Cpu size={16} className="text-blue-400" />
            <span className="text-sm font-bold uppercase tracking-widest">AI 对手 ({gameState.aiHand.length})</span>
          </div>
          <div className="flex -space-x-12 sm:-space-x-16 hover:-space-x-8 transition-all duration-300">
            {gameState.aiHand.map((card, index) => (
              <Card key={card.id} card={card} isFaceUp={false} className="z-10" />
            ))}
          </div>
        </div>

        {/* Center: Deck and Discard Pile */}
        <div className="flex items-center gap-8 sm:gap-16 my-8">
          {/* Draw Pile */}
          <div className="relative group">
            <div className="absolute -inset-4 bg-blue-500/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <div 
              onClick={handleDraw}
              className={`
                relative w-20 h-28 sm:w-24 sm:h-36 rounded-lg border-4 border-white shadow-2xl cursor-pointer
                bg-blue-800 flex flex-col items-center justify-center gap-2
                transform transition-all active:scale-95
                ${gameState.turn === 'player' && gameState.status === 'playing' ? 'hover:-translate-y-2 ring-4 ring-yellow-400/50' : 'opacity-80 grayscale'}
              `}
            >
              <div className="w-10 h-14 border-2 border-white/20 rounded flex items-center justify-center">
                <span className="text-xs font-bold text-white/40">{gameState.deck.length}</span>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-white/60">摸牌</span>
            </div>
          </div>

          {/* Discard Pile */}
          <div className="relative">
             <div className="absolute -inset-4 bg-yellow-500/10 rounded-full blur-2xl" />
             <div className="relative">
                <AnimatePresence mode="popLayout">
                  {gameState.discardPile.map((card, index) => (
                    index === gameState.discardPile.length - 1 && (
                      <Card 
                        key={card.id} 
                        card={card} 
                        className="shadow-2xl"
                      />
                    )
                  ))}
                </AnimatePresence>
                
                {/* Current Suit Indicator (for 8s) */}
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex flex-col items-center">
                   <div className={`text-3xl drop-shadow-lg ${SUIT_COLORS[gameState.currentSuit]}`}>
                     {SUIT_SYMBOLS[gameState.currentSuit]}
                   </div>
                   <div className="text-[10px] font-black uppercase tracking-tighter text-white/40">当前花色</div>
                </div>
             </div>
          </div>
        </div>

        {/* Player Hand */}
        <div className="w-full flex flex-col items-center">
          <div className="flex items-center gap-2 mb-4 bg-black/30 px-4 py-1 rounded-full border border-white/10">
            <User size={16} className="text-green-400" />
            <span className="text-sm font-bold uppercase tracking-widest">你的手牌 ({gameState.playerHand.length})</span>
          </div>
          <div className="flex flex-wrap justify-center gap-2 sm:gap-4 max-w-4xl">
            {gameState.playerHand.map((card) => (
              <Card 
                key={card.id} 
                card={card} 
                isPlayable={gameState.turn === 'player' && gameState.status === 'playing' && isPlayable(card, gameState.currentSuit, gameState.currentRank)}
                onClick={() => playCard(card, true)}
              />
            ))}
          </div>
        </div>
      </main>

      {/* Footer / Status Bar */}
      <footer className="p-4 bg-black/40 backdrop-blur-md border-t border-white/10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest ${gameState.turn === 'player' ? 'bg-green-500 text-white' : 'bg-white/10 text-white/40'}`}>
              {gameState.turn === 'player' ? '你的回合' : 'AI 回合'}
            </div>
            <p className="text-sm font-medium text-white/80">{message}</p>
          </div>
          
          <div className="hidden md:flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">当前点数</span>
              <span className="text-sm font-black">{gameState.currentRank}</span>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">当前花色</span>
              <span className={`text-sm font-black uppercase ${SUIT_COLORS[gameState.currentSuit]}`}>
                {gameState.currentSuit === 'hearts' ? '红心' : gameState.currentSuit === 'diamonds' ? '方块' : gameState.currentSuit === 'clubs' ? '梅花' : '黑桃'}
              </span>
            </div>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AnimatePresence>
        {gameState.status === 'picking_suit' && (
          <SuitPicker onSelect={handleSuitSelect} />
        )}
        {gameState.status === 'game_over' && gameState.winner && (
          <GameOver winner={gameState.winner} onRestart={initGame} />
        )}
      </AnimatePresence>
    </div>
  );
}

function RotateCcwIcon({ size }: { size: number }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
}
