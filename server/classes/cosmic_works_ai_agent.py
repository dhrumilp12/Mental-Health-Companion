"""
The CosmicWorksAIAgent class encapsulates a LangChain
agent that can be used to answer questions about Cosmic Works
products, customers, and sales.
"""

import os
import json
import pymongo

from .ai_agent import AIAgent
from tools.azure_mongodb import MongoDBClient

# Suppressing CosmosDB Mongo driver warning.
import warnings
warnings.filterwarnings("ignore", category=UserWarning, message='.*You appear to be connected to a CosmosDB cluster.*')


DB_CONNECTION_STRING = os.environ.get("DB_CONNECTION_STRING")

class CosmicWorksAIAgent(AIAgent):
    """
    The CosmicWorksAIAgent class creates Cosmo, an AI agent
    that can be used to answer questions about Cosmic Works
    products, customers, and sales.
    """
    
    db = MongoDBClient.get_client()

    def __init__(self, session_id: str):
        system_message = """
            You are a helpful, fun and friendly sales assistant for Cosmic Works, 
            a bicycle and bicycle accessories store.

            Your name is Cosmo.

            You are designed to answer questions about the products that Cosmic Works sells, 
            the customers that buy them, and the sales orders that are placed by customers.

            If you don't know the answer to a question, respond with "I don't know."

            Only answer questions related to Cosmic Works products, customers, and sales orders.
            
            If a question is not related to Cosmic Works products, customers, or sales orders,
            respond with "I only answer questions about Cosmic Works"
        """
        super().__init__(session_id, system_message, ["products", "customers", "sales"])


    @staticmethod
    def get_product_by_id(product_id:str) -> str:
        """
        Retrieves a product by its ID.    
        """
        doc = CosmicWorksAIAgent.db.products.find_one({"_id": product_id})
        if "contentVector" in doc:
            del doc["contentVector"]
        return json.dumps(doc)


    @staticmethod
    def get_product_by_sku(sku:str) -> str:
        """
        Retrieves a product by its sku.
        """
        doc = CosmicWorksAIAgent.db.products.find_one({"sku": sku})
        if "contentVector" in doc:
            del doc["contentVector"]
        return json.dumps(doc, default=str)


    @staticmethod
    def get_sales_by_id(sales_id:str) -> str:
        """
        Retrieves a sales order by its ID.
        """
        doc = CosmicWorksAIAgent.db.sales.find_one({"_id": sales_id})
        if "contentVector" in doc:
            del doc["contentVector"]
        return json.dumps(doc, default=str)