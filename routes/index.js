const express = require('express');
const jwt = require('jsonwebtoken');
const mysql = require('mysql');

const router = express.Router();

const myLogger =function(req,res,next){
  console.log("LOGGED");
  next();
}

router.use(myLogger);

router.get('/test', function(req,res){
  res.send('Hello World');
})

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'The World Database API' });
});

router.get('/api', function(req, res, next) {
  res.render('index', { title: 'Lots of routes available' });
});

router.get("/api/city", function(req,res, next) {
  req.db.from('city').select("name", "district")
  .then((rows) => {
  res.json({"Error" : false, "Message" : "Success", "City" : rows})
  })
  .catch((err) => {
  console.log(err);
  res.json({"Error" : true, "Message" : "Error in MySQL query"})
  })
 });

 //Display information
 router.get("/api/city/:CountryCode",function(req,res,next) {
  req.db.from('city').select('*').where('CountryCode','=',req.params.CountryCode)
  .then((rows) => {
  res.json({"Error" : false, "Message" : "Success", "Cities" : rows})
  })
  .catch((err) => {
  console.log(err);
  res.json({"Error" : true, "Message" : "Error executing MySQL query"})
  })
 }); 



const authorize = (req, res, next) => {
  const authorization = req.headers.authorization;
  let token = null;


  if(authorization && authorization.split(" ").length === 2){
    token = authorization.split(" ")[1];
    console.log("Token: ", token)
  }
    else{
      res.status(401).json(
        { 
          error: "true",
          message: `Unauthorised user` });
      return;
    }

    try{
      const decoded = jwt.verify(token, "secret key")
      if(decoded.exp > Date.now()){
        console.log("Token has expired")
        return;
      }
      next()
    }catch(e){
      console.log("Token is not valid: ", e);
    }
}

   //update the population
   router.post('/api/update', authorize, (req, res) => {
    if (!req.body.City || !req.body.CountryCode || !req.body.Pop) {
    res.status(400).json(
      { message: `Error: Empty paramters` });
    console.log(`Error on request body:`, JSON.stringify(req.body));
    }  
    else {
      const filter = {
      "Name":req.body.City,
      "CountryCode":req.body.CountryCode
      };

      const queryCities = req.db.select("*").from("city").where("Name", "=", req.body.City)
      
      queryCities.then(stuff =>
        {
        if(stuff.length === 0){
        res.status(403).json({error:true, message: `Error: either City or Country Code do not exist`});
        return; 
      }
      else{
        req.db('city').where(filter).
        update({"Population": req.body.Pop})
        .then(_ => {
        res.status(201).json({ message: `Successful update ${req.body.City} CountryCode: ${req.body.CountryCode}`});
        console.log(`successful population update:`, JSON.stringify(filter));
        }).catch(() => {
        res.status(500).json({ message: `Error: didnt update database`});
        })
      }
    })
 }
});

  //insert into the database
router.post('/api/insert', (req, res) => {
  if (!req.body.City || !req.body.CountryCode || !req.body.Pop || !req.body.District) {
  res.status(400).json(
    { message: `Error Inserting` });
  console.log(`Error on request body:`, JSON.stringify(req.body));
  }  
  else {
    const filter = {
    "Name":req.body.City,
    "CountryCode":req.body.CountryCode
    };

    req.db('city').insert({Name: req.body.City, CountryCode: req.body.CountryCode, District: req.body.District, Population: parseInt(req.body.Pop)})
    .then(_ => {
    res.status(201).json({ message: `Successful inserted ${req.body.City} ${req.body.CountryCode} ${req.body.Pop} ${req.body.District}`});
    console.log(`successful insert:`, JSON.stringify(filter));
    }).catch(error => {
    res.status(500).json({ message: 'Database error - not inserted' });
    })
}
});

module.exports = router;
