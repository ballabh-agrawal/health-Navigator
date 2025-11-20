import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from "firebase/auth"; 
import { auth } from '../firebaseConfig'; 

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate(); 
  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); 
    setError(null);
    setLoading(true);

    if (!email || !password) {
      setError("Please enter both email and password.");
      setLoading(false);
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log("User logged in successfully:", user);

      navigate('/dashboard');

    } catch (firebaseError: any) {
      console.error("Error logging in:", firebaseError);
      if (firebaseError.code === 'auth/invalid-credential' || firebaseError.code === 'auth/user-not-found' || firebaseError.code === 'auth/wrong-password') {
        setError("Invalid email or password. Please try again.");
      } else if (firebaseError.code === 'auth/invalid-email') {
         setError("Please enter a valid email address format.");
      } else {
        setError("Failed to log in. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-12 md:py-20 px-4">
      <div className="max-w-2xl w-full mx-auto bg-white p-12 rounded-lg shadow-lg border border-gray-200">
        <div className="max-w-md mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-6">
            Welcome Back!
          </h2>
          {}
          {error && <p className="text-red-600 text-center mb-4 text-sm">{error}</p>}

          <form onSubmit={handleLogin} className="space-y-6">
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
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)} 
                required
                autoComplete="current-password"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Logging In...' : 'Log In'}
            </button>
          </form>
          <p className="text-center text-gray-600 mt-6">
            Don't have an account?{' '}
            <Link to="/signup" className="text-blue-600 hover:underline font-medium">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;