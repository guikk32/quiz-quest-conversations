
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { generateEquation, checkAnswer, getHint } from "@/utils/equationGenerator";
import ConversationInterface from "./ConversationInterface";
import PointsDisplay from "./PointsDisplay";
import { Trophy, Lightbulb, RefreshCw } from "lucide-react";

interface Equation {
  equation: string;
  answer: number;
  variable: string;
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
    addSystemMessage("Welcome to Math Tutor! I'll help you solve first-degree equations. Let's start with your first problem!");
  }, []);

  const generateNewEquation = () => {
    const equation = generateEquation();
    setCurrentEquation(equation);
    setUserAnswer("");
    setHintsUsed(0);
    setIsCorrect(null);
    addSystemMessage(`Solve for ${equation.variable}: ${equation.equation}`);
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

  const handleSubmitAnswer = () => {
    if (!currentEquation || !userAnswer.trim()) return;

    const numericAnswer = parseFloat(userAnswer);
    addUserMessage(`My answer: ${userAnswer}`);

    if (checkAnswer(numericAnswer, currentEquation.answer)) {
      setIsCorrect(true);
      const basePoints = 10;
      const bonusPoints = Math.max(0, 5 - hintsUsed);
      const streakBonus = streak >= 3 ? 5 : 0;
      const totalPoints = basePoints + bonusPoints + streakBonus;
      
      setPoints(prev => prev + totalPoints);
      setStreak(prev => prev + 1);
      
      let message = `🎉 Correct! You earned ${totalPoints} points!`;
      if (bonusPoints > 0) message += ` (+${bonusPoints} bonus for minimal hints)`;
      if (streakBonus > 0) message += ` (+${streakBonus} streak bonus)`;
      
      addSystemMessage(message);
      
      setTimeout(() => {
        generateNewEquation();
      }, 2000);
    } else {
      setIsCorrect(false);
      setStreak(0);
      addSystemMessage(`❌ Not quite right. The correct answer is ${currentEquation.variable} = ${currentEquation.answer}. Try asking for a hint next time!`);
      
      setTimeout(() => {
        generateNewEquation();
      }, 3000);
    }
  };

  const handleAskForHint = () => {
    if (!currentEquation) return;
    
    const hint = getHint(currentEquation, hintsUsed);
    setHintsUsed(prev => prev + 1);
    addHintMessage(`💡 Hint: ${hint}`);
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

          <ConversationInterface messages={messages} />
        </div>

        <div className="space-y-6">
          <PointsDisplay points={points} streak={streak} />
          
          <Card>
            <CardHeader>
              <CardTitle>Tips for Success</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <Badge variant="secondary">1</Badge>
                <span>Isolate the variable by performing the same operation on both sides</span>
              </div>
              <div className="flex items-start gap-2">
                <Badge variant="secondary">2</Badge>
                <span>Work backwards from the order of operations</span>
              </div>
              <div className="flex items-start gap-2">
                <Badge variant="secondary">3</Badge>
                <span>Use hints wisely - you get bonus points for solving with fewer hints!</span>
              </div>
              <div className="flex items-start gap-2">
                <Badge variant="secondary">4</Badge>
                <span>Build a streak for bonus points!</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MathTutor;
