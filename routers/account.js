const express = require('express');
const {mySqlQury} = require('../middelwer/db');
const router = express.Router();
const auth = require('../middelwer/auth')
const {upload} = require('../middelwer/multer')
const access = require('../middelwer/access')
var Excel = require('exceljs');

// <<<<<<< account List >>>>>>>>>>>>>
router.get('/list', auth, async(req, res)=>{
    try {
        const {id,roll,store,loginas} = req.user;
        
        if(loginas == 0){
        req.flash("error", "Your Are Not Authorized For this");
        return res.redirect('back')}
        
        const rolldetail = await mySqlQury("select id,roll,account from tbl_roll where id = "+roll+"");
        if(rolldetail[0].roll === "master_Admin" || rolldetail[0].account.includes('read')){
            var comi = await mySqlQury("SELECT SUM(master_comission) as amount FROM tbl_order WHERE store_id="+store+"")
            var paidcomi = await mySqlQury("SELECT SUM(amount) as amount FROM tbl_commision WHERE store_id="+store+"")
            var comission;
            var paidcomission;

            comi.length > 0 ? comission=Number(comi[0].amount).toFixed(2) : comission=0
            paidcomi.length > 0 ? paidcomission=Number(paidcomi[0].amount).toFixed(2) : paidcomission=0
            var due = parseFloat(comission) - parseFloat(paidcomission)

            var toaccount = await mySqlQury("SELECT * FROM tbl_account WHERE store_ID=1")
            var fromaccount = await mySqlQury("SELECT * FROM tbl_account WHERE store_ID="+store+"")

            var qury ="SELECT tbl_account.*, sum(`credit_amount`) as credit, sum(`debit_amount`) as debit FROM tbl_account JOIN tbl_transections on tbl_account.id=tbl_transections.account_id WHERE tbl_account.store_ID= "+store+" AND delet_flage=0 GROUP BY tbl_account.id "
            const account_list = await mySqlQury(qury);
            console.log("account_list" , account_list);

            const accessdata = await access (req.user)
            res.render('account_list',{account_list,accessdata,comission,paidcomission,due,toaccount,fromaccount, language:req.language_data, language_name:req.language_name})

        }else{
            req.flash("error", "Your Are Not Authorized For this");
            return res.redirect('back')
        }
    } catch (error) {
        console.log(error);
    }
});

router.post('/addaccount', auth, async (req, res)=>{
  
    try {
         
        const {id,roll,store,loginas} = req.user;
    if(loginas == 0){ req.flash("error", "Your Are Not Authorized For this");
    return res.redirect('back')}
    const rolldetail = await mySqlQury("select id,roll,account from tbl_roll where id = "+roll+"");

        if(rolldetail[0].roll === "master_Admin" || rolldetail[0].account.includes('writ')){
            const { ac_name, ac_number, balance, description} = req.body;

            const storename = await mySqlQury("SELECT name FROM tbl_store WHERE id="+store+" ");
            
            var qury =` INSERT INTO tbl_account (ac_name,ac_number,ac_decrip,store_ID,balance,store_name) VALUE ('${ac_name}','${ac_number}',
            '${description}','${store}','${balance}','${storename[0].name} ')`
            const newaccount = await mySqlQury(qury);

            await mySqlQury(`INSERT INTO tbl_transections (account_id,store_ID,transec_detail,transec_type,credit_amount,balance_amount, customer_id) 
                            VALUE (${newaccount.insertId},${store},'New Account Opening','INCOME',${balance},${balance}, '')`)

            req.flash("success", "New Account Added !!!!");
            res.redirect('back')
        }else{
            req.flash("error", "Your Are Not Authorized For this");
            return res.redirect('back')
        }
    } catch (error) {
        console.log(error);
    }
});

router.post('/updateaccount/:id', auth, async (req, res)=>{

    try {
         
        const {id,roll,store,loginas} = req.user;
    if(loginas == 0){ req.flash("error", "Your Are Not Authorized For this");
    return res.redirect('back')}
    const rolldetail = await mySqlQury("select id,roll,account from tbl_roll where id = "+roll+"");

        if(rolldetail[0].roll === "master_Admin" || rolldetail[0].account.includes('edit')){
           const { ac_name, ac_number, description} = req.body;
           var dataid = req.params.id
           var qury =`UPDATE tbl_account SET ac_name='${ac_name}',ac_number='${ac_number}',ac_decrip='${description}' WHERE id=${dataid}`
           const rollList = await mySqlQury(qury);

           req.flash("success", "Account Update success Fully !!!!");
           res.redirect('back')

        }else{
            req.flash("error", "Your Are Not Authorized For this");
             return res.redirect('back')
        }
        
    } catch (error) {
        console.log(error);
    }
});

router.get('/deletaccount/:id', auth, async (req, res)=>{
   
    try {
         
        const {id,roll,store,loginas} = req.user;
    if(loginas == 0){ req.flash("error", "Your Are Not Authorized For this");
    return res.redirect('back')}
    const rolldetail = await mySqlQury("select id,roll,account from tbl_roll where id = "+roll+"");

        if(rolldetail[0].roll === "master_Admin" || rolldetail[0].account.includes('delete')){
        
           var dataid = req.params.id
           var qury =`UPDATE tbl_account SET delet_flage= 1 WHERE id=${dataid}`
           const rollList = await mySqlQury(qury);

           req.flash("success", "Account Delete success Fully !!!!");
           res.redirect('back')

        }else{
            req.flash("error", "Your Are Not Authorized For this");
             return res.redirect('back')
        }
        
    } catch (error) {
        console.log(error);
    }
});

// <<<<<<< Transection List >>>>>>>>>>>>>
router.get('/transection', auth, async(req, res)=>{
    try {
        const {id,roll,store,loginas} = req.user;
        if(loginas == 0){ req.flash("error", "Your Are Not Authorized For this");
        return res.redirect('back')}

        const rolldetail = await mySqlQury("select id,roll,account from tbl_roll where id = "+roll+"");
                if(rolldetail[0].roll === "master_Admin" || rolldetail[0].account.includes('read')){

                    var qury =`SELECT tbl_transections.*, tbl_account.ac_name FROM tbl_transections JOIN tbl_account ON tbl_transections.account_id=tbl_account.id 
                    WHERE tbl_transections.store_ID=${store}  `
                    const transection_list = await mySqlQury(qury);
                    
                    
                    const account_list = await mySqlQury("SELECT id,ac_name FROM tbl_account WHERE store_ID="+store+" AND delet_flage=0 ");
                    const accessdata = await access (req.user)
                    res.render('account_transection',{transection_list,account_list, account:0,start_date:'',end_date:'',accessdata, language:req.language_data, language_name:req.language_name})

                }else{ 
                    req.flash("error", "Your Are Not Authorized For this");
                    return res.redirect('back')
                }
        
    } catch (error) {
        console.log(error);
    }
});

router.post('/transefilter', auth, async (req, res)=>{
    try {
        const {id,roll,store,loginas} = req.user;
        const accessdata = await access (req.user)
        if(loginas == 0){ req.flash("error", "Your Are Not Authorized For this");
        return res.redirect('back')}
        const rolldetail = await mySqlQury("select id,roll,account from tbl_roll where id = "+roll+"");

        if(rolldetail[0].roll === "master_Admin" || rolldetail[0].account.includes('read')){

           
            const {account, start_date, end_date} = req.body;

            // var qury =`SELECT tbl_transections.*, tbl_account.ac_name FROM tbl_transections JOIN tbl_account ON tbl_transections.account_id=tbl_account.id 
            // WHERE tbl_transections.account_id=${account} `
            // const transection_list = await mySqlQury(qury);
            // console.log(transection_list);


            var qury =`SELECT tbl_transections.*, tbl_account.ac_name FROM tbl_transections JOIN tbl_account ON tbl_transections.account_id=tbl_account.id 
            WHERE (tbl_transections.account_id='${account}') AND (DATE(tbl_transections.date) BETWEEN '${start_date}' AND '${end_date}') `
            const transection_list = await mySqlQury(qury);
            console.log(transection_list);

            const account_list = await mySqlQury("SELECT id,ac_name FROM tbl_account WHERE store_ID="+store+" AND delet_flage=0 ");
           

            res.render('account_transection',{transection_list,account_list,account, start_date, end_date,accessdata, language:req.language_data, language_name:req.language_name})
          

        }else{ 
            req.flash("error", "Your Are Not Authorized For this");
            return res.redirect('back')
        }
    } catch (error) {
        console.log(error);
    }
});

router.get("/download/:id", auth, async(req, res)=>{
    try {
        const account = req.params.id.split('+')[0]
        const start_date = req.params.id.split('+')[1]
        const end_date = req.params.id.split('+')[2]

        if (!account && !start_date && !end_date) {
            req.flash("error", "Please Select Detail");
            return res.redirect('back')
        }

        var qury =`SELECT tbl_transections.*, tbl_account.ac_name FROM tbl_transections JOIN tbl_account ON tbl_transections.account_id=tbl_account.id 
                    WHERE (tbl_transections.account_id='${account}') AND (DATE(tbl_transections.date) BETWEEN '${start_date}' AND '${end_date}') `
        let transection_list = await mySqlQury(qury);

        transection_list.map(tval => {
            let Order_date = new Date(tval.date)
            let Order_day = (Order_date.getDate() < 10 ? '0' : '') + Order_date.getDate()
            let Order_month = ((Order_date.getMonth()+1) < 10 ? '0' : '') + (Order_date.getMonth()+1)
            let Order_year = Order_date.getFullYear()
            let Order_fullDate = `${Order_year}-${Order_month}-${Order_day}`
            tval.date = Order_fullDate
        })



        let workbook = new Excel.Workbook();
        let worksheet = workbook.addWorksheet("orderreport");

        worksheet.columns = [
            { header: 'Date', key: 'date', width: 35},
            { header: 'Account', key: 'ac_name', width: 35},
            { header: 'Type', key: 'transec_type', width: 40},
            { header: 'Description', key: 'transec_detail', width: 35},
            { header: 'Debit', key: 'debit_amount', width: 30},
            { header: 'Credit', key: 'credit_amount', width: 30},
            { header: 'Balance', key: 'balance_amount', width: 30},
        ];
        transection_list.forEach(function(row){ worksheet.addRow(row); })

        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
            "Content-Disposition",
            "attachment; filename=" + "Transactionreport.xlsx"
        );
        return workbook.xlsx.write(res).then(function () {
            res.status(200).end
        });

        // res.redirect("/account/transection")
    } catch (error) {
        console.log(error);
    }
})






//<<<<<<< payout >>>>>>>
router.get('/payout', auth, async(req, res)=>{
    try {
        const {id,roll,store,loginas} = req.user;
        const accessdata = await access (req.user)
        if(loginas == 0){ req.flash("error", "Your Are Not Authorized For this");
        return res.redirect('back')}
        const multiy = await mySqlQury("SELECT type FROM tbl_master_shop");
        if(multiy[0].type == 0){ 
            req.flash("error", "This Page Not Faund");
            return res.redirect('back')
        }
        const rolldetail = await mySqlQury("select id,roll,account from tbl_roll where id = "+roll+"");
                if(rolldetail[0].roll === "master_Admin"){

                    var comi = await mySqlQury("SELECT SUM(master_comission) as amount FROM tbl_order")
                    var paidcomi = await mySqlQury("SELECT SUM(amount) as amount FROM tbl_commision")
                    var comission;
                    var paidcomission;




                    comi.length > 0 ? comission=Number(comi[0].amount).toFixed(2) : comission=0
                    paidcomi.length > 0 ? paidcomission=Number(paidcomi[0].amount).toFixed(2) : paidcomission=0
                    var due = parseFloat(comission) - parseFloat(paidcomission)
                    



                    var qury =`SELECT id,name,IFNULL((SELECT SUM(master_comission) FROM tbl_order WHERE store_id=tbl_store.id),0) as comiision,
                     IFNULL((SELECT SUM(amount) FROM tbl_commision WHERE store_id=tbl_store.id),0) as pay  FROM tbl_store WHERE status=1  `
                    const storeList = await mySqlQury(qury);
                   console.log(storeList);
                    res.render('payout',{storeList,accessdata,comission,paidcomission,due, language:req.language_data, language_name:req.language_name})

                }else{ 
                    req.flash("error", "Your Are Not Authorized For this");
                    return res.redirect('back')
                }
        
    } catch (error) {
        console.log(error);
    }
});

router.get('/payoutdetails/:id', auth, async(req, res)=>{
    try {
        const {id,roll,store,loginas} = req.user;
        const accessdata = await access (req.user)
        if(loginas == 0){ req.flash("error", "Your Are Not Authorized For this");
        return res.redirect('back')}
        const multiy = await mySqlQury("SELECT type FROM tbl_master_shop");
        if(multiy[0].type == 0){ 
            req.flash("error", "This Page Not Faund");
            return res.redirect('back')
        }
        const rolldetail = await mySqlQury("select id,roll,account from tbl_roll where id = "+roll+"");
                if(rolldetail[0].roll === "master_Admin"){

                    var storeid = req.params.id;
                    var storname = await mySqlQury("SELECT name FROM tbl_store WHERE id ="+storeid+"")

                    var qury ="SELECT tbl_account.*, sum(`credit_amount`) as credit, sum(`debit_amount`) as debit FROM tbl_account JOIN tbl_transections on tbl_account.id=tbl_transections.account_id WHERE tbl_account.store_ID= "+storeid+" AND delet_flage=0 GROUP BY tbl_account.id "
                    const account_list = await mySqlQury(qury);
                    
                    
                    res.render('payout_account_details',{account_list,storeid,storname:storname[0].name,accessdata, language:req.language_data, language_name:req.language_name})

                }else{ 
                    req.flash("error", "Your Are Not Authorized For this");
                    return res.redirect('back')
                }
        
    } catch (error) {
        console.log(error);
    }
});


router.get('/payoutransections/:id', auth, async(req, res)=>{
    try {
        const {id,roll,store,loginas} = req.user;
        const accessdata = await access (req.user)
        if(loginas == 0){ req.flash("error", "Your Are Not Authorized For this");
        return res.redirect('back')}
        const multiy = await mySqlQury("SELECT type FROM tbl_master_shop");

        if(multiy[0].type == 0){ 
            req.flash("error", "This Page Not Faund");
            return res.redirect('back')
        }

        const rolldetail = await mySqlQury("select id,roll,account from tbl_roll where id = "+roll+"");

        if(rolldetail[0].roll === "master_Admin"){
            var storeid = req.params.id;
            var qury =`SELECT tbl_transections.*, tbl_account.ac_name FROM tbl_transections JOIN tbl_account ON tbl_transections.account_id=tbl_account.id 
            WHERE tbl_transections.store_ID=${storeid}  `
            const transection_list = await mySqlQury(qury);
            const account_list = await mySqlQury("SELECT id,ac_name FROM tbl_account WHERE store_ID="+storeid+" AND delet_flage=0 ");
            var storname = await mySqlQury("SELECT name FROM tbl_store WHERE id ="+storeid+"")

            res.render('payout_transection_list',{transection_list,account_list,storeid,account:0,start_date:'',end_date:'',storname:storname[0].name,accessdata, language:req.language_data, language_name:req.language_name})

        }else{ 
            req.flash("error", "Your Are Not Authorized For this");
            return res.redirect('back')
        }
        
    } catch (error) {
        console.log(error);
    }
});

router.post('/payouttransefilter', auth, async (req, res)=>{
    try {
        const {id,roll,store,loginas} = req.user;
        const accessdata = await access (req.user)
        if(loginas == 0){ req.flash("error", "Your Are Not Authorized For this");
        return res.redirect('back')}

        const {account, start_date, end_date, store_id} = req.body;
        console.log("account" , account);
        console.log("start_date" , start_date);
        console.log("end_date" , end_date);
        // var qury =`SELECT tbl_transections.*, tbl_account.ac_name FROM tbl_transections JOIN tbl_account ON tbl_transections.account_id=tbl_account.id 
        // WHERE tbl_transections.account_id='${account}'  `
        // const transection_list = await mySqlQury(qury);
        // console.log(transection_list);

        var qury =`SELECT tbl_transections.*, tbl_account.ac_name FROM tbl_transections JOIN tbl_account ON tbl_transections.account_id=tbl_account.id 
        WHERE (tbl_transections.account_id = '${account}') AND (DATE(tbl_transections.date) BETWEEN '${start_date}' AND '${end_date}') `
        const transection_list = await mySqlQury(qury);
        console.log(transection_list);


        var storname = await mySqlQury("SELECT name FROM tbl_store WHERE id ="+store_id+"")

        const account_list = await mySqlQury("SELECT id,ac_name FROM tbl_account WHERE store_ID="+store_id+" AND delet_flage=0 ");
        res.render('payout_transection_list',{transection_list,account_list,storeid:store_id, account,start_date,end_date,storname:storname[0].name,accessdata, language:req.language_data, language_name:req.language_name})

        
    } catch (error) {
        console.log(error);
    }
})

router.get("/cashdownload/:id", auth, async(req, res)=>{
    try {
        const account = req.params.id.split('+')[0]
        const start_date = req.params.id.split('+')[1]
        const end_date = req.params.id.split('+')[2]

        var qury =`SELECT tbl_transections.*, tbl_account.ac_name FROM tbl_transections JOIN tbl_account ON tbl_transections.account_id=tbl_account.id 
        WHERE (tbl_transections.account_id = '${account}') AND (DATE(tbl_transections.date) BETWEEN '${start_date}' AND '${end_date}') `
        const transection_list = await mySqlQury(qury);

        transection_list.map(tval => {
            let Order_date = new Date(tval.date)
            let Order_day = (Order_date.getDate() < 10 ? '0' : '') + Order_date.getDate()
            let Order_month = ((Order_date.getMonth()+1) < 10 ? '0' : '') + (Order_date.getMonth()+1)
            let Order_year = Order_date.getFullYear()
            let Order_fullDate = `${Order_year}-${Order_month}-${Order_day}`
            tval.date = Order_fullDate
        })

        let workbook = new Excel.Workbook();
        let worksheet = workbook.addWorksheet("orderreport");

        worksheet.columns = [
            { header: 'Date', key: 'date', width: 35},
            { header: 'Account', key: 'ac_name', width: 35},
            { header: 'Type', key: 'transec_type', width: 40},
            { header: 'Description', key: 'transec_detail', width: 35},
            { header: 'Debit', key: 'debit_amount', width: 30},
            { header: 'Credit', key: 'credit_amount', width: 30},
            { header: 'Balance', key: 'balance_amount', width: 30},
        ];
        transection_list.forEach(function(row){ worksheet.addRow(row); })

        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
            "Content-Disposition",
            "attachment; filename=" + "Cashreport.xlsx"
        );
        return workbook.xlsx.write(res).then(function () {
         res.status(200).end
        });

    } catch (error) {
        console.log(error);
    }
})



router.post('/comission', auth, async (req, res)=>{
    try {
        
        const {id,roll,store,loginas} = req.user;
        if(loginas == 0){
        req.flash("error", "Your Are Not Authorized For this");
        return res.redirect('back')}
        
        const rolldetail = await mySqlQury("select id,roll,account from tbl_roll where id = "+roll+"");
                if(rolldetail[0].account.includes('write')){
                   
                   const { due_amount,pay_amount,to_account,from_account,date,description} = req.body

                //     <<<< comission table entry >>>>>>
                    await mySqlQury(`INSERT INTO tbl_commision (date,amount,from_account,to_account,description,store_id) VALUE (
                    '${date}','${pay_amount}','${from_account}','${to_account}','${description}','${store}')`)

                  

                    // <<<< to Account update >>>>>>>>>>
                    const toaccoumt = await mySqlQury("SELECT * FROM tbl_account WHERE id="+to_account+"")
                    const tobalance = parseFloat(toaccoumt[0].balance) + parseFloat(pay_amount)
                    await mySqlQury("UPDATE tbl_account SET balance="+tobalance+" WHERE id="+to_account+"")
                    await mySqlQury(`insert into tbl_transections (account_id,store_ID,transec_detail,transec_type,debit_amount,
                        credit_amount,balance_amount,date, customer_id) VALUE ('${to_account}','1','Store Comission','INCOME',
                        0,${pay_amount},${tobalance},'${date}', '0' )`)

                    //  <<<<<<  FROM Account update >>>>>>>>>> 
                    const fromaccoumt = await mySqlQury("SELECT * FROM tbl_account WHERE id="+from_account+"")
                    const frombalance = parseFloat(fromaccoumt[0].balance) - parseFloat(pay_amount)
                    await mySqlQury("UPDATE tbl_account SET balance="+frombalance+" WHERE id="+from_account+"")
                    await mySqlQury(`insert into tbl_transections (account_id,store_ID,transec_detail,transec_type,debit_amount,
                        credit_amount,balance_amount,date, customer_id) VALUE ('${from_account}','${fromaccoumt[0].store_ID}','Store Comission Pay','EXPENCE',
                        ${pay_amount},0,${frombalance},'${date}', '0' )`)





                    req.flash("success", "Payment Success Full !!!!");
                    res.redirect('back')

                }else{ 

                    req.flash("error", "Your Are Not Authorized For this");
                    return res.redirect('back')
                }
        
        
    } catch (error) {
        console.log();
    }
})




module.exports = router