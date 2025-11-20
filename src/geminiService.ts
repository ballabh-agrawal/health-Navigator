
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY; 


if (!API_KEY || API_KEY === import.meta.env.VITE_GEMINI_API_KEY) { 
   console.error("Gemini API Key is missing or is still the placeholder in src/geminiService.ts. Please add your valid key.");
   
} else {
    
    console.log("Gemini API Key seems to be present.");
}



let genAI: GoogleGenerativeAI | null = null;
let model: any = null;

try {
   genAI = new GoogleGenerativeAI(API_KEY);
   model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-001",
   });
   console.log("GoogleGenerativeAI initialized successfully with model 'gemini-pro'.");
} catch (error) {
    console.error("Failed to initialize GoogleGenerativeAI. Check API Key validity and internet connection.", error);
}


const generationConfig = {
  temperature: 0.7, 
  topK: 1,
  topP: 1,
  maxOutputTokens: 2048, 
};


const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
 
];


export async function runChat(prompt: string): Promise<string> {
 
  if (!model) {
      return "Sorry, the AI service could not be initialized. Please check the API Key and console logs.";
  }
  try {
    const chat = model.startChat({
      generationConfig,
      safetySettings, 
      history: [ 
        { role: "user", parts: [{ text: `
            You are "HealthNav Assistant", an AI helper within a personalized health application.
            Your goal is to explain general health concepts, nutrition information, and fitness ideas clearly and simply, based on common knowledge.
            **Crucially, you MUST NOT provide medical diagnoses, treatment plans, interpretations of specific medical results (like exact blood report numbers), or personalized medical advice.**
            Always include a disclaimer like "Remember, this is general information and not medical advice. Consult your doctor for personal health concerns." if the user asks about conditions or specific health actions.
            Keep responses concise, friendly, and encouraging. Focus on general wellness education.
            ` }] },
        { role: "model", parts: [{ text: `Okay, I understand. I am HealthNav Assistant. I will explain general health, nutrition, and fitness concepts simply. I will absolutely avoid giving medical diagnoses or advice and will include a disclaimer when appropriate. How can I help you today?` }] },
      ],
    });

    console.log("Sending prompt to Gemini (with history/safety):", prompt);
    const result = await chat.sendMessage(prompt);
    const response = result.response;
    console.log("Gemini response received.");

    if (!response || response.promptFeedback?.blockReason) {
       console.warn("Gemini response blocked due to safety settings:", response?.promptFeedback);
       return `I cannot provide a response to that due to safety guidelines (${response?.promptFeedback?.blockReason || 'Unknown Reason'}). Could you ask something else?`;
    }

    if (typeof response.text !== 'function') {
        console.error("Gemini response format issue. No text function found:", response);
        return "Sorry, I received an unexpected response format from the AI service.";
    }

    const text = response.text();
    console.log("Gemini text:", text);
    return text;


} catch (error: any) { 
    console.error("Error calling Gemini API:", error); 

    let displayMessage = `Sorry, I encountered an error connecting to the AI service. Please try again later. (Details: Unknown error)`; // Default message
    const potentialMessage = error?.message;

    if (typeof potentialMessage === 'string') {
        const errorMessage = potentialMessage; // Now definitely a string
        displayMessage = `Sorry, I encountered an error connecting to the AI service. Please try again later. (Details: ${errorMessage})`; // Default if specific error not matched

        if (errorMessage.includes('API key not valid')) {
            displayMessage = "Sorry, there seems to be an issue with the AI configuration (Invalid API Key). Please double-check the key in geminiService.ts.";
        }
        else if (errorMessage.includes('[404') || errorMessage.includes('is not found')) {
             const modelName = model?.model || "the configured model";
             displayMessage = `Sorry, ${modelName} was not found. This might be due to regional availability or API key setup issues. (Error Details: ${errorMessage})`;
         }
        else if (errorMessage.includes('SAFETY')) {
           displayMessage = "The response was blocked due to safety guidelines. Please modify your request.";
        }
        else if (errorMessage.includes('[400') && errorMessage.includes('API key expired')) {
             displayMessage = "Sorry, your API key has expired. Please generate a new one in Google Cloud Console or AI Studio.";
        }
         else if (errorMessage.includes('[403') && errorMessage.includes('API_KEY_SERVICE_BLOCKED')) {
             displayMessage = "Sorry, access to the AI service is blocked for this API key. Please check the enabled APIs (like Vertex AI API or Generative Language API) in your Google Cloud project.";
         }
         else if (errorMessage.includes('[429') && errorMessage.includes('Resource exhausted')) {
             displayMessage = "Sorry, the AI service is temporarily unavailable due to high demand (Rate Limit Exceeded). Please wait a few moments and try again.";
         }
    } else {
        console.error("Caught error object without a standard string message:", error);
    }

    return displayMessage;
}
}