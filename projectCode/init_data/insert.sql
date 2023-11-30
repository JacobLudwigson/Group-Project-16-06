INSERT INTO users (username, password) VALUES
('Dan', '123');

INSERT INTO profiles (username) VALUES
('Dan');

INSERT INTO comments (comment, eventID, username) VALUES
('Cool event', 6094026, 'Dan');


INSERT INTO events (eventID) VALUES (0);
INSERT INTO events (eventID) VALUES (0);
INSERT INTO events (eventID) VALUES (0);
INSERT INTO events (eventID) VALUES (0);
INSERT INTO events (eventID) VALUES (0);
INSERT INTO events (eventID) VALUES (0);
INSERT INTO events (eventID) VALUES (0);
INSERT INTO events (eventID) VALUES (0);
INSERT INTO events (eventID) VALUES (0);
INSERT INTO events (eventID) VALUES (0);
INSERT INTO events (eventID) VALUES (0);
INSERT INTO events (eventID) VALUES (0);
INSERT INTO events (eventID) VALUES (0);
INSERT INTO events (eventID) VALUES (0);
INSERT INTO events (eventID) VALUES (0);
INSERT INTO events (eventID) VALUES (0);

INSERT INTO users (username, password) VALUES
('somebody', '123');

INSERT INTO users (username, password) VALUES
('me', '123');

INSERT INTO users (username, password) VALUES
('john', '123');

INSERT INTO profiles (username) VALUES
('somebody');

INSERT INTO profiles (username) VALUES
('john');

INSERT INTO profiles (username) VALUES
('me');

INSERT INTO car (eventID, username, maxPass, currPass) VALUES 
(6094026, 'somebody', '4', '0');

INSERT INTO car (eventID, username, maxPass, currPass) VALUES 
(6094026, 'john', '4', '0');

-- INSERT INTO car (eventID, username, maxPass, currPass) VALUES 
-- (6094026, 'somebody', '4', '0');


INSERT INTO car (eventID, username, maxPass, currPass, Pusername0) VALUES 
(6094026, 'me', '4', '0', 'john');


-- INSERT INTO car (eventID, username, maxPass, currPass, Pusername0) VALUES 
-- (6094026, 'tony', '4', '2', 'tony');