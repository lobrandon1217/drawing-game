const socket = io();
const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");
let canIdentify = false;
let identified = false;
ctx.lineWidth = 4;
$("#usernamePrompt").modal({ keyboard: false });
$("#usernamePrompt").on("hide.bs.modal", function (e) {
    console.log(identified);
    if (!identified) {
        e.preventDefault();
    }
});
$("#usernamePrompt form").submit(function (e) {
    e.preventDefault();
    identify($("#usernamePrompt input[name='username']").val().trim());
});
function identify(name) {
    // TODO give the user an actual message that's useful
    if (!canIdentify || identified) return;
    socket.emit("identify", name);
}
socket.on("connect", function () {
    let info = {
        room: room,
    };
    canIdentify = true;
    socket.emit("joinRoom", info);
});
socket.on("identified", function () {
    identified = true;
    $("#usernamePrompt").modal("hide");
});
socket.on("usernamePrompt", function (message) {
    $("#promptMsg").text(message).removeClass("collapse").css("opacity", 0).animate({
        opacity: 1
    }, 150);
});
socket.on("updateCanvas", function (canvasMap) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let key in canvasMap) {
        for (let item of canvasMap[key]) {
            switch (item.type) {
                case "mousedown":
                    ctx.strokeStyle = item.color;
                    ctx.moveTo(item.x, item.y);
                    ctx.beginPath();
                    break;
                case "mousemove":
                    ctx.lineTo(item.x, item.y);
                    ctx.stroke();
                    break;
                case "mouseup":
                    ctx.closePath();
                    ctx.moveTo(item.x, item.y);
                    break;
            }
        }
    }
});
socket.on("roomJoined", function () {
    canvas.addEventListener("mousedown", function (e) {
        let mouseX = e.clientX - canvas.getBoundingClientRect().left;
        let mouseY = e.clientY - canvas.getBoundingClientRect().top;
        let canvasX = mouseX * canvas.width / canvas.clientWidth;
        let canvasY = mouseY * canvas.height / canvas.clientHeight;
        socket.emit("mousedown", { x: canvasX, y: canvasY });
    });
    canvas.addEventListener("mousemove", function (e) {
        let mouseX = e.clientX - canvas.getBoundingClientRect().left;
        let mouseY = e.clientY - canvas.getBoundingClientRect().top;
        let canvasX = mouseX * canvas.width / canvas.clientWidth;
        let canvasY = mouseY * canvas.height / canvas.clientHeight;
        socket.emit("mousemove", { x: canvasX, y: canvasY });
    });
    canvas.addEventListener("mouseup", function (e) {
        let mouseX = e.clientX - canvas.getBoundingClientRect().left;
        let mouseY = e.clientY - canvas.getBoundingClientRect().top;
        let canvasX = mouseX * canvas.width / canvas.clientWidth;
        let canvasY = mouseY * canvas.height / canvas.clientHeight;
        socket.emit("mouseup", { x: canvasX, y: canvasY });
    });
    canvas.addEventListener("mouseleave", function (e) {
        socket.emit("mouseleave");
    });
});
socket.on("updatePlayers", updatePlayers);
socket.on("message", newMessage);
socket.on("updateInk", function (percent) {
    document.querySelector("#ink").style.width = percent;
});
socket.on("status", function (status) {
    switch (status) {
        case 0:
            // lobby
            document.querySelector("#startGame").classList.remove("collapse");
            break;
        case 1:
            document.querySelector("#startGame").classList.add("collapse");
            break;
    }
});
socket.on("time", function (timeString) {
    document.querySelector("#time").textContent = timeString;
})
socket.on("title", function (data) {
    document.querySelector("#title").textContent = data;
});
socket.on("disconnect", function (e) {
    newMessage(`Disconnected from server: ${e}`);
});
document.querySelector("#startGame").addEventListener("click", function (e) {
    socket.emit("startGame");
});
document.querySelector("#endTurn").addEventListener("click", function () {
    socket.emit("endTurn");
});
document.querySelector("#chatBox").addEventListener("keydown", function (e) {
    if (e.keyCode != 13) return;
    if (this.value.length < 1) return;
    socket.emit("message", this.value);
    this.value = "";
});
function updatePlayers(list) {
    let elem = document.querySelector("#players div");
    elem.innerHTML = "";
    for (let player of list) {
        let playerElem = document.createElement("a");
        playerElem.setAttribute("data-vote", player.id);
        playerElem.classList.add("list-group-item", "list-group-item-action", "d-flex", "row", "no-gutters");
        playerElem.style.borderLeft = `6px solid ${player.color}`;
        playerElem.innerHTML = `<div class="col">${player.name}</div>
            <div class="col text-right">${player.votes.length} vote${player.votes.length == 1 ? "" : "s"}</div>`;
        elem.appendChild(playerElem);
    }
}
function newMessage(message) {
    let messages = document.querySelector("#messages");
    let ul = document.querySelector("#messages ul");
    let li = document.createElement("li");
    let date = new Date();
    li.classList.add("p-1");
    let minutes = date.getMinutes();
    li.append(document.createTextNode(`[${date.getHours()}:${minutes > 9 ? minutes : `0${minutes}`}] ${message}`));
    ul.appendChild(li);
    messages.scroll({
        top: messages.scrollHeight
    });
}
document.querySelector("#players div").addEventListener("click", function (e) {
    socket.emit("vote", e.target.getAttribute("data-vote"));
});
