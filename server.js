const mysql = require("mysql");
const express = require("express");
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const cors = require('cors');
const app = express();
const {getGeminiResponse} = require("./Chatbot")

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
        const hashedPassword = await bcrypt.hash(password, 10);
        const sql = 'INSERT INTO user_register (full_name, phone, email, password, hash) VALUES (?, ?, ?, ?, ?)';
        
        connection.query(sql, [full_name, phone, email, password, hashedPassword], (err, result) => {
            if (err) {
                console.error('Error inserting user:', err);
                return res.status(500).send('An error occurred while saving your data.');
            }
            res.redirect('/Chatpage.html');
        });
    } catch (error) {
        console.error('Error hashing password:', error);
        res.status(500).send('An error occurred while processing your request.');
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
                res.send('Incorrect password!');
            }
        } else {
            res.send('Email not found!');
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
        console.log("keay")
        res.send(aiResponse);
    } catch (error) {
        res.status(500).send(`Eroror: ${error.message}`);
    }
})

app.listen(3000);