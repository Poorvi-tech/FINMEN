import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import GameShell from "../../Finance/GameShell";
import useGameFeedback from "../../../../hooks/useGameFeedback";

const MiniJournal = () => {
  const navigate = useNavigate();
  const [selectedPrompt, setSelectedPrompt] = useState(0);
  const [journalEntry, setJournalEntry] = useState("");
  const [selectedSentence, setSelectedSentence] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [coins, setCoins] = useState(0);
  const { showCorrectAnswerFeedback } = useGameFeedback();

  const prompts = [
    {
      id: 1,
      text: "I helped by...",
      emoji: "🤝",
      sentenceStarters: [
        "sharing my toys with a friend",
        "helping someone pick up their things",
        "being kind to someone who was sad",
        "listening to my friend's problem"
      ]
    },
    {
      id: 2,
      text: "I was kind when...",
      emoji: "💝",
      sentenceStarters: [
        "I said nice words to someone",
        "I included everyone in my game",
        "I helped my teacher clean up",
        "I shared my snack"
      ]
    },
    {
      id: 3,
      text: "Someone needed help and I...",
      emoji: "🦸",
      sentenceStarters: [
        "asked if they were okay",
        "offered to help them",
        "told a teacher",
        "stayed with them"
      ]
    }
  ];

  const handlePromptChange = (index) => {
    setSelectedPrompt(index);
    setJournalEntry("");
    setSelectedSentence("");
  };

  const handleSentenceSelect = (sentence) => {
    setSelectedSentence(sentence);
    setJournalEntry(sentence);
  };

  const handleSubmit = () => {
    if (journalEntry.trim()) {
      showCorrectAnswerFeedback(3, false);
      setCoins(3); // +3 Coins for submission (minimum for progress)
      setTimeout(() => {
        setShowResult(true);
      }, 500);
    }
  };

  const handleNext = () => {
    navigate("/student/uvls/kids/comfort-roleplay");
  };

  const currentPrompt = prompts[selectedPrompt];

  return (
    <GameShell
      title="Mini Journal"
      subtitle="Share Your Helping Story"
      onNext={handleNext}
      nextEnabled={showResult}
      showGameOver={showResult}
      score={coins}
      gameId="uvls-kids-7"
      gameType="uvls"
      totalLevels={10}
      currentLevel={7}
      showConfetti={showResult}
      backPath="/games/uvls/kids"
    >
      <div className="space-y-8">
        {!showResult ? (
          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <h3 className="text-white text-xl font-bold mb-4">Choose a Prompt</h3>
              <div className="flex gap-3 mb-6">
                {prompts.map((prompt, index) => (
                  <button
                    key={prompt.id}
                    onClick={() => handlePromptChange(index)}
                    className={`flex-1 border-2 rounded-xl p-3 transition-all ${
                      selectedPrompt === index
                        ? 'bg-purple-500/50 border-purple-400 ring-2 ring-white'
                        : 'bg-white/20 border-white/40 hover:bg-white/30'
                    }`}
                  >
                    <div className="text-3xl mb-2">{prompt.emoji}</div>
                    <div className="text-white font-medium text-sm">{prompt.text}</div>
                  </button>
                ))}
              </div>

              <div className="mb-6">
                <h3 className="text-white text-lg font-bold mb-3">
                  {currentPrompt.text}
                </h3>
                
                <div className="mb-4">
                  <label className="text-white/80 text-sm mb-2 block">
                    Choose a sentence or write your own:
                  </label>
                  <div className="space-y-2 mb-4">
                    {currentPrompt.sentenceStarters.map((sentence, index) => (
                      <button
                        key={index}
                        onClick={() => handleSentenceSelect(sentence)}
                        className={`w-full text-left border-2 rounded-lg p-3 transition-all ${
                          selectedSentence === sentence
                            ? 'bg-blue-500/50 border-blue-400'
                            : 'bg-white/10 border-white/30 hover:bg-white/20'
                        }`}
                      >
                        <span className="text-white">{sentence}</span>
                      </button>
                    ))}
                  </div>
                  
                  <div className="text-white/80 text-sm mb-2">Or write your own:</div>
                  <textarea
                    value={journalEntry}
                    onChange={(e) => {
                      setJournalEntry(e.target.value);
                      setSelectedSentence("");
                    }}
                    placeholder="Type your helping story here..."
                    className="w-full bg-white/10 border-2 border-white/30 rounded-xl p-4 text-white placeholder-white/50 focus:border-blue-400 focus:outline-none resize-none"
                    rows="4"
                  />
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={!journalEntry.trim()}
                className={`w-full py-3 rounded-xl font-bold text-white transition ${
                  journalEntry.trim()
                    ? 'bg-gradient-to-r from-green-500 to-blue-500 hover:opacity-90'
                    : 'bg-gray-500/50 cursor-not-allowed'
                }`}
              >
                Submit My Story! ✍️
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
            <h2 className="text-3xl font-bold text-white mb-4">🎉 Great Story!</h2>
            <div className="bg-white/10 rounded-lg p-4 mb-6">
              <p className="text-purple-300 font-semibold mb-2">{currentPrompt.text}</p>
              <p className="text-white text-lg">{journalEntry}</p>
            </div>
            <p className="text-yellow-400 text-2xl font-bold mb-4">
              You earned 3 Coins! 🪙
            </p>
            <p className="text-white/70 text-sm">
              Teacher Tip: Share your story with the class or keep it in your journal!
            </p>
          </div>
        )}
      </div>
    </GameShell>
  );
};

export default MiniJournal;

