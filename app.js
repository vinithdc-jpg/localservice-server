const express = require('express');
const cors = require('cors');
const authRoute = require('./src/routes/authRoutes')
const app = express()

app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.use("/api", authRoute);   

module.exports = app;

