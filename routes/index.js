var express = require('express');
var router = express.Router();
var db = require('../mysql/db').getConn();
var crypto = require('crypto');

var key = 'Password!';

//aes192加密
function aesEncrypt(password) {
    const cipher = crypto.createCipher('aes192', key);
    var crypted = cipher.update(password, 'utf8', 'hex');
    crypted += cipher.final('hex');
    return crypted;
}

//aes192解密
function aesDecrypt(password) {
    const decipher = crypto.createDecipher('aes192', key);
    var decrypted = decipher.update(password, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}


/* GET home page. */
//登陆账号
router.post('/account', function(req, res, next) {
    let conn = "select id,power,name from user where phone = '"+req.body.phone+"'";
    db.query(conn,function(err,response){
        if(err){
            next(err,req,res);
            return;
        }
        if(response.length==0){
            res.send({
                code:10001,
                data:'不存在的账号!',
            })
        }else{
            if(req.body.password=='123456'){
                var cryptedPassword='123456';
            }else{
                var cryptedPassword = aesEncrypt(req.body.password);
            }
            let conn = "select * from user where phone = '"+req.body.phone+"' and password = '"+cryptedPassword+"'";
            db.query(conn,function(er,resl){
                if(er){
                    next(err,req,res);
                    return;
                }
                if(resl.length==0){
                    res.send({
                        code:10002,
                        data:'登录密码错误,如有忘记请联系管理员!',
                    })
                }else{
                    res.send({
                        code:10000,
                        data:response[0],
                    })
                }
            })
        }
    })
});

//查看成员信息
router.get('/user', function(req, res, next) {
    let size = 15;
    let fromIndex = (req.query.page-1) * size;
    let  conn = "select u.id,u.name,u.phone,u.qq,u.email,u.origin,u.sex,u.textarea,u.birthday,u.status,u.entry,u.address,e.name education from user u left join education e on(u.education=e.id) where u.name like '%"+req.query.name+"%' and u.phone like '%"+req.query.phone+"%' and u.status like '%"+req.query.status+"%' and u.sex like '%"+req.query.sex+"%' and u.department like '%"+req.query.depart+"%' LIMIT "+fromIndex+","+size+"";
    db.query(conn,function(err,response){
        if(err){
            next(err,req,res);
            return;
        }
        let conn = "select COUNT(*) AS num_count from user where name like '%"+req.query.name+"%' and phone like '%"+req.query.phone+"%' and status like '%"+req.query.status+"%' and sex like '%"+req.query.sex+"%' and department like '%"+req.query.depart+"%'";
        db.query(conn,function(err,resl){
            res.send({
                code:10000,
                data:response,
                total:resl[0].num_count
            })
        })
    })
});
//修改登录状态
router.put('/userStatus', function(req, res, next) {
    let conn = `UPDATE user SET status=? WHERE id = ?`;
    db.query(conn,[req.body.status,req.body.id],function(err,response){
        if(err){
            next(err,req,res);
            return;
        }
        res.send({
            code:10000,
            data:'ok'
        })
    })
});
//重置密码
router.post('/passreset', function(req, res, next) {
    let conn = `UPDATE user SET password=123456 WHERE id = ?`;
    db.query(conn,req.body.id,function(err,response){
        if(err){
            next(err,req,res);
            return;
        }
        res.send({
            code:10000,
            data:'ok'
        })
    })
});
//删除该用户
router.delete('/deleteuser', function(req, res, next) {
    let conn = `DELETE FROM user WHERE id = ?`;
    db.query(conn,req.query.id,function(err,response){
        if(err){
            next(err,req,res);
            return;
        }
        res.send({
            code:10000,
            data:'ok'
        })
    })
});
//查看单人成员信息
router.get('/userphone', function(req, res, next) {
    let conn = "select * from user where id = '"+req.query.id+"'";
    db.query(conn,function(err,response){
        if(err){
            next(err,req,res);
            return;
        }
        if(response.length==0){
            res.send({
                code:9999,
                data:'登录失效,请重新登录!',
            })
        }else{
            res.send({
                code:10000,
                data:response[0],
            })
        }
    })
});
//添加成员信息
router.post('/user', function(req, res, next) {
    let conn = "select * from user where phone = '"+req.body.phone+"'";
    db.query(conn,function(err,resl){
        if(resl.length>0){
            res.send({
                code:10002,
                data:'已存在手机号,请更换!'
            })
        }else{
            let conn = `INSERT INTO user SET ?`;
            db.query(conn,req.body,function(err,response){
                if(err){
                    next(err,req,res);
                    return;
                }
                res.send({
                    code:10000,
                    data:'ok'
                })
            })
        }
    })
});
//修改成员信息
router.put('/user', function(req, res, next) {
    let conn = "select * from user where phone = '"+req.body.phone+"' and id <>'"+req.body.id+"'";
    db.query(conn,function(err,resl){
        if(resl.length>0){
            res.send({
                code:10002,
                data:'已存在手机号,请更换!'
            })
        }else{
            let conn = `UPDATE user SET ? WHERE id = ?`;
            db.query(conn,[req.body,req.body.id],function(err,response){
                if(err){
                    next(err,req,res);
                    return;
                }
                res.send({
                    code:10000,
                    data:'ok'
                })
            })
        }
    })
});
//修改个人密码
router.put('/pass', function(req, res, next) {
    let conn = "select password from user where id = '"+req.body.id+"'";
    db.query(conn,function(err,response){
        if(err){
            next(err,req,res);
            return;
        }
        if(response[0].password=='123456'){
            var cryptedPassword='123456';
        }else{
            var cryptedPassword = aesDecrypt(response[0].password);
        }
        if(req.body.oriPassword!=cryptedPassword){
            res.send({
                code:10003,
                data:'原始密码错误!'
            })
        }else{
            let cryptedPassword = aesEncrypt(req.body.newPassword);
            let conn = "UPDATE user SET password = '"+cryptedPassword+"' where id = '"+req.body.id+"'";
            db.query(conn,function(err,resl){
                if(err){
                    next(err,req,res);
                    return;
                }
                res.send({
                    code:10000,
                    data:'修改密码成功!'
                })
            })
        }
    })
});

//个人上班打卡
router.post('/check', function(req, res, next) {
    let conn = "INSERT INTO check1 SET ?";
    db.query(conn,req.body,function(err,response){
        if(err){
            next(err,req,res);
            return;
        }
        res.send({
            code:10000,
            data:'ok'
        })
    })
});
//今日打卡查询
router.get('/check', function(req, res, next) {
    if(req.query.name==null){
        req.query.name='';
    }
    if(req.query.page==null){
        req.query.page=1;
    }
    let size = 15;
    let fromIndex = (req.query.page-1) * size;
    let conn = "select c.name,c.date,c.status,u.phone,d.name dname from check1 c left join user u on(c.uid=u.id) left join department d on(u.department=d.id) where c.date like '%"+req.query.date+"%' and c.name like '%"+req.query.name+"%' LIMIT "+fromIndex+","+size+"";
    db.query(conn,function(err,response){
        if(err){
            next(err,req,res);
            return;
        }
        if(response.length==0){
            res.send({
                code:10001,
                data:'暂无记录!',
            })
        }else{
            let conn = "select COUNT(*) AS num_count from check1 where date like '%"+req.query.date+"%' and name like '%"+req.query.name+"%' LIMIT "+fromIndex+","+size+"";
            db.query(conn,function(err,resl){
                res.send({
                    code:10000,
                    data:response,
                    total:resl[0].num_count
                })
            })
        }
    })
});
//今日打卡个人查询
router.get('/checkuser', function(req, res, next) {
    let conn = "select c.uid,c.name,c.date,c.status from check1 c where date like '%"+req.query.date+"%' and uid = '"+req.query.uid+"'";
    db.query(conn,function(err,response){
        if(err){
            next(err,req,res);
            return;
        }
        if(response.length==0){
            res.send({
                code:10001,
                data:'暂无记录',
            })
        }else{
            res.send({
                code:10000,
                data:response,
            })
        }
    })
});
//请假单查询
router.get('/holiday', function(req, res, next) {
    let conn = "select h.id,h.phone,h.name,h.timebegin,h.timeover,h.reason,h.status,h.callback,t.name tname from holiday h left join type t ON(h.type = t.id) where h.uid = '"+req.query.uid+"' ";
    db.query(conn,function(err,response){
        if(err){
            next(err,req,res);
            return;
        }
        if(response.length==0){
            res.send({
                code:10001,
                data:'暂无记录!',
            })
        }else{
            res.send({
                code:10000,
                data:response,
            })
        }
    })
});
//请假条添加
router.post('/holiday', function(req, res, next) {
    let conn = "INSERT INTO holiday SET ?";
    db.query(conn,req.body,function(err,response){
        if(err){
            next(err,req,res);
            return;
        }
        res.send({
            code:10000,
            data:'ok'
        })
    })
});
//删除请假条
router.delete('/deleteholiday', function(req, res, next) {
    let conn = `DELETE FROM holiday WHERE id = ?`;
    db.query(conn,req.query.id,function(err,response){
        if(err){
            next(err,req,res);
            return;
        }
        res.send({
            code:10000,
            data:'ok'
        })
    })
});
//月打卡统计查询
router.get('/checkmonth', function(req, res, next) {
    let conn = "SELECT uid,name,COUNT(*) AS count FROM check1 WHERE DATE LIKE '%"+req.query.date+"%' and name LIKE '%"+req.query.name+"%' GROUP BY uid,name";
    db.query(conn,function(err,response){
        if(err){
            next(err,req,res);
            return;
        }
        if(response.length==0){
            res.send({
                code:10001,
                data:null,
            })
        }else{
            let conn = "SELECT uid,name,COUNT(*) AS count FROM check1 WHERE DATE LIKE '%"+req.query.date+"%' and name LIKE '%"+req.query.name+"%' and status=1 GROUP BY uid,name";
            db.query(conn,req.query.id,function(err,respon){
                res.send({
                    code:10000,
                    data:response,
                    resl:respon
                })
            })
        }
    })
});
//考勤统计 查询各部门及各部门请假人数
router.get('/attdentype', function(req, res, next) {
    let conn = "SELECT d.name,h.`department`,COUNT(*) AS count FROM holiday h LEFT JOIN department d ON(d.id=h.department) where h.timebegin like '%"+req.query.date+"%' and h.status=1 GROUP BY NAME";
    db.query(conn,function(err,response){
        if(err){
            next(err,req,res);
            return;
        }
        let conn = "select name from department";
        db.query(conn,function(err,resl){
            if(response.length==0){
                res.send({
                    code:10001,
                    data:[],
                    total:resl
                })
            }else{
                res.send({
                    code:10000,
                    data:response,
                    total:resl
                })
            }
        })
    })
});
//考勤统计 查询各部门及各部门打卡情况
router.get('/checktype', function(req, res, next) {
    let conn = "SELECT d.name,u.`department`,COUNT(*) AS count FROM check1 c LEFT JOIN user u ON(c.uid=u.id) LEFT JOIN department d ON(u.department=d.id) where date like '%"+req.query.date+"%' GROUP BY name";
    db.query(conn,function(err,response){
        if(err){
            next(err,req,res);
            return;
        }
        let conn = "select name from department";
        db.query(conn,function(err,resl){
            if(response.length==0){
                res.send({
                    code:10001,
                    data:[],
                    total:resl
                })
            }else{
                res.send({
                    code:10000,
                    data:response,
                    total:resl
                })
            }
        })
    })
});
//考勤统计 正常打卡与迟到打卡
router.get('/checktf', function(req, res, next) {
    let conn = "SELECT status,COUNT(*) AS count FROM check1 WHERE DATE LIKE '%"+req.query.date+"%' GROUP BY status";
    db.query(conn,function(err,response){
        if(err){
            next(err,req,res);
            return;
        }
        if(response.length==0){
            res.send({
                code:10001,
                data:[],
            })
        }else{
            res.send({
                code:10000,
                data:response,
            })
        }
    })
});
//考勤统计 查询各部门及各部门打卡情况
router.get('/departcheck', function(req, res, next) {
    let conn = "SELECT d.`name`,COUNT(*) AS count FROM check1 c LEFT JOIN USER u ON(c.`uid`=u.`id`) LEFT JOIN department d ON(u.`department`=d.`id`) WHERE c.`date` LIKE '%"+req.query.date+"%' AND c.`status`=0 GROUP BY d.`name` "
    db.query(conn,function(err,response){
        if(err){
            next(err,req,res);
            return;
        }
        let conn = "select name from department";
        db.query(conn,function(err,resl){
            if(response.length==0){
                res.send({
                    code:10001,
                    data:[],
                    total:resl
                })
            }else{
                res.send({
                    code:10000,
                    data:response,
                    total:resl
                })
            }
        })
    })
});


//当月绩效
router.get('/achievements', function(req, res, next) {
    let conn = "SELECT c.uid,c.name,u.price,u.attendance,COUNT(*) AS count FROM check1 c LEFT JOIN user u ON(c.uid=u.id) WHERE c.date LIKE '%"+req.query.date+"%' and c.name LIKE '%"+req.query.name+"%' GROUP BY uid";
    db.query(conn,function(err,response){
        if(err){
            next(err,req,res);
            return;
        }
        let conn = "SELECT uid,name,COUNT(*) AS count FROM holiday WHERE timebegin LIKE '%"+req.query.date+"%' and name LIKE '%"+req.query.name+"%' and status=1 GROUP BY uid,name";
        db.query(conn,function(err,holiday){
            if(response.length==0){
                res.send({
                    code:10001,
                    data:null,
                })
            }else{
                let conn = "SELECT uid,name,COUNT(*) AS count FROM check1 WHERE DATE LIKE '%"+req.query.date+"%' and name LIKE '%"+req.query.name+"%' and status=1 GROUP BY uid,name";
                db.query(conn,function(err,respon){
                    res.send({
                        code:10000,
                        data:response,
                        resl:respon,
                        holiday
                    })
                })
            }
        })
    })
});

//工作提醒
//工作提醒-合同和生日
router.get('/workbirthday', function(req, res, next) {
    let conn = "select id,phone,name,entry,birthday FROM user ";
    db.query(conn,function(err,response){
        if(err){
            next(err,req,res);
            return;
        }
        if(response.length==0){
            res.send({
                code:10001,
                data:null,
            })
        }else{
            res.send({
                code:10000,
                data:response,
            })
        }
    })
});
router.get('/workbirthday1', function(req, res, next) {
    let conn = "select id,phone,name,entry,birthday FROM user WHERE birthday LIKE '%_____"+req.query.birthday+"_%'";
    db.query(conn,function(err,response){
        if(err){
            next(err,req,res);
            return;
        }
        if(response.length==0){
            res.send({
                code:10001,
                data:null,
            })
        }else{
            res.send({
                code:10000,
                data:response,
            })
        }
    })
});
router.get('/workbirthdayid', function(req, res, next) {
    let conn = "select id,phone,name,entry,birthday FROM user where id = '"+req.query.id+"'";
    db.query(conn,function(err,response){
        if(err){
            next(err,req,res);
            return;
        }
        if(response.length==0){
            res.send({
                code:10001,
                data:null,
            })
        }else{
            res.send({
                code:10000,
                data:response[0],
            })
        }
    })
});
//工作提醒 请假单查询
//请假单查询
router.get('/batch', function(req, res, next) {
    let size = 15;
    let fromIndex = (req.query.page-1) * size;
    let conn = "SELECT h.id,h.uid,h.status,h.`reason`,h.phone,h.name,h.`timebegin`,h.`timeover`,t.`name` tname,d.`name` dname FROM holiday h LEFT JOIN user u ON(h.`uid`=u.`id`) LEFT JOIN type t ON(h.`type`=t.`id`) LEFT JOIN department d ON(u.`department`=d.`id`) WHERE h.`name` LIKE '%"+req.query.name+"%' and h.`department` LIKE '%"+req.query.department+"%' and h.`timebegin` LIKE '%"+req.query.date+"%' and h.`status` LIKE '%"+req.query.status+"%' LIMIT "+fromIndex+","+size+"";
    db.query(conn,function(err,response){
        if(err){
            next(err,req,res);
            return;
        }
        let conn = "SELECT  COUNT(*) AS num_count FROM holiday h LEFT JOIN user u ON(h.`uid`=u.`id`) LEFT JOIN type t ON(h.`type`=t.`id`) LEFT JOIN department d ON(u.`department`=d.`id`) WHERE h.`name` LIKE '%"+req.query.name+"%' and h.`department` LIKE '%"+req.query.department+"%' and h.`timebegin` LIKE '%"+req.query.date+"%' and h.`status` LIKE '%"+req.query.status+"%' LIMIT "+fromIndex+","+size+"";
        db.query(conn,function(err,resl){
            res.send({
                code:10000,
                data:response,
                total:resl[0].num_count
            })
        })
    })
});
//请假单批准
router.put('/batchholiday', function(req, res, next) {
    if(req.body.callback==''){
        req.body.callback=null;
    }
    let conn = "UPDATE holiday SET status = '"+req.body.status+"',callback = '"+req.body.callback+"'  where id = '"+req.body.id+"'";
    db.query(conn,function(err,response){
        if(err){
            next(err,req,res);
            return;
        }

        res.send({
            code:10000,
            data:'审批成功!'
        })

    })
});

//薪资管理
//薪资管理-薪资查看
router.get('/price', function(req, res, next) {
    let size = 15;
    let fromIndex = (req.query.page-1) * size;
    let conn = "select id,phone,name,price,attendance FROM user where name like '%"+req.query.name+"%' LIMIT "+fromIndex+","+size+"";
    db.query(conn,function(err,response){
        if(err){
            next(err,req,res);
            return;
        }
        let conn =" select COUNT(*) AS num_count FROM user where name like '%"+req.query.name+"%'"
        db.query(conn,function(err,resl){
            res.send({
                code:10000,
                data:response,
                total:resl[0].num_count
            })
        })
    })
});
router.get('/priceid', function(req, res, next) {
    let conn = "select id,phone,name,price,attendance FROM user where id = '"+req.query.id+"'";
    db.query(conn,function(err,response){
        if(err){
            next(err,req,res);
            return;
        }
        res.send({
            code:10000,
            data:response[0],
        })
    })
});
//薪资管理--修改薪资
router.put('/price', function(req, res, next) {
    let conn = "UPDATE user SET price = '"+req.body.price+"',attendance = '"+req.body.attendance+"'  where id = '"+req.body.id+"'";
    db.query(conn,function(err,response){
        if(err){
            next(err,req,res);
            return;
        }
        res.send({
            code:10000,
            data:'修改成功!'
        })
    })
});

//岗位管理
//岗位管理 -部门查看
router.get('/depart', function(req, res, next) {
    let conn = "SELECT d.name,COUNT(*) AS count FROM user u LEFT JOIN department d ON(u.department=d.id) GROUP BY NAME";
    db.query(conn,function(err,response){
        if(err){
            next(err,req,res);
            return;
        }
        let conn = "select name from department";
        db.query(conn,function(err,resl){
            if(response.length==0){
                res.send({
                    code:10001,
                    data:[],
                    total:resl
                })
            }else{
                res.send({
                    code:10000,
                    data:response,
                    total:resl
                })
            }
        })
    })
});
//岗位管理 -部门添加
router.post('/depart', function(req, res, next) {
    let conn = "select * from department where name = '"+req.body.name+"'";
    db.query(conn,function(err,resl){
        if(resl.length>0){
            res.send({
                code:10002,
                data:'已存在部门,请更换!'
            })
        }else{
            let conn = `INSERT INTO department SET ?`;
            db.query(conn,req.body,function(err,response){
                if(err){
                    next(err,req,res);
                    return;
                }
                res.send({
                    code:10000,
                    data:'ok'
                })
            })
        }
    })
});
//岗位管理 -岗位查看
router.get('/post1', function(req, res, next) {
    let size = 15;
    let fromIndex = (req.query.page-1) * size;
    let conn = "SELECT p.`id`,p.`name` pname,p.`attendance`,d.`name` FROM post p LEFT JOIN department d ON(p.`dtid`=d.`id`) LIMIT "+fromIndex+","+size+"";
    db.query(conn,function(err,response){
        if(err){
            next(err,req,res);
            return;
        }
        let conn = "SELECT COUNT(*) AS num_count FROM post p LEFT JOIN department d ON(p.`dtid`=d.`id`)";
        db.query(conn,function(err,resl){
            res.send({
                code:10000,
                data:response,
                total:resl[0].num_count
            })
        })
    })
});
//岗位管理 -岗位添加
router.post('/post1', function(req, res, next) {
    let conn = "select * from post where name = '"+req.body.name+"'";
    db.query(conn,function(err,resl){
        if(resl.length>0){
            res.send({
                code:10002,
                data:'已存在岗位,请更换!'
            })
        }else{
            let conn = `INSERT INTO post SET ?`;
            db.query(conn,req.body,function(err,response){
                if(err){
                    next(err,req,res);
                    return;
                }
                res.send({
                    code:10000,
                    data:'ok'
                })
            })
        }
    })
});
//岗位管理 -全勤调整
router.put('/post1', function(req, res, next) {
    let conn = "UPDATE post SET attendance = '"+req.body.attendance+"' where id = '"+req.body.id+"'";
    db.query(conn,function(err,response){
        if(err){
            next(err,req,res);
            return;
        }
        res.send({
            code:10000,
            data:'修改成功!'
        })
    })
});

//信息交流
//信息交流 -查看留言
router.get('/message', function(req, res, next) {
    let size = 15;
    let fromIndex = (req.query.page-1) * size;
    let conn = "SELECT * FROM message WHERE uid = '"+req.query.uid+"' LIMIT "+fromIndex+","+size+"";
    db.query(conn,function(err,response){
        if(err){
            next(err,req,res);
            return;
        }
        let conn = "SELECT COUNT(*) AS num_count FROM message WHERE uid = '"+req.query.uid+"' LIMIT "+fromIndex+","+size+"";
        db.query(conn,function(err,resl){
            res.send({
                code:10000,
                data:response,
                total:resl[0].num_count
            })
        })
    })
});
router.get('/messageuser', function(req, res, next) {
    let conn = " SELECT id,phone,name FROM user WHERE department = '"+req.query.department+"' AND id <> '"+req.query.id+"'";
    db.query(conn,function(err,response){
        if(err){
            next(err,req,res);
            return;
        }
        res.send({
            code:10000,
            data:response,
        })
    })
});
//信息交流 -添加留言
router.post('/message', function(req, res, next) {
    let conn = `INSERT INTO message SET ?`;
    db.query(conn,req.body,function(err,response){
        if(err){
            next(err,req,res);
            return;
        }
        res.send({
            code:10000,
            data:'ok'
        })
    })
});
//信息交流 -修改状态
router.put('/message', function(req, res, next) {
    let conn = "UPDATE message SET status = 1  where id = '"+req.body.id+"'";
    db.query(conn,function(err,response){
        if(err){
            next(err,req,res);
            return;
        }
        res.send({
            code:10000,
            data:'阅读成功!'
        })

    })
});
//信息交流 -删除留言
router.delete('/message', function(req, res, next) {
    let conn = `DELETE FROM message WHERE id = ?`;
    db.query(conn,req.query.id,function(err,response){
        if(err){
            next(err,req,res);
            return;
        }
        res.send({
            code:10000,
            data:'ok'
        })
    })
});


//部门查询
router.get('/department', function(req, res, next) {
    let  conn = "select * from department";
    db.query(conn,function(err,response){
        if(err){
            next(err,req,res);
            return;
        }
        res.send({
            code:10000,
            data:response
        })
    })
});
//请假类型查询
router.get('/type', function(req, res, next) {
    let  conn = "select * from type";
    db.query(conn,function(err,response){
        if(err){
            next(err,req,res);
            return;
        }
        res.send({
            code:10000,
            data:response
        })
    })
});
//岗位查询
router.get('/post', function(req, res, next) {
    if(req.query.id==undefined){
        req.query.id='';
    }
    let conn = "select * from post where dtid = '"+req.query.id+"'";
    db.query(conn,function(err,response){
        if(err){
            next(err,req,res);
            return;
        }
        res.send({
            code:10000,
            data:response
        })
    })
});
//岗位信息查询
router.get('/postid', function(req, res, next) {
    if(req.query.id==undefined){
        req.query.id='';
    }
    let conn = "select * from post where id = '"+req.query.id+"'";
    db.query(conn,function(err,response){
        if(err){
            next(err,req,res);
            return;
        }
        res.send({
            code:10000,
            data:response
        })
    })
});
//查询查询用户哪个部门 用于请假
router.get('/userdepartment', function(req, res, next) {
    let conn = "select u.phone,u.department,d.name from user u left join department d ON(u.department = d.id) where u.id = '"+req.query.id+"' ";
    db.query(conn,function(err,response){
        if(err){
            next(err,req,res);
            return;
        }
        if(response.length==0){
            res.send({
                code:10001,
                data:'暂无记录!',
            })
        }else{
            res.send({
                code:10000,
                data:response[0],
            })
        }
    })
});
//权限查询
router.get('/power', function(req, res, next) {
    let conn = "select * from power ";
    db.query(conn,function(err,response){
        if(err){
            next(err,req,res);
            return;
        }
        res.send({
            code:10000,
            data:response
        })
    })
});
//学历查询
router.get('/education', function(req, res, next) {
    let conn = "select * from education ";
    db.query(conn,function(err,response){
        if(err){
            next(err,req,res);
            return;
        }
        res.send({
            code:10000,
            data:response
        })
    })
});
//未读留言查询
router.get('/message0', function(req, res, next) {
    let conn = "SELECT COUNT(*) AS num_count FROM message WHERE uid = '"+req.query.uid+"' and status = 0";
    db.query(conn,function(err,response){
        if(err){
            next(err,req,res);
            return;
        }
        res.send({
            code:10000,
            data:response[0].num_count,
        })
    })
});
module.exports = router;
