import os
from openai import AzureOpenAI
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

def query_ai(prompt):
    """
    Sends a chat message to OpenAI's Chat Completion model and returns the assistant's response.
    
    Args:
        prompt (str): The user input to which the assistant should respond.

    Returns:
        str: The assistant's response as a string.
    """
    try:
        client = AzureOpenAI(
            azure_endpoint="https://dhrumilkumar.openai.azure.com",
            api_key=os.getenv("AOAI_KEY"),  # Make sure this environment variable is set correctly
            api_version="2024-02-15-preview"
        )

        message_text = [
            {"role": "system", "content": "You are a helpful, fun and friendly sales assistant for Cosmic Works, a bicycle and bicycle accessories store."},
            {"role": "user", "content": prompt},
        ]

        completion = client.chat.completions.create(
            model="mentalHEalth",  # Ensure this matches exactly the deployment name
            messages=message_text,
            temperature=0.7,
            max_tokens=800,
            top_p=0.95,
            frequency_penalty=0,
            presence_penalty=0,
            stop=None
        )

        # Extract the assistant's response
        assistant_response = next(
            (choice.message.content for choice in completion.choices if choice.message.role == 'assistant'),
            None
        )
        
        if assistant_response:
            return assistant_response
        else:
            raise ValueError("No assistant response found in completion.")
        
    except Exception as e:
        print(f"An error occurred: {e}")
        return None
