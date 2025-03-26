const express = require('express');
const {mySqlQury} = require('../middelwer/db');
const router = express.Router();
const auth = require('../middelwer/auth');
const {upload} = require('../middelwer/multer');
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


router.get('/pos', auth, async (req, res)=>{
    try {
        // var qury = `DELETE FROM tbl_customer WHERE id BETWEEN 62 AND 67;`
        // const data = await mySqlQury(qury);

        
        const customer = await mySqlQury(`SELECT COUNT(*) AS tot_cus FROM tbl_customer`)
        if (customer[0].tot_cus == "0") {
            var qury = `INSERT INTO tbl_customer (name,store_ID,reffstore,approved,delet_flage) VALUE 
                        ('Walk in customer','1', '1','1','0' )`
            await mySqlQury(qury);
        }

        const {id,roll,store,loginas} = req.user;
        const accessdata = await access (req.user)
        // console.log("accessdata" , accessdata);
        var orderid = await idfororder()

        // customer login
        if(loginas == 0){ 
            var login = 'customer' 
            var service_list = await mySqlQury(" SELECT * FROM tbl_services WHERE status=0 AND store_ID="+store+"");
            var storeList = []
            var ismulty = false
            customerList = await mySqlQury("SELECT id,name FROM tbl_customer WHERE id="+id+"")
            var tax = await mySqlQury("SELECT tax_percent FROM tbl_store WHERE id="+store+"")
            var cartdata = await mySqlQury(" SELECT * FROM tbl_cart WHERE created_by='"+loginas+','+id+"'");

          if(cartdata.length > 0){

            var cartorderupdate = await mySqlQury("UPDATE tbl_cart SET order_id='"+orderid+"', tax="+tax[0].tax_percent+",store_id="+store+",customer_id='"+id+"' WHERE created_by='"+loginas+','+id+"'"); 
            var cart = await mySqlQury(" SELECT * FROM tbl_cart WHERE created_by='"+loginas+','+id+"'");   
            var cartservice = await mySqlQury("SELECT * from tbl_cart_servicelist WHERE find_in_set(tbl_cart_servicelist.id,'"+cart[0].service_list_id+"')");
          }else{

            var cartinsert = await mySqlQury("INSERT INTO tbl_cart (created_by,store_id,customer_id,order_id,tax) VALUE('"+loginas+','+id+"',"+store+","+id+",'"+orderid+"',"+tax[0].tax_percent+")");  
            var cartservice =[]
            var cart = await mySqlQury(" SELECT * FROM tbl_cart WHERE created_by='"+loginas+','+id+"'");
          }

        }else{
            // admin login
            const rolldetail = await mySqlQury("select id,roll,orders from tbl_roll where id = "+roll+"");
           
            if(rolldetail[0].roll === "master_Admin"){
                // master admin
                const multiy = await mySqlQury("SELECT type FROM tbl_master_shop");
                if(multiy[0].type == 1){
                   
                    var storeList = await mySqlQury("SELECT id,name FROM tbl_store WHERE status=1 AND delete_flage=0");
                    // var customerList = await mySqlQury("SELECT id,name FROM tbl_customer WHERE approved=1 AND delet_flage=0");
                    var customerList = []
                    var ismulty = true

                    var cartdata = await mySqlQury("SELECT * FROM tbl_cart WHERE created_by='"+loginas+','+id+"'");
                
                    // console.log(cartdata);

                    if(cartdata.length > 0){
                        var cartorderupdate = await mySqlQury("UPDATE tbl_cart SET order_id='"+orderid+"' WHERE created_by='"+loginas+','+id+"'");
                        var cart_data = await mySqlQury(" SELECT * FROM tbl_cart WHERE created_by='"+loginas+','+id+"'");
                        if (cart_data[0].customer_id == '0') {

                            const customer_data = await mySqlQury(`SELECT * FROM tbl_customer WHERE store_ID = '${cart_data[0].store_id}' AND name = 'Walk in customer'`)

                            await mySqlQury("UPDATE tbl_cart SET customer_id = '"+customer_data[0].id+"' WHERE created_by='"+loginas+','+id+"'")
                        }
                        var cart = await mySqlQury(" SELECT * FROM tbl_cart WHERE created_by='"+loginas+','+id+"'");

                        var service_list = await mySqlQury(" SELECT * FROM tbl_services WHERE status=0 AND store_ID="+cart[0].store_id+"");
                        
                        var cartservice = await mySqlQury("SELECT * from tbl_cart_servicelist WHERE find_in_set(tbl_cart_servicelist.id,'"+cart[0].service_list_id+"')");
                        var customerList = await mySqlQury("SELECT id,name FROM tbl_customer WHERE approved=1 AND delet_flage=0 AND store_ID="+cart[0].store_id+"");
                       
                    } else {

                        var cartinsert = await mySqlQury("INSERT INTO tbl_cart (created_by,order_id) VALUE('"+loginas+','+id+"','"+orderid+"')");
                        var cartservice =[]
                        var cart_data = await mySqlQury(" SELECT * FROM tbl_cart WHERE created_by='"+loginas+','+id+"'");
                            if (cart_data[0].customer_id == '0') {

                                const customer_data = await mySqlQury(`SELECT * FROM tbl_customer WHERE store_ID = '${cart_data[0].store_id}' AND name = 'Walk in customer'`)
                                await mySqlQury("UPDATE tbl_cart SET customer_id = '"+customer_data[0].id+"' WHERE created_by='"+loginas+','+id+"'")
                            }
                        var cart = await mySqlQury(" SELECT * FROM tbl_cart WHERE created_by='"+loginas+','+id+"'");
                        var service_list = []
                    }

                }else{

                    var service_list = await mySqlQury(" SELECT * FROM tbl_services WHERE status=0 AND store_ID=1");
                    var storeList =[]
                    var ismulty = false
                    var customerList = await mySqlQury("SELECT id,name FROM tbl_customer WHERE approved=1 AND delet_flage=0 AND store_ID=1");
                    var tax = await mySqlQury("SELECT tax_percent FROM tbl_store WHERE id="+store+"")
                    var couponlist = await mySqlQury("select * from tbl_coupon where start_date <=date(now()) AND end_date >=date(now()) AND status=0 AND find_in_set('"+store+"',store_list_id)");

                    var datacart = await mySqlQury(" SELECT * FROM tbl_cart WHERE created_by='"+loginas+','+id+"'");
                    if(datacart.length > 0){
                        var cartorderupdate = await mySqlQury("UPDATE tbl_cart SET order_id='"+orderid+"',store_id=1, tax="+tax[0].tax_percent+" WHERE created_by='"+loginas+','+id+"'");
                        var cart_data = await mySqlQury(" SELECT * FROM tbl_cart WHERE created_by='"+loginas+','+id+"'");  
                        if (cart_data[0].customer_id == '0') {      
                            const customer_data = await mySqlQury(`SELECT * FROM tbl_customer WHERE store_ID = '${cart_data[0].store_id}' AND name = 'Walk in customer'`)
                            if (customer_data != "") {    
                                await mySqlQury("UPDATE tbl_cart SET customer_id = '"+customer_data[0].id+"' WHERE created_by='"+loginas+','+id+"'")
                            } else {
                                const customers = await mySqlQury(`SELECT * FROM tbl_customer WHERE name = 'Walk in customer' LIMIT 1`)
                                await mySqlQury("UPDATE tbl_cart SET customer_id = '"+customers[0].id+"' WHERE created_by='"+loginas+','+id+"'") 
                            }
                        }
                        var cart = await mySqlQury(" SELECT * FROM tbl_cart WHERE created_by='"+loginas+','+id+"'");
                        var cartservice = await mySqlQury("SELECT * from tbl_cart_servicelist WHERE find_in_set(tbl_cart_servicelist.id,'"+cart[0].service_list_id+"')");
                        
                    } else {

                        console.log(loginas);
                        var cartinsert = await mySqlQury("INSERT INTO tbl_cart (created_by,store_id,order_id,tax) VALUE('"+loginas+','+id+"',"+store+",'"+orderid+"',"+tax[0].tax_percent+")");  
                        var cartservice =[]
                        var cart_data = await mySqlQury(" SELECT * FROM tbl_cart WHERE created_by='"+loginas+','+id+"'");  
                        if (cart_data[0].customer_id == '0') {
                            const customer_data = await mySqlQury(`SELECT * FROM tbl_customer WHERE store_ID = '${cart_data[0].store_id}' AND name = 'Walk in customer'`)
                            if (customer_data != "") {    
                                await mySqlQury("UPDATE tbl_cart SET customer_id = '"+customer_data[0].id+"' WHERE created_by='"+loginas+','+id+"'")
                            } else {
                                const customers = await mySqlQury(`SELECT * FROM tbl_customer WHERE name = 'Walk in customer' LIMIT 1`)
                                await mySqlQury("UPDATE tbl_cart SET customer_id = '"+customers[0].id+"' WHERE created_by='"+loginas+','+id+"'") 
                            }
                        }
                        var cart = await mySqlQury(" SELECT * FROM tbl_cart WHERE created_by='"+loginas+','+id+"'");
                    }
                }

                var login = 'master_admin'
                
            } else if( rolldetail[0].orders.includes('read')) {

                // store login
                var service_list = await mySqlQury(" SELECT * FROM tbl_services WHERE status=0 AND store_ID="+store+"");
                var customerList = await mySqlQury("SELECT id,name FROM tbl_customer WHERE approved=1 AND delet_flage=0 AND store_ID="+store+"");
                var login = 'store'
                var storeList =[]
                var ismulty = false
                var tax = await mySqlQury("SELECT tax_percent FROM tbl_store WHERE id="+store+"")
               

                var datacart = await mySqlQury(" SELECT * FROM tbl_cart WHERE created_by='"+loginas+','+id+"'");
                if(datacart.length > 0){

                    var cartorderupdate = await mySqlQury("UPDATE tbl_cart SET order_id='"+orderid+"', tax="+tax[0].tax_percent+" WHERE created_by='"+loginas+','+id+"'");
                    var cart_data = await mySqlQury(" SELECT * FROM tbl_cart WHERE created_by='"+loginas+','+id+"'");  
            
                    if (cart_data[0].customer_id == '0') {
                        console.log(cart_data[0].store_id);
                        const customer_data = await mySqlQury(`SELECT * FROM tbl_customer WHERE store_ID = '${cart_data[0].store_id}' AND name = 'Walk in customer'`)

                        if (customer_data != "") {    
                            await mySqlQury("UPDATE tbl_cart SET customer_id = '"+customer_data[0].id+"' WHERE created_by='"+loginas+','+id+"'")
                        } else {
                            const customers = await mySqlQury(`SELECT * FROM tbl_customer WHERE name = 'Walk in customer' LIMIT 1`)
                            await mySqlQury("UPDATE tbl_cart SET customer_id = '"+customers[0].id+"' WHERE created_by='"+loginas+','+id+"'") 
                        }
                       
                    }
                    var cart = await mySqlQury(" SELECT * FROM tbl_cart WHERE created_by='"+loginas+','+id+"'");
                    var cartservice = await mySqlQury("SELECT * from tbl_cart_servicelist WHERE find_in_set(tbl_cart_servicelist.id,'"+cart[0].service_list_id+"')");

                } else {
                    var cartinsert = await mySqlQury("INSERT INTO tbl_cart (created_by,store_id,order_id,tax) VALUE('"+loginas+','+id+"',"+store+",'"+orderid+"',"+tax[0].tax_percent+")");  
                    var cartservice =[]
                    var cart_data = await mySqlQury(" SELECT * FROM tbl_cart WHERE created_by='"+loginas+','+id+"'");
                    if (cart_data[0].customer_id == '0') {

                        const customer_data = await mySqlQury(`SELECT * FROM tbl_customer WHERE store_ID = '${cart_data[0].store_id}' AND name = 'Walk in customer'`)
                        
                        if (customer_data != "") {    
                            await mySqlQury("UPDATE tbl_cart SET customer_id = '"+customer_data[0].id+"' WHERE created_by='"+loginas+','+id+"'")
                        } else {
                            const customers = await mySqlQury(`SELECT * FROM tbl_customer WHERE name = 'Walk in customer' LIMIT 1`)
                            await mySqlQury("UPDATE tbl_cart SET customer_id = '"+customers[0].id+"' WHERE created_by='"+loginas+','+id+"'") 
                        }
                    }
                    var cart = await mySqlQury(" SELECT * FROM tbl_cart WHERE created_by='"+loginas+','+id+"'");
                }

            }else{
                req.flash("error", "Your Are Not Authorized For this");
                return res.redirect('back')
            }
        }

        if (customerList == "") {
            customerList = await mySqlQury("SELECT id,name FROM tbl_customer WHERE approved=1 AND delet_flage=0 AND name = 'Walk in customer' LIMIT 1");
        } else {
            let ctot = customerList.length, cchake = 0;

            for (let i = 0; i < ctot;) {
                if (customerList[i].name == "Walk in customer") {
                    cchake++
                }
                i++;
            }

            if (cchake == "0") {
                let walk_cus = await mySqlQury("SELECT id,name FROM tbl_customer WHERE approved=1 AND delet_flage=0 AND name = 'Walk in customer' LIMIT 1");
                customerList.concat(walk_cus);
            }
        }

        var orderid = cart[0].order_id
        splite_id = orderid.split(/[A-Z-a-z]/).join("");
        // console.log(splite_id);
        
        var addonlist = await mySqlQury("SELECT * FROM tbl_addons WHERE status=0 AND store_ID="+store+"")
       
        // console.log('service_list', service_list);
        res.render('pos',{login,storeList,service_list,ismulty, customerList,addonlist, cartservice,cart:cart[0],accessdata, language:req.language_data, language_name:req.language_name, splite_id})

    } catch (error) {
        console.log(error);
    }
})


router.get('/edit/:id', auth, async(req, res) => {
    try {
        const {id,roll,store,loginas} = req.user;
        const accessdata = await access (req.user)
        
        const order_date = await mySqlQury(`SELECT tbl_order.*, (select tbl_store.name from tbl_store where tbl_order.store_id = tbl_store.id) as store_name,
                                            (select tbl_customer.name from tbl_customer where tbl_order.customer_id = tbl_customer.id) as customer_name
                                            FROM tbl_order WHERE id = '${req.params.id}'`)
        console.log('order_date', order_date);

        const service_list = await mySqlQury(`SELECT * FROM tbl_services WHERE store_ID = '${order_date[0].store_id}'`)
        console.log('service_list', service_list);
        
        var cartservice = await mySqlQury("SELECT * from tbl_cart_servicelist WHERE find_in_set(tbl_cart_servicelist.id,'"+order_date[0].service_list+"')");
        console.log(cartservice);

        var addonlist = await mySqlQury("SELECT * FROM tbl_addons WHERE status=0 AND store_ID="+store+"")
        console.log(555444, addonlist);

        console.log(roll);
        res.render('pos_edit', {
            accessdata, order_date, service_list, cartservice, addonlist, roll, language:req.language_data, language_name:req.language_name
        })
    } catch (error) {
        console.log(error);
    }
})



// when store change 
// service list from store id
router.get('/servicelist/:id', auth, async(req, res)=>{
    try {
        const {id,roll,store,loginas} = req.user;
        
        var storeid = req.params.id;
        var service_list = await mySqlQury(" SELECT * FROM tbl_services WHERE status=0 AND store_ID="+storeid+"");
        res.status(200).json({service_list})

    } catch (error) {
        console.log(error);
    }
})
// get Addon on store change and store id in cart
router.get('/addonlist/:id', auth, async(req, res)=>{
    try {
        const {id,roll,store,loginas} = req.user;
        var storeid = req.params.id; 
   
        var addon_list = await mySqlQury(" SELECT * FROM tbl_addons WHERE status=0 AND store_ID="+storeid+"");

        var tax = await mySqlQury("SELECT tax_percent FROM tbl_store WHERE id="+storeid+"")
      
        var updatecart = await mySqlQury("UPDATE tbl_cart SET store_id="+storeid+", tax="+tax[0].tax_percent+" WHERE created_by='"+loginas+','+id+"'");

        var cart = await mySqlQury(" SELECT * FROM tbl_cart WHERE created_by='"+loginas+','+id+"'"); 

        res.status(200).json({addon_list,cart:cart[0]})

    } catch (error) {
        console.log(error);
    }
})

// customer list
router.get('/customerlist/:id', auth, async(req, res)=>{
    try {
        const {id,roll,store,loginas} = req.user;
        var storeid = req.params.id;
        storeid !== 'null' ? storeid : storeid = store
        var customerList = await mySqlQury("SELECT id,name FROM tbl_customer WHERE approved=1 AND delet_flage=0 AND store_ID="+storeid+"");
        
        if (customerList == "") {
            customerList = await mySqlQury("SELECT id,name FROM tbl_customer WHERE approved=1 AND delet_flage=0 AND name = 'Walk in customer' LIMIT 1");
        } else {
            let ctot = customerList.length, cchake = 0;
            for (let i = 0; i < ctot;) {
                if (customerList[i].name == "Walk in customer") {
                    cchake++
                }
                i++;
            }

            if (cchake == "0") {
                let walk_cus = await mySqlQury("SELECT id,name FROM tbl_customer WHERE approved=1 AND delet_flage=0 AND name = 'Walk in customer' LIMIT 1");
                customerList = walk_cus.concat(customerList);
            }
        }
        
        res.status(200).json({customerList})
    } catch (error) {
        console.log(error);
    }
})

// add service to cart
router.post('/addservicelist', auth, async(req, res)=>{
    try {
        const {id,roll,store,loginas} = req.user;
        console.log(11111, req.body);
        const serviceid = req.body.serviceid.split(',')[0]
        const serviceName = req.body.serviceid.split(',')[1]
        const serviceimage = req.body.serviceid.split(',')[2]

        const servicetypeid = req.body.servicetype.split(',')[0]
        const servicetypeprice = req.body.servicetype.split(',')[1]
        const servicetypename = req.body.servicetype.split(',')[2]

        const servicelist = await mySqlQury(`INSERT INTO tbl_cart_servicelist (service_id,service_type_id,service_type_price,service_quntity,service_color,service_name,
            service_type_name,service_img) VALUE (${serviceid},${servicetypeid},${servicetypeprice},1,'#000000','${serviceName}','${servicetypename}','${serviceimage}')`)

                
        const cartupdate = await mySqlQury("UPDATE tbl_cart SET service_list_id=CONCAT(service_list_id,',"+servicelist.insertId+"'),sub_total= ROUND(sub_total + "+servicetypeprice+",2), tax_amount =ROUND((sub_total + addon_price - coupon_discount - extra_discount) * (tax/ 100),2), gross_total = ROUND(sub_total + tax_amount + addon_price - coupon_discount - extra_discount,2), balance = ROUND(gross_total - paid_amount,2)  WHERE created_by='"+loginas+','+id+"'");


        var cart = await mySqlQury(" SELECT * FROM tbl_cart WHERE created_by='"+loginas+','+id+"'");
        var cartservice = await mySqlQury("SELECT * from tbl_cart_servicelist WHERE find_in_set(tbl_cart_servicelist.id,'"+cart[0].service_list_id+"')");
        console.log('cartservice', cartservice);

        res.status(200).json({cart:cart[0], cartservice, loginas});
    
    } catch (error) {
        console.log(error);
    }
})



// edit service to cart
router.post('/editservicelist', auth, async(req, res)=>{
    try {
        const {id,roll,store,loginas} = req.user;
        
        const serviceid = req.body.serviceid.split(',')[0]
        const serviceName = req.body.serviceid.split(',')[1]
        const serviceimage = req.body.serviceid.split(',')[2]

        const servicetypeid = req.body.servicetype.split(',')[0]
        const servicetypeprice = req.body.servicetype.split(',')[1]
        const servicetypename = req.body.servicetype.split(',')[2]


        const old_order_date = await mySqlQury(`SELECT * FROM tbl_order WHERE id = '${req.body.order_id}'`)

        const servicelist = await mySqlQury(`INSERT INTO tbl_cart_servicelist (service_id,service_type_id,service_type_price,
            service_quntity,service_color,service_name,service_type_name,service_img) VALUE (${serviceid},${servicetypeid},${servicetypeprice},
                1,'#000000','${serviceName}','${servicetypename}','${serviceimage}')`)

        const store_data = await mySqlQury(`SELECT * FROM tbl_store WHERE id = '${old_order_date[0].store_id}'`)
        await mySqlQury("UPDATE tbl_order SET service_list = CONCAT(service_list,',"+servicelist.insertId+"'),sub_total= ROUND(sub_total + "+servicetypeprice+",2), tax_amount =ROUND((sub_total + addon_price - coupon_discount) * (tax/ 100),2), gross_total = ROUND(sub_total + tax_amount + addon_price - coupon_discount - extra_discount,2), balance_amount = ROUND(gross_total - paid_amount,2), master_comission = ROUND((gross_total * '"+ store_data[0].shop_commission +"') / 100,2) WHERE id = '"+old_order_date[0].id+"'");


        // const cartupdate = await mySqlQury("UPDATE tbl_cart SET service_list_id=CONCAT(service_list_id,',"+servicelist.insertId+"'),sub_total= ROUND(sub_total + "+servicetypeprice+",2), tax_amount =ROUND((sub_total + addon_price - coupon_discount - extra_discount) * (tax/ 100),2), gross_total = ROUND(sub_total + tax_amount + addon_price - coupon_discount - extra_discount,2), balance = ROUND(gross_total - paid_amount,2)  WHERE created_by='"+loginas+','+id+"'");

        const order_date = await mySqlQury(`SELECT * FROM tbl_order WHERE id = '${req.body.order_id}'`)
        // var cart = await mySqlQury(" SELECT * FROM tbl_cart WHERE created_by='"+loginas+','+id+"'");
        var cartservice = await mySqlQury("SELECT * from tbl_cart_servicelist WHERE find_in_set(tbl_cart_servicelist.id,'"+order_date[0].service_list+"')");
        console.log('cartservice', cartservice);

        res.status(200).json({order_date:order_date[0], cartservice, loginas});
    
    } catch (error) {
        console.log(error);
    }
})

// edit remove service to cart
router.post('/edit_removeservicelist', auth, async(req, res)=>{
    try {
        const {id,roll,store,loginas} = req.user;
        console.log(99999, req.body);

        const service = await mySqlQury(`SELECT * FROM tbl_cart_servicelist WHERE ID=${req.body.service_id} `)
        console.log(1111, service);

        const diff = parseFloat(service[0].service_type_price) * parseFloat(service[0].service_quntity)
        console.log('diff', diff);

        const old_order_date = await mySqlQury(`SELECT * FROM tbl_order WHERE id = '${req.body.order_id}'`)
        console.log('old_order_date', old_order_date);

        const sub_total = (parseFloat(old_order_date[0].sub_total) - parseFloat(diff)).toFixed(2)
        console.log('sub_total', sub_total);
        const tax_amount = ((parseFloat(sub_total) + parseFloat(old_order_date[0].addon_price) - parseFloat(old_order_date[0].coupon_discount)) * (parseFloat(old_order_date[0].tax) / 100)).toFixed(2)
        console.log('tax_amount', tax_amount);
        const gross_total = (parseFloat(sub_total) + parseFloat(tax_amount) + parseFloat(old_order_date[0].addon_price) - parseFloat(old_order_date[0].coupon_discount) - parseFloat(old_order_date[0].extra_discount)).toFixed(2)
        console.log('gross_total', gross_total);

        if (gross_total < old_order_date[0].paid_amount) {
            req.flash("error", "gross_total Less-than paid_amount");
            return res.json(400)
        }
        
        const store_data = await mySqlQury(`SELECT * FROM tbl_store WHERE id = '${old_order_date[0].store_id}'`)
        const orderupdate = await mySqlQury("UPDATE tbl_order SET service_list=REPLACE(service_list,',"+req.body.service_id+"',''),sub_total= ROUND(sub_total - "+ diff+",2), tax_amount =ROUND((sub_total + addon_price - coupon_discount) * tax / 100,2), gross_total =ROUND( sub_total + tax_amount + addon_price - coupon_discount - extra_discount,2), balance_amount =ROUND( gross_total - paid_amount,2), master_comission = ROUND((gross_total * '"+ store_data[0].shop_commission +"') / 100,2) WHERE id = '"+req.body.order_id+"'");
        // const cartupdate = await mySqlQury("UPDATE tbl_cart SET service_list_id=REPLACE(service_list_id,',"+serviceid+"',''),sub_total= ROUND(sub_total - "+ diff+",2), tax_amount =ROUND((sub_total + addon_price - coupon_discount - extra_discount)*tax / 100,2), gross_total =ROUND( sub_total + tax_amount + addon_price - coupon_discount - extra_discount,2), balance =ROUND( gross_total - paid_amount,2) WHERE created_by='"+loginas+','+id+"'");
        
        const deletservice = await mySqlQury("DELETE FROM tbl_cart_servicelist WHERE id="+req.body.service_id+"")

        const order_date = await mySqlQury(`SELECT * FROM tbl_order WHERE id = '${req.body.order_id}'`)
        // var cart = await mySqlQury(" SELECT * FROM tbl_cart WHERE created_by='"+loginas+','+id+"'");
        var cartservice = await mySqlQury("SELECT * from tbl_cart_servicelist WHERE find_in_set(tbl_cart_servicelist.id,'"+order_date[0].service_list+"')");

        console.log(1111, 'order_date', order_date);
        res.status(200).json({order_date:order_date[0], cartservice, loginas});
        
    } catch (error) {
        console.log(error);
    }
})




// remove service to cart
router.get('/removeservicelist/:id', auth, async(req, res)=>{
    try {
        const {id,roll,store,loginas} = req.user;
        const serviceid = req.params.id

        const service = await mySqlQury(`SELECT * FROM tbl_cart_servicelist WHERE ID=${serviceid} `)

        const diff = parseFloat(service[0].service_type_price) * parseFloat(service[0].service_quntity)
   
        const cartupdate = await mySqlQury("UPDATE tbl_cart SET service_list_id=REPLACE(service_list_id,',"+serviceid+"',''),sub_total= ROUND(sub_total - "+ diff+",2), tax_amount =ROUND((sub_total + addon_price - coupon_discount - extra_discount)*tax / 100,2), gross_total =ROUND( sub_total + tax_amount + addon_price - coupon_discount - extra_discount,2), balance =ROUND( gross_total - paid_amount,2) WHERE created_by='"+loginas+','+id+"'");
       
        const deletservice = await mySqlQury("DELETE FROM tbl_cart_servicelist WHERE id="+serviceid+"")
        var cart = await mySqlQury(" SELECT * FROM tbl_cart WHERE created_by='"+loginas+','+id+"'");
        var cartservice = await mySqlQury("SELECT * from tbl_cart_servicelist WHERE find_in_set(tbl_cart_servicelist.id,'"+cart[0].service_list_id+"')");


        res.status(200).json({cart:cart[0], cartservice, loginas});
    
    } catch (error) {
        console.log(error);
    }
})


// get service type id from service
router.get('/getservicetype/:id', auth, async (req, res)=>{
try {
    const accessdata = await access (req.user)
    var ServiceType = await mySqlQury("SELECT id,services_type_id,services_type_price,name,image FROM tbl_services WHERE id = "+req.params.id+"");
    console.log("1st ServiceType" , ServiceType);
    const price = ServiceType[0].services_type_price.split(',')
    const type = ServiceType[0].services_type_id.split(',')
    const service = ServiceType[0].id+','+ServiceType[0].name+','+ServiceType[0].image
   
    console.log("price" , price);
    console.log("type" , type);
    console.log("service" , service);
    const typlist =await Promise.all(
        type.map(async (data, i)=>{
            console.log("data" , data);
            var ServiceType = await mySqlQury("SELECT services_type FROM tbl_services_type WHERE id ="+data+"")
            console.log("ServiceType" , ServiceType[0].services_type);
            console.log("price" , price[i]);
            return {
                id:data,
                servicetype:ServiceType[0].services_type,
                price:price[i]
            }
        })
    );
 
    res.status(200).json({data:typlist, serviceid:service, accessdata})


} catch (error) {
    console.log(error);
}
})


// customer change save in cart
router.get('/newcustomerid/:id', auth, async (req, res)=>{
    try {
      
        const {id,roll,store,loginas} = req.user;
        var customerid = req.params.id;
        var cart = await mySqlQury("UPDATE tbl_cart SET customer_id="+customerid+" WHERE created_by='"+loginas+','+id+"'");

        res.status(200).json({status:200})

        
    } catch (error) {
        console.log(error);
    }
})

//  POS Service Color change
router.post('/color', auth, async (req, res)=>{
    try {
        var {id, color}= req.body;
    
        var cart = await mySqlQury("UPDATE tbl_cart_servicelist SET service_color='"+color+"' WHERE id="+id+"");
        res.status(200).json({status:200})

        
    } catch (error) {
        console.log(error);
    }
})

//  POS Date change
router.post('/date', auth, async (req, res)=>{
    try {const {id,roll,store,loginas} = req.user;
        var {date}= req.body;
      
         var cart = await mySqlQury("UPDATE tbl_cart SET order_date='"+date+"', delivery_date='"+date+"' WHERE created_by='"+loginas+','+id+"'");
         
        res.status(200).json({status:200})
        
    } catch (error) {
        console.log(error);
    }
})

//  POS Date change
router.post('/edit_date', auth, async (req, res)=>{
    try {
        const {id,roll,store,loginas} = req.user;
        const {date, order_id}= req.body;
      
        await mySqlQury(`UPDATE tbl_order SET order_date = '${date}', delivery_date = '${date}' WHERE id = '${order_id}'`) 
         
        res.status(200).json({status:200})
        
    } catch (error) {
        console.log(error);
    }
})

//  POS Clear cart
router.get('/clearcart', auth, async (req, res)=>{
    try {
        const {id,roll,store,loginas} = req.user;
       
        var orderid = await idfororder()
        
        const cart = await mySqlQury(" SELECT * FROM tbl_cart WHERE created_by='"+loginas+','+id+"'");

        var tax = await mySqlQury("SELECT tax_percent FROM tbl_store WHERE id="+cart[0].store_id+"")
        if(cart.length > 0){
            const servicelist = cart[0].service_list_id.split(',');
            await Promise.all(
                servicelist.map(async (data, i)=>{
                     await mySqlQury("DELETE FROM tbl_cart_servicelist WHERE id="+data+"")
                })
            )
            await mySqlQury(`UPDATE tbl_cart SET order_date=CURRENT_TIMESTAMP,service_list_id=0,order_id=0,addon_id=0,addon_price=0,delivery_date=CURRENT_TIMESTAMP,extra_discount=0,
                            coupon_id=0,coupon_discount=0,tax_amount=0,sub_total=0,gross_total=0,paid_amount=0,payment_type=0, order_id='${orderid}',
                            balance=0,notes='', tax=${tax[0].tax_percent} WHERE created_by='${loginas},${id}'`)
            
            var cartdata = await mySqlQury(" SELECT * FROM tbl_cart WHERE created_by='"+loginas+','+id+"'");
            var cartservice = await mySqlQury("SELECT * from tbl_cart_servicelist WHERE find_in_set(tbl_cart_servicelist.id,'"+cart[0].service_list_id+"')");
            
            res.status(200).json({cart:cartdata[0], cartservice, loginas});
        }
    } catch (error) {
        console.log(error);
    }
})

// change service amount
router.post('/changeamount', auth, async(req, res)=>{
    try {
        const {id,roll,store,loginas} = req.user;
      
        const { id:serviceid, price } = req.body

        const service = await mySqlQury(`SELECT * FROM tbl_cart_servicelist WHERE id=${serviceid}`)
       
        const amount_diff = (parseFloat(price) * parseFloat(service[0].service_quntity)) - (parseFloat(service[0].service_type_price) * parseFloat(service[0].service_quntity))
        const updateservice = await mySqlQury("UPDATE tbl_cart_servicelist SET service_type_price="+price+" WHERE id="+serviceid+"");
        const cartupdate = await mySqlQury("UPDATE tbl_cart SET sub_total= ROUND(sub_total + "+amount_diff+",2) , tax_amount =ROUND((sub_total + addon_price - coupon_discount - extra_discount)*tax / 100,2), gross_total = ROUND(sub_total + tax_amount + addon_price - coupon_discount - extra_discount,2), balance = ROUND(gross_total - paid_amount,2)  WHERE created_by='"+loginas+','+id+"'");


        var cart = await mySqlQury(" SELECT * FROM tbl_cart WHERE created_by='"+loginas+','+id+"'");
        var cartservice = await mySqlQury("SELECT * from tbl_cart_servicelist WHERE find_in_set(tbl_cart_servicelist.id,'"+cart[0].service_list_id+"')");


        res.status(200).json({cart:cart[0], cartservice, loginas});
    
    } catch (error) {
        console.log(error);
    }
})




// change service amount
router.post('/edit_changeamount', auth, async(req, res)=>{
    try {
        const {id,roll,store,loginas} = req.user;
      
        const { id:serviceid, price, order_id } = req.body

        const service = await mySqlQury(`SELECT * FROM tbl_cart_servicelist WHERE id=${serviceid}`)
        console.log('service', service);
       
        const amount_diff = (parseFloat(price) * parseFloat(service[0].service_quntity)) - (parseFloat(service[0].service_type_price) * parseFloat(service[0].service_quntity))
        

        const old_order_date = await mySqlQury(`SELECT * FROM tbl_order WHERE id = '${req.body.order_id}'`)
        console.log('old_order_date', old_order_date);

        const sub_total = (parseFloat(old_order_date[0].sub_total) + parseFloat(amount_diff)).toFixed(2)
        console.log('sub_total', sub_total);
        const tax_amount = ((parseFloat(sub_total) + parseFloat(old_order_date[0].addon_price) - parseFloat(old_order_date[0].coupon_discount)) * (parseFloat(old_order_date[0].tax) / 100)).toFixed(2)
        console.log('tax_amount', tax_amount);
        const gross_total = (parseFloat(sub_total) + parseFloat(tax_amount) + parseFloat(old_order_date[0].addon_price) - parseFloat(old_order_date[0].coupon_discount) - parseFloat(old_order_date[0].extra_discount)).toFixed(2)
        console.log('gross_total', gross_total);

        if (gross_total < old_order_date[0].paid_amount) {
            req.flash("error", "gross_total Less-than paid_amount");
            return res.json(400)
        }
        
        
        const updateservice = await mySqlQury("UPDATE tbl_cart_servicelist SET service_type_price="+price+" WHERE id="+serviceid+"");

        const store_data = await mySqlQury(`SELECT * FROM tbl_store WHERE id = '${old_order_date[0].store_id}'`)
        await mySqlQury("UPDATE tbl_order SET sub_total= ROUND(sub_total + "+amount_diff+",2) , tax_amount =ROUND((sub_total + addon_price - coupon_discount)*tax / 100,2), gross_total = ROUND(sub_total + tax_amount + addon_price - coupon_discount - extra_discount,2), balance_amount = ROUND(gross_total - paid_amount,2), master_comission = ROUND((gross_total * '"+ store_data[0].shop_commission +"') / 100,2)  WHERE id = '"+ order_id +"'");
        // const cartupdate = await mySqlQury("UPDATE tbl_cart SET sub_total= ROUND(sub_total + "+amount_diff+",2) , tax_amount =ROUND((sub_total + addon_price - coupon_discount - extra_discount)*tax / 100,2), gross_total = ROUND(sub_total + tax_amount + addon_price - coupon_discount - extra_discount,2), balance = ROUND(gross_total - paid_amount,2)  WHERE created_by='"+loginas+','+id+"'");


        const order_date = await mySqlQury(" SELECT * FROM tbl_order WHERE id = '"+ order_id +"'");
        console.log('order_date', order_date);
        const cartservice = await mySqlQury("SELECT * from tbl_cart_servicelist WHERE find_in_set(tbl_cart_servicelist.id,'"+order_date[0].service_list+"')");

        res.status(200).json({order_date:order_date[0], cartservice, loginas});    
    } catch (error) {
        console.log(error);
    }
})

// change service Quntity
router.post('/edit_changequntity', auth, async(req, res)=>{
    try {
        const {id,roll,store,loginas} = req.user;
       
        const { id:serviceid, qty, order_id} = req.body

        const service = await mySqlQury(`SELECT * FROM tbl_cart_servicelist WHERE id=${serviceid}`)
        const amount_diff = (parseFloat(service[0].service_type_price) * parseFloat(qty)) - (parseFloat(service[0].service_type_price) * parseFloat(service[0].service_quntity))


        const old_order_date = await mySqlQury(`SELECT * FROM tbl_order WHERE id = '${req.body.order_id}'`)
        console.log('old_order_date', old_order_date);

        const sub_total = (parseFloat(old_order_date[0].sub_total) + parseFloat(amount_diff)).toFixed(2)
        console.log('sub_total', sub_total);
        const tax_amount = ((parseFloat(sub_total) + parseFloat(old_order_date[0].addon_price) - parseFloat(old_order_date[0].coupon_discount)) * (parseFloat(old_order_date[0].tax) / 100)).toFixed(2)
        console.log('tax_amount', tax_amount);
        const gross_total = (parseFloat(sub_total) + parseFloat(tax_amount) + parseFloat(old_order_date[0].addon_price) - parseFloat(old_order_date[0].coupon_discount) - parseFloat(old_order_date[0].extra_discount)).toFixed(2)
        console.log('gross_total', gross_total);

        if (gross_total < old_order_date[0].paid_amount) {
            req.flash("error", "gross_total Less-than paid_amount");
            return res.json(400)
        }


        const updateservice = await mySqlQury("UPDATE tbl_cart_servicelist SET service_quntity="+qty+" WHERE id="+serviceid+"");

        const store_data = await mySqlQury(`SELECT * FROM tbl_store WHERE id = '${old_order_date[0].store_id}'`)
        await mySqlQury("UPDATE tbl_order SET sub_total= ROUND(sub_total + "+amount_diff+",2) , tax_amount =ROUND((sub_total + addon_price - coupon_discount) * (tax / 100),2) , gross_total = ROUND(sub_total + tax_amount + addon_price - coupon_discount - extra_discount,2) , balance_amount = ROUND(gross_total - paid_amount,2), master_comission = ROUND((gross_total * '"+ store_data[0].shop_commission +"') / 100,2) WHERE id = '"+ order_id +"'");
        // const cartupdate = await mySqlQury("UPDATE tbl_cart SET sub_total= ROUND(sub_total + "+amount_diff+",2) , tax_amount =ROUND((sub_total + addon_price - coupon_discount - extra_discount) * (tax / 100),2) , gross_total = ROUND(sub_total + tax_amount + addon_price - coupon_discount - extra_discount,2) , balance = ROUND(gross_total - paid_amount,2)   WHERE created_by='"+loginas+','+id+"'");


        const order_date = await mySqlQury(" SELECT * FROM tbl_order WHERE id = '"+ order_id +"'");
        const cartservice = await mySqlQury("SELECT * from tbl_cart_servicelist WHERE find_in_set(tbl_cart_servicelist.id,'"+order_date[0].service_list+"')");

      

        res.status(200).json({order_date:order_date[0], cartservice, loginas});
    
    } catch (error) {
        console.log(error);
    }
})





// change service Quntity
router.post('/changequntity', auth, async(req, res)=>{
    try {
        const {id,roll,store,loginas} = req.user;
       
        const { id:serviceid, qty } = req.body

        const service = await mySqlQury(`SELECT * FROM tbl_cart_servicelist WHERE id=${serviceid}`)
        const amount_diff = (parseFloat(service[0].service_type_price) * parseFloat(qty)) - (parseFloat(service[0].service_type_price) * parseFloat(service[0].service_quntity))
        const updateservice = await mySqlQury("UPDATE tbl_cart_servicelist SET service_quntity="+qty+" WHERE id="+serviceid+"");
        const cartupdate = await mySqlQury("UPDATE tbl_cart SET sub_total= ROUND(sub_total + "+amount_diff+",2) , tax_amount =ROUND((sub_total + addon_price - coupon_discount - extra_discount) * (tax / 100),2) , gross_total = ROUND(sub_total + tax_amount + addon_price - coupon_discount - extra_discount,2) , balance = ROUND(gross_total - paid_amount,2)   WHERE created_by='"+loginas+','+id+"'");


        var cart = await mySqlQury(" SELECT * FROM tbl_cart WHERE created_by='"+loginas+','+id+"'");
        var cartservice = await mySqlQury("SELECT * from tbl_cart_servicelist WHERE find_in_set(tbl_cart_servicelist.id,'"+cart[0].service_list_id+"')");

        

        res.status(200).json({cart:cart[0], cartservice, loginas});
    
    } catch (error) {
        console.log(error);
    }
})


// Add Addons's to cart
router.post('/addonsadd', auth, async(req, res)=>{
    try {
        const {id,roll,store,loginas} = req.user;
        var addon = req.body.addon
        var cart = await mySqlQury(" SELECT * FROM tbl_cart WHERE created_by='"+loginas+','+id+"'");

        addon ? (Array.isArray(addon) ? addon=addon.join(','):addon):(addon='0')
        const newaddonarry = addon.split(',')
        var price=0
        await Promise.all( 
            newaddonarry.map(async (data, i)=>{
                var x= await mySqlQury("SELECT price FROM tbl_addons WHERE id="+data+"")
                if(x.length > 0){
                    return price += x[0].price
                }
            })
        )

        const cartupdate = await mySqlQury("UPDATE tbl_cart SET addon_id='"+addon+"', addon_price="+price+", tax_amount = ROUND((sub_total + addon_price - coupon_discount - extra_discount)*tax / 100,2), gross_total = ROUND(sub_total + tax_amount + addon_price - coupon_discount - extra_discount,2), balance = ROUND(gross_total - paid_amount,2)  WHERE created_by='"+loginas+','+id+"'");

        var cart = await mySqlQury(" SELECT * FROM tbl_cart WHERE created_by='"+loginas+','+id+"'");
        var cartservice = await mySqlQury("SELECT * from tbl_cart_servicelist WHERE find_in_set(tbl_cart_servicelist.id,'"+cart[0].service_list_id+"')");

        res.status(200).json({cart:cart[0], cartservice, loginas});    
    } catch (error) {
       console.log(error);
    }
})



// Add Addons's to cart
router.post('/edit_onsadd', auth, async(req, res)=>{
    try {
        const {id,roll,store,loginas} = req.user;
        
        var addon = req.body.addon
        // var order_date = await mySqlQury(`SELECT * FROM tbl_order WHERE id = '${req.body.order_id}'`)
        // console.log('order_date', order_date);
        // var cart = await mySqlQury(" SELECT * FROM tbl_cart WHERE created_by='"+loginas+','+id+"'");

        addon ? ( Array.isArray(addon) ? addon = addon.join(',') : addon ) : (addon='0')
        const newaddonarry = addon.split(',')
        var price=0
        await Promise.all( 
            newaddonarry.map(async (data, i)=>{
                var x= await mySqlQury("SELECT price FROM tbl_addons WHERE id="+data+"")
               if(x.length > 0){
                return price += x[0].price
               }
               
            })
        )
        console.log(price);

        const old_order_date = await mySqlQury(`SELECT * FROM tbl_order WHERE id = '${req.body.order_id}'`)
        console.log('old_order_date', old_order_date);

        const sub_total = parseFloat(old_order_date[0].sub_total)
        console.log('sub_total', sub_total);

        const tax_amount = ((parseFloat(sub_total) + parseFloat(price) - parseFloat(old_order_date[0].coupon_discount)) * (parseFloat(old_order_date[0].tax) / 100)).toFixed(2)
        console.log('tax_amount', tax_amount);

        const gross_total = (parseFloat(sub_total) + parseFloat(tax_amount) + parseFloat(price) - parseFloat(old_order_date[0].coupon_discount) - parseFloat(old_order_date[0].extra_discount)).toFixed(2)
        console.log('gross_total', gross_total);

        if (gross_total < old_order_date[0].paid_amount) {
            req.flash("error", "gross_total Less-than paid_amount");
            return res.json(400)
        }

        const store_data = await mySqlQury(`SELECT * FROM tbl_store WHERE id = '${old_order_date[0].store_id}'`)
        await mySqlQury("UPDATE tbl_order SET addon_data='"+addon+"', addon_price="+price+", tax_amount =ROUND((sub_total + addon_price - coupon_discount)*tax / 100,2), gross_total = ROUND(sub_total + tax_amount + addon_price - coupon_discount - extra_discount,2), balance_amount = ROUND(gross_total - paid_amount,2), master_comission = ROUND((gross_total * '"+ store_data[0].shop_commission +"') / 100,2)  WHERE id='"+ req.body.order_id +"'");
        // const cartupdate = await mySqlQury("UPDATE tbl_cart SET addon_id='"+addon+"', addon_price="+price+", tax_amount =ROUND((sub_total + addon_price - coupon_discount - extra_discount)*tax / 100,2), gross_total = ROUND(sub_total + tax_amount + addon_price - coupon_discount - extra_discount,2), balance = ROUND(gross_total - paid_amount,2)  WHERE created_by='"+loginas+','+id+"'");

        var order_date = await mySqlQury(`SELECT * FROM tbl_order WHERE id = '${req.body.order_id}'`)
        console.log('order_date', order_date);
        // var cart = await mySqlQury(" SELECT * FROM tbl_cart WHERE created_by='"+loginas+','+id+"'");
        var cartservice = await mySqlQury("SELECT * from tbl_cart_servicelist WHERE find_in_set(tbl_cart_servicelist.id,'"+order_date[0].service_list+"')");


        res.status(200).json({order_date:order_date[0], cartservice, loginas});
    
    } catch (error) {
       console.log(error);
    }
})





// coupon list on ajax call
router.get('/couponlist/:id', auth, async(req, res)=>{
    try {
        const {id,roll,store,loginas} = req.user;
        console.log("loginas" , loginas);
        const couid = req.params.id;
        const customer = await mySqlQury("SELECT store_ID From tbl_customer WHERE id="+couid+"")
        console.log("customer" , customer);
        var customer_order = await mySqlQury("SELECT * From tbl_order WHERE customer_id="+couid+"")
        console.log("customer_order" , customer_order);
        if(customer_order.length > 0){
            var coupons = await mySqlQury("select * from tbl_coupon where start_date <=date(now()) AND end_date >=date(now()) AND status=0 AND find_in_set('"+customer[0].store_ID+"',store_list_id) AND coupon_type=1")
            
            var usedcoupon = customer_order.map(data=>data.coupon_id)
           
            var couponlist = coupons.filter((data,i)=>{
               if (data.limit_forsame_user > usedcoupon.filter(i=>i == data.id).length){
                return true
               }
            })
        }else{
            var couponlist = await mySqlQury("select * from tbl_coupon where start_date <=date(now()) AND end_date >=date(now()) AND status=0 AND find_in_set('"+customer[0].store_ID+"',store_list_id)");  
        }
        
        var cart = await mySqlQury(" SELECT * FROM tbl_cart WHERE created_by='"+loginas+','+id+"'");
        console.log("cart" ,cart );
        console.log("couponlist" ,couponlist );
        res.status(200).json({cart:cart[0], couponlist});
        
    } catch (error) {
        console.log(error);
    }
})




// coupon list on ajax call
router.post('/edit_couponlist', auth, async(req, res)=>{
    try {
        const {id,roll,store,loginas} = req.user;
        console.log("loginas" , loginas);
        const couid = req.body.customer;
        console.log(couid);
        const customer = await mySqlQury("SELECT store_ID From tbl_customer WHERE id="+couid+"")
        console.log("customer" , customer);
        var customer_order = await mySqlQury("SELECT * From tbl_order WHERE customer_id="+couid+"")
        console.log("customer_order" , customer_order);
        if(customer_order.length > 0){
            var coupons = await mySqlQury("select * from tbl_coupon where start_date <=date(now()) AND end_date >=date(now()) AND status=0 AND find_in_set('"+customer[0].store_ID+"',store_list_id) AND coupon_type=1")
            
            var usedcoupon = customer_order.map(data=>data.coupon_id)
            
            var couponlist = coupons.filter((data,i)=>{
               if (data.limit_forsame_user > usedcoupon.filter(i=>i == data.id).length){
                return true
               }
            })
            
        }else{
            
            var couponlist = await mySqlQury("select * from tbl_coupon where start_date <=date(now()) AND end_date >=date(now()) AND status=0 AND find_in_set('"+customer[0].store_ID+"',store_list_id)");  
        }
            

        // var cart = await mySqlQury(" SELECT * FROM tbl_cart WHERE created_by='"+loginas+','+id+"'");
        const order_date = await mySqlQury(`SELECT * FROM tbl_order WHERE id = '${req.body.order_id}'`)
        // console.log("cart" ,cart );
        console.log("couponlist" ,couponlist );
        console.log("order_date" ,order_date );
        res.status(200).json({order_date:order_date[0], couponlist});
        
    } catch (error) {
        console.log(error);
    }
})




// Add coupons to cart
router.get('/couponadd/:id', auth, async(req, res)=>{
    try {
        const {id,roll,store,loginas} = req.user;
        var couponid = req.params.id
      
        var cart = await mySqlQury(" SELECT * FROM tbl_cart WHERE created_by='"+loginas+','+id+"'");
        var coupon = await mySqlQury("select * from tbl_coupon where id="+couponid+"")

        const cartupdate = await mySqlQury("UPDATE tbl_cart SET coupon_id='"+couponid+"', coupon_discount="+coupon[0].discount+", tax_amount =ROUND((sub_total + addon_price - coupon_discount - extra_discount)*tax / 100,2), gross_total = ROUND(sub_total + tax_amount + addon_price - coupon_discount - extra_discount,2), balance = ROUND(gross_total - paid_amount ,2) WHERE created_by='"+loginas+','+id+"'");

        var cart = await mySqlQury(" SELECT * FROM tbl_cart WHERE created_by='"+loginas+','+id+"'");
        var cartservice = await mySqlQury("SELECT * from tbl_cart_servicelist WHERE find_in_set(tbl_cart_servicelist.id,'"+cart[0].service_list_id+"')");
     
        res.status(200).json({cart:cart[0], cartservice, loginas});
    
    } catch (error) {
       console.log(error);
    }
})



// Add coupons to cart
router.post('/edit_couponadd', auth, async(req, res)=>{
    try {
        const {id,roll,store,loginas} = req.user;
        var couponid = req.body.couponid
        console.log(1111, req.body);
      
        // var cart = await mySqlQury(" SELECT * FROM tbl_cart WHERE created_by='"+loginas+','+id+"'");

        var coupon = await mySqlQury("select * from tbl_coupon where id="+couponid+"")

        const old_order_date = await mySqlQury(`SELECT * FROM tbl_order WHERE id = '${req.body.order_id}'`)
        console.log('old_order_date', old_order_date);

        const sub_total = parseFloat(old_order_date[0].sub_total)
        console.log('sub_total', sub_total);
        const tax_amount = ((parseFloat(sub_total) + parseFloat(old_order_date[0].addon_price) - parseFloat(coupon[0].discount)) * (parseFloat(old_order_date[0].tax) / 100)).toFixed(2)
        console.log('tax_amount', tax_amount);
        const gross_total = (parseFloat(sub_total) + parseFloat(tax_amount) + parseFloat(old_order_date[0].addon_price) - parseFloat(coupon[0].discount) - parseFloat(old_order_date[0].extra_discount)).toFixed(2)
        console.log('gross_total', gross_total);

        if (gross_total < old_order_date[0].paid_amount) {
            req.flash("error", "gross_total Less-than paid_amount");
            return res.json(400)
        }

        const store_data = await mySqlQury(`SELECT * FROM tbl_store WHERE id = '${old_order_date[0].store_id}'`)
        await mySqlQury("UPDATE tbl_order SET coupon_id='"+couponid+"', coupon_discount="+coupon[0].discount+", tax_amount =ROUND((sub_total + addon_price - coupon_discount)*tax / 100,2), gross_total = ROUND(sub_total + tax_amount + addon_price - coupon_discount - extra_discount,2), balance_amount = ROUND(gross_total - paid_amount ,2), master_comission = ROUND((gross_total * '"+ store_data[0].shop_commission +"') / 100,2) WHERE id='"+ req.body.order_id +"'");
        // const cartupdate = await mySqlQury("UPDATE tbl_cart SET coupon_id='"+couponid+"', coupon_discount="+coupon[0].discount+", tax_amount =ROUND((sub_total + addon_price - coupon_discount - extra_discount)*tax / 100,2), gross_total = ROUND(sub_total + tax_amount + addon_price - coupon_discount - extra_discount,2), balance = ROUND(gross_total - paid_amount ,2) WHERE created_by='"+loginas+','+id+"'");

        // var cart = await mySqlQury(" SELECT * FROM tbl_cart WHERE created_by='"+loginas+','+id+"'");
        const order_date = await mySqlQury(`SELECT * FROM tbl_order WHERE id = '${req.body.order_id}'`)
        var cartservice = await mySqlQury("SELECT * from tbl_cart_servicelist WHERE find_in_set(tbl_cart_servicelist.id,'"+order_date[0].service_list+"')");

     
        res.status(200).json({order_date:order_date[0], cartservice, loginas});
    
    } catch (error) {
       console.log(error);
    }
})


// Add manual coupons to cart
router.get('/manualcoupon/:id', auth, async(req, res)=>{
    try {
        const {id,roll,store,loginas} = req.user;
        var couponcode = req.params.id.toUpperCase()
       

         var cart = await mySqlQury(" SELECT * FROM tbl_cart WHERE created_by='"+loginas+','+id+"'");
         var coupon = await mySqlQury("select * from tbl_coupon where code='"+couponcode+"'")

         if(coupon.length <= 0){
            return  res.status(200).json({cart:cart[0], status:'error', message:'Invalid coupon code'})
         }else{
            var customer_order = await mySqlQury("SELECT * From tbl_order WHERE customer_id="+cart[0].customer_id+"");

                if(coupon[0].coupon_type == 2 && customer_order.length > 0 ){
                    return  res.status(200).json({cart:cart[0], status:'error', message:'This Coupon Valied Only For first Order'})
                }
            var usedcoupon = customer_order.map(data=>data.coupon_id)
                if(coupon[0].limit_forsame_user <= usedcoupon.filter(i=>i == coupon[0].id).length){
                    return  res.status(200).json({cart:cart[0], status:'error', message:'You reached This coupon use Limit'})
                }
            
                if(coupon[0].min_purchase > (cart[0].sub_total + cart[0].addon_price)){
                    return  res.status(200).json({cart:cart[0], status:'error', message:'min order amount for this coupon is '+ coupon[0].min_purchase})
                }
         }

        const cartupdate = await mySqlQury("UPDATE tbl_cart SET coupon_id='"+coupon[0].id+"', coupon_discount="+coupon[0].discount+", tax_amount =ROUND((sub_total + addon_price - coupon_discount - extra_discount)*tax / 100,2), gross_total = ROUND(sub_total + tax_amount + addon_price - coupon_discount - extra_discount,2), balance = ROUND(gross_total - paid_amount,2)  WHERE created_by='"+loginas+','+id+"'");

        var cart = await mySqlQury(" SELECT * FROM tbl_cart WHERE created_by='"+loginas+','+id+"'");
        var cartservice = await mySqlQury("SELECT * from tbl_cart_servicelist WHERE find_in_set(tbl_cart_servicelist.id,'"+cart[0].service_list_id+"')");

        

        res.status(200).json({cart:cart[0], cartservice, loginas});
    
    } catch (error) {
       console.log(error);
    }
})



// edit manual coupons to cart
router.post('/edit_manualcoupon', auth, async(req, res)=>{
    try {
        const {id,roll,store,loginas} = req.user;
        var couponcode = req.body.code.toUpperCase()
        console.log(2222, req.body);
       
        //  var cart = await mySqlQury(" SELECT * FROM tbl_cart WHERE created_by='"+loginas+','+id+"'");
        const old_order_date = await mySqlQury(`SELECT * FROM tbl_order WHERE id = '${req.body.order_id}'`)

         var coupon = await mySqlQury("select * from tbl_coupon where code='"+couponcode+"'")

        console.log('old_order_date', old_order_date);

        const sub_total = parseFloat(old_order_date[0].sub_total)
        console.log('sub_total', sub_total);
        const tax_amount = ((parseFloat(sub_total) + parseFloat(old_order_date[0].addon_price) - parseFloat(coupon[0].discount)) * (parseFloat(old_order_date[0].tax) / 100)).toFixed(2)
        console.log('tax_amount', tax_amount);
        const gross_total = (parseFloat(sub_total) + parseFloat(tax_amount) + parseFloat(old_order_date[0].addon_price) - parseFloat(coupon[0].discount) - parseFloat(old_order_date[0].extra_discount)).toFixed(2)
        console.log('gross_total', gross_total);

        if (gross_total < old_order_date[0].paid_amount) {
            req.flash("error", "gross_total Less-than paid_amount");
            return res.json(400)
        }

         if(coupon.length <= 0){
            return  res.status(200).json({old_order_date:old_order_date[0], status:'error', message:'Invalid coupon code'})
         }else{
            var customer_order = await mySqlQury("SELECT * From tbl_order WHERE customer_id="+old_order_date[0].customer_id+"");

                if(coupon[0].coupon_type == 2 && customer_order.length > 0 ){
                    return  res.status(200).json({old_order_date:old_order_date[0], status:'error', message:'This Coupon Valied Only For first Order'})
                }
            var usedcoupon = customer_order.map(data=>data.coupon_id)
                if(coupon[0].limit_forsame_user <= usedcoupon.filter(i=>i == coupon[0].id).length){
                    return  res.status(200).json({old_order_date:old_order_date[0], status:'error', message:'You reached This coupon use Limit'})
                }
            
                if(coupon[0].min_purchase > (old_order_date[0].sub_total + old_order_date[0].addon_price)){
                    return  res.status(200).json({old_order_date:old_order_date[0], status:'error', message:'min order amount for this coupon is '+ coupon[0].min_purchase})
                }
         }

         const store_data = await mySqlQury(`SELECT * FROM tbl_store WHERE id = '${old_order_date[0].store_id}'`)
        await mySqlQury("UPDATE tbl_order SET coupon_id='"+coupon[0].id+"', coupon_discount="+coupon[0].discount+", tax_amount =ROUND((sub_total + addon_price - coupon_discount)*tax / 100,2), gross_total = ROUND(sub_total + tax_amount + addon_price - coupon_discount - extra_discount,2), balance_amount = ROUND(gross_total - paid_amount,2), master_comission = ROUND((gross_total * '"+ store_data[0].shop_commission +"') / 100,2) WHERE id='"+ req.body.order_id +"'");
        // const cartupdate = await mySqlQury("UPDATE tbl_cart SET coupon_id='"+coupon[0].id+"', coupon_discount="+coupon[0].discount+", tax_amount =ROUND((sub_total + addon_price - coupon_discount - extra_discount)*tax / 100,2), gross_total = ROUND(sub_total + tax_amount + addon_price - coupon_discount - extra_discount,2), balance = ROUND(gross_total - paid_amount,2)  WHERE created_by='"+loginas+','+id+"'");

        const order_date = await mySqlQury(`SELECT * FROM tbl_order WHERE id='${req.body.order_id}'`)
        // var cart = await mySqlQury(" SELECT * FROM tbl_cart WHERE created_by='"+loginas+','+id+"'");
        var cartservice = await mySqlQury("SELECT * from tbl_cart_servicelist WHERE find_in_set(tbl_cart_servicelist.id,'"+order_date[0].service_list+"')");
        

        res.status(200).json({order_date:order_date[0], cartservice, loginas});
    } catch (error) {
       console.log(error);
    }
})



// payment model require data
router.get('/paymentdata',auth, async (req, res)=>{
    try {
        const {id,roll,store,loginas} = req.user;
        
        var cart = await mySqlQury(" SELECT * FROM tbl_cart WHERE created_by='"+loginas+','+id+"'");
        var payment = await mySqlQury("SELECT id, ac_name From tbl_account WHERE store_ID="+cart[0].store_id+"")
        
        res.status(200).json({cart:cart[0], payment});

    } catch (error) {
        console.log(error);
    }
})



// edit payment model require data
router.post('/edit_paymentdata',auth, async (req, res)=>{
    try {
        const {id,roll,store,loginas} = req.user;
        
        const order_date = await mySqlQury(`SELECT * FROM tbl_order WHERE id = '${req.body.order_id}'`)
        console.log('order_date', order_date);
        // var cart = await mySqlQury(" SELECT * FROM tbl_cart WHERE created_by='"+loginas+','+id+"'");
        var payment = await mySqlQury("SELECT id, ac_name From tbl_account WHERE store_ID="+order_date[0].store_id+"")
        console.log('payment', payment);

        res.status(200).json({order_date:order_date[0], payment});
    } catch (error) {
        console.log(error);
    }
})



//save order
router.post('/order',auth, async(req, res)=>{
    try {
        const {id,roll,store,loginas} = req.user;
        const accessdata = await access (req.user)
        var orderid = await idfororder()
        
        var {deliverydate, extradiscount, paid_amount, note} = req.body;
        
        paid_amount ? paid_amount = paid_amount : paid_amount=0
        extradiscount ? extradiscount =extradiscount : extradiscount =0
        var payment_type = req.body.payment_type
        payment_type ? payment_type : payment_type = 0 
        const cart = await mySqlQury(" SELECT * FROM tbl_cart WHERE created_by='"+loginas+','+id+"'");

        const gross = parseFloat(cart[0].gross_total) - parseFloat(extradiscount)
        const balance = parseFloat(cart[0].gross_total) - parseFloat(extradiscount) - parseFloat(paid_amount)
        const comiss = await mySqlQury("SELECT shop_commission From tbl_store WHERE id="+cart[0].store_id+"")
        const comi_amount = (parseFloat(gross) * parseFloat(comiss[0].shop_commission)) /parseFloat(100)

        let order_date = new Date(cart[0].order_date)
        let order_day = (order_date.getDate() < 10 ? '0' : '') + order_date.getDate()
        let order_month = ((order_date.getMonth()+1) < 10 ? '0' : '') + (order_date.getMonth()+1)
        let order_year = order_date.getFullYear()
        let order_fullDate = `${order_year}-${order_month}-${order_day}`
        
        const order = await mySqlQury(`INSERT INTO tbl_order (order_id,order_date,delivery_date,order_status,service_list,customer_id,created_by,store_id,addon_data,
        addon_price,sub_total,tax,coupon_id,coupon_discount,extra_discount,gross_total,paid_amount,balance_amount,payment_data,tax_amount,note,master_comission) VALUE ('${orderid}',
        '${order_fullDate}','${deliverydate}',${1},'${cart[0].service_list_id}','${cart[0].customer_id}','${cart[0].created_by}','${cart[0].store_id}','${cart[0].addon_id}',
        ${cart[0].addon_price},${cart[0].sub_total},'${cart[0].tax}','${cart[0].coupon_id}',${cart[0].coupon_discount},${extradiscount},${gross},${paid_amount},${balance},
        '${0}',${cart[0].tax_amount},'${note}',${comi_amount})`)

        await mySqlQury(`INSERT INTO tbl_notification (invoice, date, sender, received, notification) VALUE ('${orderid}', '${order_fullDate}', '${accessdata.topbardata.id}', '${cart[0].customer_id}', 'There is a new order registered, please check it.')`)
        await mySqlQury(`INSERT INTO tbl_notification (invoice, date, sender, received, notification) VALUE ('${orderid}', '${order_fullDate}', '${accessdata.topbardata.id}', '${cart[0].store_id}', 'There is a new order registered, please check it.')`)
        await mySqlQury(`INSERT INTO tbl_notification (invoice, date, sender, received, notification) VALUE ('${orderid}', '${order_fullDate}', '${accessdata.topbardata.id}', '1', 'There is a new order registered, please check it.')`)
        
        const paymentdata = await mySqlQury(`INSERT INTO tbl_order_payment (payment_amount,payment_date,payment_account,order_id) VALUE (${paid_amount},'${order_fullDate}',
        '${payment_type}','${order.insertId}')`)

        const updateorder = await mySqlQury(`UPDATE tbl_order SET payment_data='${paymentdata.insertId}' WHERE id='${order.insertId}'`)
        
        const customer_data = await mySqlQury(`SELECT * FROM tbl_customer WHERE id = '${cart[0].customer_id}'`)

        if(payment_type){
            const account = await mySqlQury("SELECT * FROM tbl_account WHERE id="+payment_type+"")
            

            const balance = parseFloat(account[0].balance) + parseFloat(paid_amount)
            await mySqlQury("UPDATE tbl_account SET balance="+balance+" WHERE id="+payment_type+" ")
            const abc = await mySqlQury(`insert into tbl_transections (account_id,store_ID,transec_detail,transec_type,debit_amount,
                credit_amount,balance_amount,date, customer_id) VALUE ('${payment_type}','${account[0].store_ID}','POS Income ${orderid}','INCOME',
                0,${paid_amount},${balance},'${order_fullDate}','${cart[0].customer_id}')`)
        }


        // clear cart

        var orderid = await idfororder()
        var tax = await mySqlQury("SELECT tax_percent FROM tbl_store WHERE id="+cart[0].store_id+"")
      
        await mySqlQury(`UPDATE tbl_cart SET order_date=CURRENT_TIMESTAMP,service_list_id=0,addon_id=0,addon_price=0,delivery_date=CURRENT_TIMESTAMP,extra_discount=0,
        coupon_id=0,coupon_discount=0,tax_amount=0,sub_total=0,gross_total=0,paid_amount=0,payment_type=0, order_id='${orderid}',customer_id='0',
        balance=0,notes='', tax=${tax[0].tax_percent} WHERE created_by='${loginas},${id}'`)


        // data for invoice
        var cartservice = await mySqlQury("SELECT * from tbl_cart_servicelist WHERE find_in_set(tbl_cart_servicelist.id,'"+cart[0].service_list_id+"')");
        var shope = await mySqlQury("SELECT * FROM tbl_store WHERE id="+cart[0].store_id+"")
        var orderdata = await mySqlQury("SELECT * FROM tbl_order WHERE id="+order.insertId+"")
        

        const addon =  orderdata[0].addon_data.split(',')
        if(addon[0] != 0){
            var addonslist = await Promise.all(
                addon.map(async (data, i)=>{
                   var addondata =  await mySqlQury("SELECT * FROM tbl_addons WHERE id="+data+"");
                 
                   return {
                            id:addondata[0].id,
                            name:addondata[0].addon,
                            price:addondata[0].price
                   }
                })
            ) 
            
        }else{
            var addonslist =[]
        }

   
        if(payment_type == 0){
          
            var paymenttype = "No Amount Paid"
  
        }else{

            const payment = await mySqlQury("SELECT ac_name From tbl_account WHERE id="+payment_type+"")
            var paymenttype = payment[0].ac_name

        }
       
         var coust = await mySqlQury("SELECT * From tbl_customer WHERE id="+orderdata[0].customer_id+"")
         

         console.log("orderdata[0]" , orderdata[0]);



        const data = await mySqlQury("SELECT * FROM tbl_email WHERE store_id="+cart[0].store_id+"");
        console.log(111, 'data', data);
        if(data.length > 0){
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
                    to: 'vivekchovatiya1179@gmail.com',
                    subject: 'Email From '+shope[0].name,
                    html: '<!DOCTYPE html>'+
                        '<html><head><title></title>'+
                        '</head><body><div>'+
                        '<h5>Greeting From '+shope[0].name+'</h5>'+
                        '<p> Woo hoo! Your order is on its way. Your order details can be found below. </p>'+
                        '<p>ORDER SUMMARY:</p>'+
                        '<p>Order #: '+ orderid +' </p>'+
                        '<p>Order Date: '+ order_fullDate +' </p>'+
                        '<p>Order Total: '+ gross +' </p>'+
                        '<br>'+
                        '<p> We hope you enjoyed your shopping experience with us and that you will visit us again soon. </p>'+
                        '</div><div style="display: list-item;">'+
                        '<p>Best from :</p>'+
                        '<span style="margin-bottom:0">'+shope[0].mobile_number+'</span><br>'+
                        '<span style="margin-bottom:0">'+shope[0].store_email+'</span><br>'+
                        '<span style="margin-bottom:0">'+shope[0].city+'</span><br>'+
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
         
        console.log(333, coust);
        if (coust[0].name != 'Walk in customer') {

            // ========= sms ============ //

            let tsid = accessdata.masterstore.twilio_sid
            let ttoken = accessdata.masterstore.twilio_auth_token

            if (tsid && ttoken) {
                
                let ACCOUNT_SID = accessdata.masterstore.twilio_sid
                let AUTH_TOKEN = accessdata.masterstore.twilio_auth_token
                const client_sms = require('twilio')(ACCOUNT_SID, AUTH_TOKEN);
                
                client_sms.messages
                .create({
                    body: `We have successfully processed your order and it is now en route to the destination. Thank you for using our services, we appreciate your business!`,
                    from: accessdata.masterstore.twilio_phone_no,
                    to: customer_data[0].number
                })
                .then(message => console.log(message.sid))
                .catch((e) => {
                    req.flash("error", "Message not occurred!");
                })
            }

        }   
        
        // ----------- Notification ------------ //

        if (accessdata.masterstore.onesignal_app_id) {
            
            let message = {
                app_id: accessdata.masterstore.onesignal_app_id,
                contents: {"en": "There is a new order registered, please check it."},
                headings: {"en": 'laundry'},
                included_segments: ["Subscribed Users"],
                filters: [
                    {"field": "tag", "key": "subscription_user_Type", "relation": "=", "value": 'master'},
                    {"operator": "AND"}, {"field": "tag", "key": "Login_ID", "relation": "=", "value": '1'}
                ]
            }
            sendNotification(message);
    
            let customer_message = {
                app_id: accessdata.masterstore.onesignal_app_id,
                contents: {"en": "There is a new order registered, please check it."},
                headings: {"en": 'laundry'},
                included_segments: ["Subscribed Users"],
                filters: [
                    {"field": "tag", "key": "subscription_user_Type", "relation": "=", "value": accessdata.logas},
                    {"operator": "AND"}, {"field": "tag", "key": "Login_ID", "relation": "=", "value": accessdata.topbardata.id}
                ]
            }
            sendNotification(customer_message);
        }


        res.status(200).json({status:"success",cartservice, shope:shope[0],order:orderdata[0],addonslist ,paymenttype, customer:coust[0]})
    } catch (error) {
        console.log("error" , error);
    }
})

router.post("/posprint", auth, async(req, res)=>{
    try {
        const {id,roll,store,loginas} = req.user;
        const accessdata = await access (req.user)
        var orderid = await idfororder()
        
        var {deliverydate, extradiscount, paid_amount, note} = req.body;
        
        paid_amount ? paid_amount = paid_amount : paid_amount=0
        extradiscount ? extradiscount =extradiscount : extradiscount =0
        var payment_type = req.body.payment_type
        payment_type ? payment_type : payment_type = 0 
        const cart = await mySqlQury(" SELECT * FROM tbl_cart WHERE created_by='"+loginas+','+id+"'");

        const gross = parseFloat(cart[0].gross_total) - parseFloat(extradiscount)
        const balance = parseFloat(cart[0].gross_total) - parseFloat(extradiscount) - parseFloat(paid_amount)
        const comiss = await mySqlQury("SELECT shop_commission From tbl_store WHERE id="+cart[0].store_id+"")
        const comi_amount = (parseFloat(gross) * parseFloat(comiss[0].shop_commission)) /parseFloat(100)

        let order_date = new Date(cart[0].order_date)
        let order_day = (order_date.getDate() < 10 ? '0' : '') + order_date.getDate()
        let order_month = ((order_date.getMonth()+1) < 10 ? '0' : '') + (order_date.getMonth()+1)
        let order_year = order_date.getFullYear()
        let order_fullDate = `${order_year}-${order_month}-${order_day}`
        
        const order = await mySqlQury(`INSERT INTO tbl_order (order_id,order_date,delivery_date,order_status,service_list,customer_id,created_by,store_id,addon_data,
        addon_price,sub_total,tax,coupon_id,coupon_discount,extra_discount,gross_total,paid_amount,balance_amount,payment_data,tax_amount,note,master_comission) VALUE ('${orderid}',
        '${order_fullDate}','${deliverydate}',${1},'${cart[0].service_list_id}','${cart[0].customer_id}','${cart[0].created_by}','${cart[0].store_id}','${cart[0].addon_id}',
        ${cart[0].addon_price},${cart[0].sub_total},'${cart[0].tax}','${cart[0].coupon_id}',${cart[0].coupon_discount},${extradiscount},${gross},${paid_amount},${balance},
        '${0}',${cart[0].tax_amount},'${note}',${comi_amount})`)

        await mySqlQury(`INSERT INTO tbl_notification (invoice, date, sender, received, notification) VALUE ('${orderid}', '${order_fullDate}', '${accessdata.topbardata.id}', '${cart[0].customer_id}', 'There is a new order registered, please check it.')`)
        await mySqlQury(`INSERT INTO tbl_notification (invoice, date, sender, received, notification) VALUE ('${orderid}', '${order_fullDate}', '${accessdata.topbardata.id}', '${cart[0].store_id}', 'There is a new order registered, please check it.')`)
        await mySqlQury(`INSERT INTO tbl_notification (invoice, date, sender, received, notification) VALUE ('${orderid}', '${order_fullDate}', '${accessdata.topbardata.id}', '1', 'There is a new order registered, please check it.')`)
        
        const paymentdata = await mySqlQury(`INSERT INTO tbl_order_payment (payment_amount,payment_date,payment_account,order_id) VALUE (${paid_amount},'${order_fullDate}',
        '${payment_type}','${order.insertId}')`)

        const updateorder = await mySqlQury(`UPDATE tbl_order SET payment_data='${paymentdata.insertId}' WHERE id='${order.insertId}'`)
        
        const customer_data = await mySqlQury(`SELECT * FROM tbl_customer WHERE id = '${cart[0].customer_id}'`)

        if(payment_type){
            const account = await mySqlQury("SELECT * FROM tbl_account WHERE id="+payment_type+"")
            

            const balance = parseFloat(account[0].balance) + parseFloat(paid_amount)
            await mySqlQury("UPDATE tbl_account SET balance="+balance+" WHERE id="+payment_type+" ")
            const abc = await mySqlQury(`insert into tbl_transections (account_id,store_ID,transec_detail,transec_type,debit_amount,
                credit_amount,balance_amount,date, customer_id) VALUE ('${payment_type}','${account[0].store_ID}','POS Income ${orderid}','INCOME',
                0,${paid_amount},${balance},'${order_fullDate}', '${cart[0].customer_id}' )`)
        }


        // clear cart

        var orderid = await idfororder()
        var tax = await mySqlQury("SELECT tax_percent FROM tbl_store WHERE id="+cart[0].store_id+"")
      
        await mySqlQury(`UPDATE tbl_cart SET order_date=CURRENT_TIMESTAMP,service_list_id=0,addon_id=0,addon_price=0,delivery_date=CURRENT_TIMESTAMP,extra_discount=0,
        coupon_id=0,coupon_discount=0,tax_amount=0,sub_total=0,gross_total=0,paid_amount=0,payment_type=0, order_id='${orderid}',customer_id='0',
        balance=0,notes='', tax=${tax[0].tax_percent} WHERE created_by='${loginas},${id}'`)


        // data for invoice
        var cartservice = await mySqlQury("SELECT * from tbl_cart_servicelist WHERE find_in_set(tbl_cart_servicelist.id,'"+cart[0].service_list_id+"')");
        var shope = await mySqlQury("SELECT * FROM tbl_store WHERE id="+cart[0].store_id+"")

        var orderdata = await mySqlQury(`SELECT ord.*, COALESCE(tbl_orderstatus.status, "") as orderStatus  
                                        FROM tbl_order as ord
                                        join tbl_orderstatus on ord.order_status = tbl_orderstatus.id
                                        WHERE ord.id= "${order.insertId}"`)
        

        const addon =  orderdata[0].addon_data.split(',')
        if(addon[0] != 0){
            var addonslist = await Promise.all(
                addon.map(async (data, i)=>{
                   var addondata =  await mySqlQury("SELECT * FROM tbl_addons WHERE id="+data+"");
                 
                   return {
                            id:addondata[0].id,
                            name:addondata[0].addon,
                            price:addondata[0].price
                   }
                })
            ) 
            
        }else{
            var addonslist =[]
        }

   
        if(payment_type == 0){
          
            var paymenttype = "No Amount Paid"
  
        }else{

            const payment = await mySqlQury("SELECT ac_name From tbl_account WHERE id="+payment_type+"")
            var paymenttype = payment[0].ac_name

        }
       
        var coust = await mySqlQury("SELECT * From tbl_customer WHERE id="+orderdata[0].customer_id+"")

        const data = await mySqlQury("SELECT * FROM tbl_email WHERE store_id="+cart[0].store_id+"");
        
        if(data.length > 0){
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
                    to: 'vivekchovatiya1179@gmail.com',
                    subject: 'Email From '+shope[0].name,
                    html: '<!DOCTYPE html>'+
                        '<html><head><title></title>'+
                        '</head><body><div>'+
                        '<h5>Greeting From '+shope[0].name+'</h5>'+
                        '<p> Woo hoo! Your order is on its way. Your order details can be found below. </p>'+
                        '<p>ORDER SUMMARY:</p>'+
                        '<p>Order #: '+ orderid +' </p>'+
                        '<p>Order Date: '+ order_fullDate +' </p>'+
                        '<p>Order Total: '+ gross +' </p>'+
                        '<br>'+
                        '<p> We hope you enjoyed your shopping experience with us and that you will visit us again soon. </p>'+
                        '</div><div style="display: list-item;">'+
                        '<p>Best from :</p>'+
                        '<span style="margin-bottom:0">'+shope[0].mobile_number+'</span><br>'+
                        '<span style="margin-bottom:0">'+shope[0].store_email+'</span><br>'+
                        '<span style="margin-bottom:0">'+shope[0].city+'</span><br>'+
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
         
        if (coust[0].name != 'Walk in customer') {

            // ========= sms ============ //

            let tsid = accessdata.masterstore.twilio_sid
            let ttoken = accessdata.masterstore.twilio_auth_token

            if (tsid && ttoken) {
                
                let ACCOUNT_SID = accessdata.masterstore.twilio_sid
                let AUTH_TOKEN = accessdata.masterstore.twilio_auth_token
                const client_sms = require('twilio')(ACCOUNT_SID, AUTH_TOKEN);
                
                client_sms.messages
                .create({
                    body: `We have successfully processed your order and it is now en route to the destination. Thank you for using our services, we appreciate your business!`,
                    from: accessdata.masterstore.twilio_phone_no,
                    to: customer_data[0].number
                })
                .then(message => console.log(message.sid))
                .catch((e) => {
                    req.flash("error", "Message not occurred!");
                })
            }

        }   
        
        // ----------- Notification ------------ //

        if (accessdata.masterstore.onesignal_app_id) {
            
            let message = {
                app_id: accessdata.masterstore.onesignal_app_id,
                contents: {"en": "There is a new order registered, please check it."},
                headings: {"en": 'laundry'},
                included_segments: ["Subscribed Users"],
                filters: [
                    {"field": "tag", "key": "subscription_user_Type", "relation": "=", "value": 'master'},
                    {"operator": "AND"}, {"field": "tag", "key": "Login_ID", "relation": "=", "value": '1'}
                ]
            }
            sendNotification(message);
    
            let customer_message = {
                app_id: accessdata.masterstore.onesignal_app_id,
                contents: {"en": "There is a new order registered, please check it."},
                headings: {"en": 'laundry'},
                included_segments: ["Subscribed Users"],
                filters: [
                    {"field": "tag", "key": "subscription_user_Type", "relation": "=", "value": accessdata.logas},
                    {"operator": "AND"}, {"field": "tag", "key": "Login_ID", "relation": "=", "value": accessdata.topbardata.id}
                ]
            }
            sendNotification(customer_message);
        }

        let oate = new Date(orderdata[0].order_date).toLocaleDateString('en-CA')
        let ddate = new Date(orderdata[0].delivery_date).toLocaleDateString('en-CA')
        
        res.render('posprint', {
            cartservice, shope:shope[0], order:orderdata[0], addonslist, paymenttype, customer:coust[0], master:accessdata.masterstore, oate, ddate, accessdata
        })
    } catch (error) {
        console.log(error);
    }
})





router.get('/notification', auth, async(req, res) => {
    try {
        const {id,roll,store,loginas} = req.user;
        const accessdata = await access (req.user)
        console.log('accessdata', accessdata);

        const notification_data = await mySqlQury(`SELECT * FROM tbl_notification WHERE received = '${accessdata.topbardata.id}'`)

        const order_date = await mySqlQury(`SELECT * FROM tbl_order`)
        
        res.render('notification', {
            accessdata, notification_data, order_date, language:req.language_data, language_name:req.language_name
        })
    } catch (error) {
        console.log(error);
    }
})



module.exports = router