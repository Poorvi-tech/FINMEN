import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import GameShell from "../../Finance/GameShell";
import useGameFeedback from "../../../../hooks/useGameFeedback";

const PuzzleOfTrust = () => {
  const navigate = useNavigate();
  const [connections, setConnections] = useState([]);
  const [selectedStart, setSelectedStart] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [coins, setCoins] = useState(0);
  const { flashPoints, showAnswerConfetti, showCorrectAnswerFeedback } = useGameFeedback();

  const startItems = [
    { id: 1, text: "Truth", emoji: "✨" },
    { id: 2, text: "Lie", emoji: "🤥" }
  ];

  const endItems = [
    { id: 1, text: "Trust", emoji: "🤝" },
    { id: 2, text: "Trouble", emoji: "⚠️" }
  ];

  const correctPairs = [
    { start: 1, end: 1 },  // Truth = Trust
    { start: 2, end: 2 }   // Lie = Trouble
  ];

  const handleStartClick = (startId) => {
    setSelectedStart(startId);
  };

  const handleEndClick = (endId) => {
    if (!selectedStart) return;
    
    if (connections.find(c => c.start === selectedStart || c.end === endId)) {
      return;
    }
    
    const newConnections = [...connections, { start: selectedStart, end: endId }];
    setConnections(newConnections);
    setSelectedStart(null);
    
    if (newConnections.length === 2) {
      const allCorrect = newConnections.every(conn => 
        correctPairs.some(pair => pair.start === conn.start && pair.end === conn.end)
      );
      
      if (allCorrect) {
        showCorrectAnswerFeedback(5, true);
        setCoins(5);
      }
      setShowResult(true);
    }
  };

  const handleTryAgain = () => {
    setConnections([]);
    setSelectedStart(null);
    setShowResult(false);
    setCoins(0);
  };

  const handleNext = () => {
    navigate("/student/moral-values/kids/cheating-story");
  };

  const isConnected = (id, type) => {
    return connections.some(c => type === 'start' ? c.start === id : c.end === id);
  };

  return (
    <GameShell
      title="Puzzle of Trust"
      subtitle="Match Values to Outcomes"
      onNext={handleNext}
      nextEnabled={showResult && coins > 0}
      showGameOver={showResult && coins > 0}
      score={coins}
      gameId="moral-kids-4"
      gameType="educational"
      totalLevels={20}
      currentLevel={4}
      showConfetti={showResult && coins > 0}
      flashPoints={flashPoints}
      showAnswerConfetti={showAnswerConfetti}
      backPath="/games/moral-values/kids"
    >
      <div className="space-y-8">
        {!showResult ? (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
            <h3 className="text-white text-xl font-bold mb-4 text-center">
              Connect each action to its outcome
            </h3>
            <p className="text-white/70 text-sm mb-6 text-center">
              Click an action, then click its matching outcome
            </p>
            
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-3">
                <h4 className="text-white font-bold text-center mb-3">Actions</h4>
                {startItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleStartClick(item.id)}
                    disabled={isConnected(item.id, 'start')}
                    className={`w-full border-2 rounded-xl p-6 transition-all ${
                      isConnected(item.id, 'start')
                        ? 'bg-green-500/30 border-green-400'
                        : selectedStart === item.id
                        ? 'bg-purple-500/50 border-purple-400 ring-2 ring-white'
                        : 'bg-white/20 border-white/40 hover:bg-white/30'
                    }`}
                  >
                    <div className="text-5xl mb-2">{item.emoji}</div>
                    <div className="text-white font-semibold text-lg">{item.text}</div>
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                <h4 className="text-white font-bold text-center mb-3">Outcomes</h4>
                {endItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleEndClick(item.id)}
                    disabled={isConnected(item.id, 'end')}
                    className={`w-full border-2 rounded-xl p-6 transition-all ${
                      isConnected(item.id, 'end')
                        ? 'bg-green-500/30 border-green-400'
                        : 'bg-white/20 border-white/40 hover:bg-white/30'
                    }`}
                  >
                    <div className="text-5xl mb-2">{item.emoji}</div>
                    <div className="text-white font-semibold text-lg">{item.text}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 bg-blue-500/20 rounded-lg p-3">
              <p className="text-white/80 text-sm text-center">
                Connections: {connections.length}/2
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
            <h2 className="text-3xl font-bold text-white mb-4 text-center">
              {coins > 0 ? "🎉 Perfect Connections!" : "Not Quite Right"}
            </h2>
            
            {coins > 0 ? (
              <>
                <div className="bg-green-500/20 rounded-lg p-4 mb-4">
                  <p className="text-white text-center">
                    Excellent! Truth leads to trust, and lies lead to trouble. When we tell the truth, 
                    people trust us. When we lie, we get into trouble and lose trust!
                  </p>
                </div>
                <p className="text-yellow-400 text-2xl font-bold text-center">
                  You earned 5 Coins! 🪙
                </p>
              </>
            ) : (
              <>
                <div className="bg-red-500/20 rounded-lg p-4 mb-4">
                  <p className="text-white text-center">
                    Remember: Truth → Trust, and Lie → Trouble. Let's try again!
                  </p>
                </div>
                <button
                  onClick={handleTryAgain}
                  className="mt-4 w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-full font-semibold hover:opacity-90 transition"
                >
                  Try Again
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </GameShell>
  );
};

export default PuzzleOfTrust;
