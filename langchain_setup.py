import os
import pymongo
from dotenv import load_dotenv
from langchain_openai import AzureChatOpenAI, AzureOpenAIEmbeddings
from langchain_community.vectorstores import AzureCosmosDBVectorSearch
from langchain.prompts import PromptTemplate
from langchain.schema import StrOutputParser, Document
from langchain.tools import Tool
import json

# Load settings from the .env file
load_dotenv()
CONNECTION_STRING = os.getenv("DB_CONNECTION_STRING")
AOAI_KEY = os.getenv("AOAI_KEY")
AOAI_ENDPOINT = os.getenv("AOAI_ENDPOINT")
EMBEDDINGS_DEPLOYMENT_NAME = "MENTAL"
COMPLETIONS_DEPLOYMENT_NAME = "mentalHEalth"
AOAI_API_VERSION = "2024-02-15-preview"

# Establish Azure OpenAI connectivity without using the unsupported 'deployment' parameter
llm = AzureChatOpenAI(
    model="gpt-35-turbo",
    deployment_name="mentalHEalth",
    azure_endpoint=AOAI_ENDPOINT,
    api_key=AOAI_KEY,
    api_version=AOAI_API_VERSION
    # Make sure to use any required parameters correctly here
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
db_client = pymongo.MongoClient(CONNECTION_STRING)
db = db_client['cosmic_works']
products_collection = db['products']

# Initialize vector store
vector_store = AzureCosmosDBVectorSearch(
    collection=products_collection,
    embedding=embedding_model,
    index_name="VectorSearchIndex",
    text_key="textContent",
    embedding_key="vectorContent"
)

# Define the system prompt template
system_prompt = """
You are a helpful, fun and friendly sales assistant for Cosmic Works, a bicycle and bicycle accessories store. 
Your name is Cosmo.
You are designed to answer questions about the products that Cosmic Works sells.

Only answer questions related to the information provided in the list of products below that are represented in JSON format.

If you are asked a question that is not in the list, respond with "I don't know."

List of products:
{products}

Question:
{question}
"""


# Instantiate PromptTemplate with the system prompt
prompt_template = PromptTemplate.from_template(system_prompt)

# Define the function to extract text from MongoDB documents
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

# Fetch documents with descriptions that include the word "yellow"
query = {"description": {"$regex": "yellow", "$options": "i"}}
documents = db.products.find(query)

# Extract text content from documents
text_contents = extract_text(documents)

# Prepare the product list for the prompt
products_list = json.dumps(text_contents, indent=2) if text_contents else "No products found."

try:
    # Process the prompt with the extracted text
    processed_prompt = prompt_template.invoke({"products": products_list, "question": "What products do you have that are yellow?"})
    # Ensure that the result from invoke is correctly handled
    result = llm.invoke(processed_prompt)  # Adjusted based on the method's correct use
    final_output = StrOutputParser().parse(result)
    # Convert the final_output to a dictionary if it is not already one
    if not isinstance(final_output, dict):
        final_output = vars(final_output) if hasattr(final_output, '__dict__') else final_output.__dict__
    print("Structured Result from the LangChain Model:", json.dumps(final_output, indent=2))
except Exception as e:
    print(f"An error occurred: {e}")

if __name__ == "__main__":
    # Ensures this block only runs if the script completes without exceptions
    if 'final_output' in locals():
        print("Final Structured Output:", json.dumps(final_output, indent=2))
    else:
        print("Final output is not available due to an error.")