// Imports the index.js file to be tested.
const server = require('../index'); //TO-DO Make sure the path to your index.js is correctly added
// Importing libraries

// Chai HTTP provides an interface for live integration testing of the API's.
const chai = require('chai');
const chaiHttp = require('chai-http');
chai.should();
chai.use(chaiHttp);
const {assert, expect} = chai;

describe('Server!', () => {
  // Sample test case given to test / endpoint.
  it('Returns the default welcome message', done => {
    chai
      .request(server)
      .get('/welcome')
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body.status).to.equals('success');
        assert.strictEqual(res.body.message, 'Welcome!');
        done();
      });
  });

  // ===========================================================================
  // TO-DO: Part A Login unit test case
  it('positive : /resgister', done => {
    chai
      .request(server)
      .post('/register')
      .send({username : "Jake", password : "password"})
      .end((err, res) => {
        expect(res).to.have.status(200);
        done();
      });
  });
  it('Negative : /register. Checking already stored user', done => {
    chai
      .request(server)
      .post('/register')
      .send({username : "Jake", password : "blahblah"})
      .end((err, res) => {
        expect(res).to.have.status(400);
        done();
      });
  });
  it('positive : /login correct username/password', done => {
    chai
      .request(server)
      .post('/login')
      .send({username : "Jake", password : "password"})
      .end((err, res) => {
        expect(res).to.have.status(200);
        done();
      });
  });
  it('Negative : /login. Checking correct username invalid password', done => {
    chai
      .request(server)
      .post('/login')
      .send({username : "Jake", password : "password1"})
      .end((err, res) => {
        expect(res).to.have.status(400);
        done();
      });
  });
});