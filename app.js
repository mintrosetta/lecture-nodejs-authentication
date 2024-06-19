const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const bcrypt = require('bcrypt');

const app = express();

// middleware
app.use(express.json());
app.use(cors({
    credentials: true,
    origin: ['http://localhost:5500']
}));
app.use(cookieParser());
app.use(session({
    secret: 'mysecret',
    resave: false,
    saveUninitialized: true
}));

const port = 8000;
const secert = 'mysecret';

let dbAdapter = null;

async function initialMySQL() {
    dbAdapter = await mysql.createConnection({
        host: 'localhost',
        port: '3306',
        user: 'root',
        password: 'root',
        database: 'auth_tutorial'
    });
}

app.post('/api/register', async (req, res) => {
    const { email, password } = req.body;

    try {
        const passwordHash = await bcrypt.hash(password, 10);
        const user = {
            email: email,
            password: passwordHash
        };
    
        const result = await dbAdapter.query('INSERT INTO users SET ?', user);
    
        return res.status(200).json({
            message: 'Successful',
            data: result
        });
    } catch (ex) {
        console.log(ex.message);
        return res.status(400).json({
            message: 'Failed',
            data: null
        });
    }
});

app.post('/v1/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log(email + ' ' + password);
        const [result] = await dbAdapter.query('SELECT * FROM users WHERE email = ?', [email]);
        const user = result[0];

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(200).json({
                message: 'Authentication Failed (email or password is invalid)',
                data: null
            });
        }

        // สร้าง jwt token
        // ควรเก็บแค่ข้อมูลที่จำเป็น ไม่ควรเก็บข้อมูลที่ละเอียดอ่อน (sensitive data)
        const token = jwt.sign({ email, role: 'admin' }, secert, { expiresIn: '1h' });
    
        return res.status(200).json({
            message: 'Authentication Successful',
            data: token
        });
    } catch (ex) {
        console.log(ex.message);
        return res.status(401).json({
            message: 'Authentication Failed',
            data: null
        });
    }
});

app.post('/v2/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const [result] = await dbAdapter.query('SELECT * FROM users WHERE email = ?', [email]);
        const user = result[0];

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(200).json({
                message: 'Authentication Failed (email or password is invalid)',
                data: null
            });
        }

        // สร้าง jwt token
        // ควรเก็บแค่ข้อมูลที่จำเป็น ไม่ควรเก็บข้อมูลที่ละเอียดอ่อน (sensitive data)
        const token = jwt.sign({ email, role: 'admin' }, secert, { expiresIn: '1h' });
        
        // สร้าง cookie ขึ้นมาเก็บ token แทน แล้วให้ browser จัดการ
        res.cookie('token', token, {
            maxAge: 300000, // ระยะเวลาหมดอายุ ระบุเป็น Millisecon ฬนที่นี้คือ 300 วิ หรือ 5 นาที
            secure: true,
            httpOnly: true,
            sameSite: 'none' // คนที่จะใช้ cookie นี้ไม่จำเป็นต้องเป็น host เดียวกัน
        });
    
        return res.status(200).json({
            message: 'Authentication Successful',
            data: null
        });
    } catch (ex) {
        console.log(ex.message);
        return res.status(401).json({
            message: 'Authentication Failed',
            data: null
        });
    }
});

app.post('/v3/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const [result] = await dbAdapter.query('SELECT * FROM users WHERE email = ?', [email]);
        const user = result[0];

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(200).json({
                message: 'Authentication Failed (email or password is invalid)',
                data: null
            });
        }

        // สร้าง jwt token
        // ควรเก็บแค่ข้อมูลที่จำเป็น ไม่ควรเก็บข้อมูลที่ละเอียดอ่อน (sensitive data)
        const token = jwt.sign({ email, role: 'admin' }, secert, { expiresIn: '1h' });
        
        req.session.userId = user.id;
        req.session.user = user;

        console.log(req.session);

        return res.status(200).json({
            message: 'Authentication Successful',
            data: null
        });
    } catch (ex) {
        console.log(ex.message);
        return res.status(401).json({
            message: 'Authentication Failed',
            data: null
        });
    }
});

app.get('/api/users', async (req, res) => {
    try {
        // const authHeader = req.headers['authorization'];
        // let authToken = req.cookies.token; // หยิบ cookie ที่่มี key 'token'
        // if (authHeader) {
        //     authToken = authHeader.split(' ')[1];
        // }

        // ตรวจสอบว่า token และ secret นั้นถูกต้องตรงกัน
        // const userPayload = jwt.verify(authToken, secert); 

        console.log(req.sessionID);
        console.log(req.session);
        
        if (!req.session.userId) {
            throw new Error('User not found');
        }

        const [result] = await dbAdapter.query("SELECT * FROM users");

        return res.status(200).json({
            message: 'Successful',
            data: result
        });
    } catch (ex) {
        console.log(ex.message);

        return res.status(400).json({
            message: 'Autentication Failed',
            data: null
        });
    }
});

app.listen(port, async () => {
    await initialMySQL();
    console.log(`Server started at http://localhost:${port}`);
});
