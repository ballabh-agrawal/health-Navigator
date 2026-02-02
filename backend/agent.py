import os
from dotenv import load_dotenv
from typing import TypedDict, List, Optional, Annotated
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from schemas import UserProfile

load_dotenv()
api_key = os.getenv("GOOGLE_API_KEY")

if not api_key:
    raise ValueError("GOOGLE_API_KEY is missing. Check your .env file.")

# --- 1. STATE DEFINITION ---
class HealthNavState(TypedDict):
    user_profile: Optional[UserProfile]
    image_data: Optional[str]
    messages: Annotated[List[dict], add_messages]
    final_advice: Optional[str]

# --- 2. THE MODEL (Gemini 3) ---
llm = ChatGoogleGenerativeAI(
    model="gemini-3-flash-preview", 
    temperature=0,
    api_key=api_key
)

SYSTEM_PROMPT = """You are a Health Navigator Assistant.
Your task is to analyze nutritional information or answer health questions based on the user's profile.
Always add a disclaimer: "This is not medical advice." """

# --- 3. HELPER FUNCTION (Must be defined before nodes use it) ---
def _extract_text(content):
    """
    Extracts plain text from Gemini 3's complex multimodal response.
    """
    final_text = ""
    if isinstance(content, str):
        final_text = content
    elif isinstance(content, list):
        for block in content:
            if isinstance(block, dict) and "text" in block:
                final_text += block["text"]
            elif isinstance(block, str):
                final_text += block
    else:
        final_text = str(content)
    return final_text

# --- 4. NODE A: ANALYZE (For Scanner) ---
def analyze_node(state: HealthNavState):
    image_data = state.get("image_data")
    user_profile = state.get("user_profile")
    
    # Handle missing profile gracefully
    profile_text = f"User Profile: {user_profile}" if user_profile else "User Profile: Unknown"

    messages = [
        SystemMessage(content=SYSTEM_PROMPT),
        HumanMessage(content=[
            {"type": "text", "text": f"Context - {profile_text}"},
            {"type": "image_url", "image_url": {"url": image_data}} 
        ])
    ]
    
    response = llm.invoke(messages)
    return {"final_advice": _extract_text(response.content)}

# --- 5. NODE B: CHAT (For Chatbot) ---
def chat_node(state: HealthNavState):
    image_data = state.get("image_data")
    user_profile = state.get("user_profile")
    messages_history = state.get("messages", [])
    
    # Context Construction
    profile_text = f"User Profile: {user_profile}" if user_profile else "User Profile: Unknown"
    
    content_parts = [
        {"type": "text", "text": f"Context - {profile_text}. \n\n User Question: "}
    ]
    
    # Only add image if it exists
    if image_data:
        content_parts.append({"type": "image_url", "image_url": {"url": image_data}})
    
    # Start Payload
    payload_messages = [
        SystemMessage(content=SYSTEM_PROMPT),
        HumanMessage(content=content_parts)
    ]
    
    # Add History (Robust Loop)
    for msg in messages_history:
        # CASE A: It's a Dictionary (from React input)
        if isinstance(msg, dict):
            role = msg.get("role")
            content = msg.get("content")
            if role == "user":
                payload_messages.append(HumanMessage(content=content))
            else:
                payload_messages.append(AIMessage(content=content))
                
        # CASE B: It's already a Message Object (LangGraph converted it)
        elif hasattr(msg, "content"):
            payload_messages.append(msg)

    # Call Gemini
    response = llm.invoke(payload_messages)
    return {"final_advice": _extract_text(response.content)}

# --- 6. COMPILE TWO SEPARATE GRAPHS ---

# Graph 1: The Scanner
workflow_scan = StateGraph(HealthNavState)
workflow_scan.add_node("analyze_node", analyze_node)
workflow_scan.set_entry_point("analyze_node")
workflow_scan.add_edge("analyze_node", END)
scan_graph = workflow_scan.compile() 

# Graph 2: The Chatbot
workflow_chat = StateGraph(HealthNavState)
workflow_chat.add_node("chat_node", chat_node)
workflow_chat.set_entry_point("chat_node")
workflow_chat.add_edge("chat_node", END)
chat_graph = workflow_chat.compile()