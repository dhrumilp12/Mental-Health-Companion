import os
import requests
import pymongo
from pymongo import UpdateOne, DeleteMany
from dotenv import load_dotenv
from model import Product, Customer, SalesOrder, execute_with_retries

load_dotenv()
CONNECTION_STRING = os.getenv("DB_CONNECTION_STRING")
client = pymongo.MongoClient(CONNECTION_STRING)
db = client['cosmic_works']

def clear_collections():
    def delete_operation():
        db.products.delete_many({})
        db.customers.delete_many({})
        db.sales.delete_many({})
        print("Cleared existing data in collections.")
    execute_with_retries(delete_operation)

def load_products():
    product_raw_data = "https://cosmosdbcosmicworks.blob.core.windows.net/cosmic-works-small/product.json"
    response = requests.get(product_raw_data)
    products_json = response.json()
    valid_products = [Product(**data) for data in products_json]
    
    def bulk_write_operation():
        db.products.bulk_write([UpdateOne({"_id": prod.id}, {"$set": prod.dict(by_alias=True)}, upsert=True) for prod in valid_products])

    if valid_products:
        execute_with_retries(bulk_write_operation)
        print(f"Loaded {len(valid_products)} products.")
    else:
        print("No valid products to load.")

def load_customers_and_sales():
    customer_sales_raw_data = "https://cosmosdbcosmicworks.blob.core.windows.net/cosmic-works-small/customer.json"
    response = requests.get(customer_sales_raw_data)
    response.encoding = 'utf-8-sig'  # Handle UTF-8 BOM
    response_json = response.json()

    customers = [Customer(**data) for data in response_json if data["type"] == "customer" and 'email' in data and data['email']]
    def customer_write_operation():
        db.customers.bulk_write([UpdateOne({"_id": cust.id}, {"$set": cust.dict(by_alias=True)}, upsert=True) for cust in customers])
    if customers:
        execute_with_retries(customer_write_operation)
        print(f"Loaded {len(customers)} customers.")

    sales_orders = [SalesOrder(**data) for data in response_json if data["type"] == "salesOrder" and 'customer_id' in data and 'order_date' in data and 'total' in data]
    def sales_write_operation():
        db.sales.bulk_write([UpdateOne({"_id": sale.id}, {"$set": sale.dict(by_alias=True)}, upsert=True) for sale in sales_orders])
    if sales_orders:
        execute_with_retries(sales_write_operation)
        print(f"Loaded {len(sales_orders)} sales orders.")


def main():
    clear_collections()
    load_products()
    load_customers_and_sales()
    print("Data loading complete. Database is now up to date.")

if __name__ == "__main__":
    main()

client.close()
