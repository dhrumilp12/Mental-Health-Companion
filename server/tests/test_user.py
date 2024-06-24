import sys
sys.path.append(".")


user_data = {
    "username": "user1",
    "email": "user1@outlook.com",
    "password": "myTestPassword9!"
}


def test_signup_response(app):
    """
    Test to ensure sign up returns a successful status upon completion.
    """
    response = app.test_client().post("/user/signup", json=user_data)

    assert response.status_code == 201


def test_signup_writes_to_db(app, db):
    """
    Test to ensure sign up writes a new user to db.
    """
    print(db)
    app.test_client().post("/user/signup", json=user_data)

    users = db["users"].find()
    user_count = db["users"].count_documents({})
    assert user_count == 1
    assert users[0]["username"] == user_data["username"]


def test_signup_fails_on_duplicate_username(app):
    """
    Test to ensure sign up writes a new user to db.
    """
    app.test_client().post("/user/signup", json=user_data)

    user_data_2 = {
        "username": "user1",
        "email": "notuser1@outlook.com",
        "password": "anotherPassword8!"
    }
    
    response = app.test_client().post("/user/signup", json=user_data_2)
    
    assert response.status_code == 409


def test_signup_fails_on_duplicate_email(app):
    """
    Test to ensure sign up writes a new user to db.
    """
    app.test_client().post("/user/signup", json=user_data)

    user_data_2 = {
        "username": "notuser1",
        "email": "user1@outlook.com",
        "password": "anotherPassword8!"
    }
    
    response = app.test_client().post("/user/signup", json=user_data_2)
    
    assert response.status_code == 409


def test_signup_password_is_hashed(app, db):
    """
    Test to ensure password was not saved as plaintext in db.
    """
    app.test_client().post("/user/signup", json=user_data)

    stored_user = db["users"].find_one({"username": user_data["username"]})
    
    assert stored_user["password"] != user_data["password"]


