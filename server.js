require('dotenv').config();
const app = require('./app');
const connectDB = require('./src/config/db').default;

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Connect to Database
    await connectDB();
    console.log('Database connected successfully');

    // Start Express App
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();
