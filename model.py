from pydantic import BaseModel, Field
from typing import List, Optional
import pymongo
import time
import random

class Product(BaseModel):
    id: str
    category_id: str = Field(..., alias='categoryId')
    category_name: str = Field(..., alias='categoryName')
    sku: str
    name: str
    description: str
    price: float

class Customer(BaseModel):
    id: str
    name: Optional[str]
    email: Optional[str]
    phone: Optional[str]

class SalesOrder(BaseModel):
    id: str
    customer_id: Optional[str]
    order_date: Optional[str]
    total: Optional[float]


def execute_with_retries(operation, max_retries=5):
    retries = 0
    while retries < max_retries:
        try:
            return operation()
        except (pymongo.errors.BulkWriteError, pymongo.errors.WriteError) as e:
            retry_after_ms = 100  # Default retry interval
            if hasattr(e, 'details'):
                # Extracting retry after ms from BulkWriteError
                retry_after_ms = max(
                    (int(err.get('errmsg', '').split('RetryAfterMs=')[1].split(',')[0]) 
                     for err in e.details.get('writeErrors', []) 
                     if 'RetryAfterMs=' in err.get('errmsg', '')),
                    default=100
                )
            elif 'RetryAfterMs' in str(e):
                # Extracting retry after ms from WriteError
                retry_after_msg = str(e).split("RetryAfterMs=")[1]
                retry_after_ms = int(retry_after_msg.split(',')[0])

            sleep_time = max(retry_after_ms / 1000.0, 1.0) + random.uniform(0.05, 0.1)
            time.sleep(sleep_time)
            retries += 1
            print(f"Retrying after {sleep_time} seconds...")
        except Exception as e:
            print(f"Error during operation: {e}")
            raise
    raise Exception("Maximum retries exceeded")
