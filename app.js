const PORT = 1337
require('dotenv').config()
const express = require('express')
const app = express()
const path = require('path')
const fse = require('fs-extra')


console.log("\n--\nCRM Starting\n--")

// Set up Development Environment
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
}

app.set('view engine', 'pug')

app.render('site/home', (err, html) => {
  if (err) {
    console.error(err)
  } else {
    fse.outputFile('site/index.html', html)
    .catch(err =>{
      console.error(err)
    })
  }

})


app.listen(PORT, () => {console.log(`listening on port: ${PORT}...`)})