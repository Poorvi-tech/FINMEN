import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import GameShell from "../../Finance/GameShell";
import useGameFeedback from "../../../../hooks/useGameFeedback";

const PatternMusicGame = () => {
  const navigate = useNavigate();
  const [currentPattern, setCurrentPattern] = useState(0);
  const [userPattern, setUserPattern] = useState([]);
  const [showPattern, setShowPattern] = useState(true);
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const { flashPoints, showAnswerConfetti, showCorrectAnswerFeedback, resetFeedback } = useGameFeedback();

  const patterns = [
    { id: 1, pattern: ["👏", "👏", "⏸️"], display: "Clap-Clap-Pause" },
    { id: 2, pattern: ["👏", "⏸️", "👏"], display: "Clap-Pause-Clap" },
    { id: 3, pattern: ["👏", "👏", "👏", "⏸️"], display: "Clap-Clap-Clap-Pause" },
    { id: 4, pattern: ["⏸️", "👏", "👏"], display: "Pause-Clap-Clap" },
    { id: 5, pattern: ["👏", "⏸️", "👏", "⏸️"], display: "Clap-Pause-Clap-Pause" }
  ];

  const currentPatternData = patterns[currentPattern];

  const handleClapPause = (action) => {
    const newPattern = [...userPattern, action];
    setUserPattern(newPattern);

    if (newPattern.length === currentPatternData.pattern.length) {
      const isCorrect = JSON.stringify(newPattern) === JSON.stringify(currentPatternData.pattern);
      
      if (isCorrect) {
        setScore(prev => prev + 1);
        showCorrectAnswerFeedback(1, false);
      }
      
      setTimeout(() => {
        if (currentPattern < patterns.length - 1) {
          setCurrentPattern(prev => prev + 1);
          setUserPattern([]);
          setShowPattern(true);
        } else {
          if ((score + (isCorrect ? 1 : 0)) >= 4) {
            setCoins(5);
          }
          setScore(prev => prev + (isCorrect ? 1 : 0));
          setShowResult(true);
        }
      }, 800);
    }
  };

  const handleStartRepeating = () => {
    setShowPattern(false);
  };

  const handleTryAgain = () => {
    setShowResult(false);
    setCurrentPattern(0);
    setUserPattern([]);
    setShowPattern(true);
    setScore(0);
    setCoins(0);
    resetFeedback();
  };

  const handleNext = () => {
    navigate("/student/ai-for-all/kids/robot-vision-game");
  };

  return (
    <GameShell
      title="Pattern Music Game"
      subtitle={`Pattern ${currentPattern + 1} of ${patterns.length}`}
      onNext={handleNext}
      nextEnabled={showResult && score >= 4}
      showGameOver={showResult && score >= 4}
      score={coins}
      gameId="ai-kids-13"
      gameType="ai"
      totalLevels={20}
      currentLevel={13}
      showConfetti={showResult && score >= 4}
      flashPoints={flashPoints}
      showAnswerConfetti={showAnswerConfetti}
      backPath="/games/ai-for-all/kids"
    >
      <div className="space-y-8">
        {!showResult ? (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
            <h3 className="text-white text-xl font-bold mb-6 text-center">
              {showPattern ? "Watch the rhythm!" : "Repeat the pattern!"}
            </h3>
            
            {showPattern ? (
              <>
                <div className="bg-purple-500/20 rounded-xl p-8 mb-6">
                  <div className="flex justify-center items-center gap-3 mb-4">
                    {currentPatternData.pattern.map((item, idx) => (
                      <div key={idx} className="text-6xl">{item}</div>
                    ))}
                  </div>
                  <p className="text-white text-xl font-bold text-center">{currentPatternData.display}</p>
                </div>
                <button
                  onClick={handleStartRepeating}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-4 rounded-xl font-bold text-xl hover:opacity-90 transition"
                >
                  Start Repeating! 🎵
                </button>
              </>
            ) : (
              <>
                <div className="bg-blue-500/20 rounded-lg p-4 mb-6">
                  <p className="text-white text-center">
                    Your pattern: {userPattern.length > 0 ? userPattern.join(" ") : "Start clicking!"}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => handleClapPause("👏")}
                    disabled={userPattern.length >= currentPatternData.pattern.length}
                    className="bg-yellow-500/30 hover:bg-yellow-500/50 border-3 border-yellow-400 rounded-xl p-8 transition-all transform hover:scale-105 disabled:opacity-50"
                  >
                    <div className="text-6xl mb-2">👏</div>
                    <div className="text-white font-bold text-xl">CLAP</div>
                  </button>
                  <button
                    onClick={() => handleClapPause("⏸️")}
                    disabled={userPattern.length >= currentPatternData.pattern.length}
                    className="bg-blue-500/30 hover:bg-blue-500/50 border-3 border-blue-400 rounded-xl p-8 transition-all transform hover:scale-105 disabled:opacity-50"
                  >
                    <div className="text-6xl mb-2">⏸️</div>
                    <div className="text-white font-bold text-xl">PAUSE</div>
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
            <h2 className="text-3xl font-bold text-white mb-4 text-center">
              {score >= 4 ? "🎉 Rhythm Master!" : "💪 Keep Practicing!"}
            </h2>
            <p className="text-white/90 text-xl mb-4 text-center">
              You repeated {score} out of {patterns.length} patterns correctly!
            </p>
            <div className="bg-blue-500/20 rounded-lg p-4 mb-4">
              <p className="text-white/90 text-sm">
                💡 AI can detect patterns in music, speech, and sounds - just like you did!
              </p>
            </div>
            <p className="text-yellow-400 text-2xl font-bold text-center">
              {score >= 4 ? "You earned 5 Coins! 🪙" : "Get 4 or more correct to earn coins!"}
            </p>
            {score < 4 && (
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

export default PatternMusicGame;

