// models/Student.js
const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    name: String,
    age: Number,
    email: String,
    class: String,
    rollnumber: String,
    semester: String,
    status: { type: String, default: 'pending' } // pending, accepted, rejected
});

module.exports = mongoose.model('Student', studentSchema);
