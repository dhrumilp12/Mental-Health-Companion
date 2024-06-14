import re

from langchain_community.vectorstores.azure_cosmos_db import (
    AzureCosmosDBVectorSearch,
    CosmosDBSimilarityType,
    CosmosDBVectorSearchType
)
from langchain.agents import Tool
from langchain.agents.agent_toolkits import create_conversational_retrieval_agent
from langchain.tools import StructuredTool
from langchain_core.messages import SystemMessage
from langchain_core.vectorstores import VectorStoreRetriever

from pymongo.database import Database

from services.azure_mongodb import MongoDBClient
from services.my_azure import get_azure_openai_variables, get_azure_openai_llm, get_azure_openai_embeddings

class AIAgent:
    def __init__(self, system_message:str, schema:list[str]=[]):
        self.db:Database = (MongoDBClient.get_client())[MongoDBClient.get_db_name()]
        self.llm = get_azure_openai_llm()
        self.embedding_model = get_azure_openai_embeddings()

        self.system_message = SystemMessage(content=system_message)

        # self.agent_executor = create_conversational_retrieval_agent(
        #     llm=self.llm,
        #     tools=self.__create_agent_tools(schema),
        #     system_message = self.system_message,
        #     verbose=True
        # )
    

    def run(self, message:str) -> str:
        """
        Executes the AI agent and gets a response as a result.
        """        
        result = self.agent_executor({"input": message})
        return result["output"]
    

    def _get_cosmosdb_vector_store_retriever(self, collection_name, top_k=3) -> VectorStoreRetriever:
        db_name = MongoDBClient.get_db_name()
        CONNECTION_STRING = MongoDBClient.get_mongodb_variables()
        _, _, _, AOAI_EMBEDDINGS, _ = get_azure_openai_variables()

        vector_store = AzureCosmosDBVectorSearch.from_connection_string(
            connection_string = CONNECTION_STRING, 
            namespace = f"{db_name}.{collection_name}", 
            embedding = AOAI_EMBEDDINGS, 
            index_name =f"VectorSearchIndex",
            embedding_key = "contentVector", #TODO: Find out what these are for
            text_key = "_id" #TODO: Find out what these are for
        )
        vector_store.create_index()
        return vector_store.as_retriever(search_kwargs={"k": top_k})
    

    def __create_agent_tools(self, schema=[]) -> list[Tool]:
        """
        Returns a list of agent tools.
        """
        db_name = MongoDBClient.get_db_name()

        tools = []
        for header_name in schema:

            retriever = self.__get_cosmosdb_vector_store_retriever(f"{db_name}.{header_name}")

            retriever_chain = retriever | AIAgent.format_docs

            tools.append(Tool(
                name = f"vector_search_{header_name}",
                func = retriever_chain.invoke,
                description = f"""
                    Searches similar {header_name}s based on the question. 
                    Returns the {header_name} information in JSON format.
                    """
            ))

        # Add all the GET methods in this class as structured tools
        structured_tools = []
        current_class = self.__class__
        for method_name in dir(current_class):
            method = getattr(current_class, method_name)
            if callable(method) and re.match(r'get_.*_by_.*', method_name):
                structured_tools.append(StructuredTool.from_function(method))
        
        tools.extend(structured_tools)

        return tools