// src/App.tsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './components/Navbar'; 

function App() {
  return (
    
    <div className="flex flex-col min-h-screen bg-gray-50">

      <Navbar /> {}

      {}
      <main className="flex-grow w-full"> {}
        <Outlet /> {}
      </main>

      {}
      <footer className="w-full text-center text-gray-500 p-4 bg-white border-t mt-auto">
        © 2025 Health Navigator. All rights reserved.
      </footer>

    </div>
  );
}

export default App;