import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import GameShell from "../../Finance/GameShell";
import useGameFeedback from "../../../../hooks/useGameFeedback";

const PuzzleInclusionActs = () => {
  const navigate = useNavigate();
  const [matches, setMatches] = useState({});
  const [showFeedback, setShowFeedback] = useState(false);
  const [coins, setCoins] = useState(0);
  const { flashPoints, showAnswerConfetti, showCorrectAnswerFeedback, resetFeedback } = useGameFeedback();

  const pairs = [
    { id: 1, left: "Invite", right: "New Student", emoji: "📨" },
    { id: 2, left: "Listen", right: "Everyone", emoji: "👂" },
    { id: 3, left: "Share", right: "Team", emoji: "🤝" }
  ];

  const rights = ["New Student", "Everyone", "Team"];

  const handleMatch = (leftId, rightValue) => {
    setMatches(prev => ({ ...prev, [leftId]: rightValue }));
  };

  const handleSubmit = () => {
    const correct = pairs.every(pair => matches[pair.id] === pair.right);
    
    if (correct) {
      showCorrectAnswerFeedback(5, true);
      setCoins(5);
    }
    
    setShowFeedback(true);
  };

  const handleTryAgain = () => {
    setMatches({});
    setShowFeedback(false);
    setCoins(0);
    resetFeedback();
  };

  const handleNext = () => {
    navigate("/student/civic-responsibility/teen/religion-story");
  };

  const isCorrect = pairs.every(pair => matches[pair.id] === pair.right);

  return (
    <GameShell
      title="Puzzle: Inclusion Acts"
      subtitle="Match Inclusive Actions"
      onNext={handleNext}
      nextEnabled={showFeedback && coins > 0}
      showGameOver={showFeedback && coins > 0}
      score={coins}
      gameId="crgc-teen-14"
      gameType="crgc"
      totalLevels={20}
      currentLevel={14}
      showConfetti={showFeedback && coins > 0}
      flashPoints={flashPoints}
      showAnswerConfetti={showAnswerConfetti}
      backPath="/games/civic-responsibility/teens"
    >
      <div className="space-y-8">
        <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
            Match Each Action with Its Recipient
          </h2>
          
          {!showFeedback ? (
            <div className="space-y-6">
              {pairs.map((pair) => (
                <div key={pair.id} className="bg-white rounded-xl p-6 shadow-md">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-4xl">{pair.emoji}</span>
                      <span className="text-lg font-semibold text-gray-800">{pair.left}</span>
                    </div>
                    
                    <div className="text-3xl text-cyan-500">→</div>
                    
                    <select
                      value={matches[pair.id] || ""}
                      onChange={(e) => handleMatch(pair.id, e.target.value)}
                      className="flex-1 p-3 border-2 border-cyan-300 rounded-lg text-lg focus:border-cyan-500 focus:outline-none"
                    >
                      <option value="">Select...</option>
                      {rights.map((right) => (
                        <option key={right} value={right}>{right}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}

              <button
                onClick={handleSubmit}
                disabled={Object.keys(matches).length !== pairs.length}
                className={`w-full mt-6 py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105 ${
                  Object.keys(matches).length === pairs.length
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg hover:shadow-xl'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Submit Matches
              </button>
            </div>
          ) : (
            <div className={`p-8 rounded-xl ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className="text-center">
                <div className="text-6xl mb-4">{isCorrect ? '🎉' : '😕'}</div>
                <h3 className={`text-2xl font-bold mb-4 ${
                  isCorrect ? 'text-green-700' : 'text-red-700'
                }`}>
                  {isCorrect ? 'Perfect Match!' : 'Not Quite Right'}
                </h3>
                <p className="text-lg text-gray-700">
                  {isCorrect 
                    ? 'Excellent! You understand how to practice inclusion!'
                    : 'Try matching each inclusive action with its specific recipient again.'}
                </p>
                {!isCorrect && (
                  <button
                    onClick={handleTryAgain}
                    className="mt-4 px-8 py-3 bg-cyan-500 text-white rounded-xl font-bold hover:bg-cyan-600 transition-all transform hover:scale-105"
                  >
                    Try Again
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </GameShell>
  );
};

export default PuzzleInclusionActs;

