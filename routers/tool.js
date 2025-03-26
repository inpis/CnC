const express = require('express');
const {mySqlQury} = require('../middelwer/db');
const router = express.Router();
const auth = require('../middelwer/auth')
const {upload} = require('../middelwer/multer');
var timezones = require('timezones-list');
const access = require('../middelwer/access');


// <<<<<<<<<<roll >>>>>>>>>>>>>>>>>
router.get('/roll', auth, async(req, res)=>{
    try {
        const {id,roll,store,loginas} = req.user;
        
        const accessdata = await access (req.user)
        console.log("accessdata" , accessdata);
        if(loginas == 0){ req.flash("error", "Your Are Not Authorized For this");
        return res.redirect('back')}
        const multiy = await mySqlQury("SELECT type FROM tbl_master_shop");
       
        const rolldetail = await mySqlQury("select id,roll,rollaccess from tbl_roll where id = "+roll+"");
                if(rolldetail[0].roll === "master_Admin"){

                    if(multiy[0].type == 1)
                    {
                        var ismulty = true
                        const storeList = await mySqlQury("SELECT id,name FROM tbl_store WHERE status=1 AND delete_flage=0");
                        const data = await mySqlQury("SELECT tbl_roll.id, tbl_roll.roll, tbl_roll.delet_flage,tbl_store.name as store FROM tbl_roll join tbl_store on tbl_roll.store_ID=tbl_store.id WHERE tbl_roll.delet_flage=0");
                      
                        
                        res.render('roll',{rollList:data,ismulty,storeList,accessdata, language:req.language_data, language_name:req.language_name})
                    }else{
                        var ismulty = false
                        const data = await mySqlQury("SELECT tbl_roll.id, tbl_roll.roll, tbl_roll.delet_flage FROM tbl_roll  WHERE tbl_roll.delet_flage=0 AND store_ID=1");
                        res.render('roll',{rollList:data,ismulty:false,storeList:[],accessdata, language:req.language_data, language_name:req.language_name})
                        
                    }
                    
                }else if( rolldetail[0].rollaccess.includes('read')){
                    var ismulty = false
                    var qury = "SELECT id, roll, delet_flage FROM tbl_roll WHERE store_ID="+store+" "
                    const rollList = await mySqlQury(qury);
                    res.render('roll',{rollList:rollList,ismulty,storeList:[],accessdata, language:req.language_data, language_name:req.language_name})

                }else{ 
                    req.flash("error", "Your Are Not Authorized For this");
                    return res.redirect('back')
                }

      
        
    } catch (error) {
        console.log(error);
    }
})

router.post('/addroll', auth, async (req, res)=>{
    
    try {  const {id,roll,store,loginas} = req.user;
    if(loginas == 0){ req.flash("error", "Your Are Not Authorized For this");
    return res.redirect('back')}
    const rolldetail = await mySqlQury("select id,roll,rollaccess from tbl_roll where id = "+roll+"");

        if(rolldetail[0].roll === "master_Admin" || rolldetail[0].rollaccess.includes('writ')){
            var {name,  orders, expense, service, reports, tools, mail, master, sms, staff, pos, rollname, couponname, accountname } = req.body
            var storeid = req.body.storeid
            storeid ? storeid : storeid=store
            
            orders ? (Array.isArray(orders) ? orders=orders.join(','):orders):(orders='')
            expense ? (Array.isArray(expense) ? expense=expense.join(','):expense):(expense='')
            service ? (Array.isArray(service) ? service=service.join(','):service):(service='')
            reports ? (Array.isArray(reports) ? reports=reports.join(','):reports):(reports='')
            tools ? (Array.isArray(tools) ? tools=tools.join(','):tools):(tools='')
            mail ? (Array.isArray(mail) ? mail=mail.join(','):mail):(mail='')
            master ? (Array.isArray(master) ? master=master.join(','):master):(master='')
            sms ? (Array.isArray(sms) ? sms=sms.join(','):sms):(sms='')
            staff ? (Array.isArray(staff) ? staff=staff.join(','):staff):(staff='')
            pos ? (Array.isArray(pos) ? pos=pos.join(','):pos):(pos='')
            rollname ? (Array.isArray(rollname) ? rollname=rollname.join(','):rollname):(rollname='')
            couponname ? (Array.isArray(couponname) ? couponname=couponname.join(','):couponname):(couponname='')
            accountname ? (Array.isArray(accountname) ? accountname=accountname.join(','):accountname):(accountname='')

           
            var qury = `INSERT INTO tbl_roll (roll,orders,expense,service,reports,tools,mail,master,sms,staff,pos,rollaccess,account,coupon,store_ID)
             VALUE ('${name}','${orders}','${expense}','${service}','${reports}','${tools}','${mail}',
             '${master}','${sms}','${staff}','${pos}','${rollname}','${accountname}','${couponname}','${storeid}') `

             const newroll = await mySqlQury(qury);
             req.flash("success", "New Roll Added !");
             res.redirect('back')



        }else{
            req.flash("error", "Your Are Not Authorized For this");
             return res.redirect('back')
        }
        
    } catch (error) {
        console.log(error);
    }
})

router.get('/deletroll/:id', auth, async (req, res)=>{
    
    try { 
        const {id,roll,store,loginas} = req.user;
        if(loginas == 0){ req.flash("error", "Your Are Not Authorized For this");
        return res.redirect('back')}

        const rolldetail = await mySqlQury("select id,roll,rollaccess from tbl_roll where id = "+roll+"");

            if(rolldetail[0].roll === "master_Admin" || rolldetail[0].rollaccess.includes('delete')){
               var rollid = req.params.id

                 const newroll = await mySqlQury("DELETE FROM tbl_roll  WHERE id="+rollid+" ");
                 req.flash("success", "Roll Deleted  !!!");
                 res.redirect('back')


            }else{
                req.flash("error", "Your Are Not Authorized For this");
                 return res.redirect('back')
            }
        
    } catch (error) {
        console.log(error);
    }
})

router.get('/rolldetails/:id', auth, async (req, res)=>{
    try {const id = req.params.id
        const newroll = await mySqlQury("SELECT * FROM tbl_roll WHERE id="+id+" ");
       
        res.status(200).json({rolldata:newroll[0]})
    } catch (error) {
        console.log(error);
    }
})

router.post('/updateroll/:id', auth, async (req, res)=>{
    
    try {const {id,roll,store,loginas} = req.user;
    if(loginas == 0){ req.flash("error", "Your Are Not Authorized For this");
    return res.redirect('back')}
        const rolldetail = await mySqlQury("select id,roll,rollaccess from tbl_roll where id = "+roll+"");
            if(rolldetail[0].roll === "master_Admin" || rolldetail[0].rollaccess.includes('edit')){
              
                const rollid=req.params.id
                var {name_update, orders, expense, service, reports, tools, mail, master, sms, staff, pos, rollname,active,couponname, accountname } = req.body;

               
                orders ? (Array.isArray(orders) ? orders=orders.join(','):orders):(orders='')
                expense ? (Array.isArray(expense) ? expense=expense.join(','):expense):(expense='')
                service ? (Array.isArray(service) ? service=service.join(','):service):(service='')
                reports ? (Array.isArray(reports) ? reports=reports.join(','):reports):(reports='')
                tools ? (Array.isArray(tools) ? tools=tools.join(','):tools):(tools='')
                mail ? (Array.isArray(mail) ? mail=mail.join(','):mail):(mail='')
                master ? (Array.isArray(master) ? master=master.join(','):master):(master='')
                sms ? (Array.isArray(sms) ? sms=sms.join(','):sms):(sms='')
                staff ? (Array.isArray(staff) ? staff=staff.join(','):staff):(staff='')
                pos ? (Array.isArray(pos) ? pos=pos.join(','):pos):(pos='')
                rollname ? (Array.isArray(rollname) ? rollname=rollname.join(','):rollname):(rollname='')
                couponname ? (Array.isArray(couponname) ? couponname=couponname.join(','):couponname):(couponname='')
                accountname ? (Array.isArray(accountname) ? accountname=accountname.join(','):accountname):(accountname='')
                active ? active = 0 : active = 1

                var qury = `UPDATE tbl_roll SET roll='${name_update}',orders='${orders}',expense='${expense}',service='${service}',reports='${reports}',
                tools='${tools}',mail='${mail}',master='${master}',sms='${sms}',staff='${staff}',pos='${pos}',rollaccess='${rollname}',delet_flage=${active},
                account='${accountname}',coupon='${couponname}' WHERE id=${rollid}`


                  const newroll = await mySqlQury(qury);
                 req.flash("success", "Roll Updated!");
                 res.redirect('back')
    
    
    
            }else{
                req.flash("error", "Your Are Not Authorized For this");
                 return res.redirect('back')
            }





        
    } catch (error) {
        console.log(error);
    }
})





// <<<< Branch shope render >>>>>>>
router.get('/storesetting', auth, async(req, res)=>{
    try {const {id,roll,store,loginas} = req.user;
    const accessdata = await access (req.user)
        if(loginas == 0){ req.flash("error", "Your Are Not Authorized For this");
        return res.redirect('back')}
        const rolldetail = await mySqlQury("select id,roll,master from tbl_roll where id = "+roll+"");
       
                if(rolldetail[0].roll === "master_Admin"){

                    const multiy = await mySqlQury("SELECT type FROM tbl_master_shop");
                    if(multiy[0].type == 1){
                        
                        req.flash("error", "You Can Access This Data From Store List");
                        return res.redirect('back')
                       
                    }else{
                        storedata = await mySqlQury("SELECT * FROM tbl_store WHERE id="+store+" ");
                        update = true
                    }
                }else if(rolldetail[0].master.includes('read')){
                        storedata = await mySqlQury("SELECT * FROM tbl_store WHERE id="+store+" AND status=1 ");
                        update = rolldetail[0].master.includes('edit')
                    
                }else{
                    req.flash("error", "Your Are Not Authorized For this");
                    return res.redirect('back')
                }

            res.render('storeSetting',{storedata,update,accessdata, language:req.language_data, language_name:req.language_name})
        
    } catch (error) {
        
    }
    

})

// branch update by store admin
router.post('/updatesetting/:id', auth, upload.single('logo'), async (req, res)=>{
    
    try {const {id,roll,store,loginas} = req.user;
        if(loginas == 0){ req.flash("error", "Your Are Not Authorized For this");
        return res.redirect('back')}
        const rolldetail = await mySqlQury("select id,roll,master from tbl_roll where id = "+roll+"");
            if(rolldetail[0].roll === "master_Admin" || rolldetail[0].master.includes('edit')){
                const dataid=req.params.id
                if(req.file){
                    const logo = req.file.filename;
                    const logoupdate = await mySqlQury( `UPDATE tbl_store SET logo='${logo}' WHERE id=${dataid}`)
                }
                
            const {name,adminid, number, store_email, state, city, tax_number, username, password, commission,taxpercent,country,district,zip_code,address} = req.body;  
             const dataupdate = await mySqlQury( `UPDATE tbl_store SET name='${name}',mobile_number='${number}',
             username='${username}',password='${password}',shop_commission=${commission},tax_percent=${taxpercent},country='${country}',state='${state}',
             city='${city}',district='${district}',zipcode='${zip_code}',store_email='${store_email}',store_tax_number='${tax_number}',address='${address}'
            WHERE id=${dataid}`)

            const adminupdate = await mySqlQury( `UPDATE tbl_admin SET name='${name}',number='${number}',
            username='${username}',password='${password}',email='${store_email}' WHERE id=${adminid}`)


              req.flash("success", "Store Details Updated!");
              res.redirect('back')
    
            }else{
                req.flash("error", "Your Are Not Authorized For this");
                 return res.redirect('back')
            }   
    } catch (error) {
        console.log(error);
    }
})



// <<<< Branch shope list master only>>>>>>>
router.get('/storelist', auth, async(req, res)=>{
    try {const {id,roll,store,loginas} = req.user;
    const accessdata = await access (req.user)
        if(loginas == 0){ req.flash("error", "Your Are Not Authorized For this");
        return res.redirect('back')}
        const rolldetail = await mySqlQury("select id,roll,master from tbl_roll where id = "+roll+"");
       
                if(rolldetail[0].roll === "master_Admin"){

                    const multiy = await mySqlQury("SELECT type FROM tbl_master_shop");
                    if(multiy[0].type == 1){
                        
                        var storeList = await mySqlQury("SELECT * FROM tbl_store");
                        res.render('storelist',{storeList,accessdata, language:req.language_data, language_name:req.language_name})
                       
                    }else{
                        req.flash("error", "Branch Store Note Availabal");
                        return res.redirect('back')
                    }
                }else{

                    req.flash("error", "Your Are Not Authorized For this");
                    return res.redirect('back')
                }
        
    } catch (error) {
        
    }
    

})

//  branch store data render page master only
router.get('/approvedshop/:id', auth, async(req, res)=>{
   
    try {const {id,roll,store,loginas} = req.user;
    const accessdata = await access (req.user)
    if(loginas == 0){ req.flash("error", "Your Are Not Authorized For this");
    return res.redirect('back')}
        const rolldetail = await mySqlQury("select id,roll,master from tbl_roll where id = "+roll+"");
        if(rolldetail[0].roll === "master_Admin"){

            var storedata = await mySqlQury(`SELECT * FROM tbl_store WHERE id = ${req.params.id}` );
            
            const rolldata = await mySqlQury("select * from tbl_roll where delet_flage =0 AND store_ID="+store+"");
            console.log("rolldata" , rolldata);

            res.render('store_settings_bymaster',{rolldata,storedata,accessdata, language:req.language_data, language_name:req.language_name})

        }else{
            req.flash("error", "Your Are Not Authorized For this");
             return res.redirect('back')
        }   
} catch (error) {
    console.log(error);
}
})

// branch store setting data master only
router.post('/branchdata/:id', auth, upload.single('logo'), async(req, res)=>{
    
    try {const {id,roll,store,loginas} = req.user;
        if(loginas == 0){ req.flash("error", "Your Are Not Authorized For this");
        return res.redirect('back')}
        const rolldetail = await mySqlQury("select id,roll,master from tbl_roll where id = "+roll+"");
        if(rolldetail[0].roll === "master_Admin"){
           var dataid = req.params.id;
        
           const {name, number, store_email, state, city, tax_number, username, password, commission,taxpercent,country,district,zip_code,address, status, roll} = req.body;
           const dataupdate = await mySqlQury( `UPDATE tbl_store SET name='${name}',mobile_number='${number}',username='${username}',
           password='${password}',shop_commission=${commission},tax_percent=${taxpercent},country='${country}',state='${state}',
           city='${city}',district='${district}',zipcode='${zip_code}',store_email='${store_email}',store_tax_number='${tax_number}',
           address='${address}', status=${status}, roll_ID=${roll} WHERE id=${dataid}`)

           const adminid = await mySqlQury("SELECT admin_id FROM tbl_store WHERE id="+dataid+"" )

           const adminupdate = await mySqlQury( `UPDATE tbl_admin SET name='${name}',number='${number}',
           username='${username}',password='${password}',email='${store_email}' WHERE id=${adminid[0].admin_id}`)

           if(status == 1){
            const admndata = await mySqlQury("UPDATE tbl_admin SET store_ID="+dataid+" ,roll_id="+roll+",approved= 1 WHERE id="+adminid[0].admin_id+"")
        
           }else if (status == 2){
            
            const admndata = await mySqlQury("UPDATE tbl_admin SET store_ID="+dataid+" , approved= 2 WHERE id="+adminid[0].admin_id+" OR store_ID="+dataid+" ")
          
            }
          
           
           req.flash("success", "Store Details Updated!");
           res.redirect('/tool/storelist')
        }else{
            req.flash("error", "Your Are Not Authorized For this");
             return res.redirect('back')
        }   
} catch (error) {
    console.log(error);
}
})

//add new shope by admin get master only
router.get('/addshop', auth, async (req, res)=>{
   
    try {
        const {id,roll,store,loginas} = req.user;
        const accessdata = await access (req.user)
        if(loginas == 0){ req.flash("error", "Your Are Not Authorized For this");
        return res.redirect('back')}
        const rolldetail = await mySqlQury("select id,roll,master from tbl_roll where id = "+roll+"");
                if(rolldetail[0].roll === "master_Admin" || rolldetail[0].master.includes('write')){
                    const rolldata = await mySqlQury("select * from tbl_roll where delet_flage =0 AND store_ID="+store+"");
                   res.render('shop_add_admin',{rolldata,accessdata, language:req.language_data, language_name:req.language_name})

                }else{ 
                    req.flash("error", "Your Are Not Authorized For this");
                    return res.redirect('back')
                }
        
    } catch (error) {
        console.log(error);
    }
});

// add new shop by admin post router master only
router.post('/shopregister',auth, upload.single('logo'), async (req, res)=>{
    
    try {
        const {id,roll,store,loginas} = req.user;
        if(loginas == 0){ req.flash("error", "Your Are Not Authorized For this");
        return res.redirect('back')}
        const rolldetail = await mySqlQury("select id,roll,master from tbl_roll where id = "+roll+"");
            if(rolldetail[0].roll === "master_Admin" || rolldetail[0].master.includes('write')){ 
    
                        const {name, number, store_email, state, city, tax_number, username, password, commission,taxpercent,country,district,zip_code,address,roll:rollid,status} = req.body;
                    
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

                        const admindata = await mySqlQury("INSERT INTO tbl_admin (name,number,email,username,password) VALUE ('"+name+"','"+number+"','"+store_email+"','"+username+"','"+password+"')");
                        var newid = admindata.insertId
                        const qury = `INSERT INTO tbl_store (name,logo,mobile_number,username,password,shop_commission,tax_percent,country,state,city,district,zipcode,store_email,store_tax_number,address,admin_id,status,roll_ID) 
                        VALUE ('${name}','${logo}','${number}','${username}','${password}',${commission},${taxpercent},'${country} ','${state}','${city}',' ${district}','${zip_code}','${store_email}',
                        '${tax_number}','${address} ',${newid},${status},${rollid})`
                        
                        const newstore = await mySqlQury(qury);

                        if(status == 1){
                            const admndata = await mySqlQury("UPDATE tbl_admin SET store_ID="+newstore.insertId+" ,roll_id="+rollid+",approved= 1 WHERE id="+newid+"")
                        }else if (status == 2){
                            const admndata = await mySqlQury("UPDATE tbl_admin SET store_ID="+newstore.insertId+" , approved= 2 WHERE id="+newid+" OR store_ID="+newstore.insertId+" ")
                        }

                        req.flash("success", "New Shop Resiter success fully !!!!");
                        res.redirect('/tool/setting')
       
            }else{ 
                req.flash("error", "Your Are Not Authorized For this");
                return res.redirect('back')
            }
        
    } catch (error) {
        console.log(error);
    }
})





//<<<<<<<<<<<< Staff Router >>>>>>>>>>>>>>>>>
router.get('/staff', auth, async(req, res)=>{
    try {
        const {id,roll,store,loginas} = req.user;
        const accessdata = await access (req.user)
        if(loginas == 0){ req.flash("error", "Your Are Not Authorized For this");
        return res.redirect('back')}
       
        const rolldetail = await mySqlQury("select id,roll,staff from tbl_roll where id = "+roll+"");
                if(rolldetail[0].roll === "master_Admin"){
                   
                    const multiy = await mySqlQury("SELECT type FROM tbl_master_shop");
                    if(multiy[0].type == 1){
                        var ismulty = true
                        var staffdata = await mySqlQury("SELECT tbl_admin.*, tbl_store.name as store, tbl_roll.roll FROM tbl_admin JOIN tbl_store ON tbl_admin.store_ID=tbl_store.id JOIN tbl_roll ON tbl_admin.roll_id=tbl_roll.id WHERE is_staff=1 ")  
                    }else{  
                        var ismulty = false 
                        var staffdata = await mySqlQury("SELECT tbl_admin.*, tbl_store.name as store, tbl_roll.roll FROM tbl_admin JOIN tbl_store ON tbl_admin.store_ID=tbl_store.id JOIN tbl_roll ON tbl_admin.roll_id=tbl_roll.id WHERE tbl_admin.store_ID="+store+" AND is_staff=1")
                    }

                }else if( rolldetail[0].staff.includes('read')){
                    var ismulty = false 
                    var staffdata = await mySqlQury("SELECT tbl_admin.*, tbl_store.name as store, tbl_roll.roll FROM tbl_admin JOIN tbl_store ON tbl_admin.store_ID=tbl_store.id JOIN tbl_roll ON tbl_admin.roll_id=tbl_roll.id WHERE tbl_admin.store_ID="+store+" AND tbl_admin.delet_flage=0 AND is_staff=1")

                }else{

                    req.flash("error", "Your Are Not Authorized For this");
                    return res.redirect('back')
                }

                var rolldata = await mySqlQury("SELECT tbl_roll.id, tbl_roll.roll FROM tbl_roll  WHERE delet_flage=0 AND store_ID="+store+"")
        
                res.render('staff',{rolldata,staffdata, ismulty ,accessdata, language:req.language_data, language_name:req.language_name})
        
    } catch (error) {
        console.log(error);
    }
});

router.get('/deletstaff/:id', auth, async (req, res)=>{
    
    try { const {id,roll,store,loginas} = req.user;
    if(loginas == 0){ req.flash("error", "Your Are Not Authorized For this");
    return res.redirect('back')}
    const rolldetail = await mySqlQury("select id,roll,staff from tbl_roll where id = "+roll+"");

        if(rolldetail[0].roll === "master_Admin" || rolldetail[0].staff.includes('delete')){
           var dataid = req.params.id

             const newroll = await mySqlQury("UPDATE tbl_admin SET delet_flage=1, approved=0 WHERE id="+dataid+" ");
             req.flash("success", "Staff Deleted  !!!");
             res.redirect('back')



        }else{
            req.flash("error", "Your Are Not Authorized For this");
             return res.redirect('back')
        }
        
    } catch (error) {
        console.log(error);
    }
});

router.post('/addstaff', auth, async (req, res)=>{
    
    try { const {id,roll,store,loginas} = req.user;
    if(loginas == 0){ req.flash("error", "Your Are Not Authorized For this");
    return res.redirect('back')}
    const rolldetail = await mySqlQury("select id,roll,staff from tbl_roll where id = "+roll+"");

        if(rolldetail[0].roll === "master_Admin" || rolldetail[0].staff.includes('write')){
          
         var {name,number,email,username,password,roll_list,active} = req.body;
         active ? active = 1 : active = 0
         const newroll = await mySqlQury(`INSERT INTO tbl_admin (name,number,email,username,password,store_ID,roll_id,approved,is_staff) 
                     VALUE ('${name}','${number}','${email}','${username}','${password}','${store}','${roll_list}',${active},'1')`);
             
        req.flash("success", "New Staff Added !!!");
        res.redirect('back')



        }else{
            req.flash("error", "Your Are Not Authorized For this");
             return res.redirect('back')
        }
        
    } catch (error) {
        console.log(error);
    }
})

router.post('/updatestaff/:id', auth, async( req, res )=>{
    
    try { const {id,roll,store,loginas} = req.user;
    if(loginas == 0){ req.flash("error", "Your Are Not Authorized For this");
    return res.redirect('back')}
    const rolldetail = await mySqlQury("select id,roll,staff from tbl_roll where id = "+roll+"");

        if(rolldetail[0].roll === "master_Admin" || rolldetail[0].staff.includes('edit')){
          
                var dataid = req.params.id
                var {name_update,number_update,email_update,username_update,password_update,roll_list_update,active_update} = req.body;
                active_update ? active_update = 1 : active_update = 0
                const newroll = await mySqlQury(`UPDATE tbl_admin SET name='${name_update}',number='${number_update}',email='${email_update}',username='${username_update}',
                password='${password_update}',roll_id='${roll_list_update}',approved='${active_update}' WHERE id=${dataid}`);
                    
                req.flash("success", "Staff Updated !!!");
                res.redirect('back')



        }else{
            req.flash("error", "Your Are Not Authorized For this");
             return res.redirect('back')
        }
        
    } catch (error) {
        console.log(error);
    }
})

router.get('/rolllist/:id', auth, async(req, res)=>{
    try {
        const staffid = req.params.id
        const storeid = await mySqlQury("SELECT store_ID FROM tbl_admin WHERE id="+staffid+"")
        const rolllist = await mySqlQury("SELECT tbl_roll.id, tbl_roll.roll FROM tbl_roll  WHERE delet_flage=0 AND store_ID="+storeid[0].store_ID+"")

        res.status(200).json({rolllist})
    } catch (error) {
        console.log(error);
    }
})


//<<<<<<<<<<<<<< master settings >>>>>>>>>>>>>>>>>>>>>
router.get('/setting', auth, async(req, res)=>{
    try {
        const {id,roll,store,loginas} = req.user;
        const accessdata = await access (req.user)
        if(loginas == 0){ req.flash("error", "Your Are Not Authorized For this");
        return res.redirect('back')}
        const rolldetail = await mySqlQury("select id,roll,master from tbl_roll where id = "+roll+"");
        if(rolldetail[0].roll === "master_Admin"){
            const masterstore = await mySqlQury("SELECT * FROM tbl_master_shop where id=1");
            const roll = await mySqlQury("SELECT id, roll FROM tbl_roll WHERE store_ID=1")
           
           
            res.render('master_settings',{timezones,masterstore:masterstore[0] ,roll, accessdata, language:req.language_data, language_name:req.language_name})

        } else{
            req.flash("error", "Your Are Not Authorized For this");
            return res.redirect('back')
        }    
    } catch (error) {
        console.log(error);
    }
})


router.post('/setmasterdata',auth,upload.fields([{name: "logo", axCount: 1},{name: "favicon", axCount: 1}]), async (req, res)=>{
    
    try {
        const {id,roll,store,loginas} = req.user;
        if(loginas == 0){ req.flash("error", "Your Are Not Authorized For this");
        return res.redirect('back')}
        const rolldetail = await mySqlQury("select id,roll,master from tbl_roll where id = "+roll+"");
        if(rolldetail[0].roll === "master_Admin"){

         
            
           var {multy,store_approved,customer_approved,currency,Symbol_Placement,thousands_separator,timezone,printer_pos,storeroll,appname, onesignal_app_id, onesignal_api_key} = req.body;

           multy ? multy =multy : multy =0 ;
           store_approved ? store_approved =store_approved : store_approved =0 ;
           customer_approved ? customer_approved =customer_approved : customer_approved =0 ;
           Symbol_Placement ? Symbol_Placement =Symbol_Placement : Symbol_Placement =0 ;

           if(req.files.favicon){
            console.log("favicon", req.files.favicon);
            await mySqlQury(`UPDATE tbl_master_shop SET app_favicon='${req.files.favicon[0].filename}'`)
           }

           if(req.files.logo){
            console.log("favicon", req.files.logo);
            await mySqlQury(`UPDATE tbl_master_shop SET app_logo='${req.files.logo[0].filename}'`)
           }
          
          await mySqlQury(`UPDATE tbl_master_shop SET type=${multy},currency_symbol='${currency}',currency_placement=${Symbol_Placement},thousands_separator=${thousands_separator},
          customer_autoapprove=${customer_approved},store_autoapprove=${store_approved},timezone='${timezone}',printer=${printer_pos},storeroll=${storeroll},app_name='${appname}',
          onesignal_app_id='${onesignal_app_id}', onesignal_api_key='${onesignal_api_key}'`)


          if(multy){
            var admintable = await mySqlQury("UPDATE tbl_admin SET approved = 1 WHERE store_ID != 1 AND approved=8");
            var customertable = await mySqlQury("UPDATE tbl_customer SET store_ID=reffstore, reffstore=1");
            var admintable = await mySqlQury("UPDATE tbl_admin SET is_staff=1 WHERE id=1");
            var admintable = await mySqlQury("UPDATE tbl_admin SET is_staff=0 WHERE id=2");

          }else{
            var admintable = await mySqlQury("UPDATE tbl_admin SET approved = 8 WHERE store_ID != 1 AND approved=1");
            var customertable = await mySqlQury("UPDATE tbl_customer SET reffstore=store_ID, store_ID=1");
            var admintable = await mySqlQury("UPDATE tbl_admin SET is_staff=0 WHERE id=1");
            var admintable = await mySqlQury("UPDATE tbl_admin SET is_staff=1 WHERE id=2");
          }

          req.flash("success", "Master Setting Save Success Fully");
           res.redirect('back')

        } else{
            req.flash("error", "Your Are Not Authorized For this");
            return res.redirect('back')
        }    
    } catch (error) {
        console.log(error);
    }
})



// <<<<<<<<<<<<<<<<<<< Email setting >>>>>>>>>>>>>>>>>>
router.get('/mail',auth, async (req, res)=>{
    try {
        const {id,roll,store,loginas} = req.user;
        const accessdata = await access (req.user)
        if(loginas == 0){ req.flash("error", "Your Are Not Authorized For this");
        return res.redirect('back')}
        const rolldetail = await mySqlQury("select id,roll,mail from tbl_roll where id = "+roll+"");
        if( rolldetail[0].mail.includes('read')){
            var data = await mySqlQury("SELECT * FROM tbl_email WHERE store_id="+store+"");



            res.render('mailsetting',{accessdata,data, language:req.language_data, language_name:req.language_name})
        }

    } catch (error) {
        console.log(error);
    }
});

router.post('/mailsetting', auth, async(req, res)=>{
    
    try {
        const {id,roll,store,loginas} = req.user;
        const { host,port,username,password,frommail,status} = req.body

       var data = await mySqlQury("SELECT * FROM tbl_email WHERE store_id="+store+"");
       if(data.length > 0){
        await mySqlQury(`UPDATE tbl_email SET host='${host}',port='${port}',username='${username}',password='${password}',frommail='${frommail}',
        status='${status}' WHERE store_id=${store} `);
       }else{
        await mySqlQury(`INSERT INTO tbl_email  (host,port,username,password,frommail,status, store_id) VALUE 
        ('${host}','${port}','${username}','${password}','${frommail}','${status}',${store}) `);
       }

       req.flash("success", "Email Setting Save Success Fully");
       res.redirect('back')
        
    } catch (error) {
        console.log(error);
    }
})




module.exports = router