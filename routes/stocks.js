const express = require('express');// Define requirements and middleware
const jwt = require('jsonwebtoken');
const router = express.Router();

const myLogger =function(req,res,next){// create logger
  console.log("LOGGED");
  next();
}
router.use(myLogger);


/*
ROUTE: stocks/symbols

Returns all stock symbols within the database.

returns status 200 = Data, 400 = Invalid query, 404 = Industry sector not found.
*/

router.get("/symbols", function(req,res, next) {
  for(const key in req.query){// Initial check for industry query.
    if(key !== "industry"){
      return res.status(400).json({"error": true, "message": "Invalid query parameter: only 'industry' is permitted"})
    }
  }
  let code = req.query.industry;
  let select = req.db.from('stocks').select("symbol", "name", "industry").groupBy('symbol');
  if(code){
    select = req.db.from('stocks').select("symbol", "name", "industry").where("industry",'=',code).groupBy('symbol')
  }
  select
  .then((rows) => {
    if(rows.length > 0){
      res.statusCode = 200;
      return res.status(200).json(rows);
    }
    else{
      return res.status(404).json({"error": true, "message": "Industry sector not found"});
    }
  })
  .catch((err) => {
  console.log(err);
  })
 });

/*
ROUTE: stocks/symbols

Returns the latest timestamp assosiated with a stock symbol.

returns status: 200 = Data, 400 = Invalid query, 404 = No entry for symbol.
*/

router.get("/:symbol",function(req,res,next) {
  for(const key in req.query){//Check if from and to queries are in path.
    if(key === "from" || key === "to"){
      return res.status(400).json({"error": true, "message": "Date parameters only available on authenticated route /stocks/authed"})
    }
  }
  for(const key in req.params.symbol){// check if the symbol param is uppercase
    const i = req.params.symbol[key]; 
    if(i == i.toLowerCase() || i != i.toUpperCase() || key > 4){
      return res.status(400).json({"error": true, "message": "Stock symbol incorrect format - must be 1-5 capital letters"})
    }
  }
  let select = req.db.from('stocks').select('*').where('symbol','=',req.params.symbol).groupBy('symbol');
   select
   .then((rows) => {
     if(rows.length > 0){
       let choice = rows[0];// take element out of array.
       return res.status(200).json(choice);
     }
     else{
       res.status(404).json({"error": true, "message": "No entry for symbol in stocks database"})
     }
   })
   .catch((err) => {
   console.log(err);
   res.json({"Error" : true, "message" : "Error executing MySQL query"})
   })
}); 


/*
authorize function

Read header and ensure that a bearer JWT token is inputted to grant access to authenticated stocks.

returns status: 403 = Missing header, invalid signature.
*/

const authorize = (req, res, next) => {
  const authorization = req.headers.authorization;
  let token = null;
  if(authorization && authorization.split(" ").length === 2){
    token = authorization.split(" ")[1];
    console.log("Token: ", token)
  }
    else{
      res.status(403).json(
        { 
          error: "true",
          message: `Authorization header not found` });
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
      console.log("Token is not valid: ");
      res.status(403).json(
        { 
          error: "true",
          message: `invalid signature` });
    }
}

/*
ROUTE: stocks/authed/:symbol

Display authenticated stocks data

returns status: 200 = success, 400 = incorrect paramters, 404 = not within database
*/

router.get('/authed/:symbol', authorize, (req, res) => {
  const from = req.query.from;
  const to = req.query.to;

  for(const key in req.query){//Check if from and to queries are in path.
    if(key !== "from"){
      if(key !== "to"){
        return res.status(400).json({"error": true, "message": "Parameters allowed are from and to, example: /stocks/authed/AAL?from=2020-03-15"})
      }
    }
    else if(key !== "to"){
      if(key !== "from"){
        return res.status(400).json({"error": true, "message": "Parameters allowed are from and to, example: /stocks/authed/AAL?from=2020-03-15"})
      }
    }
  }

  for(const key in req.params.symbol){// check if the symbol param is uppercase
    const i = req.params.symbol[key]; 
    if(i == i.toLowerCase() || i != i.toUpperCase() || key > 4){
      return res.status(400).json({"error": true, "message": "Stock symbol incorrect format - must be 1-5 capital letters"})
    }
  }

  if(!from && !to){
    let select = req.db.from('stocks').select('*').where('symbol','=',req.params.symbol).groupBy('symbol');
    select
   .then((rows) => {
     if(rows.length > 0){
       let choice = rows[0];// take element out of array.
       return res.status(200).json(choice);
     }
     else{
       return res.status(404).json({"error": true, "message": "No entry for symbol in stocks database"});
     }
   })
   .catch((err) => {
   console.log(err);
   res.json({"Error" : true, "message" : "Error executing MySQL query"})
   return;
   });
}

else{
  let select = req.db.from('stocks').select('*').where('symbol','=',req.params.symbol)
  try{
    let fromD=""; let toD="";
    if(from){
      fromD  = new Date(from)//Validate date string
      if(fromD.getUTCHours() >= 14){
        fromD.setDate(fromD.getDate()+1);
      }
    }
    if(to){ toD = new Date(to);}
    if(toD !== "" && fromD !== ""){select = select.whereBetween("timestamp", [fromD, toD]);}//If both exists
    else if(from)
    {// Return if from only exists
      select = select.where('timestamp', '>=', fromD)
    }//if toD exists
    else{select = select.whereBetween("timestamp", [fromD, toD]);}
  }
  catch(e)
  {//catch date parsing error
    res.status(400).json({"error": true, "message": "From date cannot be parsed by Date.parse()"});
    console.log(e);
    return;
  }
    select
    .then((rows) => {
      if(rows.length > 0){//if exists
        return res.status(200).json(rows);
      }
      else{//If no rows exist
        res.status(404).json({"error": true, "message": "No entry for symbol in stocks database"})
      }
    })
    .catch((err) => {
    console.log(err);
    res.json({"Error" : true, "message" : "Error executing MySQL query"})
    });
}
});
  
//Catch any other routes and return error.
router.get('*', function(req,res){
  res.status(404).json({error : true, "message" : "Not found"})
});

module.exports = router;
