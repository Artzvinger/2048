import type { Board } from './types';

export function createEmptyBoard(): Board {
    return [
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
    ];
}

export function addRandomTile(board: Board): Board {
    const emptyCells: [number, number][] = [];

    for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
            if (board[row][col] === 0) {
                emptyCells.push([row, col]);
            }
        }
    }

    if (emptyCells.length === 0) {
        return board;
    }

    const randomIndex = Math.floor(Math.random() * emptyCells.length);
    const [row, col] = emptyCells[randomIndex];

    const value = Math.random() < 0.9 ? 2 : 4;

    const newBoard = board.map(row => [...row]);
    newBoard[row][col] = value;

    return newBoard;
}

export function boardsEqual(a: Board, b: Board): boolean {
    for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
            if (a[row][col] !== b[row][col]) {
                return false;
            }
        }
    }

    return true;
}

export function canMove(board: Board): boolean {
    for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
            if (board[row][col] === 0) {
                return true;
            }
        }
    }

    for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 3; col++) {
            if (board[row][col] === board[row][col + 1]) {
                return true;
            }
        }
    }

    for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 4; col++) {
            if (board[row][col] === board[row + 1][col]) {
                return true;
            }
        }
    }

    return false;
}

export function hasWon(board: Board): boolean {
    return board.some(row => row.some(value => value >= 2048));
}