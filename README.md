# 離島拼圖

獨立的三關 3×3 拼圖小遊戲。每關 200 分，完成三關後以 `postMessage` 將 600 分傳回視覺小說。

## 本機預覽

請使用 HTTP server 開啟（不要直接雙擊檔案）：

```powershell
python -m http.server 8080
```

遊戲：`http://localhost:8080/`  
設定頁：`http://localhost:8080/admin.html`

## 更換三張圖片

開啟 `admin.html`，貼上三個公開圖片 URL，然後產生固定遊戲網址。把該網址貼入主程式的 iframe URL 欄位即可；圖片設定包含在網址內，不受第三方 iframe 儲存分隔影響。

提示圖與拼圖板均固定使用 16:9 橫向比例，設定圖片時亦應選用 16:9 相片。

## 接駁主遊戲

完成三關時會送出：

```js
window.parent.postMessage({ complete: true, score: 600 }, '*');
```
