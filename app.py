from fastapi import FastAPI, HTTPException, Query
from typing import Optional
import uvicorn

from azure_mongoDB import load_products, MongoDBClient
from azure_openai_client import query_ai
from langchain_setup import process_langchain_query

import json
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

@app.get("/products/")
async def get_products():
    try:
        db = MongoDBClient.get_client()['cosmic_works']
        products = load_products(db)
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
    
@app.get("/langchain_query/")
async def langchain_query(question: str = Query(..., description="The question to ask the LangChain model")):
    try:
        response = process_langchain_query(question)
        print('\n',response)
        return {"response": response.content}
    except Exception as e:
        logger.error(f"LangChain processing failed: {str(e)}")
        return {"error": "LangChain query failed"}
    
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
