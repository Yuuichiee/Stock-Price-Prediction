import matplotlib.pyplot as plt
import model_utils
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
import pandas as pd

def generate_feature_importance():
    df = model_utils.fetch_data('AAPL')
    df = model_utils.preprocess_and_engineer_features(df)
    
    days_to_predict = 1
    df['Target'] = df['Close'].shift(-days_to_predict)
    train_df = df.dropna().copy()
    
    features = ['Open', 'High', 'Low', 'Close', 'Volume', 'SMA_10', 'SMA_50', 'RSI', 'MACD']
    X = train_df[features]
    y = train_df['Target']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.1, random_state=42, shuffle=False)
    
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)
    
    importances = model.feature_importances_
    feature_imp = pd.Series(importances, index=features).sort_values(ascending=False)
    
    plt.style.use('dark_background')
    plt.figure(figsize=(10, 6))
    feature_imp.plot(kind='bar', color='#3b82f6', edgecolor='white')
    plt.title('Random Forest Feature Importance (Predictifi.AI)', fontsize=16, color='white')
    plt.ylabel('Importance Score', fontsize=12)
    plt.xlabel('Technical Indicators & Raw Price Data', fontsize=12)
    plt.xticks(rotation=45)
    plt.tight_layout()
    plt.savefig('feature_importance.png', dpi=300, bbox_inches='tight')
    print("Saved feature_importance.png successfully.")

if __name__ == '__main__':
    generate_feature_importance()
