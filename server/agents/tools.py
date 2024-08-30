import os

# from azure.identity import DefaultAzureCredential
# from azure.mgmt.maps import AzureMapsManagementClient

from langchain_google_community import GooglePlacesTool, GooglePlacesAPIWrapper

from langchain_community.utilities import BingSearchAPIWrapper
from langchain_community.tools.bing_search import BingSearchResults
from langchain_community.tools.tavily_search import TavilySearchResults

from utils.docs import format_docs

from services.db.user import get_user_profile_by_user_id


def get_maps_results(self, query):
    """
    Searches for places that match the query and returns a list of results.

    Args:
        query (str): The query to search for in the map.
    """

    # sub_id = os.environ.get("AZURE_SUBSCRIPTION_ID") 
    # client = AzureMapsManagementClient(credential=DefaultAzureCredential(), subscription_id=sub_id)

    pass   



def get_vector_store_chain(agent, collection_name:str):
    return agent._get_cosmosdb_vector_store_retriever(collection_name) | format_docs


def vector_store_chain_factory(collection_name) -> callable:
    collection_name = collection_name
    return lambda x: get_vector_store_chain(collection_name=collection_name)


toolbox = {
    "community": {
        "web_search_bing": BingSearchResults(api_wrapper=BingSearchAPIWrapper(k=1)),
        "web_search_tavily": TavilySearchResults(),
        "location_search_gplaces": GooglePlacesTool()
    },
    "custom": {
        "agent_facts": {
            "func": vector_store_chain_factory("agent_facts"),
            "description": "Searches for facts about the AI to answer questions about itself.",
            "retriever": True,
            "structured": False
        },
        # "location_search": {
        #     "func": get_maps_results,
        #     "description": "Searches for places that match the query and returns a list of results.",
        #     "retriever": False,
        #     "structured": False
        # },
        "user_profile_retrieval": {
            "func": get_user_profile_by_user_id,
            "structured": True,
            "description": "Retrieves a user's profile information by the user's ID to be used when brought up in conversation. Includes age, name and location. Exclude if user ID is `0`, as this indicates it is an anonymous user."
        }
    }
}