// *****************************************************
// <!-- Section 1 : Import Dependencies -->
// *****************************************************

const express = require('express'); // To build an application server or API
const app = express();
const pgp = require('pg-promise')(); // To connect to the Postgres DB from the node server
const bodyParser = require('body-parser');
const session = require('express-session'); // To set the session object. To store or access session data, use the `req.session`, which is (generally) serialized as JSON by the store.
const bcrypt = require('bcrypt'); //  To hash passwords
const axios = require('axios'); // To make HTTP requests from our server. We'll learn more about it in Part B.

// *****************************************************
// <!-- Section 2 : Connect to DB -->
// *****************************************************

// database configuration
const dbConfig = {
  host: 'db', // the database server
  port: 5432, // the database port
  database: process.env.POSTGRES_DB, // the database name
  user: process.env.POSTGRES_USER, // the user account to connect with
  password: process.env.POSTGRES_PASSWORD, // the password of the user account
};

const db = pgp(dbConfig);


// test your database
db.connect()
  .then(obj => {
    console.log('Database connection successful'); // you can view this message in the docker compose logs
    obj.done(); // success, release the connection;
  })
  .catch(error => {
    console.log('ERROR:', error.message || error);
  });

// *****************************************************
// <!-- Section 3 : App Settings -->
// *****************************************************

app.set('view engine', 'ejs'); // set the view engine to EJS
app.use(bodyParser.json()); // specify the usage of JSON for parsing request body.

// initialize session variables
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    saveUninitialized: false,
    resave: false,
  })
);

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

// Authentication Middleware.
// *****************************************************
// <!-- Section 4 : API Routes -->
// *****************************************************
// TODO - Include your API routes here
app.get('/', (req, res) => {
    res.redirect('/login'); //this will call the /anotherRoute route in the API
  });
app.get('/welcome', (req, res) => {
    res.json({status: 'success', message: 'Welcome!'});
  });
  
// Register GET route - render register page
app.get('/register', function(req,res){
    res.render('pages/register');
});
/* register POST route
query parameters:
  none
Database interaction: 
  Depends On:
  Profiles, users
API interaction: 
  None
Logic: 
  -hash the password and store it in the database and create a new profile for the user
Returns: 
  -editProfile page of user on success
  -Failure reverts to the register or login page
  */
app.post('/register', async (req, res) => {
    //hash the password using bcrypt library
    const hash = await bcrypt.hash(req.body.password, 10);
  
    
    // To-DO: Insert username and hashed password into the 'users' table
    var query = `INSERT INTO users (username, password) VALUES ('${req.body.username}' , '${hash}');`
    var profQuery = `INSERT INTO profiles (username) VALUES ('${req.body.username}');`
    var userQuery = `SELECT * FROM users WHERE username = '${req.body.username}';`

    db.any(query)
        .then(function(){
          db.any(profQuery)
          .then(()=>{
            db.one(userQuery)
            .then(async function(user){
                const match = await bcrypt.compare(req.body.password, user.password);
                if (match){
                    //save user details in session like in lab 8
                    req.session.user = user;
                    req.session.save();
                    res.status(200);
                    res.redirect('/editProfile');
                }
                else {
                  res.status(400);
                    res.render('pages/login', {
                        error: true,
                        message : "Incorrect Username/Password",
                    });
                }
            })
            .catch((err) => {
                res.status(401);
                console.log(err);
                res.render('pages/register');
            });
          })
          .catch((err) =>{
            res.status(400);
            console.log(err)
            res.render('pages/register', {
              error : true,
              message : "Failed to register!",
            }); 
          })
        })
        .catch((err) => {
          res.status(400);
            console.log(err)
            res.render('pages/register', {
              error : true,
              message : "Failed to register",
            }); 
        });
  });
//login GET route - render login page
app.get('/login', function(req,res){
    res.render('pages/login');
});
/* Login post route
query parameters:
  none
body parameters:
  username, password
Database interaction: 
  Depends On:
  users
API interaction: 
  None
Logic: 
  -using b.crypt check that the hashed password is the same as the req.body password and log the user in if so
Returns: 
  -None - redirects to discover route on success
  -None - on failure either redirect to register or to login depending on if the user exists or not
  */
app.post('/login', (req, res) => {
    
    //save user details in session like in lab 8

    var query = `SELECT * FROM users WHERE username = '${req.body.username}';`
    
    db.one(query)
        .then(async function(user){
            const match = await bcrypt.compare(req.body.password, user.password);
            if (match){
                //save user details in session like in lab 8
                req.session.user = user;
                req.session.save();
                res.status(200);
                res.redirect('/discover');
            }
            else {
              res.status(400);
                res.render('pages/login', {
                    error: true,
                    message : "Incorrect Username/Password",
                });
            }
        })
        .catch((err) => {
            res.status(401);
            console.log(err);
            res.render('pages/register');
        });
});
//authenticate the user
const auth = (req, res, next) => {
  if (!req.session.user) {
    // Default to login page.
    return res.redirect('/login');
  }
  next();
};
/* Profile GET route
query parameters:
  username
Database interaction: 
  Depends On:
  Profiles
API interaction: 
  None
Logic: 
  -using the query username variable, return the profile page of the username
Returns: 
  -rendered Profile page of username on success
  -Failure reverts to the register page
  */
  app.get('/profile', async (req, res) => {
    try {
      const username = req.query.username;
      const userQuery = `SELECT * FROM profiles WHERE username = '${username}';`;
      const userData = await db.any(userQuery);
  
      const carQuery = `
      SELECT * FROM car
      WHERE username = '${username}'
      OR Pusername0 = '${username}'
      OR Pusername1 = '${username}'
      OR Pusername2 = '${username}'
      OR Pusername3 = '${username}'
      OR Pusername4 = '${username}';
      `;
      const carData = await db.any(carQuery);
  
      const commentsQuery = `SELECT * FROM comments WHERE username = '${username}';`;
      const commentsData = await db.any(commentsQuery);
  
      let seatGeekEventData = [];
  
      if (carData.length != 0 || commentsData.length != 0) {
        // Extract event IDs from carData and commentsData
        const carEventIDs = carData.map((car) => car.eventid).filter((id) => id !== null);
        const commentEventIDs = commentsData.map((comment) => comment.eventid).filter((id) => id !== null);
  
        // Fetch event details from SeatGeek API for events associated with carData and commentsData
        const seatGeekEvents = await axios({
          url: 'https://api.seatgeek.com/2/events',
          method: 'GET',
          dataType: 'json',
          headers: {
            'Accept-Encoding': 'application/json',
          },
          params: {
            client_id: process.env.API_KEY,
            id: [...carEventIDs, ...commentEventIDs].join(','),
          },
        });
  
        seatGeekEventData = seatGeekEvents.data.events;
        console.log(seatGeekEventData)
      }
  
      // Merge required event details into carData
      const carWithEventDetails = carData.map((car) => {
        const eventDetails = seatGeekEventData.find((event) => event.id === car.eventid);
        const performer = eventDetails?.performers[0]?.name || 'Unknown';
        const venue = eventDetails?.venue?.name || 'Unknown';
        const datetimeUtc = eventDetails?.datetime_utc || 'Unknown';
  
        return { ...car, performer, venue, datetimeUtc };
      });
  
      // Merge required event details into commentsData
      const commentsWithEventDetails = commentsData.map((comment) => {
        const eventDetails = seatGeekEventData.find((event) => event.id === comment.eventid);
        const performer = eventDetails?.performers[0]?.name || 'Unknown';
        const venue = eventDetails?.venue?.name || 'Unknown';
        const datetimeUtc = eventDetails?.datetime_utc || 'Unknown';
  
        return { ...comment, performer, venue, datetimeUtc };
      });
      
      console.log(carWithEventDetails)
      res.status(200);
      res.render('pages/profile', {
        user: userData[0],
        carData: carWithEventDetails,
        commentsData: commentsWithEventDetails,
      });
    } catch (err) {
      res.status(404);
      console.log(err);
      res.render('pages/register');
    }
  });
  // Below this line Authentication Required
  app.use(auth);
  /* editProfile GET route
  query parameters:
    none
  Database interaction: 
    Depends On:
    Profiles
  API interaction: 
    None
  Logic: 
    -using the session variable, return the edit profile page of the user
  Returns: 
    -editProfile page of user on success
    -Failure reverts to the profile page
    */
  app.get('/editProfile', function(req,res){
    var query = `SELECT * FROM profiles WHERE username = '${req.session.user.username}';`
  
    db.any(query)
      .then((data)=>{
        res.status(201);
        res.render('pages/editProfile', {
          user : data[0],
          error : false
        });
      })
      .catch((err)=>{
        console.log(err);
        res.status(400);
        res.render('pages/userProfile')
      })
  });
  /* editProfile POST route
  query parameters:
    none
  body request parameters:
    first_name,last_name, profilePic,bio,state,Country,address
  Database interaction: 
    Depends On:
    Profiles
  API interaction: 
    Mapbox
  Logic: 
    -Using the users address, use the mapboxAPI to forward & reverse geocode to give the coordinates of the user
  Returns: 
    -Profile page of user on success
    -Failure reverts to the editProfile page previous to submission (can be caused by an invalid address being used)
    */
  app.post('/editProfile', (req,res) => {
  
    Address = req.body.address;
    var Tusername = req.session.user.username;
    axios({
      url: `https://api.mapbox.com/search/searchbox/v1/suggest?`,
      method: 'GET',
      dataType: 'json',
      headers: {
        'Accept-Encoding': 'application/json',
      },
      params: {
        q : Address,
        access_token : process.env.access_token,
        session_token : '00bd329c-6af4-4b71-88bd-e916d6b0945d'
      }
    })
    .then ((suggest) => {
      axios({
        url: `https://api.mapbox.com/search/searchbox/v1/retrieve/${suggest.data.suggestions[0].mapbox_id}?`,
        method: 'GET',
        dataType: 'json',
        headers: {
          'Accept-Encoding': 'application/json',
        },
        params: {
          access_token : process.env.access_token,
          session_token : '00bd329c-6af4-4b71-88bd-e916d6b0945d'
        }
      })
      .then((retrieve)=>{
          var query = `UPDATE profiles
          SET first_name = '${req.body.first_name}',
          last_name = '${req.body.last_name}',
          profile_pic_path = '${req.body.profilePic}',
          bio = '${req.body.bio}',
          state = '${req.body.state}',
          Country = '${req.body.Country}',
          address ='${req.body.address}',
          email = '${req.body.email}',
          userLat = '${retrieve.data.features[0].geometry.coordinates[0]}',
          userLon = '${retrieve.data.features[0].geometry.coordinates[1]}'
          WHERE username = '${req.session.user.username}';`
          db.any(query)
          .then(() =>{
            res.status(200);
            res.redirect('/userProfile' + "?username=" + Tusername);
          })
          .catch((err) =>{
            console.log(err)
            var query = `SELECT * FROM profiles WHERE username = '${req.session.user.username}';`
        
            db.any(query)
              .then((data)=>{
                res.status(201);
                res.render('pages/editProfile', {
                  error : true,
                  message : "Must specify a valid address",
                  user : data[0]
                }); 
              })
              .catch((err)=>{
                console.log(err);
                res.status(400);
                res.render('pages/userProfile')
              }) 
          });
        })
        .catch((err)=>{
          console.log(err);
        })
    })
    .catch((err) =>{
      console.log(err)
      var query = `SELECT * FROM profiles WHERE username = '${req.session.user.username}';`
  
      db.any(query)
        .then((data)=>{
          res.status(201);
          res.render('pages/editProfile', {
            error : true,
            message : "Must specify a valid address",
            user : data[0]
          }); 
        })
        .catch((err)=>{
          console.log(err);
          res.status(400);
          res.render('pages/userProfile')
        }) 
    });
  });
  /* Profile GET route
  query parameters:
    username
  Database interaction: 
    Depends On:
    Profiles
  API interaction: 
    None
  Logic: 
    -Fetch the profile with query username in database
  Returns: 
    -Rendered profile page
    */
  app.get('/userProfile', async (req, res) => {
    try {
      const username = req.session.user.username;
      const userQuery = `SELECT * FROM profiles WHERE username = '${username}';`;
      const userData = await db.any(userQuery);
  
      const carQuery = `
      SELECT * FROM car
      WHERE username = '${username}'
      OR Pusername0 = '${username}'
      OR Pusername1 = '${username}'
      OR Pusername2 = '${username}'
      OR Pusername3 = '${username}'
      OR Pusername4 = '${username}';
      `;
      const carData = await db.any(carQuery);
  
      const commentsQuery = `SELECT * FROM comments WHERE username = '${username}';`;
      const commentsData = await db.any(commentsQuery);
  
      let seatGeekEventData = [];
  
      if (carData.length != 0 || commentsData.length != 0) {
        // Extract event IDs from carData and commentsData
        const carEventIDs = carData.map((car) => car.eventid).filter((id) => id !== null);
        const commentEventIDs = commentsData.map((comment) => comment.eventid).filter((id) => id !== null);
  
        // Fetch event details from SeatGeek API for events associated with carData and commentsData
        const seatGeekEvents = await axios({
          url: 'https://api.seatgeek.com/2/events',
          method: 'GET',
          dataType: 'json',
          headers: {
            'Accept-Encoding': 'application/json',
          },
          params: {
            client_id: process.env.API_KEY,
            id: [...carEventIDs, ...commentEventIDs].join(','),
          },
        });
  
        seatGeekEventData = seatGeekEvents.data.events;
        console.log(seatGeekEventData)
      }
  
      // Merge required event details into carData
      const carWithEventDetails = carData.map((car) => {
        const eventDetails = seatGeekEventData.find((event) => event.id === car.eventid);
        const performer = eventDetails?.performers[0]?.name || 'Unknown';
        const venue = eventDetails?.venue?.name || 'Unknown';
        const datetimeUtc = eventDetails?.datetime_utc || 'Unknown';
  
        return { ...car, performer, venue, datetimeUtc };
      });
  
      // Merge required event details into commentsData
      const commentsWithEventDetails = commentsData.map((comment) => {
        const eventDetails = seatGeekEventData.find((event) => event.id === comment.eventid);
        const performer = eventDetails?.performers[0]?.name || 'Unknown';
        const venue = eventDetails?.venue?.name || 'Unknown';
        const datetimeUtc = eventDetails?.datetime_utc || 'Unknown';
  
        return { ...comment, performer, venue, datetimeUtc };
      });
      
      console.log(carWithEventDetails)
      res.status(200);
      res.render('pages/userProfile', {
        user: userData[0],
        carData: carWithEventDetails,
        commentsData: commentsWithEventDetails,
      });
    } catch (err) {
      res.status(404);
      console.log(err);
      res.render('pages/register');
    }
  });
    
    
  

/* Logout GET route
query parameters:
  none
body request parameters:
  none
Database interaction: 
  Depends On:
  None
API interaction: 
  None
Logic: 
  -Log the user out of the site
Returns: 
  -Rendered logout page
  */
app.get('/logout', (req,res)=>{
    req.session.destroy();
    res.render('pages/login', {
        error : false,
        message: "Logged out successfully",
    });
});
/* Discover GET route
query parameters:
  none
body request parameters:
  none
Database interaction: 
  Depends On:
  None
API interaction: 
  SeatGeek
Logic: 
  -Populate an array of events defaulting to the q parameter : Cody
Returns: 
  -Rendered discover page
  */
app.get('/discover',(req,res) => {

  axios({
    url: `https://api.seatgeek.com/2/events`,
    method: 'GET',
    dataType: 'json',
    headers: {
      'Accept-Encoding': 'application/json',
    },
    params: {
      client_id: process.env.API_KEY,
      q: `Cody`
    }
  })

    .then(results => {
      res.render('pages/discover',{ events : results.data.events});
      })
    .catch(error => {
          console.log(error);
          res.render('pages/discover', {events : []});
        });
});
/* Discover POST route
query parameters:
  none
body request parameters:
  search
Database interaction: 
  Depends On:
  None
API interaction: 
  SeatGeek
Logic: 
  -Populate an array of events based on seatgeek API search filter
Returns: 
  -Rendered discover page based on search body parameter
  */
app.post('/discover',(req,res) => {

  var search = req.body.search;

  axios({
    url: `https://api.seatgeek.com/2/events`,
    method: 'GET',
    dataType: 'json',
    headers: {
      'Accept-Encoding': 'application/json',
    },
    params: {
      client_id: process.env.API_KEY,
      q: search
    }
  })
    .then(results => {
      if (results.data.events.length == 0){
        res.render('pages/discover', {message : `No Events found for '${search}'`, events : [], error : true});
      }
      else{
        res.render('pages/discover',{ events : results.data.events});
      }
    })
    .catch(error => {
      console.log(error);
      res.render('pages/discover', {message : `No Events found for '${search}'`});
    });
});
/* Event GET route
query parameters:
  id - Integer : Event Identfication Number for a given seat geek event
body request parameters:
  None
Database interaction: 
  Depends On:
  Comments, Profiles
API interaction: 
  SeatGeek
Logic: 
  -Fetch comments and event information of a given seatgeek event based on id
Returns: 
  -Success : fully rendered event page with comments populated
  -Failure : Renders empty event page
  */
app.get('/event', (req, res) =>{
    const eID = req.query.id
    const query = `SELECT * FROM comments WHERE eventID = '${eID}';`;
    const userProf = `SELECT * FROM profiles WHERE username = '${req.session.user.username}';`
    db.any(query)
      .then((comment) => {
        res.status(201);
            db.one(userProf)
            .then((profile)=>{
              res.status(201);
              axios({
                url: `https://api.seatgeek.com/2/events`,
                method: 'GET',
                dataType: 'json',
                headers: {
                  'Accept-Encoding': 'application/json',
                },
                params: {
                  client_id: process.env.API_KEY,
                  id: req.query.id
                }
              })
              .then(results =>{
                res.render('pages/event', {
                  eID,
                  user : profile,
                  comment,
                  events : results.data.events
                });
              })
                .catch((err) => {
                  console.log(err);
                  res.render('pages/event', {events : []});
                });
            })
            .catch((err)=>{
              res.status(400);
              console.log(err);
              res.render('pages/event', {events : []});
            })
          })
      .catch((err) =>{
        res.status(400);
        console.log(err);
        res.render('pages/event', {events : []});
      });
});
/* Event POST route
query parameters:
  id - Integer : Event Identfication Number for a given seat geek event
body request parameters:
  Comment - Text user wishes to add as a comment
Database interaction: 
  Depends On:
  comments
API interaction: 
  None
Logic: 
 -Add user comment to comments table, redirect to refresh the page
Returns: 
  -None, redirects user to refreshed event page
  */
app.post('/event', function (req,res) {
  const query = `INSERT INTO comments (comment, eventID, username) VALUES ($1,'${req.query.id}', '${req.session.user.username}') RETURNING *;`;

  db.any(query, [req.body.comment,])
  res.redirect('/event' + '?id=' + req.query.id);
});
/* Driver GET route
query parameters:
  eventID - Integer : Event Identfication Number for a given seat geek event
Database interaction: 
  Depends On:
  None
API interaction: 
  None
Logic: 
  -Load a form page for user to populate
Returns: 
  -Rendered form page
  */
app.get('/driver', (req,res) => {
  res.render('pages/driver', {
    eventID : req.query.eventID
  })
});
/* Driver POST route
query parameters:
  eventID - Integer : Event Identfication Number for a given seat geek event
body request parameters:
  maxPass - maximum number of passengers 
  maxDistPickup - Maximum Distance in miles the driver is willing to pickup
  cost - How much the user intends to charge passengers if any
Database interaction: 
  Depends On:
  car
API interaction: 
  None
Logic: 
  -Depending on query variables, alter SQL queries to 1. Check if the user is already a driver for this event and if not, 2. Insert the user as a driver for this event
Returns: 
  -None, redirects user to event page upon on successfull or failed Inserts
  */
app.post('/driver', (req,res) => {
  const checkIfAlrDriver = `SELECT COUNT(*) FROM car WHERE username = '${req.session.user.username}' AND eventID = '${req.query.eventID}';`
  db.any(checkIfAlrDriver)
  .then((numDriver) => {
    if (numDriver[0].count == '0') {
      const query = `INSERT INTO car (username,eventID, maxPass, maxDistPickup, cost) VALUES
      ('${req.session.user.username}',
      '${req.query.eventID}',
      '${req.body.maxPass}',
      '${req.body.maxDistPickup}',
      '${req.body.cost}');`

      db.any(query)
        .then(() =>{
          res.redirect('/event' + '?id=' + req.query.eventID);
        })
        .catch((err)=>{
          console.log(err)
          res.redirect('/event' + '?id=' + req.query.eventID);
        });
    }
    else {
      res.redirect('/event' + '?id=' + req.query.eventID);
    }

  })
  .catch((err) => {
    console.log(err)
    res.redirect('/event' + '?id=' + req.query.eventID);
  })
  
});
/* Transportation GET route

query parameters:
  eventID - Integer : Event Identfication Number for a given seat geek event
Database interaction: 
  Depends On:
  Profiles, car
API interaction: 
  Uses mapbox directions API to fetch a distance estimate between the user and the driver (provided they have profile address information)
Logic: 
  -Depending on query variables, alter the SQL queries to fetch car information given an eventID and user profile information(session variable)
Returns: 
  -Empty page if there are no current drivers offering carpool
  -Rendered carpool page with driver information populated as well as distance between user and driver calculated
  */
  app.get('/transportation', async (req, res) => {
    try {
      const eID = req.query.eventID;
      const query = `SELECT * FROM car WHERE eventID = '${eID}';`;
      const userProfQuery = `SELECT * FROM profiles WHERE username = '${req.session.user.username}' LIMIT 1;`;
  
      const userData = await db.one(userProfQuery);
      const carsData = await db.any(query);
  
      const distancePromises = carsData.map((car) => {
        const drivProfQuery = `SELECT * FROM profiles WHERE username = '${car.username}' LIMIT 1;`;
        return db.one(drivProfQuery)
          .then((driverProfData) => {
            return axios({
              url: `https://api.mapbox.com/directions/v5/mapbox/driving/${userData.userlat}%2C${userData.userlon}%3B${driverProfData.userlat}%2C${driverProfData.userlon}?alternatives=true&geometries=geojson&language=en&overview=full&steps=true&access_token=${process.env.access_token}`,
              method: 'GET',
              dataType: 'json',
              headers: {
                'Accept-Encoding': 'application/json',
              },
            })
            .then((mapBoxData) => {
              const distance = (mapBoxData.data.routes[0].distance / 1000) * 0.621371192;
              return { carId: car.carid, distance };
            });
          });
      });
  
      const distances = await Promise.all(distancePromises);
      const dist = {};
      distances.forEach((d) => {
        dist[d.carId] = d.distance;
      });
  
      res.render('pages/transportation', {
        data: carsData,
        eID,
        user: req.session.user.username,
        dist,
      });
    } catch (err) {
      console.log(err);
      res.redirect('/event?id=' + req.query.eventID);
    }
  });
/* Transportation POST route

query parameters:
  eventID - Integer : Event Identfication Number for a given seat geek event
  username - string (0 - 50 characters) : Stores username of the driver's car the current user is trying to join
  passengerNum - expected values : integer range(1-5). Keeps track of the current number of passengers to given car at function call
  ct - Expected values : (-1 to leave car)(1 to join)
Database interaction: 
  Depends On:
  Profiles, car
API interaction: 
  Uses mapbox directions API to fetch a distance estimate between the user and the driver (provided they have profile address information)
Logic: 
  -Depending on query variables, alter the SQL queries to either 1. remove a user from the car or 2. add a user to the car
  -Pnum determines where in the car database the passenger will be inserted or removed upon join or leave (determined by the slot matching session username for leaves or the first open slot for joins)
Return Values: 
  -Transportation page rendered with necessary values fetched from database
  */
  app.post('/transportation', async (req, res) => {
    console.log(req.query.eventID)
    try {
      const eID = req.query.eventID;
      const username = req.session.user.username;
      
      // Fetch the specific car based on the event ID and username
      const carQuery = `SELECT * FROM car WHERE eventID = '${eID}' AND username = '${req.query.username}' LIMIT 1;`;
      const carData = await db.one(carQuery);
  
      // Identify the available slot in the car for the user to join
      let pnum = null;
      for (let i = 0; i < 5; i++) {
        if (carData[`pusername${i}`] === '' || carData[`pusername${i}`] === null) {
          pnum = i;
          break;
        }
      }
      console.log(pnum)
      // If there's an available slot, update the specific car with the added user information
      if (pnum !== null) {
        const updateQuery = `UPDATE car SET Pusername${pnum} = '${username}', currPass = ${req.query.passengerNum} + ${req.query.ct} WHERE eventID = '${eID}' AND username = '${req.query.username}';`;
        await db.none(updateQuery);
      }
  
      // Redirect or render your page accordingly
      res.redirect('/transportation?eventID=' + req.query.eventID);
    } catch (err) {
      console.log(err);
      res.redirect('/event?id=' + req.query.eventID);
    }
  });
  /* Transportation/leave POST route

  query parameters:
    eventID - Integer : Event Identfication Number for a given seat geek event
    username - string (0 - 50 characters) : Stores username of the driver's car the current user is trying to join
    passengerNum - expected values : integer range(1-5). Keeps track of the current number of passengers to given car at function call
    ct - Expected values : (-1 to leave car)(1 to join)
  Database interaction: 
    Depends On:
    Profiles, car
  API interaction: 
    Uses mapbox directions API to fetch a distance estimate between the user and the driver (provided they have profile address information)
  Logic: 
    -Depending on query variables, alter the SQL queries to either 1. remove a user from the car or 2. add a user to the car
    -Pnum determines where in the car database the passenger will be inserted or removed upon join or leave (determined by the slot matching session username for leaves or the first open slot for joins)
  Return Values: 
    -Transportation page rendered with necessary values fetched from database
  */
  app.post('/transportation/leave', async (req, res) => {
    try {
      const eID = req.query.eventID;
      const username = req.session.user.username;
  
      // Fetch the specific car based on the event ID and username
      const carQuery = `SELECT * FROM car WHERE eventID = '${eID}' AND username = '${req.query.username}' LIMIT 1;`;
      const carData = await db.one(carQuery);
  
      // Find the slot where the user is currently present and remove the user from that slot
      let pnum = null;
      for (let i = 0; i < 5; i++) {
        if (carData[`pusername${i}`] === username) {
          pnum = i;
          break;
        }
      }
  
      // If the user is found in the car, remove them from that slot
      if (pnum !== null) {
        const updateQuery = `UPDATE car SET Pusername${pnum} = ${null}, currPass = currPass + ${req.query.ct} WHERE eventID = '${eID}' AND username = '${req.query.username}';`;
        await db.none(updateQuery);
      }
  
      if ('page' in req.query){
        res.redirect('/userProfile')
      } else {
        res.redirect('/transportation?eventID=' + req.query.eventID);
      }
    } catch (err) {
      console.log(err);
      res.redirect('/event?id=' + req.query.eventID);
    }
  });
  
/* removeComment POST route

query parameters:
  commentID - integer - commentID stored in database
Database interaction: 
  Depends On:
  comments
API interaction: 
  None
Logic: 
  -Using commentID and user session variable, remove the comment that the user wishes to delete
Return Values: 
  -None, redirect to event page
  */
app.post('/removeComment', (req,res)=>{
  var query = `DELETE FROM comments WHERE username = '${req.session.user.username}' AND commentID = '${req.query.commentID}';`
  db.any(query)
    .then(() => {
      if ('page' in req.query){
        res.redirect('/userProfile')
      } else {
      res.redirect('/event' + '?id=' + req.query.eventID);
      }
    })
    .catch(() => {
      res.redirect('/event' + '?id=' + req.query.eventID);
    })
});
/* removeCar POST route

query parameters:
  carID - integer - carID stored in database
Database interaction: 
  Depends On:
  car
API interaction: 
  None
Logic: 
  -Using carID and user session variable, remove the comment that the user wishes to delete
Return Values: 
  -None, redirect to event page
  */
app.post('/removeCar', (req,res)=>{
  console.log(req.query.eventID)
  var query = `DELETE FROM car WHERE username = '${req.session.user.username}' AND carID = '${req.query.carID}';`
  db.any(query)
    .then(() => {
      console.log("removed")
      if ('page' in req.query){
        res.redirect('/userProfile')
      } else {
        res.redirect('/event' + '?id=' + req.query.eventID);
      }
    })
    .catch(() => {
      res.redirect('/event' + '?id=' + req.query.eventID);
    })
});


// *****************************************************
// <!-- Section 5 : Start Server-->
// *****************************************************
// starting the server and keeping the connection open to listen for more requests
module.exports = app.listen(3000);
console.log('Server is listening on port 3000');