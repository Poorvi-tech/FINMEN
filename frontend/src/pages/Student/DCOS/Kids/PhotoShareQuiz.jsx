import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import GameShell from "../../Finance/GameShell";
import useGameFeedback from "../../../../hooks/useGameFeedback";

const PhotoShareQuiz = () => {
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [showResult, setShowResult] = useState(false);
  const [coins, setCoins] = useState(0);
  const { flashPoints, showAnswerConfetti, showCorrectAnswerFeedback, resetFeedback } = useGameFeedback();

  const questions = [
    {
      id: 1,
      text: "Should you post a photo of your home address online?",
      options: [
        { id: "yes", text: "Yes, it's fine", isCorrect: false },
        { id: "no", text: "No, never!", isCorrect: true },
        { id: "maybe", text: "Only to friends", isCorrect: false }
      ]
    },
    {
      id: 2,
      text: "Is it safe to post your school uniform with school name visible?",
      options: [
        { id: "yes", text: "Yes, I'm proud of my school", isCorrect: false },
        { id: "no", text: "No, it reveals where I go", isCorrect: true },
        { id: "crop", text: "Yes, but crop the name", isCorrect: false }
      ]
    },
    {
      id: 3,
      text: "Should you share photos of your birthday party with strangers?",
      options: [
        { id: "yes", text: "Yes, to show fun", isCorrect: false },
        { id: "no", text: "No, keep private", isCorrect: true },
        { id: "some", text: "Only some photos", isCorrect: false }
      ]
    },
    {
      id: 4,
      text: "Can you post a photo showing your house number?",
      options: [
        { id: "yes", text: "Yes", isCorrect: false },
        { id: "no", text: "No, that's private information", isCorrect: true },
        { id: "blur", text: "Yes, if I blur it slightly", isCorrect: false }
      ]
    },
    {
      id: 5,
      text: "Is it okay to post vacation photos while you're still on vacation?",
      options: [
        { id: "yes", text: "Yes, to share my fun", isCorrect: false },
        { id: "no", text: "No, wait until I'm back home", isCorrect: true },
        { id: "some", text: "Yes, just a few", isCorrect: false }
      ]
    },
    {
      id: 6,
      text: "Should you share photos of your younger siblings without parent permission?",
      options: [
        { id: "yes", text: "Yes, they're family", isCorrect: false },
        { id: "no", text: "No, ask parent first", isCorrect: true },
        { id: "cute", text: "Only cute ones", isCorrect: false }
      ]
    }
  ];

  const handleAnswer = (optionId) => {
    const question = questions[currentQuestion];
    const option = question.options.find(opt => opt.id === optionId);
    
    const newAnswers = [...answers, {
      questionId: question.id,
      answer: optionId,
      isCorrect: option.isCorrect
    }];
    
    setAnswers(newAnswers);
    
    if (option.isCorrect) {
      showCorrectAnswerFeedback(1, true);
    }
    
    if (currentQuestion < questions.length - 1) {
      setTimeout(() => {
        setCurrentQuestion(prev => prev + 1);
      }, option.isCorrect ? 800 : 600);
    } else {
      const correctCount = newAnswers.filter(a => a.isCorrect).length;
      const percentage = (correctCount / questions.length) * 100;
      if (percentage >= 70) {
        setCoins(3);
      }
      setShowResult(true);
    }
  };

  const handleTryAgain = () => {
    setShowResult(false);
    setCurrentQuestion(0);
    setAnswers([]);
    setCoins(0);
    resetFeedback();
  };

  const handleNext = () => {
    navigate("/student/dcos/kids/personal-info-puzzle");
  };

  const correctCount = answers.filter(a => a.isCorrect).length;
  const percentage = Math.round((correctCount / questions.length) * 100);

  return (
    <GameShell
      title="Photo Share Quiz"
      subtitle={`Question ${currentQuestion + 1} of ${questions.length}`}
      onNext={handleNext}
      nextEnabled={showResult && percentage >= 70}
      showGameOver={showResult && percentage >= 70}
      score={coins}
      gameId="dcos-kids-3"
      gameType="educational"
      totalLevels={20}
      currentLevel={3}
      showConfetti={showResult && percentage >= 70}
      flashPoints={flashPoints}
      showAnswerConfetti={showAnswerConfetti}
      backPath="/games/digital-citizenship/kids"
    >
      <div className="space-y-8">
        {!showResult ? (
          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <p className="text-white text-lg mb-6 font-semibold text-center">
                {questions[currentQuestion].text}
              </p>
              
              <div className="space-y-3">
                {questions[currentQuestion].options.map(option => (
                  <button
                    key={option.id}
                    onClick={() => handleAnswer(option.id)}
                    className="w-full bg-white/20 backdrop-blur-sm hover:bg-white/30 border-2 border-white/40 rounded-xl p-4 transition-all transform hover:scale-102"
                  >
                    <div className="text-white font-medium">{option.text}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
            <h2 className="text-3xl font-bold text-white mb-4">
              {percentage >= 70 ? "🎉 Photo Safety Expert!" : "💪 Keep Learning!"}
            </h2>
            <p className="text-white/90 text-xl mb-4">
              You got {correctCount} out of {questions.length} correct ({percentage}%)
            </p>
            <div className="bg-blue-500/20 rounded-lg p-4 mb-4">
              <p className="text-white/90 text-sm">
                💡 Never post photos that show where you live, go to school, or reveal personal details!
              </p>
            </div>
            <p className="text-yellow-400 text-2xl font-bold mb-6">
              {percentage >= 70 ? "You earned 3 Coins! 🪙" : "Get 70% or higher to earn coins!"}
            </p>
            {percentage < 70 && (
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

export default PhotoShareQuiz;

