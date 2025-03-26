const express = require('express');
const {mySqlQury} = require('../middelwer/db');
const router = express.Router();
const auth = require('../middelwer/auth');
const access = require('../middelwer/access')



router.get('/list',auth,  async(req, res)=>{
    const {id,roll,store,loginas} = req.user
    const accessdata = await access (req.user)

    const storeList = await mySqlQury("SELECT id,name FROM tbl_store WHERE status=1 AND delete_flage=0");
    const multiy = await mySqlQury("SELECT type FROM tbl_master_shop");
    if(multiy[0].type == 1){
        var ismulty = true
    }else{
        var ismulty = false
    }


    if (loginas == 0){
        var ismulty = false
        var qury = "SELECT * FROM tbl_customer where id="+id+""
        var login = "customer"

    }else{
       
        const rolldetail = await mySqlQury("select id,roll from tbl_roll where id = "+roll+"");
        if(rolldetail[0].roll === "master_Admin"){
            var login = "master"
            var qury = "SELECT tbl_customer.*, tbl_store.name as store FROM tbl_customer JOIN tbl_store on tbl_customer.store_ID=tbl_store.id WHERE tbl_customer.delet_flage=0"
        }else {
            var login = "store"
            var qury = "SELECT * FROM tbl_customer where store_ID="+store+""
        }
    }


   
    

    let alldata = await mySqlQury(qury);
    let newdata = alldata.map(async (dval) =>{
        let ledger = await mySqlQury(`SELECT COUNT(*) AS tot_ledger FROM tbl_transections WHERE store_ID = '${dval.store_ID}' AND customer_id = '${dval.id}'`);
        dval.tot_ledger = ledger[0].tot_ledger
        return dval;
    });
    let data = await Promise.all(newdata);
   
    res.render('coustomer',{coustormdata:data, login, ismulty,storeList,accessdata, language:req.language_data, language_name:req.language_name})
})

router.post('/update/:id', async (req, res)=>{
    try {
         
        const id = req.params.id

      
        const {name, number, email,  tax, address} = req.body;
       var active;
       req.body.active == 0 ? active=0 : active=1

       var approved;
       req.body.approved == 1 ? approved=1 : approved=0

       var qury = "UPDATE tbl_customer SET name='"+name+"',number='"+number+"',email='"+email+"',address='"+address+"',taxnumber='"+tax+"', approved='"+approved+"',delet_flage='"+active+"' WHERE id="+id+" "
       const data = await mySqlQury(qury);
      
       req.flash("success", "Your Data is UPDATE Success Fully");
       res.redirect('/coustomer/list')
    } catch (error) {
        console.log(error);
    }
});

router.post('/register',auth, async (req, res)=>{
    try {

        const {id,roll,store,loginas} = req.user;
        if (loginas == 0){

            req.flash("error", "Your Are Not Authorized For this");
            return res.redirect('back')
    
        }else {
            

            const { name, number, email, taxnumber, address, username, password} = req.body;
            var storeid = req.body.storeid
            storeid ? storeid : storeid=store

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
            
     
            var qury = "INSERT INTO tbl_customer (name,number,email,address,taxnumber,username,password,store_ID,approved) VALUE ('"+name+"','"+number+"','"+email+"','"+address+"','"+taxnumber+"','"+username+"','"+password+"',"+storeid+", 1 )"

            const data = await mySqlQury(qury);
            req.flash("success", "Your data has been sent to the administration for approval!");
            res.redirect('back')
        }

    } catch (error) {
        console.log(error);
    }
})



router.get("/ledger/:id", auth, async(req, res)=>{
    try {
        const accessdata = await access(req.user);

        console.log(req.params.id);

        var qury = `SELECT tbl_transections.*, COALESCE(tbl_account.ac_name, "") AS ac_name
                    FROM tbl_customer 
                    LEFT JOIN tbl_transections ON tbl_customer.store_ID = tbl_transections.store_ID AND tbl_customer.id = tbl_transections.customer_id
                    LEFT JOIN tbl_account ON tbl_transections.account_id=tbl_account.id
                    WHERE tbl_customer.id = '${req.params.id}'`;

        const transection_list = await mySqlQury(qury);

        res.render("customer_ledger", {
            accessdata, language:req.language_data, language_name:req.language_name, transection_list
        });
    } catch (error) {
        console.log(error);
    }
});







module.exports = router