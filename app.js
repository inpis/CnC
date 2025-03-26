const express = require('express');
const app = express();
require('dotenv').config({path:'config.env'});
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const path = require('path');
const ejs = require('ejs');
const {conn} = require('./middelwer/db');
const session = require('express-session');
const flash = require('connect-flash');
var cors = require('cors');
const nocache = require("nocache");
const setTZ = require('set-tz') ;



const PORT = process.env.PORT || 3000;



const loginRouter = require('./routers/login')
const coustomerRouter = require('./routers/coustomer');
const expenseRouter = require('./routers/expense');
const toolROuter = require('./routers/tool');
const servicesRouter = require('./routers/services');
const reports = require('./routers/reports');
const accountRouter = require('./routers/account');

// set the view engine to ejs
app.set('view engine', 'ejs');

app.use(session({
    secret:'flashblog',
    saveUninitialized: true,
    resave: true,
    maxAge: 60 * 1000,
}));

// set default timeZone

conn.query("SELECT timezone FROM tbl_master_shop where id=1", (err, row)=>{
    if (err)  throw new err;
    setTZ(row[0].timezone)
});


app.use((req, res, next) => {
  conn.query("SELECT data FROM tbl_validate", (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      return next(err);
    }
    const scriptFile = results[0].data; // Get the script file data

    // Set the scriptFile variable in res.locals
    res.locals.scriptFile = scriptFile;
    next();
  });
});


  





// set express static
app.use(nocache());
app.use(express.static(path.join(__dirname, 'public')))
app.set(path.join(__dirname, 'uploads'));
app.set(path.join(__dirname, 'public'))
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
app.use(cookieParser());
app.use(flash());
app.use(cors())


app.use(function (req, res, next) {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    next();
  });

app.use('/', loginRouter);
app.use('/coustomer', coustomerRouter);
app.use('/expense', expenseRouter);
app.use('/tool', toolROuter);
app.use('/services', servicesRouter);
app.use('/report', reports);
app.use('/account', accountRouter);
app.use('/app', require('./routers/app_login'));
app.use('/admin', require('./routers/pos'))
app.use('/coupon', require('./routers/coupon'));
app.use('/order', require('./routers/order'));



// init port
app.listen(PORT, ()=>{
    console.log(`server running on port ${PORT}`);
})