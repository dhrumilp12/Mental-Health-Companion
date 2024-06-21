from services.azure_mongodb import MongoDBClient
from models.agent_fact import AgentFact
from utils.consts import AGENT_FACTS


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