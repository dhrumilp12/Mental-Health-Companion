from flask import Flask, request, jsonify, Blueprint
from flask_jwt_extended import jwt_required, get_jwt_identity
from dotenv import load_dotenv
from utils.search_format import format_result, format_youtube_result, save_search_results, get_user_search_history, delete_user_search_history
import requests
import os
import logging
# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
search_routes = Blueprint("search", __name__)

load_dotenv()

GOOGLE_CUSTOME_SEARCH_API_KEY = os.getenv('GOOGLE_API_KEY')
GOOGLE_SEARCH_CSE_ID = os.getenv('GOOGLE_CSE_ID')
YOUTUBE_API_KEY = os.getenv('YOUTUBE_API_KEY')

@search_routes.get('/search')
@jwt_required()
def search():
    current_user = get_jwt_identity()  # Assuming JWT contains user ID or username
    query = request.args.get('query')  # Get the search query from the URL parameter
    routine_type = request.args.get('type')  # Expected types: 'mindfulness', 'meditation', 'stress_relief'

    if not query:
        if routine_type:
            query = f"{routine_type} exercise and tips"  # Default to tips related to the routine type
        else:
            query = "mental wellness practices"  # Default to general health if no type is provided either
    else:
        if routine_type:
            query += f", {routine_type} exercise"  # Tailors the search to the type of routine

    # Build the URL for the Google Custom Search API with a maximum of 6 results
    url = f"https://www.googleapis.com/customsearch/v1?key={GOOGLE_CUSTOME_SEARCH_API_KEY}&cx={GOOGLE_SEARCH_CSE_ID}&q={query}&num=6"

    try:
        response = requests.get(url)
        response.raise_for_status()
        search_results = response.json()

        # Process up to 6 search results
        formatted_results = [format_result(result) for result in search_results.get('items', [])]

        save_search_results(current_user, formatted_results, 'google_search')
        return jsonify(formatted_results)

    except requests.RequestException as e:
        return jsonify({'error': str(e)}), 500

    
@search_routes.get('/youtube_search')
@jwt_required()
def youtube_search():
    current_user = get_jwt_identity()
    query = request.args.get('query')
    routine_type = request.args.get('type')

    if not query:
        if routine_type:
            query = f"{routine_type} exercises"
        else:
            query = "mental wellness exercises"
    else:
        if routine_type:
            query += f", {routine_type} exercise"

    # Build the URL for the YouTube Search API with a maximum of 6 results
    url = f"https://www.googleapis.com/youtube/v3/search?part=snippet&q={query}&type=video&maxResults=6&key={YOUTUBE_API_KEY}"

    try:
        response = requests.get(url)
        response.raise_for_status()
        search_results = response.json()

        # Process up to 6 search results
        formatted_results = [format_youtube_result(result) for result in search_results.get('items', [])]

        save_search_results(current_user, formatted_results, 'youtube_search')
        return jsonify(formatted_results)

    except requests.RequestException as e:
        logger.error(f"Error during YouTube search: {str(e)}")
        return jsonify({'error': str(e)}), 500


@search_routes.get('/search_history')
@jwt_required()
def search_history():
    current_user = get_jwt_identity()  # Assuming JWT contains user ID or username
    
    try:
        # Retrieve the user's search history from the database
        history = get_user_search_history(current_user)
        if history:
            return jsonify(history)
        else:
            return jsonify({'message': 'No search history found'}), 404

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
@search_routes.delete('/search_history')
@jwt_required()
def delete_history():
    current_user = get_jwt_identity()  # Assuming JWT contains user ID or username

    try:
        # Delete all types of search history for the user
        delete_user_search_history(current_user)
        return jsonify({'message': 'All search history deleted successfully'}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

    
@search_routes.delete('/google_search_history')
@jwt_required()
def delete_google_search_history():
    current_user = get_jwt_identity()  # Assuming JWT contains user ID or username

    try:
        # Delete the user's Google search history from the database
        delete_user_search_history(current_user, search_type='google_search')
        return jsonify({'message': 'Google search history deleted successfully'}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@search_routes.delete('/youtube_search_history')
@jwt_required()
def delete_youtube_search_history():
    current_user = get_jwt_identity()  # Assuming JWT contains user ID or username

    try:
        # Delete the user's YouTube search history from the database
        delete_user_search_history(current_user, search_type='youtube_search')
        return jsonify({'message': 'YouTube search history deleted successfully'}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500