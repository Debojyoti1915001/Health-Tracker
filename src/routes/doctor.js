const express = require('express')
const router = express.Router()
const fs = require('fs')
const path = require('path')
const { v4 } = require('uuid');
// const mkdirp=require('mkdirp')
//const upload= require('../controllers/authControllers')

//uploading files with multer
const multer = require('multer')
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // console.log("in multer",file)
        if(file.fieldname!=='profilePic'){
        const {name}=req.body 
        // console.log('disease name',name)
        //console.log('field',file.fieldname)
        const dname= name.toLowerCase()
        const userEmail = req.user.email.toLowerCase()
        var dir = `./public/uploads/${userEmail}/${dname}/${file.fieldname}`
        }else{
            const userEmail = req.user.email.toLowerCase()
            var dir = `./public/uploads/${userEmail}/${file.fieldname}`
            // console.log("dir:",dir)
        }
        if (!fs.existsSync(dir)) {
            //console.log("making files")
            fs.mkdirSync(dir, { recursive: true }, (err) => {
                if (err) console.error('New Directory Creation Error');
            })
        }
        cb(null, dir)
    },
    filename: (req, file, cb) => {
        // const userId = req.user._id

       // fileName= path.join(`${file.fieldname}`,`File-${v4()}-${file.originalname}-${path.extname(file.originalname)}`)
        //console.log(fileName)
        if(file.fieldname==='profilePic'){
        const user=req.user
        user.profilePic=`ProfilePic_${file.originalname}`
        cb(null,`ProfilePic_${file.originalname}` )
        }else{
        cb(null,`File-${v4()}-${file.originalname}` )
        }
    },
})

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 6000000 },
    fileFilter: function (req, file, cb) {
        if(file.fieldname==='profilePic'){
        checkFileType1(file, cb)
        }else{
        checkFileType(file, cb)
        }
    },
})
function checkFileType(file, cb) {
    const filetypes = /jpeg|jpg|png|gif|pdf/
    const extname = filetypes.test(
        path.extname(file.originalname).toLowerCase()
    )
    const mimetype = filetypes.test(file.mimetype)
    if (mimetype && extname) {
        return cb(null, true)
    } else {
        cb(null,false)
    }
}
function checkFileType1(file, cb) {
    const filetypes = /jpeg|jpg|png/
    const extname = filetypes.test(
        path.extname(file.originalname).toLowerCase()
    )
    const mimetype = filetypes.test(file.mimetype)
    if (mimetype && extname) {
        return cb(null, true)
    } else {
        cb(null,false)
        // req.flash("error_msg", "Enter a valid picture of format jpeg jpg png") 
    }
}

//uploading finishes
const doctorController = require('../controllers/doctorControllers')
const { requireAuth, redirectIfLoggedIn } = require('../middleware/doctorAuth')
router.get('/verify/:id', doctorController.emailVerify_get)
router.get('/signup',redirectIfLoggedIn, doctorController.signup_get)
router.post('/signup', doctorController.signup_post)
router.get('/login', redirectIfLoggedIn, doctorController.login_get)
router.post('/login', doctorController.login_post)
router.get('/logout', requireAuth, doctorController.logout_get)
router.get('/profile', requireAuth, doctorController.profile_get)


router.get('/requestUser/:id', requireAuth, doctorController.requestUser_get)



//hospital connection with doctor
router.post('/requestHospital/:id', requireAuth, doctorController.requestHospital_post)

router.post('/searchUser', requireAuth,doctorController.searchUser_post)
router.get('/requestUser/:id', requireAuth,doctorController.requestUser_get)
module.exports = router
