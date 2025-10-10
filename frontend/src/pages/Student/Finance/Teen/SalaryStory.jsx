import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import GameShell from "../GameShell";
import useGameFeedback from "../../../../hooks/useGameFeedback";

const SalaryStory = () => {
  const navigate = useNavigate();
  const [coins, setCoins] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [choices, setChoices] = useState([]);
  const [showResult, setShowResult] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const { flashPoints, showAnswerConfetti, showCorrectAnswerFeedback, resetFeedback } = useGameFeedback();

  const questions = [
    {
      id: 1,
      text: "A young worker earns ₹2000 per month. What should they do with their salary?",
      options: [
        { 
          id: "save", 
          text: "Save ₹400 (20%)", 
          emoji: "💰", 
          description: "Set aside 20% for future needs and emergencies",
          isCorrect: true
        },
        { 
          id: "spend", 
          text: "Spend all", 
          emoji: "🛍️", 
          description: "Use the entire salary for current expenses and entertainment",
          isCorrect: false
        }
      ]
    },
    {
      id: 2,
      text: "The worker gets a ₹500 bonus. How should they handle it?",
      options: [
        { 
          id: "save", 
          text: "Save most of it", 
          emoji: "🏦", 
          description: "Save ₹400 and use ₹100 for a small treat",
          isCorrect: true
        },
        { 
          id: "spend", 
          text: "Spend all on luxury", 
          emoji: "💎", 
          description: "Buy expensive items they don't really need",
          isCorrect: false
        }
      ]
    },
    {
      id: 3,
      text: "The worker's expenses increase to ₹1800 per month. What's the smart approach?",
      options: [
        { 
          id: "save", 
          text: "Maintain savings", 
          emoji: "📈", 
          description: "Still save a portion, even if it's smaller, and look for ways to reduce expenses",
          isCorrect: true
        },
        { 
          id: "spend", 
          text: "Stop saving", 
          emoji: "💸", 
          description: "Stop saving completely to cover all expenses",
          isCorrect: false
        }
      ]
    },
    {
      id: 4,
      text: "The worker gets a 10% salary raise. What should they do with the extra money?",
      options: [
        { 
          id: "save", 
          text: "Increase savings", 
          emoji: "🎯", 
          description: "Save a portion of the raise and use the rest for necessary expenses",
          isCorrect: true
        },
        { 
          id: "spend", 
          text: "Upgrade lifestyle", 
          emoji: "消费升级", 
          description: "Immediately upgrade to more expensive housing, car, and lifestyle",
          isCorrect: false
        }
      ]
    },
    {
      id: 5,
      text: "The worker wants to buy a ₹10,000 gadget. What's the best approach?",
      options: [
        { 
          id: "save", 
          text: "Save over time", 
          emoji: "⏳", 
          description: "Save ₹2000 per month for 5 months to buy it without debt",
          isCorrect: true
        },
        { 
          id: "spend", 
          text: "Buy on EMI", 
          emoji: "💳", 
          description: "Buy it immediately with monthly installments and interest",
          isCorrect: false
        }
      ]
    }
  ];

  const handleChoice = (selectedChoice) => {
    const newChoices = [...choices, { 
      questionId: questions[currentQuestion].id, 
      choice: selectedChoice,
      isCorrect: questions[currentQuestion].options.find(opt => opt.id === selectedChoice)?.isCorrect
    }];
    
    setChoices(newChoices);
    
    // If the choice is correct, add coins and show flash/confetti
    const isCorrect = questions[currentQuestion].options.find(opt => opt.id === selectedChoice)?.isCorrect;
    if (isCorrect) {
      setCoins(prev => prev + 1);
      showCorrectAnswerFeedback(1, true);
    }
    
    // Move to next question or show results
    if (currentQuestion < questions.length - 1) {
      setTimeout(() => {
        setCurrentQuestion(prev => prev + 1);
      }, isCorrect ? 1000 : 0); // Delay if correct to show animation
    } else {
      // Calculate final score
      const correctAnswers = newChoices.filter(choice => choice.isCorrect).length;
      setFinalScore(correctAnswers);
      setShowResult(true);
    }
  };

  const handleTryAgain = () => {
    setShowResult(false);
    setCurrentQuestion(0);
    setChoices([]);
    setCoins(0);
    setFinalScore(0);
    resetFeedback();
  };

  const handleNext = () => {
    navigate("/student/finance/teen/debate-save-vs-spend");
  };

  const getCurrentQuestion = () => questions[currentQuestion];

  return (
    <GameShell
      title="Salary Story"
      subtitle={`Question ${currentQuestion + 1} of ${questions.length}`}
      onNext={handleNext}
      nextEnabled={showResult && finalScore >= 3} // Pass if 3 or more correct
      showGameOver={showResult && finalScore >= 3}
      score={coins}
      gameId="finance-teens-5"
      gameType="finance"
      totalLevels={20}
      currentLevel={5}
      showConfetti={showResult && finalScore >= 3}
      flashPoints={flashPoints}
      showAnswerConfetti={showAnswerConfetti}
    >
      <div className="space-y-8">
        {!showResult ? (
          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <div className="flex justify-between items-center mb-4">
                <span className="text-white/80">Question {currentQuestion + 1}/{questions.length}</span>
                <span className="text-yellow-400 font-bold">Coins: {coins}</span>
              </div>
              
              <p className="text-white text-lg mb-6">
                {getCurrentQuestion().text}
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {getCurrentQuestion().options.map(option => (
                  <button
                    key={option.id}
                    onClick={() => handleChoice(option.id)}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white p-6 rounded-2xl shadow-lg transition-all transform hover:scale-105"
                  >
                    <div className="text-2xl mb-2">{option.emoji}</div>
                    <h3 className="font-bold text-xl mb-2">{option.text}</h3>
                    <p className="text-white/90">{option.description}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 text-center">
            {finalScore >= 3 ? (
              <div>
                <div className="text-5xl mb-4">🎉</div>
                <h3 className="text-2xl font-bold text-white mb-4">Great Job!</h3>
                <p className="text-white/90 text-lg mb-4">
                  You got {finalScore} out of {questions.length} questions correct!
                  You're learning smart financial decisions for earning and saving!
                </p>
                <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-3 px-6 rounded-full inline-flex items-center gap-2 mb-4">
                  <span>+{coins} Coins</span>
                </div>
                <p className="text-white/80">
                  You understand that saving a portion of your income, even as a young worker, is a smart habit!
                </p>
              </div>
            ) : (
              <div>
                <div className="text-5xl mb-4">😔</div>
                <h3 className="text-2xl font-bold text-white mb-4">Keep Learning!</h3>
                <p className="text-white/90 text-lg mb-4">
                  You got {finalScore} out of {questions.length} questions correct.
                  Remember, saving some money from your salary is important for your future!
                </p>
                <button
                  onClick={handleTryAgain}
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white py-3 px-6 rounded-full font-bold transition-all mb-4"
                >
                  Try Again
                </button>
                <p className="text-white/80 text-sm">
                  Try to choose the option that saves money for future needs and emergencies.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </GameShell>
  );
};

export default SalaryStory;