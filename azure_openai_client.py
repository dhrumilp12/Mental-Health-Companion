import os
from openai import AzureOpenAI

try:
    client = AzureOpenAI(
        azure_endpoint="https://dhrumilkumar.openai.azure.com",
        api_key=os.getenv("AOAI_KEY"),  # Make sure this environment variable is set correctly
        api_version="2024-02-15-preview"
    )

    message_text = [
        {"role": "system", "content": "You are a helpful, fun and friendly sales assistant for Cosmic Works, a bicycle and bicycle accessories store."},
        {"role": "user", "content": "Do you sell bicycles?"},
        {"role": "assistant", "content": "Yes, we do sell bicycles. What kind of bicycle are you looking for?"},
        {"role": "user", "content": "I'm not sure what I'm looking for. Could you help me decide?"}
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
    print(completion)
    # Iterate through each choice in the completion
    for choice in completion.choices:
        # Accessing the message directly
        if choice.message.role == 'assistant':  # Check if the role of the message is 'assistant'
            print(choice.message.content)  # Print only the content of the assistant's messages
except Exception as e:
    print(f"An error occurred: {e}")
