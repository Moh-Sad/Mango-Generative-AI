const mysql = require("mysql");
const express = require("express");
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const cors = require('cors');
const app = express();
const path = require('path');
const {getGeminiResponse} = require("./public/js/Chatbot");
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const GitHubStrategy = require("passport-github2").Strategy;

app.use(session({
    secret: 'QQQQwwww12345',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, "public")));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

const connection  = mysql.createConnection({
    host: "localhost",
    user: "admin",
    password: "12345",
    database: "user_database"
});

connection.connect(function(error){
    if (error) throw error;
    else console.log("Connected to MySQL Database Successfully");
});

app.post('/submit', async (req, res) => {
    const { full_name, phone, email, password } = req.body;

    try {
        const checkEmailSql = 'SELECT email FROM user_register WHERE email = ?';
        connection.query(checkEmailSql, [email], async (err, results) => {
            if (err) {
                console.error('Error checking email:', err);
                return res.redirect('/index.html?message=An%20error%20occurred%20while%20processing%20your%20request.');
            }
            if (results.length > 0) {
                return res.redirect('/index.html?message=Email%20is%20already%20in%20use!');
            }
            const hashedPassword = await bcrypt.hash(password, 10);
            const insertSql = 'INSERT INTO user_register (full_name, phone, email, password, hash) VALUES (?, ?, ?, ?, ?)';
            
            connection.query(insertSql, [full_name, phone, email, password, hashedPassword], (err, result) => {
                if (err) {
                    console.error('Error inserting user:', err);
                    return res.redirect('/index.html?message=An%20error%20occurred%20while%20saving%20your%20data.');
                }
                res.redirect('/Chatpage.html')
            });
        });
    } catch (error) {
        console.error('Error hashing password:', error);
        res.redirect('/index.html?message=An%20error%20occurred%20while%20processing%20your%20request.');
    }
});

app.post('/login', (req, res) => {
    const { email, password } = req.body;
    const sql = 'SELECT * FROM user_register WHERE email = ?';
    connection.query(sql, [email], async (err, results) => {
        if (err) throw err;

        if (results.length > 0) {
            const match = await bcrypt.compare(password, results[0].hash);
            if (match) {
                res.redirect('/Chatpage.html')
            } else {
                res.redirect('/login.html?message=Incorrect%20Password');
            }
        } else {
            res.redirect('/login.html?message=Email%20not%20found!');
        }
    });
});

app.post("/geminiResponse", async (req, res) => {
    const { prompt } = req.body;

    if (!prompt) {
        return res.status(400).send("Prompt is required.");
    }
    try {
        const userEmail = req.headers['user-email'];
        if (!userEmail) {
            return res.status(400).send("User email is required.");
        }
        const fetchHistorySql = 'SELECT history FROM user_register WHERE email = ?';
        connection.query(fetchHistorySql, [userEmail], async (err, results) => {
            if (err) {
                console.error("Database error fetching history:", err);
                return res.status(500).send("Database error.");
            }

            let updatedHistory = results[0]?.history || "";
            const botResponse = await getGeminiResponse(prompt);
            updatedHistory += `User: ${prompt}\nBot: ${botResponse}\n`;
            const updateHistorySql = 'UPDATE user_register SET history = ? WHERE email = ?';
            connection.query(updateHistorySql, [updatedHistory, userEmail], (updateErr) => {
                if (updateErr) {
                    console.error("Error updating conversation history:", updateErr);
                    return res.status(500).send("Error updating history.");
                }
                res.send(botResponse);
            });
        });
    } catch (error) {
        console.error("Error in Gemini response:", error);
        res.status(500).send(`Error: ${error.message}`);
    }
});


passport.use(new GoogleStrategy({
    clientID: "259595659568-lreeq63g5cdogljdr5qnaamqinfgmpqv.apps.googleusercontent.com",
    clientSecret: "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",
    callbackURL: "http://localhost:3000/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
    try {
        const email = profile.emails[0].value;
        const fullName = profile.displayName;

        const checkEmailSql = 'SELECT email FROM user_register WHERE email = ?';
        connection.query(checkEmailSql, [email], (err, results) => {
            if (err) return done(err);

            if (results.length > 0) {
                return done(null, results[0]);
            } else {
                return done(null, { fullName, email, requiresPassword: true });
            }
        });
    } catch (error) {
        return done(error);
    }
}));

passport.use(new GitHubStrategy({
    clientID: "Ov23li1voA8Z6l6YQ7T4",
    clientSecret: "9ccadd07d7fbb40ca11ca148b48b6e68147e57c4",
    callbackURL: "http://localhost:3000/auth/github/callback"
}, async (accessToken, refreshToken, profile, done) => {
    try {
        const email = profile.emails ? profile.emails[0].value : null;
        const fullName = profile.displayName || profile.username;

        if (!email) {
            return done(new Error("GitHub account does not have a public email address."));
        }

        const checkEmailSql = 'SELECT email FROM user_register WHERE email = ?';
        connection.query(checkEmailSql, [email], (err, results) => {
            if (err) return done(err);

            if (results.length > 0) {
                return done(null, results[0]);
            } else {
                return done(null, { fullName, email, requiresPassword: true });
            }
        });
    } catch (error) {
        return done(error);
    }
}));

passport.serializeUser((user, done) => {
    if (!user || !user.email) {
        console.error("Serialization failed: User or email is undefined");
        return done(new Error("Serialization failed: User or email is undefined"));
    }
    console.log("Serializing user:", user.email);
    done(null, user.email);
});

passport.deserializeUser((email, done) => {
    if (!email) {
        console.error("Deserialization failed: Email is undefined");
        return done(new Error("Deserialization failed: Email is undefined"));
    }

    const fetchUserSql = 'SELECT * FROM user_register WHERE email = ?';
    connection.query(fetchUserSql, [email], (err, results) => {
        if (err) {
            console.error("Database error during deserialization:", err);
            return done(err);
        }
        if (!results || results.length === 0) {
            console.error("Deserialization failed: User not found");
            return done(new Error("Deserialization failed: User not found"));
        }
        console.log("Deserialized user:", results[0]);
        done(null, results[0]);
    });
});

app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/index.html?message=Google%20Authentication%20Failed' }),
    (req, res) => {
        const user = req.user;

        if (user.requiresPassword) {
            res.redirect(`/setup-password?email=${user.email}&fullName=${user.fullName}`);
        } else {
            res.redirect('/Chatpage.html');
        }
    }
);

app.get('/auth/github', passport.authenticate('github', { scope: ['user:email'] }));

app.get('/auth/github/callback',
    passport.authenticate('github', { failureRedirect: '/index.html?message=GitHub%20Authentication%20Failed' }),
    (req, res) => {
        const user = req.user;

        if (user.requiresPassword) {
            res.redirect(`/setup-password?email=${user.email}&fullName=${user.fullName}`);
        } else {
            res.redirect('/Chatpage.html');
        }
    }
);

app.post('/setup-password', async (req, res) => {
    const { email, password } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const updateSql = 'UPDATE user_register SET password = ?, hash = ? WHERE email = ?';
        
        connection.query(updateSql, [password, hashedPassword, email], (err, results) => {
            if (err) {
                console.error('Error updating password:', err);
                return res.redirect('/setup-password?error=An%20error%20occurred');
            }
            res.redirect('/Chatpage.html');
        });
    } catch (error) {
        console.error('Error hashing password:', error);
        res.redirect('/setup-password?error=An%20error%20occurred');
    }
});


app.listen(3000);