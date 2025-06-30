
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import ConversationInterface from "./ConversationInterface";
import PointsDisplay from "./PointsDisplay";
import ChatInterface from "./ChatInterface";
import { Trophy, RefreshCw } from "lucide-react";
import axios from 'axios';
import { evaluate } from 'mathjs';

interface Equation {
  equation: string;
  answer: number;
  variable: string;
}

const MathTutor = () => {
  const [currentEquation, setCurrentEquation] = useState<Equation | null>(null);
  const [userAnswer, setUserAnswer] = useState("");
  const [points, setPoints] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  const [messages, setMessages] = useState<Array<{type: 'system' | 'user' | 'hint' | 'explain_step' | 'solve_equation' | 'error', content: string, timestamp: Date}>>([]);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    generateNewEquation();
    addSystemMessage("Olá! Eu sou seu Tutor de Matemática! 🎓 Estou aqui para te ajudar a dominar equações de primeiro grau. Você pode me fazer perguntas, pedir dicas ou apenas conversar sobre matemática. Vamos começar com seu primeiro problema!");
  }, []);

  const generateNewEquation = async () => {
    try {
      const response = await axios.get('http://localhost:8000/generate_equation');
      const equation = response.data;
      setCurrentEquation(equation);
      setUserAnswer("");
      
      setIsCorrect(null);
      addSystemMessage(`Aqui está sua próxima equação para resolver: **${equation.equation}**\n\nEncontre o valor de ${equation.variable}. Você pode digitar sua resposta ou me pedir ajuda!`);
    } catch (error) {
      console.error("Error generating new equation:", error);
      if (axios.isAxiosError(error) && error.response && error.response.data && error.response.data.detail) {
        addErrorMessage(`Erro ao gerar equação: ${error.response.data.detail}`);
      } else {
        addErrorMessage("Desculpe, não consegui gerar uma nova equação no momento. Por favor, tente novamente mais tarde.");
      }
    }
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

  const addErrorMessage = (content: string) => {
    setMessages(prev => [...prev, { type: 'error', content, timestamp: new Date() }]);
  };

  

  const handleChatMessage = async (message: string) => {
    console.log("handleChatMessage called with:", message);
    addUserMessage(message);

    
    // Check if it's a number (answer attempt)
    const numericValue = parseFloat(message);
    if (!isNaN(numericValue) && currentEquation) {
      handleAnswerSubmission(numericValue);
      return;
    }

    setIsLoading(true);
    addSystemMessage("Pensando...");
    try {
      const response = await axios.post('http://localhost:8000/solve_equation', { user_message: message });
      const solutionContent = response.data.solution;
      const intent = response.data.intent;

      if (intent === "HINT") {
        addHintMessage(`💡 ${solutionContent}`);
      } else if (intent === "EXPLAIN_STEP") {
        setMessages(prev => [...prev, { type: 'explain_step', content: solutionContent, timestamp: new Date() }]);
      } else if (intent === "SOLVE_EQUATION") {
        setMessages(prev => [...prev, { type: 'solve_equation', content: solutionContent, timestamp: new Date() }]);
      } else {
        addSystemMessage(`${solutionContent}`);
      }
    } catch (error) {
      console.error("Error processing chat message:", error);
      addErrorMessage("Desculpe, não consegui processar sua solicitação. Por favor, tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerSubmission = (numericAnswer: number) => {
    if (!currentEquation) return;

    if (Math.abs(numericAnswer - currentEquation.answer) < 0.001) {
      setIsCorrect(true);
      const basePoints = 10;
      const bonusPoints = 0;
      const streakBonus = streak >= 3 ? 5 : 0;
      const totalPoints = basePoints + bonusPoints + streakBonus;
      
      setPoints(prev => prev + totalPoints);
      setStreak(prev => prev + 1);
      
      let message = `🎉 Excelente! Está correto! Você ganhou ${totalPoints} pontos!`;      if (bonusPoints > 0) message += ` (+${bonusPoints} bônus por poucas dicas)`;
      if (streakBonus > 0) message += ` (+${streakBonus} bônus de sequência)`;
      message += `

Ótimo trabalho! Pronto para o próximo desafio? 🚀`;
      
      setTimeout(() => {
        generateNewEquation();
      }, 3000);
    } else {
      setIsCorrect(false);
      setStreak(0);
      addSystemMessage(`❌ Não está certo. Não se preocupe! Aprender com os erros faz parte do processo. Tente novamente! 💪`);
    }
  };

  const handleSubmitAnswer = () => {
    if (!currentEquation || !userAnswer.trim()) return;
    const numericAnswer = parseFloat(userAnswer.replace(',', '.'));
    addUserMessage(`My answer: ${userAnswer}`);
    handleAnswerSubmission(numericAnswer);
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
          Tutor de Matemática: Equações de Primeiro Grau
        </h1>
        <p className="text-gray-600">Domine equações lineares através de aprendizado interativo!</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Problema Atual
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
                      Resolva para {currentEquation.variable}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Input
                      type="number"
                      step="any"
                      placeholder={`Digite o valor para ${currentEquation.variable}...`}
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="flex-1"
                      disabled={isCorrect === true || isLoading}
                    />
                    <Button 
                      onClick={handleSubmitAnswer}
                      disabled={!userAnswer.trim() || isCorrect === true}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Enviar
                    </Button>
                  </div>

                  <div className="flex gap-2 justify-center">
                    
                    <Button
                      variant="outline"
                      onClick={generateNewEquation}
                      className="flex items-center gap-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Novo Problema
                    </Button>
                  </div>

                  {isCorrect !== null && (
                    <div className={`text-center p-3 rounded-lg ${
                      isCorrect 
                        ? 'bg-green-50 text-green-800 border border-green-200' 
                        : 'bg-red-50 text-red-800 border border-red-200'
                    }`}>
                      {isCorrect ? '✅ Correto!' : '❌ Incorreto'}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <ChatInterface 
            messages={messages}
            onSendMessage={handleChatMessage}
            isLoading={isLoading}
          />
        </div>

        <div className="space-y-6">
          <PointsDisplay points={points} streak={streak} />
          
          <Card>
            <CardHeader>
              <CardTitle>Como Conversar Comigo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <Badge variant="secondary">💬</Badge>
                <span>Digite sua resposta numérica para enviá-la</span>
              </div>
              <div className="flex items-start gap-2">
                <Badge variant="secondary">💡</Badge>
                <span>Clique em "Obter Dica" quando estiver travado</span>
              </div>
              <div className="flex items-start gap-2">
                <Badge variant="secondary">📚</Badge>
                <span>Diga "/explain" para ver a solução passo a passo</span>
              </div>
              <div className="flex items-start gap-2">
                <Badge variant="secondary">🔄</Badge>
                <span>Clique em "Novo Problema" para obter uma nova equação</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MathTutor;
