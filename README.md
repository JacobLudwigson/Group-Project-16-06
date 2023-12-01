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

## How to run:

Once the repository is cloned, create a .env file and fill it with the following:
```bash 
POSTGRES_USER="postgres"
POSTGRES_PASSWORD="pwd"
POSTGRES_DB="users_db"

SESSION_SECRET="super duper secret!"
API_KEY="<Your Seat Geek clientid>"
access_token = "<Your Mapbox Access Token>"
```
change to the projectCode folder, and run the command:
```bash 
docker compose up
```
This should run the npm package installation, tests, initializations of the database, and nodejs. 
Once the connection is successful, navigate to your browser and input into the search bar. 
```bash
http://localhost:3000/
```
This should bring you to the EventGO login page. 
## How to run tests:
Navigate to the package.json file, and at the bottom line, change the line to be:
```bash
"testandrun": "npm run prestart && npm run test && npm start"
```
When the docker is run, the tests should appear in the terminal. They should display whether the test have passed or not. 

## Deployed Application:
```bash
http://localhost:3000/
```
