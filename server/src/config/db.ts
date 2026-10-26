import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('❌ MONGODB_URI is not defined in environment variables');
      process.exit(1);
    }

    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✅ MongoDB connected');
  } catch (error: any) {
    console.error('❌ DB error:', error.message);
    process.exit(1);
  }
};

export default connectDB;
