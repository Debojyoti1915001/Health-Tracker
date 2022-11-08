const mongoose = require('mongoose')
// const validator = require('validator')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const utilities = require('../utilities/Utilities')
const { isEmail } = require('validator')
require('dotenv').config()

const doctorSchema = mongoose.Schema(
    {
        hospital: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Hospital',
            },
        ],
        name: {
            type: String,
            trim: true, 
            required:[true, 'doctor name field cannot be empty'], 
        },
        active: {
            type: Boolean,
            default: true,// to be set to false after testing
        },
        email: {
            type: String,
            trim: true,
            unique: true,
            required: [true, 'Email field cannot be empty'], 
            validate: [isEmail,'Email is invalid']
        },
        phoneNumber: {
            type: String,
            trim: true,
            required:[true, 'Phone number field cannot be empty'], 
            validate: [utilities.phoneValidator, 'Phone Number is invalid']
        },
        profilePic: {
            type: String,
            trim: true,
        },
        password: {
            type: String,
            required:[true, 'Password field cannot be empty'],
            trim: true,
            validate: [
                ( pass ) => {
                    return utilities.checkPasswordStrength( pass ) >= 4
                },
                'The password must contain a mix of uppercase and lowercase alphabets along with numbers and special chacracters'
            ]
        }
    },
    {
        timestamps : true
    }
)

// Creating token for hospital
doctorSchema.methods.generateAuthToken = function generateAuthToken(maxAge){
    let id = this._id
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: maxAge,
    })
}

//deleting the passsword before sending
doctorSchema.methods.toJSON = function () {
    const user = this
    const userObject = user.toObject()

    delete userObject.password
    return userObject
}

doctorSchema.statics.login = async function (email, password) {
    const doctor = await this.findOne({ email })
    if (doctor) {
        const auth = await bcrypt.compare(password, doctor.password)
        if (auth) {
            return doctor
        }
        console.log('Invalid Credentials')
        throw Error('Invalid Credentials')
    }
    throw Error('Invalid Credentials')
}


//To hash the password
doctorSchema.pre('save', async function (next) {
    const salt = await bcrypt.genSalt()
    this.password = await bcrypt.hash(this.password, salt)
    next()
})




const Doctor = mongoose.model('Doctor', doctorSchema)
module.exports = Doctor; 