# -- Standard libraries --
# -- 3rd Party libraries --
# Azure
# Langchain
# MongoDB
# -- Custom modules --

"""
This module defines a class used to generate AI agents centered around mental health applications.
"""

# -- Standard libraries --
from datetime import datetime
import logging
import asyncio
from operator import itemgetter

# -- 3rd Party libraries --
# import spacy

# Azure
# Langchain
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain_core.chat_history import BaseChatMessageHistory
from langchain.memory.chat_memory import BaseChatMemory
from langchain.memory.summary import ConversationSummaryMemory
from langchain_core.runnables import RunnablePassthrough
from langchain.agents import create_tool_calling_agent, AgentExecutor
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_mongodb.chat_message_histories import MongoDBChatMessageHistory
from langchain_core.messages import trim_messages
from langchain_core.messages.human import HumanMessage

# MongoDB
# -- Custom modules --
from .ai_agent import AIAgent
from services.azure_mongodb import MongoDBClient
# Constants
from utils.consts import SYSTEM_MESSAGE
from utils.consts import PROCESSING_STEP

# Load spaCy model
# nlp = spacy.load("en_core_web_sm")


class MentalHealthAIAgent(AIAgent):
    """
    A class that captures the data and methods required for
    mental health applications.
    It accesses to user profiles, user journeys,
    user entities, chat summaries, chat turns, resources, 
    and user resources.
    """

    def __init__(self, system_message: str = SYSTEM_MESSAGE, tool_names: list[str] = []):
        """
        Initializes a MentalHealthAgent object.

        Args:
            system_message (str): The system message to be displayed at the beginning of the conversation.
            schema (list[str]): A list of object names that defines which custom tools the agent will use.

        Returns:
            None
        """
        super().__init__(system_message, tool_names)

        self.prompt = ChatPromptTemplate.from_messages(
            [
                ("system", self.system_message.content),
                ("system", "user_id:{user_id}"),
                MessagesPlaceholder(variable_name="chat_turns"),
                ("human", "{input}"),
                MessagesPlaceholder(variable_name="agent_scratchpad"),
            ]
        )

        self.agent = create_tool_calling_agent(self.llm, self.tools, self.prompt)
        executor:AgentExecutor = AgentExecutor(
            agent=self.agent, tools=self.tools, verbose=True, handle_parsing_errors=True)
        self.agent_executor = self.get_agent_with_history(executor)


    def get_session_history(self, session_id: str) -> MongoDBChatMessageHistory:
        """
        Retrieves the chat history for a given session ID from the database.

        Args:
            session_id (str): The session ID to retrieve the chat history for.
        """
        CONNECTION_STRING = MongoDBClient.get_mongodb_variables()

        history = MongoDBChatMessageHistory(
            CONNECTION_STRING,
            session_id,
            MongoDBClient.get_db_name(),
            collection_name="chat_turns"
        )

        logging.info(f"Retrieved chat history for session {history}")
        if history is None:
            return []
        else:
            return history

    def get_agent_memory(self, user_id:str, chat_id:int) -> BaseChatMemory:
            """
            Retrieves the agent's memory given the ID's for a specific user and chat instance.

            Args:
                user_id (str): The ID of the user.
                chat_id (int): The ID of the chat.

            Returns:
                BaseChatMemory: The agent's memory for the specified user and chat.
            """
            # chat_history = self.get_chat_history(user_id, chat_id)

            # memory = ConversationSummaryMemory.from_messages(
            #     llm=self.llm,
            #     chat_memory=chat_history,
            #     return_messages=True
            # )

            # TODO: Rewrite function or remove if not used anymore
            memory = None

            return memory

    def get_agent_with_history(self, agent_executor) -> RunnableWithMessageHistory:
        """
        Wraps the agent executor with a message history object to use history within the conversation.

        Args:
            agent_executor (AgentExecutor): The agent executor to wrap with message history.
        """

        agent_with_history = RunnableWithMessageHistory(
            agent_executor,
            get_session_history=self.get_session_history,
            input_messages_key="input",
            history_messages_key="chat_turns",
            verbose=True
        )

        return agent_with_history


    def get_agent_executor(self, prompt):
        """
        Retrieves an agent executor that runs the agent workflow.

        Args:
            prompt (ChatPromptTemplate): The LangChain prompt object to be passed to the executor.
        """
        tools = self.get_agent_tools()
        agent = create_tool_calling_agent(self.llm, tools, prompt)
        agent_executor = AgentExecutor(
            agent=agent, tools=tools, verbose=True, handle_parsing_errors=True)

        return agent_executor

    def get_user_mood(self, user_id, chat_id):
        history:BaseChatMessageHistory = self.get_session_history(f"{user_id}-{chat_id}")
        history_log = asyncio.run(history.aget_messages()) # Running async function as synchronous

        # Get perceived mood
        instructions = """
        Given the messages provided, describe the user's mood in a single adjective. 
        Do your best to capture their intensity, attitude and disposition in that single word.
        Do not include anything in your response aside from that word.
        If you cannot complete this task, just answer \"None\".
        """

        prompt = ChatPromptTemplate.from_messages(
            [
                ("system", instructions),
                MessagesPlaceholder(variable_name="messages"),
            ]
        )

        trimmer = trim_messages(
            max_tokens=65,
            strategy="last",
            token_counter=self.llm,
            include_system=True,
            allow_partial=False,
            start_on="human",
        )

        trimmer.invoke(history_log)
        chain = RunnablePassthrough.assign(messages=itemgetter("messages") | trimmer) | prompt | self.llm
        response = chain.invoke({"messages": history_log})
        user_mood = None if response.content == "None" else response.content

        print("The user is feeling: ", user_mood)

        return user_mood


    def exec_update_step(self, user_id, chat_id=None, turn_id=None):
        # Chat Summary:
        # Update every 5 chat turns
        # Therapy Material
        # Maybe not get it from DB at all? Just perform Bing search?
        # User Entity:
        # Can be saved from chat summary step, every 5 chat turns
        # User Journey:
        # Can be either updated at the end of the chat, or every 5 chat turns
        # User Material:
        # Possibly updated every 5 chat turns, at the end of a chat, or not at all



        # agent_with_history = RunnableWithMessageHistory(
        #     chain,
        #     get_session_history=lambda _: memory,
        #     input_messages_key="input",
        #     history_messages_key="history",
        #     verbose=True
        # )
        

        # self.agent = create_tool_calling_agent(self.llm, self.tools, self.prompt)
        # stateless_agent_executor:AgentExecutor = AgentExecutor(
        #     agent=self.agent, tools=self.tools, verbose=True, handle_parsing_errors=True)
        
        # history=self.get_session_history(f"{user_id}-{chat_id}-{}")
        # Must invoke with an agent that will not write to DB
        # invocation = stateless_agent_executor.invoke(
        #     {"input": f"{message}\nuser_id:{user_id}", "agent_scratchpad": []})

        # Get summary text
        pass
    
    @staticmethod
    def get_chat_id(user_id):
        db_client = MongoDBClient.get_client()
        db_name = MongoDBClient.get_db_name()
        db = db_client[db_name]

        chat_summary_collection = db["chat_summaries"]
    
        most_recent_chat_summary = chat_summary_collection.find_one(
            {"user_id": user_id}, 
            sort=[("chat_id", -1)]
        )

        return most_recent_chat_summary.get("chat_id")


    def run(self, message: str, with_history:bool =True, user_id: str=None, chat_id:int=None, turn_id:int=None) -> str:
        """
        Runs the agent with the given message and context.

        Args:
            message (str): The message to be processed by the agent.
            with_history (bool): A flag indicating whether to use history in the conversation.
            user_id (str): A unique identifier for the user.
            chat_id (int): A unique identifier for the conversation.
            turn_id (int): A unique identifier for the evaluated turn in the conversation.
        """


        chat_id = MentalHealthAIAgent.get_chat_id(user_id)

       
        # TODO: throw error if user_id, chat_id is set to None.
        session_id = f"{user_id}-{chat_id}"
       

        invocation = self.agent_executor.invoke(
            {"input": message, "user_id": user_id, "agent_scratchpad": []},
            config={"configurable": {"session_id": session_id}})

        return invocation["output"]


    def get_initial_greeting(self, user_id:str) -> dict:
        """
        Retrieves the initial greeting message for a user.

        Args:
            user_id (str): The unique identifier for the user.
        """
        db_client = MongoDBClient.get_client()
        db_name = MongoDBClient.get_db_name()
        db = db_client[db_name]

        user_journey_collection = db["user_journeys"]
        chat_summary_collection = db["chat_summaries"]
        user_journey = user_journey_collection.find_one({"user_id": user_id})

        system_message = self.system_message


        now = datetime.now()
        chat_id = int(now.timestamp())

        chat_summary_collection.insert_one({
                "user_id": user_id,
                "chat_id": chat_id,
                "perceived_mood": "",
                "summary_text": "",
                "concerns_progress": []
        })

        # Has user engaged with chatbot before?
        if user_journey is None:
            user_journey_collection.insert_one({
                "user_id": user_id,
                "patient_goals": [],
                "therapy_type": [],
                "last_updated": datetime.now().isoformat(),
                "therapy_plan": [],
                "mental_health_concerns": []
            })

            addendum = """This is your first session with the patient. Be polite and introduce yourself in a friendly and inviting manner.
                In this session, do your best to understand what the user hopes to achieve through your service, and derive a therapy style fitting to
                their needs.        
            """

            full_system_message = ''.join([system_message.content, addendum])
            system_message.content = full_system_message

        chat_id = MentalHealthAIAgent.get_chat_id(user_id)

        response = self.run(
            message="",
            with_history=True,
            user_id=user_id,
            chat_id=chat_id,
            turn_id=0,
        )

        return {
            "message": response,
            "chat_id": chat_id
        }
        

    def get_summary_from_chat_history(self, user_id, chat_id):
        history:BaseChatMessageHistory = self.get_session_history(f"{user_id}-{chat_id}")

        memory = ConversationSummaryMemory.from_messages(
            llm=self.llm,
            chat_memory=history,
            return_messages=True
        )

        return memory.buffer


    def perform_final_processes(self, user_id, chat_id):
        db_client = MongoDBClient.get_client()
        db_name = MongoDBClient.get_db_name()
        db = db_client[db_name]

        chat_summary_collection = db["chat_summaries"]

        mood = self.get_user_mood(user_id, chat_id)
        summary = self.get_summary_from_chat_history(user_id, chat_id)

        # Update the chat summary
        result = chat_summary_collection.update_one(
            {"user_id": user_id, "chat_id": int(chat_id)}, 
            {"$set": {"perceived_mood": mood, "summary_text": summary}}
        )

        print(result)
        pass