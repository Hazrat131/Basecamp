var express = require('express');
var sessionController = require('../controllers/sessionController')
var Router = express.Router();

Router.get('/login', sessionController.loginGetOne);
Router.post('/login', sessionController.loginPostOne);
Router.get('/logout', sessionController.logOut);
module.exports = Router;