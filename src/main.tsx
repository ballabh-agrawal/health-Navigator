// src/main.tsx
import './index.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";

import './index.css';
import App from './App';

// --- Import Pages (excluding Dashboard for now) ---
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Signup from './pages/SignUp'; // Correct casing
import Questionnaire from './pages/Questionnaire';
import Scanner from './pages/Scanner';
import Dashboard from './pages/Dashboard';

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />, // The main layout (Navbar, Footer)
    children: [
      {
        path: "/",
        element: <LandingPage />,
      },
      {
        path: "/login",
        element: <Login />,
      },
      {
        path: "/signup",
        element: <Signup />, // Correctly uses the imported variable
      },
      {
        path: "/questionnaire",
        element: <Questionnaire />,
      },
      {
        path: "/scanner",
        element: <Scanner />,
      },
      
       {
         path: "/dashboard",
         element: <Dashboard />,
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);