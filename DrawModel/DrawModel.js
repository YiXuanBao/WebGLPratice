// DrawModel.js

var VSHADER_SOURCE =
    'attribute vec4 a_Position;\n' +
    'attribute vec4 a_Color;\n' +
    'attribute vec4 a_Normal;\n' + //法线
    'uniform mat4 u_MvpMatrix;\n' +
    'uniform mat4 u_NormalMatrix;\n' +
    'uniform vec3 u_AmbientLight;\n' +
    'uniform vec3 u_LightColor;\n' + // 光线颜色
    'uniform vec3 u_LightDir;\n' + // 光线方向
    'varying vec4 v_Color;\n' +
    'void main(){ \n' +
    // 模型变换
    '   gl_Position = u_MvpMatrix * a_Position;\n' +
    '   vec3 normal = normalize(vec3(u_NormalMatrix * a_Normal));\n' +
    // cos₰
    '   float nDotL = max(dot(u_LightDir, normal), 0.0);\n' +
    // 漫反射光
    '   vec3 diffuse = u_LightColor * a_Color.rgb * nDotL;\n' +
    // 环境光
    '   vec3 ambient = u_AmbientLight * a_Color.rgb;\n' +
    '   v_Color = vec4(ambient + diffuse, a_Color.a);\n' +
    '}\n';

var FSHADER_SOURCE =
    '#ifdef GL_ES\n' +
    '   precision mediump float;\n' +
    '#endif\n' +
    'varying vec4 v_Color;\n' +
    'void main(){\n' +
    '   gl_FragColor = v_Color;\n' +
    '}\n';

var eyePos = [0.0, 500.0, 200.0];
var cameraStep = 10;

function main() {
    var canvas = document.getElementById('webgl');

    var gl = getWebGLContext(canvas);
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }

    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to intialize shaders.');
        return;
    }

    gl.clearColor(0.2, 0.2, 0.2, 1.0);
    gl.enable(gl.DEPTH_TEST);

    var program = gl.program;
    program.a_Position = gl.getAttribLocation(program, 'a_Position');
    program.a_Normal = gl.getAttribLocation(program, 'a_Normal');
    program.a_Color = gl.getAttribLocation(program, 'a_Color');
    program.u_MvpMatrix = gl.getUniformLocation(program, 'u_MvpMatrix');
    program.u_NormalMatrix = gl.getUniformLocation(program, 'u_NormalMatrix');
    program.u_AmbientLight = gl.getUniformLocation(program, 'u_AmbientLight');
    program.u_LightColor = gl.getUniformLocation(program, 'u_LightColor');
    program.u_LightDir = gl.getUniformLocation(program, 'u_LightDir');

    if (program.a_Position < 0 || program.a_Normal < 0 || program.a_Color < 0 ||
        !program.u_MvpMatrix || !program.u_NormalMatrix || !program.u_AmbientLight ||
        !program.u_LightColor || !program.u_LightDir) {
        console.log('attribute, uniform获取失败');
        return;
    }

    gl.uniform3f(program.u_AmbientLight, 0.2, 0.2, 0.2);
    gl.uniform3f(program.u_LightColor, 1.0, 1.0, 1.0);
    gl.uniform3f(program.u_LightDir, -0.35, 0.35, 0.87);

    var model = initVertexBuffers(gl, program);
    if (!model) {
        console.log('Failed to set the vertex information');
        return;
    }

    var viewProjMatrix = new Matrix4();
    viewProjMatrix.setPerspective(30.0, canvas.width / canvas.height, 1.0, 5000.0);
    viewProjMatrix.lookAt(eyePos[0], eyePos[1], eyePos[2], 0.0, 0.0, 0.0, 0.0, 1.0, 0.0);

    // Start reading the OBJ file
    // readOBJText(null, 'cube.obj', gl, model, 60, true);

    var currentAngle = 0.0; // Current rotation angle [degree]
    var tick = function () {   // Start drawing
        currentAngle = animate(currentAngle); // Update current rotation angle
        draw(gl, gl.program, currentAngle, viewProjMatrix, model);
        requestAnimationFrame(tick, canvas);
    };
    tick();

    document.getElementById('fileSelect')
        .addEventListener('change', function (e) {
            if (e.target.files.length == 0) {
                console.log('请选择文件');
                return;
            }
            const reader = new FileReader();
            reader.onload = function (content) {
                readOBJText(reader.result, e.target.files[0].name, gl, model, 10, true);
            };
            reader.readAsText(e.target.files[0]);
        });

    document.addEventListener('keydown', function (e) {
        // alert(e.keyCode);
        switch (e.keyCode) {
            case 40:
                cameraBack();
                break;
            case 38:
                cameraForward();
                break;
            default:
                return;
        }
        viewProjMatrix.setPerspective(30.0, canvas.width / canvas.height, 1.0, 5000.0);
        viewProjMatrix.lookAt(eyePos[0], eyePos[1], eyePos[2], 0.0, 0.0, 0.0, 0.0, 1.0, 0.0);
    });
}

function cameraBack() {
    var dir = new Vector3(eyePos).normalize();
    for (var i = 0; i < eyePos.length; i++) {
        eyePos[i] += dir.elements[i] * cameraStep;
    }
}

function cameraForward() {
    var dir = new Vector3(eyePos).normalize();
    for (var i = 0; i < eyePos.length; i++) {
        eyePos[i] -= dir.elements[i] * cameraStep;
    }
}

function initVertexBuffers(gl, program) {
    var o = new Object();
    o.vertexBuffer = createEmptyArrayBuffer(gl, program.a_Position, 3, gl.FLOAT);
    o.normalBuffer = createEmptyArrayBuffer(gl, program.a_Normal, 3, gl.FLOAT);
    o.colorBuffer = createEmptyArrayBuffer(gl, program.a_Color, 4, gl.FLOAT);
    o.indexBuffer = gl.createBuffer();

    if (!o.vertexBuffer || !o.normalBuffer || !o.colorBuffer || !o.indexBuffer) { return null; }

    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    return o;
}

function createEmptyArrayBuffer(gl, attribute, num, type) {
    var buffer = gl.createBuffer(); // 创建缓冲区对象
    if (!buffer) {
        console.log('创建缓冲区失败');
        return null;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(attribute, num, type, false, 0, 0);
    gl.enableVertexAttribArray(attribute); // 开启attribute变量
    return buffer;
}


var g_objDoc = null;      // The information of OBJ file
var g_drawingInfo = null; // The information for drawing 3D model

// OBJ File has been read
function readOBJText(fileString, fileName, gl, o, scale, reverse) {
    var objDoc = new OBJDoc(fileName);  // Create a OBJDoc object
    var result = objDoc.parse(fileString, scale, reverse); // Parse the file
    if (!result) {
        g_objDoc = null; g_drawingInfo = null;
        console.log("OBJ file parsing error.");
        return;
    }
    g_objDoc = objDoc;
}

// Coordinate transformation matrix
var g_modelMatrix = new Matrix4();
var g_mvpMatrix = new Matrix4();
var g_normalMatrix = new Matrix4();

// 描画関数
function draw(gl, program, angle, viewProjMatrix, model) {
    if (g_objDoc != null && g_objDoc.isMTLComplete()) { // OBJ and all MTLs are available
        g_drawingInfo = onReadComplete(gl, model, g_objDoc);
        console.log(g_drawingInfo);
        g_objDoc = null;
    }
    if (!g_drawingInfo) return;

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);  // Clear color and depth buffers

    g_modelMatrix.setRotate(angle, 1.0, 0.0, 0.0);
    g_modelMatrix.rotate(angle, 0.0, 1.0, 0.0);
    g_modelMatrix.rotate(angle, 0.0, 0.0, 1.0);

    // Calculate the normal transformation matrix and pass it to u_NormalMatrix
    g_normalMatrix.setInverseOf(g_modelMatrix);
    g_normalMatrix.transpose();
    gl.uniformMatrix4fv(program.u_NormalMatrix, false, g_normalMatrix.elements);

    // Calculate the model view project matrix and pass it to u_MvpMatrix
    g_mvpMatrix.set(viewProjMatrix);
    g_mvpMatrix.multiply(g_modelMatrix);
    gl.uniformMatrix4fv(program.u_MvpMatrix, false, g_mvpMatrix.elements);

    // Draw
    gl.drawElements(gl.TRIANGLES, g_drawingInfo.indices.length, gl.UNSIGNED_SHORT, 0);
}

// OBJ File has been read compreatly
function onReadComplete(gl, model, objDoc) {
    // Acquire the vertex coordinates and colors from OBJ file
    var drawingInfo = objDoc.getDrawingInfo();

    // Write date into the buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, model.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.vertices, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, model.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.normals, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, model.colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.colors, gl.STATIC_DRAW);

    // Write the indices to the buffer object
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, drawingInfo.indices, gl.STATIC_DRAW);

    return drawingInfo;
}

var ANGLE_STEP = 30;   // The increments of rotation angle (degrees)

var last = Date.now(); // Last time that this function was called
function animate(angle) {
    var now = Date.now();   // Calculate the elapsed time
    var elapsed = now - last;
    last = now;
    // Update the current rotation angle (adjusted by the elapsed time)
    var newAngle = angle + (ANGLE_STEP * elapsed) / 1000.0;
    return newAngle % 360;
}