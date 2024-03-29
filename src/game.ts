import * as utils from "./utils";
import { Player } from "./interfaces/player";
import { Room, STATUS } from "./interfaces/room";
import * as stringSimilarity from "string-similarity";

/**
 * Information to keep
 */
var boundIo: SocketIO.Server;
export const rooms: { [id: string]: Room } = {};

/**
 * Creates a room
 * @returns the room object that was created
 */
export function createRoom(): Room {
    let newRoom = new Room(boundIo);
    rooms[newRoom.id] = newRoom;
    return newRoom;
}

export function bindIo(io: SocketIO.Server) {
    boundIo = io;
    io.on("connection", function (socket) {
        var player: Player = null;
        var room: Room = null;
        console.log(`Connection from ${socket.id}`);
        socket.on("joinRoom", function (data) {
            console.log(`A user is attempting to join ${data.room}`);
            if (player || room) return socket.disconnect();
            if (!(data.room in rooms) || !rooms[data.room]) return socket.disconnect();
            room = rooms[data.room];
            socket.join(room.id);
            socket.emit("roomJoined");
            socket.emit("title", room.title);
            socket.emit("status", room.status);
        });
        socket.on("identify", function (name) {
            console.log(`Socket id '${socket.id}' trying to identify as '${name}'`);
            if (player || !room) return socket.disconnect();
            if (!utils.validateUsername(name)) {
                return socket.emit("usernamePrompt",
                    "Invalid username. 3 - 12 alphanumeric characters only.");
            }
            if (room.players.find(player => player.name.toLowerCase() === name.toLowerCase())) {
                return socket.emit("usernamePrompt", "That name is already taken.");
            }
            let newPlayer = new Player(name, socket.id);
            player = newPlayer;
            room.addPlayer(newPlayer);
            socket.emit("identified");
        });
        socket.on("disconnecting", function (reason) {
            console.log(`${socket.id} socket disconnect: ${reason}`);
            if (!player || !room) return;
            for (let id of Object.keys(socket.rooms)) {
                let room = rooms[id];
                if (!room) continue;
                room.removePlayer(player);
                if (room.players.length == 0) {
                    rooms[id] = undefined;
                }
            }
        });

        // Drawing events
        socket.on("mousedown", function (pos) {
            if (room.status == STATUS.SPY_GUESSING) return;
            let x = pos.x, y = pos.y;
            let meta = room.playerMeta.get(player);
            meta.isDrawing = true;
            meta.x = x;
            meta.y = y;
            room.addCanvasItem(player.id, {
                color: player.color,
                type: "mousedown",
                x: x,
                y: y
            });
        });
        socket.on("mouseup", function (pos) {
            if (room.status == STATUS.SPY_GUESSING) return;
            let x = pos.x, y = pos.y;
            room.playerMeta.get(player).isDrawing = false;
            room.addCanvasItem(player.id, {
                color: player.color,
                type: "mouseup",
                x: x,
                y: y
            });
            if (room.playerMeta.get(player).canDraw && room.status == STATUS.IN_PROGRESS) {
                room.nextTurn();
            }
        });
        socket.on("mousemove", function (pos) {
            if (room.status == STATUS.SPY_GUESSING) return;
            let meta = room.playerMeta.get(player);
            if (!meta.isDrawing) return;
            let x = pos.x, y = pos.y;
            let dist = Math.sqrt(Math.abs(x - meta.x) + Math.abs(y - meta.y));
            if (dist < 2) return;
            meta.x = x;
            meta.y = y;
            if (meta.ink > 0 && (room.status == STATUS.LOBBY || (meta.isDrawing && meta.canDraw))) {
                meta.subtractInk(dist);
                if (room.status == STATUS.LOBBY) {
                    socket.emit("updateInk", `${meta.ink / 3}%`);
                } else {
                    io.to(room.id).emit("updateInk", `${meta.ink / 3}%`);
                }
                room.addCanvasItem(player.id, {
                    color: player.color,
                    type: "mousemove",
                    x: x,
                    y: y
                });
            }
        });
        socket.on("mouseleave", function () {
            if (room.status == STATUS.SPY_GUESSING) return;
            let meta = room.playerMeta.get(player);
            if (!meta.isDrawing) return;
            meta.isDrawing = false;
            room.addCanvasItem(player.id, {
                color: player.color,
                type: "mouseup",
                x: meta.x,
                y: meta.y
            });
            if (room.playerMeta.get(player).canDraw && room.status == STATUS.IN_PROGRESS) {
                room.nextTurn();
            }
        });
        socket.on("startGame", function () {
            if (room.status != STATUS.LOBBY) {
                return socket.emit("message", "Stop that.");
            } else if (room.players.length < 3) {
                return socket.emit("message", "Cannot start the game, you need at least 3 players.");
            }
            io.to(room.id).emit("startGame");
            room.startGame();
        });
        socket.on("message", function (message) {
            io.to(room.id).emit("message", `${player.name}: ${message}`);
            let curSpy = room.players.find(player => room.playerMeta.get(player).isSpy);
            if (room.status == STATUS.SPY_GUESSING) {
                if (socket.id == curSpy.id) {
                    // this message needs to be compared
                    let similarity = stringSimilarity.compareTwoStrings(room.word, message);
                    if (similarity >= 0.85) {
                        io.to(room.id).emit("message", `${curSpy.name} wins!`);
                    } else {
                        let winners = [];
                        curSpy.votes.forEach(id => {
                            winners.push(room.players.find(player => player.id == id).name);
                        });
                        io.to(room.id).emit("message", `${winners.join(", ")} wins!`);
                    }
                    room.endGame();
                }
            } else if (room.status == STATUS.IN_PROGRESS && socket.id == curSpy.id) {
                let similarity = stringSimilarity.compareTwoStrings(room.word, message);
                if (similarity >= 0.75) {
                    io.to(room.id).emit("message", `${curSpy.name} has guessed the word!`);
                    room.endGame();
                }
            }
        });
        socket.on("vote", function (id) {
            console.log(`${socket.id} wants to vote on ${id}`);
            if (room.status != STATUS.IN_PROGRESS) return socket.emit("message", "Cannot vote in the lobby.");
            if (id == socket.id) return socket.emit("message", "You cannot vote for yourself.");
            let currentVoted = room.players.find(player => player.votes.indexOf(socket.id) > -1);
            if (currentVoted) {
                currentVoted.votes.splice(currentVoted.votes.indexOf(socket.id), 1);
                if (currentVoted.id == id) {
                    io.to(room.id).emit("updatePlayers", room.players);
                    return socket.emit("message", `Removed vote from ${currentVoted.name}`);
                }
            }
            let userToVoteOn = room.players.find((player) => player.id == id);
            if (!userToVoteOn) return socket.emit("message", "ERROR: Cannot find user to vote on.");
            userToVoteOn.votes.push(socket.id);
            socket.emit("message", `Voted for ${userToVoteOn.name}`);
            io.to(room.id).emit("updatePlayers", room.players);

            if (userToVoteOn.votes.length >= Math.floor(room.players.length * .75)) {
                // Majority vote.
                io.to(room.id).emit("message", `${userToVoteOn.name} has the majority vote!`);
                if (room.playerMeta.get(userToVoteOn).isSpy) {
                    io.to(room.id).emit("message", `${userToVoteOn.name} is the fake artist!`);
                    io.to(room.id).emit("message", `Make your guess now for a chance of victory!`);
                    room.setStatus(STATUS.SPY_GUESSING);
                } else {
                    let realFakeArtist = room.players.find(player => room.playerMeta.get(player).isSpy);
                    io.to(room.id).emit("message", `${userToVoteOn.name} is NOT the fake artist!`);
                    io.to(room.id).emit("message", `${realFakeArtist.name} wins!`);
                    room.endGame();
                }
            }
        });
    });
}