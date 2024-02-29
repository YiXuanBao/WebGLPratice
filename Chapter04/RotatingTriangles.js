// RotatingTriangles.js

//顶点着色器
var VSHADER_SOURCE =
    'attribute vec4 a_Position;\n' +
    'uniform mat4 u_ModelMatrix;\n' +
    'void main(){\n' +
    '   gl_Position = u_ModelMatrix * a_Position;\n' +
    '}\n';

//片元着色器
var FSHADER_SOURCE =
    'void main(){\n' +
    '   gl_FragColor = vec4(1.0,0.0,0.0,1.0);\n' + //设置颜色
    '}\n';

var ANGLE_STEP = 45.0; // 每秒旋转角度
var XSTEP = 0.05;
var YSTEP = 0.03;
var xStep = XSTEP; // x轴每秒移动距离
var yStep = YSTEP; // y轴每秒移动距离
var angle_Step = ANGLE_STEP;
var g_last = Date.now(); // 记录最后一次刷新时间
var frame = 60; // 帧率
var interval = 1000.0 / frame; // 每帧间隔

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

    // 设置背景色
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');

    var currentAngle = 0.0;
    var modelMatrix = new Matrix4();
    var moveVec = [0.0, 0.0];

    var tick = function () {
        var now = Date.now();
        var deltaTime = now - g_last; //毫秒

        if (deltaTime >= interval) {
            g_last = now;// 记录上次刷新时间

            moveVec = animateMove(moveVec, deltaTime);
            currentAngle = animateRotate(currentAngle, deltaTime);
            //console.log(deltaTime);
            updateFrame(gl, n, moveVec, currentAngle, modelMatrix, u_ModelMatrix);
            // console.log('draw' + Date.now());
        }
        requestAnimationFrame(tick);// 请求浏览器调用tick
    }
    tick();
}

// 初始化顶点
function initVertexBuffers(gl) {
    var vertices = new Float32Array([
        -0.5, 0.5,
        -0.5, -0.5,
        0.5, -0.5
    ])

    var n = vertices.length / 2;
    //  console.log(n);
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

// 绘制帧
function updateFrame(gl, n, moveVec, currentAngle, modelMatrix, u_ModelMatrix) {
    modelMatrix.setRotate(currentAngle%360, 1, 1, 1);
    modelMatrix.translate(moveVec[0], moveVec[1], 0);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.drawArrays(gl.TRIANGLES, 0, n);
}

// 动画变动
function animateMove(moveVec, deltaTime) {
    moveVec[0] = moveVec[0] + xStep * deltaTime / 1000;
    moveVec[1] = moveVec[1] + yStep * deltaTime / 1000;
    if (moveVec[0] > 1){
        xStep = -XSTEP;
        moveVec[0] = 1.0;
    }
    else if(moveVec[0] < -1){
        xStep = XSTEP;
        moveVec[0] = -1.0;
    }

    if (moveVec[1] > 1){
        yStep = -YSTEP;
        moveVec[1] = 1.0;
    }
    else if(moveVec[1] < -1){
        yStep = YSTEP;
        moveVec[1] = -1.0;
    }
    console.log(moveVec);
    return moveVec;
}

function animateRotate(angle, deltaTime) {
    var newAngle = angle + (angle_Step * deltaTime) / 1000.0;
    if (newAngle > 360)
    angle_Step = -ANGLE_STEP;
    else if(newAngle < 0)
        angle_Step = ANGLE_STEP;
    return newAngle;
}