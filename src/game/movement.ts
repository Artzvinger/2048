import type { Board } from './types';

export type Tile = {
    id: number;
    value: number;
    row: number;
    col: number;
};

export type TileMove = {
    fromRow: number;
    fromCol: number;
    toRow: number;
    toCol: number;
    value: number;
    merged: boolean;
};

export type MoveResult = {
    board: Board;
    scoreGained: number;
    merged: boolean;
    moves: TileMove[];
};

type LineResult = {
    values: number[];
    scoreGained: number;
    merged: boolean;
    moves: TileMove[];
};

function moveLine(
    line: Tile[],
    fixedIndex: number,
    horizontal: boolean,
    reverse: boolean
): LineResult {
    const ordered = reverse ? [...line].reverse() : [...line];

    const values: number[] = [];
    const moves: TileMove[] = [];

    let scoreGained = 0;
    let merged = false;
    let targetIndex = 0;

    for (let i = 0; i < ordered.length; i++) {
        const current = ordered[i];

        const targetIndexInBoard = reverse
            ? 3 - targetIndex
            : targetIndex;

        const targetRow = horizontal
            ? fixedIndex
            : targetIndexInBoard;

        const targetCol = horizontal
            ? targetIndexInBoard
            : fixedIndex;

        if (
            i + 1 < ordered.length &&
            ordered[i].value === ordered[i + 1].value
        ) {
            const next = ordered[i + 1];
            const mergedValue = current.value * 2;

            moves.push({
                fromRow: current.row,
                fromCol: current.col,
                toRow: targetRow,
                toCol: targetCol,
                value: current.value,
                merged: true,
            });

            moves.push({
                fromRow: next.row,
                fromCol: next.col,
                toRow: targetRow,
                toCol: targetCol,
                value: next.value,
                merged: true,
            });

            values.push(mergedValue);

            scoreGained += mergedValue;
            merged = true;

            targetIndex++;
            i++;
        } else {
            moves.push({
                fromRow: current.row,
                fromCol: current.col,
                toRow: targetRow,
                toCol: targetCol,
                value: current.value,
                merged: false,
            });

            values.push(current.value);

            targetIndex++;
        }
    }

    while (values.length < 4) {
        values.push(0);
    }

    if (reverse) {
        values.reverse();
    }

    return {
        values,
        scoreGained,
        merged,
        moves,
    };
}

function createBoardFromTiles(tiles: Tile[]): Board {
    const board: Board = [
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
    ];

    for (const tile of tiles) {
        board[tile.row][tile.col] = tile.value;
    }

    return board;
}

export function moveLeft(tiles: Tile[]): MoveResult {
    const newBoard: Board = [
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
    ];

    const moves: TileMove[] = [];

    let scoreGained = 0;
    let merged = false;

    for (let row = 0; row < 4; row++) {
        const line = tiles
            .filter(tile => tile.row === row)
            .sort((a, b) => a.col - b.col);

        const result = moveLine(
            line,
            row,
            true,
            false
        );

        for (let col = 0; col < 4; col++) {
            newBoard[row][col] = result.values[col];
        }

        moves.push(...result.moves);

        scoreGained += result.scoreGained;
        merged = merged || result.merged;
    }

    return {
        board: newBoard,
        scoreGained,
        merged,
        moves,
    };
}

export function moveRight(tiles: Tile[]): MoveResult {
    const newBoard: Board = [
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
    ];

    const moves: TileMove[] = [];

    let scoreGained = 0;
    let merged = false;

    for (let row = 0; row < 4; row++) {
        const line = tiles
            .filter(tile => tile.row === row)
            .sort((a, b) => a.col - b.col);

        const result = moveLine(
            line,
            row,
            true,
            true
        );

        for (let col = 0; col < 4; col++) {
            newBoard[row][col] = result.values[col];
        }

        moves.push(...result.moves);

        scoreGained += result.scoreGained;
        merged = merged || result.merged;
    }

    return {
        board: newBoard,
        scoreGained,
        merged,
        moves,
    };
}

export function moveUp(tiles: Tile[]): MoveResult {
    const newBoard: Board = [
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
    ];

    const moves: TileMove[] = [];

    let scoreGained = 0;
    let merged = false;

    for (let col = 0; col < 4; col++) {
        const line = tiles
            .filter(tile => tile.col === col)
            .sort((a, b) => a.row - b.row);

        const result = moveLine(
            line,
            col,
            false,
            false
        );

        for (let row = 0; row < 4; row++) {
            newBoard[row][col] = result.values[row];
        }

        moves.push(...result.moves);

        scoreGained += result.scoreGained;
        merged = merged || result.merged;
    }

    return {
        board: newBoard,
        scoreGained,
        merged,
        moves,
    };
}

export function moveDown(tiles: Tile[]): MoveResult {
    const newBoard: Board = [
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
    ];

    const moves: TileMove[] = [];

    let scoreGained = 0;
    let merged = false;

    for (let col = 0; col < 4; col++) {
        const line = tiles
            .filter(tile => tile.col === col)
            .sort((a, b) => a.row - b.row);

        const result = moveLine(
            line,
            col,
            false,
            true
        );

        for (let row = 0; row < 4; row++) {
            newBoard[row][col] = result.values[row];
        }

        moves.push(...result.moves);

        scoreGained += result.scoreGained;
        merged = merged || result.merged;
    }

    return {
        board: newBoard,
        scoreGained,
        merged,
        moves,
    };
}

export function tilesToBoard(tiles: Tile[]): Board {
    return createBoardFromTiles(tiles);
}
