import os
import json
import re

from dotenv import load_dotenv
from langchain_community.vectorstores import AzureCosmosDBVectorSearch
from langchain.schema.document import Document
from langchain.agents import Tool
from langchain.agents.agent_toolkits import create_conversational_retrieval_agent
from langchain.tools import StructuredTool
from langchain_core.messages import SystemMessage
from langchain_core.vectorstores import VectorStoreRetriever

from services.azure import get_azure_openai_llm, get_azure_openai_embeddings

load_dotenv(".env")
DB_CONNECTION_STRING = os.environ.get("DB_CONNECTION_STRING")
AOAI_ENDPOINT = os.environ.get("AOAI_ENDPOINT")
AOAI_KEY = os.environ.get("AOAI_KEY")
AOAI_API_VERSION = "2023-09-01-preview"
COMPLETIONS_DEPLOYMENT = os.getenv("COMPLETIONS_DEPLOYMENT_NAME")
EMBEDDINGS_DEPLOYMENT = os.getenv("EMBEDDINGS_DEPLOYMENT_NAME")

#FIXME: These classes may be redundant with tools.langchain; choose one or the other
class AIAgent:

    def __init__(self, session_id:str, system_message:str, db_name:str, schema:list[str]=[]):
        self.llm = get_azure_openai_llm()
        self.embedding_model = get_azure_openai_embeddings()

        self.system_message_obj = SystemMessage(content=system_message)

        self.agent_executor = create_conversational_retrieval_agent(
            llm=self.llm,
            tools=self.__create_agent_tools(db_name, schema),
            system_message = self.system_message_obj,
            memory_key=session_id,
            verbose=True
        )
    

    def run(self, prompt:str) -> str:
        """
        Run the AI agent.
        """        
        result = self.agent_executor({"input": prompt})
        return result["output"]
    

    def __create_vector_store_retriever(self, namespace, top_k = 3) -> VectorStoreRetriever:
        """
        Returns a vector store retriever for the given collection.
        """        
        vector_store = AzureCosmosDBVectorSearch.from_connection_string(
            connection_string= DB_CONNECTION_STRING,
            namespace = namespace,
            embedding = self.embedding_model,
            index_name = "VectorSearchIndex",
            embedding_key = "contentVector",
            text_key = "_id"
        )

        return vector_store.as_retriever(search_kwargs={"k": top_k})
    

    def __create_agent_tools(self, db_name, schema=[]) -> list[Tool]:
        """
        Returns a list of agent tools.
        """
        tools = []
        for header_name in schema:

            retriever = self.__create_vector_store_retriever(f"{db_name}.{header_name}")

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
        
    
    @staticmethod
    def format_docs(docs:list[Document]) -> str:
        """
        Prepares the product list for the system prompt.
        """       
        str_docs = []

        for doc in docs:
            doc_dict = {"_id": doc.page_content}
            doc_dict.update(doc.metadata)
            if "contentVector" in doc_dict:
                del doc_dict["contentVector"]
            str_docs.append(json.dumps(doc_dict, default=str))
        
        return "\n\n".join(str_docs)
