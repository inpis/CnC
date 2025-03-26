const express = require('express');
const jwt = require('jsonwebtoken');
const {mySqlQury} = require('../middelwer/db');

const access = async (user)=>{
    try {
        const {id,roll,store,loginas} = user;
        
        const rolldetail = await mySqlQury("select * from tbl_roll where id = "+roll+"");
        
        if(loginas == 0){
            var logas = "custmor"
            var mutibranch = false

            var topbardata = await mySqlQury(`SELECT tbl_customer.id,tbl_customer.name,tbl_customer.email,tbl_customer.address,tbl_customer.taxnumber,tbl_customer.username,tbl_customer.password,tbl_customer.store_ID,tbl_customer.reffstore,tbl_customer.approved,tbl_customer.delet_flage,tbl_store.name as store FROM tbl_customer join tbl_store on tbl_customer.store_ID=tbl_store.id AND tbl_customer.id = "${id}"`)
            console.log("if topbardata" , topbardata);
            // console.log(topbardata);

            // var topbardata = await mySqlQury("select * from tbl_customer where id = "+id+"")
            // console.log(topbardata);

            var isstore = false
        }else{
            var topbardata = await mySqlQury(`SELECT tbl_admin.id,tbl_admin.name,tbl_admin.number,tbl_admin.email,tbl_admin.username,tbl_admin.password,tbl_admin.store_ID,tbl_admin.roll_id,tbl_admin.approved,tbl_admin.delet_flage,tbl_admin.img,tbl_admin.is_staff,tbl_store.name as store FROM tbl_admin join tbl_store on tbl_admin.store_ID=tbl_store.id AND tbl_admin.id = "${id}"`)
            console.log("else topbardata" , topbardata);
            // console.log(topbardata);
            // var topbardata = await mySqlQury("select * from tbl_admin where id = "+id+"")
            // console.log(topbardata);
            if(topbardata[0].is_staff == 0){
                var isstore = true

                // var abc = await mySqlQury(`SELECT tbl_admin.id,tbl_admin.name,tbl_admin.number,tbl_admin.email,tbl_admin.username,tbl_admin.password,tbl_admin.store_ID,tbl_admin.roll_id,tbl_admin.approved,tbl_admin.delet_flage,tbl_admin.img,tbl_admin.is_staff,tbl_store.name as store FROM tbl_admin join tbl_store on tbl_admin.store_ID=tbl_store.id AND tbl_admin.id = "${topbardata[0].store_ID}"`)
                // console.log(abc);

                var topbardata = await mySqlQury("select * from tbl_store where id = "+topbardata[0].store_ID+"") 
                console.log(topbardata);
            }else{
                var isstore = false
            }
            if(rolldetail[0].roll === "master_Admin"){
                const multiy = await mySqlQury("SELECT type FROM tbl_master_shop");
                // console.log("multiy" , multiy);
                if(multiy[0].type == 1){
                    var logas = "master"
                    var mutibranch = true
                }else{
                    var logas = "master"
                    var mutibranch = false
                }
            }else{
                var logas = "store"
                var mutibranch = false
            }
        }
        
        const masterstore = await mySqlQury("SELECT * FROM tbl_master_shop where id=1");
        const symbol = masterstore[0].currency_symbol
        const plac = masterstore[0].currency_placement
        const thousands_separator = masterstore[0].thousands_separator

        const notification_data = await mySqlQury(`SELECT * FROM tbl_notification WHERE received = '${topbardata[0].id}' ORDER BY date DESC LIMIT 5`)


       return {logas,mutibranch,roll:rolldetail[0],topbardata:topbardata[0],isstore,symbol,plac,thousands_separator,masterstore:masterstore[0], notification_data}
    } catch (error) {
        console.log(error);
    }
}

module.exports = access