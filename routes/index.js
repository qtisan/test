var express = require('express');
var router = express.Router();

var mysql = require('mysql');
var mongoose = require('mongoose');
var EventProxy = require('eventproxy');
var _ = require('underscore');
var ip = require('./ip');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.use('/ip', ip);


var schema = new mongoose.Schema({
	name: String,
	code: String,
	cities: [
		{
			name: String,
			code: String,
			districts: [
				{
					name: String,
					code: String
				}
			]
		}
	]
});

var provinceModel = mongoose.model('province', schema);

router.get('/cities', function(req, res, next){
    
    var proxy = new EventProxy();
    
    var mongo = {
    	"hostname": "101.200.229.124",
    	"port": 56222,
    	"username": "cray",
    	"password": "cray201505",
    	"name": "",
    	"db": "CrayDB"
    };

    var generateMongoUrl = function (obj) {
    	obj.hostname = (obj.hostname || 'localhost');
    	obj.port = (obj.port || 27017);
    	obj.db = (obj.db || 'test');
    
    	if (obj.username && obj.password) {
    		return "mongodb://" + obj.username + ":" + obj.password + "@" + obj.hostname + ":" + obj.port + "/" + obj.db;
    	} else {
    		return "mongodb://" + obj.hostname + ":" + obj.port + "/" + obj.db;
    	}
    };

	proxy.after('finished', 33, function(dbs){
		dbs[0].connection.end();
		dbs[0].mongodb.close();
	});
    
    proxy.all('mongooseConnected', 'mysqlConnected', function(mongodb, connection){
        connection.query('SELECT * FROM nation ORDER BY code', function(err, rows, fields) {


	        //-----------------------------------------------
	        //------------ MAIN PROCESS START ---------------
	        var provs = [ ];
	        var prov = undefined, city = undefined;
	        _.each(rows, function( row ){
		        if ( row.province != '' ) {
			        prov = { };
			        prov.name = row.province;
			        prov.code = row.code;
			        if ( row.city != '' ) {
				        city = {
					        name: row.city,
					        code: row.code,
					        districts: [ ]
				        };
				        prov.cities = [ city ];
			        }
			        else {
				        prov.cities = [ ];
			        }
			        provs.push(prov);
		        }
		        else if ( row.city != '' ) {
			        city = {
				        name: row.city,
				        code: row.code,
				        districts: [ ]
			        };
			        prov.cities.push(city);
		        }
		        else {
			        city.districts.push({
				        name: row.district,
				        code: row.code
			        });
		        }
	        });
	        console.log(provs.length);
	        _.each(provs, function(p){
		        (new provinceModel(p)).save(function(err, _p){
			        err && console.log( err.message );
			        !err && console.log( _p.name + ' success!' );
		        });

	        });
	        //------------ MAIN PROCESS END ---------------
			//---------------------------------------------


        });

    });
    
    var connection = mysql.createConnection({
        host     : 'localhost',
        user     : 'root',
        password : 'toashintel',
        database : 'baidu88082data'
    });
    connection.connect(function(err) {
        if (err) {
            console.error('error connecting: ' + err.stack);
            return;
        }
        console.log('connected as id ' + connection.threadId);
        proxy.emit('mysqlConnected', connection);
    });
    var connected = false;
    mongoose.connect(generateMongoUrl(mongo), function(err){
    	if (err) {
    		console.log('connect to %s error: ', generateMongoUrl(mongo), err.message);
    		connected = false;
    	}
    	else {
    		console.log('connect to %s succeed!', generateMongoUrl(mongo));
    		connected = true;
    		var db = mongoose.connection;
    		db.on('error', function () {
    			console.log('connection error:');
    		});
    		db.once('open', function callback() {
    		});
            proxy.emit('mongooseConnected', db);
    	}
    });
    
    res.end();
    
});


module.exports = router;
