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
  
// Register
app.get('/register', function(req,res){
    res.render('pages/register');
});
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
//login
app.get('/login', function(req,res){
    res.render('pages/login');
});
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
const auth = (req, res, next) => {
  if (!req.session.user) {
    // Default to login page.
    return res.redirect('/login');
  }
  next();
};
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
// Authentication Required
app.use(auth);
app.get('/editProfile', function(req,res){
  var query = `SELECT * FROM profiles WHERE username = '${req.session.user.username}';`

  db.any(query)
    .then((data)=>{
      res.status(201);
      res.render('pages/editProfile', {
        user : data[0]
      });
    })
    .catch((err)=>{
      console.log(err);
      res.status(400);
      res.render('pages/profile')
    })
});

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
      access_token : 'pk.eyJ1IjoiamFsdTE4OTUiLCJhIjoiY2xveXY4ZnQwMDdncDJrbXN3YTRjeXFzayJ9.hfGiNqW1aIPZpUe0EEG_fg',
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
        access_token : 'pk.eyJ1IjoiamFsdTE4OTUiLCJhIjoiY2xveXY4ZnQwMDdncDJrbXN3YTRjeXFzayJ9.hfGiNqW1aIPZpUe0EEG_fg',
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
        userLat = '${retrieve.data.features[0].geometry.coordinates[0]}',
        userLon = '${retrieve.data.features[0].geometry.coordinates[1]}'
        WHERE username = '${req.session.user.username}';`
        db.any(query)
        .then((data) =>{

          // if(req.body.Country != undefined)
          // {
          //   res.status(200);
          //   res.redirect('/profile' + "?username=" + Tusername , {
          //     status: 'failiure',
          //     message : "Location required for discover",
          //   });
          // }
          // else{
          //   res.status(400);
          //   
          // }
          res.status(200);
          res.redirect('/profile' + "?username=" + Tusername);
        })
        .catch((err) =>{
          res.status(400);
          console.log(err);
          res.render('pages/register');
        });
      })
      .catch((err)=>{
        console.log(err);
      })
  })
  .catch((err)=>{
    console.log(err);
  })

});
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


app.get('/logout', (req,res)=>{
    req.session.destroy();
    res.render('pages/login', {
        error : false,
        message: "Logged out successfully",
    });
})
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
      let a = (results.data.events.length > 10) ? 10 : results.data.events.length;
      for(let i = 0; i < a; i++){
        let result = results.data.events[i];
        query = `UPDATE events
        SET eventID = '${result.id}',
        datetime_utc = '${result.datetime_utc}',
        state = '${result.venue.state}',
        name = '${result.venue.name}',
        timezone = '${result.venue.timezone}',
        url = '${result.venue.url}',
        score = '${result.venue.score}',
        locLat = '${result.venue.location.lat}',
        locLong = '${result.venue.location.lon}',
        address = '${result.venue.address}',
        country = '${result.venue.country}',
        capacity = '${result.venue.capacity}',
        city = '${result.venue.city}',
        artist = '${result.performers[0].name}',
        imageUrl = '${result.performers[0].image}'
        WHERE tableEventID = '${i+1}';`;
        db.any(query)
        .then(()=>{
          
        })
        .catch(error => {
          console.log(error);
          res.render('pages/discover', {events : []});
        });
      }
      res.render('pages/discover',{ events : results.data.events});
      })
    .catch(error => {
          console.log(error);
          res.render('pages/discover', {events : []});
        });
});

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
      if (results.data.events.length == 0)
      {
        res.render('pages/discover', {message : `No Events found for '${search}'`, events : [], error : true});
      }
      else{
      let a = (results.data.events.length > 10) ? 10 : results.data.events.length;
      for(let i = 0; i < a; i++){
        let result = results.data.events[i];
        query = `UPDATE events
        SET eventID = '${result.id}',
        datetime_utc = '${result.datetime_utc}',
        state = '${result.venue.state}',
        name = '${result.venue.name}',
        timezone = '${result.venue.timezone}',
        url = '${result.venue.url}',
        score = '${result.venue.score}',
        locLat = '${result.venue.location.lat}',
        locLong = '${result.venue.location.lon}',
        address = '${result.venue.address}',
        country = '${result.venue.country}',
        capacity = '${result.venue.capacity}',
        city = '${result.venue.city}',
        artist = '${result.performers[0].name}',
        imageUrl = '${result.performers[0].image}'
        WHERE tableEventID = '${i+1}';`;
        db.any(query)
        .then(()=>{
        })
        .catch(error => {
          console.log(error);
          res.render('pages/discover', {events : []});
        })
      }
      res.render('pages/discover',{ events : results.data.events});
    }})
    
    .catch(error => {
          console.log(error);
          res.render('pages/discover', {message : `No Events found for '${search}'`});
        });
});

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
            })
          })
      .catch((err) =>{
        res.status(400);
        console.log(err);
      });
    });

app.post('/event', function (req,res) {
  const query = `INSERT INTO comments (comment, eventID, username) VALUES ($1,'${req.query.id}', '${req.session.user.username}') RETURNING *;`;

  db.any(query, [req.body.comment,])
  res.redirect('/event' + '?id=' + req.query.id);
});

app.get('/map', function(req,res){
  res.render('pages/map');
})



// *****************************************************
// <!-- Section 5 : Start Server-->
// *****************************************************
// starting the server and keeping the connection open to listen for more requests
module.exports = app.listen(3000);
console.log('Server is listening on port 3000');