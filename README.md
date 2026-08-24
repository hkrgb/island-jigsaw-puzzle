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

開啟 `admin.html`，貼上三個公開圖片 URL。可即時儲存作本機預覽，或下載新的 `config.json` 並取代 repository 內同名檔案後發佈。

## 接駁主遊戲

完成三關時會送出：

```js
window.parent.postMessage({ complete: true, score: 600 }, '*');
```
