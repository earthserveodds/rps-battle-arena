/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Scissors, FileText, Hammer, RotateCcw, Swords, Shield, Heart, ChevronUp, ChevronDown, Users, Zap, Terminal, X, Star, Store, Ticket, Clover, Tv, Timer } from 'lucide-react';

type Choice = 'ROCK' | 'PAPER' | 'SCISSORS';
type Result = 'WIN' | 'LOSE' | 'DRAW' | null;

interface Skills {
  vipRush: number;
  merchBooth: number;
  luckyCharm: number;
  showtime: number;
  efficientFighters: number;
}

interface GameState {
  playerHP: number;
  botHP: number;
  playerMaxHP: number;
  playerATK: number;
  playerDEF: number;
  playerGold: number;
  stage: number;
  seatsLevel: number;
  autoFightLevel: number;
  isAutoFightEnabled: boolean;
  playerChoice: Choice | null;
  botChoice: Choice | null;
  roundResult: Result;
  isGameOver: boolean;
  winner: 'PLAYER' | 'BOT' | null;
  logs: string[];
  level: number;
  exp: number;
  expToNext: number;
  skillPoints: number;
  skills: Skills;
}

const AUTO_FIGHT_STEPS = [
  { interval: 15, cost: 0 },
  { interval: 12, cost: 200 },
  { interval: 10, cost: 450 },
  { interval: 8, cost: 900 },
  { interval: 6, cost: 1800 },
  { interval: 5, cost: 3500 },
];

const getBotStats = (stage: number) => ({
  maxHP: 50 + (stage - 1) * 20,
  atk: 20 + (stage - 1) * 2,
  def: 5 + (stage - 1) * 1,
  reward: 10 + (stage - 1) * 5,
});

const CHOICES: Choice[] = ['ROCK', 'PAPER', 'SCISSORS'];

const getBotChoice = (): Choice => {
  return CHOICES[Math.floor(Math.random() * CHOICES.length)];
};

const determineResult = (player: Choice, bot: Choice): Result => {
  if (player === bot) return 'DRAW';
  if (
    (player === 'ROCK' && bot === 'SCISSORS') ||
    (player === 'PAPER' && bot === 'ROCK') ||
    (player === 'SCISSORS' && bot === 'PAPER')
  ) {
    return 'WIN';
  }
  return 'LOSE';
};

const ChoiceIcon = ({ choice, className }: { choice: Choice | null; className?: string }) => {
  if (!choice) return null;
  switch (choice) {
    case 'ROCK': return <Hammer className={className} />;
    case 'PAPER': return <FileText className={className} />;
    case 'SCISSORS': return <Scissors className={className} />;
  }
};

export default function App() {
  const [state, setState] = useState<GameState>({
    playerHP: 100,
    botHP: 50,
    playerMaxHP: 100,
    playerATK: 20,
    playerDEF: 5,
    playerGold: 0,
    stage: 1,
    seatsLevel: 0,
    autoFightLevel: 0,
    isAutoFightEnabled: true,
    playerChoice: null,
    botChoice: null,
    roundResult: null,
    isGameOver: false,
    winner: null,
    logs: ['Welcome to the Arena. Choose your weapon.'],
    level: 1,
    exp: 0,
    expToNext: 50,
    skillPoints: 0,
    skills: {
      vipRush: 0,
      merchBooth: 0,
      luckyCharm: 0,
      showtime: 0,
      efficientFighters: 0,
    },
  });

  const [isAnimating, setIsAnimating] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCommand, setAdminCommand] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setState(prev => {
        const seatsCount = prev.seatsLevel * 20;
        const baseIncome = seatsCount * 0.1;
        if (baseIncome <= 0) return prev;
        
        // VIP Rush Bonus
        const vipBonus = 1 + (prev.skills.vipRush * 0.1);
        let finalIncome = baseIncome * vipBonus;
        let logMsg = `Idle Income: +${finalIncome.toFixed(1)} Gold from ${seatsCount} Spectators`;

        // Merch Booth Bonus
        const merchChance = prev.skills.merchBooth * 0.03;
        if (Math.random() < merchChance) {
          const bonus = baseIncome * 0.5;
          finalIncome += bonus;
          logMsg = `🎪 Merch Booth Triggered! +${bonus.toFixed(1)} Bonus Gold! Total: +${finalIncome.toFixed(1)}`;
        }
        
        return {
          ...prev,
          playerGold: prev.playerGold + finalIncome,
          logs: [logMsg, ...prev.logs].slice(0, 10)
        };
      });
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const handleChoice = useCallback((choice: Choice) => {
    if (state.isGameOver || isAnimating) return;

    setIsAnimating(true);
    const bot = getBotChoice();
    const result = determineResult(choice, bot);

    // Initial state update to show choices
    setState(prev => ({
      ...prev,
      playerChoice: choice,
      botChoice: bot,
      roundResult: result,
    }));

    // Delay damage application for animation feel
    setTimeout(() => {
      setState(prev => {
        let newPlayerHP = prev.playerHP;
        let newBotHP = prev.botHP;
        let logMessage = '';

        const botStats = getBotStats(prev.stage);
        const playerDamage = Math.max(0, prev.playerATK - botStats.def);
        const botDamage = Math.max(0, botStats.atk - prev.playerDEF);

        if (result === 'WIN') {
          newBotHP = Math.max(0, prev.botHP - playerDamage);
          logMessage = `Round Won! You dealt ${playerDamage} damage to Bot.`;
        } else if (result === 'LOSE') {
          // Lucky Charm logic
          const luckyChance = prev.skills.luckyCharm * 0.03;
          if (Math.random() < luckyChance) {
            logMessage = `🍀 Lucky Charm Triggered! Damage negated.`;
          } else {
            newPlayerHP = Math.max(0, prev.playerHP - botDamage);
            logMessage = `Round Lost! Bot dealt ${botDamage} damage to you.`;
          }
        } else {
          logMessage = "It's a draw! No damage dealt.";
        }

        const gameOver = newPlayerHP <= 0 || newBotHP <= 0;
        const winner = newBotHP <= 0 ? 'PLAYER' : newPlayerHP <= 0 ? 'BOT' : null;
        let newGold = prev.playerGold;
        let newStage = prev.stage;
        let newExp = prev.exp;
        let newLevel = prev.level;
        let newExpToNext = prev.expToNext;
        let newSkillPoints = prev.skillPoints;

        if (gameOver) {
          if (winner === 'PLAYER') {
            const baseReward = getBotStats(prev.stage).reward;
            // Showtime Bonus
            const showtimeBonus = 1 + (prev.skills.showtime * 0.1);
            const finalReward = Math.floor(baseReward * showtimeBonus);
            
            newGold += finalReward;
            
            // EXP Gain logic
            const expGain = 5 + prev.stage * 2;
            newExp += expGain;
            logMessage += ` YOU ARE VICTORIOUS! +${finalReward} GOLD, +${expGain} EXP earned.`;

            // Level Up logic
            while (newExp >= newExpToNext) {
              newExp -= newExpToNext;
              newLevel += 1;
              newSkillPoints += 1;
              newExpToNext = 50 + (newLevel - 1) * 25;
              logMessage += ` LEVEL UP! Reached Level ${newLevel}. +1 Skill Point.`;
            }
          } else {
            logMessage += ' YOU HAVE BEEN DEFEATED.';
          }
        }

        return {
          ...prev,
          playerHP: newPlayerHP,
          botHP: newBotHP,
          playerGold: newGold,
          stage: newStage,
          isGameOver: gameOver,
          winner,
          logs: [logMessage, ...prev.logs].slice(0, 10),
          exp: newExp,
          level: newLevel,
          expToNext: newExpToNext,
          skillPoints: newSkillPoints,
        };
      });
      setIsAnimating(false);
    }, 600);
  }, [state.isGameOver, isAnimating, state.playerATK, state.playerDEF, state.stage]);

  const resetGame = useCallback(() => {
    setState(prev => {
      const botStats = getBotStats(prev.stage);
      return {
        ...prev,
        playerHP: prev.playerMaxHP,
        botHP: botStats.maxHP,
        playerChoice: null,
        botChoice: null,
        roundResult: null,
        isGameOver: false,
        winner: null,
        logs: [`Stage ${prev.stage} - Battle Start!`, ...prev.logs].slice(0, 10),
      };
    });
  }, []);

  // Separate effect for Auto Fight Timer
  useEffect(() => {
    if (!state.isAutoFightEnabled) return;

    // Efficient Fighters logic
    const baseInterval = AUTO_FIGHT_STEPS[state.autoFightLevel].interval;
    const effectiveInterval = baseInterval * Math.pow(0.9, state.skills.efficientFighters);
    const msInterval = effectiveInterval * 1000;

    const timer = setInterval(() => {
      if (isAnimating) return;

      if (state.isGameOver) {
        resetGame();
      } else {
        const randomChoice = CHOICES[Math.floor(Math.random() * CHOICES.length)];
        handleChoice(randomChoice);
      }
    }, msInterval);

    return () => clearInterval(timer);
  }, [state.autoFightLevel, state.isAutoFightEnabled, state.isGameOver, state.skills.efficientFighters, isAnimating, handleChoice, resetGame]);

  const buyUpgrade = (type: 'HP' | 'ATK' | 'DEF') => {
    const costs = { HP: 10, ATK: 15, DEF: 15 };
    const cost = costs[type];

    if (state.playerGold < cost) {
      setState(prev => ({
        ...prev,
        logs: [`Not enough gold for ${type} upgrade!`, ...prev.logs].slice(0, 10)
      }));
      return;
    }

    setState(prev => {
      const newState = { ...prev, playerGold: prev.playerGold - cost };
      let logMsg = '';
      
      if (type === 'HP') {
        newState.playerMaxHP += 10;
        newState.playerHP += 10;
        logMsg = 'Purchased HP +10!';
      } else if (type === 'ATK') {
        newState.playerATK += 1;
        logMsg = 'Purchased ATK +1!';
      } else if (type === 'DEF') {
        newState.playerDEF += 1;
        logMsg = 'Purchased DEF +1!';
      }

      return {
        ...newState,
        logs: [logMsg, ...prev.logs].slice(0, 10)
      };
    });
  };

  const spendSkillPoint = (skill: keyof Skills | 'HP' | 'ATK' | 'DEF') => {
    if (state.skillPoints <= 0) return;
    
    setState(prev => {
      const newState = { ...prev, skillPoints: prev.skillPoints - 1 };
      let logMsg = '';

      if (skill === 'HP') {
        newState.playerMaxHP += 20;
        newState.playerHP += 20;
        logMsg = 'Used Skill Point: HP +20!';
      } else if (skill === 'ATK') {
        newState.playerATK += 2;
        logMsg = 'Used Skill Point: ATK +2!';
      } else if (skill === 'DEF') {
        newState.playerDEF += 2;
        logMsg = 'Used Skill Point: DEF +2!';
      } else {
        // Skill upgrade logic
        const currentLevel = prev.skills[skill];
        if (currentLevel >= 5) return prev; // Cap at 5

        newState.skills = {
          ...prev.skills,
          [skill]: currentLevel + 1
        };

        const skillNames: Record<keyof Skills, string> = {
          vipRush: 'VIP Rush',
          merchBooth: 'Merch Booth',
          luckyCharm: 'Lucky Charm',
          showtime: 'Showtime',
          efficientFighters: 'Efficient Fighters'
        };
        logMsg = `Upgraded ${skillNames[skill]} to Lv ${currentLevel + 1}!`;
      }

      return {
        ...newState,
        logs: [logMsg, ...prev.logs].slice(0, 10)
      };
    });
  };

  const buySeatsUpgrade = () => {
    const cost = 50 * (state.seatsLevel + 1);

    if (state.playerGold < cost) {
      setState(prev => ({
        ...prev,
        logs: [`Not enough gold for Spectator Seats upgrade!`, ...prev.logs].slice(0, 10)
      }));
      return;
    }

    setState(prev => ({
      ...prev,
      playerGold: prev.playerGold - cost,
      seatsLevel: prev.seatsLevel + 1,
      logs: [`Upgraded Spectator Seats to Lv ${prev.seatsLevel + 1}!`, ...prev.logs].slice(0, 10)
    }));
  };

  const buyAutoFightUpgrade = () => {
    if (state.autoFightLevel >= AUTO_FIGHT_STEPS.length - 1) return;
    
    const nextLevel = state.autoFightLevel + 1;
    const cost = AUTO_FIGHT_STEPS[nextLevel].cost;

    if (state.playerGold < cost) {
      setState(prev => ({
        ...prev,
        logs: [`Not enough gold for Idle Fighter upgrade!`, ...prev.logs].slice(0, 10)
      }));
      return;
    }

    setState(prev => ({
      ...prev,
      playerGold: prev.playerGold - cost,
      autoFightLevel: nextLevel,
      logs: [`Upgraded Idle Fighter! Speed: ${AUTO_FIGHT_STEPS[nextLevel].interval}s`, ...prev.logs].slice(0, 10)
    }));
  };

  const toggleAutoFight = () => {
    setState(prev => ({
      ...prev,
      isAutoFightEnabled: !prev.isAutoFightEnabled,
      logs: [`Auto Fight ${!prev.isAutoFightEnabled ? 'Enabled' : 'Disabled'}`, ...prev.logs].slice(0, 10)
    }));
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === 'googleaistudio') {
      setIsAdmin(true);
      setShowAdminLogin(false);
      setAdminPassword('');
      setState(prev => ({
        ...prev,
        logs: ['Admin Access Granted.', ...prev.logs].slice(0, 10)
      }));
    } else {
      setState(prev => ({
        ...prev,
        logs: ['Invalid Admin Password.', ...prev.logs].slice(0, 10)
      }));
      setAdminPassword('');
    }
  };

  const handleAdminCommand = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = adminCommand.trim().toLowerCase();
    
    if (cmd.startsWith('addgold ')) {
      const amountStr = cmd.replace('addgold ', '');
      const amount = parseInt(amountStr);
      
      if (!isNaN(amount)) {
        setState(prev => {
          const newGold = prev.playerGold + amount;
          return {
            ...prev,
            playerGold: newGold,
            logs: [
              `Added ${amount} gold`,
              `Current gold: ${newGold}`,
              ...prev.logs
            ].slice(0, 10)
          };
        });
        setAdminCommand('');
      } else {
        setState(prev => ({
          ...prev,
          logs: ['Invalid amount for addgold.', ...prev.logs].slice(0, 10)
        }));
      }
    } else if (cmd.startsWith('addexp ')) {
      const amountStr = cmd.replace('addexp ', '');
      const amount = parseInt(amountStr);
      
      if (!isNaN(amount)) {
        setState(prev => {
          let newExp = prev.exp + amount;
          let newLevel = prev.level;
          let newSkillPoints = prev.skillPoints;
          let newExpToNext = prev.expToNext;
          let logMsgs = [`Added ${amount} exp`];

          while (newExp >= newExpToNext) {
            newExp -= newExpToNext;
            newLevel += 1;
            newSkillPoints += 1;
            newExpToNext = 50 + (newLevel - 1) * 25;
            logMsgs.push(`LEVEL UP! Reached Level ${newLevel}`);
          }

          return {
            ...prev,
            exp: newExp,
            level: newLevel,
            skillPoints: newSkillPoints,
            expToNext: newExpToNext,
            logs: [...logMsgs.reverse(), ...prev.logs].slice(0, 10)
          };
        });
        setAdminCommand('');
      } else {
        setState(prev => ({
          ...prev,
          logs: ['Invalid amount for addexp.', ...prev.logs].slice(0, 10)
        }));
      }
    } else if (cmd.startsWith('addlevel ')) {
      const amountStr = cmd.replace('addlevel ', '');
      const amount = parseInt(amountStr);
      
      if (!isNaN(amount) && amount > 0) {
        setState(prev => {
          const newLevel = prev.level + amount;
          const newSkillPoints = prev.skillPoints + amount;
          const newExpToNext = 50 + (newLevel - 1) * 25;
          
          return {
            ...prev,
            level: newLevel,
            skillPoints: newSkillPoints,
            expToNext: newExpToNext,
            logs: [
              `Added ${amount} level`,
              `Current level: ${newLevel}`,
              ...prev.logs
            ].slice(0, 10)
          };
        });
        setAdminCommand('');
      } else {
        setState(prev => ({
          ...prev,
          logs: ['Invalid amount for addlevel.', ...prev.logs].slice(0, 10)
        }));
      }
    } else {
      setState(prev => ({
        ...prev,
        logs: [`Unknown command: ${cmd}`, ...prev.logs].slice(0, 10)
      }));
    }
  };

  const changeStage = (newStage: number) => {
    if (newStage < 1 || isAnimating) return;
    setState(prev => {
      const botStats = getBotStats(newStage);
      return {
        ...prev,
        stage: newStage,
        playerHP: prev.playerMaxHP,
        botHP: botStats.maxHP,
        playerChoice: null,
        botChoice: null,
        roundResult: null,
        isGameOver: false,
        winner: null,
        logs: [`Stage ${newStage} Selected - Battle Start!`, ...prev.logs].slice(0, 10),
      };
    });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-mono p-4 md:p-8 flex flex-col items-center justify-center">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Header Section */}
        <div className="col-span-1 md:col-span-2 flex justify-between items-end border-b-2 border-white/20 pb-4 mb-4">
          <div className="flex items-end gap-4">
            <div>
              <h1 className="text-4xl font-black tracking-tighter uppercase italic leading-none">RPS BATTLE</h1>
              <p className="text-[10px] text-white/50 tracking-widest mt-1">1v1 RANDOMIZED BOT COMBAT</p>
            </div>
            <div className="bg-white/10 px-3 py-1 rounded-lg border border-white/10 mb-1 flex items-center gap-3">
              <div>
                <span className="text-[10px] text-white/40 uppercase font-bold block leading-none">Level</span>
                <span className="text-xl font-black text-blue-400 leading-none">{state.level}</span>
              </div>
            </div>
            <div className="bg-white/10 px-3 py-1 rounded-lg border border-white/10 mb-1 flex items-center gap-3">
              <div>
                <span className="text-[10px] text-white/40 uppercase font-bold block leading-none">Current</span>
                <span className="text-xl font-black text-emerald-400 leading-none">STAGE {state.stage}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <button 
                  onClick={() => changeStage(state.stage + 1)}
                  className="p-0.5 hover:bg-white/20 rounded bg-white/5 transition-colors disabled:opacity-20"
                  disabled={isAnimating}
                  title="Next Stage"
                >
                  <ChevronUp size={12} />
                </button>
                <button 
                  onClick={() => changeStage(state.stage - 1)}
                  className="p-0.5 hover:bg-white/20 rounded bg-white/5 transition-colors disabled:opacity-20"
                  disabled={isAnimating || state.stage <= 1}
                  title="Previous Stage"
                >
                  <ChevronDown size={12} />
                </button>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Total Gold</div>
              <div className="text-2xl font-black text-yellow-500 flex items-center gap-2 justify-end">
                <div className="w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center text-[10px] text-black font-black">G</div>
                {state.playerGold}
              </div>
            </div>
            <button 
              onClick={resetGame}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
              title="Reset Game"
            >
              <RotateCcw size={24} />
            </button>
          </div>
        </div>

        {/* Player Side */}
        <div className="space-y-6">
          <div className="flex justify-between items-end">
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <span className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
                PLAYER
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-blue-400 uppercase">Lv.{state.level}</span>
                <div className="w-32 h-1.5 bg-white/10 rounded-full overflow-hidden border border-white/10">
                  <motion.div 
                    className="h-full bg-blue-500"
                    animate={{ width: `${(state.exp / state.expToNext) * 100}%` }}
                  />
                </div>
                <span className="text-[8px] text-white/30">{state.exp}/{state.expToNext}</span>
              </div>
            </div>
            <div className="text-right">
              {state.skillPoints > 0 && (
                <div className="text-[10px] text-blue-400 font-bold animate-bounce mb-1">
                  +{state.skillPoints} SKILL POINTS
                </div>
              )}
              <div className="text-xs text-white/50 uppercase">Health</div>
              <div className="text-2xl font-black">{state.playerHP} / {state.playerMaxHP}</div>
            </div>
          </div>
          
          <div className="h-4 bg-white/10 rounded-full overflow-hidden border border-white/20">
            <motion.div 
              className="h-full bg-emerald-500"
              initial={{ width: '100%' }}
              animate={{ width: `${(state.playerHP / state.playerMaxHP) * 100}%` }}
              transition={{ type: 'spring', stiffness: 50 }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs text-white/40">
            <div className="flex items-center gap-2 border border-white/10 p-2 rounded">
              <Swords size={14} /> ATK: {state.playerATK}
            </div>
            <div className="flex items-center gap-2 border border-white/10 p-2 rounded">
              <Shield size={14} /> DEF: {state.playerDEF}
            </div>
          </div>

          <div className="aspect-square bg-white/5 border-2 border-dashed border-white/10 rounded-2xl flex items-center justify-center relative overflow-hidden">
            <AnimatePresence mode="wait">
              {state.playerChoice ? (
                <motion.div
                  key={state.playerChoice}
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="text-emerald-400"
                >
                  <ChoiceIcon choice={state.playerChoice} className="w-32 h-32" />
                </motion.div>
              ) : (
                <div className="text-white/20 uppercase tracking-widest text-sm">Waiting...</div>
              )}
            </AnimatePresence>
            {state.roundResult === 'LOSE' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0] }}
                className="absolute inset-0 bg-red-500/20 pointer-events-none"
              />
            )}
          </div>
        </div>

        {/* Bot Side */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="text-left">
              <div className="text-xs text-white/50 uppercase">Health</div>
              <div className="text-2xl font-black">{state.botHP} / {getBotStats(state.stage).maxHP}</div>
            </div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              BOT
              <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            </h2>
          </div>
          
          <div className="h-4 bg-white/10 rounded-full overflow-hidden border border-white/20">
            <motion.div 
              className="h-full bg-red-500"
              initial={{ width: '100%' }}
              animate={{ width: `${(state.botHP / getBotStats(state.stage).maxHP) * 100}%` }}
              transition={{ type: 'spring', stiffness: 50 }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs text-white/40">
            <div className="flex items-center gap-2 border border-white/10 p-2 rounded">
              <Swords size={14} /> ATK: {getBotStats(state.stage).atk}
            </div>
            <div className="flex items-center gap-2 border border-white/10 p-2 rounded">
              <Shield size={14} /> DEF: {getBotStats(state.stage).def}
            </div>
          </div>

          <div className="aspect-square bg-white/5 border-2 border-dashed border-white/10 rounded-2xl flex items-center justify-center relative overflow-hidden">
            <AnimatePresence mode="wait">
              {state.botChoice ? (
                <motion.div
                  key={state.botChoice}
                  initial={{ scale: 0, rotate: 20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="text-red-400"
                >
                  <ChoiceIcon choice={state.botChoice} className="w-32 h-32" />
                </motion.div>
              ) : (
                <div className="text-white/20 uppercase tracking-widest text-sm">Thinking...</div>
              )}
            </AnimatePresence>
            {state.roundResult === 'WIN' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0] }}
                className="absolute inset-0 bg-emerald-500/20 pointer-events-none"
              />
            )}
          </div>
        </div>

        {/* Controls Section */}
        <div className="col-span-1 md:col-span-2 bg-white/5 border border-white/10 p-6 rounded-3xl">
          {!state.isGameOver ? (
            <div className="flex flex-col md:flex-row items-center justify-around gap-8">
              {/* RPS Selection */}
              <div className="flex flex-col items-center gap-6">
                <div className="text-sm uppercase tracking-[0.3em] font-bold text-white/40">
                  {state.isAutoFightEnabled ? 'Auto-Fighting...' : 'Select Action'}
                </div>
                <div className="flex gap-4">
                  {CHOICES.map((choice) => (
                    <button
                      key={choice}
                      onClick={() => handleChoice(choice)}
                      disabled={isAnimating || state.isAutoFightEnabled}
                      className={`
                        group relative w-16 h-16 md:w-20 md:h-20 rounded-2xl border-2 transition-all duration-300 flex items-center justify-center
                        ${(isAnimating || state.isAutoFightEnabled) ? 'opacity-30 cursor-not-allowed' : 'hover:scale-110 active:scale-95'}
                        ${state.playerChoice === choice ? 'border-emerald-500 bg-emerald-500/10' : 'border-white/20 hover:border-white/50'}
                      `}
                    >
                      <ChoiceIcon choice={choice} className="w-8 h-8 md:w-10 md:h-10" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Shop Section */}
              <div className="flex flex-col items-center gap-4 border-l border-white/10 pl-8">
                <div className="text-sm uppercase tracking-[0.3em] font-bold text-white/40">Upgrade Shop</div>
                <div className="flex flex-wrap justify-center gap-3">
                  <button
                    onClick={() => buyUpgrade('HP')}
                    disabled={state.playerGold < 10}
                    className="flex flex-col items-center gap-1 p-2 border border-white/10 rounded-xl hover:bg-white/5 transition-colors disabled:opacity-30"
                  >
                    <Heart size={20} className="text-red-500" />
                    <span className="text-[10px] font-bold">+10 HP</span>
                    <span className="text-[9px] text-yellow-500">10G</span>
                  </button>
                  <button
                    onClick={() => buyUpgrade('ATK')}
                    disabled={state.playerGold < 15}
                    className="flex flex-col items-center gap-1 p-2 border border-white/10 rounded-xl hover:bg-white/5 transition-colors disabled:opacity-30"
                  >
                    <Swords size={20} className="text-emerald-500" />
                    <span className="text-[10px] font-bold">+1 ATK</span>
                    <span className="text-[9px] text-yellow-500">15G</span>
                  </button>
                  <button
                    onClick={() => buyUpgrade('DEF')}
                    disabled={state.playerGold < 15}
                    className="flex flex-col items-center gap-1 p-2 border border-white/10 rounded-xl hover:bg-white/5 transition-colors disabled:opacity-30"
                  >
                    <Shield size={20} className="text-blue-500" />
                    <span className="text-[10px] font-bold">+1 DEF</span>
                    <span className="text-[9px] text-yellow-500">15G</span>
                  </button>
                  <button
                    onClick={buySeatsUpgrade}
                    disabled={state.playerGold < 50 * (state.seatsLevel + 1)}
                    className="flex flex-col items-center gap-1 p-2 border border-white/10 rounded-xl hover:bg-white/5 transition-colors disabled:opacity-30"
                  >
                    <Users size={20} className="text-purple-500" />
                    <span className="text-[10px] font-bold">Seats Lv {state.seatsLevel + 1}</span>
                    <span className="text-[9px] text-yellow-500">{50 * (state.seatsLevel + 1)}G</span>
                  </button>
                  <button
                    onClick={buyAutoFightUpgrade}
                    disabled={state.autoFightLevel >= AUTO_FIGHT_STEPS.length - 1 || state.playerGold < AUTO_FIGHT_STEPS[state.autoFightLevel + 1]?.cost}
                    className="flex flex-col items-center gap-1 p-2 border border-white/10 rounded-xl hover:bg-white/5 transition-colors disabled:opacity-30"
                  >
                    <Zap size={20} className="text-yellow-400" />
                    <span className="text-[10px] font-bold">
                      {state.autoFightLevel >= AUTO_FIGHT_STEPS.length - 1 ? 'MAX Speed' : `Fighter Lv ${state.autoFightLevel + 1}`}
                    </span>
                    <span className="text-[9px] text-yellow-500">
                      {state.autoFightLevel >= AUTO_FIGHT_STEPS.length - 1 ? '---' : `${AUTO_FIGHT_STEPS[state.autoFightLevel + 1].cost}G`}
                    </span>
                  </button>
                </div>
                <div className="flex flex-col gap-1 mt-2">
                  {state.seatsLevel > 0 && (
                    <div className="text-[9px] text-white/30 uppercase tracking-tighter">
                      Seats: {state.seatsLevel * 20} | +{(state.seatsLevel * 20 * 0.1).toFixed(1)}G / 10s
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <div className="text-[9px] text-white/30 uppercase tracking-tighter">
                      Auto Fight: {(AUTO_FIGHT_STEPS[state.autoFightLevel].interval * Math.pow(0.9, state.skills.efficientFighters)).toFixed(2)}s
                    </div>
                    <button 
                      onClick={toggleAutoFight}
                      className={`text-[8px] px-1.5 py-0.5 rounded border font-bold uppercase transition-colors ${state.isAutoFightEnabled ? 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10' : 'border-white/10 text-white/30'}`}
                    >
                      {state.isAutoFightEnabled ? 'ON' : 'OFF'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Skill Tree Section */}
              <div className="flex flex-col items-center gap-4 border-l border-white/10 pl-8">
                <div className="text-sm uppercase tracking-[0.3em] font-bold text-blue-400">Skill Tree</div>
                <div className="flex flex-wrap justify-center gap-3">
                  <div className="w-full text-center text-[10px] font-black text-blue-400/60 uppercase mb-1">
                    {state.skillPoints} POINTS AVAILABLE
                  </div>
                  
                  {/* Main Skills */}
                  <button
                    onClick={() => spendSkillPoint('vipRush')}
                    disabled={state.skillPoints <= 0 || state.skills.vipRush >= 5}
                    className={`flex flex-col items-center gap-1 p-2 border rounded-xl transition-all duration-300 ${state.skills.vipRush >= 5 ? 'border-blue-500/50 bg-blue-500/10' : 'border-blue-500/20 hover:bg-blue-500/10'} ${state.skillPoints <= 0 && state.skills.vipRush < 5 ? 'opacity-30' : ''}`}
                    title="VIP Rush: +10% Seats Income per level"
                  >
                    <Store size={20} className="text-blue-400" />
                    <span className="text-[10px] font-bold text-blue-300">VIP Rush</span>
                    <span className="text-[9px] text-blue-500/50">Lv {state.skills.vipRush}/5</span>
                  </button>
                  <button
                    onClick={() => spendSkillPoint('merchBooth')}
                    disabled={state.skillPoints <= 0 || state.skills.merchBooth >= 5}
                    className={`flex flex-col items-center gap-1 p-2 border rounded-xl transition-all duration-300 ${state.skills.merchBooth >= 5 ? 'border-blue-500/50 bg-blue-500/10' : 'border-blue-500/20 hover:bg-blue-500/10'} ${state.skillPoints <= 0 && state.skills.merchBooth < 5 ? 'opacity-30' : ''}`}
                    title="Merch Booth: 3% chance for +50% bonus income"
                  >
                    <Ticket size={20} className="text-blue-400" />
                    <span className="text-[10px] font-bold text-blue-300">Merch Booth</span>
                    <span className="text-[9px] text-blue-500/50">Lv {state.skills.merchBooth}/5</span>
                  </button>
                  <button
                    onClick={() => spendSkillPoint('luckyCharm')}
                    disabled={state.skillPoints <= 0 || state.skills.luckyCharm >= 5}
                    className={`flex flex-col items-center gap-1 p-2 border rounded-xl transition-all duration-300 ${state.skills.luckyCharm >= 5 ? 'border-blue-500/50 bg-blue-500/10' : 'border-blue-500/20 hover:bg-blue-500/10'} ${state.skillPoints <= 0 && state.skills.luckyCharm < 5 ? 'opacity-30' : ''}`}
                    title="Lucky Charm: 3% chance to negate damage on loss"
                  >
                    <Clover size={20} className="text-blue-400" />
                    <span className="text-[10px] font-bold text-blue-300">Lucky Charm</span>
                    <span className="text-[9px] text-blue-500/50">Lv {state.skills.luckyCharm}/5</span>
                  </button>
                  <button
                    onClick={() => spendSkillPoint('showtime')}
                    disabled={state.skillPoints <= 0 || state.skills.showtime >= 5}
                    className={`flex flex-col items-center gap-1 p-2 border rounded-xl transition-all duration-300 ${state.skills.showtime >= 5 ? 'border-blue-500/50 bg-blue-500/10' : 'border-blue-500/20 hover:bg-blue-500/10'} ${state.skillPoints <= 0 && state.skills.showtime < 5 ? 'opacity-30' : ''}`}
                    title="Showtime: +10% Battle Rewards per level"
                  >
                    <Tv size={20} className="text-blue-400" />
                    <span className="text-[10px] font-bold text-blue-300">Showtime</span>
                    <span className="text-[9px] text-blue-500/50">Lv {state.skills.showtime}/5</span>
                  </button>
                  <button
                    onClick={() => spendSkillPoint('efficientFighters')}
                    disabled={state.skillPoints <= 0 || state.skills.efficientFighters >= 5}
                    className={`flex flex-col items-center gap-1 p-2 border rounded-xl transition-all duration-300 ${state.skills.efficientFighters >= 5 ? 'border-blue-500/50 bg-blue-500/10' : 'border-blue-500/20 hover:bg-blue-500/10'} ${state.skillPoints <= 0 && state.skills.efficientFighters < 5 ? 'opacity-30' : ''}`}
                    title="Efficient Fighters: Reduces Auto Fight interval"
                  >
                    <Timer size={20} className="text-blue-400" />
                    <span className="text-[10px] font-bold text-blue-300">Efficient</span>
                    <span className="text-[9px] text-blue-500/50">Lv {state.skills.efficientFighters}/5</span>
                  </button>

                  {/* Stat Upgrades - Only if all skills are maxed */}
                  {(Object.values(state.skills) as number[]).every(lv => lv >= 5) && (
                    <>
                      <div className="w-full border-t border-blue-500/20 my-1" />
                      <button
                        onClick={() => spendSkillPoint('HP')}
                        disabled={state.skillPoints <= 0}
                        className="flex flex-col items-center gap-1 p-2 border border-blue-500/20 rounded-xl hover:bg-blue-500/10 transition-colors disabled:opacity-30"
                      >
                        <Heart size={20} className="text-blue-400" />
                        <span className="text-[10px] font-bold text-blue-300">+20 HP</span>
                        <span className="text-[9px] text-blue-500/50">1 PT</span>
                      </button>
                      <button
                        onClick={() => spendSkillPoint('ATK')}
                        disabled={state.skillPoints <= 0}
                        className="flex flex-col items-center gap-1 p-2 border border-blue-500/20 rounded-xl hover:bg-blue-500/10 transition-colors disabled:opacity-30"
                      >
                        <Swords size={20} className="text-blue-400" />
                        <span className="text-[10px] font-bold text-blue-300">+2 ATK</span>
                        <span className="text-[9px] text-blue-500/50">1 PT</span>
                      </button>
                      <button
                        onClick={() => spendSkillPoint('DEF')}
                        disabled={state.skillPoints <= 0}
                        className="flex flex-col items-center gap-1 p-2 border border-blue-500/20 rounded-xl hover:bg-blue-500/10 transition-colors disabled:opacity-30"
                      >
                        <Shield size={20} className="text-blue-400" />
                        <span className="text-[10px] font-bold text-blue-300">+2 DEF</span>
                        <span className="text-[9px] text-blue-500/50">1 PT</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 py-4">
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`text-4xl font-black uppercase italic ${state.winner === 'PLAYER' ? 'text-emerald-500' : 'text-red-500'}`}
              >
                {state.winner === 'PLAYER' ? 'Victory' : 'Defeat'}
              </motion.div>
              <button
                onClick={resetGame}
                className="px-8 py-3 bg-white text-black font-black uppercase tracking-widest rounded-full hover:bg-emerald-500 hover:text-white transition-colors"
              >
                Play Again
              </button>
            </div>
          )}
        </div>

        {/* Battle Log */}
        <div className="col-span-1 md:col-span-2 bg-black border border-white/10 p-4 rounded-xl h-48 overflow-y-auto">
          <div className="text-[10px] text-white/30 uppercase tracking-widest mb-2 sticky top-0 bg-black pb-1 border-b border-white/5">Battle Log</div>
          <div className="space-y-1">
            {state.logs.map((log, i) => (
              <motion.div 
                key={i}
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className={`text-xs ${i === 0 ? 'text-white font-bold' : 'text-white/40'}`}
              >
                {`> ${log}`}
              </motion.div>
            ))}
          </div>
        </div>

      </div>

      {/* Footer Meta */}
      <div className="mt-8 text-[10px] text-white/20 uppercase tracking-[0.5em] flex items-center gap-4">
        <span>System Active</span>
        <span className="w-1 h-1 bg-white/20 rounded-full" />
        <span>V.1.0.0</span>
        <span className="w-1 h-1 bg-white/20 rounded-full" />
        <button 
          onClick={() => isAdmin ? setIsAdmin(false) : setShowAdminLogin(true)}
          className="hover:text-white transition-colors flex items-center gap-1"
        >
          <Terminal size={10} />
          {isAdmin ? 'Logout Admin' : 'Admin'}
        </button>
      </div>

      {/* Admin Login Modal */}
      <AnimatePresence>
        {showAdminLogin && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#1a1a1a] border border-white/10 p-8 rounded-3xl max-w-sm w-full relative"
            >
              <button 
                onClick={() => setShowAdminLogin(false)}
                className="absolute top-4 right-4 text-white/40 hover:text-white"
              >
                <X size={20} />
              </button>
              <h3 className="text-xl font-black uppercase italic mb-6 flex items-center gap-2">
                <Terminal className="text-emerald-500" />
                Admin Access
              </h3>
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div>
                  <label className="text-[10px] text-white/40 uppercase font-bold block mb-2">Password</label>
                  <input 
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    autoFocus
                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    placeholder="Enter password..."
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full bg-emerald-500 text-black font-black uppercase py-3 rounded-xl hover:bg-emerald-400 transition-colors"
                >
                  Unlock Console
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Admin Console Overlay */}
      <AnimatePresence>
        {isAdmin && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 bg-black border-t border-emerald-500/30 p-4 z-40"
          >
            <div className="max-w-4xl mx-auto flex items-center gap-4">
              <div className="flex items-center gap-2 text-emerald-500 font-bold text-xs shrink-0">
                <Terminal size={14} />
                ADMIN@ARENA:~$
              </div>
              <form onSubmit={handleAdminCommand} className="flex-1">
                <input 
                  type="text"
                  value={adminCommand}
                  onChange={(e) => setAdminCommand(e.target.value)}
                  placeholder="Type command (e.g. addgold 1000)..."
                  className="w-full bg-transparent border-none text-emerald-400 font-mono text-sm focus:outline-none"
                  autoFocus
                />
              </form>
              <button 
                onClick={() => setIsAdmin(false)}
                className="text-[10px] text-white/20 hover:text-red-500 uppercase font-bold transition-colors"
              >
                Exit
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
