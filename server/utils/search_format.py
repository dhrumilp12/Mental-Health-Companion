""" This module contains functions to format search results. """

def format_youtube_result(result):
    """Format the search result to return only necessary details."""
    return {
        'videoTitle': result['snippet']['title'],
        'description': result['snippet']['description'],
        'videoUrl': f"https://www.youtube.com/watch?v={result['id']['videoId']}"
    }

def format_result(result):
    """Format the search result to return only necessary details."""
    return {
        'title': result.get('title'),
        'snippet': result.get('snippet'),
        'link': result.get('link')
    }