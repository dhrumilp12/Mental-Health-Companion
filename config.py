
import os

# Check if running in GitHub Actions environment
if os.getenv('GITHUB_ACTIONS'):
    # Load environment variables directly from GitHub Actions secrets
    HOST = os.getenv('HOST')
    MASTER_KEY = os.getenv('MASTER_KEY')
    DATABASE_ID = os.getenv('DATABASE_ID')
    CONTAINER_ID = os.getenv('CONTAINER_ID')
else:
    # Load environment variables from .env file using dotenv
    from dotenv import load_dotenv
    load_dotenv()
    HOST = os.getenv('HOST')
    MASTER_KEY = os.getenv('MASTER_KEY')
    DATABASE_ID = os.getenv('DATABASE_ID')
    CONTAINER_ID = os.getenv('CONTAINER_ID')
