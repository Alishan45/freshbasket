import app from './app.js';

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🌱 FreshBasket Backend API Server is running!`);
  console.log(`👉 http://localhost:${PORT}`);
  console.log(`👉 Health: http://localhost:${PORT}/api/health`);
  console.log(`👉 Products: http://localhost:${PORT}/api/products`);
  console.log(`====================================================`);
});
