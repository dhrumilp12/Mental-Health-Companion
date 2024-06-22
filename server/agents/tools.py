import os
import json
import requests
import random

from langchain_community.utilities import BingSearchAPIWrapper
from langchain_community.tools.tavily_search import TavilySearchResults

from utils.docs import format_docs

from services.db.user import get_user_profile_by_user_id


def get_maps_results(self, query):
    """
    Searches for places that match the query and returns a list of results.

    Args:
        query (str): The query to search for in the map.
    """

    # Azure Maps API Key
    api_key = os.environ["AZURE_MAPS_KEY"]

    # Define the base URL for the Azure Maps search address API
    base_url = "https://atlas.microsoft.com/search/address/json"

    # Parameters for the API request
    params = {
        'api-version': '1.0',
        'subscription-key': api_key,
        'query': query
    }

    # Make the API request to get address information
    response = requests.get(base_url, params=params)
    results = response.json()

    # Check if results were found
    if results.get('results'):
        # Extract bounding box from the first result
        location_bbox = results['results'][0]['viewport']

        # Define the base URL for the fuzzy search API
        fuzzy_search_url = "https://atlas.microsoft.com/search/fuzzy/json"

        # Parameters for the fuzzy search, including the bounding box
        fuzzy_params = {
            'api-version': '1.0',
            'subscription-key': api_key,
            'query': query,
            'topLeft': f"{location_bbox['topLeftPoint']['lat']},{location_bbox['topLeftPoint']['lon']}",
            'btmRight': f"{location_bbox['btmRightPoint']['lat']},{location_bbox['btmRightPoint']['lon']}"
        }

        # Make the API request for fuzzy search within the bounding box
        fuzzy_response = requests.get(
            fuzzy_search_url, params=fuzzy_params)
        fuzzy_results = fuzzy_response.json()

        # Extract relevant details from the results
        agent_results = [{
            'name': result['poi']['name'],
            'phone': result['poi']['phone'],
            'address': result['address']['freeformAddress']
        } for result in fuzzy_results.get('results', [])]

        # Randomly sample up to 3 results to return
        trunc_agent_results = random.sample(
            agent_results, min(len(agent_results), 3))

        return json.dumps(trunc_agent_results, default=str)
    else:
        return json.dumps({"error": "No results found"}, default=str)


def get_vector_store_chain(agent, collection_name:str):
    return agent._get_cosmosdb_vector_store_retriever(collection_name) | format_docs


def vector_store_chain_factory(collection_name) -> callable:
    collection_name = collection_name
    return get_vector_store_chain


toolbox = {
    "community": {
        # "web_search_bing": BingSearchAPIWrapper(k=5),
        # "web_search_tavily": TavilySearchResults(), 
    },
    "custom": {
        "agent_facts": {
            "func": vector_store_chain_factory("agent_facts"),
            "description": "Searches for facts about the agent itself.",
            "retriever": True,
            "structured": False
        },
        "location_search": {
            "func": get_maps_results,
            "description": "Searches for places that match the query and returns a list of results.",
            "retriever": False,
            "structured": False
        },
        "user_profile_retrieval": {
            "func": get_user_profile_by_user_id,
            "structured": False,
            "description": "Retrieves a user's profile information by the user's ID to be used when brought up in conversation. Includes age, name and location."
        }
    }
}