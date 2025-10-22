#!/bin/bash

# 這裡就是原本那一長串 sed 指令，可以分行寫比較清楚
sed -i "s|__VITE_FIREBASE_API_KEY__|${VITE_FIREBASE_API_KEY}|g" fireconfig.js && \
sed -i "s|__VITE_FIREBASE_AUTH_DOMAIN__|${VITE_FIREBASE_AUTH_DOMAIN}|g" fireconfig.js && \
sed -i "s|__VITE_FIREBASE_PROJECT_ID__|${VITE_FIREBASE_PROJECT_ID}|g" fireconfig.js && \
sed -i "s|__VITE_FIREBASE_STORAGE_BUCKET__|${VITE_FIREBASE_STORAGE_BUCKET}|g" fireconfig.js && \
sed -i "s|__VITE_FIREBASE_MESSAGING_SENDER_ID__|${VITE_FIREBASE_MESSAGING_SENDER_ID}|g" fireconfig.js && \
sed -i "s|__VITE_FIREBASE_APP_ID__|${VITE_FIREBASE_APP_ID}|g" fireconfig.js

# 可以加上一行輸出，方便在 Vercel Build Log 中確認指令已執行
echo "Firebase config placeholders replaced."