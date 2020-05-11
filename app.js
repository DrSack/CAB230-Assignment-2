const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const swaggerUI = require('swagger-ui-express');
const swaggerDocument = require('./docs/swagger.json');
require("dotenv").config();

const helmet = require('helmet');
const cors = require('cors');

const stocksRouter = require('./routes/stocks');
const userRouter = require('./routes/user');
const options = require('./knexfile.js');
const knex = require('knex')(options);


const fs = require('fs');
//const https = require('https');
const http = require('http');
const privateKey = fs.readFileSync('./sslcert/cert.key','utf8');
const certificate = fs.readFileSync('./sslcert/cert.pem','utf8');
const credentials = {
 key: privateKey,
 cert: certificate
};

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(logger('common'));
app.use(helmet());
app.use(cors());

app.use((req, res, next) => {
  req.db = knex;
  next();
 })

app.use('/stocks', stocksRouter);
app.use('/user', userRouter);
app.use('/',swaggerUI.serve);
app.get('/',swaggerUI.setup(swaggerDocument));

// catch unused routes and display error
app.use(function(req, res, next) {
  res.json({error : true, "message" : "Not found"})
});

module.exports = app;
