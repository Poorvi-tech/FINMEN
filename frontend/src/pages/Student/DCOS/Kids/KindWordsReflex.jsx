import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import GameShell from "../../Finance/GameShell";
import useGameFeedback from "../../../../hooks/useGameFeedback";

const KindWordsReflex = () => {
  const navigate = useNavigate();
  const [gameStarted, setGameStarted] = useState(false);
  const [currentWord, setCurrentWord] = useState(0);
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [timeLeft, setTimeLeft] = useState(2);
  const [autoAdvance, setAutoAdvance] = useState(false);
  const { flashPoints, showAnswerConfetti, showCorrectAnswerFeedback, resetFeedback } = useGameFeedback();

  const words = [
    { id: 1, text: "Friend", emoji: "🤝", isKind: true },
    { id: 2, text: "Stupid", emoji: "😠", isKind: false },
    { id: 3, text: "Respect", emoji: "🙏", isKind: true },
    { id: 4, text: "Loser", emoji: "👎", isKind: false },
    { id: 5, text: "Helpful", emoji: "🤗", isKind: true },
    { id: 6, text: "Mean", emoji: "😡", isKind: false },
    { id: 7, text: "Caring", emoji: "💖", isKind: true },
    { id: 8, text: "Ugly", emoji: "😢", isKind: false },
    { id: 9, text: "Kindness", emoji: "✨", isKind: true },
    { id: 10, text: "Bully", emoji: "😈", isKind: false },
    { id: 11, text: "Share", emoji: "🎁", isKind: true },
    { id: 12, text: "Hate", emoji: "💔", isKind: false },
    { id: 13, text: "Love", emoji: "❤️", isKind: true },
    { id: 14, text: "Dumb", emoji: "🙄", isKind: false },
    { id: 15, text: "Support", emoji: "🤲", isKind: true }
  ];

  useEffect(() => {
    if (gameStarted && !showResult && !autoAdvance) {
      if (timeLeft > 0) {
        const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        // Time's up, move to next word
        setAutoAdvance(true);
        setTimeout(() => {
          if (currentWord < words.length - 1) {
            setCurrentWord(prev => prev + 1);
            setTimeLeft(2);
            setAutoAdvance(false);
          } else {
            const accuracy = (score / words.length) * 100;
            if (accuracy >= 70) {
              setCoins(3);
            }
            setShowResult(true);
          }
        }, 500);
      }
    }
  }, [timeLeft, gameStarted, showResult, currentWord, autoAdvance]);

  const currentWordData = words[currentWord];

  const handleChoice = (isKind) => {
    const isCorrect = currentWordData.isKind === isKind;
    
    if (isCorrect) {
      setScore(prev => prev + 1);
      showCorrectAnswerFeedback(1, false);
    }
    
    setAutoAdvance(true);
    setTimeout(() => {
      if (currentWord < words.length - 1) {
        setCurrentWord(prev => prev + 1);
        setTimeLeft(2);
        setAutoAdvance(false);
      } else {
        const finalScore = score + (isCorrect ? 1 : 0);
        const accuracy = (finalScore / words.length) * 100;
        if (accuracy >= 70) {
          setCoins(3);
        }
        setScore(finalScore);
        setShowResult(true);
      }
    }, 300);
  };

  const handleTryAgain = () => {
    setShowResult(false);
    setGameStarted(false);
    setCurrentWord(0);
    setScore(0);
    setCoins(0);
    setTimeLeft(2);
    setAutoAdvance(false);
    resetFeedback();
  };

  const handleNext = () => {
    navigate("/student/dcos/kids/smile-story");
  };

  const accuracy = Math.round((score / words.length) * 100);

  return (
    <GameShell
      title="Kind Words Reflex"
      subtitle={gameStarted ? `Word ${currentWord + 1} of ${words.length}` : "Quick Tapping Game"}
      onNext={handleNext}
      nextEnabled={showResult && accuracy >= 70}
      showGameOver={showResult && accuracy >= 70}
      score={coins}
      gameId="dcos-kids-12"
      gameType="educational"
      totalLevels={20}
      currentLevel={12}
      showConfetti={showResult && accuracy >= 70}
      flashPoints={flashPoints}
      showAnswerConfetti={showAnswerConfetti}
      backPath="/games/digital-citizenship/kids"
    >
      <div className="space-y-8">
        {!gameStarted ? (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Quick! Tap Kind Words!</h2>
            <p className="text-white/80 mb-6">Tap "Kind" for positive words, "Rude" for negative words!</p>
            <button
              onClick={() => setGameStarted(true)}
              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-4 rounded-full font-bold text-xl hover:opacity-90 transition transform hover:scale-105"
            >
              Start Game! 🚀
            </button>
          </div>
        ) : !showResult ? (
          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
              <div className="flex justify-between items-center mb-6">
                <span className="text-white/80">Word {currentWord + 1}/{words.length}</span>
                <span className="text-yellow-400 font-bold">Score: {score}</span>
              </div>
              
              <div className="bg-purple-500/20 rounded-lg p-3 mb-6 text-center">
                <div className="text-white text-lg font-bold">Time: {timeLeft}s</div>
              </div>
              
              <div className="text-8xl mb-4 text-center animate-pulse">{currentWordData.emoji}</div>
              <h2 className="text-white text-4xl font-bold text-center mb-8">{currentWordData.text}</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleChoice(true)}
                  disabled={autoAdvance}
                  className="bg-green-500/30 hover:bg-green-500/50 border-3 border-green-400 rounded-xl p-8 transition-all transform hover:scale-105 disabled:opacity-50"
                >
                  <div className="text-white font-bold text-2xl">Kind 💚</div>
                </button>
                <button
                  onClick={() => handleChoice(false)}
                  disabled={autoAdvance}
                  className="bg-red-500/30 hover:bg-red-500/50 border-3 border-red-400 rounded-xl p-8 transition-all transform hover:scale-105 disabled:opacity-50"
                >
                  <div className="text-white font-bold text-2xl">Rude 💔</div>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
            <h2 className="text-3xl font-bold text-white mb-4">
              {accuracy >= 70 ? "🎉 Kindness Expert!" : "💪 Keep Practicing!"}
            </h2>
            <p className="text-white/90 text-xl mb-4">
              You got {score} out of {words.length} correct ({accuracy}%)
            </p>
            <div className="bg-blue-500/20 rounded-lg p-4 mb-4">
              <p className="text-white/90 text-sm">
                💡 Always use kind words online and in person. Words can hurt or heal!
              </p>
            </div>
            <p className="text-yellow-400 text-2xl font-bold mb-6">
              {accuracy >= 70 ? "You earned 3 Coins! 🪙" : "Get 70% or higher to earn coins!"}
            </p>
            {accuracy < 70 && (
              <button
                onClick={handleTryAgain}
                className="mt-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-full font-semibold hover:opacity-90 transition"
              >
                Try Again
              </button>
            )}
          </div>
        )}
      </div>
    </GameShell>
  );
};

export default KindWordsReflex;

