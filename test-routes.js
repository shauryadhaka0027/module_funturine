import express from 'express';

const app = express();

// Test simple routes
app.get('/test', (req, res) => {
    res.json({ message: 'Test route working' });
});

// Test parameterized routes
app.get('/test/:id', (req, res) => {
    res.json({ message: 'Parameterized route working', id: req.params.id });
});

app.listen(3001, () => {
    console.log('Test server running on port 3001');
});
