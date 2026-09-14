/* Daily bookshop activities. Embedded payments are issued only by the fishing host. */
const $=id=>document.getElementById(id),kind=document.body.dataset.kind,params=new URLSearchParams(location.search),session=params.get('bookshopSession'),hostOrigin=params.get('parentOrigin');
const embedded=!!session&&parent!==window;let state=null,request=null,pending=false,awaitingCollection=false,activeItem=null,order=[],selected=null,standalone=null;
const storageKey='island-daily-'+kind+'-v1',today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Hong_Kong',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const send=d=>parent.postMessage({...d,session},hostOrigin);
function status(text){$('status').textContent=text;}
function renderState(data){if(!state)status('準備好了。今天每次遊玩都會獲得同一款。');state=data;$('money').textContent='$'+data.money;$('day').textContent=data.day+' · 香港';$('play').disabled=pending||awaitingCollection||data.money<20;$('play').textContent=kind==='toy'?'轉一次 · $20':'開始拼圖 · $20';if(data.art?.background&&kind==='postcard')document.body.style.backgroundImage='linear-gradient(#edf7f822,#edf7f822),url("'+data.art.background+'")';if(data.art?.machine&&kind==='toy')$('machineImage').src=data.art.machine;renderCollection(data.collection||[]);}
function renderCollection(list){$('collectionCount').textContent=list.length+' 款收藏';const box=$('collection');box.replaceChildren();for(const v of list){const card=document.createElement('button');card.className='collectionItem';const img=document.createElement('img');img.src=v.image;img.alt=v.name;const text=document.createElement('span');text.textContent=v.name;card.append(img,text);card.onclick=()=>showItem(v);box.append(card);}}
function showItem(item){$('resultImage').src=item.image;$('resultImage').alt=item.name;$('resultName').textContent=item.name;$('closeResult').textContent=$('collectionPanel').hidden?'收下回憶':'返回收藏';$('result').hidden=false;}
function selectDaily(items,day){let hash=2166136261;for(const c of kind+'|'+day)hash=Math.imul(hash^c.charCodeAt(0),16777619)>>>0;const sorted=items.slice().sort((a,b)=>a.id.localeCompare(b.id));return sorted[hash%sorted.length];}
function persist(){localStorage.setItem(storageKey,JSON.stringify(standalone));}
function standaloneState(){renderState({day:today(),money:standalone.money,art:{machine:'assets/daily/machine.png',background:'assets/daily/postcard-table.png'},collection:Object.values(standalone.collection)});}
async function loadStandalone(){
 try{standalone=JSON.parse(localStorage.getItem(storageKey)||'null');}catch{}
 if(!standalone||!Number.isSafeInteger(standalone.money)||!standalone.daily||!standalone.receipts||!standalone.collection)standalone={money:500,daily:{},receipts:{},collection:{}};
 const defaults=await fetch('daily-data.json').then(r=>r.json());let items=defaults;
 try{const r=await fetch('https://firestore.googleapis.com/v1/projects/yes-card-gacha-rgb/databases/(default)/documents/miniGames/hongKongFishingPro',{signal:AbortSignal.timeout(3000)});if(r.ok){const d=await r.json(),cfg=JSON.parse(d.fields?.payload?.stringValue||'null'),custom=cfg?.bookshop?.[kind==='toy'?'toys':'postcards'];if(Array.isArray(custom))items=custom.map(v=>({...v,image:/^https?:\/\//.test(v.image)?v.image:'https://hkrgb.github.io/hong-kong-fishing/sport/assets/bookshop/'+v.image}));}}catch{}
 standalone.items=items.filter(v=>v.id&&v.image);standaloneState();status('本頁獨立錢包；從釣魚遊戲書店進入可使用釣魚金錢。');
}
function paid(d){
 if(d.request!==request||!pending)return;pending=false;activeItem=d.item;state.money=d.money;$('money').textContent='$'+d.money;$('play').disabled=true;$('day').textContent=d.day+' · 香港';
 if(kind==='toy'){
  $('machine').classList.add('turning');status('咔嚓……今天的小回憶來了！');
  setTimeout(()=>{$('machine').classList.remove('turning');showItem(d.item);status('已收藏 '+d.item.name+'。今天再玩會獲得同一款。');$('play').disabled=state.money<20;if(embedded)send({type:'bookshop-ready'});else standaloneState();},1600);
 }else{startPuzzle(d.item);status('點兩塊拼圖交換位置，完成後收藏明信片。');}
}
function play(){
 if(pending||!state||state.money<20)return;pending=true;request=crypto.randomUUID();$('play').disabled=true;$('result').hidden=true;status('正在準備……');
 if(embedded){send({type:'bookshop-play',request});return;}
 const day=today(),item=standalone.daily[day]||selectDaily(standalone.items,day);
 if(!item){pending=false;status('藏品尚未準備好，沒有扣款。');standaloneState();return;}
 const before=structuredClone(standalone);standalone.money-=20;standalone.daily[day]=item;standalone.receipts[request]={item,day,complete:kind==='toy'};if(kind==='toy')standalone.collection[item.id]=item;
 try{persist();paid({request,item,money:standalone.money,day});}catch{standalone=before;pending=false;status('無法保存進度，沒有扣款。');standaloneState();}
}
function startPuzzle(item){
 $('puzzleWelcome').hidden=true;$('puzzleArea').hidden=false;$('previewImage').onload=()=>{document.documentElement.style.setProperty('--cardRatio',$('previewImage').naturalWidth/$('previewImage').naturalHeight);};$('previewImage').src=item.image;$('previewImage').alt=item.name;$('previewImage').hidden=true;$('preview').textContent='查看原圖';
 order=Array.from({length:12},(_,i)=>i);for(let i=11;i>0;i--){const j=crypto.getRandomValues(new Uint32Array(1))[0]%(i+1);[order[i],order[j]]=[order[j],order[i]];}if(order.every((v,i)=>v===i))[order[0],order[1]]=[order[1],order[0]];
 selected=null;renderPuzzle();
}
function renderPuzzle(){
 const board=$('puzzle');board.replaceChildren();order.forEach((piece,index)=>{const b=document.createElement('button');b.className='piece';b.setAttribute('aria-label','位置 '+(index+1)+'，拼圖片段 '+(piece+1));b.setAttribute('aria-pressed',String(selected===index));b.style.backgroundImage='url("'+activeItem.image+'")';b.style.backgroundPosition=(piece%4)*100/3+'% '+Math.floor(piece/4)*50+'%';b.onclick=()=>swapPiece(index);board.append(b);});$('progress').textContent=order.filter((v,i)=>v===i).length+' / 12 塊已就位';
}
function swapPiece(index){
 if(selected===null){selected=index;renderPuzzle();return;}[order[selected],order[index]]=[order[index],order[selected]];selected=null;renderPuzzle();
 if(order.every((v,i)=>v===i)){
  [...$('puzzle').children].forEach(b=>b.disabled=true);status('拼圖完成！正在收藏明信片……');
  if(embedded){awaitingCollection=true;send({type:'bookshop-complete',request,order});}else{standalone.collection[activeItem.id]=activeItem;standalone.receipts[request].complete=true;try{persist();collected();standaloneState();}catch{status('無法保存收藏，請保留本頁。');}}
 }
}
function collected(){awaitingCollection=false;showItem(activeItem);status('明信片已收藏！今天再玩會是同一張。');$('play').disabled=state.money<20;}
$('play').onclick=play;$('closeResult').onclick=()=>$('result').hidden=true;$('collectionToggle').onclick=()=>{$('collectionPanel').hidden=!$('collectionPanel').hidden;};$('closeCollection').onclick=()=>$('collectionPanel').hidden=true;
if(kind==='postcard')$('preview').onclick=()=>{$('previewImage').hidden=!$('previewImage').hidden;$('preview').textContent=$('previewImage').hidden?'查看原圖':'收起原圖';};
addEventListener('message',e=>{const d=e.data;if(!embedded||e.source!==parent||e.origin!==hostOrigin||!d||d.session!==session)return;if(d.type==='bookshop-state')renderState(d);if(d.type==='bookshop-paid')paid(d);if(d.type==='bookshop-error'&&d.request===request){pending=false;status(d.text);$('play').disabled=state.money<20;}if(d.type==='bookshop-collected'&&d.request===request)collected();});
if(embedded){$('standaloneLink').hidden=true;send({type:'bookshop-ready'});}else loadStandalone().catch(()=>status('未能載入藏品，請重新整理。'));
setInterval(()=>{if(!embedded)return;if(!state)send({type:'bookshop-ready'});else if(pending&&request)send({type:'bookshop-play',request});else if(awaitingCollection)send({type:'bookshop-complete',request,order});},1500);
const zoomButton=document.createElement('button');zoomButton.id='zoomPostcard';zoomButton.textContent='🔍 放大';zoomButton.setAttribute('aria-label','全屏放大明信片');$('closeResult').before(zoomButton);
zoomButton.onclick=async()=>{
 if($('postcardZoom'))return;
 const overlay=document.createElement('section');overlay.id='postcardZoom';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label',$('resultName').textContent+' · 全屏大圖');
 const img=document.createElement('img');img.src=$('resultImage').src;img.alt=$('resultImage').alt;
 const close=document.createElement('button');close.textContent='×';close.setAttribute('aria-label','關閉全屏大圖');let native=false;
 const cleanup=()=>{document.removeEventListener('fullscreenchange',changed);document.removeEventListener('keydown',key);overlay.remove();zoomButton.focus();};
 const changed=()=>{if(native&&document.fullscreenElement!==overlay)cleanup();};
 const key=e=>{if(e.key==='Escape'){e.preventDefault();close.click();}};
 close.onclick=async()=>{if(document.fullscreenElement===overlay){try{await document.exitFullscreen();}catch{}}cleanup();};
 overlay.append(img,close);document.body.append(overlay);close.focus();document.addEventListener('fullscreenchange',changed);document.addEventListener('keydown',key);
 try{await overlay.requestFullscreen();native=true;}catch{/* The black-backed viewport viewer also works when fullscreen is unavailable. */}
};
