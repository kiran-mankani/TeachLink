from datetime import datetime
from config.database import db

requests_collection = db['requests']

class Request:
    @staticmethod
    def create_request(sender_id, receiver_id):
        request_doc = {
            'sender_id': sender_id,
            'receiver_id': receiver_id,
            'status': 'pending',  # pending, accepted, rejected
            'created_at': datetime.utcnow()
        }
        result = requests_collection.insert_one(request_doc)
        return str(result.inserted_id)

    @staticmethod
    def get_pending_for_receiver(receiver_id):
        # Receiver (Teacher) ke liye pending requests fetch karein
        return list(requests_collection.find({
            'receiver_id': receiver_id,
            'status': 'pending'
        }))

    @staticmethod
    def get_requests_for_sender(sender_id):
        # Sender (Student) ke liye saare requests fetch karein (status dikhane ke liye)
        return list(requests_collection.find({'sender_id': sender_id}))

    @staticmethod
    def accept_request(request_id):
        requests_collection.update_one(
            {'_id': request_id},
            {'$set': {'status': 'accepted'}}
        )

    @staticmethod
    def reject_request(request_id):
        requests_collection.update_one(
            {'_id': request_id},
            {'$set': {'status': 'rejected'}}
        )