const jwt = require('jsonwebtoken')
const Doctor = require('../models/Doctor')

require('dotenv').config()

const requireAuth = (req, res, next) => {
    try{
    const token = req.cookies.doctor
    //console.log(token);
    // check json web token exists & is verified
    if (token) {
        jwt.verify(token, process.env.JWT_SECRET, async (err, decodedToken) => {
            if (err) {
                console.log(err.message)

                res.redirect('/doctor/login')
            } else {
                let doctor = await Doctor.findById(decodedToken.id)
                // if null then redirect to signup
                if (doctor == null)
                {
                    req.flash("error_msg", "You do not have an account yet, kindly sign up for one"); 
                    res.clearCookie('jwt')
                    res.redirect("/doctor/signup"); 
                    return; 
                }
                //else to profile
                req.doctor = doctor
                //console.log("current doctor", req.doctor)

                next()
            }
        })
    } else {
        res.redirect('/doctor/login')
    }
}
catch(error){
    res.redirect("/doctor/login");
}
}


const redirectIfLoggedIn = (req, res, next) => {
    const token = req.cookies.doctor
    if (token)
    {
        req.flash("error_msg", "You are already logged in.")
        res.redirect("/doctor/profile")
    }
    else
    {
        next(); 
    }
}

module.exports = { requireAuth, redirectIfLoggedIn }
