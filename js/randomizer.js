class Randomizer
{
    constructor()
    {
        this.bag = [];
    }

    next()
    {
        if(this.bag.length == 0)
        {
            this.bag = [0,1,2,3,4,5,6];

            for(let i = this.bag.length - 1; i > 0; i--)
            {
                const j = Math.floor(Math.random() * (i + 1));

                [this.bag[i], this.bag[j]] =
                [
                    this.bag[j],
                    this.bag[i]
                ];
            }
        }

        return this.bag.pop();
    }
}