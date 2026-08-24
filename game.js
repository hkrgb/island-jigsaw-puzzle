const fallbackConfig={title:'離島拼圖',eyebrow:'ISLAND PUZZLE',piecesPerSide:3,pointsPerLevel:200,levels:[{name:'第一關',image:'assets/level-1.svg'},{name:'第二關',image:'assets/level-2.svg'},{name:'第三關',image:'assets/level-3.svg'}]};
const $=s=>document.querySelector(s);let config,currentLevel=0,order=[],selected=null,totalScore=0,locked=false;

async function loadConfig(){
  try{const response=await fetch('config.json',{cache:'no-store'});if(!response.ok)throw new Error();config=await response.json()}catch{config=fallbackConfig}
  const local=localStorage.getItem('islandPuzzleConfig');if(local){try{config={...config,...JSON.parse(local)}}catch{}}
  config.levels=(config.levels||[]).slice(0,3);if(config.levels.length!==3)config.levels=fallbackConfig.levels;
  config.piecesPerSide=Math.min(4,Math.max(2,Number(config.piecesPerSide)||3));
  config.pointsPerLevel=Number(config.pointsPerLevel)||200;
  $('#gameTitle').textContent=config.title;$('#eyebrow').textContent=config.eyebrow||'ISLAND PUZZLE';startLevel();
}

function shuffled(size){
  const values=Array.from({length:size},(_,i)=>i);do{for(let i=size-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[values[i],values[j]]=[values[j],values[i]]}}while(values.every((v,i)=>v===i));return values;
}

function startLevel(){
  locked=false;selected=null;const level=config.levels[currentLevel],side=config.piecesPerSide;
  $('#levelNumber').textContent=currentLevel+1;$('#score').textContent=totalScore;$('#preview').src=level.image;
  $('#status').textContent='選擇兩塊拼圖交換位置';order=shuffled(side*side);renderBoard();
}

function renderBoard(){
  const board=$('#board'),side=config.piecesPerSide,image=config.levels[currentLevel].image;board.innerHTML='';
  board.style.gridTemplateColumns=`repeat(${side},1fr)`;board.style.gridTemplateRows=`repeat(${side},1fr)`;
  order.forEach((piece,position)=>{const tile=document.createElement('button'),x=piece%side,y=Math.floor(piece/side);tile.type='button';tile.className='tile'+(piece===position?' correct':'')+(selected===position?' selected':'');tile.style.backgroundImage=`url("${String(image).replace(/"/g,'')}")`;tile.style.backgroundSize=`${side*100}% ${side*100}%`;tile.style.backgroundPosition=`${x*100/(side-1)}% ${y*100/(side-1)}%`;tile.setAttribute('aria-label',`拼圖第 ${position+1} 格`);tile.onclick=()=>choose(position);board.appendChild(tile)});
}

function choose(position){
  if(locked)return;if(selected===null){selected=position;$('#status').textContent='再選擇另一塊拼圖交換';renderBoard();return}
  if(selected===position){selected=null;$('#status').textContent='已取消選擇';renderBoard();return}
  [order[selected],order[position]]=[order[position],order[selected]];selected=null;renderBoard();
  if(order.every((v,i)=>v===i))completeLevel();else $('#status').textContent='很好，繼續拼圖！';
}

function completeLevel(){
  locked=true;totalScore+=config.pointsPerLevel;$('#score').textContent=totalScore;$('#status').textContent='完成！';
  setTimeout(()=>{if(currentLevel===2){$('#finishModal').classList.remove('hidden')}else{$('#modalTitle').textContent=`完成${config.levels[currentLevel].name}！`;$('#modalText').textContent='準備挑戰下一張相片。';$('#levelModal').classList.remove('hidden')}},450);
}

$('#shuffleButton').onclick=()=>{if(!locked){order=shuffled(order.length);selected=null;renderBoard();$('#status').textContent='已重新排列'}};
$('#nextButton').onclick=()=>{$('#levelModal').classList.add('hidden');currentLevel++;startLevel()};
$('#finishButton').onclick=()=>{const score=config.pointsPerLevel*3;window.parent.postMessage({complete:true,score},'*');$('#finishButton').disabled=true;$('#finishButton').textContent='已帶回主遊戲 ✓'};
loadConfig();
