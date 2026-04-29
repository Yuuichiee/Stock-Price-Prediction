import model_utils

df = model_utils.fetch_data('AAPL')
df = model_utils.preprocess_and_engineer_features(df)
preds, acc, hist = model_utils.predict_future(df, '1d')
print('Accuracy:', acc)
print('Predictions:', preds)
print('Last historical date:', hist[-1]['Date'])
