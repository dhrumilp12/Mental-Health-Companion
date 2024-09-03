"""
This module defines a general structure for AI agents in the app.
"""

# -- Standard libraries --
import re

# -- 3rd Party libraries --
## Langchain
from langchain_community.vectorstores.azure_cosmos_db import (
    AzureCosmosDBVectorSearch,
    CosmosDBSimilarityType,
    CosmosDBVectorSearchType,
)
from langchain.agents import Tool
from langchain.tools import StructuredTool
from langchain_core.messages import SystemMessage
from langchain_core.vectorstores import VectorStoreRetriever
from langchain_community.document_loaders.mongodb import MongodbLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

## MongoDB
from pymongo.database import Database

# -- Custom Modules --
from services.azure_mongodb import MongoDBClient
from services.azure import (
    get_azure_openai_llm,
    get_azure_openai_embeddings,
)
from utils.docs import format_docs
from .tools import toolbox


class AIAgent:
    """
    A class that models AI agents and their core functionality in the context of the app.
    """

    def __init__(self, system_message: str, tool_names: list[str] = []):
        self.db: Database = (MongoDBClient.get_client())[MongoDBClient.get_db_name()]
        self.llm = get_azure_openai_llm()
        self.embedding_model = get_azure_openai_embeddings()

        self.system_message = SystemMessage(content=system_message)
        self.prompt = ChatPromptTemplate.from_messages(
            [
                ("system", self.system_message.content),
                ("human", "{input}"),
                MessagesPlaceholder(variable_name="agent_scratchpad"),
            ]
        )

        self.tools = self._create_agent_tools(tool_names)
        # agent = create_react_agent(llm=self.llm, tools=self.tools, prompt=self.prompt)
        # self.agent_executor:RunnableSerializable = AgentExecutor(agent, tools=[])

    def run(self, message: str) -> str:
        """
        Executes the AI agent for inference and gets a response as a result.

        Args:
            message: The user's message to the agent.
        """
        result = self.agent_executor({"input": message})
        return result["output"]

    def _get_cosmosdb_vector_store_retriever(
        self, collection_name, top_k=3
    ) -> VectorStoreRetriever:
        """
        Returns a vector store retriever for a given collection.

        Args:
            collection_name: The name of the collection to retrieve.
            top_k: The number of similar documents to retrieve.
        """

        db = self.db
        db_name = MongoDBClient.get_db_name()
        CONNECTION_STRING = MongoDBClient.get_mongodb_variables()
        embeddings_model = self.embedding_model
        vector_store_name = f"{collection_name}_vector_store"
        vector_store_collection = self.db[vector_store_name]

        if db[vector_store_name].find_one({}):
            vector_store = AzureCosmosDBVectorSearch.from_connection_string(
                connection_string=CONNECTION_STRING,
                namespace=f"{db_name}.{vector_store_name}",
                embedding=embeddings_model,
                index_name="VectorSearchIndex",
                embedding_key="vectorContent",
                text_key="textContent",
            )
        else:
            loader = MongodbLoader(
                connection_string=CONNECTION_STRING,
                db_name=db_name,
                collection_name=collection_name,
            )
            docs = loader.load()

            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=1000,
                chunk_overlap=20,
                length_function=len,
                is_separator_regex=False,
            )

            docs = text_splitter.split_documents(docs)

            vector_store = AzureCosmosDBVectorSearch.from_documents(
                docs,
                embeddings_model,
                collection=vector_store_collection,
                index_name="vectorSearchIndex",
            )
            num_lists = 1
            dimensions = 1536
            similarity_algorithm = CosmosDBSimilarityType.COS
            kind = CosmosDBVectorSearchType.VECTOR_IVF
            m = 16
            ef_construction = 64

            vector_store.create_index(
                num_lists, dimensions, similarity_algorithm, kind, m, ef_construction
            )

        retriever = vector_store.as_retriever(search_kwargs={"k": top_k})

        return retriever

    def _create_agent_tools(self, tool_names=[]) -> list[Tool]:
        """
        Returns a list of agent tools.

        Args:
            schema: A list of object names that defines which custom tools the agent will use.
        """
        db_name = MongoDBClient.get_db_name()

        # filter out unselected tools
        target_tools = {
            section_name: {
                tool_name: tool_dict for tool_name, tool_dict in section_dict.items() 
            if tool_name in tool_names
            } for section_name, section_dict in toolbox.items()
        }

        community_tools = []
        for tool_name, tool_val in target_tools.get("community").items():
            community_tools.append(tool_val)

        custom_tools = []
        for tool_name, tool_dict in target_tools.get("custom").items():
            func = tool_dict.get("func")
            description = tool_dict.get("description")

            if tool_dict.get("structured", False):
                custom_tools.append(
                    StructuredTool.from_function(func)
                )
                continue
            
            elif tool_dict.get("retriever", False):
                retriever = self._get_cosmosdb_vector_store_retriever(
                    tool_name
                )

                retriever_chain = retriever | format_docs

                custom_tools.append(
                    Tool(
                        name=f"vector_search_{tool_name}",
                        func=retriever_chain.invoke,
                        description=description
                    )
                )
            else: 
                custom_tools.append(
                    Tool(
                        name=f"{tool_name}",
                        func=func,
                        description=description
                    )
                )

        result_tools = community_tools + custom_tools
        print("Tools:", result_tools)

        return result_tools