import os
import json
import re

from dotenv import load_dotenv
from openai import AzureOpenAI
from langchain_openai import AzureChatOpenAI, AzureOpenAIEmbeddings
from langchain_community.vectorstores import AzureCosmosDBVectorSearch
from langchain.schema.document import Document
from langchain.agents import Tool
from langchain.agents.agent_toolkits import create_conversational_retrieval_agent
from langchain.tools import StructuredTool
from langchain_core.messages import SystemMessage


load_dotenv(".env")
DB_CONNECTION_STRING = os.environ.get("DB_CONNECTION_STRING")
AOAI_ENDPOINT = os.environ.get("AOAI_ENDPOINT")
AOAI_KEY = os.environ.get("AOAI_KEY")
AOAI_API_VERSION = "2023-09-01-preview"
COMPLETIONS_DEPLOYMENT = os.getenv("COMPLETIONS_DEPLOYMENT_NAME")
EMBEDDINGS_DEPLOYMENT = os.getenv("EMBEDDINGS_DEPLOYMENT_NAME")

#FIXME: These classes may be redundant with tools.langchain; choose one or the other
class AIAgent:

    def __init__(self, session_id:str, system_message:str, schema:list[str]=[]):
        llm = AzureChatOpenAI(
            temperature = 0,
            openai_api_version = AOAI_API_VERSION,
            azure_endpoint = AOAI_ENDPOINT,
            openai_api_key = AOAI_KEY,
            azure_deployment = COMPLETIONS_DEPLOYMENT
        )
        self.embedding_model = AzureOpenAIEmbeddings(
            openai_api_version = AOAI_API_VERSION,
            azure_endpoint = AOAI_ENDPOINT,
            openai_api_key = AOAI_KEY,
            azure_deployment = EMBEDDINGS_DEPLOYMENT,
            chunk_size=10
        )

        system_message_obj = SystemMessage(content=system_message)

        self.agent_executor = create_conversational_retrieval_agent(
            llm,
            self.__create_agent_tools(schema),
            system_message = system_message_obj,
            memory_key=session_id,
            verbose=True
        )
    

    def run(self, prompt:str) -> str:
        """
        Run the AI agent.
        """        
        result = self.agent_executor({"input": prompt})
        return result["output"]
    

    def __create_vector_store_retriever(self, namespace, top_k = 3) -> list[Tool]:
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
    

    def __create_agent_tools(self, schema=[]) -> list[Tool]:
        """
        Returns a list of agent tools.
        """
        tools = []
        for header_name in schema:

            retriever = self.__create_vector_store_retriever(f"cosmic_works.{header_name}")

            retriever_chain = retriever | AIAgent.format_docs

            tools.append(Tool(
                name = f"vector_search_{header_name}",
                func = retriever_chain.invoke,
                description = """
                    Searches Cosmic Works product information for similar products based 
                    on the question. Returns the product information in JSON format.
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
    def query_ai(system_message, prompt, **chat_parameters):
        """
        Sends a chat message to OpenAI's Chat Completion model and returns the assistant's response.
        
        Args:
            prompt (str): The user input to which the assistant should respond.

        Returns:
            str: The assistant's response as a string.
        """
        try:
            client = AzureOpenAI(
                azure_endpoint=AOAI_ENDPOINT,
                api_key=AOAI_KEY,  
                api_version="2024-02-15-preview"
            )

            message_text = [
                {"role": "system", "content": system_message},
                {"role": "user", "content": prompt},
            ]

            completion = client.chat.completions.create(
                model=COMPLETIONS_DEPLOYMENT,
                messages=message_text,
                temperature=chat_parameters.get("temperature", 0),
                max_tokens=chat_parameters.get("max_tokens", 800),
                top_p=chat_parameters.get("top_p", 0.95),
                frequency_penalty=chat_parameters.get("frequency_penalty", 0),
                presence_penalty=chat_parameters.get("presence_penalty", 0),
                stop=None
            )

            # Extract the assistant's response
            assistant_response = next(
                (choice.message.content for choice in completion.choices if choice.message.role == 'assistant'),
                None
            )
            
            if assistant_response:
                return assistant_response
            else:
                raise ValueError("No assistant response found in completion.")
            
        except Exception as e:
            print(f"An error occurred: {e}")
            return None
        
    
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
