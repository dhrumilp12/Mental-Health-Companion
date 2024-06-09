import os
import copy
import pymongo
import json

from dotenv import load_dotenv
from langchain_openai import AzureChatOpenAI, AzureOpenAIEmbeddings
from langchain_community.vectorstores import AzureCosmosDBVectorSearch
from langchain.prompts import PromptTemplate, SystemMessagePromptTemplate
from langchain_core.messages import SystemMessage
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import CharacterTextSplitter
from langchain_community.vectorstores.azure_cosmos_db import (
    AzureCosmosDBVectorSearch,
    CosmosDBSimilarityType,
    CosmosDBVectorSearchType
)
from langchain.agents import Tool
from langchain_community.tools.tavily_search import TavilySearchResults
from langchain.agents.agent_toolkits import create_conversational_retrieval_agent
from langchain_community.chat_message_histories.in_memory import ChatMessageHistory
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain_core.runnables.utils import ConfigurableFieldSpec
from langchain_core.messages.human import HumanMessage
from langchain_core.messages.ai import AIMessage

from tools.azure_mongodb import MongoDBClient

sessions = {}

def setup_langchain(db_name, collection_name, system_prompt):
    """
    Sets up and returns the components necessary for LangChain interaction with Azure OpenAI.
    """
    load_dotenv()
    CONNECTION_STRING = os.getenv("DB_CONNECTION_STRING")
    AOAI_KEY = os.getenv("AOAI_KEY")
    AOAI_ENDPOINT = os.getenv("AOAI_ENDPOINT")
    EMBEDDINGS_DEPLOYMENT_NAME = os.getenv("EMBEDDINGS_DEPLOYMENT_NAME")
    COMPLETIONS_DEPLOYMENT_NAME = os.getenv("COMPLETIONS_DEPLOYMENT_NAME")
    AOAI_API_VERSION = "2024-02-15-preview"

    # Establish Azure OpenAI connectivity without using the unsupported 'deployment' parameter
    llm = AzureChatOpenAI(
        model="gpt-35-turbo",
        deployment_name="mentalHEalth",
        azure_endpoint=AOAI_ENDPOINT,
        api_key=AOAI_KEY,
        api_version=AOAI_API_VERSION
    )

    embedding_model = AzureOpenAIEmbeddings(
        azure_endpoint=AOAI_ENDPOINT,
        api_key=AOAI_KEY,
        api_version=AOAI_API_VERSION,
        model="text-embedding-ada-002",
        deployment_name="MENTAL",
        chunk_size=10
    )

    # Establish connection to the database
    db_client = MongoDBClient.get_client()
    db = db_client[db_name]
    collection = db[collection_name]

    # Initialize vector store
    vector_store = AzureCosmosDBVectorSearch(
        collection=collection,
        embedding=embedding_model,
        index_name="VectorSearchIndex",
        text_key="textContent",
        embedding_key="vectorContent"
    )

    # Instantiate PromptTemplate with the system prompt
    prompt_template = PromptTemplate.from_template(system_prompt)

    return {
        "llm": llm,
        "embedding_model": embedding_model,
        "vector_store": vector_store,
        "prompt_template": prompt_template,
        "db": db
    }


def extract_text(docs, key='description'):
    """
    Extracts text from MongoDB documents using a specified key.

    Args:
        docs (list of pymongo documents): Documents from which to extract text.
        key (str): The key used to extract text from documents.

    Returns:
        list: A list containing the extracted text from each document.
    """
    return [doc.get(key, 'No description available') for doc in docs]


def process_langchain_query(query_string, question, collection_name, system_prompt):
    components = setup_langchain(collection_name, system_prompt)
    llm = components["llm"]
    prompt_template = components["prompt_template"]
    db = components["db"]

    # Fetch documents with descriptions that include the word "yellow"
    query = {"description": {"$regex": query_string, "$options": "i"}}
    documents = db[collection_name].find(query)

    # Extract text content from documents
    text_contents = extract_text(documents)

    # Prepare the product list for the prompt
    objs_list = json.dumps(text_contents, indent=2) if text_contents else "No products found."

    processed_prompt = prompt_template.invoke({collection_name: objs_list, "question": question})
    result = llm.invoke(processed_prompt)

    # Access the assistant's message content
    response_content = result
    return response_content

def get_azure_openai_variables():
    load_dotenv()
    AOAI_ENDPOINT = os.environ.get("AOAI_ENDPOINT")
    AOAI_KEY = os.environ.get("AOAI_KEY")
    AOAI_API_VERSION = "2023-09-01-preview"
    AOAI_EMBEDDINGS = "embeddings"
    AOAI_COMPLETIONS = "completions"

    return AOAI_ENDPOINT, AOAI_KEY, AOAI_API_VERSION, AOAI_EMBEDDINGS, AOAI_COMPLETIONS


def get_azure_openai_llm():
    AOAI_ENDPOINT, AOAI_KEY, AOAI_API_VERSION, _, AOAI_COMPLETIONS = get_azure_openai_variables()

    llm = AzureChatOpenAI(
        temperature = 0.3,
        openai_api_version = AOAI_API_VERSION,
        azure_endpoint = AOAI_ENDPOINT,
        openai_api_key = AOAI_KEY,
        azure_deployment = AOAI_COMPLETIONS
    )

    return llm


def get_cosmosdb_vector_store_retriever(db_name, collection_name, top_k=3):
    CONNECTION_STRING = MongoDBClient.get_mongodb_variables()
    _, _, _, AOAI_EMBEDDINGS, _ = get_azure_openai_variables()

    vector_store = AzureCosmosDBVectorSearch.from_connection_string(
        connection_string = CONNECTION_STRING, 
        namespace = f"{db_name}.{collection_name}", 
        embedding = AOAI_EMBEDDINGS, 
        index_name =f"{db_name}-{collection_name}_index"
    )
    return vector_store.as_retriever(search_kwargs={"k": top_k})


def get_cosmosdb_tool(db_name, collection_name):
    AOAI_ENDPOINT, AOAI_KEY, _, AOAI_EMBEDDINGS, _ = get_azure_openai_variables()

    loader = PyPDFLoader("./cognitive-behavioral.pdf")
    documents = loader.load()
    text_splitter = CharacterTextSplitter(chunk_size=1000, chunk_overlap=0)

    docs = text_splitter.split_documents(documents)

    mongo_client = pymongo.MongoClient(os.environ.get("DB_CONNECTION_STRING"))
    collection = mongo_client[db_name][collection_name]

    openai_embeddings: AzureOpenAIEmbeddings = AzureOpenAIEmbeddings(
        azure_deployment=AOAI_EMBEDDINGS,
        api_key=AOAI_KEY,
        azure_endpoint=AOAI_ENDPOINT
    )

    vectorstore = AzureCosmosDBVectorSearch.from_documents(
        docs,
        openai_embeddings,
        collection=collection,
        index_name=f"{db_name}-{collection_name}_index"
    )


    num_lists = 100
    dimensions = 1536
    similarity_algorithm = CosmosDBSimilarityType.COS
    kind = CosmosDBVectorSearchType.VECTOR_IVF
    m = 16
    ef_construction = 64

    vectorstore.create_index(
        num_lists,
        dimensions,
        similarity_algorithm,
        kind,
        m, 
        ef_construction
    )

    retriever = get_cosmosdb_vector_store_retriever("mentalhealthtestcollection")
    cosmosdb_tool = Tool(
        name = "vector_search_test",
        func = retriever.invoke,
        description = "Searches the Mental Health database for psychology theory."
    )

    return cosmosdb_tool


def find_session(user_id, chat_id):
    if sessions.get((user_id, chat_id)) is None:
        chat_history = ChatMessageHistory()
        sessions[(user_id, chat_id)] = chat_history
    return sessions[(user_id, chat_id)]


def get_user_history(user_id, chat_id):
    """
    Used to find personal details from previous conversations with the user.
    """
    db_client = MongoDBClient.get_client()
    db = db_client[MongoDBClient.get_db()]
    turns = list(db.chat_turns.find({"user_id": user_id, "chat_id": chat_id}).sort({"timestamp": -1}))
    turns.reverse()
    history = []
    
    for turn in turns:
        if turn.get("human_message"):
            history.append(HumanMessage(turn.get("human_message")))
        if turn.get("ai_message"):
            history.append(AIMessage(turn.get("ai_message")))
    
    return history

        
    chat_history = ChatMessageHistory()
    chat_history.add_messages(history)
    sessions[(user_id, chat_id)] = chat_history

def get_mongodb_agent_with_history(llm, tools, db_name, collection_name, message, system_message, user_id, chat_id, timestamp, history=[]):
    CONNECTION_STRING = MongoDBClient.get_mongodb_variables()

    agent_executor = create_conversational_retrieval_agent(
        llm=llm,
        tools=tools,
        system_message=system_message,
        verbose=True
    )

    # message_history = MongoDBChatMessageHistory(
    #     connection_string=CONNECTION_STRING,
    #     session_id=f"{user_id};{timestamp}",
    #     database_name=db_name,
    #     collection_name=collection_name
    # )

    # chat_history = ChatMessageHistory(session_id=)
    # chat_history.add_messages(history)

    agent_with_history = RunnableWithMessageHistory(
        agent_executor,
        find_session,
        input_messages_key="input",
        history_messages_key="chat_history",
        history_factory_config=[
            ConfigurableFieldSpec(
                id="user_id",
                annotation=str,
                name="User ID",
                description="Unique identifier for the user.",
                default="",
                is_shared=True,
            ),
            ConfigurableFieldSpec(
                id="chat_id",
                annotation=str,
                name="Chat ID",
                description="Unique identifier for the chat session.",
                default="",
                is_shared=True,
            ),
        ]
    )

    return agent_with_history


def get_langchain_initial_state(db_name, collection_name, user_id, system_message, timestamp, chat_id=None, history=[]):
    
    db_client = MongoDBClient.get_client()
    db = db_client[MongoDBClient.get_db()]
    user_journey_collection = db["user_journeys"]
    user_journey = user_journey_collection.find_one({"user_id": user_id})
    # Has user engaged with chatbot before?
    if user_journey is None:
        user_journey_collection.insert_one({
            "user_id": user_id,
            "patient_goals": [],
            "therapy_type": [],
            "last_updated": timestamp,
            "therapy_plan": [],
            "mental_health_concerns": []
        })
            
        addendum = """This is your first session with the patient. Be polite and introduce yourself in a friendly and inviting manner.
            In this session, do your best to understand what the user hopes to achieve through your service, and derive a therapy style fitting to
            their needs.        
        """
        
        full_system_message = SystemMessagePromptTemplate.from_template(''.join([system_message, addendum])).format()
        response = get_langchain_agent_response(db_name=db_name, 
                                                collection_name=collection_name, 
                                                system_message=full_system_message, 
                                                message="", 
                                                user_id=user_id, 
                                                chat_id=0,
                                                turn_id=0,
                                                timestamp=timestamp)
        return response
    else:
        recent_turns = list(db.chat_turns.find({"user_id": user_id}).sort({"timestamp": -1}).limit(5))
        recent_turns.reverse()
        history = []
        for turn in recent_turns:
            if turn.get("human_message"):
                history.append(HumanMessage(turn.get("human_message")))
            if turn.get("ai_message"):
                history.append(AIMessage(turn.get("ai_message")))
        
        old_chat_id = recent_turns[0].get("chat_id", -1) + 1
        
        chat_summary = ""
        # chat_summary = db.chat_summaries.find({"user_id": user_id}).sort({"timestamp": -1}).limit(1).next()
        new_chat_id = old_chat_id
        

        addendum = """
            Last Conversation Summary:
            {summary}
        """
        
        system_message_template = SystemMessagePromptTemplate.from_template(''.join([system_message, addendum]))

        full_system_message = system_message_template.format(history=history, summary=chat_summary)
        response = get_langchain_agent_response(db_name=db_name, 
                                                collection_name=collection_name, 
                                                system_message=full_system_message, 
                                                message="",
                                                user_id=user_id, 
                                                chat_id=new_chat_id,
                                                turn_id=0,
                                                timestamp=timestamp,
                                                history=history)
        return response
        
        # last_turn = db.chat_turns.find({"user_id": user_id}).sort({"chat_id": -1}).limit(1).next()
        # Is this a new conversation?
        # if last_turn.get("chat_id") != chat_id or chat_id is None:
            # pass
            # Get summary
            # new_chat_id = chat_summary.get("chat_id") + 1            

        # prompt_template = PromptTemplate.from_template(mod_system_message)
        # prompt = prompt_template.format(user_id=user_id, )



def get_langchain_agent_response(db_name, collection_name, system_message, message, user_id, chat_id, turn_id, timestamp, history=[]):
    llm = get_azure_openai_llm()

    # At the start of a chat turn, we want to load the conversation with the necessary context.
    # Necessary context means:
    # - Summary of the last conversation
    # - Last 5 turns
    # - User journey doc
    # db_client = MongoDBClient.get_client()
    # db = db_client[MongoDBClient.get_db()]
    # chat_summary = db.chat_turns.find({"user_id": user_id}).sort({"timestamp": -1}).limit(1).next()
    # new_chat_id = chat_summary.get("chat_id") + 1


    #TODO: Need to get db_history from MongoDB table
    # db_history = []

    # summarized_memory = ConversationSummaryMemory.from_messages(
    #     llm=llm,
    #     chat_memory=db_history,
    #     return_messages=True
    # )

    search = TavilySearchResults() # Going to use this to connect user to resources
    # cosmosdb_tool = get_cosmosdb_tool(db_name, collection_name)
    tools = [search] #, cosmosdb_tool]

    # memory = ConversationEntityMemory()

    if type(system_message) == str:
        system_message_obj = SystemMessage(system_message)
    else:
        system_message_obj = system_message


    if not history:
        db_client = MongoDBClient.get_client()
        db = db_client[MongoDBClient.get_db()]
        turns = list(db.chat_turns.find({"user_id": user_id, "chat_id": chat_id}).sort({"timestamp": -1}).limit(5))
        turns.reverse()
        history = []
        
        for turn in turns:
            if turn.get("human_message"):
                history.append(HumanMessage(turn.get("human_message")))
            if turn.get("ai_message"):
                history.append(AIMessage(turn.get("ai_message")))

    prompt = f"history:\n{history}\n{message}"

    agent_with_history = get_mongodb_agent_with_history(llm, tools, db_name, collection_name, message, system_message_obj, user_id, chat_id, timestamp, history=history)

    invocation = agent_with_history.invoke(
        { "input": prompt },
        config={"configurable": {"user_id": user_id, "chat_id": chat_id}} 
    )

    db_client = MongoDBClient.get_client()
    db = db_client[MongoDBClient.get_db()]
    chat_turns_collection = db["chat_turns"]

    chat_turns_collection.insert_one({
        "user_id": user_id,
        "chat_id": chat_id,
        "turn_id": turn_id,
        "human_message": invocation.get("input"),
        "ai_message": invocation.get("output"),
        "timestamp": timestamp
    })
    

    return invocation["output"]

    # Chat Turn Schema
    {
        "user_id": "",
        "chat_id": "",
        "turn_id": "",
        "human_message": "",
        "ai_message": "",
        "timestamp": "",
    }

    # Chat Summary Schema
    {
        "user_id": "",
        "chat_id": "",
        "timestamp": "",
        "last_updated": "",
        "perceived_mood": "",
        "summary_text": "",
        "concerns_progress": {
            {
                "label": "",
                "delta": ""
            }
        },
    }

    # User Journey schema
    {
        "user_id": "",
        "patient_goals": [],
        "therapy_type": [],
        "last_updated": "",
        "therapy_plan": [
            {
                "chat_id": "",
                "exercises": "",
                "submit_assignments": [],
                "assign_assignments": [],
                "assign_exercise": [],
                "share_resource": []
            }
        ],
        "mental_health_concerns": [
            {
                "label": "",
                "severity": "",
            }
        ]
    }

    # User Entities Schema
    {
        "user_id": "",
        "entity_id": "",
        "entity_data": []

    }

    # Resources Schema
    {
        "resource_id": "",
        "resource_type": "Article/Video/Contact Information/Exercise",
        "": ""

    }

    # User Resource Schema
    {
        "user_id": "",
        "resource_id": "",
        "user_liked": "",
        "user_viewed": "",
    }

    # At the time of creating a response, we want to save the response to mongodb

    return invocation["output"]

    # Chat Turn Schema
    {
        "user_id": "",
        "chat_id": "",
        "turn_id": "",
        "human_message": "",
        "ai_message": "",
        "timestamp": "",
    }

    # Chat Summary Schema
    {
        "user_id": "",
        "chat_id": "",
        "timestamp": "",
        "last_updated": "",
        "perceived_mood": "",
        "summary_text": "",
        "concerns_progress": {
            {
                "label": "",
                "delta": ""
            }
        },
    }

    # User Journey schema
    {
        "user_id": "",
        "patient_goals": [],
        "therapy_type": [],
        "last_updated": "",
        "therapy_plan": [
            {
                "chat_id": "",
                "exercises": "",
                "submit_assignments": [],
                "assign_assignments": [],
                "assign_exercise": [],
                "share_resource": []
            }
        ],
        "mental_health_concerns": [
            {
                "label": "",
                "severity": "",
            }
        ]
    }

    # User Entities Schema
    {
        "user_id": "",
        "entity_id": "",
        "entity_data": []

    }

    # Resources Schema
    {
        "resource_id": "",
        "resource_type": "Article/Video/Contact Information/Exercise",
        "": ""

    }

    # User Resource Schema
    {
        "user_id": "",
        "resource_id": "",
        "user_liked": "",
        "user_viewed": "",
    }

    # At the time of creating a response, we want to save the response to mongodb

    return invocation["output"]