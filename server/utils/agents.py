""" This module contains the agent functions that interact with the external APIs. """

from langchain_google_community import  GoogleSearchAPIWrapper, GoogleSearchResults, GooglePlacesTool, GooglePlacesAPIWrapper
from langchain_community.utilities import BingSearchAPIWrapper
from langchain_community.tools import YouTubeSearchTool

def get_google_search_results(query):
    """
    Uses Google Custom Search to fetch search results for a given query.

    Args:
        query (str): The search query.

    Returns:
        list: A list of search results with titles and links.
    """

    try:
        google_search_wrapper = GoogleSearchAPIWrapper(k=3)
        search_results = google_search_wrapper.run(query)
        print("Search results obtained:", search_results)

        # Ensure the results are JSON-serializable
        
        return search_results
    
    except Exception as e:
        print(f"Failed to fetch Google search results: {e}")
        return None
    
def get_youtube_search_results(query):
    """
    Uses YouTube Search to fetch search results for a given query.

    Args:
        query (str): The search query.

    Returns:
        list: A list of search results with titles, descriptions, and video links.
    """
    try:
        youtube_search_tool = YouTubeSearchTool()
        search_results = youtube_search_tool.run(query)
        print("Search results obtained:", search_results)

        # Ensure the results are JSON-serializable
        return search_results

    except Exception as e:
        print(f"Failed to fetch YouTube search results: {e}")
        return None


def get_bing_search_results(query):
    """
    Uses Bing Search to fetch search results for a given query.

    Args:
        query (str): The search query.

    Returns:
        list: A list of search results with titles and links.
    """
    try:
        bing_search_wrapper = BingSearchAPIWrapper()
        search_results = bing_search_wrapper.run(query)
        print("Search results obtained:", search_results)

        # Ensure the results are JSON-serializable
        return search_results

    except Exception as e:
        print(f"Failed to fetch Bing search results: {e}")
        return None
    