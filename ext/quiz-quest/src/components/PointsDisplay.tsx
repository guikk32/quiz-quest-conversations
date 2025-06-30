
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Star, Target } from "lucide-react";

interface PointsDisplayProps {
  points: number;
  streak: number;
}

const PointsDisplay = ({ points, streak }: PointsDisplayProps) => {
  const getStreakColor = () => {
    if (streak >= 5) return "bg-purple-500";
    if (streak >= 3) return "bg-yellow-500";
    if (streak >= 1) return "bg-green-500";
    return "bg-gray-400";
  };

  const getAchievementLevel = () => {
    if (points >= 100) return { level: "Math Master", icon: "👑", color: "text-purple-600" };
    if (points >= 50) return { level: "Equation Expert", icon: "🎓", color: "text-blue-600" };
    if (points >= 25) return { level: "Problem Solver", icon: "🧮", color: "text-green-600" };
    return { level: "Math Student", icon: "📚", color: "text-gray-600" };
  };

  const achievement = getAchievementLevel();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Your Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className="text-3xl font-bold text-blue-600 mb-2">{points}</div>
          <p className="text-sm text-gray-600">Total Points</p>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-yellow-500" />
            <span className="text-sm font-medium">Streak</span>
          </div>
          <Badge className={`${getStreakColor()} text-white`}>
            {streak}
          </Badge>
        </div>

        <div className="text-center p-3 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border">
          <div className={`text-2xl mb-1 ${achievement.color}`}>
            {achievement.icon}
          </div>
          <p className={`font-medium ${achievement.color}`}>{achievement.level}</p>
        </div>

        <div className="space-y-2 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <Target className="h-3 w-3" />
            <span>Base points: 10 per correct answer</span>
          </div>
          <div className="flex items-center gap-2">
            <Target className="h-3 w-3" />
            <span>Hint bonus: Up to +5 points</span>
          </div>
          <div className="flex items-center gap-2">
            <Target className="h-3 w-3" />
            <span>Streak bonus: +5 points (3+ streak)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PointsDisplay;
