const boardEl = document.getElementById('board');
const ROWS = 8, COLS = 8;
let selectedPiece = null;
let currentTurn = 'white';
let inCaptureChain = false; // Для продолжения взятий аосле первого
let whiteWins = 0;
let blackWins = 0;
const winsToWinMatch = 3;

function initializeBoard() {
    boardEl.innerHTML = '';
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            const cell = document.createElement('div');
            cell.classList.add('cell', (row + col) % 2 === 0 ? 'white' : 'black');
            cell.dataset.row = row;
            cell.dataset.col = col;
            if (row < 3 && (row + col) % 2 !== 0) addPiece(cell, 'black');
            else if (row > 4 && (row + col) % 2 !== 0) addPiece(cell, 'white');
            cell.addEventListener('click', handleClick);
            boardEl.appendChild(cell);
        }
    }
    selectedPiece = null;
    currentTurn = 'white';
    inCaptureChain = false;
    updateBoardHighlight();
}

function addPiece(cell, color) {
    const piece = document.createElement('div');
    piece.classList.add('piece', color);
    piece.dataset.color = color;
    piece.dataset.king = 'false';
    cell.appendChild(piece);
}

function handleClick(e) {
    const cell = e.currentTarget;
    const piece = cell.querySelector('.piece');

    if (selectedPiece) {
        // Пытаемся сделать ход выбранной шашкой
        if (isValidMove(selectedPiece, cell)) {
            const wasCapture = Math.abs(parseInt(cell.dataset.row) - parseInt(selectedPiece.parentElement.dataset.row)) === 2;
            makeMove(selectedPiece, cell);
            
            // Продолжаем или заканчиваем ход
            if (wasCapture && hasCaptures(selectedPiece)) {
                inCaptureChain = true; // Цепочка взятий
                updateBoardHighlight();
            } else {
                endTurn();
                checkEndGame();
            }
        } else {
            // Неверный ход
            if (hasMandatoryCapture(currentTurn)) {
                alert('Взятие обязательно! Выберите допустимый ход съедания.');
            } else {
                alert('Неверный ход!');
            }
            selectedPiece = null;
            updateBoardHighlight();
        }
        return;
    }

    // Выбор шашки
    if (piece && piece.dataset.color === currentTurn) {
        // Если не была сьедена шашка или это первая разрешаем
        if (!inCaptureChain || hasCaptures(piece)) {
            selectedPiece = piece;
            updateBoardHighlight();
        } else {
            alert('Продолжите взятие той же шашкой!');
        }
    }
}

function endTurn() {
    selectedPiece = null;
    currentTurn = currentTurn === 'white' ? 'black' : 'white';
    inCaptureChain = false;
    updateBoardHighlight();
}

function hasMandatoryCapture(color) {
    return Array.from(document.querySelectorAll(`.piece[data-color="${color}"]`)).some(piece => hasCaptures(piece));
}

function hasCaptures(piece) {
    const fromCell = piece.parentElement;
    const row = parseInt(fromCell.dataset.row);
    const col = parseInt(fromCell.dataset.col);
    const color = piece.dataset.color;
    const isKing = piece.dataset.king === 'true';
    const directions = isKing ? [[-2,-2],[-2,2],[2,-2],[2,2]] : 
                      (color === 'white' ? [[-2,-2],[-2,2]] : [[2,-2],[2,2]]);
    
    for (let [dR, dC] of directions) {
        const endRow = row + dR;
        const endCol = col + dC;
        if (endRow >= 0 && endRow < ROWS && endCol >= 0 && endCol < COLS) {
            const endCell = document.querySelector(`[data-row="${endRow}"][data-col="${endCol}"]`);
            if (endCell && !endCell.querySelector('.piece')) {
                const midRow = row + Math.sign(dR);
                const midCol = col + Math.sign(dC);
                const midCell = document.querySelector(`[data-row="${midRow}"][data-col="${midCol}"]`);
                const midPiece = midCell ? midCell.querySelector('.piece') : null;
                if (midPiece && midPiece.dataset.color !== color) {
                    return true;
                }
            }
        }
    }
    return false;
}

function isValidMove(fromPiece, toCell) {
    const fromCell = fromPiece.parentElement;
    const startRow = parseInt(fromCell.dataset.row);
    const startCol = parseInt(fromCell.dataset.col);
    const endRow = parseInt(toCell.dataset.row);
    const endCol = parseInt(toCell.dataset.col);
    const color = fromPiece.dataset.color;
    const dir = color === 'white' ? -1 : 1;
    const isKing = fromPiece.dataset.king === 'true';
    if (toCell.querySelector('.piece')) return false;

    const dRow = Math.abs(endRow - startRow);
    const dCol = Math.abs(endCol - startCol);
    const hasMandatory = hasMandatoryCapture(color);

    // Обязательное взятие блокирует простые ходы
    if (hasMandatory && dRow === 1) return false;

    // Простой ход
    if (dRow === 1 && dCol === 1) {
        const forward = isKing || (endRow - startRow) === dir;
        return forward;
    }

    // Взятие (всегда разрешено)
    if (dRow === 2 && dCol === 2) {
        const midRow = startRow + (endRow > startRow ? 1 : -1);
        const midCol = startCol + (endCol > startCol ? 1 : -1);
        const midCell = document.querySelector(`[data-row="${midRow}"][data-col="${midCol}"]`);
        const midPiece = midCell ? midCell.querySelector('.piece') : null;
        return midPiece && midPiece.dataset.color !== color;
    }

    return false;
}

function makeMove(fromPiece, toCell) {
    const fromCell = fromPiece.parentElement;
    const startRow = parseInt(fromCell.dataset.row);
    const startCol = parseInt(fromCell.dataset.col);
    const endRow = parseInt(toCell.dataset.row);
    const endCol = parseInt(toCell.dataset.col);

    // Удаляем съеденную
    if (Math.abs(endRow - startRow) === 2) {
        const midRow = startRow + (endRow > startRow ? 1 : -1);
        const midCol = startCol + (endCol > startCol ? 1 : -1);
        const midCell = document.querySelector(`[data-row="${midRow}"][data-col="${midCol}"]`);
        const midPiece = midCell ? midCell.querySelector('.piece') : null;
        if (midPiece) midCell.removeChild(midPiece);
    }

    toCell.appendChild(fromPiece);

    // Дамка
    if ((fromPiece.dataset.color === 'white' && endRow === 0) || (fromPiece.dataset.color === 'black' && endRow === 7)) {
        fromPiece.dataset.king = 'true';
        fromPiece.classList.add('king');
    }
}

function updateBoardHighlight() {
    document.querySelectorAll('.cell').forEach(cell => cell.classList.remove('selected'));
    if (selectedPiece) {
        selectedPiece.parentElement.classList.add('selected');
    }
}

function checkEndGame() {
    let whitePieces = 0, blackPieces = 0;
    document.querySelectorAll('.piece').forEach(p => {
        if (p.dataset.color === 'white') whitePieces++;
        else blackPieces++;
    });

    if (whitePieces === 0) {
        blackWins++;
        showEndGame('Чёрные выиграли партию');
        resetMatchIfNeeded();
    } else if (blackPieces === 0) {
        whiteWins++;
        showEndGame('Белые выиграли партию');
        resetMatchIfNeeded();
    }
}

function showEndGame(message) {
    const score = `${whiteWins}-${blackWins}`;
    if (Math.max(whiteWins, blackWins) >= winsToWinMatch) {
        alert(`${message}! Матч окончен. Итог: ${score}`);
    } else {
        alert(`${message}. Счёт: ${score}`);
    }
}

function resetMatchIfNeeded() {
    if (Math.max(whiteWins, blackWins) < winsToWinMatch) {
        setTimeout(initializeBoard, 1500);
    }
}

initializeBoard();