const {mySqlQury} = require('../middelwer/db');

let sendNotification = async (data) => {
  const tbl_master_shop_data = await mySqlQury(`SELECT * FROM tbl_master_shop`)
  
  let headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Authorization": "Basic " + tbl_master_shop_data[0].onesignal_api_key
    // "Authorization": "Basic " + tbl_master_shop_data[0].onesignal_api_key
  };
  
  let options = {
    host: "onesignal.com",
    port: 443,
    path: "/api/v1/notifications",
    method: "POST",
    headers: headers
  };
  
  let https = require('https');
  let req = https.request(options, function(res) {  
    res.on('data', function(data) {
      
    });
  });
  
  req.on('error', function(e) {
      console.log(e);
  });
  
  req.write(JSON.stringify(data));
  req.end();
};

module.exports = sendNotification