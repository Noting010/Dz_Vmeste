const boardElement = document.getElementById('board');
const statusElement = document.getElementById('status');
const resetBtn = document.getElementById('resetBtn');

let board = ['', '', '', '', '', '', '', '', ''];
let currentPlayer = 'X';
let gameActive = true;

function createBoard() {
    boardElement.innerHTML = '';
    
    for (let i = 0; i < 9; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.textContent = board[i];
        cell.dataset.index = i;
        cell.addEventListener('click', () => makeMove(i));
        boardElement.appendChild(cell);
    }
}

function makeMove(index) {
    if (!gameActive || board[index] !== '') return;
    
    board[index] = currentPlayer;
    
    if (checkWinner()) {
        statusElement.textContent = `🎉 Игрок ${currentPlayer} победил! 🎉`;
        gameActive = false;
        createBoard();
        return;
    }
    
    if (checkDraw()) {
        statusElement.textContent = '🤝 Ничья! 🤝';
        gameActive = false;
        createBoard();
        return;
    }
    
    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    statusElement.textContent = `Ход: ${currentPlayer}`;
    createBoard();
}

function checkWinner() {
    const winPatterns = [
        [0,1,2], [3,4,5], [6,7,8],
        [0,3,6], [1,4,7], [2,5,8],
        [0,4,8], [2,4,6]
    ];
    
    for (let pattern of winPatterns) {
        const [a,b,c] = pattern;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return true;
        }
    }
    return false;
}

function checkDraw() {
    return board.every(cell => cell !== '');
}

function resetGame() {
    board = ['', '', '', '', '', '', '', '', ''];
    currentPlayer = 'X';
    gameActive = true;
    statusElement.textContent = 'Ход: X';
    createBoard();
}

resetBtn.addEventListener('click', resetGame);
createBoard();