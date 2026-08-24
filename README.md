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

開啟 `admin.html`，以 `info@rgb-workshop.com` Google 帳戶登入。後台可新增、複製、命名、刪除及發佈多個遊戲版本；每個版本可獨立修改所有前台文字、關卡、16:9 圖片、分數及難度。

預設版本沿用原本遊戲網址。其他版本會使用獨立網址，例如 `index.html?version=school-trip`，方便主程式按故事需要載入指定版本。

難度分為容易 3×3、中等 4×4、困難 5×5。Firestore 規則限制只有已驗證的 `info@rgb-workshop.com` 可以寫入設定，其他人只可讀取已發佈內容。

提示圖與拼圖板均固定使用 16:9 橫向比例，設定圖片時亦應選用 16:9 相片。

## 接駁主遊戲

完成三關時會送出：

```js
window.parent.postMessage({ complete: true, score: 600 }, '*');
```
