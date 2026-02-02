import React, { useState, useEffect, useRef } from 'react';
import type { UserProfile } from '../types';
import { IoChatbubbleEllipsesOutline, IoCloseOutline, IoSend } from 'react-icons/io5'; 
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// --- 1. HELPER: Map Profile (Needed for the Backend) ---
// --- 1. HELPER: Map Profile (Safer Version) ---
const mapProfileToBackend = (profile: UserProfile) => {
  return {
    full_name: profile.fullName || "User",
    age_group: profile.ageGroup || "Unknown",
    gender: profile.gender || "Unknown",
    height: profile.height || "Unknown",
    weight: profile.weight || "Unknown",
    activity_level: profile.activityLevel || "Unknown",
    diet: profile.diet || "Unknown",
    water_intake: profile.waterIntake || "Unknown",
    smoke: profile.smoke || "Unknown",
    alcohol: profile.alcohol || "Unknown",
    sleep_hours: profile.sleepHours || "Unknown",
    
    // --- CRITICAL FIX: Ensure these are Arrays, never null ---
    conditions: profile.conditions || [],
    medications: profile.medications || [],
    family_history: profile.familyHistory || [],
    goals: profile.goals || [],
    
    checkup_frequency: profile.checkupFrequency || "Unknown",
    consent: profile.consent
  };
};
interface Message {
  sender: 'user' | 'bot';
  text: string;
}

// Accepts userProfile. selectedFile is OPTIONAL (only passed if used in Scanner)
const Chatbot: React.FC<{ userProfile: UserProfile | null, selectedFile?: File | null }> = ({ userProfile, selectedFile }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { sender: 'bot', text: "Hi! I'm your Health Agent running on Gemini 3. Ask me anything!" }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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

  // --- 2. UPDATED: Send to Python Backend instead of geminiService ---
  const handleSend = async () => {
    const trimmedInput = inputText.trim();
    if (!trimmedInput) return;

    // A. Update UI immediately
    const userMessage: Message = { sender: 'user', text: trimmedInput };
    setMessages(prev => [...prev, userMessage]);
    setInputText(''); 
    setIsLoading(true); 

    try {
      // B. Prepare Data
      if (!userProfile) {
         // If no profile is loaded yet, handle gracefully
         console.warn("UserProfile is null");
      }
      
      const backendProfile = userProfile ? mapProfileToBackend(userProfile) : null;

      // Helper: Convert Image if it exists (Scanner Page), else null (Dashboard)
      let base64Image = null;
      if (selectedFile) {
          const reader = new FileReader();
          base64Image = await new Promise((resolve) => {
              reader.readAsDataURL(selectedFile);
              reader.onload = () => resolve(reader.result);
          });
      }

      // C. Call Python Agent
      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_data: base64Image, // Will be null on Dashboard, base64 on Scanner
          user_profile: backendProfile,
          history: messages.map(m => ({ 
              role: m.sender === 'user' ? 'user' : 'assistant', 
              content: m.text 
          })), 
          question: trimmedInput
        }),
      });

      if (!response.ok) throw new Error(`Agent Error: ${response.statusText}`);
      
      const data = await response.json();

      // D. Add Agent Response
      const botMessage: Message = { sender: 'bot', text: data.reply };
      setMessages(prev => [...prev, botMessage]);

    } catch (error) {
       console.error("Chat Error:", error);
       const errorMessage: Message = { sender: 'bot', text: "I'm having trouble connecting to the Agent right now. Please ensure the backend is running." };
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
      <button
        onClick={toggleChat}
        className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 z-50 transition-transform hover:scale-110"
      >
        {isOpen ? <IoCloseOutline size={28} /> : <IoChatbubbleEllipsesOutline size={28} />}
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 w-80 sm:w-96 h-[450px] sm:h-[500px] bg-white rounded-lg shadow-xl border border-gray-200 flex flex-col z-40">
          <div className="bg-blue-600 text-white p-3 rounded-t-lg flex justify-between items-center flex-shrink-0">
            <h3 className="font-semibold text-base">Health Agent</h3>
            <button onClick={toggleChat} className="text-white hover:text-gray-200">
              <IoCloseOutline size={24} />
            </button>
          </div>

          <div className="flex-grow p-4 overflow-y-auto space-y-3 bg-gray-50">
            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-2 px-3 rounded-lg text-sm shadow-sm ${msg.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-white text-gray-800 border border-gray-200'}`}>
                  
                  {/* --- REPLACED SECTION START --- */}
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    className={`prose prose-sm max-w-none ${msg.sender === 'user' ? 'text-white' : 'text-gray-800'}`}
                    components={{
                      // Style links
                      a: ({node, ...props}) => (
                        <a {...props} className={`underline ${msg.sender === 'user' ? 'text-blue-100 hover:text-white' : 'text-blue-600 hover:text-blue-800'}`} target="_blank" rel="noopener noreferrer" />
                      ),
                      // Style lists
                      ul: ({node, ...props}) => <ul {...props} className="list-disc ml-4 my-1" />,
                      ol: ({node, ...props}) => <ol {...props} className="list-decimal ml-4 my-1" />,
                      // Style bold
                      strong: ({node, ...props}) => <span {...props} className="font-bold" />,
                      // Handle line breaks in paragraphs
                      p: ({node, ...props}) => <p {...props} className="mb-1 last:mb-0" />
                    }}
                  >
                    {msg.text}
                  </ReactMarkdown>
                  {/* --- REPLACED SECTION END --- */}

                </div>
              </div>
            ))}
             {isLoading && (
                 <div className="flex justify-start">
                     <div className="max-w-[85%] p-2 px-3 rounded-lg text-sm bg-white text-gray-500 italic border border-gray-200 animate-pulse">
                         Agent is thinking...
                     </div>
                 </div>
             )}
             <div ref={messagesEndRef} />
          </div>

          <div className="p-3 border-t border-gray-200 flex items-center bg-white rounded-b-lg flex-shrink-0">
            <input
              type="text"
              placeholder="Ask about your health..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 text-sm"
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !inputText.trim()}
              className="ml-2 p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
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