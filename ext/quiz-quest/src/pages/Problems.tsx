import React, { useState, useEffect } from 'react';
import 'katex/dist/katex.min.css';
import katex from 'katex';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, CheckCircle, XCircle, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import axios from 'axios';

interface SolvedProblem {
  question: string;
  solution: string;
}

const Problems = () => {
  const [solvedProblems, setSolvedProblems] = useState<SolvedProblem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await axios.get('http://localhost:8000/history');
        setSolvedProblems(response.data);
      } catch (error) {
        console.error("Erro ao buscar histórico:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const solvedCount = solvedProblems.length;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl font-sans text-gray-800 leading-relaxed">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight leading-snug bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent mb-2">
          Problemas Resolvidos
        </h1>
        <p className="text-gray-600 text-base">Acompanhe seu progresso e histórico de resolução</p>
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
            <div className="text-3xl font-bold text-blue-600">{solvedCount}</div>
            <p className="text-sm text-gray-600">perguntas feitas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Última Pergunta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-base md:text-xl font-semibold text-purple-600">
              {solvedCount > 0 ? solvedProblems[solvedCount - 1].question : 'Nenhuma'}
            </div>
            <p className="text-sm text-gray-600">última pergunta feita</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BookOpen className="h-5 w-5" />
            Histórico de Problemas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              <p className="text-center text-gray-500">Carregando...</p>
            ) : solvedCount > 0 ? (
              solvedProblems.map((problem, index) => (
                <article
                  key={index}
                  className="p-4 border rounded-lg bg-white shadow-sm hover:bg-gray-50 transition-colors"
                  aria-label={`Problema ${index + 1}`}
                >
                  <div className="text-base md:text-lg font-semibold mb-1 text-gray-900">
                    Pergunta:
                  </div>
                  <div className="text-gray-700 text-sm md:text-base font-medium">
                    {problem.question}
                  </div>
                  <div className="mt-3 text-sm md:text-base text-gray-700 whitespace-pre-wrap">
                    Solução:{" "}
                   {problem.solution.match(/[
=\^_{\}]+/) ? (
                    <span className="block w-full"
                     dangerouslySetInnerHTML={{
                    __html: katex.renderToString(problem.solution, {
                    throwOnError: false,
                    displayMode: true,
        }),
      }}
    />
  ) : (
    <span>{problem.solution}</span>
  )}
                  </div>
                </article>
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
