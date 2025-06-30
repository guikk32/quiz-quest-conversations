
import React, { useState, useEffect } from 'react';
import 'katex/dist/katex.min.css';
import katex from 'katex';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, CheckCircle, XCircle, Trophy } from "lucide-react";
import axios from 'axios';

interface SolvedProblem {
  question: string;
  solution: string;
}

const Problems = () => {
  const [solvedProblems, setSolvedProblems] = useState<SolvedProblem[]>([]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await axios.get('http://localhost:8000/history');
        setSolvedProblems(response.data);
      } catch (error) {
        console.error("Error fetching history:", error);
      }
    };
    fetchHistory();
  }, []);

  const solvedCount = solvedProblems.length;

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
            <p className="text-sm text-gray-600">problemas resolvidos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Total de Perguntas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {solvedProblems.length}
            </div>
            <p className="text-sm text-gray-600">perguntas feitas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Última Pergunta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-purple-600">
              {solvedProblems.length > 0 ? solvedProblems[solvedProblems.length - 1].question : 'Nenhuma'}
            </div>
            <p className="text-sm text-gray-600">última pergunta feita</p>
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
            {solvedProblems.length > 0 ? (
              solvedProblems.map((problem, index) => (
                <div 
                  key={index}
                  className="flex flex-col p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="font-mono text-lg font-medium">Pergunta: {problem.question}</div>
                  <div className="text-sm text-gray-600 mt-2">
                    Solução: <span dangerouslySetInnerHTML={{ __html: katex.renderToString(problem.solution.replace(/\n/g, '\n'), { throwOnError: false }) }} />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500">Nenhum problema resolvido ainda.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Problems;
