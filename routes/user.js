const mysql = require('mysql');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.post("/register", function(req,res,next){
  const email = req.body.email;
  const password = req.body.password;

  if(!email || !password){
    res.status(400).json({
      error: true,
      message: "Request body incomplete - email and password needed"
    })
    return
  }
  console.log(email);
  const queryUsers = req.db.select("*").from("users").where("email", "=", email);
  queryUsers.
  then((users) => {
    if(users.length > 0){
      res.status(201).json({error:true, message:"User Already Exists"});
      return;
    }
    else{
      const saltRounds = 10;
      const hash = bcrypt.hashSync(password,saltRounds);
      req.db.from("users").insert({email, hash}).then(() => res.status(201).json({message: "Success" })).catch(e => res.status(400).json({error: true, message: e}))
      return;
      }
    }
    )  
});

router.post("/login", function(req,res,next){
  const email = req.body.email;
  const password = req.body.password;

  if(!email || !password){
    res.status(400).json({
      error: true,
      message: "Request body incomplete - email and password needed"
    })
    return
  }
  const queryUsers = req.db.select("*").from("users").where("email", "=", email);
  queryUsers.then((users) => {
    if(users.length === 0){
      res.status(401).json({
        error: true,
        message: "User does not exist"
      }); return; 
    }
    else{
      const user = users[0];
      bcrypt.compare(password, user.hash).then((match)=> {
        if(!match){
          res.status(402).json({
            error: true,
            message: "Password is incorrect!"
          });
          return
        }
        else{
          const secretKey = "secret key";
          const expires_in = 60*60*24;
          const exp = Math.floor(Date.now()/1000) + expires_in;
          const token = jwt.sign({email, exp}, secretKey);

          res.status(201).json({
            token_type: "Bearer", token, expires_in
          });
          return;
        }
      })
    }
  })
  
});

module.exports = router;
