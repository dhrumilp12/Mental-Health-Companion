# utils/update_agent_facts.py
from utils.consts import AGENT_FACTS
import shutil
import os
from services.azure_mongodb import MongoDBClient
import threading

_update_lock = threading.Lock()
_updated = False

def update_agent_facts_in_db():
    global _updated
    with _update_lock:
        if not _updated:
            db = MongoDBClient.get_client()[MongoDBClient.get_db_name()]
            agent_facts_collection = db['agent_facts']
            
            # Clear existing facts
            agent_facts_collection.delete_many({})

            # Prepare documents with any necessary additional fields
            documents = []
            for fact in AGENT_FACTS:
                # Add any required fields or processing here
                documents.append(fact)

            # Insert updated facts
            if documents:
                agent_facts_collection.insert_many(documents)
                print(f"Inserted {len(documents)} documents into 'agent_facts' collection.")
            else:
                print("No documents to insert into 'agent_facts' collection.")

             # Delete existing FAISS index directory for 'agent_facts'
            index_file_path = f"agent_facts_faiss_index"
            if os.path.exists(index_file_path):
                # Remove the index directory and its contents
                shutil.rmtree(index_file_path)
                print(f"Deleted existing FAISS index directory: {index_file_path}")
            else:
                print(f"No existing FAISS index directory found: {index_file_path}")

            _updated = True

