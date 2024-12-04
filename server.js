const mysql = require("mysql");
const express = require("express");
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const cors = require('cors');
const app = express();
const {getGeminiResponse} = require("./Chatbot");

app.use(express.static(__dirname));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));

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
                res.redirect('/Chatpage.html');
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
                res.redirect("/Chatpage.html");
            } else {
                res.redirect('/login.html?message=Incorrect%20Password');
            }
        } else {
            res.redirect('/login.html?message=Email%20not%20found!');
        }
    });
});

app.post("/geminiResponse",async (req,res) => {
    const {prompt} = req.body

    if (!prompt) {
        return res.status(400).send("Prompt is required.");
    }
    try {
        const aiResponse = await getGeminiResponse(prompt);
        res.send(aiResponse);
    } catch (error) {
        res.status(500).send(`Eroror: ${error.message}`);
    }
});

app.listen(3000);