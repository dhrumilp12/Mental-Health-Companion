import json

from langchain.schema.document import Document

def extract_text(docs:list[Document], key='description') -> str:
    """
    Extracts text from MongoDB documents using a specified key.

    Args:
        docs (list of pymongo documents): Documents from which to extract text.
        key (str): The key used to extract text from documents.

    Returns:
        list: A list containing the extracted text from each document.
    """
    return [doc.get(key, 'No description available') for doc in docs]


def format_docs(docs:list[Document]) -> str:
    """
    Prepares the objects list for the system prompt.
    """       
    str_docs = []

    for doc in docs:
        doc_dict = {"_id": doc.page_content}
        doc_dict.update(doc.metadata)
        if "contentVector" in doc_dict:
            del doc_dict["contentVector"]
        str_docs.append(json.dumps(doc_dict, default=str))
    
    return "\n\n".join(str_docs)
