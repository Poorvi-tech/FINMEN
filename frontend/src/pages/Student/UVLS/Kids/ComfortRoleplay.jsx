import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import GameShell from "../../Finance/GameShell";
import useGameFeedback from "../../../../hooks/useGameFeedback";

const ComfortRoleplay = () => {
  const navigate = useNavigate();
  const [currentVignette, setCurrentVignette] = useState(0);
  const [selectedPhrases, setSelectedPhrases] = useState([]);
  const [showResult, setShowResult] = useState(false);
  const [coins, setCoins] = useState(0);
  const [vignetteResults, setVignetteResults] = useState([]);
  const { flashPoints, showAnswerConfetti, showCorrectAnswerFeedback, resetFeedback } = useGameFeedback();

  const vignettes = [
    {
      id: 1,
      situation: "Your friend is crying because they lost their favorite toy.",
      emoji: "😢",
      phrases: [
        { id: 1, text: "I'm sorry you're sad. Can I help you look for it?", validating: true },
        { id: 2, text: "It's just a toy, get over it.", validating: false },
        { id: 3, text: "I understand how you feel. Want to talk about it?", validating: true },
        { id: 4, text: "Stop crying, it's not a big deal.", validating: false },
        { id: 5, text: "Let me sit with you until you feel better.", validating: true }
      ],
      peerResponse: {
        good: "Thank you for being so kind and understanding! 😊",
        bad: "That didn't make me feel better... 😔"
      }
    },
    {
      id: 2,
      situation: "Your classmate is upset because they got a bad grade.",
      emoji: "📝",
      phrases: [
        { id: 1, text: "You can do better next time. I believe in you!", validating: true },
        { id: 2, text: "You're not smart enough, that's why.", validating: false },
        { id: 3, text: "Let's study together next time!", validating: true },
        { id: 4, text: "I told you so, you should have studied more.", validating: false },
        { id: 5, text: "It's okay to make mistakes. We all do.", validating: true }
      ],
      peerResponse: {
        good: "Thanks for being supportive! I feel much better now. 🌟",
        bad: "Your words made me feel worse... 😢"
      }
    },
    {
      id: 3,
      situation: "A new student is sitting alone and looks lonely.",
      emoji: "😔",
      phrases: [
        { id: 1, text: "Hi! Want to sit with me and my friends?", validating: true },
        { id: 2, text: "Why are you sitting alone? That's weird.", validating: false },
        { id: 3, text: "Being new can be hard. I'm here if you want to talk.", validating: true },
        { id: 4, text: "You look sad. What's wrong with you?", validating: false },
        { id: 5, text: "Let me show you around and introduce you to people!", validating: true }
      ],
      peerResponse: {
        good: "Thank you so much! I feel welcome now! 😊",
        bad: "That made me feel even more alone... 😞"
      }
    }
  ];

  const handlePhraseToggle = (phraseId) => {
    if (selectedPhrases.includes(phraseId)) {
      setSelectedPhrases(selectedPhrases.filter(id => id !== phraseId));
    } else if (selectedPhrases.length < 3) {
      setSelectedPhrases([...selectedPhrases, phraseId]);
    }
  };

  const handleConfirm = () => {
    if (selectedPhrases.length !== 3) return;

    const vignette = vignettes[currentVignette];
    const selectedPhraseObjects = vignette.phrases.filter(p => selectedPhrases.includes(p.id));
    const validatingCount = selectedPhraseObjects.filter(p => p.validating).length;
    const isGood = validatingCount >= 2; // Need at least 2 validating phrases

    const result = {
      vignetteId: vignette.id,
      selectedPhrases: selectedPhraseObjects,
      isGood,
      validatingCount
    };

    setVignetteResults([...vignetteResults, result]);

    if (isGood) {
      showCorrectAnswerFeedback(5, true);
    }

    if (currentVignette < vignettes.length - 1) {
      setTimeout(() => {
        setCurrentVignette(prev => prev + 1);
        setSelectedPhrases([]);
      }, 1500);
    } else {
      const totalGood = [...vignetteResults, result].filter(r => r.isGood).length;
      if (totalGood >= 2) {
        setCoins(3); // +3 Coins if picks validating phrases (minimum for progress)
      }
      setTimeout(() => {
        setShowResult(true);
      }, 1500);
    }
  };

  const handleTryAgain = () => {
    setShowResult(false);
    setCurrentVignette(0);
    setSelectedPhrases([]);
    setVignetteResults([]);
    setCoins(0);
    resetFeedback();
  };

  const handleNext = () => {
    navigate("/student/uvls/kids/share-reflex");
  };

  const vignette = vignettes[currentVignette];
  const totalGood = vignetteResults.filter(r => r.isGood).length;

  return (
    <GameShell
      title="Comfort Roleplay"
      subtitle={`Situation ${currentVignette + 1} of ${vignettes.length}`}
      onNext={handleNext}
      nextEnabled={showResult && totalGood >= 2}
      showGameOver={showResult && totalGood >= 2}
      score={coins}
      gameId="uvls-kids-8"
      gameType="uvls"
      totalLevels={10}
      currentLevel={8}
      showConfetti={showResult && totalGood >= 2}
      flashPoints={flashPoints}
      showAnswerConfetti={showAnswerConfetti}
      backPath="/games/uvls/kids"
    >
      <div className="space-y-8">
        {!showResult ? (
          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <div className="text-6xl mb-4 text-center">{vignette.emoji}</div>
              
              <p className="text-white text-lg mb-6 font-semibold text-center">
                {vignette.situation}
              </p>

              <p className="text-white/90 mb-4 text-center">
                Choose 3 kind phrases to say ({selectedPhrases.length}/3):
              </p>

              <div className="space-y-3 mb-6">
                {vignette.phrases.map(phrase => (
                  <button
                    key={phrase.id}
                    onClick={() => handlePhraseToggle(phrase.id)}
                    disabled={!selectedPhrases.includes(phrase.id) && selectedPhrases.length >= 3}
                    className={`w-full text-left border-2 rounded-xl p-4 transition-all ${
                      selectedPhrases.includes(phrase.id)
                        ? 'bg-green-500/50 border-green-400 ring-2 ring-white'
                        : 'bg-white/20 border-white/40 hover:bg-white/30'
                    } ${!selectedPhrases.includes(phrase.id) && selectedPhrases.length >= 3 ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <span className="text-white font-medium">{phrase.text}</span>
                  </button>
                ))}
              </div>

              <button
                onClick={handleConfirm}
                disabled={selectedPhrases.length !== 3}
                className={`w-full py-3 rounded-xl font-bold text-white transition ${
                  selectedPhrases.length === 3
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90'
                    : 'bg-gray-500/50 cursor-not-allowed'
                }`}
              >
                Say These Phrases
              </button>

              {vignetteResults.length > 0 && vignetteResults[vignetteResults.length - 1] && (
                <div className={`mt-4 p-4 rounded-xl ${
                  vignetteResults[vignetteResults.length - 1].isGood
                    ? 'bg-green-500/30 border-2 border-green-400'
                    : 'bg-red-500/30 border-2 border-red-400'
                }`}>
                  <p className="text-white font-medium">
                    {vignetteResults[vignetteResults.length - 1].isGood
                      ? vignettes[vignetteResults.length - 1].peerResponse.good
                      : vignettes[vignetteResults.length - 1].peerResponse.bad}
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
            <h2 className="text-3xl font-bold text-white mb-4">
              {totalGood >= 2 ? "🎉 You're So Comforting!" : "💪 Keep Learning!"}
            </h2>
            <p className="text-white/90 text-xl mb-4">
              You comforted {totalGood} out of {vignettes.length} friends well!
            </p>
            <p className="text-yellow-400 text-2xl font-bold mb-6">
              {totalGood >= 2 ? "You earned 3 Coins! 🪙" : "Get 2 or more right to earn coins!"}
            </p>
            <p className="text-white/70 text-sm mb-4">
              Teacher Tip: Practice saying these phrases out loud with the right tone!
            </p>
            {totalGood < 2 && (
              <button
                onClick={handleTryAgain}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-full font-semibold hover:opacity-90 transition"
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

export default ComfortRoleplay;

