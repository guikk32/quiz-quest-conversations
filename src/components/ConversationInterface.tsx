
import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Bot, User, Lightbulb } from "lucide-react";

interface Message {
  type: 'system' | 'user' | 'hint';
  content: string;
  timestamp: Date;
}

interface ConversationInterfaceProps {
  messages: Message[];
}

const ConversationInterface = ({ messages }: ConversationInterfaceProps) => {
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'system':
        return <Bot className="h-4 w-4 text-blue-600" />;
      case 'user':
        return <User className="h-4 w-4 text-green-600" />;
      case 'hint':
        return <Lightbulb className="h-4 w-4 text-yellow-600" />;
      default:
        return <MessageCircle className="h-4 w-4" />;
    }
  };

  const getMessageStyle = (type: string) => {
    switch (type) {
      case 'system':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'user':
        return 'bg-green-50 border-green-200 text-green-800 ml-8';
      case 'hint':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-blue-600" />
          Conversation
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-80 pr-4" ref={scrollAreaRef}>
          <div className="space-y-3">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border transition-all duration-300 ${getMessageStyle(message.type)}`}
              >
                <div className="flex items-start gap-2">
                  {getMessageIcon(message.type)}
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {message.type === 'system' ? 'Math Tutor' : 
                       message.type === 'user' ? 'You' : 'Hint'}
                    </p>
                    <p className="text-sm mt-1">{message.content}</p>
                    <p className="text-xs opacity-60 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ConversationInterface;
