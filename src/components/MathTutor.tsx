
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { generateEquation, checkAnswer, getHint } from "@/utils/equationGenerator";
import ConversationInterface from "./ConversationInterface";
import PointsDisplay from "./PointsDisplay";
import ChatInterface from "./ChatInterface";
import { Trophy, Lightbulb, RefreshCw } from "lucide-react";

interface Equation {
  equation: string;
  answer: number;
  variable: string;
  steps: string[];
}

const MathTutor = () => {
  const [currentEquation, setCurrentEquation] = useState<Equation | null>(null);
  const [userAnswer, setUserAnswer] = useState("");
  const [points, setPoints] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [messages, setMessages] = useState<Array<{type: 'system' | 'user' | 'hint', content: string, timestamp: Date}>>([]);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    generateNewEquation();
    addSystemMessage("Hi! I'm your Math Tutor! 🎓 I'm here to help you master first-degree equations. You can ask me questions, request hints, or just chat about math. Let's start with your first problem!");
  }, []);

  const generateNewEquation = () => {
    const equation = generateEquation();
    setCurrentEquation(equation);
    setUserAnswer("");
    setHintsUsed(0);
    setIsCorrect(null);
    addSystemMessage(`Here's your next equation to solve: **${equation.equation}**\n\nFind the value of ${equation.variable}. You can type your answer or ask me for help!`);
  };

  const addSystemMessage = (content: string) => {
    setMessages(prev => [...prev, { type: 'system', content, timestamp: new Date() }]);
  };

  const addUserMessage = (content: string) => {
    setMessages(prev => [...prev, { type: 'user', content, timestamp: new Date() }]);
  };

  const addHintMessage = (content: string) => {
    setMessages(prev => [...prev, { type: 'hint', content, timestamp: new Date() }]);
  };

  const handleChatMessage = (message: string) => {
    addUserMessage(message);
    
    // Check if it's a number (answer attempt)
    const numericValue = parseFloat(message);
    if (!isNaN(numericValue) && currentEquation) {
      handleAnswerSubmission(numericValue);
      return;
    }

    // Handle conversational inputs
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('hint') || lowerMessage.includes('help') || lowerMessage.includes('stuck')) {
      handleAskForHint();
    } else if (lowerMessage.includes('new') || lowerMessage.includes('next') || lowerMessage.includes('skip')) {
      addSystemMessage("Getting you a new problem! 🔄");
      setTimeout(generateNewEquation, 1000);
    } else if (lowerMessage.includes('explain') || lowerMessage.includes('how')) {
      if (currentEquation) {
        addSystemMessage(`Let me explain how to solve ${currentEquation.equation}:\n\n${currentEquation.steps.join('\n')}\n\nThis gives us ${currentEquation.variable} = ${currentEquation.answer}`);
      }
    } else if (lowerMessage.includes('points') || lowerMessage.includes('score')) {
      addSystemMessage(`You currently have ${points} points and a streak of ${streak}! 🏆\n\nKeep solving correctly to earn more points and maintain your streak!`);
    } else {
      // General conversational responses
      const responses = [
        "I'm here to help you with math! Try giving me your answer to the current equation, or ask for a hint! 😊",
        "Feel free to ask me for hints, explanations, or just type your answer to the equation! 📚",
        "I love helping with math! What would you like to know about solving this equation? 🤔",
        "You can type your numerical answer or ask me questions about the problem! 💭"
      ];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      addSystemMessage(randomResponse);
    }
  };

  const handleAnswerSubmission = (numericAnswer: number) => {
    if (!currentEquation) return;

    if (checkAnswer(numericAnswer, currentEquation.answer)) {
      setIsCorrect(true);
      const basePoints = 10;
      const bonusPoints = Math.max(0, 5 - hintsUsed);
      const streakBonus = streak >= 3 ? 5 : 0;
      const totalPoints = basePoints + bonusPoints + streakBonus;
      
      setPoints(prev => prev + totalPoints);
      setStreak(prev => prev + 1);
      
      let message = `🎉 Excellent! That's correct! You earned ${totalPoints} points!`;
      if (bonusPoints > 0) message += ` (+${bonusPoints} bonus for minimal hints)`;
      if (streakBonus > 0) message += ` (+${streakBonus} streak bonus)`;
      message += `\n\nGreat job! Ready for the next challenge? 🚀`;
      
      addSystemMessage(message);
      
      setTimeout(() => {
        generateNewEquation();
      }, 3000);
    } else {
      setIsCorrect(false);
      setStreak(0);
      addSystemMessage(`❌ Not quite right. The correct answer is ${currentEquation.variable} = ${currentEquation.answer}.\n\nDon't worry! Learning from mistakes is part of the process. Try asking for hints on the next problem! 💪`);
      
      setTimeout(() => {
        generateNewEquation();
      }, 4000);
    }
  };

  const handleSubmitAnswer = () => {
    if (!currentEquation || !userAnswer.trim()) return;
    const numericAnswer = parseFloat(userAnswer);
    addUserMessage(`My answer: ${userAnswer}`);
    handleAnswerSubmission(numericAnswer);
  };

  const handleAskForHint = () => {
    if (!currentEquation) return;
    
    const hint = getHint(currentEquation, hintsUsed);
    setHintsUsed(prev => prev + 1);
    addHintMessage(`💡 ${hint}`);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmitAnswer();
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent mb-2">
          Math Tutor: First-Degree Equations
        </h1>
        <p className="text-gray-600">Master linear equations through interactive learning!</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Current Problem
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentEquation && (
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-2xl font-mono bg-gray-50 p-4 rounded-lg border-2 border-dashed border-gray-300">
                      {currentEquation.equation}
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      Solve for {currentEquation.variable}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Input
                      type="number"
                      step="any"
                      placeholder={`Enter value for ${currentEquation.variable}...`}
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="flex-1"
                      disabled={isCorrect === true}
                    />
                    <Button 
                      onClick={handleSubmitAnswer}
                      disabled={!userAnswer.trim() || isCorrect === true}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Submit
                    </Button>
                  </div>

                  <div className="flex gap-2 justify-center">
                    <Button
                      variant="outline"
                      onClick={handleAskForHint}
                      disabled={isCorrect === true}
                      className="flex items-center gap-2"
                    >
                      <Lightbulb className="h-4 w-4" />
                      Get Hint ({hintsUsed}/3)
                    </Button>
                    <Button
                      variant="outline"
                      onClick={generateNewEquation}
                      className="flex items-center gap-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                      New Problem
                    </Button>
                  </div>

                  {isCorrect !== null && (
                    <div className={`text-center p-3 rounded-lg ${
                      isCorrect 
                        ? 'bg-green-50 text-green-800 border border-green-200' 
                        : 'bg-red-50 text-red-800 border border-red-200'
                    }`}>
                      {isCorrect ? '✅ Correct!' : '❌ Incorrect'}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <ChatInterface 
            messages={messages}
            onSendMessage={handleChatMessage}
          />
        </div>

        <div className="space-y-6">
          <PointsDisplay points={points} streak={streak} />
          
          <Card>
            <CardHeader>
              <CardTitle>How to Chat with Me</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <Badge variant="secondary">💬</Badge>
                <span>Type your numerical answer to submit it</span>
              </div>
              <div className="flex items-start gap-2">
                <Badge variant="secondary">💡</Badge>
                <span>Ask for "hint" or "help" when you're stuck</span>
              </div>
              <div className="flex items-start gap-2">
                <Badge variant="secondary">📚</Badge>
                <span>Say "explain" to see the step-by-step solution</span>
              </div>
              <div className="flex items-start gap-2">
                <Badge variant="secondary">🔄</Badge>
                <span>Type "new problem" to get a fresh equation</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MathTutor;
