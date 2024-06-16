from datetime import datetime
import spacy
import json

from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain.memory import ConversationSummaryMemory
from langchain_community.utilities import BingSearchAPIWrapper
from langchain_community.tools.tavily_search import TavilySearchResults
from langchain.agents import Tool, create_tool_calling_agent, AgentExecutor
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_mongodb.chat_message_histories import MongoDBChatMessageHistory
from langchain_core.messages import SystemMessage

from .ai_agent import AIAgent
from services.azure_mongodb import MongoDBClient
from utils.consts import SYSTEM_MESSAGE
from utils.consts import AGENT_FACTS
from utils.consts import PROCESSING_STEP
from utils.docs import format_docs
from models.agent_fact import AgentFact
from models.chat_summary import ChatSummary
from models.chat_turn import ChatTurn


# Load spaCy model
nlp = spacy.load("en_core_web_sm")


class MentalHealthAIAgent(AIAgent):
    """
    The MentalHealthAIAgent creates Aria, an AI agent
    that can provide support and guidance to users.
    It has access to user profiles, user journeys,
    user entities, chat summaries, chat turns, resources, 
    and user resources.
    """

    def __init__(self, system_message=SYSTEM_MESSAGE, schema=[]):
        super().__init__(system_message, schema)

        self.system_message = SystemMessage(system_message)
        self.prompt = ChatPromptTemplate.from_messages(
                [
                    ("system", self.system_message.content),
                    MessagesPlaceholder(variable_name="history"),
                    ("human", "{input}"),
                    MessagesPlaceholder(variable_name="agent_scratchpad"),
                ]
            )
        
        self.agent_executor = self.get_agent_executor(self.prompt)


    def get_session_history(self, session_id: str) -> MongoDBChatMessageHistory:
        history = MongoDBChatMessageHistory(
            MongoDBClient.get_mongodb_variables(),
            session_id,
            MongoDBClient.get_db_name(),
            collection_name="history"
        )

        if history is None:
            return []
        else:
            return history


    def get_agent_memory(self, user_id, chat_id):
        # chat_history = self.get_chat_history(user_id, chat_id)

        # memory = ConversationSummaryMemory.from_messages(
        #     llm=self.llm,
        #     chat_memory=chat_history,
        #     return_messages=True
        # )

        # TODO: Rewrite function or remove if not used anymore
        memory = None

        return memory


    def get_agent_with_history(self, agent_executor):
        agent_with_history = RunnableWithMessageHistory(
            agent_executor,
            get_session_history=self.get_session_history,
            input_messages_key="input",
            history_messages_key="history",
            verbose=True
        )

        return agent_with_history    


    def prepare_tools(self):
        # search = BingSearchAPIWrapper(k=5)
        search = TavilySearchResults()
        community_tools = [search]

        # cosmosdb_tool = get_cosmosdb_tool(db_name, collection_name)
        agent_facts_retriever_chain = self._get_cosmosdb_vector_store_retriever("agent_facts") | format_docs
        # user_profiles_retriever_chain = self._get_cosmosdb_vector_store_retriever("users") | format_docs
        # user_journeys_retriever_chain = self._get_cosmosdb_vector_store_retriever("user_journeys") | format_docs
        # user_materials_retriever_chain = self._get_cosmosdb_vector_store_retriever("user_materials") | format_docs
        # user_entities_retriever_chain = self._get_cosmosdb_vector_store_retriever("user_entities") | format_docs
        # agent_facts_retriever_chain = self._get_cosmosdb_vector_store_retriever("agent_facts") | format_docs

        custom_tools = [
            Tool(
                name="vector_search_agent_facts",
                func=agent_facts_retriever_chain.invoke,
                description="Searches for facts about the agent itself."
            ),
            # Tool(
            #     name = "vector_search_user_journeys",
            #     func = user_profiles_retriever_chain.invoke,
            #     description = "Searches a user's profile for personal information."
            # ),
            # Tool(
            #     name = "vector_search_user_journeys",
            #     func = user_journeys_retriever_chain.invoke,
            #     description = "Searches a mental health patient's user journey."
            # ),
            # Tool(
            #     name = "vector_search_user_materials",
            #     func = user_materials_retriever_chain.invoke,
            #     description = ""
            # ),
            # Tool(
            #     name = "vector_search_user_entities",
            #     func = user_entities_retriever_chain.invoke,
            #     description = ""
            # ),
            # Tool(
            #     name = "vector_search_agent_facts",
            #     func = agent_facts_retriever_chain.invoke,
            #     description = ""
            # )
        ]

        all_tools = community_tools + custom_tools
        return all_tools

    
    def get_agent_executor(self, prompt):
        tools = self.prepare_tools()
        agent = create_tool_calling_agent(self.llm, tools, prompt)
        agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)

        return agent_executor  
    

    def run(self, message: str, with_history=True, user_id=None, chat_id=None, turn_id=None):
        # if not with_history:
        #     return super().run(message)
        # else:

            # TODO: throw error if user_id, chat_id is set to None.
        session_id = f"{user_id}-{chat_id}"


        agent_with_history = self.get_agent_with_history(self.agent_executor)

        invocation = agent_with_history.invoke(
            {"input": message, "agent_scratchpad": []},
            config={"configurable": {"session_id": session_id}}
        )

        # This updates certain collections in the database based on recent history
        if (turn_id + 1) % PROCESSING_STEP == 0:
            # TODO
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

            self.update_chat_summary(user_id, chat_id)
            self.update_user_entities()
            self.update_user_journey()

        return invocation["output"]

    def update_chat_summary(self, user_id, chat_id):
        # TODO: Redo this function
        pass

        # collection: Collection = self.db["chat_summaries"]
        # loader = None
        # last_summary = None
        # latest_turns = None
        # current_summary = None

        # query_filter = {
        #     "user_id": user_id,
        #     "chat_id": chat_id
        # }
        # If chat summary is empty, use the chat summary from last session.
        # if collection.count_documents(query_filter):
        #     last_summary = MongoDBClient.get_mongodb_loader("chat_summaries", {
        #         "user_id": user_id,
        #         "chat_id": int(chat_id) - 1
        #     }).load()

        #     pass

        #     # last_summary:ChatSummary = ChatSummary.model_validate(collection.find_one())
        # else:

        # If chat summary is not empty, use the latest chat summary and grab the latest 5 turns
        # loader_output = MongoDBClient.get_mongodb_loader("chat_summaries", {
        #     "user_id": user_id,
        #     "chat_id": int(chat_id) - 1
        # }).load()
        # last_summary:ChatSummary = ChatSummary.model_validate(collection.find_one(query_filter))
        # latest_turns = list(collection.find({"user_id": user_id, "chat_id": chat_id}).sort({"timestamp": -1}).limit(5))
        # pass
        # try:
        #     last_summary: ChatSummary = ChatSummary.model_validate(collection.find_one({
        #         "user_id": user_id,
        #         "chat_id": int(chat_id) - 1
        #     }))
        # except ValidationError as e:
        #     print(e)
        #     last_summary = ChatSummary.model_construct()

        # summary_message = AIMessage(last_summary.summary_text)

        # turns = self.db["chat_turns"].find(
        #     {"user_id": user_id, "chat_id": chat_id}).sort({"timestamp": -1}).limit(5)
        # latest_turns: list[ChatTurn] = [
        #     ChatTurn.model_validate(turn) for turn in turns]
        # conversation_log = []

        # for turn in latest_turns:
        #     conversation_log.append(HumanMessage(turn.human_message))
        #     conversation_log.append(AIMessage(turn.ai_message))

        # summary_template = """
        #     Given the following summary and most recent conversation log, generate a new summary that updates and rewrites the existing summary as needed to
        #     capture the most salient points of the conversation log.
        #     Summary so far:
        #     {summary}

        #     Latest conversation log:
        #     {conversation_log}
        # """

        # summary_prompt = PromptTemplate.from_template(summary_template)

        # result = summary_prompt.invoke(
        #     {"summary": summary_message, "conversation_log": conversation_log})

    def update_user_entities(self):
        # TODO
        pass

    def update_user_journey(self):
        # TODO
        pass

    def update_collections(self):
        # TODO
        pass


    @staticmethod
    def load_agent_facts_to_db():
        db = MongoDBClient.get_client()[MongoDBClient.get_db_name()]
        collection = db["agent_facts"]

        if collection.count_documents({}) == 0:
            print("There are no documents in Agent Facts. writing documents...")
            validated_models: list[AgentFact] = [
                AgentFact.model_validate(fact_dict) for fact_dict in AGENT_FACTS]
            facts_to_load = [AgentFact.model_dump(
                fact_model) for fact_model in validated_models]
            collection.insert_many(facts_to_load)
        else:
            print("Agent facts are already populated. Skipping step.")


    def analyze_chat(self, text):
        """Analyze the chat text to determine emotional state and detect triggers."""
        doc = nlp(text)
        emotions = [token for token in doc if token.dep_ == "amod" and token.head.pos_ == "NOUN"]
        triggers = [ent.text for ent in doc.ents if ent.label_ in ["PERSON", "ORG", "GPE"]]

         # Initialize a dictionary to hold detected patterns and suggested interventions
        patterns = {}

        # Detecting various emotional states based on keywords
        lower_text = text.lower()  # Convert text to lower case for case insensitive matching
        if any(keyword in lower_text for keyword in ["overwhelmed", "stressed", "too much", "can't handle", "pressure"]):
            patterns['Stress or Overwhelm'] = [
                "Consider taking a short break to clear your mind.",
                "Engage in some deep breathing exercises or meditation to relax.",
                "Explore these resources on time management to help organize your tasks better."
            ]
        if any(keyword in lower_text for keyword in ["anxious", "worry", "nervous", "scared", "panic"]):
            patterns['Anxiety'] = [
                "Try grounding techniques like the 5-4-3-2-1 method to calm your senses.",
                "It might be helpful to talk to a friend or counselor about your feelings.",
                "Check out these tips for managing anxiety and reducing stress."
            ]
        if any(word in lower_text for word in ["angry", "mad", "frustrated", "upset", "annoyed"]):
            patterns['Anger or Frustration'] = [
                "Try counting to ten or practicing deep breathing.",
                "Engage in some physical activity to release energy.",
                "Consider learning more about conflict resolution skills."
            ]
        if any(word in lower_text for word in ["lonely", "alone", "isolated", "no one", "abandoned"]):
            patterns['Loneliness'] = [
                "Consider joining community groups or online forums to connect with others.",
                "Reach out to family or friends for a chat.",
                "Explore resources to develop social skills or find social activities."
            ]
        if any(word in lower_text for word in ["scared", "fear", "terrified", "fright", "panic"]):
            patterns['Fear'] = [
                "Practice controlled breathing to manage acute fear.",
                "Explore exposure therapy techniques under professional guidance.",
                "Seek professional help if fears persist."
            ]
        if any(word in lower_text for word in ["confused", "lost", "unclear", "disoriented", "bewildered"]):
            patterns['Confusion or Disorientation'] = [
                "Organizational tools or apps might help structure daily tasks.",
                "Try mindfulness exercises to enhance mental clarity.",
                "Discussing these feelings with a mentor or counselor could be beneficial."
            ]
        if any(word in lower_text for word in ["grief", "loss", "mourn", "bereaved", "miss"]):
            patterns['Grief or Loss'] = [
                "Joining support groups for similar experiences might help.",
                "Consider seeking grief counseling or therapy.",
                "Healthy grieving practices, such as memorializing the lost one, can be therapeutic."
            ]
        if any(word in lower_text for word in ["excited", "nervous", "jittery", "thrilled", "restless"]):
            patterns['Excitement or Nervousness'] = [
                "Channel your excitement into productive activities.",
                "Use techniques like visualization or positive affirmations to calm nerves.",
                "Balance excitement with downtime to avoid burnout."
            ]

        return {"emotions": emotions, "triggers": triggers, "patterns": patterns}

    def _run(self, message: str, with_history=True, user_id=None, chat_id=None, turn_id=None):
        try:
            if not with_history:
                return super().run(message)

            # memory = self.get_agent_memory(user_id, chat_id)
            memory = {
                "buffer": []
            }
            if not memory:
                return "Error: Unable to retrieve conversation history."

            if memory.buffer:
                addendum = f"""
                Previous Conversation Summary:
                {memory.buffer}
                """
                self.system_message.content = f"{self.system_message.content}\n{addendum}"

            agent_with_history = self.get_agent_with_history(memory)

            # Analyze the message for emotional content
            analysis_results = self.analyze_chat(message)
            response_addendum = self.format_response_addendum(analysis_results)

            # Invoke the agent with history context
            invocation = agent_with_history.invoke({"input": f"{message}\n{response_addendum}"}, config={"configurable": {"user_id": user_id, "chat_id": chat_id}})

            self.write_agent_response_to_db(invocation, user_id, chat_id, turn_id)

            return invocation["output"]

        except Exception as e:
            return f"An error occurred: {str(e)}"

    def format_response_addendum(self, analysis_results):
        patterns = analysis_results['patterns']
        response_addendum = ""
        for state, suggestions in patterns.items():
            response_addendum += f"Detected {state}: " + \
                "; ".join(suggestions) + "\n"
        return response_addendum.strip()



    def get_initial_greeting(self, user_id):
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

    def get_user_profile_by_user_id(self, user_id: str) -> str:
        """
        Retrieves a user journey by the user's ID.
        """
        doc = self.db["users"].find_one({"user_id": user_id})
        if "contentVector" in doc:
            del doc["contentVector"]
        return json.dumps(doc)

    def get_user_journey_by_user_id(self, user_id: str) -> str:
        """
        Retrieves a user journey by the user's ID.
        """
        doc = self.db["user_journeys"].find_one({"user_id": user_id})
        if "contentVector" in doc:
            del doc["contentVector"]
        return json.dumps(doc)

    def get_chat_summary_by_composite_id(self, user_id: str, chat_id: str) -> str:
        """
        Retrieves a summary of a chat between a user and the agent by a
        combination of the user's ID and the chat instance ID.
        """
        doc = self.db["chat_summaries"].find_one(
            {"user_id": user_id, "chat_id": chat_id})
        if "contentVector" in doc:
            del doc["contentVector"]
        return json.dumps(doc)

    def get_user_material_by_user_id(self, user_id: str) -> str:
        """
        Retrieves a user's therapy material by the user's ID.
        """
        doc = self.db["user_materials"].find_one({"user_id": user_id})
        if "contentVector" in doc:
            del doc["contentVector"]
        return json.dumps(doc)

    def get_user_entity_by_user_id(self, user_id: str):
        """
        Retrieves a user's known entity by the user's ID.
        """
        doc = self.db["user_entities"].find_one({"user_id": user_id})
        if "contentVector" in doc:
            del doc["contentVector"]
        return json.dumps(doc)


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
