// Declare all middleware
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const swaggerUI = require('swagger-ui-express');
const yaml = require('yamljs');
const swaggerDocument = yaml.load("./docs/swagger.yaml")
require("dotenv").config();

const helmet = require('helmet');
const cors = require('cors');

//Declare routes and knex.
const stocksRouter = require('./routes/stocks');
const userRouter = require('./routes/user');
const options = require('./knexfile.js');
const knex = require('knex')(options);

// Provide https and self-signed certificate.
const fs = require('fs');
const https = require('https');
const privateKey = fs.readFileSync('./sslcert/cert.key','utf8');
const certificate = fs.readFileSync('./sslcert/cert.pem','utf8');
const credentials = {
 key: privateKey,
 cert: certificate
};

//declare app as express
const app = express();
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(logger('common'));
app.use(helmet());
app.use(cors());

// Connect to database
app.use((req, res, next) => {
  req.db = knex;
  next();
 })

 //Setup swagger
app.use('/stocks', stocksRouter);
app.use('/user', userRouter);
app.use('/',swaggerUI.serve);
app.get('/',swaggerUI.setup(swaggerDocument));


//Catch unused routes and display error
app.use(function(req, res, next) {
  res.status(404).json({error : true, "message" : "Not found"})
});

//Create https server and start listening based on port
const server = https.createServer(credentials,app);
server.listen(process.env.PORT);

module.exports = app;
