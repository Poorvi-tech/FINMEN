import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import GameShell from "../../Finance/GameShell";
import useGameFeedback from "../../../../hooks/useGameFeedback";

const PuzzleRespectMatch = () => {
  const navigate = useNavigate();
  const [matches, setMatches] = useState({});
  const [showResult, setShowResult] = useState(false);
  const [coins, setCoins] = useState(0);
  const { showCorrectAnswerFeedback } = useGameFeedback();

  const people = [
    { id: 1, person: "Teacher", emoji: "👩‍🏫", correct: "listen" },
    { id: 2, person: "Elder", emoji: "👴", correct: "help" },
    { id: 3, person: "Friend", emoji: "👦", correct: "share" }
  ];

  const actions = [
    { id: "listen", name: "Listen to them", emoji: "👂" },
    { id: "help", name: "Help them", emoji: "🤝" },
    { id: "share", name: "Share with them", emoji: "🎁" }
  ];

  const handleMatch = (personId, actionId) => {
    setMatches({ ...matches, [personId]: actionId });
  };

  const handleCheck = () => {
    let correct = 0;
    people.forEach(person => {
      if (matches[person.id] === person.correct) {
        correct++;
      }
    });

    if (correct >= 2) {
      showCorrectAnswerFeedback(5, true);
      setCoins(5);
    }
    setShowResult(true);
  };

  const allMatched = people.every(person => matches[person.id]);

  const handleTryAgain = () => {
    setMatches({});
    setShowResult(false);
    setCoins(0);
  };

  const handleNext = () => {
    navigate("/student/civic-responsibility/kids/gender-story");
  };

  const correctCount = people.filter(person => matches[person.id] === person.correct).length;

  return (
    <GameShell
      title="Puzzle: Respect Match"
      subtitle="Show Respect to All"
      onNext={handleNext}
      nextEnabled={showResult && correctCount >= 2}
      showGameOver={showResult && correctCount >= 2}
      score={coins}
      gameId="crgc-kids-14"
      gameType="crgc"
      totalLevels={20}
      currentLevel={14}
      showConfetti={showResult && correctCount >= 2}
      backPath="/games/civic-responsibility/kids"
    >
      <div className="space-y-8">
        {!showResult ? (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
            <h3 className="text-white text-xl font-bold mb-6 text-center">Match each person with how to show respect!</h3>
            
            <div className="space-y-4 mb-6">
              {people.map(person => {
                return (
                  <div key={person.id} className="bg-purple-500/20 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-5xl">{person.emoji}</div>
                        <div className="text-white font-bold text-lg">{person.person}</div>
                      </div>
                      <div className="text-2xl">→</div>
                      <div className="flex-1 ml-4">
                        <select
                          value={matches[person.id] || ""}
                          onChange={(e) => handleMatch(person.id, e.target.value)}
                          className="w-full px-4 py-2 bg-white/10 border-2 border-white/40 rounded-lg text-white"
                        >
                          <option value="">Select action...</option>
                          {actions.map(action => (
                            <option key={action.id} value={action.id} className="text-black">
                              {action.emoji} {action.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={handleCheck}
              disabled={!allMatched}
              className={`w-full py-3 rounded-xl font-bold text-white transition ${
                allMatched
                  ? 'bg-gradient-to-r from-green-500 to-blue-500 hover:opacity-90'
                  : 'bg-gray-500/50 cursor-not-allowed'
              }`}
            >
              Check My Answers
            </button>
          </div>
        ) : (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
            <h2 className="text-3xl font-bold text-white mb-4 text-center">
              {correctCount >= 2 ? "🎉 Respect Master!" : "💪 Try Again!"}
            </h2>
            <p className="text-white/90 text-xl mb-4 text-center">
              You matched {correctCount} out of {people.length} correctly!
            </p>
            <div className="bg-blue-500/20 rounded-lg p-4 mb-4">
              <p className="text-white/90 text-sm">
                💡 We show respect differently: listen to teachers, help elders, share with friends!
              </p>
            </div>
            <p className="text-yellow-400 text-2xl font-bold text-center">
              {correctCount >= 2 ? "You earned 5 Coins! 🪙" : "Get 2 or more correct to earn coins!"}
            </p>
            {correctCount < 2 && (
              <button
                onClick={handleTryAgain}
                className="mt-4 w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-full font-semibold hover:opacity-90 transition"
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

export default PuzzleRespectMatch;

