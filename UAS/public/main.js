var canvas = document.getElementById("canvas");
var gl = canvas.getContext("webgl");

if (!gl) {
    console.log("Browser tidak mendukung WebGL");
} else {
    console.log("Browser mendukung WebGL.");
}

const canvasWidth = 800;
const canvasHeight = 700;

canvas.width = canvasWidth;
canvas.height = canvasHeight;

gl.viewport(0, 0, canvas.width, canvas.height);

gl.clearColor(1.0, 0.5, 0.0, 1.0);
gl.clear(gl.COLOR_BUFFER_BIT);

var vertexShaderSource = `
    attribute vec2 a_position;
    uniform vec2 u_resolution;
    
    void main() {
        vec2 zeroToOne = a_position / u_resolution;
        vec2 zeroToTwo = zeroToOne * 2.0;
        vec2 clipSpace = zeroToTwo - 1.0;
        gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
    }
`;

var fragmentShaderSource = `
    precision mediump float;
    uniform vec4 u_color;
    void main() { 
        gl_FragColor = u_color;
    }
`;

var vShader = gl.createShader(gl.VERTEX_SHADER);
gl.shaderSource(vShader, vertexShaderSource);
gl.compileShader(vShader);

var fShader = gl.createShader(gl.FRAGMENT_SHADER);
gl.shaderSource(fShader, fragmentShaderSource);
gl.compileShader(fShader);

var shaderProgram = gl.createProgram();
gl.attachShader(shaderProgram, vShader);
gl.attachShader(shaderProgram, fShader);
gl.linkProgram(shaderProgram);
gl.useProgram(shaderProgram);

var resolutionLocation = gl.getUniformLocation(shaderProgram, "u_resolution");
gl.uniform2f(resolutionLocation, canvasWidth, canvasHeight);
var colorLocation = gl.getUniformLocation(shaderProgram, "u_color");

function createBuffer(vertices) {
    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
    return buffer;
}

function drawObject(buffer, color, vertexCount) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    var positionLocation = gl.getAttribLocation(shaderProgram, "a_position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    gl.uniform4fv(colorLocation, color);
    gl.drawArrays(gl.TRIANGLES, 0, vertexCount);
}

var paddleWidth = 100;
var paddleHeight = 20;
var paddleX = (canvasWidth - paddleWidth) / 2;
var paddleBuffer = createBuffer([
    paddleX, canvasHeight - paddleHeight,
    paddleX + paddleWidth, canvasHeight - paddleHeight,
    paddleX, canvasHeight,
    paddleX, canvasHeight,
    paddleX + paddleWidth, canvasHeight - paddleHeight,
    paddleX + paddleWidth, canvasHeight
]);

var ballRadius = 10;
var ballX = canvasWidth / 2;
var ballY = canvasHeight - paddleHeight - ballRadius;
var ballSpeedX = 2;
var ballSpeedY = -2;
var ballBuffer;

function createBallBuffer(x, y, radius) {
    var vertices = [];
    for (var i = 0; i <= 360; i += 10) {
        var angle = i * Math.PI / 180;
        vertices.push(x, y);
        vertices.push(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius);
        vertices.push(x + Math.cos(angle + 10 * Math.PI / 180) * radius, y + Math.sin(angle + 10 * Math.PI / 180) * radius);
    }
    return createBuffer(vertices);
}
ballBuffer = createBallBuffer(ballX, ballY, ballRadius);

var score = 0;
var scoreElement = document.getElementById("score");

var brickRows = 5;
var brickCols = 10;
var brickWidth = canvasWidth / brickCols;
var brickHeight = 20;
var bricks = [];
for (var row = 0; row < brickRows; row++) {
    for (var col = 0; col < brickCols; col++) {
        bricks.push({
            x: col * brickWidth,
            y: row * brickHeight,
            width: brickWidth,
            height: brickHeight,
            color: [Math.random(), Math.random(), Math.random(), 1.0],
            destroyed: false
        });
    }
}

function createBrickBuffer(brick) {
    return createBuffer([
        brick.x, brick.y,
        brick.x + brick.width, brick.y,
        brick.x, brick.y + brick.height,
        brick.x, brick.y + brick.height,
        brick.x + brick.width, brick.y,
        brick.x + brick.width, brick.y + brick.height
    ]);
}

function updateBall(deltaTime) {
    ballX += ballSpeedX * deltaTime * 0.1;
    ballY += ballSpeedY * deltaTime * 0.1;

    if (ballX < ballRadius || ballX > canvasWidth - ballRadius) {
        ballSpeedX = -ballSpeedX;
    }
    if (ballY < ballRadius) {
        ballSpeedY = -ballSpeedY;
    }

    if (ballY > canvasHeight - paddleHeight - ballRadius &&
        ballX > paddleX && ballX < paddleX + paddleWidth) {
        ballSpeedY = -ballSpeedY;
        score++;
        scoreElement.textContent = "Score: " + score;
    }

    for (var i = 0; i < bricks.length; i++) {
        var brick = bricks[i];
        if (!brick.destroyed &&
            ballX > brick.x && ballX < brick.x + brick.width &&
            ballY > brick.y && ballY < brick.y + brick.height) {
            brick.destroyed = true;
            ballSpeedY = -ballSpeedY;
            score += 5;
            scoreElement.textContent = "Score: " + score;
        }
    }

    if (ballY > canvasHeight) {
        ballX = canvasWidth / 2;
        ballY = canvasHeight - paddleHeight - ballRadius;
        ballSpeedX = 2;
        ballSpeedY = -2;
        score = 0;
        scoreElement.textContent = "Score: " + score;

        for (var i = 0; i < bricks.length; i++) {
            bricks[i].destroyed = false;
        }
    }

    ballBuffer = createBallBuffer(ballX, ballY, ballRadius);
}

function drawScene() {
    gl.clear(gl.COLOR_BUFFER_BIT);

    paddleBuffer = createBuffer([
        paddleX, canvasHeight - paddleHeight,
        paddleX + paddleWidth, canvasHeight - paddleHeight,
        paddleX, canvasHeight,
        paddleX, canvasHeight,
        paddleX + paddleWidth, canvasHeight - paddleHeight,
        paddleX + paddleWidth, canvasHeight
    ]);
    drawObject(paddleBuffer, [0.0, 0.0, 0.8, 1.0], 6);

    drawObject(ballBuffer, [0.0, 1.0, 0.0, 1.0], 108);

    for (var i = 0; i < bricks.length; i++) {
        var brick = bricks[i];
        if (!brick.destroyed) {
            var brickBuffer = createBrickBuffer(brick);
            drawObject(brickBuffer, brick.color, 6);
        }
    }
}

var lastTime = 0;

function animate(time) {
    var deltaTime = time - lastTime;
    lastTime = time;

    updateBall(deltaTime);
    drawScene();

    requestAnimationFrame(animate);
}

document.addEventListener('mousemove', function (event) {
    var rect = canvas.getBoundingClientRect();
    var root = document.documentElement;
    var mouseX = event.clientX - rect.left - root.scrollLeft;
    paddleX = mouseX - paddleWidth / 2;
    if (paddleX < 0) {
        paddleX = 0;
    }
    if (paddleX + paddleWidth > canvasWidth) {
        paddleX = canvasWidth - paddleWidth;
    }
});


document.addEventListener('keydown', function (event) {
  if (event.key === 'ArrowLeft'){
    paddleX -= 20;
    if (paddleX < 0){
      paddleX = 0;
    }
  } else if (event.key === 'ArrowRight'){
    paddleX += 20;
    if (paddleX + paddleWidth > canvasWidth){
      paddleX = canvasWidth - paddleWidth;
    }
  }
});




requestAnimationFrame(animate);