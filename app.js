if(process.env.Node_ENV!=="production"){
    require('dotenv').config();
}
const express = require('express');
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate');
const path = require('path');
const catchAsync = require('./utils/catchAsync')
const session = require('express-session')
const flash = require('connect-flash')
const ExpressError = require('./utils/ExpressError')
const roadViolation = require('./models/roadViolation');
const registrations = require('./models/registrations');
const methodOverride = require('method-override');
const Joi = require('joi');
const passport = require('passport')
const LocalStrategy = require('passport-local')
const User = require('./models/user')
const { isLoggedIn } = require('./middleware');
const police = require('./models/police');
const multer=require('multer');
const {storage}=require('cloudinary')
const upload=multer({storage})


mongoose.connect('mongodb://localhost:27017/road-violation');

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error"));

db.once("open", () => {
    console.log("Database connected");
})

const app = express();

app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'))


const sessionConfig = {
    secret: 'this',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}
app.use(session(sessionConfig))
app.use(flash())

app.use(passport.initialize())
app.use(passport.session())
passport.use(new LocalStrategy(User.authenticate()))

passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())

app.use((req, res, next) => {
    res.locals.currentUser=req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error')
    next()
})

app.use(express.urlencoded({ extended: true }))
app.use(methodOverride('_method'));

app.get('/', (req, res) => {
    res.render('home')
})

app.get('/register', (req, res) => {
    res.render('users/register')
})

app.post('/register', catchAsync(async (req, res) => {
    try {
        const { email, username, password } = req.body;
        const user = new User({ email, username });
        const registeredUser = await User.register(user, password);
        console.log(registeredUser);
        req.login(registeredUser,err=>{
            if(err){
                next(err);
            }
            req.flash('success', 'Welcome to CopSupporter')
        res.redirect('/roadViolations')
        }) 
    }
    catch (e) {
        req.flash('error', e.message);
        res.redirect('register');
    }
}))

app.get('/login', (req, res) => {
    res.render('users/login')
})

app.post('/login', passport.authenticate('local', { failureFlash: true, failureRedirect: '/login' }), async (req, res) => {
    req.flash('success', 'Welcome')
    const redirectUrl=req.session.returnTo||'/roadViolations'
    res.redirect(redirectUrl)
})



app.get('/roadViolations', isLoggedIn,catchAsync(async (req, res) => {
    console.log(req.user._id)
    const findUser=await User.findOne({_id:req.user._id})
    if(findUser){
        const policeUser=await police.findOne({email:findUser.email})
        if(!policeUser){
            req.flash('success','You are a normal user')
            res.redirect('/registrations');
        }
    }
    const { statusOfChallan } = req.query;
    req.flash('success','You are a police user')
    if (statusOfChallan) {
        const violations = await roadViolation.find({ statusOfChallan: statusOfChallan });
        res.render('violations/index', { violations });
    }
    else {
        const violations = await roadViolation.find({});
        res.render('violations/index', { violations });
    }
}))

app.get('/roadViolations/new', isLoggedIn, (req, res) => {
    res.render('violations/new');
})

app.get('/roadViolations/:id', isLoggedIn, catchAsync(async (req, res) => {
    console.log(req.user._id)
    const findUser=await User.findOne({_id:req.user._id})
    if(findUser){
        const policeUser=await police.findOne({email:findUser.email})
        if(!policeUser){
            req.flash('success','You are a normal user')
            res.redirect('/registrations');
        }
    }
    const { id } = req.params;
    const foundViolation = await roadViolation.findById(id);
    if (!foundViolation) {
        req.flash('error', 'Cannot find')
        res.redirect('/roadViolations')
    }
    res.render('violations/show', { foundViolation });
}))

app.post('/roadViolations',isLoggedIn,upload.array('image') ,catchAsync(async (req, res, next) => {
    const toolTovalidate = Joi.object({
        title: Joi.string().required(),
        // image: Joi.string().required(),
        veh_num: Joi.string().required(),
        location: Joi.string().required(),
        uploader_name: Joi.string().required(),
        uploader_email: Joi.string().email().required(),
        statusOfChallan: Joi.number().required()
    })
    const { error } = toolTovalidate.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',');
        throw new ExpressError(msg, 400)
    }
    console.log(req.user._id)
    const findUser=await User.findOne({_id:req.user._id})
    if(findUser){
        const policeUser=await police.findOne({email:findUser.email})
        if(!policeUser){
            req.flash('success','You are a normal user')
            res.redirect('/registrations');
        }
    }
    const violations=await registrations.findOne({veh_num:req.body.veh_num});
    console.log(req.body)
    console.log(violations.veh_num)
    if(violations.veh_num===req.body.veh_num){
        const newViolation = new roadViolation(req.body);
        newViolation.images=req.files.map(f=>({url:f.path,filename:f.filename}))
    await newViolation.save();
    console.log(newViolation);
    req.flash("success", "New complaint is added")
    res.redirect(`/roadViolations/${newViolation._id}`);
    }
    req.flash('error','number plate is not there')
    res.redirect('/roadViolations/new');
}))

app.get('/roadViolations/:id/edit', isLoggedIn, catchAsync(async (req, res) => {
    console.log(req.user._id)
    const findUser=await User.findOne({_id:req.user._id})
    if(findUser){
        const policeUser=await police.findOne({email:findUser.email})
        if(!policeUser){
            req.flash('success','You are a normal user')
            res.redirect('/registrations');
        }
    }
    const { id } = req.params;
    const violation = await roadViolation.findById(id);
    res.render('violations/edit', { violation });
}))

app.put('/roadViolations/:id', isLoggedIn, catchAsync(async (req, res) => {
    console.log(req.user._id)
    const findUser=await User.findOne({_id:req.user._id})
    if(findUser){
        const policeUser=await police.findOne({email:findUser.email})
        if(!policeUser){
            req.flash('success','You are a normal user')
            res.redirect('/registrations');
        }
    }
    const toolTovalidate = Joi.object({
        title: Joi.string().required(),
        image: Joi.string().required(),
        veh_num: Joi.string().required(),
        location: Joi.string().required(),
        uploader_name: Joi.string().required(),
        uploader_email: Joi.string().email().required(),
        statusOfChallan: Joi.number().required()
    })
    const { error } = toolTovalidate.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',');
        throw new ExpressError(msg, 400)
    }
    const { id } = req.params;
    const updatedViolation = await roadViolation.findByIdAndUpdate(id, { ...req.body });
    if (!updatedViolation) {
        req.flash('error', 'Cannot find')
        res.redirect('/roadViolations')
    }
    await roadViolation.findByIdAndUpdate(id, { statusOfChallan: 1 });
    const reg = await registrations.findOne({ veh_num: updatedViolation['veh_num'] });
    reg.complaints.push(updatedViolation)

    await reg.save();
    await updatedViolation.save();
    req.flash('success', 'Successfully challan is imposed')
    res.redirect(`/registrations/${reg._id}`);
}))

app.delete('/roadViolations/:id', isLoggedIn, catchAsync(async (req, res) => {
    console.log(req.user._id)
    const findUser=await User.findOne({_id:req.user._id})
    if(findUser){
        const policeUser=await police.findOne({email:findUser.email})
        if(!policeUser){
            req.flash('success','You are a normal user')
            res.redirect('/registrations');
        }
    }
    const { id } = req.params;
    await roadViolation.findByIdAndDelete(id);
    req.flash('success', 'Complaint is successfully deleted')
    res.redirect('/roadViolations');
}))

app.get('/registrations', catchAsync(async (req, res) => {
    const findYourVehciles=await registrations.find({email:req.user.email})
    // const registrations1 = await registrations.find({});
    res.render('registrations/index', { findYourVehciles });
}))

app.get('/registrations/:id', catchAsync(async (req, res) => {
    const { id } = req.params;
    const reg = await registrations.findById(id).populate('complaints');
    console.log(reg);
    res.render(`registrations/show`, { reg })
}))

app.get('/logout',(req,res)=>{
    req.logout(function(err) {
        if (err) { 
          return next(err); 
          }
          req.flash('success','Logged out')
        res.redirect('/login');
      });
})

app.all('*', (req, res, next) => {
    next(new ExpressError('Page Not FOund'), 404)
})

app.use((err, req, res, next) => {
    const { statusCode = 500, message = 'Something wrong' } = err;
    res.status(statusCode).render('error', { err });
})

app.listen(3000, () => {
    console.log("On port 3000")
})

