# ============================================================
# model_utils.py — Core ML Logic for Stock Price Prediction
# ============================================================
# PRIMARY SOURCE: Local CSV dataset files (pre-downloaded, 5 years)
# AUTO-UPDATE:    When internet is available, missing days are
#                 silently fetched and appended to the CSV file.
# OFFLINE MODE:   If no internet, existing CSV data is used as-is.
# ============================================================

# --- LIBRARY IMPORTS ---
import pandas as pd            # Used for data manipulation and creating tables (DataFrames)
import numpy as np             # Used for numerical calculations
import os                      # Used to build file paths for the CSV dataset
from ta.trend import SMAIndicator, MACD   # Technical indicators: Moving Average & MACD
from ta.momentum import RSIIndicator      # Technical indicator: Relative Strength Index
from sklearn.ensemble import RandomForestRegressor  # Machine Learning model (Random Forest)
from sklearn.model_selection import train_test_split  # Splits data into training & testing sets
from sklearn.metrics import mean_absolute_percentage_error  # Measures prediction accuracy
import datetime                # Used for date calculations (future prediction dates)
import warnings

warnings.filterwarnings('ignore')

# ============================================================
# DATASET FOLDER — all CSV files live here
# ============================================================
DATASET_DIR = os.path.dirname(os.path.abspath(__file__))

# Maps stock ticker symbols to their local CSV filenames
# Dots in ticker names are replaced with underscores in filenames
# e.g. RELIANCE.NS -> dataset_RELIANCE_NS.csv
TICKER_TO_CSV = {
    "AAPL":         "dataset_AAPL.csv",
    "MSFT":         "dataset_MSFT.csv",
    "GOOGL":        "dataset_GOOGL.csv",
    "AMZN":         "dataset_AMZN.csv",
    "TSLA":         "dataset_TSLA.csv",
    "RELIANCE.NS":  "dataset_RELIANCE_NS.csv",
    "TCS.NS":       "dataset_TCS_NS.csv",
}


# ============================================================
# HELPER: AUTO-UPDATE CSV WITH LATEST DATA (if internet available)
# ============================================================
# Checks how old the local CSV is. If it's missing recent trading
# days, it fetches ONLY the new rows from Yahoo Finance and appends
# them to the existing CSV — keeping predictions always fresh.
# If there's no internet, silently skips and uses existing data.
# ============================================================
def _try_update_csv(symbol, csv_path):
    """Silently append any missing recent days to the CSV using yfinance (if online)"""
    try:
        import yfinance as yf

        # Read existing CSV to find the last date we already have
        existing_df = pd.read_csv(csv_path)
        existing_df['Date'] = pd.to_datetime(existing_df['Date'], utc=True).dt.tz_localize(None)
        last_date = existing_df['Date'].max()

        today = pd.Timestamp(datetime.date.today())

        # Dataset is already up to date — nothing to do
        if last_date.date() >= today.date():
            print(f"[INFO] {symbol} dataset already up to date (last: {last_date.date()})")
            return

        # Fetch only the MISSING days (last date + 1 day to today)
        fetch_start = (last_date + datetime.timedelta(days=1)).strftime('%Y-%m-%d')
        print(f"[INFO] Updating {symbol} dataset from {fetch_start} to today...")

        new_df = yf.Ticker(symbol).history(start=fetch_start)

        if new_df.empty:
            print(f"[INFO] No new trading data for {symbol} (market may be closed)")
            return

        new_df.reset_index(inplace=True)
        new_df['Date'] = pd.to_datetime(new_df['Date'], utc=True).dt.tz_localize(None)

        # Keep only standard OHLCV columns to match existing CSV format
        cols = [c for c in ['Date', 'Open', 'High', 'Low', 'Close', 'Volume'] if c in new_df.columns]
        new_df = new_df[cols]

        # Merge new rows into existing data, remove duplicates, re-sort, save
        combined = pd.concat([existing_df[cols], new_df], ignore_index=True)
        combined.drop_duplicates(subset='Date', keep='last', inplace=True)
        combined.sort_values('Date', inplace=True)
        combined.to_csv(csv_path, index=False)

        added = len(combined) - len(existing_df)
        print(f"[INFO] {symbol}: +{added} new rows appended. Total now: {len(combined)} rows")

    except Exception as e:
        # No internet or yfinance error — just use existing CSV data, no crash
        print(f"[INFO] Skipping update for {symbol} (offline or error): {e}")


# ============================================================
# STEP 1: LOAD DATA FROM LOCAL CSV DATASET (with auto-update)
# ============================================================
# 1. Checks if the CSV has missing days
# 2. If online: fetches & appends missing days → predictions stay fresh
# 3. If offline: loads existing CSV as-is → still works, no crash
# ============================================================
def fetch_data(symbol, period=None):
    """Load stock data from local CSV, auto-appending new days when internet is available"""

    # Look up the CSV filename for the given stock symbol
    csv_filename = TICKER_TO_CSV.get(symbol.upper(), None)

    # If we don't have a dataset for this ticker, try a generic filename
    if csv_filename is None:
        safe_name = symbol.replace('.', '_').upper()
        csv_filename = f"dataset_{safe_name}.csv"

    csv_path = os.path.join(DATASET_DIR, csv_filename)

    # Check if the CSV file exists on disk
    if not os.path.exists(csv_path):
        print(f"[ERROR] Dataset not found: {csv_path}")
        return pd.DataFrame()

    # --- Auto-update: append any missing recent days (skips silently if offline) ---
    _try_update_csv(symbol, csv_path)

    # --- Load the (now up-to-date) CSV into a DataFrame ---
    df = pd.read_csv(csv_path)

    # Parse dates — utc=True handles mixed timezone offsets yfinance writes in CSVs
    df['Date'] = pd.to_datetime(df['Date'], utc=True)
    df['Date'] = df['Date'].dt.tz_localize(None)   # Remove tz info for clean processing

    # Sort oldest to newest (critical for time-series ML)
    df.sort_values('Date', inplace=True)
    df.reset_index(drop=True, inplace=True)

    print(f"[INFO] Loaded {len(df)} rows from {csv_filename}")
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
# The model is trained entirely on the LOCAL CSV dataset.
# ============================================================
def predict_future(df, time_horizon='1d'):
    """Train Random Forest model on local CSV data and predict future stock prices"""

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

    # --- Train the Random Forest Model on the LOCAL Dataset ---
    # 100 decision trees are built and their predictions are averaged
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)  # Model learns from the downloaded CSV dataset

    # --- Evaluate Model Accuracy ---
    # MAPE = Mean Absolute Percentage Error (lower is better)
    # Confidence = 100% - MAPE (higher is better)
    y_pred_test = model.predict(X_test)
    mape = mean_absolute_percentage_error(y_test, y_pred_test) * 100
    accuracy_percent = min(max(round(100.0 - mape, 2), 0), 100)

    # --- Make Future Prediction ---
    # Use the most recent data point (from our dataset) to predict the next N days
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
