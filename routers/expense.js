const express = require('express');
const {mySqlQury} = require('../middelwer/db');
const router = express.Router();
const auth = require('../middelwer/auth');
const access = require('../middelwer/access')



// Expence Category Type
router.get('/categorytype',auth, async (req, res)=>{
    try {
        const {id,roll,store,loginas} = req.user;
        const accessdata = await access (req.user)

        const storeList = await mySqlQury("SELECT id,name FROM tbl_store WHERE status=1 AND delete_flage=0");
            if(loginas == 0){ req.flash("error", "Your Are Not Authorized For this");
            return res.redirect('back')}

            const rolldetail = await mySqlQury("select id,roll,expense from tbl_roll where id = "+roll+"");
            if(rolldetail[0].roll === "master_Admin"){

                const multiy = await mySqlQury("SELECT type FROM tbl_master_shop");
                if(multiy[0].type == 1){
                    var qury = "SELECT tbl_exp_cat_type.*,tbl_store.name as store FROM tbl_exp_cat_type join tbl_store on tbl_exp_cat_type.store_ID=tbl_store.id WHERE tbl_exp_cat_type.delet_flage=0"
                    var ismulty = true
                }else{
                    var qury = "SELECT tbl_exp_cat_type.*,tbl_store.name as store FROM tbl_exp_cat_type join tbl_store on tbl_exp_cat_type.store_ID=tbl_store.id WHERE tbl_exp_cat_type.delet_flage=0 AND store_ID= 1"
                    var ismulty = false
                }


                const data = await mySqlQury(qury);
                
                res.render('expensetype', {type:data, ismulty, storeList,accessdata, language:req.language_data, language_name:req.language_name})

            }else if(rolldetail[0].expense.includes('read')){

                const data = await mySqlQury("SELECT * FROM tbl_exp_cat_type WHERE delet_flage=0 AND store_ID="+store+"");
                res.render('expensetype', {type:data, ismulty:false, storeList:[],accessdata, language:req.language_data, language_name:req.language_name})

            }else{

                req.flash("error", "Your Are Not Authorized For this");
                return res.redirect('back')

            }
      
    } catch (error) {
        console.log(error);
    }
});

router.post('/addcategorytype',auth, async (req, res)=>{
    try {
         
        const {id,roll,store,loginas} = req.user;
        if(loginas == 0){ req.flash("error", "Your Are Not Authorized For this");
        return res.redirect('back')}
        const rolldetail = await mySqlQury("select id,roll,expense from tbl_roll where id = "+roll+"");
        if(rolldetail[0].roll === "master_Admin" || rolldetail[0].expense.includes('write')){


                const name = req.body.name
                var storeid = req.body.storeid
                storeid ? storeid : storeid=store
                var qury = "INSERT INTO tbl_exp_cat_type (type_name,store_ID) VALUE ('"+name+"',"+storeid+")"
                const data = await mySqlQury(qury);
                req.flash("success", "Expense Category Type Added");
                res.redirect('/expense/categorytype')

        }else{
            req.flash("error", "Your Are Not Authorized For this");
            return res.redirect('back')
        } 
    } catch (error) {
        console.log(error);
    }
});

router.post('/updatecategorytype/:id', auth, async (req, res)=>{
    try {
         
        const {id,roll,store,loginas} = req.user;
        if(loginas == 0){ req.flash("error", "Your Are Not Authorized For this");
        return res.redirect('back')}
        const rolldetail = await mySqlQury("select id,roll,expense from tbl_roll where id = "+roll+"");
        if(rolldetail[0].roll === "master_Admin" || rolldetail[0].expense.includes('edit')){

                        var dataid = req.params.id;
                        const name = req.body.name
                        var qury = "UPDATE tbl_exp_cat_type SET type_name='"+name+"' WHERE id="+dataid+""
                        const data = await mySqlQury(qury);
                        req.flash("success", "Expense Category Type Update success");
                        res.redirect('back')

        }else{
            req.flash("error", "Your Are Not Authorized For this");
            return res.redirect('back')
        } 
    
    } catch (error) {
        console.log(error);
    }
});

router.get('/deletcategorytype/:id',auth, async (req, res)=>{
    try {
         
        const {id,roll,store,loginas} = req.user;
        if(loginas == 0){ req.flash("error", "Your Are Not Authorized For this");
        return res.redirect('back')}
        const rolldetail = await mySqlQury("select id,roll,expense from tbl_roll where id = "+roll+"");
        if(rolldetail[0].roll === "master_Admin" || rolldetail[0].expense.includes('delete')){

                var dataid = req.params.id;
                var qury = "UPDATE tbl_exp_cat_type SET delet_flage=1 WHERE id="+dataid+""
                const data = await mySqlQury(qury);
                req.flash("success", "Expense Category Type Delet success");
                res.redirect('back')
        }else{
        req.flash("error", "Your Are Not Authorized For this");
        return res.redirect('back')
        } 

    } catch (error) {
        console.log(error);
    }
});

router.get('/cattypelist/:id', async (req, res)=>{
    try {
        var id = req.params.id;
        const data = await mySqlQury("SELECT * FROM tbl_exp_cat_type WHERE delet_flage=0 AND store_ID="+id+"");

        res.status(200).json({data:data})
    } catch (error) {
        console.log(error);        
    }
} )



// Expense Category
router.get('/categorylist', auth, async (req, res)=>{
    try { const {id,roll,store,loginas} = req.user;
    const accessdata = await access (req.user)
        const storeList = await mySqlQury("SELECT id,name FROM tbl_store WHERE status=1 AND delete_flage=0");
      

        if(loginas == 0){ req.flash("error", "Your Are Not Authorized For this");
        return res.redirect('back')}
        const rolldetail = await mySqlQury("select id,roll,expense from tbl_roll where id = "+roll+"");

        if(rolldetail[0].roll === "master_Admin"){
            const data = await mySqlQury("SELECT * FROM tbl_exp_cat_type WHERE delet_flage=0 AND store_ID="+store+"");
            const multiy = await mySqlQury("SELECT type FROM tbl_master_shop");
            if(multiy[0].type == 1){
                var qury = `SELECT tbl_exp_cat.id,tbl_exp_cat.store_ID,tbl_exp_cat.exp_cat_type_id,tbl_exp_cat.cat_name,tbl_exp_cat.delet_flage,
                tbl_exp_cat_type.type_name,tbl_store.name as store FROM tbl_exp_cat join tbl_exp_cat_type on tbl_exp_cat.exp_cat_type_id=tbl_exp_cat_type.id join tbl_store on tbl_exp_cat.store_ID=tbl_store.id
                WHERE tbl_exp_cat.delet_flage=0`
                var ismulty = true
            }else{
                var qury = `SELECT tbl_exp_cat.id,tbl_exp_cat.store_ID,tbl_exp_cat.exp_cat_type_id,tbl_exp_cat.cat_name,tbl_exp_cat.delet_flage,
                tbl_exp_cat_type.type_name,tbl_store.name as store FROM tbl_exp_cat join tbl_exp_cat_type on tbl_exp_cat.exp_cat_type_id=tbl_exp_cat_type.id join tbl_store on tbl_exp_cat.store_ID=tbl_store.id
                WHERE tbl_exp_cat.delet_flage=0 AND tbl_exp_cat.store_ID= 1 `
                var ismulty = false
            }

            const list = await mySqlQury(qury);
    
            res.render('expenceCategory',{type:data, list:list,ismulty,storeList,accessdata, language:req.language_data, language_name:req.language_name })

        }else if(rolldetail[0].expense.includes('read')){

            const data = await mySqlQury("SELECT * FROM tbl_exp_cat_type WHERE delet_flage=0 AND store_ID="+store+"");
            const list = await mySqlQury(`SELECT tbl_exp_cat.id,tbl_exp_cat.store_ID,tbl_exp_cat.exp_cat_type_id,tbl_exp_cat.cat_name,tbl_exp_cat.delet_flage,
            tbl_exp_cat_type.type_name FROM tbl_exp_cat join tbl_exp_cat_type on tbl_exp_cat.exp_cat_type_id=tbl_exp_cat_type.id 
            WHERE tbl_exp_cat.delet_flage=0 AND tbl_exp_cat.store_ID=${store}`);
    
            res.render('expenceCategory',{type:data, list:list,ismulty:false, storeList:[] ,accessdata, language:req.language_data, language_name:req.language_name})

        }else{

            req.flash("error", "Your Are Not Authorized For this");
             return res.redirect('back')
        }
        
    } catch (error) {
        console.log(error);
    }
});

router.post('/addexpcate',auth, async (req, res)=>{
    try {
         
        const {id,roll,store,loginas} = req.user;
        if(loginas == 0){ req.flash("error", "Your Are Not Authorized For this");
        return res.redirect('back')}
        const rolldetail = await mySqlQury("select id,roll,expense from tbl_roll where id = "+roll+"");
        if(rolldetail[0].roll === "master_Admin" || rolldetail[0].expense.includes('write')){

                var {name, type_id ,storeid} = req.body;
                storeid ? storeid : storeid=store
                const data = await mySqlQury("INSERT INTO tbl_exp_cat (exp_cat_type_id,cat_name,store_ID) VALUE ('"+type_id+"','"+name+"', "+storeid+") ");
                req.flash("success", "Expense Category Added");
                res.redirect('back')
        }else{
            req.flash("error", "Your Are Not Authorized For this");
            return res.redirect('back')
        } 
    } catch (error) {
        console.log(error);
    }
});

router.post('/updateexpcat/:id',auth, async (req, res)=>{
    try {
         
        const {id,roll,store,loginas} = req.user;
        if(loginas == 0){ req.flash("error", "Your Are Not Authorized For this");
        return res.redirect('back')}
        const rolldetail = await mySqlQury("select id,roll,expense from tbl_roll where id = "+roll+"");
        if(rolldetail[0].roll === "master_Admin" || rolldetail[0].expense.includes('edit')){

                var dataid = req.params.id;
                var cattypid = req.body.type_id;
                var name = req.body.name;

                var qury = "UPDATE tbl_exp_cat SET exp_cat_type_id='"+cattypid+"',cat_name='"+name+"' WHERE id="+dataid+""
                const data = await mySqlQury(qury);
                req.flash("success", "Expense Category Updated");
                res.redirect('back')
        }else{
            req.flash("error", "Your Are Not Authorized For this");
            return res.redirect('back')
        } 
    } catch (error) {
        console.log(error);
    }
});

router.get('/deletexpcat/:id',auth, async (req, res)=>{
    try {
         
        const {id,roll,store,loginas} = req.user;
        if(loginas == 0){ req.flash("error", "Your Are Not Authorized For this");
        return res.redirect('back')}
        const rolldetail = await mySqlQury("select id,roll,expense from tbl_roll where id = "+roll+"");
        if(rolldetail[0].roll === "master_Admin" || rolldetail[0].expense.includes('delete')){

                var dataid = req.params.id;
                var qury = "UPDATE tbl_exp_cat SET delet_flage= 1 WHERE id="+dataid+""
                const data = await mySqlQury(qury);
                req.flash("success", "Expense Category Updated");
                res.redirect('back')

        }else{
            req.flash("error", "Your Are Not Authorized For this");
            return res.redirect('back')
        } 
    } catch (error) {
        console.log(error);
    }
})

// <<<<<<<<<<<<<<< expense category list and account by store id >>>>>>>>>>>>>>>>>
router.get('/expcatlist/:id',auth, async (req, res)=>{
    try {
        const {id,roll,store,loginas} = req.user;
        if(loginas == 0){ req.flash("error", "Your Are Not Authorized For this");
        return res.redirect('back')}
        const rolldetail = await mySqlQury("select id,roll,expense from tbl_roll where id = "+roll+"");
        if(rolldetail[0].roll === "master_Admin" || rolldetail[0].expense.includes('write')){

                var dataid = req.params.id;
                var qury =`SELECT id,cat_name FROM tbl_exp_cat WHERE delet_flage=0 AND store_ID= ${dataid} `
                const data = await mySqlQury(qury);
                const acountlist = await mySqlQury("SELECT id, ac_name From tbl_account WHERE store_ID="+dataid+" ");
             
                res.status(200).json({data:data, acountlist})

        }else{
            req.flash("error", "Your Are Not Authorized For this");
            return res.redirect('back')
        } 
    } catch (error) {
        console.log(error);
    }
})



//>>>>>>>>>>>>>Expense List <<<<<<<<<<<<<<<
router.get('/list', auth, async (req, res)=>{
    try {
        
        const {id,roll,store,loginas} = req.user;
        const accessdata = await access (req.user)
       
        if(loginas == 0){ req.flash("error", "Your Are Not Authorized For this");
        return res.redirect('back')}

        const storeList = await mySqlQury("SELECT id,name FROM tbl_store WHERE status=1 AND delete_flage=0");
        const rolldetail = await mySqlQury("select id,roll, expense from tbl_roll where id = "+roll+"");
       
        if(rolldetail[0].roll === "master_Admin"){

            const multiy = await mySqlQury("SELECT type FROM tbl_master_shop");
            if(multiy[0].type == 1){
                var qury =`SELECT tbl_expense.id,tbl_expense.date,tbl_expense.amount,tbl_expense.taxpercent,tbl_expense.category,tbl_expense.store_ID,towards,tbl_exp_cat.cat_name,taxInclud,payment_mode, tbl_admin.name, tbl_store.name as store, tbl_account.ac_name from tbl_expense join tbl_account on tbl_expense.payment_mode=tbl_account.id join tbl_admin on tbl_expense.created_by=tbl_admin.id join tbl_exp_cat on tbl_expense.category=tbl_exp_cat.id JOIN tbl_store on tbl_expense.store_ID=tbl_store.id where tbl_expense.delet_flage=0`
                var ismulty = true
                var account = "SELECT id, ac_name From tbl_account WHERE store_ID=0 "
            }else{
                var qury = `SELECT tbl_expense.id,tbl_expense.date,tbl_expense.amount,tbl_expense.taxpercent,tbl_expense.category,tbl_expense.store_ID,towards,tbl_exp_cat.cat_name,taxInclud,payment_mode, tbl_admin.name, tbl_store.name as store, tbl_account.ac_name from tbl_expense join tbl_account on tbl_expense.payment_mode=tbl_account.id join tbl_admin on tbl_expense.created_by=tbl_admin.id join tbl_exp_cat on tbl_expense.category=tbl_exp_cat.id JOIN tbl_store on tbl_expense.store_ID=tbl_store.id  where tbl_expense.delet_flage=0 AND tbl_expense.store_ID =1 `
                var ismulty = false
                var account = "SELECT id, ac_name From tbl_account WHERE store_ID=1 "
            }

           
        }else if(rolldetail[0].expense.includes('read')){
            var ismulty = false
            var account = "SELECT id, ac_name From tbl_account WHERE store_ID="+store+" "
            var qury = "SELECT tbl_expense.id,tbl_expense.date,tbl_expense.amount,tbl_expense.taxpercent,tbl_expense.category,tbl_expense.store_ID,towards,tbl_exp_cat.cat_name,taxInclud,payment_mode, tbl_admin.name, tbl_store.name as store, tbl_account.ac_name from tbl_expense join tbl_account on tbl_expense.payment_mode=tbl_account.id join tbl_admin on tbl_expense.created_by=tbl_admin.id join tbl_exp_cat on tbl_expense.category=tbl_exp_cat.id JOIN tbl_store on tbl_expense.store_ID=tbl_store.id where tbl_expense.delet_flage=0 AND tbl_expense.store_ID="+store+""
        }

       


        const expencategory = await mySqlQury("SELECT id,cat_name FROM tbl_exp_cat WHERE delet_flage=0 AND store_ID="+store+"");
        const acountlist = await mySqlQury(account);

    
        const expdata = await mySqlQury(qury);
       
           
        res.render('expensList',{categ:expencategory, expenlist:expdata, ismulty, storeList,acountlist,accessdata, language:req.language_data, language_name:req.language_name})
        
    } catch (error) {
        console.log(error);
    }
});

router.post('/addexpense', auth, async (req, res) =>{
    try {
         
        const {id,roll,store,loginas} = req.user;
        
        
        if(loginas == 0){ req.flash("error", "Your Are Not Authorized For this");
        return res.redirect('back')}

        const rolldetail = await mySqlQury("select id,roll,expense from tbl_roll where id = "+roll+"");
        if(rolldetail[0].roll === "master_Admin" || rolldetail[0].expense.includes('write')){


                const {date, category, amount, payment, tax, notes,tax_percent} = req.body;
                 
                var storeid = req.body.storeid
                storeid ? storeid : storeid=store

                
                const account = await mySqlQury("SELECT * FROM tbl_account WHERE id="+payment+"")
                const balance = parseFloat(account[0].balance) - parseFloat(amount)
                await mySqlQury("UPDATE tbl_account SET balance="+balance+" WHERE id="+payment+" ")
                    var newentry = await mySqlQury(`insert into tbl_transections (account_id,store_ID,transec_detail,transec_type,debit_amount,
                    credit_amount,balance_amount,date, customer_id) VALUE ('${payment}','${account[0].store_ID}','${notes}','EXPENCE',
                    ${amount},0,${balance},'${date}', '0')`)
                var tansec = newentry.insertId
               
                    
             

                var qury = "INSERT INTO tbl_expense (date,amount,towards,taxInclud,payment_mode,category,created_by,taxpercent,transection_id,store_ID) VALUE ('"+date+"','"+amount+"','"+notes+"','"+tax+"','"+payment+"','"+category+"','"+id+"','"+tax_percent+"','"+tansec+"','"+storeid+"')"
                const data = await mySqlQury(qury);



                req.flash("success", "Expense Add Success ");
                res.redirect('back')

        }else{
            req.flash("error", "Your Are Not Authorized For this");
            return res.redirect('back')
        } 

    } catch (error) {
        req.flash("error", error.message);
        console.log(error);
    }
});

router.post('/updateexp/:id', auth, async (req, res)=>{
    try {
         
        const {id,roll,store,loginas} = req.user;
        if(loginas == 0){ req.flash("error", "Your Are Not Authorized For this");
        return res.redirect('back')}
        const rolldetail = await mySqlQury("select id,roll,expense from tbl_roll where id = "+roll+"");
        if(rolldetail[0].roll === "master_Admin" || rolldetail[0].expense.includes('edit')){

        var dataid = req.params.id
       const {date_update, expense_category, amount_update, payment_update, tax, notes_update,tax_percent} = req.body;


       const expense = await mySqlQury("SELECT * FROM tbl_expense WHERE id="+dataid+"")
       const transection = await mySqlQury(" SELECT * FROM tbl_transections WHERE id="+expense[0].transection_id+"")

       if(transection[0].account_id == payment_update){
                const account = await mySqlQury("SELECT * FROM tbl_account WHERE id="+payment_update+"")
                const balance = parseFloat(account[0].balance) + parseFloat(expense[0].amount - amount_update )
                await mySqlQury("UPDATE tbl_account SET balance="+balance+" WHERE id="+payment_update+" ")
                await mySqlQury(`UPDATE tbl_transections SET transec_detail='${notes_update}',debit_amount=${amount_update},
                balance_amount=${balance},date='${date_update}' WHERE id=${expense[0].transection_id}`)
       }else{
                const oldaccount = await mySqlQury("SELECT * FROM tbl_account WHERE id="+transection[0].account_id+"")
                const oldaccbalance = parseFloat(oldaccount[0].balance) + parseFloat(expense[0].amount)

               
                await mySqlQury("UPDATE tbl_account SET balance="+oldaccbalance+" WHERE id="+transection[0].account_id+" ")

                const newaccount = await mySqlQury("SELECT * FROM tbl_account WHERE id="+payment_update+"")
                const newaccbalance = parseFloat(newaccount[0].balance) - parseFloat(amount_update)
                await mySqlQury("UPDATE tbl_account SET balance="+newaccbalance+" WHERE id="+payment_update+" ")
                await mySqlQury(`UPDATE tbl_transections SET account_id='${payment_update}',transec_detail='${notes_update}',
                debit_amount=${amount_update},balance_amount=${newaccbalance},date='${date_update}' WHERE id=${expense[0].transection_id}`)

       }

        var qury = `UPDATE tbl_expense SET date='${date_update}',amount='${amount_update}',towards='${notes_update}',
        taxInclud='${tax}',payment_mode='${payment_update}',category='${expense_category}', taxpercent=${tax_percent} WHERE id=${dataid}`
        const data = await mySqlQury(qury);
        req.flash("success", "Expense Updated");
        res.redirect('back')

        }else{
            req.flash("error", "Your Are Not Authorized For this");
            return res.redirect('back')
        } 
    } catch (error) {
        
    }
})

router.get('/deletexpe/:id', auth, async (req, res)=>{
    try {
         
        const {id,roll,store,loginas} = req.user;
    if(loginas == 0){ req.flash("error", "Your Are Not Authorized For this");
    return res.redirect('back')}
    const rolldetail = await mySqlQury("select id,roll,expense from tbl_roll where id = "+roll+"");
    if(rolldetail[0].roll === "master_Admin" || rolldetail[0].expense.includes('delete')){

        var dataid = req.params.id
       
        var qury = `UPDATE tbl_expense SET delet_flage=1 WHERE id=${dataid}`

        const data = await mySqlQury(qury);
        req.flash("success", "Expense Deleted");
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