import { Player } from "./player";
import { genRoomName } from "../utils";
import { randomWord } from "../words";

export const STATUS = {
    LOBBY: 0,
    IN_PROGRESS: 1,
    SPY_GUESSING: 2
}

export class RoomMeta {
    word: string;

}

export class PlayerMeta {
    ink: number;
    isSpy: boolean;
    isDrawing: boolean;
    canDraw: boolean;
    drawnLines: number;
    x: number;
    y: number;

    constructor() {
        this.resetInk();
        this.isSpy = false;
        this.isDrawing = false;
        this.canDraw = false;
        this.x = 0;
        this.y = 0;
        this.drawnLines = 0;
    }

    subtractInk(number: number) {
        if (this.ink >= number) {
            this.ink -= number;
        } else {
            this.ink = 0;
        }
    }

    resetInk() {
        this.ink = 300;
    }
}

export class CanvasItem {
    type: "mouseup" | "mousedown" | "mousemove";
    x: number;
    y: number;
    color: string;
}

export class Room {
    io: SocketIO.Server;
    id: string;
    title: string;
    players: Player[];
    playerMeta: Map<Player, PlayerMeta>;
    status: number;
    word: string;
    canvas: {[id: string]: CanvasItem[]};

    constructor(io: SocketIO.Server) {
        this.id = genRoomName();
        this.players = [];
        this.status = STATUS.LOBBY;
        this.playerMeta = new Map();
        this.io = io;
        this.canvas = {};
        this.title = "Draw something cool while we wait!"
    }

    addPlayer(player: Player) {
        this.players.push(player);
        this.playerMeta.set(player, new PlayerMeta());
        this.canvas[player.id] = [];
        this.io.in(this.id).emit("updatePlayers", this.players);
        this.io.in(player.id).emit("updateCanvas", this.canvas);
        this.io.in(this.id).emit("message", `${player.name} has joined the game.`);
    }

    setTitle(title: string) {
        this.title = title;
        this.io.to(this.id).emit("title", this.title);
    }

    /**
     * Removes a player from the player list
     * @param player Player to remove
     */
    removePlayer(player: Player) {
        // Remove the player
        let idx = this.players.indexOf(player);
        let meta = this.playerMeta.get(player);
        if (meta.isSpy) {
            this.io.to(this.id).emit("message", `${player.name} (the spy) has left the game, going back to lobby.`);
            this.endGame();
        } else if (meta.canDraw) {
            this.io.to(this.id).emit("message", `${player.name}'s turn has been skipped.`);
            this.nextTurn();
        }
        this.players.splice(idx, 1);
        this.playerMeta.delete(player);
        this.io.in(this.id).emit("updatePlayers", this.players);
        this.io.in(this.id).emit("message", `${player.name} has left the game.`);
    }

    /**
     * Add a canvas item to the canvas list.
     * @param item Canvas item to add
     */
    addCanvasItem(playerId: string, item: CanvasItem) {
        this.canvas[playerId].push(item);
        this.io.in(this.id).emit("updateCanvas", this.canvas);
    }

    /**
     * Advances one turn.
     */
    nextTurn() {
        let idx;
        let curArtist = this.players.find((player, index) => {
            if (this.playerMeta.get(player).canDraw) {
                idx = index;
                return true;
            }
            return false;
        });
        if (curArtist) this.io.to(this.id).emit("message", `End of ${curArtist.name}'s turn.`);
        if (idx == this.players.length - 1) {
            // THe next artist should be the first player.
            this.setArtist(this.players[0]);
        } else {
            this.setArtist(this.players[idx + 1]);
        }
    }

    startGame() {
        // Reset everybody
        this.playerMeta.forEach(function(meta) {
            meta.canDraw = false;
            meta.isSpy = false;
        });
        // Set up for the game...
        this.setStatus(STATUS.IN_PROGRESS);
        this.clearCanvas();
        // Choose someone to draw and the spy
        let artist = this.players[Math.floor(Math.random() * this.players.length)];
        this.setArtist(artist);
        let spy = this.players[Math.floor(Math.random() * this.players.length)];
        this.setSpy(spy);
        // Generate the word and send it to everybody
        this.genWord();
    } 

    setArtist(artist: Player) {
        this.playerMeta.forEach(function(meta, player) {
            meta.canDraw = false;
        });
        let plyMeta = this.playerMeta.get(artist);
        plyMeta.canDraw = true;
        plyMeta.resetInk();
        this.io.to(this.id).emit("updateInk", `${plyMeta.ink / 3}%`);
        this.setTitle(`${artist.name}'s turn to draw!`);
    }

    setSpy(spy: Player) {
        this.playerMeta.forEach(function(meta) {
            meta.isSpy = false;
        });
        this.playerMeta.get(spy).isSpy = true;
    }

    endGame() {
        // end the game, back to lobby.
        this.clearCanvas();
        this.setStatus(STATUS.LOBBY);
        this.setTitle("Draw something cool while we wait!");
        this.players.forEach(player => {
            player.votes = [];
        });
        this.io.to(this.id).emit("updatePlayers", this.players);
        this.io.to(this.id).emit("message", `The word was: ${this.word}`);
    }

    /**
     * Generate a random word for use with this room game.
     */
    genWord() {
        this.word = randomWord();
        this.playerMeta.forEach((meta, player) => {
            if (meta.isSpy) {
                this.io.to(player.id).emit("message", "You are the spy!");
            } else {
                this.io.to(player.id).emit("message", `The word is: ${this.word}`);
            }
        });
    }

    setStatus(status: number) {
        this.status = status;
        this.io.to(this.id).emit("status", this.status);
    }

    clearCanvas() {
        this.canvas = {};
        this.players.forEach(player => {
            this.canvas[player.id] = [];
        });
        this.io.in(this.id).emit("updateCanvas", this.canvas);
    }
}