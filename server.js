require('dotenv').config();
const express = require('express');
const errorHandler = require('./middleware/errorHandler');

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is missing. Add it to your .env file.');
  process.exit(1);
}

const app = express();
app.use(express.json()); // lets us read JSON request bodies

app.get('/', (req, res) => res.json({ message: 'ATS API is running' }));

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/jobs', require('./routes/jobRoutes'));
app.use('/api/candidates', require('./routes/candidateRoutes'));
app.use('/api/applications', require('./routes/applicationRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));

// Unknown URL
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

// Must be last
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`ATS server running on http://localhost:${PORT}`));
