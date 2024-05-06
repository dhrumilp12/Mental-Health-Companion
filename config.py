import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

settings = {
    'host': os.environ.get('ACCOUNT_HOST', 'https://mental-health-companin.documents.azure.com:443/'),
    'master_key': os.environ.get('ACCOUNT_KEY'),
    'database_id': os.environ.get('COSMOS_DATABASE', 'ToDoList'),
    'container_id': os.environ.get('COSMOS_CONTAINER', 'Items'),
}