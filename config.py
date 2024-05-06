import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

settings = {
    'host': os.environ.get('ACCOUNT_HOST'),
    'master_key': os.environ.get('ACCOUNT_KEY'),
    'database_id': os.environ.get('COSMOS_DATABASE'),
    'container_id': os.environ.get('COSMOS_CONTAINER'),
}