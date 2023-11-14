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

    db.any(query)
        .then(function(){
            res.redirect('/login');
        })
        .catch((err) => {
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
    
    
    // check if password from request matches with password in DB
    // if(!match){
    //     console.log(err);
    //     res.redirect('/register');
    // }
    // else{
    //     req.session.user = user;
    //     req.session.save();
    //     res.redirect('/discover');
    // }
    db.one(query)
        .then(async function(user){
            const match = await bcrypt.compare(req.body.password, user.password);
            if (match){
                //save user details in session like in lab 8
                req.session.user = user;
                req.session.save();
                res.redirect('/createProfile')
            }
            else {
                res.render('pages/login', {
                    error: true,
                    message : "Incorrect Username/Password",
                });
            }
        })
        .catch((err) => {
            console.log(err);
            res.render('pages/register');
        });
});
app.get('/profile', (req,res) =>{
  var query = `SELECT * FROM users WHERE username = '${req.body.username}';`

  db.any(query)
    .then((data) =>{
      res.render('pages/profile', {
        user : data
      })
    })
    .catch((err) =>{
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

// Authentication Required
app.use(auth);
app.get('/createProfile', function(req,res){
  res.render('pages/createProfile');
});
app.post('/createProfile', (req,res) => {
  var query = `INSERT INTO profiles (username,first_name, last_name, profile_pic_path,bio) VALUES 
  ('${req.session.user.username}', '${req.body.first_name}','${req.body.last_name}', '${req.body.profilePic}', '${req.body.bio}') returning *;`

  db.any(query)
    .then((data) =>{
      // console.log(data[0].username);
      res.redirect('/profile');
    })
    .catch((err) =>{
      console.log(err);
      res.render('pages/register');
    });
})
app.get('/profile', (req,res) =>{
  var query = `SELECT * FROM profiles WHERE username = '${req.session.user.username}';`

  db.any(query)
    .then((data) =>{
      console.log(data[0]);
      res.render('pages/profile', {
        user : data[0],
      });
    })
    .catch((err) =>{
      console.log("Error handler");
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
          'X-RapidAPI-Key': 'c1683c1059msh165987118f5c98ap15d64cjsn53ca6dfa5530',
          'X-RapidAPI-Host': 'seatgeek-seatgeekcom.p.rapidapi.com'
        },
        params: {
          apikey: process.env.API_KEY,
          //q: "Cody", //you can choose any artist/event here
        },
    })
    .then(results => {
          console.log(results.data);
          res.render('pages/discover', {events : results.data}); // the results will be displayed on the terminal if the docker containers are running // Send some parameters
        })
    .catch(error => {
          console.log(error);
          res.render('pages/discover', {events : []});
        });
});



// *****************************************************
// <!-- Section 5 : Start Server-->
// *****************************************************
// starting the server and keeping the connection open to listen for more requests
module.exports = app.listen(3000);
console.log('Server is listening on port 3000');