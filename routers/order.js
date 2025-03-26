const express = require('express');
const {mySqlQury} = require('../middelwer/db');
const router = express.Router();
const auth = require('../middelwer/auth')
const {upload} = require('../middelwer/multer')
const access = require('../middelwer/access')
const nodemailer = require('nodemailer');
let sendNotification = require("../middelwer/send");


async function idfororder ()
{
    const orderiddata = await mySqlQury(`SELECT id FROM tbl_order ORDER BY ID DESC LIMIT 1`)
    if(orderiddata.length > 0){
        var n = ++orderiddata[0].id
    }else{
        var n =1
    }
    

    if ( n< 10 )
    {
        return ( '#ORD000'+n.toString () );
    }
    else if ( n< 100 )
    {
        return ( '#ORD00'+n.toString () );
    }
    else if ( n< 1000 )
    {
        return ( '#ORD0'+n.toString () );
    }
    else
    {
        return ( '#ORD'+n);
    }
}

router.get('/list', auth, async (req, res)=>{
    try {
        const {id,roll,store,loginas} = req.user;
        const accessdata = await access (req.user)
        
        if(loginas == 0){  
           var login = 'customer'
           var orderlistqury = `SELECT  tbl_order.*, COALESCE(tbl_customer.name, "") as name ,COALESCE(tbl_customer.number, "") as number,
                COALESCE(tbl_store.name, "") as storeName, COALESCE(tbl_orderstatus.status, "") as orderStatus  
                FROM tbl_order 
                LEFT join tbl_orderstatus on tbl_order.order_status=tbl_orderstatus.id
                LEFT join tbl_customer on tbl_order.customer_id=tbl_customer.id 
                LEFT join tbl_store on tbl_order.store_id=tbl_store.id
                WHERE tbl_order.customer_id=${id} ORDER BY id DESC LIMIT 10`


        }else{
            const rolldetail = await mySqlQury("select id,roll,orders from tbl_roll where id = "+roll+"");
            if(rolldetail[0].roll === "master_Admin"){
                const multiy = await mySqlQury("SELECT type FROM tbl_master_shop");
                if(multiy[0].type == 1){

                    var login = 'master'
                    var orderlistqury = `SELECT  tbl_order.*, COALESCE(tbl_customer.name, "") as name ,COALESCE(tbl_customer.number, "") as number,
                                        COALESCE(tbl_store.name, "") as storeName, COALESCE(tbl_orderstatus.status, "") as orderStatus  
                                        FROM tbl_order 
                                        LEFT join tbl_orderstatus on tbl_order.order_status=tbl_orderstatus.id
                                        LEFT join tbl_customer on tbl_order.customer_id=tbl_customer.id 
                                        LEFT join tbl_store on tbl_order.store_id=tbl_store.id 
                                        ORDER BY id DESC LIMIT 10`


                }else{
                    var login = 'store'
                    var orderlistqury = `SELECT  tbl_order.*, COALESCE(tbl_customer.name, "") as name ,COALESCE(tbl_customer.number, "") as number,
                                        COALESCE(tbl_store.name, "") as storeName, COALESCE(tbl_orderstatus.status, "") as orderStatus   
                                        FROM tbl_order 
                                        LEFT join tbl_orderstatus on tbl_order.order_status=tbl_orderstatus.id
                                        LEFT join tbl_customer on tbl_order.customer_id=tbl_customer.id 
                                        LEFT join tbl_store on tbl_order.store_id=tbl_store.id
                                        WHERE tbl_order.store_id=1 ORDER BY id DESC LIMIT 10`



                }
                
            } else if( rolldetail[0].orders.includes('read')){
                var login = 'store'
                var orderlistqury = `SELECT  tbl_order.*, COALESCE(tbl_customer.name, "") as name ,COALESCE(tbl_customer.number, "") as number,
                                    COALESCE(tbl_store.name, "") as storeName, COALESCE(tbl_orderstatus.status, "") as orderStatus  
                                    FROM tbl_order 
                                    LEFT join tbl_orderstatus on tbl_order.order_status=tbl_orderstatus.id
                                    LEFT join tbl_customer on tbl_order.customer_id=tbl_customer.id 
                                    LEFT join tbl_store on tbl_order.store_id=tbl_store.id
                                    WHERE tbl_order.store_id=${store} ORDER BY id DESC LIMIT 10`

            }else{ 
                req.flash("error", "Your Are Not Authorized For this");
                return res.redirect('back')
            }
        }

        const orderlist = await mySqlQury(orderlistqury)

        const Ordersatus = await mySqlQury("SELECT * FROM tbl_orderstatus ");
     
        res.render('order',{login,Ordersatus,orderlist,accessdata, language:req.language_data, language_name:req.language_name})


    } catch (error) {
        console.log(error);
    }
})


router.post("/getmore", auth, async(req, res)=>{
    try {
        const {id,roll,store,loginas} = req.user;
        const {from} = req.body;
        const accessdata = await access (req.user)
        
        if(loginas == 0){  
           var login = 'customer'
           var orderlistqury = `SELECT  tbl_order.*, COALESCE(tbl_customer.name, "") as name ,COALESCE(tbl_customer.number, "") as number,
                COALESCE(tbl_store.name, "") as storeName, COALESCE(tbl_orderstatus.status, "") as orderStatus   
                FROM tbl_order 
                LEFT join tbl_orderstatus on tbl_order.order_status=tbl_orderstatus.id
                LEFT join tbl_customer on tbl_order.customer_id=tbl_customer.id 
                LEFT join tbl_store on tbl_order.store_id=tbl_store.id
                WHERE tbl_order.customer_id=${id} ORDER BY id DESC LIMIT 10 OFFSET ${from}`

        }else{
            const rolldetail = await mySqlQury("select id,roll,orders from tbl_roll where id = "+roll+"");
            if(rolldetail[0].roll === "master_Admin"){
                const multiy = await mySqlQury("SELECT type FROM tbl_master_shop");
                if(multiy[0].type == 1){

                    var login = 'master'
                    var orderlistqury = `SELECT  tbl_order.*, COALESCE(tbl_customer.name, "") as name ,COALESCE(tbl_customer.number, "") as number,
                                        COALESCE(tbl_store.name, "") as storeName, COALESCE(tbl_orderstatus.status, "") as orderStatus  
                                        FROM tbl_order 
                                        LEFT join tbl_orderstatus on tbl_order.order_status=tbl_orderstatus.id
                                        LEFT join tbl_customer on tbl_order.customer_id=tbl_customer.id 
                                        LEFT join tbl_store on tbl_order.store_id=tbl_store.id 
                                        ORDER BY id DESC LIMIT 10 OFFSET ${from}`

                }else{
                    var login = 'store'
                    var orderlistqury = `SELECT  tbl_order.*, COALESCE(tbl_customer.name, "") as name ,COALESCE(tbl_customer.number, "") as number,
                                        COALESCE(tbl_store.name, "") as storeName, COALESCE(tbl_orderstatus.status, "") as orderStatus
                                        FROM tbl_order
                                        LEFT join tbl_orderstatus on tbl_order.order_status=tbl_orderstatus.id
                                        LEFT join tbl_customer on tbl_order.customer_id=tbl_customer.id 
                                        LEFT join tbl_store on tbl_order.store_id=tbl_store.id
                                        WHERE tbl_order.store_id=1 ORDER BY id DESC LIMIT 10 OFFSET ${from}`

                }
                
            } else if( rolldetail[0].orders.includes('read')){
                var login = 'store'
                var orderlistqury = `SELECT  tbl_order.*, COALESCE(tbl_customer.name, "") as name ,COALESCE(tbl_customer.number, "") as number,
                                        COALESCE(tbl_store.name, "") as storeName, COALESCE(tbl_orderstatus.status, "") as orderStatus   
                                        FROM tbl_order
                                        join tbl_orderstatus on tbl_order.order_status=tbl_orderstatus.id
                                        join tbl_customer on tbl_order.customer_id=tbl_customer.id 
                                        join tbl_store on tbl_order.store_id=tbl_store.id
                                        WHERE tbl_order.store_id=${store} ORDER BY id DESC LIMIT 10 OFFSET ${from}`

            }else{ 
                req.flash("error", "Your Are Not Authorized For this");
                return res.redirect('back')
            }
        } 

        const orderlists = await mySqlQury(orderlistqury)

        return res.send({ orderlists, accessdata, login })
    } catch (error) {
        console.log(error);
    }
})



router.get('/view/:id', auth, async(req, res)=>{
    try {
        const {id,roll,store,loginas} = req.user;
        const orderid = req.params.id;
        
        const order = await mySqlQury("SELECT tbl_order.*,tbl_orderstatus.status as status FROM tbl_order join tbl_orderstatus on tbl_order.order_status=tbl_orderstatus.id WHERE tbl_order.id="+orderid+"");

        var splite_id = order[0].order_id.split(/[A-Z-a-z]/).join("");

        const storedata = await mySqlQury("SELECT * FROM tbl_store WHERE id="+order[0].store_id+"");
        const Ordersatus = await mySqlQury("SELECT * FROM tbl_orderstatus");
        const orderServiceList = await mySqlQury("SELECT * from tbl_cart_servicelist WHERE find_in_set(tbl_cart_servicelist.id,'"+order[0].service_list+"')");
        const addonlist = await mySqlQury("SELECT * from tbl_addons WHERE find_in_set(tbl_addons.id,'"+order[0].addon_data+"')")
        const payments = await mySqlQury("SELECT tbl_order_payment.*,tbl_account.ac_name FROM tbl_order_payment join tbl_account on tbl_order_payment.payment_account=tbl_account.id WHERE find_in_set(tbl_order_payment.id,'"+order[0].payment_data+"')")
        const customer = await mySqlQury("SELECT * FROM tbl_customer WHERE id="+order[0].customer_id+"");
        const account = await mySqlQury("SELECT * FROM tbl_account WHERE store_ID="+order[0].store_id+"")

        const accessdata = await access (req.user)
        res.render('order_details',{order:order[0],Ordersatus,orderServiceList,addonlist,payments,customer:customer[0],storedata:storedata[0],account,accessdata, language:req.language_data, language_name:req.language_name, splite_id})
    } catch (error) {
        console.log(error);
    }
})

router.get('/changestatus/:id', auth, async(req, res)=>{
    try {
        console.log(req.params.id);
        const {id,roll,store,loginas} = req.user;
        const accessdata = await access (req.user)
        if(loginas == 0){
            return res.status(208).json({status:"error", messge:"your not authorized for this"})
        }
        const rolldetail = await mySqlQury("select id,roll,orders from tbl_roll where id = "+roll+"");
        if(rolldetail[0].roll === "master_Admin" || rolldetail[0].orders.includes('edit')){

            const orderid = req.params.id.split(',')[1]
            const statusid = req.params.id.split(',')[0]

            await mySqlQury(`UPDATE tbl_order SET order_status=${statusid},stutus_change_date=CURRENT_TIMESTAMP WHERE id=${orderid}`)
            const storedata = await mySqlQury(`SELECT tbl_order.order_id,tbl_order.store_id,tbl_orderstatus.status,tbl_store.name,
            tbl_store.mobile_number,tbl_store.store_email,tbl_store.city FROM tbl_order join tbl_orderstatus on 
            tbl_order.order_status=tbl_orderstatus.id join tbl_store on tbl_order.store_id=tbl_store.id WHERE tbl_order.id=${orderid}`)
            console.log(111, storedata);
            var data = await mySqlQury("SELECT * FROM tbl_email WHERE store_id="+storedata[0].store_id+"");
            console.log(2222, orderid);

            const order_date = await mySqlQury(`SELECT * FROM tbl_order WHERE id = '${orderid}'`)
            const customer_data = await mySqlQury(`SELECT * FROM tbl_customer WHERE id = '${order_date[0].customer_id}'`)
            console.log(1111,'customer_data', customer_data);

            if(data.length > 0){
                if(data[0].status == 1){

                    if (data[0].host && data[0].port && data[0].username && data[0].password && data[0].frommail) {
                        
                        const transporter = nodemailer.createTransport({
                            host: data[0].host,
                            port: Number(data[0].port),
                            service: 'gmail',
                            auth: {
                                user:  data[0].username,
                                pass: data[0].password
                            }
                        });
                        let mailDetails = {
                            from: data[0].frommail,
                            // to: 'vivekchovatiya1179@gmail.com',
                            to: customer_data[0].email,
                            subject: 'Email From '+storedata[0].name,
                            html: '<!DOCTYPE html>'+
                                '<html><head><title></title>'+
                                '</head><body><div>'+
                                '<h5>Greeting From '+storedata[0].name+'</h5>'+
                                '<h4> Your Order '+storedata[0].order_id+' status has been change to <b>'+storedata[0].status+'</b> </h4>'+
                                '<p>Thank For Order to us</p>'+
                                '</div><div style="display: list-item;">'+
                                '<p>Best from :</p>'+
                                '<span style="margin-bottom:0">'+storedata[0].mobile_number+'</span><br>'+
                                '<span style="margin-bottom:0">'+storedata[0].store_email+'</span><br>'+
                                '<span style="margin-bottom:0">'+storedata[0].city+'</span><br>'+
                                '</div></body></html>'
                        };
                        
                        transporter.sendMail(mailDetails, function(err, data) {
                            if(err) {
                                console.log(err);
                                console.log('Error Occurs');
                                req.flash("error", "Message not occurred!");
                            } else {
                                console.log('Email sent successfully');
                                req.flash("success", "Email Send Successful");
                            }
                        });
                    }
                }
            }


            
            let date = new Date()
            let day = (date.getDate() < 10 ? '0' : '') + date.getDate()
            let month = ((date.getMonth()+1) < 10 ? '0' : '') + (date.getMonth()+1)
            let year = date.getFullYear()
            let fullDate = `${year}-${month}-${day}`

            await mySqlQury(`INSERT INTO tbl_notification (invoice, date, sender, received, notification) VALUE ('${storedata[0].order_id}', '${fullDate}', '${accessdata.topbardata.id}', '${storedata[0].store_id}', 'The order status has been updated, please check it.')`)
            await mySqlQury(`INSERT INTO tbl_notification (invoice, date, sender, received, notification) VALUE ('${storedata[0].order_id}', '${fullDate}', '${accessdata.topbardata.id}', '${order_date[0].customer_id}', 'The order status has been updated, please check it.')`)
            await mySqlQury(`INSERT INTO tbl_notification (invoice, date, sender, received, notification) VALUE ('${storedata[0].order_id}', '${fullDate}', '${accessdata.topbardata.id}', '1', 'The order status has been updated, please check it.')`)

            if (customer_data[0].name != 'Walk in customer') {
                // ========= sms ============ //

                let ACCOUNT_SID = accessdata.masterstore.twilio_sid
                let AUTH_TOKEN = accessdata.masterstore.twilio_auth_token

                if (ACCOUNT_SID && AUTH_TOKEN) {
                    const client_sms = require('twilio')(ACCOUNT_SID, AUTH_TOKEN);
                    
                    client_sms.messages
                    .create({
                        body: `We have successfully change your order status.`,
                        from: accessdata.masterstore.twilio_phone_no,
                        to: customer_data[0].number
                    })
                    .then(message => console.log(message.sid))
                    .catch((e) => {
                        req.flash("error", "Message not occurred!");
                    })
                }
            }

            if (accessdata.masterstore.onesignal_app_id) {
                
                let message = {
                    app_id: accessdata.masterstore.onesignal_app_id,
                    contents: {"en": "The order status has been updated, please check it."},
                    headings: {"en": 'laundry'},
                    included_segments: ["Subscribed Users"],
                    filters: [
                        {"field": "tag", "key": "subscription_user_Type", "relation": "=", "value": 'master'},
                        {"operator": "AND"}, {"field": "tag", "key": "Login_ID", "relation": "=", "value": '1'}
                    ]
                }
                sendNotification(message);
    
                let store_message = {
                    app_id: accessdata.masterstore.onesignal_app_id,
                    contents: {"en": "The order status has been updated, please check it."},
                    headings: {"en": 'laundry'},
                    included_segments: ["Subscribed Users"],
                    filters: [
                        {"field": "tag", "key": "subscription_user_Type", "relation": "=", "value": accessdata.logas},
                        {"operator": "AND"}, {"field": "tag", "key": "Login_ID", "relation": "=", "value": accessdata.topbardata.id}
                    ]
                }
                sendNotification(store_message);
            }

            res.status(208).json({status:"success", messge:"Order status changed"})

        }else{
            return res.status(208).json({status:"error", messge:"your not authorized for this"})
        }

        
    } catch (error) {
        console.log(11111, error);
    }
})

router.post('/addpayment',auth, async (req, res)=>{
    try {
        const { paid, orderid, balan, payment} = req.body
        
        var ORD_id = await idfororder()
        const paidamount=parseFloat(paid)
      
        const paymentdata = await mySqlQury(`INSERT INTO tbl_order_payment (payment_amount,payment_account,order_id) 
        VALUE (${paid},'${payment}','${orderid}')`)
        
        const orderupdate = await mySqlQury("UPDATE tbl_order SET payment_data=CONCAT(payment_data,',"+paymentdata.insertId+"','') , paid_amount = ROUND(paid_amount + "+paidamount+",2), balance_amount = ROUND(gross_total - paid_amount,2) WHERE id="+orderid+"");
        // console.log("orderupdate" , orderupdate);
        const account = await mySqlQury("SELECT * FROM tbl_account WHERE id="+payment+"")
        const orderdata = await mySqlQury("SELECT * FROM tbl_order WHERE id="+orderid+"")
        
        const balance = parseFloat(account[0].balance) + parseFloat(paid)
        await mySqlQury("UPDATE tbl_account SET balance="+balance+" WHERE id="+payment+" ")
        await mySqlQury(`INSERT into tbl_transections (account_id,store_ID,transec_detail,transec_type,debit_amount,credit_amount,balance_amount, customer_id) 
                        VALUE ('${payment}','${account[0].store_ID}','POS Income ${ORD_id}','INCOME', 0,${paidamount},${balance}, '${orderdata[0].customer_id}')`)

        res.status(200).json({status:"success", message:"Payment Data Saved"})

    } catch (error) {
        console.log(error);
    }
})

// open payment model for order list
router.get('/paymodel/:id', auth, async(req, res)=>{
    try {
        const {id,roll,store,loginas} = req.user;
        const orderid = req.params.id;
    
        const order = await mySqlQury("SELECT tbl_order.*,tbl_orderstatus.status as status FROM tbl_order join tbl_orderstatus on tbl_order.order_status=tbl_orderstatus.id WHERE tbl_order.id="+orderid+"");
        const customer = await mySqlQury("SELECT * FROM tbl_customer WHERE id="+order[0].customer_id+"");
        const account = await mySqlQury("SELECT * FROM tbl_account WHERE store_ID="+order[0].store_id+"")

        res.status(200).json({order:order[0],customer:customer[0],account})
    
    } catch (error) {
        console.log(error);
    }
})

router.get('/barcode/:id', auth, async(req, res) => {
    try {
        const {id,roll,store,loginas} = req.user;
        const accessdata = await access(req.user)
        
        const order_date = await mySqlQury(`SELECT * FROM tbl_order WHERE id = '${req.params.id}'`)
        // console.log(order_date);

        const service_list = order_date[0].service_list.split(',')
        console.log(service_list);

        const service_list_data = await mySqlQury(`SELECT * FROM tbl_cart_servicelist`)
        // console.log(service_list_data);
        res.json({service_list, service_list_data, order_date, accessdata})
        
    } catch (error) {
        console.log(error);
    }
})





module.exports = router;