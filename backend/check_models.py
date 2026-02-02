import os
from dotenv import load_dotenv
import google.generativeai as genai

# 1. Load your key
load_dotenv()
api_key = os.getenv("GOOGLE_API_KEY")

if not api_key:
    print("Error: No API Key found in .env")
else:
    # 2. Configure the client
    genai.configure(api_key=api_key)

    print("--- AVAILABLE MODELS FOR YOUR KEY ---")
    try:
        # 3. List all models that support content generation
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                print(f"Name: {m.name}")
    except Exception as e:
        print(f"Error connecting to Google: {e}")