const bcrypt = require('bcrypt');//Define all middleware
const jwt = require('jsonwebtoken');
const express = require('express');
const router = express.Router();

/*
ROUTE: user/register

Registers a new user and store this information onto the MySQL database

returns status 201 = Success, 400 = Request body incomplete, 409 = User already exists
*/

router.post("/register", function(req,res,next){
  const email = req.body.email;
  const password = req.body.password;

  if(!email || !password){//If email or password dont exist
    res.status(400).json({
      error: true,
      message: "Request body incomplete - email and password needed"
    })
    return
  }
  console.log(email);
  const queryUsers = req.db.select("*").from("user").where("email", "=", email);
  queryUsers.
  then((users) => {
    if(users.length > 0){//Check if the user exists
      res.status(409).json({error:true, message:"User already exists!"});
      return;
    }
    else{// If not create new user
      const saltRounds = 10;
      const hash = bcrypt.hashSync(password,saltRounds);
      req.db.from("user").insert({email, hash}).then(() => res.status(201).json({success: true , message: "User created"})).catch(e => {console.log(e); res.status(400).json({error: true, message: e})})
      return;
      }
    }
    )  
});

/*
ROUTE: user/login

Registers a new user and store this information onto the MySQL database

returns status 200 = Success, 401 = Request body incomplete, 409 = User already exists
*/

router.post("/login", function(req,res,next){
  const email = req.body.email;
  const password = req.body.password;

  if(!email || !password){//If email or password dont exist
    res.status(400).json({
      error: true,
      message: "Request body incomplete - email and password needed"
    })
    return;
  }
  const queryUsers = req.db.select("*").from("user").where("email", "=", email);
  queryUsers.then((users) => {
    if(users.length === 0){// If the user does not exist
      res.status(401).json({
        error: true,
        message: "Incorrect email or password"
      }); return; 
    }
    else{
      const user = users[0];
      bcrypt.compare(password, user.hash).then((match)=> {
        if(!match){//If the password is incorrect
          res.status(401).json({
            error: true,
            message: "Incorrect email or password"
          });
          return
        }
        else{//If not, log user in and send token.
          const secretKey = "secret key";
          const expires = 60*60*24;
          const exp = Math.floor(Date.now()/1000) + expires;
          const token = jwt.sign({email, exp}, secretKey);

          res.status(200).json({
            token, token_type: "Bearer",  expires_in: expires
          });
          return;
        }
      })
    }
  })
  
});

//Catch any other routes and return error.
router.get('*', function(req,res){
  res.status(404).json({error : true, "message" : "Not found"})
});


module.exports = router;
