const cookieSession = require('cookie-session')
const express = require('express')
const router = express.Router()
const { body, validationResult } = require('express-validator')
router.use(express.urlencoded({extended: false}))
router.use(cookieSession({
  name: 'session',
  keys: [process.env.SECRET_KEY_1, process.env.SECRET_KEY_2],
  maxAge: 120 * 60 * 60 * 1000
}))

const user = {
  name: process.env.APP_USER,
  password: process.env.APP_PASS
}

// To ensure login page gets styled
router.use('/css', express.static('node_modules/bootstrap/dist/css'))

router.get('/login', (req, res) => {
  res.render('admin/login', { heading: 'Login' })
})

router.post('/login', (req, res) => {
  if (req.body.email === user.name && req.body.password === user.password) {
    req.session.loggedin = true;
    res.redirect(req.app.locals.site.baseURL + 'admin/dashboard')
  } else {
    res.render('admin/login', { heading: 'Login', warning: 'incorrect credentials' })
  }
})

router.use((req, res, next) => {
  if (req.session.loggedin) {
    next()
  } else {
    req.session.original = req.url
    res.redirect(req.app.locals.site.baseURL + 'admin/login')
  }
})

router.get('/', (req, res) => {
  let pageData = {heading: 'Dashboard',pages: []}

  res.render('admin/dashboard', pageData)
})


/*
/ Routing
*/
// static assets
router.use('/js', express.static('node_modules/bootstrap/dist/js'))
router.use('/js', express.static('node_modules/jquery/dist'))
router.use('/js', express.static('admin/js'))
// routes
router.use('/pages', require('./pages'))

// router.use('/images', require('./images'))
// router.use('/src/assets/images', express.static('src/assets/images'))
// router.use('/assets', express.static('assets'))
// router.use('/src/assets/js', express.static('src/assets/js'))

module.exports = router