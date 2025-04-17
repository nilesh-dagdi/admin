// app.js
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const Student = require('./models/Student');

dotenv.config();
const app = express();

mongoose.connect('mongodb://127.0.0.1:27017/adminUserPortal', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({ secret: 'adminSecret', resave: false, saveUninitialized: true }));

// Nodemailer config
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Routes
app.get('/', (req, res) => {
    res.render('index');
});

app.get('/signin', (req, res) => {
    res.render('signin');
});

app.post('/signin', async (req, res) => {
    const { name, age, email, class: studentClass, rollnumber, semester } = req.body;
    const student = new Student({ name, age, email, class: studentClass, rollnumber, semester, status: 'pending' });
    await student.save();
    res.send('Your data has been submitted and is pending admin approval.');
});

app.get('/admin', (req, res) => {
    res.render('adminLogin');
});

app.post('/admin', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === 'admin123') {
        req.session.admin = true;
        res.redirect('/admin/dashboard');
    } else {
        res.send('Invalid admin credentials');
    }
});

app.get('/admin/dashboard', async (req, res) => {
    if (!req.session.admin) return res.redirect('/admin');
    const students = await Student.find({ status: 'pending' });
    res.render('dashboard', { students });
});

app.post('/admin/accept/:id', async (req, res) => {
    const student = await Student.findById(req.params.id);
    student.status = 'accepted';
    await student.save();

    transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: student.email,
        subject: 'Application Accepted',
        text: 'You have been accepted by the admin.'
    });
    res.redirect('/admin/dashboard');
});

app.post('/admin/reject/:id', async (req, res) => {
    const student = await Student.findById(req.params.id);
    student.status = 'rejected';
    await student.save();

    transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: student.email,
        subject: 'Application Rejected',
        text: 'You have been rejected by the admin.'
    });
    res.redirect('/admin/dashboard');
});

app.get('/admin/accepted', async (req, res) => {
    const students = await Student.find({ status: 'accepted' });
    res.render('accepted', { students });
});

app.get('/admin/rejected', async (req, res) => {
    const students = await Student.find({ status: 'rejected' });
    res.render('rejected', { students });
});

app.listen(3000, () => {
    console.log('Server started on http://localhost:3000');
});
