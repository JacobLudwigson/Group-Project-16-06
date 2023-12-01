# Group-Project-16-06

# https://cuboulder-csci3308.pages.dev/docs/labs/lab10/#7-version-control

Our appilication eventGO, allows any user to search for local events in their area, comment, and connect with users, and carpool with eachother. 

## Contributors: 
Jacob Ludwigson, Michael Rasati, Daniel Alba, Jacob Lancaster.

## Technology stack: 
Nodejs, EJS, SQL, HTML, CSS

## Prerequisites:
Docker,SeatGeek API, and Mapbox API are needed for this website.

The user will need a SeatGeek developer account with an associated clientid.
Link : https://seatgeek.com/account/develop

In order to have map functionality the user will need a Mapbox Access Token.
Link: https://account.mapbox.com/auth/signup/

Once you have your access token and client id create a .env file structured as such

POSTGRES_USER="postgres"
POSTGRES_PASSWORD="pwd"
POSTGRES_DB="users_db"

SESSION_SECRET="super duper secret!"
API_KEY="<Your Seat Geek clientid>"
access_token = "<Your Mapbox Access Token>"

## How to run:
Once the repository is cloned, navigate into the projectCode folder. 
Once in the folder, run the command in the terminal:
```bash 
docker compose up
```
This should run the npm package installation, tests, initializations of the database, and nodejs. 
Once the connection is successful, navigate to your browser and input into the search bar. 
```bash
http://localhost:3000/
```
This should bring you to the EventGO login page. 
##How to run tests:
When the docker is run, the tests should appear in the terminal. They should display whether the test have passed or not. 

## Deployed Application:
```bash
http://localhost:3000/
```
