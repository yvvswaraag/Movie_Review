const express = require('express');
const bodyParser = require('body-parser');
const request =require('request')
const admin = require('firebase-admin');
const path = require('path');
const passwordHash = require('password-hash');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

const serviceAccount = require('./key.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = getFirestore();

app.set('view engine', 'ejs');
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

//The code for the signup route...

app.post('/signupSubmit', async (req, res) => {
    const { username, email, password } = req.body;

    try {
        // const usersData = await db.collection('users')
        //     .where('email', '==', email)
        //     .get();

        // if (!usersData.empty) {
        //     alert('Hey! This account already exists...');
        //     return res.sendFile(path.join(__dirname, 'login.html'));
        // }

        await db.collection('users').add({
            userName: username,
            email: email,
            password: passwordHash.generate(password)
        });

        res.render('dashboard', { username: username });
    } catch (error) {
        console.error('Error during signup:', error);
        res.send('Something went wrong...');
    }
});

//The code for the login route...
app.post('/loginSubmit', async (req, res) => {
    const { username, password } = req.body;

    try {
        const usersData = await db.collection('users')
            .where('userName', '==', username)
            .get();

        let verified = false;
        let user = null;

        usersData.forEach((doc) => {
            if (passwordHash.verify(password, doc.data().password)) {
                verified = true;
                user = doc.data();
            }
        });
        console.log(user)

        if (verified) {
            res.render('dashboard', { username: user.userName });
        } else {
            res.sendFile(path.join(__dirname, 'signup.html'));
        }
    } catch (error) {
        console.error('Error during login:', error);
        res.send('Something went wrong...');
    }
});

app.post('/search', (req, res) => {
    const {moviename } = req.body;
    console.log(moviename)
    if (moviename){
        res.status(201).json({ message: "User added successfully", moviename: moviename });
    }
     else {
            res.status(404).json({ error: 'Movie not found' });
        }
    });

app.get('/search', (req, res) => {
        const { moviename } = req.query;
        if (!moviename) {
            return res.status(400).send('Bad Request');
        }
        
        const apiKey = '96a96c4d';
        const apiUrl = `http://www.omdbapi.com/?t=${encodeURIComponent(moviename)}&apikey=${apiKey}`;
        request(apiUrl, { json: true }, (err, response, body) => {
            if (err || !body) {
                return res.status(500).send('Internal Server Error');
            }
            res.render('result', { details: body });
        });
    });
//Opening the port 2000 in web server...
app.listen(2000, () => {
    console.log('server is running on http://localhost:2000');
});