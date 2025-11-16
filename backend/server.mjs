// Import statements
import express from 'express';

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());

// Test Route
app.get('/test', (req, res) => {
    res.send('Hello, World!');
});


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});