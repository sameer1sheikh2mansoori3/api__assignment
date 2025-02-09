import express, { json } from 'express';
import { connect, Schema, model } from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;


app.use(json());


const MONGO_URI = process.env.MONGO_URI;
connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Failed to connect to MongoDB:', err));


const cacheSchema = new Schema({
    key: { type: String, required: true, unique: true },
    value: { type: String, required: true },
});

const Cache = model('Cache', cacheSchema);


const MAX_CACHE_SIZE = 10;


app.post('/cache', async (req, res) => {
    const { key, value } = req.body;

    if (!key || !value) {
        return res.status(400).json({ error: 'Both key and value are required.' });
    }

    try {
        const count = await Cache.countDocuments();
        if (count >= MAX_CACHE_SIZE) {
            return res.status(400).json({ error: 'Cache is full. Cannot store more items.' });
        }

        const newCache = new Cache({ key, value });
        await newCache.save();
        res.status(201).json({ message: 'Key-value pair stored successfully.' });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ error: 'Key already exists in cache.' });
        }
        res.status(500).json({ error: 'Failed to store key-value pair.' });
    }
});

// GET /cache/{key} → Retrieve a value
app.get('/cache/:key', async (req, res) => {
    const { key } = req.params;

    try {
        const cacheItem = await Cache.findOne({ key });
        if (!cacheItem) {
            return res.status(404).json({ error: 'Key not found in cache.' });
        }

        res.status(200).json({ key: cacheItem.key, value: cacheItem.value });
    } catch (err) {
        res.status(500).json({ error: 'Failed to retrieve key-value pair.' });
    }
});

// DELETE /cache/{key} → Remove a key-value pair
app.delete('/cache/:key', async (req, res) => {
    const { key } = req.params;

    try {
        const cacheItem = await Cache.findOneAndDelete({ key });
        if (!cacheItem) {
            return res.status(404).json({ error: 'Key not found in cache.' });
        }

        res.status(200).json({ message: 'Key-value pair deleted successfully.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete key-value pair.' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});