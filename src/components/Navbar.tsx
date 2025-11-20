import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { auth } from '../firebaseConfig'; 

import { onAuthStateChanged, signOut } from 'firebase/auth';
import type { User } from 'firebase/auth'; 

const Logo = () => (
  <Link to="/" className="text-2xl font-bold text-blue-600 hover:text-blue-700 transition duration-300">
    HealthNav
  </Link>
);

const Navbar: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser); 
    });
    return () => unsubscribe();
  }, []); 

  const handleLogout = async () => {
    try {
      await signOut(auth);
      console.log("User logged out successfully");
      navigate('/login'); 
    } catch (error) {
      console.error("Error logging out:", error);
      alert("Failed to log out. Please try again.");
    }
  };

  const getNavLinkClass = ({ isActive }: { isActive: boolean }) => {
    return isActive
      ? 'text-blue-600 font-semibold border-b-2 border-blue-600 px-3 py-2' 
      : 'text-gray-700 hover:text-blue-600 px-3 py-2'; 
  };

  return (
    <nav className="w-full bg-white shadow-md border-b border-gray-200">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">

        {}
        <Logo />

        {}
        <div className="hidden md:flex space-x-6">
          <NavLink to="/" className={getNavLinkClass}>
            Home
          </NavLink>
          {}
          {user && (
            <NavLink to="/dashboard" className={getNavLinkClass}>
              Dashboard
            </NavLink>
          )}
           {}
           {user && (
             <NavLink to="/questionnaire" className={getNavLinkClass}>
               Profile
             </NavLink>
           )}
        </div>

        {}
        <div className="flex items-center space-x-3">
          {user ? (
            <>
              <span className="text-sm text-gray-600 hidden sm:inline">
                {}
                Hi, {user.email || 'User'}
              </span>
             <button
                onClick={handleLogout}
                className="text-blue-600 bg-white border border-blue-600 hover:bg-blue-50 px-4 py-2 rounded-md text-sm font-medium transition duration-300" // Blue outline style (like Sign Up)
              >
                Logout
              </button>
                          </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-gray-700 hover:text-blue-600 px-4 py-2 rounded-md text-sm font-medium"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="text-blue-600 bg-white border border-blue-600 hover:bg-blue-50 px-4 py-2 rounded-md text-sm font-medium transition duration-300"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>

      </div>
    </nav>
  );
};

export default Navbar;