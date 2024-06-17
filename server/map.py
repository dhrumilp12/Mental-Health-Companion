import requests
import os
from dotenv import load_dotenv
load_dotenv()

api_key = os.environ["AZURE_MAPS_KEY"]
def get_map_search_data(query):
    url = "https://atlas.microsoft.com/search/address/json"
    params = {
        'api-version': '1.0',
        'subscription-key': api_key,
        'query': query
    }
    response = requests.get(url, params=params)
    return response.json()  # Parse JSON response

def extract_location_details(json_data):
    if 'results' in json_data and len(json_data['results']) > 0:
        address = json_data['results'][0]['address']['freeformAddress']
        lat = json_data['results'][0]['position']['lat']
        lon = json_data['results'][0]['position']['lon']
        return {
            'address': address,
            'latitude': lat,
            'longitude': lon
        }
    else:
        return None

# Example usage
if __name__ == "__main__":
    query = "1600 Amphitheatre Parkway, Mountain View, CA"
    result = get_map_search_data(query)
    location_details = extract_location_details(result)
    if location_details is not None:
        print(f"Address: {location_details['address']}")
        print(f"Latitude: {location_details['latitude']}")
        print(f"Longitude: {location_details['longitude']}")
    else:
        print("No location found for the given query.")