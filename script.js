const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');
const COLS = 10;
const ROWS = 20;
const SIZE = 40;
const board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
let MyPiece;
let MyX = 5 * SIZE;
let MyY = 0;
let IsGameOver = false;
let GameInterval;
const figures =
    [
        [
            [1, 1],
            [1, 1],
        ],
        [
            [0, 0, 2, 0],
            [0, 0, 2, 0],
            [0, 0, 2, 0],
            [0, 0, 2, 0],
        ],
        [
            [0, 0, 0, 0],
            [0, 3, 0, 0],
            [0, 3, 0, 0],
            [0, 3, 3, 0],
        ],
        [
            [0, 0, 0, 0],
            [0, 0, 4, 0],
            [0, 0, 4, 0],
            [0, 4, 4, 0],
        ],
        [
            [5, 0],
            [5, 5],
        ],
        [
            [0, 0, 0],
            [0, 6, 0],
            [6, 6, 6],
        ],
        [
            [0, 7, 7],
            [7, 7, 0],
            [0, 0, 0],
        ],
        [
            [8, 8, 0],
            [0, 8, 8],
            [0, 0, 0],
        ],
    ]

const colors = 
[
    '#FF3333',
    '#33FF33',
    '#3366FF',
    '#FFCC00',
    '#FF33FF',
    '#33FFFF',
    '#FF9933',
    '#aa00ff'
];
 
function RotateR(block)
{
  for (let i = 0; i < block.length; i++)
  {
    for (let j = i+1; j < block[i].length; j++)
    {
        [block[i][j], block[j][i]]=[block[j][i], block[i][j]];
    }
  }
  for (let i = 0; i < block.length; i++)
  {
    block[i] = block[i].reverse();
  }
}
 
function RotateL(block)
{
  for (let i = 0; i < block.length; i++)
  {
    block[i] = block[i].reverse();
  }
  for (let i = 0; i < block.length; i++)
  {
    for (let j = i+1; j < block[i].length; j++)
    {
        [block[i][j], block[j][i]]=[block[j][i], block[i][j]];
    }
  }
}
 
function DrawBlock(block, x, y)
{
  for (let i = 0; i < block.length; i++)
  {
    for (let j = 0; j < block[i].length; j++)
    {
        if (block[i][j] > 0)
        {
            ctx.fillStyle = colors[block[i][j] - 1]
            ctx.fillRect(j * SIZE + x, i * SIZE + y, SIZE, SIZE);
        }
    }
  }
}
 
function ClearBlock(block, x, y)
{
  for (let i = 0; i < block.length; i++)
  {
    for (let j = 0; j < block[i].length; j++)
    {
        if (block[i][j] > 0)
        {
            ctx.clearRect(j * SIZE + x, i * SIZE + y, SIZE, SIZE);
        }
    }
  }
}
 
function GetRandomPiece()
{
    const randomIndex = Math.floor(Math.random() * figures.length);
    ctx.fillStyle = colors[randomIndex + 1]
    return structuredClone(figures[randomIndex]);
}
 
function CheckFall(block, blockX, blockY) 
{
    blockX = blockX / SIZE;
    blockY = blockY / SIZE;
    
    for (let r = 0; r < block.length; r++) 
        {
        for (let c = 0; c < block[r].length; c++) 
            {
            if (block[r][c] > 0) 
                {
                let nextY = blockY + r + 1;
                let currentX = blockX + c;

                if (nextY >= 20) 
                {
                    console.log('fall: bottom');
                    return true;
                }

                if (board[nextY] && board[nextY][currentX] > 0) 
                {
                    console.log('fall: board');
                    return true;
                }
            }
        }
    }
    return false;
}

function FreezeBlock(block, x, y)
{
    for (let i = 0; i < block.length; i++)
    {
        for (let j = 0; j < block[i].length; j++)
        {
            if (block[i][j] > 0) 
            {
                let targetY = y / SIZE + i;
                let targetX = x / SIZE + j;

                if (board[targetY] !== undefined && board[targetY][targetX] !== undefined) 
                {
                    board[targetY][targetX] = block[i][j];
                }
            }
        }
    }  
}
 
function CheckMove(block, blockX, blockY, dir)
{
    let gridX = (blockX / SIZE) + dir;
    let gridY = blockY / SIZE;
    
    for (let r = 0; r < block.length; r++) 
    {
        for (let c = 0; c < block[r].length; c++)
        {
            if (block[r][c] > 0)
            {
                let targetX = gridX + c;
                let targetY = gridY + r;

                if (targetX < 0 || targetX >= COLS)
                {
                    return true;
                }

                if (board[targetY] !== undefined && board[targetY][targetX] > 0)
                {
                    return true;
                }
            }
        }
    }
    return false;
}

function CheckLine()
{
    for(let i = ROWS - 1; i >= 0; i--)
    {
        let IsRowFull = board[i].every(cell => cell > 0);
        if (IsRowFull)
        {
            board.splice(i, 1);
            let newEmptyRow = Array(COLS).fill(0);
            board.unshift(newEmptyRow);
            ctx.clearRect(0, i * SIZE, canvas.width, SIZE);
            Render();
            i++;                        
        }
    }
}

function Render()
{
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < ROWS; i++)
  {
    for (let j = 0; j < COLS; j++)
    {
        if (board[i][j] > 0)
        {
            ctx.fillStyle = colors[board[i][j]-1]
            ctx.fillRect(j * SIZE, i * SIZE, SIZE, SIZE);
        }
    }
  }
  if (MyPiece) 
  {
    for (let i = 0; i < MyPiece.length; i++) 
    {
        for (let j = 0; j < MyPiece[i].length; j++) 
        {
            if (MyPiece[i][j] > 0)
            {
                ctx.fillStyle = colors[MyPiece[i][j] - 1];
                ctx.fillRect(j * SIZE + MyX, i * SIZE + MyY, SIZE, SIZE);
            }
        }
    }
  }  
}
 
function GameOver() 
{
    IsGameOver = true;
    clearInterval(GameInterval);
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = 'white';
    ctx.font = '40px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
}

document.addEventListener('keydown', function(event)
{
    if (IsGameOver)
        return;

    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) 
    {
        event.preventDefault();
    }    
    if (event.code === 'KeyE')
    {
        RotateR(MyPiece)
        let isCollision = CheckMove(MyPiece, MyX, MyY, 0); 
        if (isCollision)
        {
            RotateL(MyPiece); 
        }                
    }
    if (event.code === 'KeyQ')
    {
        RotateL(MyPiece)
        let isCollision = CheckMove(MyPiece, MyX, MyY, 0); 
        if (isCollision)
        {
            RotateR(MyPiece); 
        }                
    }
    if (event.code === 'ArrowLeft')
    {
        if (!CheckMove(MyPiece, MyX, MyY, -1))
        {
            ClearBlock(MyPiece, MyX, MyY);
            MyX -= SIZE;
            DrawBlock(MyPiece, MyX, MyY);
        }
    }
    if (event.code === 'ArrowRight')
    {
        if (!CheckMove(MyPiece, MyX, MyY, 1))
        {
            ClearBlock(MyPiece, MyX, MyY);
            MyX += SIZE;
            DrawBlock(MyPiece, MyX, MyY);
        }
    }
    if (event.code === 'KeyW')
    {
        if (!CheckFall(MyPiece, MyX, MyY))
        {
            ClearBlock(MyPiece, MyX, MyY);
            MyY += SIZE;
            DrawBlock(MyPiece, MyX, MyY);
        }
    }
    if (event.code === 'Space') 
        {
        while (!CheckFall(MyPiece, MyX, MyY)) 
        {
            MyY += SIZE;
        }

        FreezeBlock(MyPiece, MyX, MyY);
        //DrawBlock(MyPiece, MyX, MyY);
        CheckLine();
        MyPiece = GetRandomPiece();
        MyX = 4 * SIZE;
        MyY = -SIZE;

        if (CheckMove(MyPiece, MyX, MyY, 0))
        {
            Render()
            GameOver();
            return;
        }
    }
    Render()
});
 
MyPiece = GetRandomPiece();
MyX = 4 * SIZE;
MyY = -SIZE;

GameInterval = setInterval(() =>
    {
        //ClearBlock(MyPiece, MyX, MyY)

        if (CheckFall(MyPiece, MyX, MyY))
        {
            FreezeBlock(MyPiece, MyX, MyY)
            CheckLine()
            MyPiece = GetRandomPiece();
            MyX = 4 * SIZE;
            MyY = -SIZE;

            if (CheckMove(MyPiece, MyX, MyY, 0))
            {
                Render()
                GameOver()
                return;
            }
        }
        else
        {
            MyY += SIZE;
        }
        Render()
    }, 500);
