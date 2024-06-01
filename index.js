// Importing necessary libraries
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const fileUpload = require('express-fileupload');
const Grid = require('gridfs-stream');
const crypto = require('crypto');
const path = require('path');


const app = express();

// Basic Configurations
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());
app.use(fileUpload());

// Connect to MongoDB
async function connectToDatabase() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to the database');
  } catch (err) {
    console.error('Database connection error:', err);
    process.exit(1);
  }
}
connectToDatabase();

// Start the server
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});

const conn = mongoose.connection;

// Create a schema and model for the file
const fileSchema = new mongoose.Schema({
  name: String,
  data: Buffer,
  type: String,
  size: Number,
});

const File = mongoose.model('File', fileSchema);

// Initialize GridFS stream
let gfs;
conn.once('open', () => {
  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection('uploads');
});

// Serve static files
app.use('/public', express.static(`${process.cwd()}/public`));
app.get('/', (req, res) => {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Post and respond with file infos
app.post('/api/fileanalyse', async (req, res) => {
    try {
      if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).json({ error: 'No files were uploaded.' });
      }
      const uploadfile = req.files.upfile;

      const upfile = uploadfile.name;
      const type = uploadfile.mimetype;
      const size = uploadfile.size;

      // Create a new file document
      const file = new File({
          name: upfile,
          data: uploadfile.data,
          mimetype: uploadfile.mimetype,
          size: uploadfile.size,
      });

      // Create the exercise
      const response = {
        name: upfile,
        type: uploadfile.mimetype,
        size: uploadfile.size,
      };
      
      await file.save();

      // Return the response
      res.status(201).json(response);

    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'An error occurred while saving the file.' });
    }
})




