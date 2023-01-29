const path = require('path')
const fse = require('fs-extra')
const express = require('express')
const router = express.Router()
const { body, validationResult } = require('express-validator')
const slugify = require('slugify')



const pageDir = path.join(process.cwd(), 'pages/')

/*
/ Create (POST)
*/
router.post('/',
  body('name').isString().isLength({ min:2}).trim(),
  (req, res) => {
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
      console.log(errors)
      return res.status(400).json({ errors: errors.array() });
    }

    // Setup Page Data
    const slug = slugify(req.body.name, {remove: /[*+~.()'"!/:@]/g, lower: true})
    const pageData = {
      name: req.body.name,
      slug: slug,
      permalink: slug,
    }

    // Save Page Data to JSON
    fse.outputJson(pageDir+pageData.permalink+".json", pageData)
      .then(() =>{
        res.send(pageData)
      })
      .catch(err => {
        console.error(err.message)
        res.status(500).end()
      })

})


/*
/ Read (GET)
*/
router.get('/', (req, res) => {

})


/*
/ Update (POST)
*/
router.post('/', (req, res) => {

})


/*
/ Delete (DELETE)
*/
router.delete('/', (req, res) => {

})


module.exports = router