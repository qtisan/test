/**
 * @module ip
 * @author qx
 * @date 2015/9/4
 * @function 功能说明
 */
var router = require('express' ).Router();
var v6 = require('ip-address').v6;


router.get('/', function(req, res){

	var address = new v6.Address(req.ip);
	res.json({
		ip: req.ip,
		valid: address.isValid(),
		teredo: address.teredo(),
		address: address
	});

});

module.exports = router;