
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Target, Zap, Calendar, Award } from "lucide-react";

const Profile = () => {
  // Mock user data - in a real app this would come from authentication/database
  const user = {
    name: "John Doe",
    email: "john.doe@example.com",
    avatar: "",
    joinDate: "Janeiro 2024",
    totalPoints: 245,
    problemsSolved: 54,
    currentStreak: 7,
    longestStreak: 12,
    level: 3,
    nextLevelPoints: 300,
  };

  const difficultyStats = [
    { level: "Dificuldade 1", correct: 18, wrong: 2, total: 20 },
    { level: "Dificuldade 2", correct: 15, wrong: 5, total: 20 },
    { level: "Dificuldade 3", correct: 8, wrong: 6, total: 14 }
  ];

  const achievements = [
    { title: "Primeiro Problema", description: "Resolveu seu primeiro problema", earned: true },
    { title: "Streak de 5", description: "5 problemas corretos seguidos", earned: true },
    { title: "Especialista Nível 1", description: "10 problemas de dificuldade 1", earned: true },
    { title: "Streak de 10", description: "10 problemas corretos seguidos", earned: false },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent mb-2">
          Meu Perfil
        </h1>
        <p className="text-gray-600">Acompanhe seu progresso e conquistas</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Informações Pessoais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-20 w-20 mb-4">
                <AvatarImage src={user.avatar} />
                <AvatarFallback className="text-xl">
                  {user.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <h3 className="text-xl font-semibold">{user.name}</h3>
              <p className="text-gray-600">{user.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">Desde {user.joinDate}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Nível {user.level}</span>
                <Badge variant="secondary">{user.totalPoints} pts</Badge>
              </div>
              <Progress 
                value={(user.totalPoints / user.nextLevelPoints) * 100} 
                className="h-2"
              />
              <p className="text-xs text-gray-600 text-center">
                {user.nextLevelPoints - user.totalPoints} pontos para o próximo nível
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Estatísticas Gerais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Trophy className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-600">{user.totalPoints}</div>
                <div className="text-sm text-gray-600">Pontos Totais</div>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <Target className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-600">{user.problemsSolved}</div>
                <div className="text-sm text-gray-600">Problemas</div>
              </div>
              
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <Zap className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-orange-600">{user.currentStreak}</div>
                <div className="text-sm text-gray-600">Streak Atual</div>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <Award className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-purple-600">{user.longestStreak}</div>
                <div className="text-sm text-gray-600">Melhor Streak</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quantidade de problemas por dificuldade</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {difficultyStats.map((stat, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{stat.level}:</span>
                  <span className="text-sm text-gray-600">
                    Acertos {stat.correct}, Erros {stat.wrong}
                  </span>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className="h-full bg-green-500 transition-all duration-300"
                      style={{ width: `${(stat.correct / stat.total) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-600 min-w-[3rem]">
                    {Math.round((stat.correct / stat.total) * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Conquistas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {achievements.map((achievement, index) => (
              <div 
                key={index}
                className={`flex items-center gap-3 p-3 rounded-lg border ${
                  achievement.earned 
                    ? 'bg-yellow-50 border-yellow-200' 
                    : 'bg-gray-50 border-gray-200 opacity-60'
                }`}
              >
                <Trophy 
                  className={`h-6 w-6 ${
                    achievement.earned ? 'text-yellow-600' : 'text-gray-400'
                  }`} 
                />
                <div className="flex-1">
                  <div className="font-medium">{achievement.title}</div>
                  <div className="text-sm text-gray-600">{achievement.description}</div>
                </div>
                {achievement.earned && (
                  <Badge className="bg-yellow-100 text-yellow-800">
                    Conquistado
                  </Badge>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
