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
import time
import asyncio
from operator import itemgetter

# -- 3rd Party libraries --
# import spacy

# Azure
# Langchain
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain_core.chat_history import BaseChatMessageHistory
from langchain.memory.chat_memory import BaseChatMemory
from langchain.memory import ConversationSummaryMemory, ConversationBufferMemory
from langchain_core.runnables import RunnablePassthrough
from langchain.agents import create_tool_calling_agent, AgentExecutor
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_mongodb.chat_message_histories import MongoDBChatMessageHistory
from langchain_core.messages import trim_messages

# MongoDB
# -- Custom modules --
from .ai_agent import AIAgent
from server.services.azure_mongodb import MongoDBClient
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
                MessagesPlaceholder(variable_name="history"),
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
            collection_name="history"
        )

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
            history_messages_key="history",
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

        # if not with_history:
        #     return super().run(message)
        # else:
        # TODO: throw error if user_id, chat_id is set to None.
        session_id = f"{user_id}-{chat_id}"
        # kwargs = {
        #     "timestamp": curr_epoch_time
        # }

        invocation = self.agent_executor.invoke(
            {"input": message, "user_id": user_id, "agent_scratchpad": []},
            config={"configurable": {"session_id": session_id}})

        # This updates certain collections in the database based on recent history
        if (turn_id + 1) % PROCESSING_STEP == 0:
            # TODO
            self.exec_update_step(user_id, chat_id)
            pass

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
        user_journey = user_journey_collection.find_one({"user_id": user_id})

        system_message = self.system_message

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
            response = self.run(
                message="",
                with_history=False,
                user_id=user_id,
                chat_id=0,
                turn_id=0,
            )

            return {
                "message": response,
                "chat_id": 0
            }

        else:
            # TODO: Must implement either remembering from previous conversation or knowing things from user profile
            try:
                # SessionIds in history are expected to start with the user_id and end with the chat_id
                last_turn = db["history"].find({"SessionId": {"$regex": user_id}}).sort(
                    {"timestamp": -1}).limit(1).next()
            except StopIteration:
                last_turn = {}

            old_chat_id = int(last_turn["SessionId"].split('-')[-1])

            new_chat_id = old_chat_id + 1

            response = self.run(
                message="",
                with_history=True,
                user_id=user_id,
                chat_id=new_chat_id,
                turn_id=0,
            )

            return {
                "message": response,
                "chat_id": new_chat_id
            }
        

    # def analyze_chat(self, text):
    #     """Analyze the chat text to determine emotional state and detect triggers."""
    #     doc = nlp(text)
    #     emotions = [token for token in doc if token.dep_ ==
    #                 "amod" and token.head.pos_ == "NOUN"]
    #     triggers = [ent.text for ent in doc.ents if ent.label_ in [
    #         "PERSON", "ORG", "GPE"]]

    #     # Initialize a dictionary to hold detected patterns and suggested interventions
    #     patterns = {}

    #     # Detecting various emotional states based on keywords
    #     lower_text = text.lower()  # Convert text to lower case for case insensitive matching
    #     if any(keyword in lower_text for keyword in ["overwhelmed", "stressed", "too much", "can't handle", "pressure"]):
    #         patterns['Stress or Overwhelm'] = [
    #             "Consider taking a short break to clear your mind.",
    #             "Engage in some deep breathing exercises or meditation to relax.",
    #             "Explore these resources on time management to help organize your tasks better."
    #         ]
    #     if any(keyword in lower_text for keyword in ["anxious", "worry", "nervous", "scared", "panic"]):
    #         patterns['Anxiety'] = [
    #             "Try grounding techniques like the 5-4-3-2-1 method to calm your senses.",
    #             "It might be helpful to talk to a friend or counselor about your feelings.",
    #             "Check out these tips for managing anxiety and reducing stress."
    #         ]
    #     if any(word in lower_text for word in ["angry", "mad", "frustrated", "upset", "annoyed"]):
    #         patterns['Anger or Frustration'] = [
    #             "Try counting to ten or practicing deep breathing.",
    #             "Engage in some physical activity to release energy.",
    #             "Consider learning more about conflict resolution skills."
    #         ]
    #     if any(word in lower_text for word in ["lonely", "alone", "isolated", "no one", "abandoned"]):
    #         patterns['Loneliness'] = [
    #             "Consider joining community groups or online forums to connect with others.",
    #             "Reach out to family or friends for a chat.",
    #             "Explore resources to develop social skills or find social activities."
    #         ]
    #     if any(word in lower_text for word in ["scared", "fear", "terrified", "fright", "panic"]):
    #         patterns['Fear'] = [
    #             "Practice controlled breathing to manage acute fear.",
    #             "Explore exposure therapy techniques under professional guidance.",
    #             "Seek professional help if fears persist."
    #         ]
    #     if any(word in lower_text for word in ["confused", "lost", "unclear", "disoriented", "bewildered"]):
    #         patterns['Confusion or Disorientation'] = [
    #             "Organizational tools or apps might help structure daily tasks.",
    #             "Try mindfulness exercises to enhance mental clarity.",
    #             "Discussing these feelings with a mentor or counselor could be beneficial."
    #         ]
    #     if any(word in lower_text for word in ["grief", "loss", "mourn", "bereaved", "miss"]):
    #         patterns['Grief or Loss'] = [
    #             "Joining support groups for similar experiences might help.",
    #             "Consider seeking grief counseling or therapy.",
    #             "Healthy grieving practices, such as memorializing the lost one, can be therapeutic."
    #         ]
    #     if any(word in lower_text for word in ["excited", "nervous", "jittery", "thrilled", "restless"]):
    #         patterns['Excitement or Nervousness'] = [
    #             "Channel your excitement into productive activities.",
    #             "Use techniques like visualization or positive affirmations to calm nerves.",
    #             "Balance excitement with downtime to avoid burnout."
    #         ]

    #     return {"emotions": emotions, "triggers": triggers, "patterns": patterns}

    # def _run(self, message: str, with_history=True, user_id=None, chat_id=None, turn_id=None):
    #     try:
    #         if not with_history:
    #             return super().run(message)

    #         # memory = self.get_agent_memory(user_id, chat_id)
    #         memory = {
    #             "buffer": []
    #         }
    #         if not memory:
    #             return "Error: Unable to retrieve conversation history."

    #         if memory.buffer:
    #             addendum = f"""
    #             Previous Conversation Summary:
    #             {memory.buffer}
    #             """
    #             self.system_message.content = f"{self.system_message.content}\n{addendum}"

    #         agent_with_history = self.get_agent_with_history(memory)

    #         # Analyze the message for emotional content
    #         analysis_results = self.analyze_chat(message)
    #         response_addendum = self.format_response_addendum(analysis_results)

    #         # Invoke the agent with history context
    #         invocation = agent_with_history.invoke({"input": f"{message}\n{response_addendum}"}, config={
    #                                                "configurable": {"user_id": user_id, "chat_id": chat_id}})

    #         self.write_agent_response_to_db(
    #             invocation, user_id, chat_id, turn_id)

    #         return invocation["output"]

    #     except Exception as e:
    #         return f"An error occurred: {str(e)}"

    # def format_response_addendum(self, analysis_results):
    #     patterns = analysis_results['patterns']
    #     response_addendum = ""
    #     for state, suggestions in patterns.items():
    #         response_addendum += f"Detected {state}: " + \
    #             "; ".join(suggestions) + "\n"
    #     return response_addendum.strip()




# Agent Fact:
# Prepopulate to DB
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
