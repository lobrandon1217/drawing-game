import * as express from "express";
import * as http from "http";
import * as socketio from "socket.io";
import * as game from "./game";

const app = express();
const server = http.createServer(app);
const io = socketio(server, {
    pingTimeout: 10000
});

app.use(express.static("node_modules/socket.io-client/dist/"));
app.use(express.static("node_modules/bootstrap/dist"));
app.use(express.static("node_modules/jquery/dist"));
app.use(express.static("node_modules/popper.js/dist/umd"));
app.use(express.static("static"));

game.bindIo(io);

app.set("view engine", "ejs");

app.get("/", function(req, res, next) {
    return res.render("index", {
        "title": "Welcome"
    });
})

app.get("/new_room", function(req, res, next) {
    let newRoom = game.createRoom();
    return res.redirect(`/rooms/${newRoom.id}`);
});

app.get("/rooms/:room", function(req, res, next) {
    if (!(req.params.room in game.rooms) || !game.rooms[req.params.room]) {
        return res.redirect("/");
    }
    return res.render("canvas", {
        room: req.params.room,
        title: `In game ${req.params.room}`
    });
});

server.listen(7121, function() {
    console.log("Listening on 7121");
});