from flask import Blueprint, request, jsonify
from datetime import datetime
from pydantic import ValidationError
from models.check_in import CheckIn, Frequency
from dotenv import load_dotenv
from services.azure_mongodb import MongoDBClient
from bson import ObjectId
from pymongo import ReturnDocument
from bson.errors import InvalidId


load_dotenv()

db_client = MongoDBClient.get_client()
db = db_client[MongoDBClient.get_db_name()]

checkIn_routes = Blueprint("checkIN", __name__)


@checkIn_routes.post('/checkIn/schedule')
def schedule_check_in():
    try:     # Parse and validate the request data using Pydantic model
        data = request.get_json()
        check_in_time=datetime.fromisoformat(data['check_in_time'])
        check_in_date = datetime.fromisoformat(data['check_in_time']).date()

        if CheckIn.count_user_check_ins(db,data['user_id'], check_in_date) >= 5:
            return jsonify({'message': 'Limit of 5 check-ins per day exceeded'}), 403

        if not CheckIn.validate_check_in_time(db, data['user_id'], check_in_time):
                return jsonify({'error': 'Check-in time conflicts with an existing schedule'}), 409
        
        check_in = CheckIn(
            user_id=data['user_id'],
            check_in_time=check_in_time,
            frequency=Frequency(data['frequency']),
            notify=data.get('notify', False)
        )
            
            # Convert Pydantic model to dictionary for MongoDB
        check_in_dict = check_in.dict()
        check_in_dict['check_in_time'] = check_in.check_in_time  # Ensure datetime is handled correctly

            # Insert the new check-in into MongoDB
        result = db.check_ins.insert_one(check_in_dict)
        return jsonify({'message': 'Check-in scheduled successfully', 'check_in_id': str(result.inserted_id)}), 201

    except ValidationError as e:
        return jsonify({'error': 'Data validation error', 'details': str(e)}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
@checkIn_routes.patch('/checkIn/update/<check_in_id>')
def update_check_in(check_in_id):
    data = request.get_json()
    try:
        updated_data = {}
        if 'check_in_time' in data:
            new_check_in_time = datetime.fromisoformat(data['check_in_time'])
            updated_data['check_in_time'] = new_check_in_time

            if not CheckIn.validate_check_in_time(db, data['user_id'], new_check_in_time):
                return jsonify({'error': 'Check-in time conflicts with an existing schedule'}), 409
            
        if 'frequency' in data:
            # Use the Frequency enum to ensure the frequency is valid
            try:
                updated_data['frequency'] = Frequency(data['frequency']).value
            except ValueError:
                return jsonify({'error': 'Invalid frequency value'}), 400
        
        update_result = db.check_ins.find_one_and_update(
            {'_id': ObjectId(check_in_id)},
            {'$set': updated_data},
            return_document=ReturnDocument.AFTER
        )
        if update_result:
            return jsonify({'message': 'Check-in updated successfully'}), 200
        else:
            return jsonify({'message': 'No check-in found with provided ID or no update needed'}), 404
    
    except ValidationError as e:
        return jsonify({'error': 'Data validation error', 'details': str(e)}), 400
    except InvalidId:
        return jsonify({'error': 'Invalid check-in ID'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
@checkIn_routes.get('/checkIn/missed')
def check_missed_check_ins():
    user_id = request.args.get('user_id')
    now = datetime.now()
    missed_check_ins = db.check_ins.find({
        'user_name': user_id,
        'check_in_time': {'$lt': now},
        'status': 'upcoming'  # Assuming 'upcoming' means not yet checked in
    })

    if missed_check_ins.count() > 0:
        db.check_ins.update_many(
            {'user_id': user_id, 'check_in_time': {'$lt': now}, 'status': 'upcoming'},
            {'$set': {'status': 'missed'}}
        )
        return jsonify({'message': 'You have missed check-ins, would you like to complete them now?', 'missed': list(missed_check_ins)}), 200
    else:
        return jsonify({'message': 'No missed check-ins'}), 200
 
