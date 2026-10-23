(() => {
  "use strict";
  const themes = [
    ["classic","Classic","#f5f3ed","#587d5d","#c88568"],["wooden","Wooden","#eee5d6","#a25637","#4f7659"],
    ["snow","Snow","#edf4f7","#4388b0","#8b79b8"],["bloom","Bloom","#f8edf1","#b65d7f","#8d83c6"],
    ["minecraft","Minecraft","#e8eadc","#588c3e","#a66a47"],["ocean","Ocean","#e8f3f2","#318c82","#e08a65"],
    ["sunset","Sunset","#f7eee8","#cb704d","#7d7fac"],["midnight","Midnight","#171b20","#9ad5ad","#f0a988"],
    ["retro","Retro","#f3edda","#628153","#c47454"],["candy","Candy","#f1ebf8","#8563bb","#e47c9c"],
    ["forest","Forest","#e9efe7","#4e8055","#bc855c"],["lavender","Lavender","#f0eff8","#7775b3","#c17b96"],
    ["desert","Desert","#f4eddf","#ad7142","#71816a"],["neon","Neon","#141721","#9cf0de","#ff94cf"],
    ["cherry","Cherry","#f5e9e9","#b25065","#657a9c"],["slate","Slate","#eaedef","#4e8490","#c18065"],
    ["paper","Paper","#f2efe7","#6e805f","#ba7c5c"],["aurora","Aurora","#eaf0f1","#4b9290","#9a79b1"],
    ["pumpkin","Pumpkin","#f5eee4","#c36f37","#647e59"],["galaxy","Galaxy","#171526","#9bd8ec","#f19bc6"]
  ].map(([id,name,page,x,o]) => ({id,name,page,x,o}));
  const modeButtons = [...document.querySelectorAll(".mode-button")];
  const boardElement = document.querySelector("#board");
  const turnPlayer = document.querySelector("#turn-player");
  const turnCaption = document.querySelector("#turn-caption");
  const turnMessage = document.querySelector("#turn-message");
  const turnNumber = document.querySelector("#turn-number");
  const boardHint = document.querySelector("#board-hint");
  const rulesTitle = document.querySelector("#rules-title");
  const rulesCopy = document.querySelector("#rules-copy");
  const announce = document.querySelector("#announcement");
  const themeDialog = document.querySelector("#theme-dialog");
  const themeGrid = document.querySelector("#theme-grid");
  const resultDialog = document.querySelector("#result-dialog");
  const opponentButtons = [...document.querySelectorAll(".opponent-button")];
  const scores = {X:0,O:0};
  const linesCache = new Map();
  let mode = "3", game = null, turnCount = 0, themeId = "classic", appearance = "light";
  let opponent = "human", botTimer = null, isBotMove = false, lastFocusedElement = null;

  function makeMark(mark, className = "") {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("class", `mark-icon${className ? ` ${className}` : ""}`);
    svg.setAttribute("aria-hidden", "true");
    if (mark === "X") {
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", "M4.5 4.5 19.5 19.5 M19.5 4.5 4.5 19.5");
      svg.append(path);
    } else {
      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("cx", "12");
      circle.setAttribute("cy", "12");
      circle.setAttribute("r", "8");
      svg.append(circle);
    }
    return svg;
  }

  function winningLines(size) {
    if (linesCache.has(size)) return linesCache.get(size);
    const lines = [];
    for (let row=0; row<size; row++) lines.push(Array.from({length:size},(_,col)=>row*size+col));
    for (let col=0; col<size; col++) lines.push(Array.from({length:size},(_,row)=>row*size+col));
    lines.push(Array.from({length:size},(_,i)=>i*size+i),Array.from({length:size},(_,i)=>i*size+size-1-i));
    linesCache.set(size,lines);
    return lines;
  }
  function findWinner(cells,size) {
    for (const line of winningLines(size)) {
      const mark=cells[line[0]];
      if (mark && line.every(index=>cells[index]===mark)) return {mark,line};
    }
    return null;
  }
  function startGame(nextMode=mode) {
    window.clearTimeout(botTimer);
    botTimer = null;
    if (resultDialog.open) resultDialog.close();
    mode=nextMode; turnCount=0;
    game=mode==="mega"
      ? {boards:Array.from({length:9},()=>({cells:Array(9).fill(null),winner:null,line:[],drawn:false})),current:"X",over:false,result:null,winningLine:[]}
      : {size:Number(mode),cells:Array(Number(mode)**2).fill(null),current:"X",over:false,result:null,winningLine:[]};
    modeButtons.forEach(button=>{
      const active=button.dataset.mode===mode;
      button.classList.toggle("active",active);
      button.setAttribute("aria-pressed",String(active));
    });
    updateModeCopy(); render();
  }
  function updateModeCopy() {
    if (mode==="mega") {
      boardHint.textContent="Capture three small boards in a row to win.";
      rulesTitle.textContent="Mega rules";
      rulesCopy.textContent=opponent==="bot"
        ? "You're X and the bot is O. Win a mini board to claim it. Capture three claimed boards in a row to win; choose any open mini board."
        : "Win a mini board to claim it. Capture three claimed boards in a row to win. Choose any open mini board on your turn.";
      boardElement.setAttribute("aria-label","Mega Tic Tac Toe board with nine mini boards");
    } else {
      const size=Number(mode);
      boardHint.textContent=`${["Three","Four","Five"][size-3]} in a row wins. No pressure.`;
      rulesTitle.textContent="The rules";
      rulesCopy.textContent=opponent==="bot"
        ? `You're X and the bot is O. First to line up ${size} horizontally, vertically, or diagonally wins.`
        : `Take turns placing your mark. First to line up ${size} horizontally, vertically, or diagonally takes the round.`;
      boardElement.setAttribute("aria-label",`${size} by ${size} Tic Tac Toe board`);
    }
    document.querySelector("#opponent-badge").textContent=opponent==="bot"?"VS BOT":"LOCAL 2-PLAYER";
    document.querySelector("#players-heading").textContent=opponent==="bot"?"YOU & THE BOT":"THE PLAYERS";
    document.querySelector("#footer-opponent").textContent=opponent==="bot"?"PLAYER VS BOT":"BEST PLAYED WITH A FRIEND";
    document.querySelector("#player-o-card .player-name").textContent=opponent==="bot"?"Bot":"Player O";
    document.querySelector("#player-o-card .player-state").textContent=opponent==="bot"?"Computer opponent":"Ready to play";
  }
  function announceState(message) {
    announce.textContent="";
    window.requestAnimationFrame(()=>{announce.textContent=message;});
  }
  function moveStandard(index) {
    if (!game || game.over || game.cells[index] || (opponent==="bot"&&game.current==="O"&&!isBotMove)) return;
    const mark=game.current;
    game.cells[index]=mark; turnCount++;
    const win=findWinner(game.cells,game.size);
    if (win) {
      game.over=true; game.result=mark; game.winningLine=win.line; scores[mark]++;
      announceState(opponent==="bot"?(mark==="X"?"You beat the bot!":"The bot wins the round."):`Player ${mark} wins the round.`);
    } else if (game.cells.every(Boolean)) {
      game.over=true; game.result="draw"; announceState("The round is a draw.");
    } else {
      game.current=mark==="X"?"O":"X"; announceState(`Player ${game.current}'s turn.`);
    }
    render();
    scheduleBotTurn();
  }
  function moveMega(boardIndex,cellIndex) {
    if (!game || game.over || (opponent==="bot"&&game.current==="O"&&!isBotMove)) return;
    const mini=game.boards[boardIndex];
    if (!mini || mini.winner || mini.drawn || mini.cells[cellIndex]) return;
    const mark=game.current;
    mini.cells[cellIndex]=mark; turnCount++;
    const miniWin=findWinner(mini.cells,3);
    if (miniWin) {
      mini.winner=mark; mini.line=miniWin.line;
      const overall=findWinner(game.boards.map(board=>board.winner),3);
      if (overall) {
        game.over=true; game.result=mark; game.winningLine=overall.line; scores[mark]++;
        announceState(opponent==="bot"?(mark==="X"?"You beat the bot!":"The bot wins Mega Tic Tac Toe."):`Player ${mark} captures mini board ${boardIndex+1} and wins Mega Tic Tac Toe.`);
      } else announceState(opponent==="bot"?(mark==="X"?"You captured a mini board.":"The bot captured a mini board."):`Player ${mark} captures mini board ${boardIndex+1}.`);
    } else if (mini.cells.every(Boolean)) {
      mini.drawn=true; announceState(`Mini board ${boardIndex+1} is a draw.`);
    }
    if (!game.over && game.boards.every(board=>board.winner||board.drawn)) {
      game.over=true; game.result="draw"; announceState("Mega Tic Tac Toe is a draw.");
    } else if (!game.over) {
      game.current=mark==="X"?"O":"X";
      if (!mini.winner && !mini.drawn) announceState(`Player ${game.current}'s turn.`);
    }
    render();
    scheduleBotTurn();
  }
  function updateStatus() {
    const current=game.current, done=game.over;
    turnPlayer.classList.toggle("is-o",!done&&current==="O");
    turnPlayer.classList.toggle("is-result",done);
    const markNode=turnPlayer.querySelector(".turn-mark");
    markNode.replaceChildren();
    if (done&&game.result==="draw") { markNode.textContent="="; turnCaption.textContent="IT'S A DRAW"; turnMessage.textContent="A good game, all around."; }
    else if (done) { markNode.append(makeMark(game.result)); turnCaption.textContent=opponent==="bot"?(game.result==="X"?"YOU BEAT THE BOT":"THE BOT WINS"):`PLAYER ${game.result} WINS`; turnMessage.textContent="Nicely played. Rematch?"; }
    else { markNode.append(makeMark(current)); turnCaption.textContent=opponent==="bot"&&current==="O"?"BOT'S TURN":`PLAYER ${current}'S TURN`; turnMessage.textContent=opponent==="bot"&&current==="O"?"Thinking through a move…":"Make it a good one."; }
    turnNumber.textContent=String(done?turnCount:turnCount+1).padStart(2,"0");
    document.querySelector("#player-x-score").textContent=scores.X;
    document.querySelector("#player-o-score").textContent=scores.O;
    document.querySelector("#player-x-card").classList.toggle("current",!done&&current==="X");
    document.querySelector("#player-o-card").classList.toggle("current",!done&&current==="O");
    document.querySelector("#player-x-state").textContent=done&&game.result==="X"?"Round winner!":!done&&current==="X"?"Your turn":"Ready to play";
    document.querySelector("#player-o-state").textContent=done&&game.result==="O"?"Round winner!":opponent==="bot"?(done?"Computer opponent":current==="O"?"Bot is thinking":"Computer opponent"):!done&&current==="O"?"Your turn":"Ready to play";
    document.querySelector("#player-x-card .player-name").textContent=opponent==="bot"?"You":"Player X";
    if (done && !resultDialog.open) showResultDialog();
  }
  function renderStandard() {
    const size=game.size;
    boardElement.className="board board-standard"; boardElement.dataset.size=String(size);
    boardElement.setAttribute("role","grid"); boardElement.replaceChildren();
    game.cells.forEach((mark,index)=>{
      const row=Math.floor(index/size)+1,col=index%size+1;
      const cell=document.createElement("button");
      cell.type="button";
      cell.className=`cell${mark?` mark-${mark.toLowerCase()}`:""}${game.winningLine.includes(index)?" winning-cell":""}`;
      cell.setAttribute("role","gridcell");
      const botThinking=opponent==="bot"&&game.current==="O";
      cell.setAttribute("aria-label",`Row ${row}, column ${col}${mark?`, ${mark}`:", empty"}${mark||game.over||botThinking?", unavailable":", available"}`);
      cell.disabled=Boolean(mark)||game.over||botThinking;
      if (mark) { const span=document.createElement("span"); span.className="cell-mark"; span.append(makeMark(mark)); cell.append(span); }
      cell.addEventListener("click",()=>moveStandard(index)); boardElement.append(cell);
    });
  }
  function renderMega() {
    boardElement.className="board board-mega"; delete boardElement.dataset.size;
    boardElement.setAttribute("role","grid"); boardElement.replaceChildren();
    game.boards.forEach((mini,boardIndex)=>{
      const won=Boolean(mini.winner), miniBoard=document.createElement("div");
      miniBoard.className=`mega-board${won||mini.drawn?" resolved":""}${mini.drawn?" drawn":""}${game.winningLine.includes(boardIndex)?" has-winner":""}`;
      miniBoard.setAttribute("role","group");
      miniBoard.setAttribute("aria-label",`Mini board ${boardIndex+1}${won?`, captured by ${mini.winner}`:mini.drawn?", drawn":", open"}`);
      mini.cells.forEach((mark,cellIndex)=>{
        const cell=document.createElement("button"), localWin=mini.line.includes(cellIndex)&&won;
        cell.type="button";
        cell.className=`mega-cell${mark?` mark-${mark.toLowerCase()}`:""}${localWin?" winning-cell":""}`;
        const botThinking=opponent==="bot"&&game.current==="O";
        cell.setAttribute("aria-label",`Mini board ${boardIndex+1}, row ${Math.floor(cellIndex/3)+1}, column ${cellIndex%3+1}${mark?`, ${mark}`:", empty"}${won||mini.drawn||game.over||mark||botThinking?", unavailable":", available"}`);
        cell.disabled=Boolean(mark)||won||mini.drawn||game.over||botThinking;
        if (mark) { const span=document.createElement("span"); span.className="cell-mark"; span.append(makeMark(mark)); cell.append(span); }
        cell.addEventListener("click",()=>moveMega(boardIndex,cellIndex)); miniBoard.append(cell);
      });
      if (won||mini.drawn) {
        const overlay=document.createElement("div");
        overlay.className=`mega-overlay${mini.winner==="O"?" overlay-o":""}${mini.drawn?" draw-overlay":""}`;
        overlay.setAttribute("aria-hidden","true");
        if (mini.drawn) {
          const label=document.createElement("strong"); label.textContent="—"; overlay.append(label);
        } else overlay.append(makeMark(mini.winner));
        miniBoard.append(overlay);
      }
      boardElement.append(miniBoard);
    });
  }
  function immediateWinningMoves(cells,size,mark) {
    const moves=[];
    cells.forEach((cell,index)=>{
      if (cell) return;
      const next=[...cells]; next[index]=mark;
      if (findWinner(next,size)) moves.push(index);
    });
    return moves;
  }
  function minimax(xMask,oMask,player,memo,winMasks) {
    if (winMasks.some(mask=>(xMask&mask)===mask)) return -1;
    if (winMasks.some(mask=>(oMask&mask)===mask)) return 1;
    const occupied=xMask|oMask;
    if (occupied===0b111111111) return 0;
    const key=`${xMask}:${oMask}:${player}`;
    if (memo.has(key)) return memo.get(key);
    if (player==="O") {
      let best=-Infinity;
      for (let index=0;index<9;index++) {
        const bit=1<<index;
        if (occupied&bit) continue;
        best=Math.max(best,minimax(xMask,oMask|bit,"X",memo,winMasks));
      }
      memo.set(key,best);
      return best;
    }
    let best=Infinity;
    for (let index=0;index<9;index++) {
      const bit=1<<index;
      if (occupied&bit) continue;
      best=Math.min(best,minimax(xMask|bit,oMask,"O",memo,winMasks));
    }
    memo.set(key,best);
    return best;
  }
  function chooseStandardBotMove() {
    const cells=game.cells;
    if (game.size===3) {
      const memo=new Map();
      const winMasks=winningLines(3).map(line=>line.reduce((mask,index)=>mask|(1<<index),0));
      const xMask=cells.reduce((mask,mark,index)=>mark==="X"?mask|(1<<index):mask,0);
      const oMask=cells.reduce((mask,mark,index)=>mark==="O"?mask|(1<<index):mask,0);
      let bestScore=-Infinity,bestMoves=[];
      cells.forEach((cell,index)=>{
        if (cell) return;
        const score=minimax(xMask,oMask|(1<<index),"X",memo,winMasks);
        if (score>bestScore) { bestScore=score; bestMoves=[index]; }
        else if (score===bestScore) bestMoves.push(index);
      });
      return bestMoves[Math.floor(Math.random()*bestMoves.length)];
    }
    const winningMove=immediateWinningMoves(cells,game.size,"O")[0];
    if (winningMove!==undefined) return winningMove;
    const blockingMove=immediateWinningMoves(cells,game.size,"X")[0];
    if (blockingMove!==undefined) return blockingMove;
    const center=(game.size-1)/2;
    const preferred=cells.map((cell,index)=>({cell,index,row:Math.floor(index/game.size),col:index%game.size}))
      .filter(cell=>!cell.cell)
      .sort((a,b)=>Math.abs(a.row-center)+Math.abs(a.col-center)-(Math.abs(b.row-center)+Math.abs(b.col-center)));
    const bestDistance=Math.abs(preferred[0].row-center)+Math.abs(preferred[0].col-center);
    const best=preferred.filter(cell=>Math.abs(cell.row-center)+Math.abs(cell.col-center)===bestDistance);
    return best[Math.floor(Math.random()*best.length)].index;
  }
  function chooseMegaBotMove() {
    const moves=[];
    game.boards.forEach((board,boardIndex)=>{
      if (board.winner||board.drawn) return;
      board.cells.forEach((cell,cellIndex)=>{
        if (cell) return;
        const next=[...board.cells]; next[cellIndex]="O";
        const miniWin=findWinner(next,3);
        let score=0;
        if (miniWin) {
          const captures=game.boards.map((item,index)=>index===boardIndex?"O":item.winner);
          score=findWinner(captures,3)?100:45;
        } else if (immediateWinningMoves(board.cells,3,"X").includes(cellIndex)) score=30;
        const row=Math.floor(boardIndex/3),col=boardIndex%3;
        if (row===1&&col===1) score+=2;
        if (cellIndex===4) score+=1;
        moves.push({boardIndex,cellIndex,score});
      });
    });
    if (!moves.length) return null;
    const highest=Math.max(...moves.map(move=>move.score));
    const best=moves.filter(move=>move.score===highest);
    return best[Math.floor(Math.random()*best.length)];
  }
  function scheduleBotTurn() {
    if (opponent!=="bot"||!game||game.over||game.current!=="O"||botTimer!==null) return;
    botTimer=window.setTimeout(()=>{
      botTimer=null;
      if (!game||game.over||opponent!=="bot"||game.current!=="O") return;
      isBotMove=true;
      try {
        if (mode==="mega") {
          const move=chooseMegaBotMove();
          if (move) moveMega(move.boardIndex,move.cellIndex);
        } else {
          const move=chooseStandardBotMove();
          if (move!==undefined) moveStandard(move);
        }
      } finally {
        isBotMove=false;
      }
    },420);
  }
  function showResultDialog() {
    lastFocusedElement=document.querySelector("#restart-button");
    const mark=game.result;
    const isDraw=mark==="draw";
    document.querySelector("#result-eyebrow").textContent=isDraw?"ROUND COMPLETE":"VICTORY!";
    document.querySelector("#result-title").textContent=isDraw?"It's a draw!":opponent==="bot"?(mark==="X"?"You beat the bot!":"The bot wins this round."):`Player ${mark} wins!`;
    document.querySelector("#result-copy").textContent=isDraw
      ?"A close one. Want to play another?"
      :opponent==="bot"?(mark==="X"?"Nicely played. Ready for a rematch?":"The bot got this one. Try again?")
      :"Nicely played. Ready for a rematch?";
    const resultMark=document.querySelector("#result-mark");
    resultMark.replaceChildren();
    resultMark.append(isDraw?document.createTextNode("—"):makeMark(mark));
    resultMark.classList.toggle("draw",isDraw);
    if (!resultDialog.open) resultDialog.showModal();
  }
  function applyAppearance(nextAppearance) {
    appearance=nextAppearance;
    document.documentElement.dataset.appearance=appearance;
    const isDark=appearance==="dark";
    const toggle=document.querySelector("#appearance-toggle");
    toggle.setAttribute("aria-pressed",String(isDark));
    toggle.setAttribute("aria-label",`Switch to ${isDark?"light":"dark"} appearance`);
    document.querySelector("#appearance-label").textContent=isDark?"Light mode":"Dark mode";
    try {
      window.localStorage.setItem("little-xo-appearance",appearance);
    } catch {
      announceState("Appearance selected for this visit. Browser storage is unavailable.");
    }
    themeGrid.querySelectorAll(".theme-option").forEach(button=>{
      const theme=themes.find(item=>item.id===button.dataset.theme);
      button.querySelector(".theme-swatch").style.setProperty("--swatch-page",isDark?"#1c2228":theme.page);
    });
    document.querySelector('meta[name="theme-color"]').content=getComputedStyle(document.documentElement).getPropertyValue("--page").trim();
  }
  function render() { if (mode==="mega") renderMega(); else renderStandard(); updateStatus(); }
  function applyTheme(id) {
    const theme=themes.find(item=>item.id===id)||themes[0];
    themeId=theme.id; document.documentElement.dataset.theme=theme.id;
    document.querySelector("#theme-current").textContent=theme.name;
    themeGrid.querySelectorAll(".theme-option").forEach(button=>{
      const selected=button.dataset.theme===theme.id;
      button.classList.toggle("selected",selected); button.setAttribute("aria-pressed",String(selected));
    });
    document.querySelector('meta[name="theme-color"]').content=getComputedStyle(document.documentElement).getPropertyValue("--page").trim();
    try { window.localStorage.setItem("little-xo-theme",theme.id); }
    catch { announceState("Theme selected for this visit. Browser storage is unavailable."); }
  }
  function buildThemePicker() {
    themes.forEach(theme=>{
      const option=document.createElement("button"), swatch=document.createElement("span"), label=document.createElement("span");
      option.type="button"; option.className="theme-option"; option.dataset.theme=theme.id;
      option.setAttribute("aria-label",`${theme.name} theme`); option.setAttribute("aria-pressed","false");
      swatch.className="theme-swatch"; swatch.style.setProperty("--swatch-page",appearance==="dark"?"#1c2228":theme.page);
      swatch.style.setProperty("--swatch-x",theme.x); swatch.style.setProperty("--swatch-o",theme.o); swatch.setAttribute("aria-hidden","true");
      swatch.append(document.createElement("span"),document.createElement("span"));
      label.className="theme-option-label"; label.textContent=theme.name;
      option.append(swatch,label); option.addEventListener("click",()=>applyTheme(theme.id)); themeGrid.append(option);
    });
  }
  modeButtons.forEach(button=>button.addEventListener("click",()=>startGame(button.dataset.mode)));
  opponentButtons.forEach(button=>button.addEventListener("click",()=>{
    opponent=button.dataset.opponent;
    opponentButtons.forEach(option=>{
      const active=option===button;
      option.classList.toggle("active",active);
      option.setAttribute("aria-pressed",String(active));
    });
    startGame(mode);
  }));
  document.querySelector("#restart-button").addEventListener("click",()=>startGame(mode));
  document.querySelector("#appearance-toggle").addEventListener("click",()=>applyAppearance(appearance==="light"?"dark":"light"));
  document.querySelector("#theme-trigger").addEventListener("click",()=>{
    lastFocusedElement=document.activeElement; themeDialog.showModal(); themeGrid.querySelector(".selected")?.focus();
  });
  document.querySelector("#theme-close").addEventListener("click",()=>themeDialog.close());
  themeDialog.addEventListener("click",event=>{if(event.target===themeDialog)themeDialog.close();});
  themeDialog.addEventListener("close",()=>lastFocusedElement?.focus());
  document.querySelector("#result-new-game").addEventListener("click",()=>startGame(mode));
  document.querySelector("#result-back").addEventListener("click",()=>resultDialog.close());
  document.querySelector("#result-close").addEventListener("click",()=>resultDialog.close());
  resultDialog.addEventListener("close",()=>lastFocusedElement?.focus());
  buildThemePicker();
  try {
    const savedTheme=window.localStorage.getItem("little-xo-theme");
    if(savedTheme&&themes.some(theme=>theme.id===savedTheme))themeId=savedTheme;
  } catch { themeId="classic"; }
  try {
    const savedAppearance=window.localStorage.getItem("little-xo-appearance");
    if(savedAppearance==="dark"||savedAppearance==="light")appearance=savedAppearance;
  } catch { appearance="light"; }
  document.querySelectorAll(".player-symbol").forEach(element=>element.append(makeMark(element.dataset.mark)));
  document.querySelector("#brand-mark").append(makeMark("X"),makeMark("O"));
  applyAppearance(appearance);
  applyTheme(themeId); startGame();
})();