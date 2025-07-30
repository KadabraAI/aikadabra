'use client';

import { useState, useRef, useEffect } from 'react';
import { marked } from 'marked';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  isStreaming?: boolean;
}

export default function InteractiveChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Allow new line with Shift+Enter
        return;
      } else {
        e.preventDefault();
        handleSendMessage();
      }
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: input,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const aiMessageId = Date.now().toString() + '-ai';
      const aiMessage: Message = {
        id: aiMessageId,
        sender: 'ai',
        text: '',
        timestamp: new Date().toISOString(),
        isStreaming: true,
      };

      setMessages(prev => [...prev, aiMessage]);

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              setMessages(prev => 
                prev.map(msg => 
                  msg.id === aiMessageId 
                    ? { ...msg, isStreaming: false }
                    : msg
                )
              );
              continue;
            }
            
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content || '';
              
              setMessages(prev => 
                prev.map(msg => 
                  msg.id === aiMessageId 
                    ? { ...msg, text: msg.text + content }
                    : msg
                )
              );
            } catch (e) {
              // Handle non-JSON data gracefully
            }
          }
        }
      }

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: Date.now().toString() + '-error',
        sender: 'ai',
        text: 'Error: Failed to get response from AI',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearMessages = () => {
    setMessages([]);
  };

  const formatMessage = (text: string) => {
    if (!text) return '';
    
    // Configure marked for better formatting
    marked.setOptions({
      breaks: true,
      gfm: true,
    });
    
    return marked.parse(text);
  };

  return (
    <div className="flex flex-col h-screen bg-black text-white font-mono">
      {/* Header */}
      <div className="border-b border-gray-800 p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-light tracking-wider text-center">AIKADABRA</h1>
          <p className="text-sm text-gray-400 mt-2 text-center tracking-widest">
            ANONYMOUS • UNCENSORED • MINIMAL
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.length === 0 && (
            <div className="text-center py-20">
              <div className="border border-gray-800 p-8 max-w-md mx-auto">
                <h2 className="text-xl mb-4">WELCOME TO AIKADABRA</h2>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Ask anything. No filters. No tracking. Pure anonymous conversation.
                  And support by buying some 9QS3JnXb6JsaND9hwzNm6HogiF9zWQ649UJ2omXDpump
                  or donating at D23zg61JvefsTiBucrXqQD1w5YxpinHVGTnfB9iLbC9Q
                </p>
                <div className="mt-6 border-t border-gray-800 pt-4">
                  <p className="text-xs text-gray-500">Type your message below to begin.</p>
                </div>
              </div>
            </div>
          )}
          
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-2xl ${
                  message.sender === 'user' ? 'ml-12' : 'mr-12'
                }`}
              >
                <div
                  className={`border ${
                    message.sender === 'user'
                      ? 'border-white bg-white text-black'
                      : 'border-gray-700 bg-gray-900'
                  } p-4`}
                >
                  <div 
                    className="text-sm leading-relaxed markdown-content"
                    dangerouslySetInnerHTML={{ 
                      __html: formatMessage(message.text) 
                    }}
                  />
                  <div className="mt-3 pt-3 border-t border-gray-700">
                    <p className="text-xs opacity-60">
                      {new Date(message.timestamp).toLocaleTimeString('en-US', {
                        hour12: false,
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                      {message.isStreaming && <span className="ml-2">typing...</span>}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-gray-800">
        <div className="max-w-4xl mx-auto p-4">
          <div className="flex space-x-3">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message... (Shift+Enter for new line)"
              className="flex-1 px-4 py-3 bg-black border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-white resize-none transition-colors"
              rows={2}
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={!input.trim() || isLoading}
              className="px-6 py-3 border border-white text-white hover:bg-white hover:text-black transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '...' : 'SEND'}
            </button>
          </div>
          
          {messages.length > 0 && (
            <button
              onClick={handleClearMessages}
              className="text-xs text-gray-500 hover:text-white transition-colors mt-3"
            >
              CLEAR CONVERSATION
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
