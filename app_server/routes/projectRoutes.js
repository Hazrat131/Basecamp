var express = require('express');
var projectController = require('../controllers/projectController');
var Router = express.Router();


Router.get('/', projectController.getHome);

module.exports = Router;
