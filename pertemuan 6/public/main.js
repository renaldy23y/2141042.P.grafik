var canvas = document.getElementById('canvas');
var gl = canvas.getContext('webgl');

// Cek browser
if (!gl) { 
    console.log('Browser tidak mendukung WebGL'); 
} else { 
    console.log('Browser mendukung WebGL.'); 
}

const canvasWidth = 650;
const canvasHeight = 650;

canvas.width = canvasWidth;
canvas.height = canvasHeight;

gl.viewport(0, 0, canvas.width, canvas.height);

// Warna canvas 
gl.clearColor(0.4343, 0.2422, 0.3343, 1.0); 
gl.clear(gl.COLOR_BUFFER_BIT);

// Vertex shader source 
var vertexShaderSource = `
    attribute vec2 a_position;
    uniform float u_rotationAngle; // Menambahkan uniform untuk sudut rotasi
    void main() {
        // Membuat matriks rotasi
        float c = cos(u_rotationAngle);
        float s = sin(u_rotationAngle);
        mat2 rotationMatrix = mat2(c, -s, s, c);
        
        // Mengalikan posisi dengan matriks rotasi
        vec2 rotatedPosition = rotationMatrix * a_position;
        
        gl_Position = vec4(rotatedPosition, 0.0, 1.0);
    }
`;

// Fragment shader source 
var fragmentShaderSource = `
    precision mediump float; 
    void main() { 
        gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
    }
`;

// Buat vertex shader 
var vShader = gl.createShader(gl.VERTEX_SHADER); 
gl.shaderSource(vShader, vertexShaderSource); 
gl.compileShader(vShader);

// Buat fragment shader 
var fShader = gl.createShader(gl.FRAGMENT_SHADER); 
gl.shaderSource(fShader, fragmentShaderSource); 
gl.compileShader(fShader);

// Program shader
var shaderProgram = gl.createProgram(); 
gl.attachShader(shaderProgram, vShader); 
gl.attachShader(shaderProgram, fShader); 
gl.linkProgram(shaderProgram); 
gl.useProgram(shaderProgram);

// Variabel untuk menyimpan sudut rotasi 
var rotationAngleClockwise = 0;
var rotationAngleCounterClockwise = 0;

function drawBlades(rotationAngle, centerX) {
    // Jumlah bilah baling-baling
    var numBlades = 4;
    var angleIncrement = (2 * Math.PI) / numBlades;

    for (var i = 0; i < numBlades; i++) {
        var angle = rotationAngle + i * angleIncrement;

        // Titik pusat baling-baling 
        var center = [centerX, 0.0]; // Mengatur pusat objek secara horizontal

        // Titik-titik untuk segitiga
        var p1 = [Math.cos(angle) * 0.3 + center[0], Math.sin(angle) * 0.3 + center[1]];
        var p2 = [Math.cos(angle + angleIncrement) * 0.3 + center[0], Math.sin(angle + angleIncrement) * 0.3 + center[1]];
        var p3 = [center[0], center[1]];

        // Menggabungkan titik-titik untuk membentuk segitiga
        var vertices = [center[0], center[1], p1[0], p1[1], p2[0], p2[1], p3[0], p3[1]];

        // Buffer segitiga
        var vBuffer = gl.createBuffer(); 
        gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

        // Location
        var positionLocation = gl.getAttribLocation(shaderProgram, 'a_position'); 
        gl.enableVertexAttribArray(positionLocation);

        // Gambar segitiga.
        gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0); 
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); // Menggunakan TRIANGLE_STRIP untuk menggambar segitiga
    }
}

function updateRotations() { 
    rotationAngleClockwise += 0.01; // Atur kecepatan rotasi searah jarum jam di sini
    rotationAngleCounterClockwise -= 0.01; // Atur kecepatan rotasi berlawanan jarum jam di sini
}

function animateBlades() { 
    gl.clear(gl.COLOR_BUFFER_BIT);
    updateRotations();
    
    // Menggambar objek yang berputar searah jarum jam di sebelah kiri
    drawBlades(rotationAngleClockwise, -0.5); 
    
    // Menggambar objek yang berputar berlawanan jarum jam di sebelah kanan
    drawBlades(rotationAngleCounterClockwise, 0.55); 
    
    requestAnimationFrame(animateBlades);
}

animateBlades();