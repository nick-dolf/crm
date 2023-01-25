const PORT = 1337
require('dotenv').config()
const express = require('express')
const app = express()
module.exports = app
const path = require('path')
const fse = require('fs-extra')

console.log("\n--\nCRM Starting\n--")

/*
/ Site Configuration
*/
const config = fse.readJsonSync('config.json')

// Global site variable available to template engine
app.locals.site = {}

// Remove old site directory
fse.removeSync('site')


/*
/ Environments (Development, Staging, Production)
*/
if (process.env.NODE_ENV === 'development') {
  console.log("Environment: Development")

  // Make HTML easy to read in development
  app.locals.pretty = true

  // Live Reload
  const livereload = require('livereload')
  const liveReloadServer = livereload.createServer()
  liveReloadServer.watch(path.join(__dirname, 'site'))

  const connectLivereload = require('connect-livereload')
  app.use(connectLivereload())

  liveReloadServer.server.once("connection", () => {
    setTimeout(() => {
      liveReloadServer.refresh("/");
    }, 100);
  });

  // On production this will be served by NGINX
  app.use(express.static('site'))

  // Environment Specific
  app.locals.site.baseURL = "/"
}


/*
/ Compile SASS
*/
const sass = require('sass')
const result = sass.compile('sass/main.scss')
fse.outputFile('site/css/style.css', result.css.toString())
  .catch(err => {
    console.error(err)
  })

// Setup template Engine
app.set('view engine', 'pug')



app.render('site/home', {page:{title:"test"}}, (err, html) => {
  if (err) {
    console.error(err)
  } else {
    fse.outputFile('site/index.html', html)
    .catch(err =>{
      console.error(err)
    })
  }
})

/*
/ Admin Route
*/
app.use('/admin', require('./routes/admin'))

app.listen(PORT, () => {console.log(`listening on port: ${PORT}...`)})