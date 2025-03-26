const express = require('express');
const {mySqlQury} = require('../middelwer/db');
const router = express.Router();
const jwt = require('jsonwebtoken');
const auth = require('../middelwer/auth');
const {upload} = require('../middelwer/multer');
const access = require('../middelwer/access');
const countryCodes = require('country-codes-list')


router.get('/', async (req, res)=>{
    const masterstore = await mySqlQury("SELECT * FROM tbl_master_shop where id=1");
   
    res.render('login',{data:masterstore[0]})
})

// login post router
router.post('/login', async (req, res)=>{
    try {
        // await mySqlQury("UPDATE tbl_admin SET approved = 1 WHERE id=34") 
        const {username,password, loginas} = req.body;
        // console.log('loginas', loginas);

        if(loginas == 0){   
            var qury = "SELECT * FROM tbl_customer WHERE username='"+username+"' AND delet_flage=0 AND approved=1"
        }else{
            var qury = "SELECT * FROM tbl_admin WHERE username='"+username+"' AND delet_flage=0 AND approved=1"
        }
        
        const data = await mySqlQury(qury);
        // console.log(111111, data);
        
        if(data.length == 0){
            req.flash("error", "Wrong user name!!!!");
            return res.redirect('back')
        }
        
        if(data[0].password !== password){
            req.flash("error", "Wrong Password!!!!");
            return res.redirect('back')
        }

        if(loginas == 0){   
            var token = await jwt.sign({id:data[0].id, roll:0, store:data[0].store_ID,loginas }, process.env.TOKEN_KEY)
        }else{
            var token = await jwt.sign({id:data[0].id, roll:data[0].roll_id, store:data[0].store_ID,loginas }, process.env.TOKEN_KEY)
        }

        res.cookie('webtoken', token, {
            expires:new Date(Date.now() + 1000*60*60),
            httpOnly: true
        })

        const lang = req.cookies.lang

        if (lang == undefined) {
            const lang_data = jwt.sign({lang : 'en'}, process.env.TOKEN)
            res.cookie("lang", lang_data)
        }
        
        req.flash("success", `${data[0].name}, Welcome back!!`);
        if(loginas == 0){
            res.redirect('/admin/pos')
        }else{
            res.redirect('/index')
        }
        
    } catch (error) {
        console.log(error);
    }
   
})

// customer register render router
router.get('/register', async (req, res)=>{
    const data = await mySqlQury("SELECT type FROM tbl_master_shop");
    const masterstore = await mySqlQury("SELECT * FROM tbl_master_shop where id=1");

    const Country_name = countryCodes.customList('countryCode', '{countryCode}')
    const nameCode = Object.values(Country_name)

    const myCountryCodesObject = countryCodes.customList('countryCode', '+{countryCallingCode}')
    const CountryCode = Object.values(myCountryCodesObject)

    if(data[0].type == 1){
        const storeList = await mySqlQury("SELECT id,name FROM tbl_store WHERE status= 1");
       
        res.render('register',{
            multiy: true,
            store:storeList,
            data:masterstore[0], nameCode, CountryCode
        })
    }else{
        res.render('register',{
            multiy: false, store:[], data:masterstore[0], nameCode, CountryCode
        })
    }  
});

// store register render router
router.get('/shopregister', async (req, res)=>{
    const masterstore = await mySqlQury("SELECT * FROM tbl_master_shop where id=1");
    const Country_name = countryCodes.customList('countryCode', '{countryCode}')
    const nameCode = Object.values(Country_name)

    const myCountryCodesObject = countryCodes.customList('countryCode', '+{countryCallingCode}')
    const CountryCode = Object.values(myCountryCodesObject)
    res.render('shop_self_register',{data:masterstore[0], nameCode, CountryCode})
});

// customer register post router
router.post('/register', async (req, res)=>{
    try {
        const { name, number, email, taxnumber, address, username, password, store} = req.body;
        const check_number = await mySqlQury("SELECT * FROM tbl_customer WHERE number='"+number+"'");
        if(check_number.length > 0){
            req.flash("error", "This Mobile Number Alredy Register!!!!");
            return res.redirect('back')
        }

        const check_username = await mySqlQury("SELECT * FROM tbl_customer WHERE username='"+username+"'");
        if(check_username.length > 0){
            req.flash("error", "This UserName Alredy Register!!!!");
            return res.redirect('back')
        }

        const autoApproval = await mySqlQury("SELECT customer_autoapprove FROM tbl_master_shop where id=1")
        if(autoApproval[0].customer_autoapprove == 1){
            var approved = 1
        }else{
            var approved = 0
        }
            
        if(store){
            var qury = "INSERT INTO tbl_customer (name,number,email,address,taxnumber,username,password,approved,store_ID) VALUE ('"+name+"','"+number+"','"+email+"','"+address+"','"+taxnumber+"','"+username+"','"+password+"',"+approved+",'"+store+"')"
        }else{
            var qury = "INSERT INTO tbl_customer (name,number,email,address,taxnumber,username,password,approved) VALUE ('"+name+"','"+number+"','"+email+"','"+address+"','"+taxnumber+"','"+username+"','"+password+"',"+approved+")"
        }

        const data = await mySqlQury(qury);
        req.flash("success", "Your information will be sent to the administration for approval.!");
        res.redirect('/')
    } catch (error) {
        console.log(error);
    }
})

// store register post router
router.post('/shopregister',upload.single('logo'), async (req, res)=>{
    try {
        const {name, number, store_email, state, city, tax_number, username, password, commission,taxpercent,country,district,zip_code,address} = req.body;
        const checkname = await mySqlQury("SELECT * FROM tbl_store WHERE name='"+name+"'");
        if(checkname.length > 0){
            req.flash("error", "This Store Name Alredy Register!!!!");
            return res.redirect('back')
        }

        const checknumber= await mySqlQury("SELECT * FROM tbl_store WHERE mobile_number='"+number+"'");
        if(checknumber.length > 0){
            req.flash("error", "This Number Alredy Register!!!!");
            return res.redirect('back')
        }

        const checkstore_email = await mySqlQury("SELECT * FROM tbl_store WHERE store_email='"+store_email+"'");
        if(checkstore_email.length > 0){
            req.flash("error", "This Email Alredy Register!!!!");
            return res.redirect('back')
        }

        var logo = req.file.filename
        const autoApproval = await mySqlQury("SELECT store_autoapprove,storeroll FROM tbl_master_shop where id=1")
        if(autoApproval[0].store_autoapprove == 1){
            var roll =autoApproval[0].storeroll
            var approved = 1
        }else{
            var approved = 0
            var roll = 0
        }

        const admindata = await mySqlQury("INSERT INTO tbl_admin (name,number,email,username,password,roll_id) VALUE ('"+name+"','"+number+"','"+store_email+"','"+username+"','"+password+"',"+roll+")");
    
        var newid = admindata.insertId
        /*const qury = `INSERT INTO tbl_store (name,logo,mobile_number,username,password,shop_commission,tax_percent,country,state,city,district,zipcode,store_email,store_tax_number,address,admin_id,status) 
        VALUE ('${name}','${logo}','${number}','${username}','${password}',${0},${0},' ','${state}','${city}',' ',' ','${store_email}',
        '${tax_number}',' ',${newid},'${approved}')`*/
         const qury = `INSERT INTO tbl_store (name,logo,mobile_number,username,password,shop_commission,tax_percent,country,state,city,district,zipcode,store_email,store_tax_number,address,admin_id,status,roll_id) 
        VALUE ('${name}','${logo}','${number}','${username}','${password}',${0},${0},' ','${state}','${city}',' ',' ','${store_email}',
        '${tax_number}',' ',${newid},'${approved}','${roll}')`
        const storedata = await mySqlQury(qury);

        const admndata = await mySqlQury("UPDATE tbl_admin SET store_ID="+storedata.insertId+" ,roll_id="+roll+",approved= 1 WHERE id="+newid+"")

        const customer_data = await mySqlQury(`SELECT * FROM tbl_store WHERE name = '${name}'`)
        console.log('customer_data', customer_data);
        await mySqlQury(`INSERT INTO tbl_customer (name, store_ID, reffstore, approved, delet_flage) VALUE ('Walk in customer', '${customer_data[0].id}', '1', '1', '0')`)

        req.flash("success", "Your information will be sent to the administration for approval.!");
        res.redirect('/')
    } catch (error) {
        console.log(error);
    } 
})

// home page
router.get('/index',auth,  async (req, res)=>{
    const {id,roll,store,loginas} = req.user;

    const accessdata = await access (req.user)
    // console.log("accessdata" , accessdata);

    const rolldetail = await mySqlQury("select id,roll,orders from tbl_roll where id = "+roll+"");

    // console.log("rolldetail" , rolldetail);
    // const totalsele = await mySqlQury("SELECT (SELECT SUM(gross_total) FROM tbl_order) as tottalsales, (select count(*) FROM tbl_store WHERE status =1) as totalstore, (select count(*) FROM tbl_services WHERE status =0) as totalservices, (select count(*) FROM tbl_customer WHERE approved =1) as totalcustomer ");
    // const recentOrder = await mySqlQury(`SELECT tbl_order.order_id,tbl_order.id,tbl_order.gross_total,tbl_order.paid_amount,tbl_order.order_status,tbl_customer.name as customer,tbl_orderstatus.status,tbl_store.name as store FROM tbl_order join tbl_customer on tbl_order.customer_id=tbl_customer.id join
    // tbl_orderstatus on tbl_order.order_status=tbl_orderstatus.id join tbl_store on tbl_order.store_id=tbl_store.id ORDER BY tbl_order.id DESC limit 5`)
    

    var qury = `SELECT id, order_date, gross_total FROM tbl_order`
    const order = await mySqlQury(qury)
    let orderfunction = await groupOrdersByYearAndMonth(order)
    let countorder = orderfunction.totorder
    let countsales = orderfunction.totsales

    if (roll == 1) { 
        
        const totalsele = await mySqlQury("SELECT (SELECT SUM(gross_total) FROM tbl_order) as tottalsales, (select count(*) FROM tbl_order) as totalorder, (select count(*) FROM tbl_services) as totalservices, (select count(*) FROM tbl_customer) as totalcustomer ");
        const recentOrder = await mySqlQury(`SELECT tbl_order.order_id,tbl_order.id,tbl_order.gross_total,tbl_order.paid_amount,tbl_order.store_id,tbl_order.order_status,tbl_customer.name as customer,tbl_orderstatus.status,tbl_store.name as store FROM tbl_order join tbl_customer on tbl_order.customer_id=tbl_customer.id join
        tbl_orderstatus on tbl_order.order_status=tbl_orderstatus.id join tbl_store on tbl_order.store_id=tbl_store.id ORDER BY tbl_order.id DESC limit 5`)
        // console.log("req.language_data" , req.language_data);
        res.render('index',{accessdata, data:totalsele[0], recentOrder, roll:rolldetail[0], language:req.language_data, language_name:req.language_name, countorder, countsales})
        
    } else {

        const totalsele = await mySqlQury("SELECT (SELECT SUM(gross_total) FROM tbl_order WHERE store_id = "+store+") as tottalsales, (select count(*) FROM tbl_order WHERE store_id = "+store+") as totalorder, (select count(*) FROM tbl_services WHERE store_id = "+store+") as totalservices, (select count(*) FROM tbl_customer WHERE store_id = "+store+") as totalcustomer ");
        const recentOrder = await mySqlQury(`SELECT tbl_order.order_id,tbl_order.id,tbl_order.gross_total,tbl_order.paid_amount,tbl_order.store_id,tbl_order.order_status,tbl_customer.name as customer,tbl_orderstatus.status,tbl_store.name as store FROM tbl_order join tbl_customer on tbl_order.customer_id=tbl_customer.id join
        tbl_orderstatus on tbl_order.order_status=tbl_orderstatus.id join tbl_store on tbl_order.store_id=tbl_store.id WHERE tbl_store.id = "${store}" ORDER BY tbl_order.id DESC limit 5`)
        // console.log("req.language_data" , req.language_data);
        res.render('index',{accessdata, data:totalsele[0], recentOrder, roll:rolldetail[0], language:req.language_data, language_name:req.language_name, countorder, countsales})
    }
})

// async function groupSalesByYearAndMonth(orders) {
//     const groupedOrders = [];
//     let totorder = ""
  
//     orders.forEach(order => {
//         const orderDate = new Date(order.order_date);
//         const year = orderDate.getFullYear();
//         const month = orderDate.getMonth() + 1;
  
//         let yearGroup = groupedOrders.find(item => item.year === year);
//         if (!yearGroup) {
//             yearGroup = { year: year, months: [] };
//             groupedOrders.push(yearGroup);
//         }
  
//         let monthGroup = yearGroup.months.find(item => item.month === month);
//         if (!monthGroup) {
//             monthGroup = { month: month, orders: [] };
//             yearGroup.months.push(monthGroup);
//         }
  
//         monthGroup.orders.push(order);
//     });

//     groupedOrders.forEach(yearGroup => {
//         let totmonth = ""
//         yearGroup.months.forEach((monthGroup, index) => {
//             let tm = monthGroup.month, to = monthGroup.orders.length
//             monthGroup.totalOrders = to;
//             totmonth += totmonth == "" ? `${tm}#${to}` : `@${tm}#${to}`
//             delete monthGroup.orders;
//         });

//         totorder += totorder == "" ? yearGroup.year + "&!" + totmonth : "&&!" + yearGroup.year + "&!" + totmonth
//     });
  
//     return totorder;
// }



// separate year and month wise
async function groupOrdersByYearAndMonth(orders) {
    const groupedOrders = [];
    let totorder = "", totsales = ""
  
    orders.forEach(order => {
        const orderDate = new Date(order.order_date);
        const year = orderDate.getFullYear();
        const month = orderDate.getMonth() + 1;
  
        let yearGroup = groupedOrders.find(item => item.year === year);
        if (!yearGroup) {
            yearGroup = { year: year, months: [] };
            groupedOrders.push(yearGroup);
        }
  
        let monthGroup = yearGroup.months.find(item => item.month === month);
        if (!monthGroup) {
            monthGroup = { month: month, orders: [] };
            yearGroup.months.push(monthGroup);
        }
  
        monthGroup.orders.push(order);
    });

    groupedOrders.forEach(yearGroup => {
        let totmonth = "", totmonsales = ""
        yearGroup.months.forEach((monthGroup, index) => {
            let tm = monthGroup.month, to = monthGroup.orders.length, gtotal = 0
            monthGroup.totalOrders = to;
            
            totmonth += totmonth == "" ? `${tm}#${to}` : `@${tm}#${to}`

            monthGroup.orders.forEach(gross => {
                gtotal += parseFloat(gross.gross_total)
            })
            totmonsales += totmonsales == "" ? `${tm}#${gtotal.toFixed(0)}` : `@${tm}#${gtotal.toFixed(0)}`

            delete monthGroup.orders;
        });

        totorder += totorder == "" ? yearGroup.year + "&!" + totmonth : "&&!" + yearGroup.year + "&!" + totmonth
        totsales += totsales == "" ? yearGroup.year + "&!" + totmonsales : "&&!" + yearGroup.year + "&!" + totmonsales
    });
  
    return {totorder, totsales};
}



router.get('/profile',auth, async (req, res)=>{
    try {
        const {id,roll,store,loginas} = req.user;
        const accessdata = await access(req.user);

        res.render('profile',{accessdata, language:req.language_data, language_name:req.language_name})
    } catch (error) {
        console.log(error);
    }

})

router.post('/updatecustompro', auth, async(req, res)=>{
    try {
        const {id,roll,store,loginas} = req.user;
        const { name,number,email,username,password} = req.body

        const check_number = await mySqlQury("SELECT * FROM tbl_customer WHERE number='"+number+"' AND id !="+id+"");
        if(check_number.length > 0){
            req.flash("error", "This Mobile Number Alredy Register!!!!");
            return res.redirect('back')
        }

        const check_username = await mySqlQury("SELECT * FROM tbl_customer WHERE username='"+username+"' AND id !="+id+"");
        if(check_username.length > 0){
            req.flash("error", "This UserName Alredy Register!!!!");
            return res.redirect('back')
        }
      
        await mySqlQury(`UPDATE tbl_customer SET name='${name}',number='${number}',email='${email}',username='${username}',password='${password}' 
        WHERE id=${id}`)

        res.redirect('back')
    } catch (error) {
        console.log(error);
    }
})

router.post('/updatestaff', auth,upload.single('image'), async (req, res)=>{
    try {
        const {id,roll,store,loginas} = req.user;
        const { name,number,email,username,password} = req.body

        const checkname = await mySqlQury("SELECT * FROM tbl_admin WHERE username='"+username+"' AND id !="+id+"");
        if(checkname.length > 0){
            req.flash("error", "This User Name Alredy Register!!!!");
            return res.redirect('back')
        }

        const checknumber= await mySqlQury("SELECT * FROM tbl_admin WHERE number='"+number+"' AND id !="+id+"");
       
        if(checknumber.length > 0){
            req.flash("error", "This Number Alredy Register!!!!");
            return res.redirect('back')
        }

        const checkstore_email = await mySqlQury("SELECT * FROM tbl_admin WHERE email='"+email+"' AND id !="+id+"");
        if(checkstore_email.length > 0){
            req.flash("error", "This Email Alredy Register!!!!");
            return res.redirect('back')
        }

        if(req.file){

            await mySqlQury(`UPDATE tbl_admin SET name='${name}',number='${number}',email='${email}',username='${username}',
            password='${password}',img='${req.file.filename}' WHERE id='${id}'`)
        }else {
            
            await mySqlQury(`UPDATE tbl_admin SET name='${name}',number='${number}',email='${email}',username='${username}',
            password='${password}' WHERE id='${id}'`)
        }

        req.flash("success", "Profile Detail Update!!!!");
        return res.redirect('back')
    } catch (error) {
        console.log(error);
    }
} )

//logout get router
router.get('/logout',auth , async (req, res)=>{

    res.clearCookie('webtoken');
    res.clearCookie('lang');

    res.redirect('/');
})



// =========== lang ============= //

router.get("/lang/:id", async(req, res) => {
    try {
        const token = jwt.sign({lang : req.params.id}, process.env.TOKEN)
        res.cookie("lang", token)
        
        res.status(200).json({token})
    } catch (error) {
        console.log(error);
    }
})


module.exports = router

