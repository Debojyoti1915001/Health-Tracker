const Doctor = require('../models/Doctor')
const jwt = require('jsonwebtoken')
const { signupMailDoctor, passwordMail } = require('../config/nodemailer')
const path = require('path')
const { handleErrors } = require('../utilities/Utilities')
const crypto = require('crypto')
require('dotenv').config()
const { generateShortId } = require('../utilities/Utilities');

const maxAge = 30 * 24 * 60 * 60


// controller actions
module.exports.signup_get = (req, res) => {
    res.send("signup")
}

module.exports.login_get = (req, res) => {
    res.send("login")
}

module.exports.signup_post = async (req, res) => {
    const { name, email, password, confirmPwd, phoneNumber } = req.body
    // console.log('in sign up route', req.body)
    if (password != confirmPwd) {
        req.flash('error_msg', 'Passwords do not match. Try again')
        res.status(400).redirect('/doctor/login')
        return
    }

    try {
        const doctorExists = await Doctor.findOne({ email })
        //console.log('Doctorexists', DoctorExists)
        /*if(DoctorExists && DoctorExists.active== false)
    {
      req.flash("success_msg",`${DoctorExists.name}, we have sent you a link to verify your account kindly check your mail`)

      signupMail(DoctorExists,req.hostname,req.protocol)
      return res.redirect("/signup")
    }*/
        if (doctorExists) {
            req.flash(
                'success_msg',
                'This email is already registered. Try logging in'
            )
            return res.redirect('/doctor/login')
        }
        // console.log('Short ID generated is: ', short_id)
        const doctor = new Doctor({
            email,
            name,
            password,
            phoneNumber,
        })
        let saveDoctor = await doctor.save()
        //console.log(saveDoctor);
        req.flash(
            'success_msg',
            'Registration successful. Check your inbox to verify your email'
        )
        signupMailDoctor(saveDoctor, req.hostname, req.protocol)
        //res.send(saveDoctor)
        res.redirect('/doctor/login')
    } catch (err) {
        const errors = handleErrors(err)
        console.log(errors)

        var message = 'Could not signup. '.concat(
            errors['email'] || '',
            errors['password'] || '',
            errors['phoneNumber'] || '',
            errors['name'] || ''
        )
        //res.json(errors);
        req.flash('error_msg', message)
        res.status(400).redirect('/doctor/signup')
    }
}
module.exports.emailVerify_get = async (req, res) => {
    try {
        const doctorID = req.params.id
        const expiredTokenDoctor = await Doctor.findOne({ _id: doctorID })
        const token = req.query.tkn
        //console.log(token)
        jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
            if (err) {
                req.flash(
                    'error_msg',
                    ' Your verify link had expired. We have sent you another verification link'
                )
                signupMailDoctor(expiredTokenDoctor, req.hostname, req.protocol)
                return res.redirect('/doctor/login')
            }
            const doctor = await Doctor.findOne({ _id: decoded.id })
            if (!doctor) {
                //console.log('Doctor not found')
                res.redirect('/')
            } else {
                const activeDoctor = await Doctor.findByIdAndUpdate(doctor._id, {
                    active: true,
                })
                if (!activeDoctor) {
                    // console.log('Error occured while verifying')
                    req.flash('error_msg', 'Error occured while verifying')
                    res.redirect('/')
                } else {
                    req.flash(
                        'success_msg',
                        'Doctor has been verified and can login now'
                    )
                    //console.log('The Doctor has been verified.')
                    //console.log('active', activeDoctor)
                    res.redirect('/doctor/login')
                }
            }
        })
    } catch (e) {
        console.log(e)
        //signupMail(Doctor,req.hostname,req.protocol)
        res.redirect('/doctor/login')
    }
}

module.exports.login_post = async (req, res) => {
    const { email, password } = req.body
    // console.log('in Login route')
    // console.log('req.body',req.body)
    try {
        
        const doctor = await Doctor.login(email, password)
        // console.log("Doctor",Doctor)

        const doctorExists = await Doctor.findOne({ email })
        console.log("Doctorexsits",doctorExists)

        if (!doctorExists.active) {
            const currDate = new Date()
            const initialUpdatedAt = doctorExists.updatedAt
            const timeDiff = Math.abs(
                currDate.getTime() - initialUpdatedAt.getTime()
            )
            if (timeDiff <= 10800000) {
                console.log('Email already sent check it')
                req.flash(
                    'error_msg',
                    `${doctorExists.name}, we have already sent you a verify link please check your email`
                )
                res.redirect('/doctor/login')
                return
            }
            req.flash(
                'success_msg',
                `${doctorExists.name}, your verify link has expired we have sent you another email please check you mailbox`
            )
            signupMailDoctor(doctorExists, req.hostname, req.protocol)
            await Doctor.findByIdAndUpdate(doctorExists._id, {
                updatedAt: new Date(),
            })
            //console.log('DoctorExists',DoctorExists)
            res.redirect('/doctor/login')
            return
        }
        
        const token = doctor.generateAuthToken(maxAge)
        console.log(token)
        res.cookie('doctor', token, { httpOnly: true, maxAge: maxAge * 1000 })
        //console.log(Doctor);
        //signupMail(saveDoctor)
        // console.log("logged in")
        req.flash('success_msg', 'Successfully logged in')
        res.status(200).redirect('/doctor/profile')
    } catch (err) {
        res.send('error_msg', 'Invalid Credentials')
        
    }
}
module.exports.profile_get = async (req, res) => {
    const doctor=req.doctor
    res.send(doctor)
}

module.exports.logout_get = async (req, res) => {
    
    res.clearCookie('doctor')
    req.flash('success_msg', 'Successfully logged out')
    res.redirect('/doctor/login')
}

