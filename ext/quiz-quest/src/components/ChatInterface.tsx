
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Bot, User, Lightbulb, Send, Loader2 } from "lucide-react";
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface Message {
  type: 'system' | 'user' | 'hint' | 'error' | 'explain_step' | 'solve_equation';
  content: string;
  timestamp: Date;
}

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

const ChatInterface = ({ messages, onSendMessage, isLoading }: ChatInterfaceProps) => {
  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null); // Ref for the last message
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    
    onSendMessage(inputMessage);
    setInputMessage("");
    
    // Focus back on input after sending
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'system':
        return <Bot className="h-4 w-4 text-blue-600" />;
      case 'user':
        return <User className="h-4 w-4 text-green-600" />;
      case 'hint':
        return <Lightbulb className="h-4 w-4 text-yellow-600" />;
      case 'explain_step':
        return <MessageCircle className="h-4 w-4 text-purple-600" />;
      case 'solve_equation':
        return <MessageCircle className="h-4 w-4 text-red-600" />;
      case 'error':
        return <MessageCircle className="h-4 w-4 text-red-600" />;
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
      case 'explain_step':
        return 'bg-purple-50 border-purple-200 text-purple-800';
      case 'solve_equation':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const formatMessageContent = (message: Message) => {
    let formattedContent = message.content;

    // Convert **bold** to actual bold text
    formattedContent = formattedContent.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Render LaTeX for specific message types
    if (message.type === 'explain_step' || message.type === 'solve_equation') {
      try {
        return <span dangerouslySetInnerHTML={{ __html: katex.renderToString(formattedContent, { throwOnError: false, displayMode: true }) }} />;
      } catch (e) {
        console.error("KaTeX rendering error:", e);
        // Fallback to plain text if KaTeX rendering fails
        return <span dangerouslySetInnerHTML={{ __html: formattedContent.replace(/\n/g, '<br>') }} />;
      }
    } else {
      // Convert line breaks to <br> tags for other message types
      return <span dangerouslySetInnerHTML={{ __html: formattedContent.replace(/\n/g, '<br>') }} />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-blue-600" />
          Chat with Math Tutor
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ScrollArea className="h-80 pr-4">
          <div className="space-y-3">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border transition-all duration-300 animate-in slide-in-from-bottom-2 ${getMessageStyle(message.type)}`}
              >
                <div className="flex items-start gap-2">
                  {getMessageIcon(message.type)}
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {message.type === 'system' ? 'Math Tutor' : 
                       message.type === 'user' ? 'You' : 'Hint'}
                    </p>
                    <div 
                      className="text-sm mt-1 whitespace-pre-wrap" 
                      dangerouslySetInnerHTML={{ __html: formatMessageContent(message) }}
                    />
                    <p className="text-xs opacity-60 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} /> {/* This empty div will be scrolled into view */}
          </div>
        </ScrollArea>

        <div className="flex gap-2">
          <Input
            ref={inputRef}
            placeholder="Digite sua resposta, peça ajuda ou apenas converse..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
            disabled={isLoading}
          />
          <Button 
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            size="icon"
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>

        <div className="text-xs text-gray-500 text-center">
          💡 Experimente digitar: "/solve 2x + 3 = 7", "/explain 2x + 3 = 7", "dica", "ajuda", "preso" ou apenas sua resposta numérica!
        </div>
      </CardContent>
    </Card>
  );
};

export default ChatInterface;
