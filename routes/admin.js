const cookieSession = require('cookie-session')
const express = require('express')
const fse = require('fs-extra')
const path = require('path')
const router = express.Router()
const { body, validationResult } = require('express-validator')
router.use(express.urlencoded({extended: false}))
router.use(cookieSession({
  name: 'session',
  keys: [process.env.SECRET_KEY_1, process.env.SECRET_KEY_2],
  maxAge: 120 * 60 * 60 * 1000
}))

const pageDir = path.join(process.cwd(), 'pages/')

const user = {
  name: process.env.APP_USER,
  password: process.env.APP_PASS
}

// To ensure login page gets styled
router.use('/css', express.static('node_modules/bootstrap/dist/css'))

router.get('/login', (req, res) => {
  res.render('templates/login/admin', { heading: 'Login' })
})

router.post('/login', (req, res) => {
  if (req.body.email === user.name && req.body.password === user.password) {
    req.session.loggedin = true;
    res.redirect(req.app.locals.site.baseURL + 'admin/')
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
  let pageData = {page: {heading: 'Dashboard',pages: []}}

  fse.readJson(pageDir+"info.json")
    .then(data => {
      pageData.page.pages = data
      res.render('admin/dashboard', pageData)
    })
    .catch(err => {
      console.error(err.message)
      res.status(500).end()
    })


  // fse.readdir(pageDir, {withFileTypes: true})
  //   .then(dirEntries => {
  //     dirEntries.forEach(entry => {
  //       if (entry.isFile()) {
  //         pageData.page.pages.push(path.parse(entry.name).name)
  //       }
  //     })
  //     console.log(pageData)
  //     res.render('admin/dashboard', pageData)
  //   })
  //   .catch(err => {
  //     console.error(err.message)
  //     res.status(404).render('404')
  //   })
})


/*
/ Routing
*/
// static assets
router.use('/css', express.static('node_modules/bootstrap-icons/font'))
router.use('/css', express.static('admin/css'))
router.use('/js', express.static('node_modules/bootstrap/dist/js'))
router.use('/js', express.static('node_modules/jquery/dist'))
router.use('/js', express.static('node_modules/jquery-ui/dist'))
router.use('/js', express.static('admin/js'))
// routes
router.use('/pages', require('./pages'))
router.use('/drafts', require('./drafts'))

// router.use('/images', require('./images'))
// router.use('/src/assets/images', express.static('src/assets/images'))
// router.use('/assets', express.static('assets'))
// router.use('/src/assets/js', express.static('src/assets/js'))

module.exports = router