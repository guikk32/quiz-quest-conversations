
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, CheckCircle, XCircle, Trophy } from "lucide-react";

const Problems = () => {
  // Mock data for solved problems - in a real app this would come from a database
  const solvedProblems = [
    { id: 1, equation: "2x + 5 = 11", answer: 3, difficulty: 1, solved: true, attempts: 1 },
    { id: 2, equation: "3x - 7 = 8", answer: 5, difficulty: 1, solved: true, attempts: 2 },
    { id: 3, equation: "4x + 12 = 28", answer: 4, difficulty: 2, solved: false, attempts: 3 },
    { id: 4, equation: "5x - 15 = 10", answer: 5, difficulty: 2, solved: true, attempts: 1 },
    { id: 5, equation: "6x + 8 = 32", answer: 4, difficulty: 3, solved: true, attempts: 2 },
  ];

  const getDifficultyBadge = (difficulty: number) => {
    const colors = {
      1: "bg-green-100 text-green-800",
      2: "bg-yellow-100 text-yellow-800", 
      3: "bg-red-100 text-red-800"
    };
    return colors[difficulty as keyof typeof colors] || colors[1];
  };

  const getDifficultyLabel = (difficulty: number) => {
    const labels = { 1: "Fácil", 2: "Médio", 3: "Difícil" };
    return labels[difficulty as keyof typeof labels] || "Fácil";
  };

  const solvedCount = solvedProblems.filter(p => p.solved).length;
  const totalProblems = solvedProblems.length;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent mb-2">
          Problemas Resolvidos
        </h1>
        <p className="text-gray-600">Acompanhe seu progresso e histórico de resolução</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Total Resolvidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{solvedCount}</div>
            <p className="text-sm text-gray-600">de {totalProblems} problemas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Taxa de Sucesso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {Math.round((solvedCount / totalProblems) * 100)}%
            </div>
            <p className="text-sm text-gray-600">problemas corretos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Média de Tentativas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {(solvedProblems.reduce((acc, p) => acc + p.attempts, 0) / totalProblems).toFixed(1)}
            </div>
            <p className="text-sm text-gray-600">tentativas por problema</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Histórico de Problemas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {solvedProblems.map((problem) => (
              <div 
                key={problem.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    {problem.solved ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                  
                  <div>
                    <div className="font-mono text-lg font-medium">{problem.equation}</div>
                    <div className="text-sm text-gray-600">
                      x = {problem.answer}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Badge className={getDifficultyBadge(problem.difficulty)}>
                    {getDifficultyLabel(problem.difficulty)}
                  </Badge>
                  
                  <div className="text-sm text-gray-500">
                    {problem.attempts} tentativa{problem.attempts !== 1 ? 's' : ''}
                  </div>
                  
                  <Badge variant={problem.solved ? "default" : "secondary"}>
                    {problem.solved ? "Resolvido" : "Pendente"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Problems;
