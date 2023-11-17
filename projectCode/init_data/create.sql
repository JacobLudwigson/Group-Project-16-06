CREATE TABLE users (
    username VARCHAR(50) PRIMARY KEY,
    password CHAR(60)
);

CREATE TABLE comments(
    commentID SERIAL PRIMARY KEY,
    comment VARCHAR(255),
    eventID INT,
    username VARCHAR(50),
    CONSTRAINT fk_username FOREIGN KEY(username) REFERENCES users
);

CREATE TABLE profiles (
    profileID SERIAL PRIMARY KEY,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    bio VARCHAR(255),
    profile_pic_path VARCHAR(255) DEFAULT 'https://zultimate.com/wp-content/uploads/2019/12/default-profile.png', 
    username VARCHAR(50),
    state VARCHAR(50),
    Country VARCHAR(50),
    CONSTRAINT fk_username FOREIGN KEY(username) REFERENCES users
);

CREATE TABLE events (
    tableEventID SERIAL PRIMARY KEY,
    eventID INT,
    datetime_utc TIMESTAMP,
    state VARCHAR(100),
    name VARCHAR(100),
    timezone VARCHAR(100),
    url VARCHAR(100),
    locLat DECIMAL(10,2),
    locLong DECIMAL(10,2),
    score DECIMAL(10,2),
    address VARCHAR(100),
    country VARCHAR(100),
    capacity INT,
    city VARCHAR(100),
    artist VARCHAR(100),
    imageUrl VARCHAR(255)
);

