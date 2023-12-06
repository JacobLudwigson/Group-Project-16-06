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
app.get('/profile', (req,res) =>{
  var query = `SELECT * FROM profiles WHERE username = '${req.query.username}';`
  db.any(query)
    .then((data) =>{
      res.status(200);
      res.render('pages/profile', {
        user : data[0]
      });
    })
    .catch((err) =>{
      res.status(404);
      console.log(err);
      res.render('pages/register');
    });

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
      res.render('pages/profile')
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
          res.redirect('/profile' + "?username=" + Tusername);
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
              res.render('pages/profile')
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
        res.render('pages/profile')
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
app.get('/profile', (req,res) =>{
  var query = `SELECT * FROM profiles WHERE username = '${req.query.username}';`

  db.any(query)
    .then((data) =>{
      res.status(200);
      res.render('pages/profile', {
        user : data[0]
      });
    })
    .catch((err) =>{
      res.status(404);
      console.log(err);
      res.render('pages/register');
    });

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
app.get('/transportation', (req,res) => {
  const eID = req.query.eventID
  const query = `SELECT * FROM car WHERE eventID = '${eID}';`;
  const userProfQuery = `SELECT * FROM profiles WHERE username = '${req.session.user.username}' LIMIT 1;`
  var count=0;
  dist = new Array();
  db.any(query)
  .then((data) => {
    if (data.length == 0){
      dist = [];
      res.render('pages/transportation', {
        data,
        eID,
        user : req.session.user.username,
        dist
      })
    }
    db.one(userProfQuery)
    .then((userProfData) =>{ 
    for(let car of data){
      const drivProfQuery = `SELECT * FROM profiles WHERE username = '${car.username}' LIMIT 1;`
        db.any(drivProfQuery)
          .then((driverProfData) =>{
            axios({
              url: `https://api.mapbox.com/directions/v5/mapbox/driving/${userProfData.userlat}%2C${userProfData.userlon}%3B${driverProfData[0].userlat}%2C${driverProfData[0].userlon}?alternatives=true&geometries=geojson&language=en&overview=full&steps=true&access_token=${process.env.access_token}`,
              method: 'GET',
              dataType: 'json',
              headers: {
                'Accept-Encoding': 'application/json',
              },
            })
            .then((mapBoxData) =>{
              var distance = (mapBoxData.data.routes[0].distance/1000)*0.621371192;
              dist[car.carid] = distance
              count+=1;
              if (count == data.length){
                res.render('pages/transportation', {
                  data,
                  eID,
                  user : req.session.user.username,
                  dist
                })
              }
            })
            .catch((err)=>{
              console.log(err)
              res.redirect('/event' + '?id=' + req.query.eventID);
            }); 
          })
          .catch((err)=>{
            console.log(err)
            res.redirect('/event' + '?id=' + req.query.eventID);
          });
        }

    })
  });
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
app.post('/transportation', (req, res) => {
  var puser = ""
  var pnum;
  const eID = req.query.eventID
  //if ct = '-1' the user is trying to leave a car they are already in
  if (req.query.ct == '-1'){
    var addQuery = `SELECT * FROM car 
    WHERE eventID = '${eID}' AND
    username = '${req.query.username}' LIMIT 1;`
    var joinUser = req.session.user.username;
    //find where in the car database the passenger is trying to leave from
    db.one(addQuery)
      .then((addQueryData)=>{
        if (addQueryData.pusername0 == joinUser){pnum=0}
        else if (addQueryData.pusername1 == joinUser){pnum=1}
        else if (addQueryData.pusername2 == joinUser){pnum=2}
        else if (addQueryData.pusername3 == joinUser){pnum=3}
        else if (addQueryData.pusername4 == joinUser){pnum=4}
        const querry = `UPDATE car SET Pusername${pnum} = '${puser}', currPass = currPass + ${req.query.ct} WHERE username = '${req.query.username}';`;
        const query = `SELECT * FROM car WHERE eventID = '${eID}';`;
        const userProfQuery = `SELECT * FROM profiles WHERE username = '${req.session.user.username}' LIMIT 1;`
        const drivProfQuery = `SELECT * FROM profiles WHERE username = '${req.query.username}' LIMIT 1;`
        var count=0;
        //declare an array to store distance information about the different cars
        dist = new Array();
        //Fetch desired car information
        db.any(query)
        .then((data) => {
          //fetch the users profile information (needed for location)
          db.one(userProfQuery)
            
          .then((userProfData) =>{
          //for each car returned from the car query for this event
          for(let car of data){
            const drivProfQuery = `SELECT * FROM profiles WHERE username = '${car.username}' LIMIT 1;`
              //query the driver of a given car's profile
              db.any(drivProfQuery)
                .then((driverProfData) =>{
                  //using profile information make a mapbox directions call to get a distance estimate
                  axios({
                    url: `https://api.mapbox.com/directions/v5/mapbox/driving/${userProfData.userlat}%2C${userProfData.userlon}%3B${driverProfData[0].userlat}%2C${driverProfData[0].userlon}?alternatives=true&geometries=geojson&language=en&overview=full&steps=true&access_token=pk.eyJ1IjoiamFsdTE4OTUiLCJhIjoiY2xveXY4ZnQwMDdncDJrbXN3YTRjeXFzayJ9.hfGiNqW1aIPZpUe0EEG_fg`,
                    method: 'GET',
                    dataType: 'json',
                    headers: {
                      'Accept-Encoding': 'application/json',
                    },
                  })
                  .then((mapBoxData) =>{
                    //convert mapbox meter distance data to miles
                    var distance = (mapBoxData.data.routes[0].distance/1000)*0.621371192;
                    //store the respective distance values in an array at carID indexes to avoid asynchronous function call issues
                    dist[car.carid] = distance
                    count+=1;
                    if (count == data.length){
                      //Once the distance array is fully populated, update the car table with our removed user
                      db.any(querry)
                      .then((moredata) => {
                        //fetch the freshly updated car information based on user
                        db.any(query)
                        .then((data) => {
                          //render the page with our necessary data passed as a json
                          res.render('pages/transportation', {
                            eID,
                            moredata,
                            data,
                            user : req.session.user.username,
                            dist
                          });
                        })
                        .catch((err) =>{
                          console.log(err)
                          res.redirect('/event' + '?id=' + req.query.eventID);
                        });
                      })
                      .catch((err) =>{
                        console.log(err)
                        res.redirect('/event' + '?id=' + req.query.eventID);
                      });
                    }
                  })
                  .catch((err) =>{
                    console.log(err)
                    res.redirect('/event' + '?id=' + req.query.eventID);
                  }); 
                })
                .catch((err) =>{
                  console.log(err)
                  res.redirect('/event' + '?id=' + req.query.eventID);
                });
              }
          })
          .catch((err) =>{
            console.log(err)
            res.redirect('/event' + '?id=' + req.query.eventID);
          });
        })
        .catch((err) =>{
          console.log(err)
          res.redirect('/event' + '?id=' + req.query.eventID);
        });
      })
    .catch((err) =>{
      console.log(err)
      res.redirect('/event' + '?id=' + req.query.eventID);
    });
    //If at any point the necessary information cannot be fetched, redirect the user back to the event page
  }
  else if(req.query.ct != '-1') { //if the user is trying to join a carpool
    var addQuery = `SELECT * FROM car 
    WHERE eventID = '${eID}' AND
    username = '${req.query.username}' LIMIT 1;`
    //Fetch car information
    db.one(addQuery)
      .then((addQueryData)=>{
        puser = req.session.user.username
        //Find out where the closest slot in the database is to insert the user
        if (addQueryData.pusername0 == '' || addQueryData.pusername0 == null){pnum=0}
        else if (addQueryData.pusername1 == '' || addQueryData.pusername1 == null){pnum=1}
        else if (addQueryData.pusername2 == '' || addQueryData.pusername2 == null){pnum=2}
        else if (addQueryData.pusername3 == '' || addQueryData.pusername3 == null){pnum=3}
        else if (addQueryData.pusername4 == '' || addQueryData.pusername4 == null){pnum=4}
        //from here, the code follows the same logic as the removal of users
        const querry = `UPDATE car SET Pusername${pnum} = '${puser}', currPass = currPass + ${req.query.ct} WHERE username = '${req.query.username}';`;
        const query = `SELECT * FROM car WHERE eventID = '${eID}';`;
        const userProfQuery = `SELECT * FROM profiles WHERE username = '${req.session.user.username}' LIMIT 1;`
        const drivProfQuery = `SELECT * FROM profiles WHERE username = '${req.query.username}' LIMIT 1;`
        var count=0;
        dist = new Array();
        db.any(query)
        .then((data) => {
          db.one(userProfQuery)
            
          .then((userProfData) =>{
            
          for(let car of data){
            const drivProfQuery = `SELECT * FROM profiles WHERE username = '${car.username}' LIMIT 1;`
              db.any(drivProfQuery)
                .then((driverProfData) =>{
                  axios({
                    url: `https://api.mapbox.com/directions/v5/mapbox/driving/${userProfData.userlat}%2C${userProfData.userlon}%3B${driverProfData[0].userlat}%2C${driverProfData[0].userlon}?alternatives=true&geometries=geojson&language=en&overview=full&steps=true&access_token=${process.env.access_token}`,
                    method: 'GET',
                    dataType: 'json',
                    headers: {
                      'Accept-Encoding': 'application/json',
                    },
                  })
                  .then((mapBoxData) =>{
                    var distance = (mapBoxData.data.routes[0].distance/1000)*0.621371192;
                    dist[car.carid] = distance
                    count+=1;
                    if (count == data.length){
                      db.any(querry)
                      .then((moredata) => {
                        db.any(query)
                        .then((data) => {
                          res.render('pages/transportation', {
                            eID,
                            moredata,
                            data,
                            user : req.session.user.username,
                            dist
                          });
                        })
                        .catch((err) =>{
                          console.log(err)
                          res.redirect('/event' + '?id=' + req.query.eventID);
                        });
                      })
                      .catch((err) =>{
                        console.log(err)
                        res.redirect('/event' + '?id=' + req.query.eventID);
                      });
                    }
                  })
                  .catch((err) =>{
                    console.log(err)
                    res.redirect('/event' + '?id=' + req.query.eventID);
                  }); 
                })
                .catch((err) =>{
                  console.log(err)
                  res.redirect('/event' + '?id=' + req.query.eventID);
                });
              }
          })
          .catch((err) =>{
            console.log(err)
            res.redirect('/event' + '?id=' + req.query.eventID);
          });
        })
        .catch((err) =>{
          console.log(err)
          res.redirect('/event' + '?id=' + req.query.eventID);
        });
      })
    .catch((err) =>{
      console.log(err)
      res.redirect('/event' + '?id=' + req.query.eventID);
    });
  }
  else {
    res.render('pages/register');
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
      res.redirect('/event' + '?id=' + req.query.eventID);
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
  var query = `DELETE FROM car WHERE username = '${req.session.user.username}' AND carID = '${req.query.carID}';`
  db.any(query)
    .then(() => {
      res.redirect('/event' + '?id=' + req.query.eventID);
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