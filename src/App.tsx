import { useEffect, useRef, useState } from 'react';
import {
    canMove,
    createEmptyBoard,
    hasWon,
} from './game/board';
import {
    moveDown,
    moveLeft,
    moveRight,
    moveUp,
    type TileMove,
} from './game/movement';
import './index.css';

type TileState = {
    id: number;
    value: number;
    row: number;
    col: number;
};

let nextTileId = 1;

function tilesToBoard(tiles: TileState[]) {
    const board = createEmptyBoard();

    for (const tile of tiles) {
        board[tile.row][tile.col] = tile.value;
    }

    return board;
}

function createRandomTile(
    tiles: TileState[]
): {
    tiles: TileState[];
    newTile: TileState | null;
} {
    const board = tilesToBoard(tiles);
    const emptyCells: Array<[number, number]> = [];

    for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
            if (board[row][col] === 0) {
                emptyCells.push([row, col]);
            }
        }
    }

    if (emptyCells.length === 0) {
        return {
            tiles,
            newTile: null,
        };
    }

    const randomIndex = Math.floor(
        Math.random() * emptyCells.length
    );

    const [row, col] = emptyCells[randomIndex];

    const newTile: TileState = {
        id: nextTileId++,
        value: Math.random() < 0.9 ? 2 : 4,
        row,
        col,
    };

    return {
        tiles: [...tiles, newTile],
        newTile,
    };
}

function createInitialTiles(): TileState[] {
    let tiles: TileState[] = [];

    tiles = createRandomTile(tiles).tiles;
    tiles = createRandomTile(tiles).tiles;

    return tiles;
}

function getPositionKey(row: number, col: number) {
    return `${row}-${col}`;
}

function createMovingTiles(
    tiles: TileState[],
    moves: TileMove[]
): TileState[] {
    const tilesByPosition = new Map<string, TileState>();

    for (const tile of tiles) {
        tilesByPosition.set(
            getPositionKey(tile.row, tile.col),
            tile
        );
    }

    return moves.map(move => {
        const sourceTile = tilesByPosition.get(
            getPositionKey(move.fromRow, move.fromCol)
        );

        if (!sourceTile) {
            throw new Error('Не удалось найти плитку для перемещения');
        }

        return {
            ...sourceTile,
            row: move.toRow,
            col: move.toCol,
        };
    });
}

function createFinalTiles(
    resultBoard: number[][],
    moves: TileMove[],
    tiles: TileState[]
): TileState[] {
    const tilesByPosition = new Map<string, TileState>();

    for (const tile of tiles) {
        tilesByPosition.set(
            getPositionKey(tile.row, tile.col),
            tile
        );
    }

    const idByDestination = new Map<string, number>();

    for (const move of moves) {
        const destinationKey = getPositionKey(
            move.toRow,
            move.toCol
        );

        if (idByDestination.has(destinationKey)) {
            continue;
        }

        const sourceTile = tilesByPosition.get(
            getPositionKey(move.fromRow, move.fromCol)
        );

        if (sourceTile) {
            idByDestination.set(
                destinationKey,
                sourceTile.id
            );
        }
    }

    const finalTiles: TileState[] = [];

    for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
            const value = resultBoard[row][col];

            if (value === 0) {
                continue;
            }

            const id = idByDestination.get(
                getPositionKey(row, col)
            );

            finalTiles.push({
                id: id ?? nextTileId++,
                value,
                row,
                col,
            });
        }
    }

    return finalTiles;
}

function getMergeTileIds(
    moves: TileMove[],
    tiles: TileState[]
): number[] {
    const tilesByPosition = new Map<string, TileState>();

    for (const tile of tiles) {
        tilesByPosition.set(
            getPositionKey(tile.row, tile.col),
            tile
        );
    }

    const ids: number[] = [];
    const destinations = new Set<string>();

    for (const move of moves) {
        if (!move.merged) {
            continue;
        }

        const destinationKey = getPositionKey(
            move.toRow,
            move.toCol
        );

        if (destinations.has(destinationKey)) {
            continue;
        }

        const sourceTile = tilesByPosition.get(
            getPositionKey(move.fromRow, move.fromCol)
        );

        if (sourceTile) {
            ids.push(sourceTile.id);
            destinations.add(destinationKey);
        }
    }

    return ids;
}

function App() {
    const [tiles, setTiles] = useState(createInitialTiles);
    const [score, setScore] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [won, setWon] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const [mergeTileIds, setMergeTileIds] = useState<number[]>([]);
    const [newTileId, setNewTileId] = useState<number | null>(null);

    const moveTimerRef = useRef<number | null>(null);
    const mergeTimerRef = useRef<number | null>(null);

    useEffect(() => {
        function handleKeyDown(event: KeyboardEvent) {
            if (gameOver || won || isAnimating) {
                return;
            }

            let result;

            switch (event.key) {
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    result = moveLeft(tiles);
                    break;

                case 'ArrowRight':
                case 'd':
                case 'D':
                    result = moveRight(tiles);
                    break;

                case 'ArrowUp':
                case 'w':
                case 'W':
                    result = moveUp(tiles);
                    break;

                case 'ArrowDown':
                case 's':
                case 'S':
                    result = moveDown(tiles);
                    break;

                default:
                    return;
            }

            event.preventDefault();

            const hasMovement = result.moves.some(
                move =>
                    move.fromRow !== move.toRow ||
                    move.fromCol !== move.toCol
            );

            if (!hasMovement) {
                return;
            }

            const movingTiles = createMovingTiles(
                tiles,
                result.moves
            );

            setIsAnimating(true);
            setMergeTileIds([]);
            setNewTileId(null);
            setTiles(movingTiles);

            moveTimerRef.current = window.setTimeout(() => {
                const finalTiles = createFinalTiles(
                    result.board,
                    result.moves,
                    tiles
                );

                const mergeIds = getMergeTileIds(
                    result.moves,
                    tiles
                );

                const randomTileResult = createRandomTile(
                    finalTiles
                );

                const finalTilesWithNewTile =
                    randomTileResult.tiles;

                setTiles(finalTilesWithNewTile);

                setScore(currentScore =>
                    currentScore + result.scoreGained
                );

                setMergeTileIds(mergeIds);
                setNewTileId(
                    randomTileResult.newTile?.id ?? null
                );

                const finalBoard = tilesToBoard(
                    finalTilesWithNewTile
                );

                if (hasWon(finalBoard)) {
                    setWon(true);
                } else if (!canMove(finalBoard)) {
                    setGameOver(true);
                }

                mergeTimerRef.current = window.setTimeout(() => {
                    setMergeTileIds([]);
                    setNewTileId(null);
                    setIsAnimating(false);
                }, 180);
            }, 140);
        }

        window.addEventListener(
            'keydown',
            handleKeyDown
        );

        return () => {
            window.removeEventListener(
                'keydown',
                handleKeyDown
            );
        };
    }, [tiles, gameOver, won, isAnimating]);

    useEffect(() => {
        return () => {
            if (moveTimerRef.current !== null) {
                window.clearTimeout(
                    moveTimerRef.current
                );
            }

            if (mergeTimerRef.current !== null) {
                window.clearTimeout(
                    mergeTimerRef.current
                );
            }
        };
    }, []);

    function clearTimers() {
        if (moveTimerRef.current !== null) {
            window.clearTimeout(
                moveTimerRef.current
            );
            moveTimerRef.current = null;
        }

        if (mergeTimerRef.current !== null) {
            window.clearTimeout(
                mergeTimerRef.current
            );
            mergeTimerRef.current = null;
        }
    }

    function startNewGame() {
        clearTimers();

        setTiles(createInitialTiles());
        setScore(0);
        setGameOver(false);
        setWon(false);
        setIsAnimating(false);
        setMergeTileIds([]);
        setNewTileId(null);
    }

    function continueGame() {
        setWon(false);
        setMergeTileIds([]);
        setNewTileId(null);
    }

    return (
        <main className="game">
            <header className="game-header">
                <div>
                    <h1>2048</h1>
                </div>
                <div>

                </div>
                <div className="score-container">
                    <span>Счёт</span>
                    <strong>{score}</strong>
                </div>
            </header>
            <section
                className="board"
                aria-label="Игровое поле 2048"
            >
                <div className="board-cells">
                    {Array.from({ length: 16 }).map(
                        (_, index) => (
                            <div
                                className="board-cell"
                                key={index}
                            />
                        )
                    )}
                </div>

                <div className="tile-layer">
                    {tiles.map(tile => (
                        <div
                            className={[
                                'tile',
                                `tile-${tile.value}`,
                                `tile-row-${tile.row}`,
                                `tile-col-${tile.col}`,
                                mergeTileIds.includes(tile.id)
                                    ? 'tile-merge'
                                    : '',
                                newTileId === tile.id
                                    ? 'tile-new'
                                    : '',
                            ]
                                .filter(Boolean)
                                .join(' ')}
                            key={tile.id}
                        >
                            {tile.value}
                        </div>
                    ))}
                </div>

                {gameOver && (
                    <div className="game-overlay">
                        <div className="game-overlay-content">
                            <h2>Игра окончена!</h2>

                            <p>
                                Счёт: <strong>{score}</strong>
                            </p>

                            <button
                                className="overlay-button"
                                onClick={startNewGame}
                            >
                                Попробовать снова
                            </button>
                        </div>
                    </div>
                )}

                {won && (
                    <div className="game-overlay">
                        <div className="game-overlay-content">
                            <h2>Ты выиграл!</h2>
                            <div className="overlay-buttons">
                                <button
                                    className="overlay-button"
                                    onClick={continueGame}
                                >
                                    Продолжить
                                </button>
                                <button
                                    className="overlay-button secondary"
                                    onClick={startNewGame}
                                >
                                    Новая игра
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </section>
        </main>
    );
}

export default App;