import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc } from "firebase/firestore"; 
import { auth, db } from '../firebaseConfig'; 

interface FormData {
  fullName: string;
  ageGroup: string;
  gender: string;
  height: string;
  weight: string;
  activityLevel: string;
  diet: string;
  waterIntake: string;
  smoke: string;
  alcohol: string;
  sleepHours: string;
  conditions: string[];
  medications: string;
  familyHistory: string[];
  checkupFrequency: string;
  goals: string[];
  consent: boolean;
}

type SetDataFunction = React.Dispatch<React.SetStateAction<FormData>>;


const Checkbox = ({ id, value, label, checked, onChange }: { id: string, value: string, label: string, checked: boolean, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) => (
  <div className="flex items-center">
    <input
      id={id}
      type="checkbox"
      value={value}
      checked={checked}
      onChange={onChange}
      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
    />
    <label htmlFor={id} className="ml-2 block text-sm text-gray-900">
      {label}
    </label>
  </div>
);

const RadioButton = ({ id, name, value, label, checked, onChange }: { id: string, name: string, value: string, label: string, checked: boolean, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) => (
  <div className="flex items-center">
    <input
      id={id}
      name={name}
      type="radio"
      value={value} 
      checked={checked}
      onChange={onChange}
      className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
    />
    <label htmlFor={id} className="ml-2 block text-sm text-gray-900">
      {label}
    </label>
  </div>
);

const TextInput = ({ id, label, value, onChange, placeholder = "" }: { id: string, label: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, placeholder?: string }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-gray-700">{label}</label>
    <input
      type="text"
      id={id}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900" // Added text color
    />
  </div>
);

const SelectInput = ({ id, label, value, onChange, options }: { id: string, label: string, value: string, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void, options: string[] }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-gray-700">{label}</label>
    <select
      id={id}
      value={value}
      onChange={onChange}
      className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900" // Added text color
    >
      {options.map(option => <option key={option} value={option}>{option}</option>)}
    </select>
  </div>
);


const Step1 = ({ data, setData }: { data: FormData, setData: SetDataFunction }) => (
  <div className="space-y-4">
    <h2 className="text-xl font-semibold mb-3 text-gray-800">Basic Information</h2>
    <TextInput
      id="fullName"
      label="Full Name"
      value={data.fullName}
      onChange={e => setData(prevData => ({ ...prevData, fullName: e.target.value }))}
    />
    <SelectInput
      id="ageGroup"
      label="Age Group"
      value={data.ageGroup}
      onChange={e => setData(prevData => ({ ...prevData, ageGroup: e.target.value }))}
      options={['18-25', '26-35', '36-45', '46-60', '60+']}
    />
    <SelectInput
      id="gender"
      label="Gender"
      value={data.gender}
      onChange={e => setData(prevData => ({ ...prevData, gender: e.target.value }))}
      options={['Male', 'Female', 'Other', 'Prefer not to say']}
    />
    <TextInput
      id="height"
      label="Height (e.g., 175 cm or 5' 9inch)"
      value={data.height}
      onChange={e => setData(prevData => ({ ...prevData, height: e.target.value }))}
    />
    <TextInput
      id="weight"
      label="Weight (e.g., 70 kg or 154 lbs)"
      value={data.weight}
      onChange={e => setData(prevData => ({ ...prevData, weight: e.target.value }))}
    />
  </div>
);

const Step2 = ({ data, setData }: { data: FormData, setData: SetDataFunction }) => (
  <div className="space-y-6">
    <h2 className="text-xl font-semibold mb-3 text-gray-800">Lifestyle & Habits</h2>
    <SelectInput id="activityLevel" label="How active are you on an average day?" value={data.activityLevel}
      onChange={e => setData(prevData => ({ ...prevData, activityLevel: e.target.value }))}
      options={['Sedentary (Mostly sitting)', 'Lightly active (1-2 times/week exercise)', 'Moderately active (3-5 times/week)', 'Very active (Daily workouts or physical work)']}
    />
    <SelectInput id="diet" label="How would you describe your diet?" value={data.diet}
      onChange={e => setData(prevData => ({ ...prevData, diet: e.target.value }))}
      options={['Vegetarian', 'Non-Vegetarian', 'Vegan', 'Eggetarian', 'Other']}
    />
     <SelectInput id="waterIntake" label="How many glasses of water do you drink per day?" value={data.waterIntake}
      onChange={e => setData(prevData => ({ ...prevData, waterIntake: e.target.value }))}
      options={['< 4', '4-6', '7-9', '10+']}
    />
    <SelectInput id="sleepHours" label="How many hours of sleep do you get per night?" value={data.sleepHours}
      onChange={e => setData(prevData => ({ ...prevData, sleepHours: e.target.value }))}
      options={['< 5 hours', '5-6 hours', '7-8 hours', '9+ hours']}
    />
    <div>
      <label className="block text-sm font-medium text-gray-700">Do you smoke or consume tobacco?</label>
      <div className="mt-2 space-x-4 flex">
        <RadioButton id="smoke-yes" name="smoke" value="Yes, regularly" label="Yes, regularly" checked={data.smoke === 'Yes, regularly'} onChange={e => setData(prevData => ({ ...prevData, smoke: e.target.value }))} />
        <RadioButton id="smoke-occasionally" name="smoke" value="Occasionally" label="Occasionally" checked={data.smoke === 'Occasionally'} onChange={e => setData(prevData => ({ ...prevData, smoke: e.target.value }))} />
        <RadioButton id="smoke-no" name="smoke" value="No" label="No" checked={data.smoke === 'No'} onChange={e => setData(prevData => ({ ...prevData, smoke: e.target.value }))} />
      </div>
    </div>
     <div>
      <label className="block text-sm font-medium text-gray-700">Do you consume alcohol?</label>
      <div className="mt-2 space-x-4 flex">
        <RadioButton id="alcohol-yes" name="alcohol" value="Yes, regularly" label="Yes, regularly" checked={data.alcohol === 'Yes, regularly'} onChange={e => setData(prevData => ({ ...prevData, alcohol: e.target.value }))} />
        <RadioButton id="alcohol-occasionally" name="alcohol" value="Occasionally" label="Occasionally" checked={data.alcohol === 'Occasionally'} onChange={e => setData(prevData => ({ ...prevData, alcohol: e.target.value }))} />
        <RadioButton id="alcohol-no" name="alcohol" value="No" label="No" checked={data.alcohol === 'No'} onChange={e => setData(prevData => ({ ...prevData, alcohol: e.target.value }))} />
      </div>
    </div>
  </div>
);

const Step3 = ({ data, setData }: { data: FormData, setData: SetDataFunction }) => {
  const handleExclusiveCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'conditions' | 'familyHistory') => {
    const { value, checked } = e.target;
    setData(prevData => {
      let currentList = prevData[field] as string[];
      let newList: string[];

      if (checked) {
        if (value === 'None') {
          newList = ['None']; 
        } else {
          newList = [...currentList.filter(item => item !== 'None'), value];
        }
      } else {
        newList = currentList.filter(item => item !== value);
        if (newList.length === 0) {
          newList = ['None'];
        }
      }
      newList = [...new Set(newList)];
      return { ...prevData, [field]: newList };
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold mb-3 text-gray-800">Medical Background</h2>
      <div>
        <label className="block text-sm font-medium text-gray-700">Do you have any existing medical conditions? (Select all that apply)</label>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Checkbox id="cond-diabetes" value="Diabetes" label="Diabetes" checked={data.conditions.includes('Diabetes')} onChange={e => handleExclusiveCheckboxChange(e, 'conditions')} />
          <Checkbox id="cond-hypertension" value="Hypertension" label="Hypertension" checked={data.conditions.includes('Hypertension')} onChange={e => handleExclusiveCheckboxChange(e, 'conditions')} />
          <Checkbox id="cond-thyroid" value="Thyroid Disorder" label="Thyroid Disorder" checked={data.conditions.includes('Thyroid Disorder')} onChange={e => handleExclusiveCheckboxChange(e, 'conditions')} />
          <Checkbox id="cond-heart" value="Heart Disease" label="Heart Disease" checked={data.conditions.includes('Heart Disease')} onChange={e => handleExclusiveCheckboxChange(e, 'conditions')} />
          <Checkbox id="cond-pcos" value="PCOS / PCOD" label="PCOS / PCOD" checked={data.conditions.includes('PCOS / PCOD')} onChange={e => handleExclusiveCheckboxChange(e, 'conditions')} />
          <Checkbox id="cond-none" value="None" label="None" checked={data.conditions.includes('None')} onChange={e => handleExclusiveCheckboxChange(e, 'conditions')} />
        </div>
      </div>
      <TextInput id="medications" label="Are you currently taking any medications or supplements? (Optional)"
        value={data.medications}
        onChange={e => setData(prevData => ({ ...prevData, medications: e.target.value }))}
        placeholder="List medications, dosage if known"
      />
      <div>
        <label className="block text-sm font-medium text-gray-700">Do you have a family history of any major diseases? (Select all that apply)</label>
        <div className="mt-2 grid grid-cols-2 gap-2">
           <Checkbox id="fh-diabetes" value="Diabetes" label="Diabetes" checked={data.familyHistory.includes('Diabetes')} onChange={e => handleExclusiveCheckboxChange(e, 'familyHistory')} />
           <Checkbox id="fh-heart" value="Heart Disease" label="Heart Disease" checked={data.familyHistory.includes('Heart Disease')} onChange={e => handleExclusiveCheckboxChange(e, 'familyHistory')} />
           <Checkbox id="fh-cancer" value="Cancer" label="Cancer" checked={data.familyHistory.includes('Cancer')} onChange={e => handleExclusiveCheckboxChange(e, 'familyHistory')} />
           <Checkbox id="fh-hypertension" value="Hypertension" label="Hypertension" checked={data.familyHistory.includes('Hypertension')} onChange={e => handleExclusiveCheckboxChange(e, 'familyHistory')} />
           <Checkbox id="fh-none" value="None" label="None" checked={data.familyHistory.includes('None')} onChange={e => handleExclusiveCheckboxChange(e, 'familyHistory')} />
        </div>
      </div>
       <SelectInput id="checkupFrequency" label="How often do you go for a medical check-up?" value={data.checkupFrequency}
        onChange={e => setData(prevData => ({ ...prevData, checkupFrequency: e.target.value }))}
        options={['Every 6 months', 'Once a year', 'Only when needed', 'Rarely / Never']}
      />
    </div>
  );
};

const Step4 = ({ data, setData }: { data: FormData, setData: SetDataFunction }) => {
  const handleGoalsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    setData(prevData => {
        const { goals } = prevData;
        let newGoals: string[];
        if (checked) {
          newGoals = [...goals, value];
        } else {
          newGoals = goals.filter(item => item !== value);
        }
        return {...prevData, goals: newGoals };
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold mb-3 text-gray-800">Goals & Preferences</h2>
      <div>
        <label className="block text-sm font-medium text-gray-700">What are your primary health goals? (Select all that apply)</label>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Checkbox id="goal-lose-weight" value="Lose weight" label="Lose weight" checked={data.goals.includes('Lose weight')} onChange={handleGoalsChange} />
          <Checkbox id="goal-gain-muscle" value="Gain muscle" label="Gain muscle" checked={data.goals.includes('Gain muscle')} onChange={handleGoalsChange} />
          <Checkbox id="goal-general-wellness" value="Maintain general wellness" label="Maintain general wellness" checked={data.goals.includes('Maintain general wellness')} onChange={handleGoalsChange} />
          <Checkbox id="goal-improve-sleep" value="Improve sleep" label="Improve sleep" checked={data.goals.includes('Improve sleep')} onChange={handleGoalsChange} />
          <Checkbox id="goal-manage-stress" value="Manage stress" label="Manage stress" checked={data.goals.includes('Manage stress')} onChange={handleGoalsChange} />
          <Checkbox id="goal-track-conditions" value="Track chronic conditions" label="Track chronic conditions" checked={data.goals.includes('Track chronic conditions')} onChange={handleGoalsChange} />
        </div>
      </div>
    </div>
  );
};

const Step5 = ({ data, setData }: { data: FormData, setData: SetDataFunction }) => (
  <div className="space-y-6">
    <h2 className="text-xl font-semibold mb-3 text-gray-800">Consent & Summary</h2>
    <p className="text-sm text-gray-600">
      Please review your information below. By checking the box, you consent to your health
      data being analyzed by our system to generate personalized, non-diagnostic insights and recommendations.
      Your data is kept confidential.
    </p>

    {/* A quick summary of the data */}
    <div className="bg-gray-50 p-4 rounded-md max-h-48 overflow-auto border border-gray-200">
      <h4 className="font-semibold mb-2 text-gray-800">Your Data Summary:</h4>
      <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
        {data.fullName && <li>Name: {data.fullName}</li>}
        <li>Age Group: {data.ageGroup}</li>
        <li>Gender: {data.gender}</li>
        {data.height && <li>Height: {data.height}</li>}
        {data.weight && <li>Weight: {data.weight}</li>}
        <li>Activity: {data.activityLevel}</li>
        <li>Conditions: {data.conditions.length > 0 ? data.conditions.join(', ') : 'None specified'}</li>
        <li>Goals: {data.goals.length > 0 ? data.goals.join(', ') : 'None specified'}</li>
      </ul>
    </div>

    {}
    <div>
      <Checkbox
        id="consent"
        value="consent"
        label="I understand and consent to the analysis of my data."
        checked={data.consent}
        onChange={e => setData(prevData => ({ ...prevData, consent: e.target.checked }))}
      />
      {!data.consent && <p className="text-red-600 text-xs mt-1">Consent is required to submit.</p>}
    </div>
  </div>
);


const Questionnaire: React.FC = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    ageGroup: '18-25',
    gender: 'Male',
    height: '',
    weight: '',
    activityLevel: 'Sedentary (Mostly sitting)',
    diet: 'Vegetarian',
    waterIntake: '4-6',
    smoke: 'No',
    alcohol: 'No',
    sleepHours: '7-8 hours',
    conditions: ['None'], 
    medications: '',
    familyHistory: ['None'], 
    checkupFrequency: 'Once a year',
    goals: [],
    consent: false,
  });

  const totalSteps = 5;
  const navigate = useNavigate(); 

  const nextStep = () => setStep((prev) => (prev < totalSteps ? prev + 1 : prev));
  const prevStep = () => setStep((prev) => (prev > 1 ? prev - 1 : prev));

  const handleSubmit = async () => {
    const user = auth.currentUser;
    if (!user) {
      alert("Error: No user is logged in. Please log in again.");
      navigate('/login'); 
      return;
    }
    if (!formData.consent) {
      alert("Please provide consent to submit.");
      return;
    }

    console.log("Submitting data for user:", user.uid);
    console.log("Data:", formData);

    try {
      const profileDocRef = doc(db, "profiles", user.uid);
      await setDoc(profileDocRef, formData);

      console.log("Profile data saved successfully!");
      alert("Your profile has been saved.");
      navigate('/dashboard'); 

    } catch (error) {
      console.error("Error saving profile data:", error);
      alert("There was an error saving your profile. Please try again.");
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return <Step1 data={formData} setData={setFormData} />;
      case 2:
        return <Step2 data={formData} setData={setFormData} />;
      case 3:
        return <Step3 data={formData} setData={setFormData} />;
      case 4:
        return <Step4 data={formData} setData={setFormData} />;
      case 5:
        return <Step5 data={formData} setData={setFormData} />;
      default:
        return <Step1 data={formData} setData={setFormData} />;
    }
  };

  return (
    <div className="container mx-auto py-12 md:py-20 px-4">

      {}
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-lg border border-gray-200">

        {}
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-600">Step {step} of {totalSteps}</h3>
          <div className="mt-2 bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            ></div>
          </div>
        </div>

        {}
        {}
        <div className="min-h-[400px] pb-6"> {}
          {renderStep()}
        </div>

        {}
        <div className="mt-8 pt-6 border-t border-gray-200 flex justify-between items-center">
          <button
            onClick={prevStep}
            disabled={step === 1}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            
          >
            Previous
          </button>

          {step < totalSteps ? (
            <button
              onClick={nextStep}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit} 
              disabled={!formData.consent} 
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Submit & View Dashboard
            </button>
          )}
        </div>
      </div>

    </div>
  );
};

export default Questionnaire;