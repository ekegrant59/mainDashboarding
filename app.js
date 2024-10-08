require('dotenv').config()
const express = require('express') 
const ejs = require('ejs')
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const cookieParser = require('cookie-parser')
const jwt = require('jsonwebtoken')
const session = require('express-session')

const accountSchema = require('./schema/accountSchema')
const pinSchema = require('./schema/pinSchema')
const transactionSchema = require('./schema/transactionSchema')
const userSchema = require('./schema/userSchema')
const cryptoTransSchema = require('./schema/cryptoTransSchema')
const cardSchema = require('./schema/cardSchema')


const secretkey = process.env.SECRETKEY

const mongodb = process.env.MONGODB
mongoose.connect(mongodb)
.then(() => {
   console.log('Connection successful')
}).catch((err) => {
    console.log(err, "Connection failed")
})

const app = express()
app.use('/assets', express.static('assets')) 
app.set('view engine', 'ejs')
app.use(express.urlencoded({extended: true}))
app.use(cookieParser())
app.use(express.json())
app.use(
    session({
      resave: false,
      saveUninitialized: true,
      secret: 'secret',
    })
);

app.use(require('connect-flash')());
app.use(function (req, res, next) {
  res.locals.messages = require('express-messages')(req, res);
  next();
});

function protectRoute(req, res, next){
    const token = req.cookies.logintoken
    try{
        const user = jwt.verify(token, secretkey)

        req.user = user
        // console.log(req.user)
        next()
    }
    catch(err){
        res.clearCookie('logintoken')
        return res.render('signIn')
    }
}


app.get('/signin', (req,res)=>{
    res.render('signIn')
})

app.post('/signin', async (req,res)=>{
    const loginInfo = req.body

    const email = loginInfo.email
    const password = loginInfo.password

    userSchema.findOne({email})
    .then((user)=>{
        userSchema.findOne({email: email}, (err,details)=>{
            if(!details){
                req.flash('danger','User not found!, Please try again')
                res.redirect('/')
            } else{
                bcrypt.compare(password, user.password, async (err,data)=>{
                    if(data){
                        const payload1 = {
                            user:{
                                email: user.email
                            }
                        }
                        const token1 = jwt.sign(payload1, secretkey,{
                            expiresIn: '3600s'
                        })

                        res.cookie('logintoken', token1, {
                            httpOnly: false
                        })

                        res.redirect('/')
                    } else{
                        req.flash('danger', 'Incorrect Password, Please Try Again!')
                        res.redirect('/signin')
                    }
                })
            }
        })
    }).catch((err)=>{
        console.log(err)
    })
})

app.get('/', protectRoute, async (req,res)=>{
    try {
        const auser = req.user.user.email
        const user = await userSchema.findOne({email: auser}).populate('pin').populate('transaction').populate('account')
        res.render('index', {user: user})
    } catch (error) {
        console.log(error)
    }
})

app.get('/logout', (req,res)=>{
    res.clearCookie('logintoken')
    res.redirect('/')
})

app.get('/profile',protectRoute, async (req,res)=>{
    try {
        const auser = req.user.user.email
        const user = await userSchema.findOne({email: auser}).populate('pin').populate('transaction').populate('account')
        res.render('profile', {user: user})
    } catch (error) {
        console.log(error)
    }
})

app.get('/cards', protectRoute, async (req,res)=>{
    try {
        const auser = req.user.user.email
        const user = await userSchema.findOne({email: auser}).populate('pin').populate('transaction').populate('account').populate('cryptotransaction').populate('card')
        res.render('cards', {user: user})
    } catch (error) {
        console.log(error)
    }
})

app.get('/transfer', protectRoute, async (req,res)=>{
    try {
        const auser = req.user.user.email
        const user = await userSchema.findOne({email: auser}).populate('pin').populate('transaction').populate('account')
        res.render('transfer', {user: user})
    } catch (error) {
        console.log(error)
    }
})

app.get('/imf', protectRoute, async (req,res)=>{
    try {
        const auser = req.user.user.email
        const user = await userSchema.findOne({email: auser}).populate('pin').populate('transaction').populate('account')
        res.render('imf', {user: user})
    } catch (error) {
        console.log(error)
    }
})

app.get('/otp',protectRoute,  async (req,res)=>{
    try {
        const auser = req.user.user.email
        const user = await userSchema.findOne({email: auser}).populate('pin').populate('transaction').populate('account')
        res.render('otp', {user: user})
    } catch (error) {
        console.log(error)
    }
})

app.get('/tax',protectRoute,  async (req,res)=>{
    try {
        const auser = req.user.user.email
        const user = await userSchema.findOne({email: auser}).populate('pin').populate('transaction').populate('account')
        res.render('tax', {user: user})
    } catch (error) {
        console.log(error)
    }
})

app.get('/signinout', async (req, res) => {
  try {
    res.render('signInOut');
  } catch (error) {
    console.log(error);
  }
});

app.get('/transactionReciept',protectRoute, async (req, res) => {
  try {
    const auser = req.user.user.email
    const user = await userSchema.findOne({email: auser}).populate('pin').populate('transaction').populate('account')
    res.render('transactionReciept',{user:user});
  } catch (error) {
    console.log(error);
  }
});

app.get('/getTransactions/:id', async (req,res)=>{
    const id = req.params.id

    const user = await userSchema.findById(id).populate('account').populate('pin').populate('transaction')
    const transactions = user.transaction

    res.send(transactions)
})

const port = process.env.PORT || 9000

app.listen(port, ()=>{
    console.log(`App started on port ${port}`)
} )
