import connectDB from './config/db';
import app from './app';

const PORT = process.env.PORT || 9540;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🔌 Server is running on port ${PORT}`);
  });
});