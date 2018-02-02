var mysql = require('mysql');
var config = {
    host:'localhost',
    user:'root',
    password:'',
    database:'information',
    port:3306//端口默认3306
};

module.exports = {
    getConn:function(){
        var conn = mysql.createConnection(config);
        conn.connect(function(err){
            if(!err){
                console.log('连接成功');
            }
        });
        return conn;
    }
};