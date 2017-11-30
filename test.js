'use strict';

const mongoose = require('mongoose');
const {TEST_DATABASE_URL, PORT} = require('./config');
const {BlogPost} = require('./models');
const {app, runServer, closeServer} = require('./server');
const seedData = require('./seed-data.json');
const mocha = require('mocha');
const chai = require('chai');
const chaiHttp = require('chai-http');
const should = chai.should();
chai.use(chaiHttp);


function tearDownDb() {
  return new Promise((resolve, reject) => {
    console.warn('Deleting database');
    mongoose.connection.dropDatabase()
      .then(result => resolve(result))
      .catch(err => reject(err));
  });
}

beforeEach(function(){
  return BlogPost.insertMany(seedData);
});

afterEach(function() {
  return tearDownDb();
});

before(function() {
  return runServer();
});

after(function() {
  return closeServer();
});

// ==== Testing GET ==== 
describe('Get all posts.', function(){
  it('Should get all posts.', function(){
    let apiRes;
    return chai.request(app)
      .get('/posts')
      .then((res)=>{
        apiRes=res;
        res.should.have.status(200);
        res.should.be.json;
        res.body.should.be.a('array');
        res.body.length.should.be.above(0);
        const myId=res.body[0].id;
        console.log(myId);
        return BlogPost.findById(myId);
      }).then((myBlogPost)=>{
        myBlogPost.title.should.equal(apiRes.body[0].title);
      });
  });  
});


// ==== Testing POST ==== 
describe('Create endpoint for post.', function(){
  it('Should create one post.', function(){
    let apiRes;
    const newData = {
      author: {
        firstName: 'Jane',
        lastName: 'Doe'
      },
      title:  'A Blog Post Goes Forth',
      content: ' pseudo-Latin for one test.'
    };
    return chai.request(app)
      .post('/posts')
      .send(newData)
      .then(res => {
        res.should.have.status(201);
        res.should.be.json;
        res.body.should.include.keys('id', 'author', 'title', 'content');
        res.body.author.should.equal(newData.author.firstName + ' ' + newData.author.lastName);                             
        res.body.title.should.equal(newData.title);
        res.body.content.should.equal(newData.content);
        return BlogPost.findById(res.body.id);
      })
      .then (post => {
        console.log(post);
        post.title.should.equal(newData.title);
        post.author.firstName.should.equal(newData.author.firstName);
        post.author.lastName.should.equal(newData.author.lastName);
        post.content.should.equal(newData.content);
        
        
      });
      
  });
  
});


// ==== Testing PUT ==== 
describe('Edit one post.', function(){
  it('Should edit one post.', function(){
    let apiRes;
    const updateData = {
      author: {
        firstName: 'Jamie',
        lastName: 'Albertson'
      },
      title:  'A Blog Post Goes Forth',
      content: 'sufficient pseudo-Latin for one test.'
    };
    return BlogPost
      .findOne()
      .then(post => {
        updateData.id = post.id;
        return chai.request(app)
          .put(`/posts/${post.id}`)
          .send(updateData);
      })
      .then( res => {
        res.should.have.status(204);
        return BlogPost.findById(updateData.id);
      })
      .then( post => {
        post.title.should.equal(updateData.title);
        post.author.firstName.should.equal(updateData.author.firstName);
        post.author.lastName.should.equal(updateData.author.lastName);
        post.content.should.equal(updateData.content);
      });
  });
});


// ==== Testing DELETE ==== 
describe('Delete one post.', function(){
  it('Should delete one post.', function(){
    let apiRes;
    return BlogPost
      .findOne()
      .then((res)=>{
        apiRes=res;
        return chai.request(app).delete(`/posts/${apiRes.id}`);
      }).then((res)=>{
        res.should.have.status(204);
        return BlogPost.findById(apiRes.id);
      })
      .then((res)=>{
        should.not.exist(res);
      });
  });  
});