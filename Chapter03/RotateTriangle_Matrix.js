// RotateTriangle_Matrix.js

// 顶点着色器程序
var VSHADER_SOURCE =
    // x' = xcosb - ysinb
    // y' = xsinb + ycosb
    // z' = z
    'attribute vec4 a_Position;\n' +
    'uniform mat4 u_xformMatrix;\n' +
    'uniform mat4 u_scaleMatrix;\n' +
    'void main() {\n' +
    'gl_Position = u_scaleMatrix * u_xformMatrix * a_Position;\n' + //设置坐标
    // 'gl_PointSize = 10.0;\n' + //设置尺寸
    '}\n';

//片元着色器
var FSHADER_SOURCE =
    'void main() {\n' +
    'gl_FragColor = vec4(1.0,0.0,0.0,1.0);\n' + //设置颜色
    '}\n';

var Tx = 0.0, Ty = 0.0, Tz = 0.0;
var Sx = 1.0, Sy = 1.0, Sz = 1.0;
var ANGLE = 0;
var isPress = false;
var gl;

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

    canvas.onmousedown = function (ev) {
        isPress = true;
        onMouseDown(ev, canvas);
    }

    canvas.onmousemove = function (ev) {
        onMouseMove(ev, canvas);
    }

    canvas.onmouseup = function () {
        isPress = false;
    }

    canvas.onmouseout = function () {
        isPress = false;
    }

    canvas.addEventListener('wheel', onWheel, false);

    updateFrame();

    // 设置背景色
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    gl.clear(gl.COLOR_BUFFER_BIT);

    //画点
    // gl.drawArrays(gl.POINTS, 0, n);
    // gl.drawArrays(gl.LINES, 0, n);
    // gl.drawArrays(gl.LINE_STRIP, 0, n);
    // gl.drawArrays(gl.LINE_LOOP, 0, n);
    gl.drawArrays(gl.TRIANGLES, 0, n);
    // gl.drawArrays(gl.TRIANGLE_STRIP, 0, n);
    // gl.drawArrays(gl.TRIANGLE_FAN, 0, n);
}

var points = [0.5, 0.5, -0.5, -0.5, 0.5, -0.5];

function onMouseDown(ev, canvas,) {
    ANGLE += 10;
    console.log(ANGLE);

    // var x = ev.clientX;
    // var y = ev.clientY;
    // var rect = ev.target.getBoundingClientRect();

    // points.push(((x - rect.left) - canvas.width / 2) / (canvas.width / 2));
    // points.push((canvas.height / 2 - (y - rect.top)) / (canvas.height / 2));

    // var n = changeVertexData(gl);

    // // 设置背景色
    // gl.clearColor(0.0, 0.0, 0.0, 1.0);

    // gl.clear(gl.COLOR_BUFFER_BIT);

    // gl.drawArrays(gl.LINE_STRIP, 0, n);
}

function onMouseMove(ev, canvas) {
    if (!isPress) return;
    var x = ev.clientX;
    var y = ev.clientY;
    var rect = ev.target.getBoundingClientRect();

    Tx = ((x - rect.left) - canvas.width / 2) / (canvas.width / 2);
    Ty = (canvas.height / 2 - (y - rect.top)) / (canvas.height / 2);

    updateFrame();
}

function updateFrame() {
    var radian = Math.PI * ANGLE / 180.0;// 弧度
    var cosB = Math.cos(radian);
    var sinB = Math.sin(radian);

    var xformMatrix = new Float32Array([
        cosB, sinB, 0.0, 0.0,
        -sinB, cosB, 0.0, 0.0,
        0.0, 0.0, 1.0, 0.0,
        Tx, Ty, Tz, 1.0
    ]);

    var scaleMatrix = new Float32Array([
        Sx, 0.0, 0.0, 0.0,
        0.0, Sy, 0.0, 0.0,
        0.0, 0.0, Sz, 0.0,
        0.0, 0.0, 0.0, 1.0
    ]);
    // console.log(xformMatrix);

    var u_xformMatrix = gl.getUniformLocation(gl.program, 'u_xformMatrix');
    var u_scaleMatrix = gl.getUniformLocation(gl.program, 'u_scaleMatrix');

    gl.uniformMatrix4fv(u_scaleMatrix, false, scaleMatrix);
    gl.uniformMatrix4fv(u_xformMatrix, false, xformMatrix);

    // 设置背景色
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.drawArrays(gl.TRIANGLES, 0, points.length / 2);
}

function initVertexBuffers() {
    var vertices = new Float32Array(points);

    var n = vertices.length / 2;
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

function changeVertexData() {
    var vertices = new Float32Array(points);
    var n = vertices.length / 2;
    console.log(vertices);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
    return n;
}

function onWheel(event) {
    var delta = 0;
    if (!event) event = window.event;
    if (event.wheelDelta) { // IE、chrome浏览器使用的是wheelDelta，并且值为“正负120”
        delta = event.wheelDelta / 120;
        if (window.opera) delta = -delta; // 因为IE、chrome等向下滚动是负值，FF是正值，为了处理一致性，在此取反处理
    } else if (event.detail) { // FF浏览器使用的是detail,其值为“正负3”
        delta = -event.detail / 3;
    }
    if (delta)
        handle(delta);
}
//上下滚动时的具体处理函数
function handle(delta) {
    if (delta < 0) { //向下滚动
        Sx -= 0.1;
        Sy -= 0.1;
        Sz -= 0.1;
    } else { //向上滚动
        Sx += 0.1;
        Sy += 0.1;
        Sz += 0.1;
    }
    updateFrame();
}