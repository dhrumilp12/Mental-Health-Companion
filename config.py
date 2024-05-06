import os

settings = {
    'host': os.environ.get('ACCOUNT_HOST', 'https://mental-health-companin.documents.azure.com:443/'),
    'master_key': os.environ.get('ACCOUNT_KEY', '9tQkmzrDhtdagZDQ2YyPIuYUs1KAyEvqdKdDeIl0ypZbNY75j0i8KtOvIbgxdltSsM9YT9IK8z2qACDbK1wEOQ=='),
    'database_id': os.environ.get('COSMOS_DATABASE', 'ToDoList'),
    'container_id': os.environ.get('COSMOS_CONTAINER', 'Items'),
}