const pieces = {
    'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
    'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟'
  };

  let board = [];
  let turn = 'w';
  let selected = null;
  let lastMove = null;
  let gameOver = false;
  let statusMsg = '';
  let castlingRights = { wK: true, wQ: true, bK: true, bQ: true };
  let enPassantTarget = null;

  function initGame() {
    board = [
      ['r','n','b','q','k','b','n','r'],
      ['p','p','p','p','p','p','p','p'],
      [null,null,null,null,null,null,null,null],
      [null,null,null,null,null,null,null,null],
      [null,null,null,null,null,null,null,null],
      [null,null,null,null,null,null,null,null],
      ['P','P','P','P','P','P','P','P'],
      ['R','N','B','Q','K','B','N','R']
    ];
    turn = 'w'; selected = null; lastMove = null; gameOver = false;
    castlingRights = { wK: true, wQ: true, bK: true, bQ: true };
    enPassantTarget = null;
    renderBoard(); updateStatus();
  }

  function renderBoard() {
    const boardEl = document.getElementById('board');
    boardEl.innerHTML = '';
    const kingPos = findKing(turn);
    const inCheck = kingPos && isSquareAttacked(kingPos.r, kingPos.c, turn === 'w' ? 'b' : 'w');
    let legalMoves = [];
    if (selected && !gameOver) legalMoves = getLegalMoves(selected.r, selected.c);

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const sq = document.createElement('div');
        sq.className = `square ${(r + c) % 2 === 0 ? 'light' : 'dark'}`;
        
        if (board[r][c]) {
          sq.textContent = pieces[board[r][c]];
          sq.classList.add('piece');
          sq.classList.add(board[r][c] === board[r][c].toUpperCase() ? 'white' : 'black');
        }
        
        if (selected && selected.r === r && selected.c === c) sq.classList.add('selected');
        if (lastMove && ((lastMove.from.r === r && lastMove.from.c === c) || 
                         (lastMove.to.r === r && lastMove.to.c === c))) {
          sq.classList.add('last-move');
        }
        if (inCheck && kingPos.r === r && kingPos.c === c) sq.classList.add('check-highlight');
        
        const isLegal = legalMoves.some(m => m.r === r && m.c === c);
        if (isLegal) {
          sq.classList.add('valid-move');
          if (board[r][c]) sq.classList.add('has-piece');
        }
        
        sq.onclick = () => handleClick(r, c);
        boardEl.appendChild(sq);
      }
    }
  }

  function handleClick(r, c) {
    if (gameOver) return;
    const piece = board[r][c];

    if (selected) {
      if (selected.r === r && selected.c === c) {
        selected = null; renderBoard(); return;
      }
      if (isLegalMove(selected.r, selected.c, r, c)) {
        makeMove(selected.r, selected.c, r, c);
        selected = null; turn = turn === 'w' ? 'b' : 'w';
        checkGameEnd(); renderBoard();
      } else if (piece && isPieceColor(piece, turn)) {
        selected = {r, c}; renderBoard();
      } else {
        selected = null; renderBoard();
      }
    } else {
      if (piece && isPieceColor(piece, turn)) {
        selected = {r, c}; renderBoard();
      }
    }
  }

  function getLegalMoves(fr, fc) {
    const moves = [];
    for (let tr = 0; tr < 8; tr++) {
      for (let tc = 0; tc < 8; tc++) {
        if (isLegalMove(fr, fc, tr, tc)) moves.push({r: tr, c: tc});
      }
    }
    return moves;
  }

  function isPieceColor(piece, color) {
    return color === 'w' ? piece === piece.toUpperCase() : piece === piece.toLowerCase();
  }

  function inBounds(r, c) { return r >= 0 && r < 8 && c >= 0 && c < 8; }

  function isPathClear(fr, fc, tr, tc) {
    const dr = Math.sign(tr - fr), dc = Math.sign(tc - fc);
    let r = fr + dr, c = fc + dc;
    while (r !== tr || c !== tc) {
      if (board[r][c]) return false;
      r += dr; c += dc;
    }
    return true;
  }

  function isSquareAttacked(r, c, byColor) {
    const dir = byColor === 'w' ? 1 : -1;
    if (inBounds(r - dir, c - 1) && board[r - dir][c - 1] === (byColor === 'w' ? 'P' : 'p')) return true;
    if (inBounds(r - dir, c + 1) && board[r - dir][c + 1] === (byColor === 'w' ? 'P' : 'p')) return true;

    const knightMoves = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
    for (const [dr, dc] of knightMoves) {
      const nr = r + dr, nc = c + dc;
      if (inBounds(nr, nc) && board[nr][nc]?.toLowerCase() === 'n' && isPieceColor(board[nr][nc], byColor)) return true;
    }
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr, nc = c + dc;
      if (inBounds(nr, nc) && board[nr][nc]?.toLowerCase() === 'k' && isPieceColor(board[nr][nc], byColor)) return true;
    }
    const bishopDirs = [[-1,-1],[-1,1],[1,-1],[1,1]];
    for (const [dr, dc] of bishopDirs) {
      let nr = r + dr, nc = c + dc;
      while (inBounds(nr, nc)) {
        const p = board[nr][nc];
        if (p) { if (isPieceColor(p, byColor) && (p.toLowerCase() === 'b' || p.toLowerCase() === 'q')) return true; break; }
        nr += dr; nc += dc;
      }
    }
    const rookDirs = [[-1,0],[1,0],[0,-1],[0,1]];
    for (const [dr, dc] of rookDirs) {
      let nr = r + dr, nc = c + dc;
      while (inBounds(nr, nc)) {
        const p = board[nr][nc];
        if (p) { if (isPieceColor(p, byColor) && (p.toLowerCase() === 'r' || p.toLowerCase() === 'q')) return true; break; }
        nr += dr; nc += dc;
      }
    }
    return false;
  }

  function findKing(color) {
    const k = color === 'w' ? 'K' : 'k';
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) if (board[r][c] === k) return {r, c};
    return null;
  }

  function isPseudoLegal(fr, fc, tr, tc) {
    const piece = board[fr][fc];
    if (!piece) return false;
    const type = piece.toLowerCase();
    const dr = tr - fr, dc = tc - fc;
    const target = board[tr][tc];
    if (target && isPieceColor(target, turn)) return false;

    switch(type) {
      case 'p': {
        const dir = turn === 'w' ? -1 : 1;
        const startRow = turn === 'w' ? 6 : 1;
        if (dc === 0 && dr === dir && !target) return true;
        if (dc === 0 && dr === dir * 2 && fr === startRow && !target && !board[fr + dir][fc]) return true;
        if (Math.abs(dc) === 1 && dr === dir && target && !isPieceColor(target, turn)) return true;
        if (Math.abs(dc) === 1 && dr === dir && !target && enPassantTarget && enPassantTarget.r === tr && enPassantTarget.c === tc) return true;
        return false;
      }
      case 'r': return (dr === 0 || dc === 0) && isPathClear(fr, fc, tr, tc);
      case 'b': return Math.abs(dr) === Math.abs(dc) && isPathClear(fr, fc, tr, tc);
      case 'q': return ((dr === 0 || dc === 0) || Math.abs(dr) === Math.abs(dc)) && isPathClear(fr, fc, tr, tc);
      case 'n': return (Math.abs(dr) === 2 && Math.abs(dc) === 1) || (Math.abs(dr) === 1 && Math.abs(dc) === 2);
      case 'k': {
        if (Math.abs(dr) <= 1 && Math.abs(dc) <= 1) return true;
        if (dr === 0 && Math.abs(dc) === 2) {
          const side = dc > 0 ? 'K' : 'Q';
          const right = turn === 'w' ? `w${side}` : `b${side}`;
          if (!castlingRights[right]) return false;
          if (isSquareAttacked(fr, fc, turn === 'w' ? 'b' : 'w')) return false;
          const step = dc > 0 ? 1 : -1;
          for (let i = 1; i <= 2; i++) {
            if (board[fr][fc + step * i]) return false;
            if (i < 2 && isSquareAttacked(fr, fc + step * i, turn === 'w' ? 'b' : 'w')) return false;
          }
          return true;
        }
        return false;
      }
      default: return false;
    }
  }

  function isLegalMove(fr, fc, tr, tc) {
    if (!isPseudoLegal(fr, fc, tr, tc)) return false;
    const piece = board[fr][fc];
    const captured = board[tr][tc];
    let enPassantCaptured = null;

    board[tr][tc] = piece; board[fr][fc] = null;
    if (piece.toLowerCase() === 'p' && tc !== fc && !captured) {
      enPassantCaptured = board[fr][tc]; board[fr][tc] = null;
    }
    if (piece.toLowerCase() === 'k' && Math.abs(tc - fc) === 2) {
      const rookFromC = tc > fc ? 7 : 0, rookToC = tc > fc ? 5 : 3;
      board[tr][rookToC] = board[tr][rookFromC]; board[tr][rookFromC] = null;
    }

    const kingPos = findKing(turn);
    const inCheck = isSquareAttacked(kingPos.r, kingPos.c, turn === 'w' ? 'b' : 'w');

    board[fr][fc] = piece; board[tr][tc] = captured;
    if (enPassantCaptured) board[fr][tc] = enPassantCaptured;
    if (piece.toLowerCase() === 'k' && Math.abs(tc - fc) === 2) {
      const rookFromC = tc > fc ? 7 : 0, rookToC = tc > fc ? 5 : 3;
      board[tr][rookFromC] = board[tr][rookToC]; board[tr][rookToC] = null;
    }
    return !inCheck;
  }

  function makeMove(fr, fc, tr, tc) {
    const piece = board[fr][fc], type = piece.toLowerCase(), captured = board[tr][tc];
    if (type === 'p' && tc !== fc && !captured) board[fr][tc] = null;
    board[tr][tc] = piece; board[fr][fc] = null;

    if (type === 'k' && Math.abs(tc - fc) === 2) {
      const rookFromC = tc > fc ? 7 : 0, rookToC = tc > fc ? 5 : 3;
      board[tr][rookToC] = board[tr][rookFromC]; board[tr][rookFromC] = null;
    }
    if (type === 'p' && (tr === 0 || tr === 7)) board[tr][tc] = turn === 'w' ? 'Q' : 'q';

    if (type === 'k') { castlingRights[turn+'K'] = false; castlingRights[turn+'Q'] = false; }
    if (type === 'r') {
      if (fr === 7 && fc === 0) castlingRights.wQ = false;
      if (fr === 7 && fc === 7) castlingRights.wK = false;
      if (fr === 0 && fc === 0) castlingRights.bQ = false;
      if (fr === 0 && fc === 7) castlingRights.bK = false;
    }
    if (captured === 'R' && tr === 7 && tc === 0) castlingRights.wQ = false;
    if (captured === 'R' && tr === 7 && tc === 7) castlingRights.wK = false;
    if (captured === 'r' && tr === 0 && tc === 0) castlingRights.bQ = false;
    if (captured === 'r' && tr === 0 && tc === 7) castlingRights.bK = false;

    enPassantTarget = null;
    if (type === 'p' && Math.abs(tr - fr) === 2) enPassantTarget = { r: (fr + tr) / 2, c: fc };
    lastMove = { from: {r: fr, c: fc}, to: {r: tr, c: tc} };
  }

  function hasAnyLegalMoves() {
    for (let r=0; r<8; r++) for (let c=0; c<8; c++) {
      if (board[r][c] && isPieceColor(board[r][c], turn)) {
        for (let tr=0; tr<8; tr++) for (let tc=0; tc<8; tc++) {
          if (isLegalMove(r, c, tr, tc)) return true;
        }
      }
    }
    return false;
  }

  function checkGameEnd() {
    const kingPos = findKing(turn);
    const inCheck = isSquareAttacked(kingPos.r, kingPos.c, turn === 'w' ? 'b' : 'w');
    if (!hasAnyLegalMoves()) {
      gameOver = true;
      statusMsg = inCheck ? `Мат! Победа ${turn === 'w' ? 'черных' : 'белых'}` : 'Пат (ничья)';
    } else if (inCheck) {
      statusMsg = `Шах! Ход ${turn === 'w' ? 'белых' : 'черных'}`;
    } else {
      statusMsg = `Ход ${turn === 'w' ? 'белых' : 'черных'}`;
    }
    document.getElementById('status').textContent = statusMsg;
  }

  function updateStatus() {
    statusMsg = `Ход ${turn === 'w' ? 'белых' : 'черных'}`;
    document.getElementById('status').textContent = statusMsg;
  }

  initGame();