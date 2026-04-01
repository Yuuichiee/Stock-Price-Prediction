# ============================================================
# model_utils.py — Core ML Logic for Stock Price Prediction
# ============================================================
# This file does NOT use any pre-downloaded dataset.
# Instead, it fetches REAL-TIME historical stock data
# directly from Yahoo Finance using the 'yfinance' library.
# ============================================================

# --- LIBRARY IMPORTS ---
import yfinance as yf          # Used to fetch real-time stock data from Yahoo Finance
import pandas as pd            # Used for data manipulation and creating tables (DataFrames)
import numpy as np             # Used for numerical calculations
from ta.trend import SMAIndicator, MACD   # Technical indicators: Moving Average & MACD
from ta.momentum import RSIIndicator      # Technical indicator: Relative Strength Index
from sklearn.ensemble import RandomForestRegressor  # Machine Learning model (Random Forest)
from sklearn.model_selection import train_test_split  # Splits data into training & testing sets
from sklearn.metrics import mean_absolute_percentage_error  # Measures prediction accuracy
import datetime                # Used for date calculations (future prediction dates)
import warnings

warnings.filterwarnings('ignore')

# ============================================================
# STEP 1: FETCH DATA FROM YAHOO FINANCE (No Local Dataset!)
# ============================================================
# This function fetches the last 2 years of stock price data
# for any stock ticker (e.g. AAPL, TSLA, GOOGL) directly
# from Yahoo Finance — no CSV file or database needed.
# The data includes: Date, Open, High, Low, Close, Volume
# ============================================================
def fetch_data(symbol, period='2y'):
    """Fetch historical stock data using yfinance — real-time, no local dataset"""
    
    # Create a Ticker object for the given stock symbol (e.g. 'AAPL' for Apple)
    ticker = yf.Ticker(symbol)
    
    # Download the last 2 years ('2y') of historical price data from Yahoo Finance
    df = ticker.history(period=period)
    
    # If no data found (invalid ticker), return empty table
    if df.empty:
        return pd.DataFrame()
    
    # Reset index so 'Date' becomes a regular column instead of the row index
    df.reset_index(inplace=True)
    
    # Remove timezone info from dates for easier processing
    if df['Date'].dt.tz is not None:
        df['Date'] = df['Date'].dt.tz_localize(None)
    
    return df  # Returns a table with columns: Date, Open, High, Low, Close, Volume

# ============================================================
# STEP 2: CLEAN DATA & ADD TECHNICAL INDICATORS (Feature Engineering)
# ============================================================
# Raw price data alone is not enough for good predictions.
# We add extra columns called "features" or "technical indicators"
# that help the ML model understand market trends better.
# ============================================================
def preprocess_and_engineer_features(df):
    """Clean data and add technical indicators as extra features for the ML model"""
    
    # Keep only the essential price columns
    df = df[['Date', 'Open', 'High', 'Low', 'Close', 'Volume']].copy()
    
    # --- Handle Missing Values ---
    # Fill any gaps in data by carrying forward/backward the nearest known value
    df.ffill(inplace=True)  # Forward fill (copy previous value to fill gap)
    df.bfill(inplace=True)  # Backward fill (copy next value if still missing)
    
    # --- Feature Engineering: Adding Technical Indicators ---
    
    # SMA (Simple Moving Average) — Average closing price over last 10 and 50 days
    # Helps the model understand short-term and long-term price trends
    df['SMA_10'] = SMAIndicator(close=df['Close'], window=10).sma_indicator()
    df['SMA_50'] = SMAIndicator(close=df['Close'], window=50).sma_indicator()
    
    # RSI (Relative Strength Index) — Measures if a stock is overbought or oversold
    # Value between 0-100: above 70 = overbought, below 30 = oversold
    df['RSI'] = RSIIndicator(close=df['Close'], window=14).rsi()
    
    # MACD (Moving Average Convergence Divergence) — Shows momentum and trend direction
    macd = MACD(close=df['Close'])
    df['MACD'] = macd.macd()
    
    # Remove rows where indicators couldn't be calculated (first few rows)
    df.dropna(inplace=True)
    
    return df  # Returns enriched table with 4 extra feature columns

# ============================================================
# STEP 3: TRAIN ML MODEL & PREDICT FUTURE STOCK PRICES
# ============================================================
# We use a Random Forest Regressor — an ensemble ML algorithm
# that builds many decision trees and averages their predictions.
# The model learns from historical data and predicts future closing prices.
# ============================================================
def predict_future(df, time_horizon='1d'):
    """Train Random Forest model on fetched data and predict future stock prices"""
    
    # Map the time horizon string to number of days to predict ahead
    days_to_predict = {'1d': 1, '3d': 3, '1w': 7}.get(time_horizon, 1)
    
    # --- Create Target Variable ---
    # The model tries to predict the closing price N days in the future
    df['Target'] = df['Close'].shift(-days_to_predict)
    
    # Remove last N rows where we don't have a future price to learn from
    train_df = df.dropna().copy()
    
    # --- Define Features (inputs to the model) ---
    # These 9 columns are the input features the model uses to make predictions
    features = ['Open', 'High', 'Low', 'Close', 'Volume', 'SMA_10', 'SMA_50', 'RSI', 'MACD']
    X = train_df[features]   # Input features (what we know)
    y = train_df['Target']   # Target label (what we want to predict)
    
    # --- Train/Test Split (Chronological) ---
    # Use 90% of data for training, last 10% for testing model accuracy
    # shuffle=False ensures we don't mix past and future data (time-series rule)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.1, random_state=42, shuffle=False
    )
    
    # --- Train the Random Forest Model ---
    # 100 decision trees are built and their predictions are averaged
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)  # Model learns from historical data
    
    # --- Evaluate Model Accuracy ---
    # MAPE = Mean Absolute Percentage Error (lower is better)
    # Confidence = 100% - MAPE (higher is better)
    y_pred_test = model.predict(X_test)
    mape = mean_absolute_percentage_error(y_test, y_pred_test) * 100
    accuracy_percent = min(max(round(100.0 - mape, 2), 0), 100)
    
    # --- Make Future Prediction ---
    # Use the most recent data point to predict the next N days
    last_known_data = df.iloc[[-1]][features]
    future_pred = model.predict(last_known_data)[0]
    
    # --- Generate Future Dates and Interpolated Prices ---
    last_date = df['Date'].iloc[-1]
    last_close = df['Close'].iloc[-1]
    
    # Gradually move price from last known close towards predicted future close
    step = (future_pred - last_close) / days_to_predict
    
    predictions = []
    current_val = last_close
    current_date = last_date
    
    for i in range(days_to_predict):
        current_val += step
        current_date += datetime.timedelta(days=1)
        
        # Skip weekends (stock market is closed Saturday & Sunday)
        while current_date.weekday() > 4:  # 5=Saturday, 6=Sunday
            current_date += datetime.timedelta(days=1)
            
        date_str = current_date.strftime('%Y-%m-%d')
        predictions.append({"Date": date_str, "Predicted_Close": round(current_val, 2)})
    
    # --- Prepare Historical Data for the Chart (last 60 days) ---
    hist_df = df.tail(60).copy()
    hist_df['Date'] = hist_df['Date'].dt.strftime('%Y-%m-%d')
    historical_data = hist_df[['Date', 'Close']].to_dict('records')
    
    # Return: future predictions, accuracy %, historical chart data
    return predictions, str(accuracy_percent) + "%", historical_data
