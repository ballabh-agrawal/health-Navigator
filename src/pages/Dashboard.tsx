import React, { useState, useEffect } from 'react';
import type { ChangeEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Tesseract from 'tesseract.js';
import { auth, db } from '../firebaseConfig';
import { doc, getDoc, setDoc, collection, addDoc, query, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import Chatbot from '../components/Chatbot';
import type { UserProfile } from '../types';
import { runChat } from '../geminiService';

const MetricCard = ({ title, value, unit }: { title: string, value: string, unit: string }) => (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <p className="text-3xl font-bold text-gray-900 mt-1">
            {value} <span className="text-lg font-normal text-gray-700">{unit}</span>
        </p>
    </div>
);

const InsightCard = ({ title, text, color }: { title: string, text: string, color: string }) => (
    <div className={`border-l-4 ${color} bg-white p-4 rounded-md shadow-sm border border-gray-200`}>
        <h4 className="font-semibold text-gray-800">{title}</h4>
        <p className="text-gray-600 mt-1 text-sm">{text}</p>
    </div>
);

interface BloodReportData {
    Haemoglobin?: string; TotalLeucocyteCount?: string; Neutrophils?: string; Lymphocytes?: string;
    Eosinophils?: string; Monocytes?: string; Basophils?: string; AbsoluteNeutrophils?: string;
    AbsoluteLymphocytes?: string; AbsoluteEosinophils?: string; AbsoluteMonocytes?: string;
    AbsoluteBasophils?: string; TotalRedBloodCount?: string; Hematocrit?: string; MCV?: string;
    MCH?: string; Platelet?: string; MCHC?: string; RDWCv?: string; MPV?: string;
}

function parseBloodReport(text: string): BloodReportData {
    const reportData: BloodReportData = {};
    const cleanedText = text.replace(/\s+/g, ' ').trim();
    const extractValue = (keyword: string, textToSearch: string): string | undefined => {
        const regex = new RegExp(keyword.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '\\s*([\\d.:]+)', 'i');
        const match = textToSearch.match(regex);
        if (match && match[1]) {
            let value = match[1].replace(/:/g, '.').trim();
            if(value.endsWith('.')) value = value.slice(0, -1);
            if (/^\d+(\.\d+)?$/.test(value)) return value;
            else {
                console.warn(`Parsing issue for ${keyword}. Found: "${match[1]}", Cleaned: "${value}"`);
                const numericPart = value.match(/^(\d+(\.\d+)?)/);
                if(numericPart && numericPart[1]) return numericPart[1];
                return undefined;
            }
        }
        console.warn(`Keyword "${keyword}" not found.`);
        return undefined;
    };
    reportData.Haemoglobin = extractValue("Haemoglobin", cleanedText);
    reportData.TotalLeucocyteCount = extractValue("Total Leukocyte Count", cleanedText);
    reportData.Neutrophils = extractValue("Neutrophils", cleanedText);
    reportData.Lymphocytes = extractValue("Lymphocytes", cleanedText);
    reportData.Eosinophils = extractValue("Eosinophils", cleanedText);
    reportData.Monocytes = extractValue("Monocytes", cleanedText);
    reportData.Basophils = extractValue("Basophis", cleanedText);
    reportData.AbsoluteNeutrophils = extractValue("Absolute Neutrophils", cleanedText);
    reportData.AbsoluteLymphocytes = extractValue("Absolute Lymphocytes", cleanedText);
    reportData.AbsoluteEosinophils = extractValue("Absolute Eosinophils", cleanedText);
    reportData.AbsoluteMonocytes = extractValue("oss", cleanedText) || extractValue("Absolute Monocytes", cleanedText) ;
    reportData.AbsoluteBasophils = extractValue("Absolute Basophils", cleanedText);
    reportData.TotalRedBloodCount = extractValue("Total Red Blood Count", cleanedText) || extractValue("Count\\s+(\\d+(\\.\\d+)?)", cleanedText);
    reportData.Hematocrit = extractValue("Hematoct", cleanedText);
    reportData.MCV = extractValue("mov", cleanedText);
    reportData.MCH = extractValue("MeH", cleanedText);
    reportData.Platelet = extractValue("Platelet", cleanedText);
    reportData.MCHC = extractValue("MeHe", cleanedText);
    reportData.RDWCv = extractValue("ROW-CV", cleanedText);
    reportData.MPV = extractValue("wey", cleanedText);
    console.log("Parsed Blood Report Data:", reportData);
    return reportData;
}

interface ReportListItem {
    id: string; fileName: string; uploadedAt: Date; reportType: string;
}

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [ocrProgress, setOcrProgress] = useState(0);
    const [ocrStatus, setOcrStatus] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [aiReportInsight, setAiReportInsight] = useState<string | null>(null);
    const [pastReports, setPastReports] = useState<ReportListItem[]>([]);
    const [loadingReports, setLoadingReports] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                setLoading(true); setPastReports([]);
                const profileDocRef = doc(db, "profiles", currentUser.uid);
                let profileExists = false;
                try {
                    const docSnap = await getDoc(profileDocRef);
                    if (docSnap.exists()) { setProfile(docSnap.data() as UserProfile); profileExists = true; }
                    else { setProfile(null); console.log("No profile found."); }
                } catch (error) { console.error("Error fetching profile:", error); setProfile(null); }
                finally { setLoading(false); }

                if (currentUser) {
                    setLoadingReports(true);
                    try {
                        const reportsCollectionRef = collection(db, `profiles/${currentUser.uid}/reports`);
                        const q = query(reportsCollectionRef, orderBy("uploadedAt", "desc"));
                        const querySnapshot = await getDocs(q);
                        const reportsList = querySnapshot.docs.map(doc => {
                           const data = doc.data();
                           const uploadedAtDate = data.uploadedAt instanceof Timestamp ? data.uploadedAt.toDate() : new Date();
                           return { id: doc.id, fileName: data.fileName || 'Unknown', uploadedAt: uploadedAtDate, reportType: data.reportType || 'Unknown' };
                        });
                        setPastReports(reportsList); console.log("Fetched reports:", reportsList.length);
                    } catch (error) { console.error("Error fetching reports:", error); setPastReports([]); }
                    finally { setLoadingReports(false); }
                }
            } else { setUser(null); setProfile(null); setLoading(false); setPastReports([]); navigate('/login'); }
        });
        return () => unsubscribe();
    }, [navigate]);

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            if (!file.type.startsWith('image/')) {
                alert('Please select an image file.'); event.target.value = ''; setSelectedFile(null); return;
            }
            setSelectedFile(file); setOcrStatus(null); setAiReportInsight(null); setOcrProgress(0);
        }
    };

    const handleProcessImage = async () => {
        if (!selectedFile || !user) return;
        setIsProcessing(true); setOcrStatus(`Processing "${selectedFile.name}"...`);
        setOcrProgress(0); setAiReportInsight(null);
        try {
            const { data: { text } } = await Tesseract.recognize( selectedFile, 'eng', { logger: m => { if (m.status === 'recognizing text') setOcrProgress(Math.round(m.progress * 100)); }});
            setOcrStatus(`OCR complete.`); setOcrProgress(100);
            const extractedValuesRaw = parseBloodReport(text);
            const extractedValuesForFirestore: { [key: string]: string } = {};
            for (const key in extractedValuesRaw) { if (extractedValuesRaw[key as keyof BloodReportData] !== undefined) extractedValuesForFirestore[key] = extractedValuesRaw[key as keyof BloodReportData]!; }
            console.log("Saving values:", extractedValuesForFirestore);
            const reportsCollectionRef = collection(db, `profiles/${user.uid}/reports`);
            await addDoc(reportsCollectionRef, { uploadedAt: new Date(), fileName: selectedFile.name, reportType: "Blood Report", rawText: text, extractedValues: extractedValuesForFirestore });
            setOcrStatus(`Report processed and saved.`);
            if (user) {
                 setLoadingReports(true);
                 const reportsCollectionRefetch = collection(db, `profiles/${user.uid}/reports`);
                 const qRefetch = query(reportsCollectionRefetch, orderBy("uploadedAt", "desc"));
                 const querySnapshotRefetch = await getDocs(qRefetch);
                 const reportsListRefetch = querySnapshotRefetch.docs.map(doc => ({ id: doc.id, fileName: doc.data().fileName || 'Unknown', uploadedAt: doc.data().uploadedAt instanceof Timestamp ? doc.data().uploadedAt.toDate() : new Date(), reportType: doc.data().reportType || 'Unknown' }));
                 setPastReports(reportsListRefetch); setLoadingReports(false);
             }
            if (Object.keys(extractedValuesForFirestore).length > 0) {
                setAiReportInsight("Generating AI insight...");
                const valuesString = Object.entries(extractedValuesForFirestore).map(([key, value]) => `- ${key.replace(/([A-Z])/g, ' $1').trim()}: ${value}`).join('\n');
                const prompt = `Analyze these blood report values: \n${valuesString}\nExplain 1-2 key results simply. Give one general wellness tip. DO NOT diagnose or give medical advice. Start with "Based on extracted values:" End with disclaimer. User Context: ${profile ? `Conditions: ${profile.conditions.join(', ')}, Goals: ${profile.goals.join(', ')}` : 'N/A'}`;
                const insight = await runChat(prompt); setAiReportInsight(insight);
            } else { setAiReportInsight("Could not extract values for AI insight."); }
        } catch (error) { console.error("Error during processing:", error); setOcrStatus("Error during processing."); setAiReportInsight("Failed to generate AI insight."); setOcrProgress(0); alert("An error occurred."); }
        finally { setIsProcessing(false); setSelectedFile(null); const fileInput = document.getElementById('reportFile') as HTMLInputElement; if (fileInput) fileInput.value = ''; }
    };

    if (loading) { return ( <div className="container mx-auto py-8 px-4 text-center"><p>Loading...</p></div> ); }
    if (user && !profile && !loading) { return ( <div className="container mx-auto py-8 px-4 text-center"><h1 className="text-2xl font-bold mb-4">Welcome!</h1><p className="mb-6">Please complete your profile questionnaire first.</p><Link to="/questionnaire" className="px-6 py-2 bg-blue-600 text-white rounded-lg">Go to Questionnaire</Link></div>); }

    const formatDate = (date: Date): string => { return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); }

    return (
        <div className="container mx-auto py-8 px-4">
            <section className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Welcome back, {profile?.fullName || 'User'}!</h1>
                <p className="text-lg text-gray-600 mt-1"> Your goals: <span className="font-semibold text-blue-600">{profile?.goals?.join(', ') || 'Not set'}</span></p>
            </section>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <section>
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Quick Stats</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                           <MetricCard title="Last Blood Sugar" value="94" unit="mg/dL" />
                           <MetricCard title="Cholesterol (LDL)" value="112" unit="mg/dL" />
                           <MetricCard title="Daily Steps" value="4,280" unit="steps" />
                        </div>
                    </section>
                    <section className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">Upload & Process Report</h2>
                        <div className="mb-4">
                           <label htmlFor="reportFile" className="block text-sm font-medium text-gray-700 mb-1">Select Report Image (PNG, JPG):</label>
                           <input type="file" id="reportFile" accept="image/*" onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50 cursor-pointer" disabled={isProcessing} />
                           {selectedFile && !isProcessing && <p className="text-xs text-gray-500 mt-1">Selected: {selectedFile.name}</p>}
                        </div>
                        <button onClick={handleProcessImage} disabled={!selectedFile || isProcessing} className="w-full sm:w-auto px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                            {isProcessing ? `Processing... (${ocrProgress}%)` : 'Process Report Image'}
                        </button>
                        {ocrStatus && (
                            <div className="mt-4 p-3 bg-gray-50 border rounded-md text-sm text-gray-700">
                               <strong>Status:</strong> {ocrStatus}
                               {isProcessing && ocrProgress > 0 && ocrProgress < 100 && ( <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2"><div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${ocrProgress}%` }}></div></div>)}
                            </div>
                        )}
                         {aiReportInsight && (
                            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md text-sm">
                               <h4 className="font-semibold text-blue-800 mb-2">AI Generated Insight:</h4>
                               <div className="text-blue-900 whitespace-pre-wrap">
                                   {typeof aiReportInsight === 'string' ? aiReportInsight.split('\n').map((line, i, arr) => ( <React.Fragment key={i}>{line}{i < arr.length - 1 && <br />}</React.Fragment> )) : aiReportInsight}
                               </div>
                            </div>
                         )}
                        <div className="mt-6 pt-4 border-t border-gray-200">
                           <h3 className="text-lg font-medium text-gray-800 mb-3">Past Reports</h3>
                           {loadingReports && <p className="text-sm text-gray-500 italic">Loading reports...</p>}
                           {!loadingReports && pastReports.length === 0 && ( <p className="text-sm text-gray-500">No reports uploaded yet.</p> )}
                           {!loadingReports && pastReports.length > 0 && (
                                <div className="space-y-2">
                                    {pastReports.map(report => (
                                        <div key={report.id} className="flex flex-col sm:flex-row justify-between p-3 bg-gray-50 rounded-md border items-start sm:items-center hover:bg-gray-100">
                                            <div className='flex-grow mb-1 sm:mb-0'>
                                                <span className="font-medium text-gray-700 text-sm block sm:inline">{report.fileName}</span>
                                                <span className="text-xs text-gray-500 block sm:inline sm:ml-2">({report.reportType})</span>
                                            </div>
                                             <span className="text-xs text-gray-500 w-full sm:w-auto text-left sm:text-right mb-1 sm:mb-0 sm:mx-4"> {formatDate(report.uploadedAt)} </span>
                                            <button onClick={() => alert(`Viewing details for ${report.fileName}\nID: ${report.id}`)} className="text-xs text-blue-600 font-medium hover:underline bg-blue-100 px-2 py-1 rounded w-full sm:w-auto"> View Details </button>
                                        </div>
                                    ))}
                                </div>
                           )}
                         </div>
                    </section>
                </div>
                <div className="lg:col-span-1 space-y-6">
                    <section>
                         <h2 className="text-xl font-semibold text-gray-800 mb-4">General Tips</h2>
                         <div className="space-y-4">
                           <InsightCard title="Stay Active! 👍" text="Aim for 30 mins activity most days." color="border-green-500" />
                           <InsightCard title="Hydration Reminder 💧" text="Drink plenty of water daily." color="border-blue-500" />
                         </div>
                    </section>
                    <section className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                         <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
                         <div className="flex flex-col space-y-3">
                             <Link to="/scanner" className="w-full text-center px-4 py-3 bg-indigo-100 text-indigo-700 rounded-lg font-semibold hover:bg-indigo-200 text-sm">Scan a Food Product</Link>
                             <Link to="/questionnaire" className="w-full text-center px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 text-sm">Update Your Health Profile</Link>
                         </div>
                    </section>
                </div>
            </div>
            <Chatbot userProfile={profile} />
        </div>
    );
};

export default Dashboard;