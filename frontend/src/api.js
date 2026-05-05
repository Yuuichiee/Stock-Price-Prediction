import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  (import.meta.env.PROD ? 'https://stock-price-prediction-urct.onrender.com/api' : 'http://127.0.0.1:5000/api');

export const fetchStocks = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/stocks`);
    return response.data;
  } catch (error) {
    console.error('Error fetching stocks:', error);
    throw error;
  }
};

export const predictStock = async (symbol, time_horizon) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/predict`, {
      symbol,
      time_horizon
    });
    return response.data;
  } catch (error) {
    console.error('Error predicting stock:', error);
    throw error;
  }
};
