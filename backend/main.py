from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from schemas import UserProfile, ChatRequest, AnalyzeRequest
# IMPORT BOTH GRAPHS HERE
from agent import scan_graph, chat_graph 

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- ENDPOINT 1: SCANNER ---
@app.post("/analyze")
async def analyze_food(request: AnalyzeRequest):
    try:
        # Use scan_graph
        result = scan_graph.invoke({
            "user_profile": request.user_profile,
            "image_data": request.image_data,
            "messages": []
        })
        return {"analysis": result["final_advice"]}
    except Exception as e:
        print(f"Analyze Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- ENDPOINT 2: CHATBOT ---
@app.post("/chat")
async def chat_food(request: ChatRequest):
    try:
        formatted_history = [
            {"role": m.role, "content": m.content} for m in request.history
        ]
        formatted_history.append({"role": "user", "content": request.question})

        # Use chat_graph
        result = chat_graph.invoke({
            "user_profile": request.user_profile,
            "image_data": request.image_data, 
            "messages": formatted_history
        })
        return {"reply": result["final_advice"]}
        
    except Exception as e:
        print(f"Chat Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)