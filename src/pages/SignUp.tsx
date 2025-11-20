import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'; 
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from '../firebaseConfig'; 

const SignUp: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate(); 

  const handleSignUp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); 
    setError(null); 
    setLoading(true); 

    if (!name || !email || !password) {
      setError("Please fill in all fields.");
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      setLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log("User created successfully:", user);


      navigate('/questionnaire'); 

    } catch (firebaseError: any) {
      console.error("Error creating user:", firebaseError);
    
      if (firebaseError.code === 'auth/email-already-in-use') {
        setError("This email address is already registered.");
      } else if (firebaseError.code === 'auth/invalid-email') {
        setError("Please enter a valid email address.");
      } else {
        setError("Failed to create account. Please try again.");
      }
    } finally {
      setLoading(false); 
    }
  };

  return (
   <div className="w-full mx-auto py-12 md:py-20 px-4">
      <div className="max-w-3xl w-full mx-auto bg-white p-12 rounded-lg shadow-lg border border-gray-200">
        <div className="max-w-md mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-6">
            Create Your Account
          </h2>
          {}
          {error && <p className="text-red-600 text-center mb-4 text-sm">{error}</p>}

          <form onSubmit={handleSignUp} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)} 
                required
                autoComplete="name"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
           <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900" // <-- Added text-gray-900
            />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password (min. 6 characters)
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)} 
                required
                autoComplete="new-password"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              />
            </div>
            <button
              type="submit"
              disabled={loading} 
              className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
          <p className="text-center text-gray-600 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 hover:underline font-medium">
              Log In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;