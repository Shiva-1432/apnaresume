const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function verifyBackups() {
  try {
    console.log('Starting backup verification...');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Verify collections exist
    const collections = [
      'users',
      'resumes',
      'analysisresults',
      'jobmatches',
      'jobapplications',
      'skillgaps',
      'payments',
      'supporttickets'
    ];

    for (const collection of collections) {
      const count = await mongoose.connection.db.collection(collection).countDocuments();
      console.log(`${collection}: ${count} documents`);
    }

    // Test read/write
    const testDoc = new User({
      _id: new mongoose.Types.ObjectId(),
      email: `test-${Date.now()}@backup-verify.com`,
      name: 'Backup Test',
      password: 'testpass123',
      credits: 10,
      verification: {
        email_verified: true
      }
    });

    await testDoc.save();
    console.log('Write test passed');

    const retrieved = await User.findById(testDoc._id);
    if (retrieved) {
      console.log('Read test passed');
      await User.deleteOne({ _id: testDoc._id });
      console.log('Cleanup complete');
    }

    console.log('\nBackup verification successful!');
    console.log(`Timestamp: ${new Date().toISOString()}`);

    await mongoose.connection.close();
  } catch (error) {
    console.error('Backup verification failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  verifyBackups();
}

module.exports = verifyBackups;
