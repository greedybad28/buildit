import app from './app.js';

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`[Server] Tech Learning Club backend running on port ${PORT}`);
});
