from enum import Enum
from pymongo import ASCENDING

from langchain_core.messages.human import HumanMessage
from langchain_core.messages.ai import AIMessage
from langchain_community.chat_message_histories.in_memory import ChatMessageHistory
from langchain.agents.agent_toolkits import create_conversational_retrieval_agent
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain_core.runnables.utils import ConfigurableFieldSpec
from langchain.memory import ConversationSummaryMemory
from langchain_core.messages import SystemMessage
from langchain_community.tools.tavily_search import TavilySearchResults

from .ai_agent import AIAgent
from services.azure_mongodb import MongoDBClient
from services.azure import get_azure_openai_llm

class ChatHistoryScope(Enum):
    ALL = "all",
    PREVIOUS = "previous"
    CURRENT = "current"


class MentalHealthAIAgent(AIAgent):
    """
    The MentalHealthAIAgent creates Aria, an AI agent
    that can provide support and guidance to users.
    It has access to user profiles, user journeys,
    user entities, chat summaries, chat turns, resources, 
    and user resources.
    """
    db = MongoDBClient.get_client()

    def __init__(self, session_id: str, system_message, db_name, schema):
        system_message = """
        Lorem ipsum il dolor.
        """
        super().__init__(session_id, system_message, schema)

        self.agent_executor = self.get_agent_with_history(
            llm=self.llm,
        )
    

    @staticmethod
    def get_user_by_id(user_id:str) -> str:
        """
        Retrieves a user by their ID.
        """
        
        doc = MentalHealthAIAgent.db.users.find_one({"_id": user_id})


    def get_chat_history(self, user_id, chat_id, history_scope:ChatHistoryScope):
        """
        Used to find personal details from previous conversations with the user.
        """
        db_client = MongoDBClient.get_client()
        db = db_client[MongoDBClient.get_db()]
        collection = db["chat_turns"]

        # Check if the 'timestamp' index already exists
        indexes = collection.list_indexes()
        if not any(index['key'].get('timestamp') for index in indexes):
            collection.create_index([('timestamp', ASCENDING)])

        turns = []
        if history_scope == ChatHistoryScope.ALL:
            turns = list(collection.find({"user_id": user_id}).sort({"timestamp": -1}).limit(5))
        elif history_scope == ChatHistoryScope.PREVIOUS:
            turns = list(collection.find({"user_id": user_id, "chat_id": (chat_id - 1)}).sort({"timestamp": -1}))
        elif history_scope == ChatHistoryScope.CURRENT:
            turns = list(collection.find({"user_id": user_id, "chat_id": chat_id}).sort({"timestamp": -1}).limit(5))

        turns.reverse()
        history_list = []
        
        for turn in turns:
            if turn.get("human_message"):
                history_list.append(HumanMessage(turn.get("human_message")))
            if turn.get("ai_message"):
                history_list.append(AIMessage(turn.get("ai_message")))

        chat_history = ChatMessageHistory()
        chat_history.add_messages(history_list)
        
        return chat_history


    def get_agent_with_history(self, tools, system_message, memory):
        agent_executor = create_conversational_retrieval_agent(
            tools=tools,
            system_message=system_message,
            verbose=True
        )

        agent_with_history = RunnableWithMessageHistory(
            agent_executor,
            lambda chat_id, user_id: memory.chat_memory,
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


    def prepare_tools():
        search = TavilySearchResults()
        # cosmosdb_tool = get_cosmosdb_tool(db_name, collection_name)
        return [search]#, cosmosdb_tool

    
    def get_agent_response(self, db_name, collection_name, system_message, message, user_id, chat_id, turn_id, timestamp, history_scope=[]):
        # Step 1: Prep llm, tools, and memory
        llm = get_azure_openai_llm()
        tools = self.prepare_tools()
        chat_history = self.get_chat_history(user_id, chat_id, history_scope)
        
        memory = ConversationSummaryMemory.from_messages(
            llm=llm,
            chat_memory=chat_history,
            return_messages=True
        )
        
        # Step 2: Set up agent
        # prompt = f"{message}" #```Conversation Log:{memory.buffer}```\n\n

        if type(system_message) == str:
            addendum = f"""
            Previous Conversation Summary:
            {memory.buffer}
            """        
            full_system_message = f"{system_message}\n{addendum}"
            system_message_obj = SystemMessage(full_system_message)
        else:
            system_message_obj = system_message

        agent_with_history = self.get_agent_with_history(llm, tools, system_message_obj, memory=memory, user_id=user_id, chat_id=chat_id)

        # Step 3: Get AI response
        invocation = agent_with_history.invoke(
            { "input": message },
            config={"configurable": {"user_id": user_id, "chat_id": chat_id}} 
        )

        # Step 4: Write to chat turn to db
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


    def get_initial_greeting(self, db_name, collection_name, user_id, system_message, timestamp, history=[]):
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
            
            full_system_message = ''.join([system_message, addendum])
            response = self.get_agent_response(db_name=db_name, 
                                                    collection_name=collection_name, 
                                                    system_message=full_system_message, 
                                                    message="", 
                                                    user_id=user_id, 
                                                    chat_id=0,
                                                    turn_id=0,
                                                    timestamp=timestamp)
            return { "message": response, 
                    "chat_id": 0 }
        else:
            try:
                last_turn = db.chat_turns.find({"user_id": user_id}).sort({"timestamp": -1}).limit(1).next()
            except StopIteration:
                last_turn = {}

            old_chat_id = last_turn.get("chat_id", -1)
            new_chat_id = old_chat_id + 1

            addendum = """
                Last Conversation Summary:
                {summary}
            """
            response = self.get_agent_response(db_name=db_name, 
                                                    collection_name=collection_name, 
                                                    system_message=system_message, 
                                                    message="",
                                                    user_id=user_id, 
                                                    chat_id=new_chat_id,
                                                    turn_id=0,
                                                    timestamp=timestamp,
                                                    history_scope=ChatHistoryScope.PREVIOUS)
            return {
                "message": response,
                "chat_id": new_chat_id
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


def get_cosmosdb_vector_store_retriever(db_name, collection_name, top_k=3):
    CONNECTION_STRING = MongoDBClient.get_mongodb_variables()
    _, _, _, AOAI_EMBEDDINGS, _ = get_azure_openai_variables()

    vector_store = AzureCosmosDBVectorSearch.from_connection_string(
        connection_string = CONNECTION_STRING, 
        namespace = f"{db_name}.{collection_name}", 
        embedding = AOAI_EMBEDDINGS, 
        index_name =f"{db_name}_{collection_name}_index"
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