const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
var express = require('express');
var router = express.Router();

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
  const queryUsers = req.db.select("*").from("user").where("email", "=", email);
  queryUsers.
  then((users) => {
    if(users.length > 0){
      res.status(409).json({error:true, message:"User already exists!"});
      return;
    }
    else{
      const saltRounds = 10;
      const hash = bcrypt.hashSync(password,saltRounds);
      req.db.from("user").insert({email, hash}).then(() => res.status(201).json({success: true , message: "User created"})).catch(e => res.status(400).json({error: true, message: e}))
      return;
      }
    }
    )  
});

router.post("/login", function(req,res,next){
  const email = req.body.email;
  const password = req.body.password;

  if(!email || !password){
    res.status(401).json({
      error: true,
      message: "Request body incomplete - email and password needed"
    })
    return
  }
  const queryUsers = req.db.select("*").from("user").where("email", "=", email);
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
          res.status(401).json({
            error: true,
            message: "Incorrect password"
          });
          return
        }
        else{
          const secretKey = "secret key";
          const expires = 60*60*24;
          const exp = Math.floor(Date.now()/1000) + expires;
          const token = jwt.sign({email, exp}, secretKey);

          res.status(200).json({
            token, token_type: "Bearer",  expires
          });
          return;
        }
      })
    }
  })
  
});

module.exports = router;
