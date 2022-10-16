var https = require('https')
var fs = require('fs')
var url = require('url');
var htmlEntities = require('html-entities');
var cookie = require('cookie');
var crypto = require('crypto')
var express = require('express')

const port = 8100

const options = {
    key: fs.readFileSync('cert/server.key'),
    cert: fs.readFileSync('cert/server.crt')
}

var sessions = {}

var sessionExpirationTimeIdle = (1000 * 60 * 15) // Session idle expiration set to 15 minutes
var sessionExpirationTimeAbsolute = (1000 * 60 * 60 * 24) // Session absolute expiration set to 24 hours

// Creates an Express application.
const app = express()

// Serve static files.
app.use(express.static('public'))

// Parse form data to JSON
app.use(express.urlencoded({ extended: true }))
app.use(express.json())


// Register '.mustache' extension with The Mustache Express

function logRequest (req, res, next) {
    var logMessage = req.method + " " + req.url + " " + req.httpVersion + ' ' + req.headers['content-type'] + ' '
    console.log(logMessage)
    next()
}

app.use(logRequest)

function isAuthorized (req, res) {
    if (!req.headers.hasOwnProperty('cookie')) {
        return false
    }
    const parsedCookie = cookie.parse(req.headers.cookie)
    if (parsedCookie.hasOwnProperty('squeak-session')) {
        const parsedSqueakSession = JSON.parse(parsedCookie['squeak-session'])
        const session_id = parsedSqueakSession['sessionid']
        if (parsedCookie['squeak-session'] !== -1 && sessions.hasOwnProperty(session_id)) {
            // Checks that user session hasn't expired.
            if (new Date(Date.now()) > sessions[session_id].expiresIdle
                || new Date(Date.now()) > sessions[session_id].expiresAbsolute) {
                    delete sessions[parsedCookie[session_id]]
                    return false
            } else {
                sessions[session_id].expiresIdle = new Date(Date.now() + sessionExpirationTimeIdle)
                logSession(session_id)
                req.user = parsedSqueakSession
                return true
            }
        }
    }
    return false
}

function isAuthorizedMiddleware (req, res, next) {
    isAuthorized(req, res)
    next()
}

function logSession(session_id) {
    console.log(
        session_id
        + '\n\t Now: ' + new Date(Date.now()).toISOString()
        + '\n\t ExpiresIdle: ' + sessions[session_id].expiresIdle.toISOString()
        + '\n\t ExpiresAbsolute: ' + sessions[session_id].expiresAbsolute.toISOString())
}

function authenticate(req, res) {
    // Password hashing added for extra protection against Path Traversal attacks.
    var hashedPassword = crypto.pbkdf2Sync(req.body.password, 'salt', 100000, 64, 'sha512').toString('hex')
    const passwords = JSON.parse(fs.readFileSync('passwd.json', { encoding: 'utf8' }))
    if (passwords.hasOwnProperty(req.body.username) && passwords[req.body.username] === hashedPassword) {
        // Generates a random session ID.
        var session_id = crypto.randomBytes(64).toString('hex')
        while (sessions.hasOwnProperty(session_id)) {
            session_id = crypto.randomBytes(64).toString('hex')
        }
        // Creates a server-side session with idle and absolute expiration times.
        sessionExpiresIdle = new Date(Date.now() + sessionExpirationTimeIdle)
        sessionExpiresAbsolute = new Date(Date.now() + sessionExpirationTimeAbsolute) 
        sessions[session_id] = {
            expiresIdle: sessionExpiresIdle,
            expiresAbsolute: sessionExpiresAbsolute
        }
        logSession(session_id)
        res.setHeader('Set-Cookie', cookie.serialize('squeak-session', JSON.stringify({ sessionid: session_id, username: req.body.username }), {
            httpOnly: true,
            secure: true,
            maxAge: 60 * 60 * 24 // 1 day
        }));
        return true
    }
    return false
}

app.get('/', (req, res, next) => {
    var html = fs.readFileSync('public/evil.html', { encoding: 'utf8' })
    res.writeHead(200)
    res.end(html)
})
app.post('/signin', (req, res, next) => {
    var successfulSignin = authenticate(req, res)
    res.setHeader('content-type', 'application/json')
    res.writeHead(200)
    res.end(successfulSignin ? 'true' : 'false')
    next()
})

const server = https.createServer(options, app).listen(port, () => {
    console.log(`Server listening on port ${port}`)
});
