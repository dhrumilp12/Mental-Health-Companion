from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import logging
from langchain_setup import setup_langchain, extract_text
import os
import json
from azure_openai_client import query_ai
# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Configure CORS
origins = [
    "https://mentalhealth1.azurewebsites.net",
    # Add other origins if needed
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AIRequest(BaseModel):
    session_id: str
    prompt: str

# Setup LangChain components
components = setup_langchain()
llm = components["llm"]
prompt_template = components["prompt_template"]
db = components["db"]

@app.get("/")
def root():
    return {"status": "ready"}

@app.post("/ai")
def run_cosmic_works_ai_agent(request: AIRequest):
    try:
        # Fetch documents with descriptions that include the word "yellow"
        query = {"description": {"$regex": "yellow", "$options": "i"}}
        documents = db.products.find(query)

        # Extract text content from documents
        text_contents = extract_text(documents)

        # Prepare the product list for the prompt
        products_list = json.dumps(text_contents, indent=2) if text_contents else "No products found."

        processed_prompt = prompt_template.invoke({"products": products_list, "question": request.prompt})
        result = llm.invoke(processed_prompt)

        response = {"message": result.content}
        logger.info(f"AI response: {response}")  # Log the response
        return response
    except Exception as e:
        logger.error(f"General error: {str(e)}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred.")


@app.get("/products/")
async def get_products():
    try:
        products = list(db.products.find())
        if not products:
            raise HTTPException(status_code=500, detail="Failed to load products")
        return {"products": products}
    except Exception as e:
        logger.error(f"Error loading products: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error loading products: {str(e)}")

@app.get("/query_openai/")
async def openai_query(prompt: str = Query(..., min_length=3, max_length=500)):
    try:
        response = query_ai(prompt)
        if response is None:
            raise HTTPException(status_code=500, detail="OpenAI query returned no response")
        return {"response": response}
    except Exception as e:
        logger.error(f"OpenAI query failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"OpenAI query failed: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
