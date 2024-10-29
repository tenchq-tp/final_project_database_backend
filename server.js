// server.js
require("dotenv").config();
const express = require("express");
const sql = require("mssql");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON requests
app.use(express.json());

app.use(function(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*'); //หรือใส่แค่เฉพาะ domain ที่ต้องการได้
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});

// SQL Server configuration
const config = {
  server: process.env.DB_SERVER,
  port: parseInt(process.env.DB_PORT),
  database: process.env.DB_DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: true, // Use encryption
    trustServerCertificate: false, // Change to true if you want to trust the server certificate
  },
  connectionTimeout: 30000, // 30 seconds
};

// Connect to the database
async function connectToDatabase() {
  try {
    await sql.connect(config);
    console.log("Connected to Azure SQL Database successfully!");
  } catch (err) {
    console.error("Error connecting to the database:", err);
  }
}

connectToDatabase();

// Sample route to get data
app.get("/data", async (req, res) => {
    const { startDate, endDate, orderBy } = req.query;
    
  try {
    const result = await sql.query("SELECT * FROM covid_data ORDER BY total"); // Replace with your actual table name
    
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching data");
  }
});
app.get("/getDiffDay", async (req, res) => {
    const { startDate, endDate} = req.query;

    // Connect to your MSSQL database
    const pool = await sql.connect(config);
    let query = `SELECT a.date,
    a.total,
    a.total - COALESCE(b.total, 0) AS daily_differencea
FROM [dbo].[covid_data] a
LEFT JOIN [dbo].[covid_data] AS b ON a.date = DATEADD(DAY, 1, b.date)
WHERE b.date IS NOT NULL AND`
    if (startDate && endDate) {
        query += ` a.date BETWEEN '${startDate}' AND '${endDate}'`;
    }
    query += ` ORDER BY total ASC`;
    console.log(query);
    const result = await pool.request().query(query);
    
    res.json(result.recordset);

//   try {
//     const result = await sql.query();
//     res.json(result.recordset);
//   } catch (err) {
//     console.error(err);
//     res.status(500).send("Error fetching data");
//   }
});


app.post("/register", async (req, res) => {
  const { username, password, email } = req.body; // Adjust to your actual input fields

  if (!username || !password || !email) {
    return res.status(400).send("Please provide username, password, and email");
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10); // Hash the password

    await sql.query`INSERT INTO Users (username, hashed_password, email) VALUES (${username}, ${hashedPassword}, ${email})`;
    res.status(201).send("User registered successfully");
  } catch (err) {
    console.error(err);
    if (err.number === 2627) {
      // Unique constraint error code
      return res.status(409).send("Username or email already exists");
    }
    res.status(500).send("Error registering user");
  }
});

// Login Route
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).send("Please provide username and password");
  }

  try {
    const result =
      await sql.query`SELECT * FROM Users WHERE username = ${username}`;
    const user = result.recordset[0];

    if (!user) {
      return res.status(401).send("Invalid username or password");
    }

    const isMatch = await bcrypt.compare(password, user.hashed_password);

    if (!isMatch) {
      return res.status(401).send("Invalid username or password");
    }

    // Create a JWT token (customize the payload as needed)
    const token = jwt.sign(
      { id: user.id, username: user.username },
      "your_jwt_secret",
      { expiresIn: "1h" }
    );

    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error logging in");
  }
});

app.get('/covid-data', async (req, res) => {
    const { startDate, endDate} = req.query;

    // Connect to your MSSQL database
    const pool = await sql.connect(config);
    
    let query = 'SELECT date, total FROM covid_data';
    
    if (startDate && endDate) {
        query += ` WHERE date BETWEEN '${startDate}' AND '${endDate}'`;
    }
    
    query += ` ORDER BY total ASC`;
    console.log(query);
    const result = await pool.request().query(query);
    
    res.json(result.recordset);
});

app.get('/covid-data-by-month', async (req, res) => {
    const { formattedKey } = req.query; // Get the formattedKey from the query parameters

    if (!formattedKey) {
        return res.status(400).send('formattedKey is required');
    }

    // Ensure formattedKey is in the format YYYY-MM
    const monthRegex = /^\d{4}-\d{2}$/;
    if (!monthRegex.test(formattedKey)) {
        return res.status(400).send('formattedKey must be in the format YYYY-MM');
    }

    try {
        // Connect to the database
        await sql.connect(config);
        
        // Query to fetch data for the specific month
        const result = await sql.query`
            SELECT * 
            FROM covid_data 
            WHERE CAST(date AS DATE) >= CAST(${formattedKey}-01 AS DATE) 
            AND CAST(date AS DATE) < DATEADD(MONTH, 1, CAST(${formattedKey}-01 AS DATE))
        `;

        // Send the result back to the client
        res.json(result.recordset);
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).send('Server Error');
    } finally {
        // Close the database connection
        await sql.close();
    }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
