class Save
{
    static save(score)
    {
        const best=
        Math.max(
            score,
            Save.load()
        );

        localStorage.setItem(
            "tetris_best",
            best
        );
    }

    static load()
    {
        const value = localStorage.getItem("tetris_best");

        return Number(value || 0);
    }
}