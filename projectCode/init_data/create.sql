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
    address VARCHAR(50) DEFAULT 'Cu Boulder',
    userLat DECIMAL(10,2),
    userLon DECIMAL(10,2),
    CONSTRAINT fk_username FOREIGN KEY(username) REFERENCES users
);

CREATE TABLE car (
    carID SERIAL PRIMARY KEY,
    eventID INT,
    username VARCHAR(50),
    maxPass INT DEFAULT 0,
    currPass INT DEFAULT 0,
    maxDistPickup DECIMAL(10,2) DEFAULT 0,
    cost DECIMAL(10,2) DEFAULT 0.0,
    Pusername0 VARCHAR(50),
    Pusername1 VARCHAR(50),
    Pusername2 VARCHAR(50),
    Pusername3 VARCHAR(50),
    Pusername4 VARCHAR(50)
);
