import React, { useState, useEffect, useRef } from 'react';
import type { UserProfile } from '../types';
import { IoChatbubbleEllipsesOutline, IoCloseOutline, IoSend } from 'react-icons/io5'; 
import { runChat } from '../geminiService'; 

interface Message {
  sender: 'user' | 'bot';
  text: string;
}

const Chatbot: React.FC<{ userProfile: UserProfile | null }> = ({ userProfile }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { sender: 'bot', text: "Hi! How can I help you with general health concepts today? (I cannot give medical advice.)" }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Ref for scrolling
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if(isOpen) {
        scrollToBottom();
    }
  }, [messages, isOpen]);


  const toggleChat = () => setIsOpen(!isOpen);

  const handleSend = async () => {
    const trimmedInput = inputText.trim();
    if (!trimmedInput) return;

    const userMessage: Message = { sender: 'user', text: trimmedInput };
    setMessages(prev => [...prev, userMessage]);
    setInputText(''); 
    setIsLoading(true); 

    let promptForApi = `User question: "${trimmedInput}"`;
    if (userProfile) {
      let context = "\n\nUser Context (for background info, do NOT diagnose based on this):\n";
      if (userProfile.conditions && userProfile.conditions.length > 0 && !userProfile.conditions.includes('None')) {
        context += `- Health Conditions: ${userProfile.conditions.join(', ')}\n`;
      }
      if (userProfile.goals && userProfile.goals.length > 0) {
        context += `- Health Goals: ${userProfile.goals.join(', ')}\n`;
      }
      
      if (context.length > 50) { 
           promptForApi += context;
      }
    }

    try {
      const botResponseText = await runChat(promptForApi);
      const botMessage: Message = { sender: 'bot', text: botResponseText };
      setMessages(prev => [...prev, botMessage]);

    } catch (error) {
       console.error("Chatbot caught unexpected error during runChat:", error);
       const errorMessage: Message = { sender: 'bot', text: "Sorry, an unexpected error occurred." };
       setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false); 
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };


  return (
    <>
      {}
      {}
      <button
        onClick={toggleChat}
        className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 z-50 transition-transform hover:scale-110"
        aria-label="Toggle Chatbot"
      >
        {isOpen ? <IoCloseOutline size={28} /> : <IoChatbubbleEllipsesOutline size={28} />}
      </button>

      {}
      {}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-80 sm:w-96 h-[450px] sm:h-[500px] bg-white rounded-lg shadow-xl border border-gray-200 flex flex-col z-40">
          {}
          <div className="bg-blue-600 text-white p-3 rounded-t-lg flex justify-between items-center flex-shrink-0">
            <h3 className="font-semibold text-base">AI Health Assistant</h3>
            <button onClick={toggleChat} className="text-white hover:text-gray-200">
              <IoCloseOutline size={24} />
            </button>
          </div>

          {}
          <div className="flex-grow p-4 overflow-y-auto space-y-3 bg-gray-50">
            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-2 px-3 rounded-lg text-sm shadow-sm ${msg.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-white text-gray-800 border border-gray-200'}`}>
                  {}
                  {msg.text.split('\n').map((line, i, arr) => (
                    <React.Fragment key={i}>
                      {line}
                      {i < arr.length - 1 && <br />}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            ))}
             {isLoading && (
                 <div className="flex justify-start">
                     <div className="max-w-[85%] p-2 px-3 rounded-lg text-sm bg-white text-gray-500 italic border border-gray-200 animate-pulse">
                         Thinking...
                     </div>
                 </div>
             )}
             {}
             <div ref={messagesEndRef} />
          </div>

          {}
          <div className="p-3 border-t border-gray-200 flex items-center bg-white rounded-b-lg flex-shrink-0">
            <input
              type="text"
              placeholder="Ask a question..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 disabled:bg-gray-100"
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !inputText.trim()}
              className="ml-2 p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
              aria-label="Send message"
            >
              <IoSend size={18} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;