CREATE TABLE users (
    username VARCHAR(50) PRIMARY KEY,
    password CHAR(60)
);

CREATE TABLE comments(
    commentID SERIAL PRIMARY KEY,
    comment VARCHAR(255),
    eventID INT DISTINCT,
    CONSTRAINT fk_username FOREIGN KEY(users) REFERENCES username
);

CREATE TABLE profile (
    profileID SERIAL PRIMARY KEY,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    bio VARCHAR(255),
    profile_pic_path VARCHAR(255), 
    CONSTRAINT fk_username FOREIGN KEY(users) REFERENCES username
);

