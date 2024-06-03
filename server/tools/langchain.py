import os
import pymongo
import json

from dotenv import load_dotenv
from langchain_openai import AzureChatOpenAI, AzureOpenAIEmbeddings
from langchain_community.vectorstores import AzureCosmosDBVectorSearch
from langchain.prompts import PromptTemplate

from azure_mongodb import MongoDBClient

def setup_langchain(db_name, collection_name, system_prompt):
    """
    Sets up and returns the components necessary for LangChain interaction with Azure OpenAI.
    """
    load_dotenv()
    CONNECTION_STRING = os.getenv("DB_CONNECTION_STRING")
    AOAI_KEY = os.getenv("AOAI_KEY")
    AOAI_ENDPOINT = os.getenv("AOAI_ENDPOINT")
    EMBEDDINGS_DEPLOYMENT_NAME = os.getenv("EMBEDDINGS_DEPLOYMENT_NAME")
    COMPLETIONS_DEPLOYMENT_NAME = os.getenv("COMPLETIONS_DEPLOYMENT_NAME")
    AOAI_API_VERSION = "2024-02-15-preview"

    # Establish Azure OpenAI connectivity without using the unsupported 'deployment' parameter
    llm = AzureChatOpenAI(
        model="gpt-35-turbo",
        deployment_name="mentalHEalth",
        azure_endpoint=AOAI_ENDPOINT,
        api_key=AOAI_KEY,
        api_version=AOAI_API_VERSION
    )

    embedding_model = AzureOpenAIEmbeddings(
        azure_endpoint=AOAI_ENDPOINT,
        api_key=AOAI_KEY,
        api_version=AOAI_API_VERSION,
        model="text-embedding-ada-002",
        deployment_name="MENTAL",
        chunk_size=10
    )

    # Establish connection to the database
    db_client = MongoDBClient.get_client()
    db = db_client[db_name]
    collection = db[collection_name]

    # Initialize vector store
    vector_store = AzureCosmosDBVectorSearch(
        collection=collection,
        embedding=embedding_model,
        index_name="VectorSearchIndex",
        text_key="textContent",
        embedding_key="vectorContent"
    )

    # Instantiate PromptTemplate with the system prompt
    prompt_template = PromptTemplate.from_template(system_prompt)

    return {
        "llm": llm,
        "embedding_model": embedding_model,
        "vector_store": vector_store,
        "prompt_template": prompt_template,
        "db": db
    }


def extract_text(docs, key='description'):
    """
    Extracts text from MongoDB documents using a specified key.

    Args:
        docs (list of pymongo documents): Documents from which to extract text.
        key (str): The key used to extract text from documents.

    Returns:
        list: A list containing the extracted text from each document.
    """
    return [doc.get(key, 'No description available') for doc in docs]


def process_langchain_query(query_string, question, collection_name, system_prompt):
    components = setup_langchain(collection_name, system_prompt)
    llm = components["llm"]
    prompt_template = components["prompt_template"]
    db = components["db"]

    # Fetch documents with descriptions that include the word "yellow"
    query = {"description": {"$regex": query_string, "$options": "i"}}
    documents = db[collection_name].find(query)

    # Extract text content from documents
    text_contents = extract_text(documents)

    # Prepare the product list for the prompt
    objs_list = json.dumps(text_contents, indent=2) if text_contents else "No products found."

    processed_prompt = prompt_template.invoke({collection_name: objs_list, "question": question})
    result = llm.invoke(processed_prompt)

    # Access the assistant's message content
    response_content = result
    return response_content