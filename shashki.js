const boardEl = document.getElementById('board');
const ROWS = 8, COLS = 8;
let selectedPiece = null;
let currentTurn = 'white';
let inCaptureChain = false;
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

function getDiagonalPath(startRow, startCol, endRow, endCol) {
    const path = [];
    const dRow = endRow > startRow ? 1 : -1;
    const dCol = endCol > startCol ? 1 : -1;
    let r = startRow + dRow;
    let c = startCol + dCol;
    while (r !== endRow && c !== endCol) {
        path.push([r, c]);
        r += dRow;
        c += dCol;
    }
    return path;
}

function handleClick(e) {
    const cell = e.currentTarget;
    const piece = cell.querySelector('.piece');

    if (selectedPiece) {
        if (isValidMove(selectedPiece, cell)) {
            const movedPiece = selectedPiece;
            makeMove(movedPiece, cell);

            if (inCaptureChain) {
                updateBoardHighlight();
            } else {
                endTurn();
                checkEndGame();
            }
        } else {
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

    if (piece && piece.dataset.color === currentTurn) {
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
    const directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]];

    for (const [dr, dc] of directions) {
        if (!isKing) {
            const midRow = row + dr;
            const midCol = col + dc;
            const endRow = row + 2 * dr;
            const endCol = col + 2 * dc;

            if (endRow < 0 || endRow >= ROWS || endCol < 0 || endCol >= COLS) continue;

            const midCell = document.querySelector(`[data-row="${midRow}"][data-col="${midCol}"]`);
            const endCell = document.querySelector(`[data-row="${endRow}"][data-col="${endCol}"]`);
            const midPiece = midCell ? midCell.querySelector('.piece') : null;

            if (midPiece && midPiece.dataset.color !== color && endCell && !endCell.querySelector('.piece')) {
                return true;
            }
        } else {
            let r = row + dr;
            let c = col + dc;
            let foundOpponent = false;

            while (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
                const cell = document.querySelector(`[data-row="${r}"][data-col="${c}"]`);
                const p = cell ? cell.querySelector('.piece') : null;

                if (p) {
                    if (p.dataset.color === color) break;
                    if (foundOpponent) break;
                    foundOpponent = true;
                } else {
                    if (foundOpponent) return true;
                }

                r += dr;
                c += dc;
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
    const isKing = fromPiece.dataset.king === 'true';
    const dir = color === 'white' ? -1 : 1;

    if (toCell.querySelector('.piece')) return false;

    const dRow = Math.abs(endRow - startRow);
    const dCol = Math.abs(endCol - startCol);
    const hasMandatory = hasMandatoryCapture(color);

    if (dRow !== dCol || dRow === 0) return false;

    if (!isKing) {
        if (hasMandatory && dRow === 1) return false;

        if (dRow === 1) {
            return (endRow - startRow) === dir;
        }

        if (dRow === 2) {
            const midRow = startRow + (endRow > startRow ? 1 : -1);
            const midCol = startCol + (endCol > startCol ? 1 : -1);
            const midCell = document.querySelector(`[data-row="${midRow}"][data-col="${midCol}"]`);
            const midPiece = midCell ? midCell.querySelector('.piece') : null;
            return midPiece && midPiece.dataset.color !== color;
        }

        return false;
    }

    const path = getDiagonalPath(startRow, startCol, endRow, endCol);
    let opponentCount = 0;

    for (const [r, c] of path) {
        const cell = document.querySelector(`[data-row="${r}"][data-col="${c}"]`);
        const p = cell ? cell.querySelector('.piece') : null;

        if (p) {
            if (p.dataset.color === color) return false;
            opponentCount++;
            if (opponentCount > 1) return false;
        }
    }

    if (opponentCount === 1) return true;
    return opponentCount === 0 && !hasMandatory;
}

function makeMove(fromPiece, toCell) {
    const fromCell = fromPiece.parentElement;
    const startRow = parseInt(fromCell.dataset.row);
    const startCol = parseInt(fromCell.dataset.col);
    const endRow = parseInt(toCell.dataset.row);
    const endCol = parseInt(toCell.dataset.col);
    const color = fromPiece.dataset.color;
    const isKing = fromPiece.dataset.king === 'true';

    let captured = false;

    if (!isKing) {
        if (Math.abs(endRow - startRow) === 2) {
            const midRow = startRow + (endRow > startRow ? 1 : -1);
            const midCol = startCol + (endCol > startCol ? 1 : -1);
            const midCell = document.querySelector(`[data-row="${midRow}"][data-col="${midCol}"]`);
            const midPiece = midCell ? midCell.querySelector('.piece') : null;
            if (midPiece) {
                midCell.removeChild(midPiece);
                captured = true;
            }
        }
    } else {
        const path = getDiagonalPath(startRow, startCol, endRow, endCol);

        for (const [r, c] of path) {
            const cell = document.querySelector(`[data-row="${r}"][data-col="${c}"]`);
            const p = cell ? cell.querySelector('.piece') : null;

            if (p && p.dataset.color !== color) {
                cell.removeChild(p);
                captured = true;
                break;
            }
        }
    }

    toCell.appendChild(fromPiece);

    if ((fromPiece.dataset.color === 'white' && endRow === 0) ||
        (fromPiece.dataset.color === 'black' && endRow === 7)) {
        fromPiece.dataset.king = 'true';
        fromPiece.classList.add('king');
    }

    if (captured && hasCaptures(fromPiece)) {
        inCaptureChain = true;
        selectedPiece = fromPiece;
    } else {
        inCaptureChain = false;
        selectedPiece = null;
    }

    updateBoardHighlight();
}

function updateBoardHighlight() {
    document.querySelectorAll('.cell').forEach(cell => cell.classList.remove('selected'));
    document.querySelectorAll('.piece').forEach(p => p.classList.remove('selected-piece'));
    if (selectedPiece) {
        selectedPiece.parentElement.classList.add('selected');
        selectedPiece.classList.add('selected-piece');
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
