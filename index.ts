import bodyParser from "body-parser";
import express, { Request, Response } from "express";

import {
    SnakeInfo,
    Move,
    Direction,
    GameRequest,
    Board,
    Coordinates,
    GameState,
} from "./types";

const PORT = process.env.PORT || 3000;

const app = express();
app.use(bodyParser.json());

app.get("/", handleIndex);
app.post("/start", handleStart);
app.post("/move", handleMove);
app.post("/end", handleEnd);

app.listen(PORT, () =>
    console.log(
        `TypeScript Battlesnake Server listening at http://127.0.0.1:${PORT}`
    )
);

const MOVES: Direction[] = ["up", "down", "left", "right"];

function handleIndex(request: Request, response: Response<SnakeInfo>) {
    const battlesnakeInfo: SnakeInfo = {
        apiversion: "1",
        author: "Eddie Jaoude",
        color: "#888888",
        head: "default",
        tail: "default",
    };
    response.status(200).json(battlesnakeInfo);
}

function handleStart(request: GameRequest, response: Response) {
    const gameData = request.body;

    console.log("STARTING NOW");
    response.status(200).send("ok");
}

function handleMove(request: GameRequest, response: Response<Move>) {
    const gameData: GameState = request.body;
    // console.dir(gameData, { depth: null });

    let move = getMove();
    // move = checkBoundaries(gameData.board, gameData.you.head, move);
    // move = checkBody(gameData.you.body, gameData.you.head, move);

    console.log("MOVE: " + move);
    response.status(200).send({ move });
}

function handleEnd(request: GameRequest, response: Response) {
    const gameData = request.body;

    console.log("END");
    response.status(200).send("ok");
}

function checkBoundaries(
    board: Board,
    head: Coordinates,
    move: Direction
): Direction {
    if (head.y === 0 && move === "down") {
        move = getMove(["up", "left", "right"]);
    }

    if (head.x === 0 && move === "left") {
        move = getMove(["up", "down", "right"]);
    }

    if (head.y === board.height - 1 && move === "up") {
        move = getMove(["down", "left", "right"]);
    }

    if (head.x === board.width - 1 && move === "right") {
        move = getMove(["up", "down", "left"]);
    }

    return move;
}

function checkBody(body: Coordinates[], head: Coordinates, move: Direction) {
    let hitBody = body.find((position) => {
        console.log(position, nextMove(head, move));
        if (
            position.x === nextMove(head, move).x &&
            position.y === nextMove(head, move).y
        ) {
            return true;
        }

        return false;
    });

    if (hitBody) {
        console.log("BODY HIT");
        let newMoves = MOVES.filter((possibleMove) => possibleMove !== move);
        move = getMove(newMoves);
    }

    return move;
}

function getMove(available: Direction[] = MOVES): Direction {
    const possibleMoves: Direction[] = available;
    return possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
}

function nextMove(
    currentPosition: { x: number; y: number },
    move: Direction
): Coordinates {
    let x = currentPosition.x;
    let y = currentPosition.y;
    switch (move) {
        case "left":
            x--;
            break;
        case "right":
            x++;
            break;
        case "down":
            y--;
            break;
        case "up":
            y++;
            break;
    }

    return { x, y };
}

export default app;
