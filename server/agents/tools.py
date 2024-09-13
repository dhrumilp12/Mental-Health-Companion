import os
from langchain_community.tools.tavily_search import TavilySearchResults
from utils.docs import format_docs
from services.db.user import get_user_profile_by_user_id
from langchain.tools import Tool
from utils.agents import get_google_search_results, get_bing_search_results, get_youtube_search_results, generate_suggestions
from langchain_google_community import GooglePlacesTool


def get_vector_store_chain(agent, collection_name:str):
    return agent._get_cosmosdb_vector_store_retriever(collection_name) | format_docs


def vector_store_chain_factory(collection_name) -> callable:
    collection_name = collection_name
    return lambda x: get_vector_store_chain(collection_name=collection_name)




toolbox = {
    "community": {
        "web_search_tavily": TavilySearchResults(),
        "location_search_gplaces": GooglePlacesTool(),
    },
    "custom": {
        "agent_facts": {
            "func": vector_store_chain_factory("agent_facts"),
            "description": "Searches for specific facts about the AI's origin, creators, capabilities, and history stored in a vector database. It retrieves answers to questions like 'Who built you?' or 'What is your purpose?' by finding the most relevant information from the agent_facts collection. This tool is used when the AI needs to provide self-referential information based on pre-stored facts. The retrieved facts are sourced from a similarity search on semantic embeddings of stored data.",
            "retriever": True,
            "structured": False
        },
        "generate_suggestions": {
            "func": generate_suggestions,
            "description": "Generates personalized activities or coping mechanisms based on the user's mood using a language model.",
            "structured": True
            },
        "web_search_bing": {
            "func": get_bing_search_results,
            "description": "Uses Google Custom Search to fetch search results for a given query.",
            "retriever": False,
            "structured": True
        },
        "web_search_google": {
            "func": get_google_search_results,
            "description": "Uses Google Custom Search to fetch search results for a given query.",
            "retriever": False,
            "structured": True
        },
        "web_search_youtube": {
            "func": get_youtube_search_results,
            "description": "Uses YouTube Search to fetch search results for a given query.",
            "retriever": False,
            "structured": True
        },
        "user_profile_retrieval": {
            "func": get_user_profile_by_user_id,
            "structured": True,
            "description": "Retrieves a user's profile information by the user's ID to be used when brought up in conversation. Includes age, name and location. Exclude if user ID is `0`, as this indicates it is an anonymous user."
        }
    }
}


