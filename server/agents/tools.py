import os
from langchain_community.utilities import BingSearchAPIWrapper
from langchain_community.tools.bing_search import BingSearchResults
from langchain_community.tools.tavily_search import TavilySearchResults
from utils.docs import format_docs
from services.db.user import get_user_profile_by_user_id
from langchain.tools import Tool
from utils.agents import get_google_search_results, get_bing_search_results, get_youtube_search_results
from langchain_google_community import GooglePlacesTool, GooglePlacesAPIWrapper




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
            "description": "Searches for facts about the AI to answer questions about itself.",
            "retriever": True,
            "structured": False
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