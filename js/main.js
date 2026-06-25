const canvas = document.getElementById("canvas");
const renderer = new Renderer(canvas);
const input = new Input();
const audio = new Audio();
const keybinds = new Keybinds();
const ui = new UI();
const mp = new MultiplayerManager(audio);

let game = null;
let mode = "menu";

function initAudio() {
    audio.init();
    audio.resume();
}

function startSingleplayer() {
    mode = "single";
    ui.showScreen("singleScreen");
    initAudio();

    game = new Game(renderer, { audio });
    game.scoreSystem.updateUI();
    document.getElementById("best").textContent = Save.load();
    audio.startMusic();
}

function startMultiplayer() {
    mode = "multi";
    ui.showScreen("multiScreen");
    initAudio();
    mp.startMatchmaking();
}

function backToMenu() {
    mode = "menu";
    if (game) {
        audio.stopMusic();
        game = null;
    }
    mp.cleanup();
    ui.showScreen("menuScreen");
}

window.backToMenu = backToMenu;

function loop() {
    const binds = keybinds.getKeyMap();

    if (mode === "single" && game) {
        game.update(input, binds);
        game.render();
    } else if (mode === "multi") {
        mp.update(input, binds);
        mp.render();
    }

    requestAnimationFrame(loop);
}

document.getElementById("btnSingle").addEventListener("click", () => {
    initAudio();
    startSingleplayer();
});

document.getElementById("btnMulti").addEventListener("click", () => {
    initAudio();
    startMultiplayer();
});

document.getElementById("btnSettings").addEventListener("click", () => {
    ui.renderKeybinds(keybinds);
    ui.showScreen("settingsScreen");
});

document.getElementById("btnBackMenu").addEventListener("click", backToMenu);
document.getElementById("btnBackFromSettings").addEventListener("click", () => {
    ui.stopKeyCapture();
    ui.showScreen("menuScreen");
});

document.getElementById("btnResetKeybinds").addEventListener("click", () => {
    keybinds.reset();
    ui.renderKeybinds(keybinds);
    ui.updateControlsHint(keybinds);
});

document.getElementById("toggleSound").addEventListener("change", (e) => {
    audio.setEnabled(e.target.checked);
    ui.settings.sound = e.target.checked;
});

document.getElementById("toggleMusic").addEventListener("change", (e) => {
    ui.settings.music = e.target.checked;
    if (!e.target.checked) audio.stopMusic();
    else if (mode !== "menu") audio.startMusic();
});

document.addEventListener("keydown", () => initAudio());

if (location.protocol === "file:") {
    console.warn("MyTetr: откройте http://localhost:3000 (запустите npm start в server/)");
}

ui.updateControlsHint(keybinds);
loop();
