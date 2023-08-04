
# SOCIAL APP

SocialApp REST API is a social media platform that combines the functionalities of Twitter and a text chat. Additionally, the app allows you to have private text conversations with selected individuals through the chat function.

## Main Features

- User registration
- User login and authentication
- User password reset
- User profile
- Add/Remove user follow
- Add/Remove user to friends
- Send/Cancel friend request
- Block/Unblock users

### In the future following features will be added:

- Add posts
- Create comments
- Add to favourite
- Like posts
- Search posts
- Add tags to posts and comments

## Technologies

- Django
- Django REST framework
- PostgreSQL
- Redis
- Docker Compose

## Requirements

- Python 3.11
- Django 4.1.1
- Django REST framework 3.13.1
- Channels 3.0.5

## Installation

* First you need to clone a repository.
    ```bash
    git clone https://github.com/Naffik/Naffik.git
    ```
* After you cloned the repository, create and fire up your virtual environment. You can do this by running the command:
    ```bash
    virtualenv  venv -p python3
    source venv/bin/activate
    ```
* In the project folder, create an .env file in the `/core` directory to add environment variables. It should look like this:
	```bash
	export POSTGRES_NAME=database name
	export POSTGRES_USER=database username
	export POSTGRES_PASSWORD=database password
	export SECRET_KEY=Django secret key
	export EMAIL_HOST=email server
	export EMAIL_HOST_USER=email
	export EMAIL_HOST_PASSWORD=email password
	```
* Also in the project folder you need to create one more .env file. It should look like this:
	```bash
	export POSTGRES_NAME=database name
	export POSTGRES_USER=database username
	export POSTGRES_PASSWORD=database password
	```
* This project has a Docker Compose file included in the repository at `docker-compose.yml`. First you need to cd into Socialapp folder where docker file is located. To build and run the project with Docker Compose, use the following command:
    ```bash
    docker-compose up --build
    ```
* The above command will start the containers for Django and PostgreSQL. The Django app will be running on port 8000. Next step is to make migrations, migrate and create super user. To do so you need to run this command in new console:
    ```bash
    docker exec -it socialapp bash
    python manage.py makemigrations
    python manage.py migrate
    python manage.py createsuperuser
    ```
## Structure

In a RESTful API, endpoints (URLs) define the structure of the API and how end users access data from our application using the HTTP methods - GET, POST, PUT, DELETE. Endpoints should be logically organized around collections and elements, both of which are resources.

In our case, we have four resources such as `admin`, `account`, `chat` and `docs`. To get more informations about endpoints use `http://127.0.0.1:8000/docs/`.

## Use

To demonstrate how to use the API to send data, we will use Postman, a popular API testing tool.

1. Start Postman and create a new request.
2. Set the request method to `POST`.
3. Enter the URL `http://127.0.0.1:8000/account/register/`.
4. Set the request body:
   - `username`: `example`
   - `email`: `example@example.com`
   - `password`: `zaq1@WSX`
   - `password2`: `zaq1@WSX`
5. Click the "Send" button to send the request.
6. The response will be displayed in the "Body" section of the Postman interface. The response will be in JSON format and will include the data retrieved from the API. It should look like this:
```json
{
    "username": "example",
    "email": "example@example.com"
}
```
