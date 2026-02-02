import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db } from '../firebaseConfig';
import { doc, getDoc, collection, query, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import Chatbot from '../components/Chatbot';
import type { UserProfile } from '../types';

// --- 1. HEALTH SCORE ALGORITHM ---
const calculateHealthScore = (profile: UserProfile | null): { score: string, color: string } => {
  if (!profile) return { score: "0", color: "text-gray-500" };

  let score = 50; // Base score

  // Scoring Logic
  const sleep = profile.sleepHours || "";
  if (sleep.includes("7") || sleep.includes("8") || sleep.includes("6-8")) score += 10;
  
  const water = profile.waterIntake || "";
  if (water.includes("3") || water.includes("4") || water.includes("2-3")) score += 10;

  const activity = profile.activityLevel || "";
  if (activity.toLowerCase().includes("moderate") || activity.toLowerCase().includes("active")) score += 10;

  const smoke = profile.smoke || "";
  if (smoke.toLowerCase() === "no" || smoke.toLowerCase() === "never") score += 10;

  const alcohol = profile.alcohol || "";
  if (alcohol.toLowerCase() === "none" || alcohol.toLowerCase() === "occasional") score += 10;

  if (score > 100) score = 100;

  // Color Logic
  let color = "text-red-600";
  if (score > 75) color = "text-green-600";
  else if (score > 60) color = "text-yellow-600";

  return { score: score.toString(), color };
};

// --- 2. DAILY TIPS GENERATOR ---
const getDailyTip = () => {
    const tips = [
        "hydration: Drinking 500ml of water before meals can boost metabolism by 30%.",
        "sleep: Poor sleep can disrupt hormones that regulate appetite. Aim for 7-8 hours.",
        "movement: A 10-minute walk after eating helps lower blood sugar spikes.",
        "stress: 5 minutes of deep breathing can lower cortisol levels significantly.",
        "food: Eating fiber-rich foods first can reduce glucose absorption."
    ];
    // Pick a random tip based on the day of the month (so it stays same for the whole day)
    const dayIndex = new Date().getDate() % tips.length;
    return tips[dayIndex];
};

// --- 3. COMPONENTS ---
const MetricCard = ({ title, value, unit, valueColor = "text-gray-900" }: { title: string, value: string, unit: string, valueColor?: string }) => (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 transition-transform hover:scale-105">
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">{title}</h3>
        <p className={`text-3xl font-bold mt-2 ${valueColor}`}>
            {value} <span className="text-lg font-normal text-gray-500">{unit}</span>
        </p>
    </div>
);

interface ReportListItem {
    id: string; fileName: string; uploadedAt: Date; aiInsight?: string;
}

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [pastReports, setPastReports] = useState<ReportListItem[]>([]);
    const [loadingReports, setLoadingReports] = useState(false);
    const [dailyTip, setDailyTip] = useState("");

    useEffect(() => {
        setDailyTip(getDailyTip());
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                setLoading(true);
                
                // Fetch Profile
                try {
                    const docSnap = await getDoc(doc(db, "profiles", currentUser.uid));
                    if (docSnap.exists()) setProfile(docSnap.data() as UserProfile);
                } catch (e) { console.error("Profile Error", e); }
                finally { setLoading(false); }

                // Fetch History
                setLoadingReports(true);
                try {
                    const q = query(collection(db, `profiles/${currentUser.uid}/reports`), orderBy("uploadedAt", "desc"));
                    const querySnapshot = await getDocs(q);
                    const list = querySnapshot.docs.map(doc => {
                        const data = doc.data();
                        return {
                            id: doc.id,
                            fileName: data.fileName || 'Scan',
                            uploadedAt: data.uploadedAt instanceof Timestamp ? data.uploadedAt.toDate() : new Date(),
                            aiInsight: data.aiInsight || ''
                        };
                    });
                    setPastReports(list);
                } catch (e) { console.error("Reports Error", e); }
                finally { setLoadingReports(false); }
                
            } else {
                navigate('/login');
            }
        });
        return () => unsubscribe();
    }, [navigate]);

    if (loading) return <div className="flex h-screen items-center justify-center text-gray-500">Loading Dashboard...</div>;

    const healthStats = calculateHealthScore(profile);

    return (
        <div className="container mx-auto py-8 px-4 max-w-7xl">
            {/* --- HEADER --- */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                        Hello, {profile?.fullName?.split(' ')[0] || 'User'}! 👋
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Current Goal: <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                            {profile?.goals?.[0] || 'Better Health'}
                        </span>
                    </p>
                </div>
                {/* PRIMARY ACTION BUTTON */}
                <Link to="/scanner" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold shadow-lg shadow-indigo-200 transition-all flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                    New Scan (Food/Blood)
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* --- LEFT COLUMN: STATS & REPORTS --- */}
                <div className="lg:col-span-2 space-y-8">
                    {/* STATS ROW */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                       <MetricCard 
                           title="Health Score" 
                           value={healthStats.score} 
                           unit="/100" 
                           valueColor={healthStats.color} 
                       />
                       <MetricCard 
                           title="Total Scans" 
                           value={pastReports.length.toString()} 
                           unit="" 
                       />
                       <MetricCard 
                           title="Water Intake" 
                           value={profile?.waterIntake?.split(' ')[0] || "?"} 
                           unit="L/day" 
                       />
                    </div>

                    {/* HISTORY SECTION */}
                    <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-gray-800">Recent Analysis History</h2>
                        </div>
                        
                        {loadingReports ? (
                             <div className="p-8 text-center text-gray-400">Loading history...</div>
                        ) : pastReports.length === 0 ? (
                             <div className="p-12 text-center">
                                 <div className="inline-block p-4 rounded-full bg-gray-100 mb-4">📂</div>
                                 <p className="text-gray-500">No scans yet. Upload your first label or report!</p>
                             </div>
                        ) : (
                             <div className="divide-y divide-gray-100">
                                 {pastReports.map(report => (
                                     <div key={report.id} className="p-5 hover:bg-gray-50 transition-colors flex flex-col sm:flex-row gap-4">
                                         <div className="flex-1">
                                             <div className="flex items-center gap-2 mb-1">
                                                <span className="font-semibold text-gray-800">{report.fileName}</span>
                                                <span className="text-xs text-gray-400">• {report.uploadedAt.toLocaleDateString()}</span>
                                             </div>
                                             <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                                                 {report.aiInsight || "Processing complete. Click to view full details."}
                                             </p>
                                         </div>
                                     </div>
                                 ))}
                             </div>
                        )}
                    </section>
                </div>

                {/* --- RIGHT COLUMN: TIPS & PROFILE --- */}
                <div className="lg:col-span-1 space-y-6">
                    
                    {/* DAILY TIP CARD (Replaces Redundant Scan Button) */}
                    <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-xl p-6 text-white shadow-lg">
                        <div className="flex items-center gap-2 mb-3 opacity-90">
                            <span className="text-xl">💡</span>
                            <h3 className="font-bold text-sm uppercase tracking-wider">Daily Health Tip</h3>
                        </div>
                        <p className="font-medium text-lg leading-relaxed opacity-95">
                            "{dailyTip.split(': ')[1] || dailyTip}"
                        </p>
                        <div className="mt-4 text-xs opacity-75 font-mono">
                            Category: {dailyTip.split(':')[0]}
                        </div>
                    </div>

                    {/* PROFILE CARD */}
                    <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                         <h2 className="text-lg font-bold text-gray-800 mb-4">Your Profile</h2>
                         
                         <div className="space-y-3 mb-6">
                             <div className="flex justify-between text-sm">
                                 <span className="text-gray-500">Status</span>
                                 <span className="font-medium text-gray-900">Active Member</span>
                             </div>
                             <div className="flex justify-between text-sm">
                                 <span className="text-gray-500">Diet Type</span>
                                 <span className="font-medium text-gray-900">{profile?.diet || "Standard"}</span>
                             </div>
                             <div className="flex justify-between text-sm">
                                 <span className="text-gray-500">Last Checkup</span>
                                 <span className="font-medium text-gray-900">{profile?.checkupFrequency || "Unknown"}</span>
                             </div>
                         </div>

                         <Link to="/questionnaire" className="block w-full text-center px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 hover:text-indigo-600 transition-colors">
                            Edit Health Profile
                         </Link>
                    </section>
                </div>
            </div>

            <Chatbot userProfile={profile} />
        </div>
    );
};

export default Dashboard;