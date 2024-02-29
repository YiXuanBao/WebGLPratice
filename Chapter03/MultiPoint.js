// MultiPoint.js

// 顶点着色器程序
var VSHADER_SOURCE =
    'attribute vec4 a_Position;\n' +
    'uniform vec4 u_Transition;\n' +
    'void main() {\n' +
    'gl_Position = a_Position + u_Transition;\n' + //设置坐标
    // 'gl_PointSize = 10.0;\n' + //设置尺寸
    '}\n';

//片元着色器
var FSHADER_SOURCE =
    'void main() {\n' +
    'gl_FragColor = vec4(1.0,0.0,0.0,1.0);\n' + //设置颜色
    '}\n';

var Tx = 0.5, Ty = 0.5, Tz = 0.0;

function main() {
    // 获取canvas
    var canvas = document.getElementById('webgl');

    var gl = getWebGLContext(canvas);
    if (!gl) {
        console.log("获取webgl context失败");
        return;
    }

    //初始化着色器
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('初始化shader失败');
        return;
    }

    var n = initVertexBuffers(gl);
    if (n < 0) {
        console.log('创建顶点缓存失败');
        return;
    }

    var u_Transition = gl.getUniformLocation(gl.program, 'u_Transition');

    gl.uniform4f(u_Transition, Tx, Ty, Tz, 0.0);

    // 设置背景色
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    gl.clear(gl.COLOR_BUFFER_BIT);

    //画点
    // gl.drawArrays(gl.POINTS, 0, n);
    // gl.drawArrays(gl.LINES, 0, n);
    // gl.drawArrays(gl.LINE_STRIP, 0, n);
    // gl.drawArrays(gl.LINE_LOOP, 0, n);
    // gl.drawArrays(gl.TRIANGLES, 0, n);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, n);
    // gl.drawArrays(gl.TRIANGLE_FAN, 0, n);
}

function initVertexBuffers(gl) {
    var vertices = new Float32Array([
        -0.5, 0.5,
        -0.5, -0.5,
        0.5, -0.5,
        0.5, 0.5
    ])

    var n = vertices.length / 2;
    console.log(n);
    var vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
        console.log('创建gl缓冲区失败');
        return -1;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');

    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);

    gl.enableVertexAttribArray(a_Position);

    return n;
}