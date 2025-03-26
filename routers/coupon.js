const express = require('express');
const {mySqlQury} = require('../middelwer/db');
const router = express.Router();
const auth = require('../middelwer/auth');
const {upload} = require('../middelwer/multer');
const access = require('../middelwer/access')

router.get('/list', auth, async (req, res)=>{
    try {
        const {id,roll,store,loginas} = req.user;
        const accessdata = await access (req.user)

        if(loginas == 0){ req.flash("error", "Your Are Not Authorized For this");
        return res.redirect('back')}
        const rolldetail = await mySqlQury("select id,roll,coupon from tbl_roll where id = "+roll+"");
                if(rolldetail[0].roll === "master_Admin"){
                   
                    const multiy = await mySqlQury("SELECT type FROM tbl_master_shop");
                    if(multiy[0].type == 1){
                        var mlty = true
                    }else{
                        var mlty = false
                    }
                    const storeList = await mySqlQury("SELECT id,name FROM tbl_store WHERE status=1 AND delete_flage=0");
                    const couponList = await mySqlQury("SELECT tbl_coupon.*,(SELECT GROUP_CONCAT(`name`) from `tbl_store` WHERE find_in_set(tbl_store.id,tbl_coupon.store_list_id)) as storeList FROM tbl_coupon");

                    res.render('coupon',{mlty,isadmin:true, storeList,couponList,accessdata, language:req.language_data, language_name:req.language_name})

                }else if( rolldetail[0].coupon.includes('read')){
                   
                    
                    const couponList = await mySqlQury("SELECT * FROM tbl_coupon WHERE find_in_set('"+store+"',tbl_coupon.store_list_id);");
                  
                    res.render('coupon',{mlty:false,isadmin:false, storeList:[],couponList,accessdata, language:req.language_data, language_name:req.language_name})

                }else{

                    req.flash("error", "Your Are Not Authorized For this");
                    return res.redirect('back')
                }
 
    } catch (error) {
        console.log(error);
    }
})

router.post('/add', auth, async (req, res)=>{
    
    try {
        const {id,roll,store,loginas} = req.user;
        if(loginas == 0){ req.flash("error", "Your Are Not Authorized For this");
        return res.redirect('back')}
        const rolldetail = await mySqlQury("select id,roll,coupon from tbl_roll where id = "+roll+"");
                if(rolldetail[0].roll === "master_Admin"){
                   var {coupon_titel, coupon_code, coupon_type, coupon_limit, coupon_start_date, coupon_end_date, coupon_purchase, coupon_discount_amount, storelist} = req.body;
                   storelist ? (Array.isArray(storelist) ? storelist=storelist.join(','):storelist):(storelist=1)

                    const samecoupon = await mySqlQury("SELECT * FROM tbl_coupon WHERE code = '"+coupon_code+"' ");
                    if(samecoupon.length > 0 ){
                        req.flash("error", "This Coupon Code Alredy Resister");
                        return res.redirect('back')
                    }

                   var qury = `INSERT INTO tbl_coupon (titel,code,min_purchase,discount,start_date,end_date,store_list_id,coupon_type,limit_forsame_user)
                   VALUE ('${coupon_titel}','${coupon_code}',${coupon_purchase},${coupon_discount_amount},'${coupon_start_date}','${coupon_end_date}',
                   '${storelist}','${coupon_type}', ${coupon_limit})`
                   var coupondata = await mySqlQury(qury);

                   req.flash("success", "New Coupon Added!");
                   res.redirect('back')

                }else{

                    req.flash("error", "Your Are Not Authorized For this");
                    return res.redirect('back')
                }
 
    } catch (error) {
        console.log(error);
    }
});

router.get('/delete/:id', auth, async (req, res)=>{
    
    try {
        const {id,roll,store,loginas} = req.user;
        if(loginas == 0){ req.flash("error", "Your Are Not Authorized For this");
        return res.redirect('back')}
        const rolldetail = await mySqlQury("select id,roll,coupon from tbl_roll where id = "+roll+"");
                if(rolldetail[0].roll === "master_Admin"){
                  var dataid = req.params.id
                   var qury = ` DELETE FROM  tbl_coupon WHERE id = ${dataid}`
                   var coupondata = await mySqlQury(qury);

                   req.flash("success", "Coupon Delete");
                   res.redirect('back')

                }else{

                    req.flash("error", "Your Are Not Authorized For this");
                    return res.redirect('back')
                }
 
    } catch (error) {
        console.log(error);
    }
})

router.post('/update/:id', auth, async (req, res)=>{
    
    try {
        const {id,roll,store,loginas} = req.user;
        if(loginas == 0){ req.flash("error", "Your Are Not Authorized For this");
        return res.redirect('back')}
        const rolldetail = await mySqlQury("select id,roll,coupon from tbl_roll where id = "+roll+"");
                if(rolldetail[0].roll === "master_Admin"){
                  var dataid = req.params.id
                  var { coupon_titel_update,storelist,coupon_type_update,coupon_limit_update,coupon_start_date_update,coupon_end_date_update,coupon_purchase_update,coupon_discount_amount_update,status}= req.body;
                  storelist ? (Array.isArray(storelist) ? storelist=storelist.join(','):storelist):(storelist=1)
                  status ? status= 0 : status =1
               
                  var qury = `UPDATE tbl_coupon SET titel='${coupon_titel_update}',min_purchase='${coupon_purchase_update}',
                  discount='${coupon_discount_amount_update}',start_date='${coupon_start_date_update}',end_date='${coupon_end_date_update}',
                  store_list_id='${storelist}',coupon_type='${coupon_type_update}',limit_forsame_user='${coupon_limit_update}',status='${status}' WHERE id=${dataid}`
                  var coupondata = await mySqlQury(qury);

                   req.flash("success", "Coupon Update !!");
                   res.redirect('back')

                }else{

                    req.flash("error", "Your Are Not Authorized For this");
                    return res.redirect('back')
                }
 
    } catch (error) {
        console.log(error);
    }
})


module.exports = router