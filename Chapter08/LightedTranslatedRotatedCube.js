// LightedTranslatedRotatedCube.js

var VSHADER_SOURCE =
    'attribute vec4 a_Position;\n' +
    'attribute vec4 a_Color;\n' +
    'attribute vec4 a_Normal;\n' + //法线
    'uniform vec3 u_AmbientLight;\n' +
    'uniform mat4 u_MvpMatrix;\n' +
    'uniform mat4 u_NormalMatrix;\n' +
    'uniform vec3 u_LightColor;\n' + // 光线颜色
    'uniform vec3 u_LightDirection;\n' + // 光线方向
    'varying vec4 v_Color;\n' +
    'void main(){ \n' +
    // 模型变换
    '   gl_Position = u_MvpMatrix * a_Position;\n' +
    // 法线
    '   vec3 normal = normalize(vec3(u_NormalMatrix * a_Normal));\n' +
    // cos₰
    '   float nDotL = max(dot(u_LightDirection, normal), 0.0);\n' +
    // 漫反射光
    '   vec3 diffuse = u_LightColor * vec3(a_Color) * nDotL;\n' +
    // 环境光
    '   vec3 ambient = u_AmbientLight * a_Color.rgb;\n' +
    '   v_Color = vec4(ambient + diffuse, a_Color.a);\n' +
    // '   v_Color = a_Color;\n' +
    '}\n';

var FSHADER_SOURCE =
    '#ifdef GL_ES\n' +
    '   precision mediump float;\n' +
    '#endif\n' +
    'varying vec4 v_Color;\n' +
    'void main(){\n' +
    '   gl_FragColor = v_Color;\n' +
    '}\n';


var ANGLE_STEP = 40.0; // 每秒旋转角度
var deltaAngle = 90.0;
var g_last = Date.now(); // 记录最后一次刷新时间
var lastChangeRotateTime = 0;
var rotateChangeInterval = 10000;
var frame = 60; // 帧率
var interval = 1000.0 / frame; // 每帧间隔
var axisX = 1; // -1 ~ 1
var axisY = 1; // -1 ~ 1
var axisZ = 1; // -1 ~ 1

function main() {
    // Retrieve <canvas> element
    var canvas = document.getElementById('webgl');

    // Get the rendering context for WebGL
    var gl = getWebGLContext(canvas);
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }

    // Initialize shaders
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to intialize shaders.');
        return;
    }

    // Set the vertex coordinates, the color and the normal
    var n = initVertexBuffers(gl);
    if (n < 0) {
        console.log('Failed to set the vertex information');
        return;
    }

    // Set the clear color and enable the depth test
    gl.clearColor(0, 0, 0, 1);
    gl.enable(gl.DEPTH_TEST);

    // Get the storage locations of uniform variables and so on
    var u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix');
    var u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
    var u_LightColor = gl.getUniformLocation(gl.program, 'u_LightColor');
    var u_LightDirection = gl.getUniformLocation(gl.program, 'u_LightDirection');
    var u_AmbientLight = gl.getUniformLocation(gl.program, 'u_AmbientLight');
    if (!u_MvpMatrix || !u_LightColor || !u_LightDirection || !u_NormalMatrix || !u_AmbientLight) {
        console.log('Failed to get the storage location');
        return;
    }

    // Set the light color (white)
    gl.uniform3f(u_LightColor, 1.0, 1.0, 1.0);
    gl.uniform3f(u_AmbientLight, 0.2, 0.2, 0.2);
    // Set the light direction (in the world coordinate)
    var lightDirection = new Vector3([0.5, 3.0, 4.0]);
    lightDirection.normalize();     // Normalize
    gl.uniform3fv(u_LightDirection, lightDirection.elements);

    // Calculate the view projection matrix
    var mvMatrix = new MyMatrix4();    // Model view projection matrix
    mvMatrix.setPerspective(30, canvas.width / canvas.height, 1, 100);
    mvMatrix.lookAt(0, 5, 7, 0, 0, 0, 0, 1, 0);
    // Pass the model view projection matrix to the variable u_MvpMatrix

    var mvpMatrix = new MyMatrix4();
    var modelMatrix = new MyMatrix4();
    var normalMatrix = new MyMatrix4();

    var tick = function () {
        var now = Date.now();
        var deltaTime = now - g_last; //毫秒

        // rotateChangeInterval秒改变一次旋转轴
        if (now >= lastChangeRotateTime) {
            lastChangeRotateTime = now + rotateChangeInterval;
            axisX = Math.random() * 2 - 1; // -1 ~ 1
            axisY = Math.random() * 2 - 1; // -1 ~ 1
            axisZ = Math.random() * 2 - 1; // -1 ~ 1
            console.log('旋转');
        }

        if (deltaTime >= interval) {
            g_last = now;// 记录上次刷新时间
            deltaAngle = animateRotate(deltaTime);
            //console.log(deltaTime);
            updateFrame(gl, n, deltaAngle, mvpMatrix, u_MvpMatrix, mvMatrix, modelMatrix, normalMatrix, u_NormalMatrix);
            // console.log('draw' + Date.now());
        }
        requestAnimationFrame(tick);// 请求浏览器调用tick
    }
    tick();
}

function updateFrame(gl, n, deltaAngle, mvpMatrix, u_MvpMatrix, mvMatrix, modelMatrix, normalMatrix, u_NormalMatrix) {
    modelMatrix.rotate(deltaAngle, axisX, axisY, axisZ);
    mvpMatrix.set(mvMatrix).multiply(modelMatrix);
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);

    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

    // Clear color and depth buffer
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);   // Draw the cube
}

function animateRotate(deltaTime) {
    var deltaAngle = (ANGLE_STEP * deltaTime) / 1000.0;
    return deltaAngle;
    // var newAngle = angle + (angle_Step * deltaTime) / 1000.0;
    // if (newAngle > 360)
    // angle_Step = -ANGLE_STEP;
    // else if(newAngle < 0)
    //     angle_Step = ANGLE_STEP;
    // return newAngle;
}

function initVertexBuffers(gl) {
    // Create a cube
    //    v6----- v5
    //   /|      /|
    //  v1------v0|
    //  | |     | |
    //  | |v7---|-|v4
    //  |/      |/
    //  v2------v3
    var vertices = new Float32Array([   // Coordinates
        1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, // v0-v1-v2-v3 front
        1.0, 1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0, // v0-v3-v4-v5 right
        1.0, 1.0, 1.0, 1.0, 1.0, -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, // v0-v5-v6-v1 up
        -1.0, 1.0, 1.0, -1.0, 1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, 1.0, // v1-v6-v7-v2 left
        -1.0, -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, -1.0, -1.0, 1.0, // v7-v4-v3-v2 down
        1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0  // v4-v7-v6-v5 back
    ]);


    var colors = new Float32Array([    // Colors
        0, 0, 0.6, 0, 0, 0.4, 0.1, 0, 0.8, 0.5, 0, 0,     // v0-v1-v2-v3 front
        0.1, 0, 0, 0, 0.8, 0, 0.1, 0.7, 0, 0.4, 0, 0,     // v0-v3-v4-v5 right
        0.1, 0, 0, 0.8, 0.4, 0.9, 0, 0, 0.2, 0.6, 0, 0,     // v0-v5-v6-v1 up
        0.2, 0, 0.5, 0.3, 0, 0.8, 0, 0.4, 0, 0.9, 0, 0,     // v1-v6-v7-v2 left
        0, 0.8, 0.7, 0.6, 0.5, 0, 0.4, 0, 0.2, 0.1, 0, 0,     // v7-v4-v3-v2 down
        0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0, 0.6, 0.3　    // v4-v7-v6-v5 back
    ]);


    var normals = new Float32Array([    // Normal
        0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0,  // v0-v1-v2-v3 front
        1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0,  // v0-v3-v4-v5 right
        0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0,  // v0-v5-v6-v1 up
        -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0,  // v1-v6-v7-v2 left
        0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0,  // v7-v4-v3-v2 down
        0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0   // v4-v7-v6-v5 back
    ]);


    // Indices of the vertices
    var indices = new Uint8Array([
        0, 1, 2, 0, 2, 3,    // front
        4, 5, 6, 4, 6, 7,    // right
        8, 9, 10, 8, 10, 11,    // up
        12, 13, 14, 12, 14, 15,    // left
        16, 17, 18, 16, 18, 19,    // down
        20, 21, 22, 20, 22, 23     // back
    ]);


    // Write the vertex property to buffers (coordinates, colors and normals)
    if (!initArrayBuffer(gl, 'a_Position', vertices, 3, gl.FLOAT)) return -1;
    if (!initArrayBuffer(gl, 'a_Color', colors, 3, gl.FLOAT)) return -1;
    if (!initArrayBuffer(gl, 'a_Normal', normals, 3, gl.FLOAT)) return -1;

    // Write the indices to the buffer object
    var indexBuffer = gl.createBuffer();
    if (!indexBuffer) {
        console.log('Failed to create the buffer object');
        return false;
    }

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    return indices.length;
}

function initArrayBuffer(gl, attribute, data, num, type) {
    // Create a buffer object
    var buffer = gl.createBuffer();
    if (!buffer) {
        console.log('Failed to create the buffer object');
        return false;
    }
    // Write date into the buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    // Assign the buffer object to the attribute variable
    var a_attribute = gl.getAttribLocation(gl.program, attribute);
    if (a_attribute < 0) {
        console.log('Failed to get the storage location of ' + attribute);
        return false;
    }
    gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
    // Enable the assignment of the buffer object to the attribute variable
    gl.enableVertexAttribArray(a_attribute);

    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    return true;
}