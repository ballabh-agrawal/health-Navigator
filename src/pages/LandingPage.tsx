
import React from 'react';
import { Link } from 'react-router-dom';

const FeatureIcon = ({ icon, title, text }: { icon: string, title: string, text: string }) => (
  <div className="flex flex-col items-center p-4 text-center">
    <div className="text-4xl mb-3">{icon}</div>
    <h3 className="text-xl font-semibold mb-2">{title}</h3>
    <p className="text-gray-600">{text}</p>
  </div>
);

const LandingPage: React.FC = () => {
  return (
    <div className="w-full">
      
      {}
      <section className="bg-white py-20 md:py-32">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Your AI Health Partner
            <br />
            <span className="text-blue-600">Eat Smarter, Live Healthier.</span>
          </h1>
          <p className="text-lg text-gray-700 mb-10 max-w-2xl mx-auto">
            Get personalized dietary and lifestyle insights. We analyze your 
            habits and blood reports to help you make better health choices.
          </p>
          <div className="flex justify-center space-x-4">
            <Link
              to="/signup"
              className="px-8 py-3 bg-gray-200 text-gray-800 font-semibold rounded-lg shadow-md hover:bg-gray-300 transition duration-300"
            >
              Get Started
            </Link>
            <Link
              to="#features"
              className="px-8 py-3 bg-gray-200 text-gray-800 font-semibold rounded-lg shadow-md hover:bg-gray-300 transition duration-300"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {}
      <section id="features" className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            A Simple 3-Step Process
          </h2>
          <div className="grid md:grid-cols-3 gap-12">
            <FeatureIcon
              icon="📋"
              title="1. Build Your Profile"
              text="Fill out a quick questionnaire about your lifestyle, diet, and health goals."
            />
            <FeatureIcon
              icon="📄"
              title="2. Upload Your Reports"
              text="Our AI securely reads your blood reports and extracts key health metrics."
            />
            <FeatureIcon
              icon="💡"
              title="3. Get Smart Insights"
              text="Receive personalized, actionable tips and see what food is right for you."
            />
          </div>
        </div>
      </section>

      {}
      <section className="bg-blue-600 text-white py-20">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-6">
            Ready to Take Control of Your Health?
          </h2>
          <p className="text-lg mb-8">
            Sign up for free and start your personalized health journey today.
          </p>
          <Link
            to="/signup"
            className="px-10 py-3 bg-white text-blue-600 font-semibold rounded-lg shadow-lg hover:bg-gray-100 transition duration-300"
          >
            Create Your Account
          </Link>
        </div>
      </section>
      
    </div>
  );
};

export default LandingPage;