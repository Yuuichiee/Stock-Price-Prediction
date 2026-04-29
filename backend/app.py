from flask import Flask, request, jsonify
from flask_cors import CORS
import model_utils

app = Flask(__name__)
CORS(app)

@app.route('/', methods=['GET'])
def home():
    return jsonify({
        "status": "online",
        "message": "Predictifi.AI Backend is running!"
    })

POPULAR_STOCKS = [
    {"symbol": "AAPL", "name": "Apple Inc."},
    {"symbol": "MSFT", "name": "Microsoft Corp."},
    {"symbol": "GOOGL", "name": "Alphabet Inc."},
    {"symbol": "AMZN", "name": "Amazon.com Inc."},
    {"symbol": "TSLA", "name": "Tesla Inc."},
    {"symbol": "RELIANCE.NS", "name": "Reliance Industries"},
    {"symbol": "TCS.NS", "name": "Tata Consultancy Services"}
]

@app.route('/api/stocks', methods=['GET'])
def get_stocks():
    return jsonify(POPULAR_STOCKS)

@app.route('/api/predict', methods=['POST'])
def predict_stock():
    data = request.json
    if not data or 'symbol' not in data or 'time_horizon' not in data:
        return jsonify({"error": "Missing symbol or time_horizon"}), 400
    
    symbol = data['symbol']
    time_horizon = data['time_horizon'] # '1d', '3d', '1w'
    
    try:
        # Fetch data
        df = model_utils.fetch_data(symbol)
        if df.empty:
            return jsonify({"error": "Failed to fetch stock data"}), 404
            
        # Preprocess and Engineer Features
        df = model_utils.preprocess_and_engineer_features(df)
        
        # Predict
        predictions, accuracy, historical_data = model_utils.predict_future(df, time_horizon)
        
        return jsonify({
            "symbol": symbol,
            "historical": historical_data,
            "predictions": predictions,
            "accuracy": accuracy
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
