import os
from dotenv import load_dotenv
from langchain_openai import AzureChatOpenAI, AzureOpenAIEmbeddings

def get_azure_openai_variables():
    load_dotenv()
    AOAI_ENDPOINT = os.environ.get("AOAI_ENDPOINT")
    AOAI_KEY = os.environ.get("AOAI_KEY")
    AOAI_API_VERSION = "2023-09-01-preview"
    AOAI_EMBEDDINGS = os.getenv("EMBEDDINGS_DEPLOYMENT_NAME")
    AOAI_COMPLETIONS = os.getenv("COMPLETIONS_DEPLOYMENT_NAME")

    return AOAI_ENDPOINT, AOAI_KEY, AOAI_API_VERSION, AOAI_EMBEDDINGS, AOAI_COMPLETIONS

def get_azure_openai_llm():
    AOAI_ENDPOINT, AOAI_KEY, AOAI_API_VERSION, _, AOAI_COMPLETIONS = get_azure_openai_variables()

    llm = AzureChatOpenAI(
        temperature = 0.3,
        openai_api_version = AOAI_API_VERSION,
        azure_endpoint = AOAI_ENDPOINT,
        openai_api_key = AOAI_KEY,
        azure_deployment = AOAI_COMPLETIONS
    )

    return llm


def get_azure_openai_embeddings():
    AOAI_ENDPOINT, AOAI_KEY, AOAI_API_VERSION, _, AOAI_COMPLETIONS = get_azure_openai_variables()

    embedding_model = AzureOpenAIEmbeddings(
        openai_api_version = AOAI_API_VERSION,
        azure_endpoint = AOAI_ENDPOINT,
        openai_api_key = AOAI_KEY,
        azure_deployment = AOAI_COMPLETIONS,
        chunk_size=10
    )

    return embedding_model