// src/pages/Scanner.tsx
import React, { useState, useEffect } from 'react';
import type { ChangeEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db } from '../firebaseConfig';
import { doc, getDoc, collection, addDoc } from 'firebase/firestore'; // Added collection, addDoc
import { onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import type { UserProfile } from '../types';

// --- HELPER FUNCTIONS ---
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

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
    conditions: profile.conditions || [],
    medications: profile.medications || [],
    family_history: profile.familyHistory || [],
    checkup_frequency: profile.checkupFrequency || "Unknown",
    goals: profile.goals || [],
    consent: profile.consent
  };
};

// --- COMPONENT ---
const Scanner: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<{ status: 'info' | 'error', reason: string } | null>(null);

  // Auth Check
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
          } else {
            setUserProfile(null);
            alert("Please complete your profile first.");
            navigate('/questionnaire');
          }
        } catch (error) {
          console.error("Error fetching profile:", error);
        } finally {
          setLoadingProfile(false);
        }
      } else {
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file.');
        return;
      }
      setSelectedFile(file);
      setStatusMessage(null);
      setAnalysisResult(null);
    }
  };

  const handleProcessLabel = async () => {
    if (!selectedFile || !user || !userProfile) return;

    setIsProcessing(true);
    setStatusMessage("Sending to Health Agent (Gemini 3)...");
    setAnalysisResult(null);

    try {
      const base64Image = await fileToBase64(selectedFile);
      const backendProfile = mapProfileToBackend(userProfile);

      // 1. Call Python Backend
      const response = await fetch('http://localhost:8000/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_data: base64Image,
          user_profile: backendProfile
        }),
      });

      if (!response.ok) throw new Error(`Server Error: ${response.statusText}`);
      const data = await response.json();
      
      // 2. Set Result in UI
      const resultText = data.analysis;
      setAnalysisResult({ status: 'info', reason: resultText });
      setStatusMessage("Analysis complete.");

      // 3. NEW: Save to Firestore History
      try {
        const reportsRef = collection(db, `profiles/${user.uid}/reports`);
        await addDoc(reportsRef, {
            uploadedAt: new Date(),
            fileName: selectedFile.name,
            reportType: "Agent Analysis", // Generic type for Food or Blood
            aiInsight: resultText,
            rawText: "Processed by Agentic Backend" 
        });
        console.log("Saved to history!");
      } catch (e) {
        console.error("Could not save history:", e);
      }

    } catch (error) {
        console.error("Agent Error:", error);
        setAnalysisResult({ status: 'error', reason: 'Failed to reach the AI Agent.' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container mx-auto py-12 md:py-20 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white p-8 rounded-lg shadow-lg border border-gray-200 text-center">
           <h1 className="text-3xl font-bold text-gray-900 mb-4">Health Scanner</h1>
           <p className="text-gray-600 mb-6">
             Upload a <strong>Food Label</strong> or a <strong>Blood Test Report</strong>. 
             <br/>Our AI Agent will analyze it based on your health profile.
           </p>
           
           <div className="mb-4">
             <input type="file" accept="image/*" onChange={handleFileChange}
               className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
               disabled={isProcessing} />
           </div>

           <button onClick={handleProcessLabel} disabled={!selectedFile || isProcessing}
             className="w-full py-3 px-4 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 disabled:opacity-50">
             {isProcessing ? 'Agent is thinking...' : 'Analyze Image'}
           </button>

           {analysisResult && (
             <div className="mt-8 bg-blue-50 border-l-4 border-blue-500 p-4 text-left">
               <h3 className="font-bold text-blue-800">Agent Analysis:</h3>
               <p className="mt-2 text-gray-800 whitespace-pre-wrap">{analysisResult.reason}</p>
             </div>
           )}
           
           <Link to="/dashboard" className="block mt-6 text-blue-600 hover:underline">Back to Dashboard</Link>
        </div>
      </div>
    </div>
  );
};

export default Scanner;