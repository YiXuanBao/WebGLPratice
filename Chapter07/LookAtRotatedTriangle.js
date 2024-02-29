// LookAtRotatedTriangle.js

var VSHADER_SOURCE =
    'attribute vec4 a_Position;\n' +
    'attribute vec4 a_Color;\n' +
    'uniform mat4 u_ViewMatrix;\n' +
    'uniform mat4 u_ModelMatrix;\n' +
    'varying vec4 v_Color;\n' +
    'void main(){\n' +
    '   gl_Position = u_ViewMatrix * u_ModelMatrix * a_Position;\n' +
    '   v_Color = a_Color;\n' +
    '}\n';
var FSHADER_SOURCE =
    '#ifdef GL_ES\n' +
    '   #ifdef GL_FRAGMENT_PRECISION_HIGH\n' +
    '       precision highp float;\n' +
    '   #else\n' +
    '       precision mediump float;\n' +
    '   #endif\n' +
    '#endif\n' +
    'varying vec4 v_Color;\n' +
    'void main(){\n' +
    '   gl_FragColor = v_Color;\n' +
    '}\n';

function main() {
    // 获取canvas
    var canvas = document.getElementById('webgl');

    gl = getWebGLContext(canvas);
    if (!gl) {
        console.log("获取webgl context失败");
        return;
    }

    //初始化着色器
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('初始化shader失败');
        return;
    }

    var n = initVertexBuffers();
    if (n < 0) {
        console.log('创建顶点缓存失败');
        return;
    }

    var u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
    var viewMatrix = new Matrix4();
    // var myViewMatrix = new Matrix4();
    viewMatrix.setLookAt(0.20, 0.25, 0.25, 0, 0, 0, 1, 0, 1);
    // myViewMatrix.setLookAt(0.5, 0.5, 0.5, 0, 0, 0, 0, 1, 0);
    // console.log(viewMatrix);
    // console.log(myViewMatrix);
    gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);

    var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    var modelMatrix = new MyMatrix4();
    
    
    gl.drawArrays(gl.TRIANGLES, 0, n);
}


function initVertexBuffers() {
    var vertices = new Float32Array([
        // Vertex coordinates and color(RGBA)
        0.0, 0.5, -0.4, 0.4, 1.0, 0.4, // The back green one
        -0.5, -0.5, -0.4, 0.4, 1.0, 0.4,
        0.5, -0.5, -0.4, 1.0, 0.4, 0.4,

        0.5, 0.4, -0.2, 1.0, 0.4, 0.4, // The middle yellow one
        -0.5, 0.4, -0.2, 1.0, 1.0, 0.4,
        0.0, -0.6, -0.2, 1.0, 1.0, 0.4,

        0.0, 0.5, 0.0, 0.4, 0.4, 1.0,  // The front blue one 
        -0.5, -0.5, 0.0, 0.4, 0.4, 1.0,
        0.5, -0.5, 0.0, 1.0, 0.4, 0.4,
    ]);

    var n = 9;

    var vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
        console.log('创建gl缓冲区失败');
        return -1;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    var FSIZE = vertices.BYTES_PER_ELEMENT;

    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * 6, 0);
    gl.enableVertexAttribArray(a_Position);

    var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
    gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE * 6, FSIZE * 3);
    gl.enableVertexAttribArray(a_Color);

    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    return n;
}

