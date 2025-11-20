// src/pages/Scanner.tsx
import React, { useState, useEffect } from 'react';
import type { ChangeEvent } from 'react'; // Correct type-only import
import { Link, useNavigate } from 'react-router-dom';
import Tesseract from 'tesseract.js';
import { auth, db } from '../firebaseConfig'; // Import auth and db
import { doc, getDoc, collection, addDoc } from 'firebase/firestore'; // Import Firestore functions
import { onAuthStateChanged } from 'firebase/auth'; // Correct import
import type { User } from 'firebase/auth'; // Correct type-only import
import type { UserProfile } from '../types'; // Import UserProfile from shared types file
import { runChat } from '../geminiService'; // Import Gemini function

// --- Define the structure for parsed nutrition data ---
interface NutritionData {
  calories?: string;
  totalFat?: string;
  saturatedFat?: string;
  transFat?: string;
  cholesterol?: string;
  sodium?: string;
  totalCarbohydrate?: string;
  dietaryFiber?: string;
  sugar?: string;
  protein?: string;
}

// --- Define the structure for the analysis result (now primarily holds AI text) ---
interface AnalysisResult {
  status: 'info' | 'error'; // Simplified status for AI response or error
  reason: string; // Will hold the AI's textual analysis or an error message
}

// --- Parsing Function ---
// (Includes previous refinements - might need more adjustments based on label variety)
function parseNutritionLabel(text: string): NutritionData {
  const nutrition: NutritionData = {};
  const extractValue = (pattern: RegExp): string | undefined => {
    const singleLineText = text.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ');
    const match = singleLineText.match(pattern);
    if (match && match[1]) {
      let value = match[1].trim()
                   .replace(/ O(?=[g])/ig, ' 0').replace(/o(?=[g])/ig, '0') // Og -> 0g
                   .replace(/ O(?=[p])/ig, ' 0').replace(/(\d)[pP]$/i, '$1g') // Op -> 0g
                   .replace(/\s*(?:KCAL|K\)|Calories)/i, '') // Remove calorie units
                   .replace(/\s*¢/,' ').trim(); // Treat ¢ as space

      // Add unit if just a number is extracted
      if (/^\d+(\.\d+)?$/.test(value)) {
          if (pattern.source.includes('Fat') || pattern.source.includes('Carbohydrate') || pattern.source.includes('Fiber') || pattern.source.includes('Sugar') || pattern.source.includes('Protein')) value += 'g';
          else if (pattern.source.includes('Cholesterol') || pattern.source.includes('Sodium')) value += 'mg';
      }
      value = value.replace(/(\d)(g|mg)$/i, '$1 $2'); // Ensure space before unit
      return value;
    }
    return undefined;
  };
  // Regex Patterns
  nutrition.calories = extractValue(/(?:Amount per serving|Calories)\s+([\d.]+)/i);
  nutrition.totalFat = extractValue(/Total Fat\s+([\d.,]+(?:g|mg)?|O[go])/i);
  nutrition.saturatedFat = extractValue(/Saturated Fat\s+([\d.,]+(?:g|mg)?|O[go])/i);
  nutrition.transFat = extractValue(/Trans Fat\s+([\d.,]+(?:g|mg)?|O[go])/i);
  nutrition.cholesterol = extractValue(/Cholesterol\s+([\d.,]+(?:g|mg)?|O[go])/i);
  nutrition.sodium = extractValue(/Sodium\s+([\d.,]+\s*¢?|\d+(?:g|mg)|O[go])/i);
  nutrition.totalCarbohydrate = extractValue(/Total Carbohydrate\s+([\d.,]+\s*¢?|\d+(?:g|mg)|O[go])/i);
  nutrition.dietaryFiber = extractValue(/Dietary Fiber\s+([\d.,]+(?:g|mg)?|O[go])/i);
  nutrition.sugar = extractValue(/(?:Total\s+)?Sugars?\s+([\d.,]+(?:g|mg)?|O[go])/i);
  nutrition.protein = extractValue(/Protein\s+([\d.,]+(?:g|mg)?|O[gp])/i);
  console.log("Parsed Nutrition:", nutrition);
  return nutrition;
}

// --- The Main Scanner Component ---
const Scanner: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrResultText, setOcrResultText] = useState<string | null>(null);
  const [ocrStatus, setOcrStatus] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedData, setParsedData] = useState<NutritionData | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null); // Holds AI response

  // --- Effect to check auth state and fetch profile ---
  useEffect(() => {
    setLoadingProfile(true);
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const profileDocRef = doc(db, "profiles", currentUser.uid);
        try {
          const docSnap = await getDoc(profileDocRef);
          if (docSnap.exists()) {
            setUserProfile(docSnap.data() as UserProfile);
            console.log("Scanner: Profile loaded");
          } else { /* ... handle no profile ... */
            setUserProfile(null); console.log("Scanner: No profile found.");
            alert("Please complete your profile first."); navigate('/questionnaire');
          }
        } catch (error) { /* ... handle error ... */
          console.error("Scanner: Error fetching profile:", error); setUserProfile(null);
        } finally { setLoadingProfile(false); }
      } else { /* ... handle logout ... */
        setUser(null); setUserProfile(null); setLoadingProfile(false); navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  // --- Handle file selection ---
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file.'); event.target.value = ''; setSelectedFile(null); return;
      }
      setSelectedFile(file);
      setOcrResultText(null); setOcrStatus(null); setParsedData(null);
      setAnalysisResult(null); setOcrProgress(0); // Reset everything
    }
  };

  // --- Handle OCR, parsing, and AI ANALYSIS ---
  const handleProcessLabel = async () => {
    if (!selectedFile || !user || loadingProfile || !userProfile) {
        alert("Please select a file and ensure your profile is loaded."); return;
    }

    setIsProcessing(true); setOcrStatus(`Processing "${selectedFile.name}"...`);
    setOcrResultText(null); setParsedData(null); setAnalysisResult(null); setOcrProgress(0);

    try {
      // --- OCR ---
      const { data: { text } } = await Tesseract.recognize(
        selectedFile, 'eng', { logger: m => {
          console.log(m); if (m.status === 'recognizing text') setOcrProgress(Math.round(m.progress * 100));
        }}
      );
      setOcrResultText(text); setOcrProgress(100); setOcrStatus(`Parsing complete.`);

      // --- PARSE ---
      const nutritionData = parseNutritionLabel(text);
      setParsedData(nutritionData);

      // --- ANALYZE WITH GEMINI ---
      if (nutritionData && Object.values(nutritionData).some(v => v)) {
            setAnalysisResult({ status: 'info', reason: 'Generating AI analysis...' }); // Show AI loading
            const nutritionString = Object.entries(nutritionData).filter(([_, value]) => value)
                                        .map(([key, value]) => `- ${key.replace(/([A-Z])/g, ' $1').trim()}: ${value}`).join('\n');
            const profileString = `User Context:\n- Conditions: ${userProfile.conditions.join(', ') || 'None'}\n- Goals: ${userProfile.goals.join(', ') || 'None'}`;
            const prompt = `Analyze the nutritional info: \n${nutritionString}\n based on user context: \n${profileString}\n Is it suitable? Explain concerns (sodium, sugar etc.) related to profile simply (2-3 sentences). Add disclaimer. NO medical advice.`;

            const aiAnalysisText = await runChat(prompt); // Call Gemini
            setAnalysisResult({ status: 'info', reason: aiAnalysisText }); // Store AI response
            setOcrStatus(`AI analysis complete.`);
      } else {
            setAnalysisResult({ status: 'info', reason: 'Could not parse data for AI analysis.' });
            setOcrStatus(`Could not parse nutrition data.`);
      }
      // --- END GEMINI ---

      // --- TODO: Optionally save scan history ---

    } catch (error) { /* ... keep error handling ... */
        console.error("Error during processing:", error);
        setOcrStatus("Error processing image.");
        setOcrResultText(null); setParsedData(null);
        setAnalysisResult({ status: 'error', reason: 'An error occurred during analysis.' });
        setOcrProgress(0); alert("An error occurred. Check console.");
    } finally {
      setIsProcessing(false);
      const fileInput = document.getElementById('labelFile') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    }
  };

  // --- Helper to get color (Simplified for AI response) ---
  const getStatusColorClasses = (status?: AnalysisResult['status']): string => {
      // Basic styling for info/error display
      if (status === 'error') return 'border-red-500 bg-red-50 text-red-800';
      return 'border-blue-500 bg-blue-50 text-blue-800'; // Default to 'info' style
  };

  return (
    // Outer container
    <div className="container mx-auto py-12 md:py-20 px-4">
      <div className="max-w-xl mx-auto">

        {/* --- 1. Scanner Input Section --- */}
        <div className="bg-white p-8 rounded-lg shadow-lg border border-gray-200 text-center">
           {/* ... Title, Description, File Input, Process Button ... */}
           <h1 className="text-3xl font-bold text-gray-900 mb-4">Product Scanner</h1>
           <p className="text-gray-600 mb-6">Upload a clear picture of a product's nutrition label.</p>
           {/* File Input */}
           <div className="mb-4">
             <label htmlFor="labelFile" className="block text-sm font-medium text-gray-700 mb-1">Select Label Image:</label>
             <input type="file" id="labelFile" accept="image/*" onChange={handleFileChange}
               className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 disabled:opacity-50 cursor-pointer"
               disabled={isProcessing || loadingProfile} />
             {selectedFile && !isProcessing && <p className="text-xs text-gray-500 mt-1">Ready: {selectedFile.name}</p>}
             {loadingProfile && <p className="text-xs text-blue-500 mt-1 animate-pulse">Loading profile...</p>}
           </div>
           {/* Process Button */}
           <button onClick={handleProcessLabel} disabled={!selectedFile || isProcessing || loadingProfile || !userProfile}
             className="w-full py-3 px-4 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed">
             {isProcessing ? `Processing... (${ocrProgress}%)` : 'Analyze Label Image'}
           </button>
           {/* Display OCR Status */}
           {ocrStatus && (
             <div className="mt-4 p-3 bg-gray-50 border rounded-md text-sm text-gray-700">
               <strong>Status:</strong> {ocrStatus}
               {isProcessing && ocrProgress > 0 && ocrProgress < 100 && (
                 <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2"><div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${ocrProgress}%` }}></div></div>
               )}
             </div>
           )}
        </div>

        {/* --- 2. Results Section (Shows AI ANALYSIS) --- */}
        {analysisResult && !isProcessing && (
          <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200 mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">AI Analysis</h2>

            {/* AI Analysis Box */}
            <div className={`border-l-4 p-4 rounded-md mb-6 ${getStatusColorClasses(analysisResult.status)}`}>
              <h3 className={`font-semibold text-lg ${getStatusColorClasses(analysisResult.status).split(' ')[2]}`}>AI Insight:</h3>
              {/* Render AI response with line breaks */}
              <p className={`text-sm mt-1 whitespace-pre-wrap ${getStatusColorClasses(analysisResult.status).split(' ')[2]}`}>
                 {analysisResult.reason.split('\n').map((line, i, arr) => (
                    <React.Fragment key={i}>{line}{i < arr.length - 1 && <br />}</React.Fragment>
                 ))}
              </p>
            </div>

             {/* Display Parsed Data (if available) */}
             {parsedData && Object.values(parsedData).some(v => v) && (
                <div className="space-y-2 mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 border-b pb-1 mb-3">Extracted Values (per serving):</h3>
                    {Object.entries(parsedData).map(([key, value]) => value ? (
                        <div key={key} className="flex justify-between text-sm py-1 border-b border-gray-100">
                           <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                           <span className="font-medium text-gray-900">{value}</span>
                        </div>
                    ) : null )}
                </div>
             )}

            {/* Optionally display Raw Text */}
             {ocrResultText && (
                <details className="mt-4 text-xs text-gray-500 cursor-pointer">
                    <summary className="font-medium hover:underline focus:outline-none">Show Raw OCR Text</summary>
                    <pre className="mt-2 bg-gray-50 p-2 rounded border max-h-40 overflow-auto whitespace-pre-wrap break-words">
                      {ocrResultText}
                    </pre>
                </details>
             )}

            <Link to="/dashboard" className="block w-full text-center mt-6 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300">
              Back to Dashboard
            </Link>
          </div>
        )}

        {/* Link back to dashboard if nothing is shown */}
        {!analysisResult && !isProcessing && selectedFile === null && !loadingProfile &&(
           <div className='text-center mt-8'><Link to="/dashboard" className="text-sm text-blue-600 hover:underline">Return to Dashboard</Link></div>
        )}

      </div>
    </div>
  );
};

export default Scanner;