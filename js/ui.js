class UI {
    constructor() {
        this.screen = "menu";
        this.settings = {
            sound: true,
            music: true
        };
    }

    showScreen(name) {
        this.screen = name;
        document.querySelectorAll(".screen").forEach(el => {
            el.classList.toggle("active", el.id === name);
        });
    }

    draw() {}
}
