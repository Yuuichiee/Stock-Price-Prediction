import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  (import.meta.env.PROD ? 'https://stock-price-prediction-urct.onrender.com/api' : 'http://127.0.0.1:5000/api');

// Render.com free tier can take 60s to cold-start — give it 90s before timing out
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 90000,
});

export const fetchStocks = async () => {
  try {
    const response = await api.get('/stocks');
    return response.data;
  } catch (error) {
    console.error('Error fetching stocks:', error);
    throw error;
  }
};

export const predictStock = async (symbol, time_horizon) => {
  try {
    const response = await api.post('/predict', {
      symbol,
      time_horizon
    });
    return response.data;
  } catch (error) {
    console.error('Error predicting stock:', error);
    throw error;
  }
};
