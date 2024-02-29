// BlinnPhone.js

var VSHADER_SOURCE =
    `
attribute vec4 a_Position;
attribute vec4 a_Normal; //法线
uniform mat4 u_MvpMatrix;
uniform mat4 u_ModelMatrix;
uniform mat4 u_NormalMatrix;
varying vec3 v_Normal;
varying vec3 v_WorldPos;
void main(){ 
    // 模型变换
    gl_Position = u_MvpMatrix * a_Position;
    v_WorldPos = (u_ModelMatrix * a_Position).xyz;
    v_Normal = (u_NormalMatrix * a_Normal).xyz;
}
`;

var FSHADER_SOURCE =
    `
#ifdef GL_ES
    precision mediump float;
#endif
uniform vec3 u_CameraPos;
varying vec3 v_Normal;
varying vec3 v_WorldPos;

uniform float u_Gloss;
// 漫反射系数
uniform float u_Diffuse;
// 高光系数
uniform float u_Specular;
// 环境光系数
uniform float u_Ambient;

// 漫反射颜色
uniform vec3 u_DiffuseColor;
// 高光反射颜色
uniform vec3 u_SpecularColor;
// 环境光颜色
uniform vec3 u_AmbientColor;
uniform vec3 u_LightColor;

struct PointLight
{
    vec3 position;      // 点光源位置
    vec3 color;         // 点光源颜色
    float intensity;
};

struct ObjectInfo
{
    vec3 position;
    vec3 normal;
    vec3 color;
};

struct CameraInfo
{
    vec3 position;
};

PointLight sun = PointLight(vec3(0.0, 0.0, 10.0), u_LightColor, 1.0);

vec3 calculateDiffuse_PointLight(ObjectInfo object,PointLight pointLight)
{
    vec3 lightDir = normalize(pointLight.position - object.position);
    float r2 = pow(length(pointLight.position - object.position), 2.0);
    float diff = max(dot(object.normal, lightDir), 0.0);

    return u_Diffuse * diff * pointLight.color * u_DiffuseColor;
}

vec3 calculateSpecular_PointLight(ObjectInfo object, CameraInfo camera, PointLight pointLight)
{
    vec3 lightDir = normalize(pointLight.position - object.position);
    vec3 viewDir = normalize(camera.position - object.position);
    vec3 halfVec = normalize(lightDir + viewDir);
    float r2 = pow(length(pointLight.position - object.position), 2.0);

    float spec = pow(max(dot(object.normal, halfVec), 0.0), u_Gloss);

    return u_Specular * spec * pointLight.color * u_SpecularColor;
}

vec3 calculateAmbient(ObjectInfo object, PointLight pointLight)
{
    return u_Ambient * pointLight.color * u_AmbientColor;
}

void main()
{
    ObjectInfo object = ObjectInfo(v_WorldPos, normalize(v_Normal), vec3(1.0, 1.0, 1.0));
    CameraInfo camera = CameraInfo(u_CameraPos);
    vec3 diffuseColor = calculateDiffuse_PointLight(object,sun);
    vec3 specularColor = calculateSpecular_PointLight(object,camera,sun);
    vec3 ambientColor = calculateAmbient(object, sun);
    vec3 finnalColor = (specularColor + diffuseColor + ambientColor);
    gl_FragColor = vec4(finnalColor, 1.0);
}
`;

var eyePos = [0.0, 0.0, 10.0];
var cameraStep = 10;
var currentAngle = 0.0; // Current rotation angle [degree]

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
    program.u_MvpMatrix = gl.getUniformLocation(program, 'u_MvpMatrix');
    program.u_ModelMatrix = gl.getUniformLocation(program, 'u_ModelMatrix');
    program.u_NormalMatrix = gl.getUniformLocation(program, 'u_NormalMatrix');
    program.u_CameraPos = gl.getUniformLocation(program, 'u_CameraPos');
    program.u_Gloss = gl.getUniformLocation(program, 'u_Gloss');
    program.u_Diffuse = gl.getUniformLocation(program, 'u_Diffuse');
    program.u_Specular = gl.getUniformLocation(program, 'u_Specular');
    program.u_Ambient = gl.getUniformLocation(program, 'u_Ambient');
    program.u_DiffuseColor = gl.getUniformLocation(program, 'u_DiffuseColor');
    program.u_SpecularColor = gl.getUniformLocation(program, 'u_SpecularColor');
    program.u_AmbientColor = gl.getUniformLocation(program, 'u_AmbientColor');
    program.u_LightColor = gl.getUniformLocation(program, 'u_LightColor');

    if (program.a_Position < 0 || program.a_Normal < 0 ||
        !program.u_MvpMatrix || !program.u_NormalMatrix || !program.u_ModelMatrix ||
        !program.u_CameraPos) {
        console.log('attribute, uniform获取失败');
        return;
    }

    gl.uniform3fv(program.u_CameraPos, eyePos);

    var gloss = document.getElementById('gloss').value;
    setAttr1f(gl, gloss, program.u_Gloss);

    var diffuse = document.getElementById('diffuse').value;
    setAttr1f(gl, diffuse, program.u_Diffuse);

    var specular = document.getElementById('specular').value;
    setAttr1f(gl, specular, program.u_Specular);

    var ambient = document.getElementById('ambient').value;
    setAttr1f(gl, ambient, program.u_Ambient);

    var diffuseColor = document.getElementById('diffuseColor').value;
    setColorAttr(gl, diffuseColor, program.u_DiffuseColor);

    var specularColor = document.getElementById('specularColor').value;
    setColorAttr(gl, specularColor, program.u_SpecularColor);

    var ambientColor = document.getElementById('ambientColor').value;
    setColorAttr(gl, ambientColor, program.u_AmbientColor);

    var lightColor = document.getElementById('lightColor').value;
    setColorAttr(gl, lightColor, program.u_LightColor);

    var n = initVertexBuffers(gl, program);
    if (n < 0) {
        console.log('Failed to set the vertex information');
        return;
    }

    var viewProjMatrix = new Matrix4();
    viewProjMatrix.setPerspective(30.0, canvas.width / canvas.height, 1.0, 100.0);
    viewProjMatrix.lookAt(eyePos[0], eyePos[1], eyePos[2], 0.0, 0.0, 0.0, 0.0, 1.0, 0.0);

    // Start reading the OBJ file
    var tick = function () {   // Start drawing
        currentAngle = animate(currentAngle); // Update current rotation angle
        draw(gl, gl.program, currentAngle, viewProjMatrix, n);
        requestAnimationFrame(tick, canvas);
    };
    tick();

    bindEvents(gl, program);
}

function setAttr1f(gl, value, attribute) {
    console.log(value, attribute);
    gl.uniform1f(attribute, value);
}

function setColorAttr(gl, color, attribute) {
    color = hexToRgb(color);
    console.log(color, attribute);
    gl.uniform3f(attribute, color[0], color[1], color[2]);
}

function hexToRgb(hex) {
    return [parseInt('0x' + hex.slice(1, 3)) / 255.0, parseInt('0x' + hex.slice(3, 5)) / 255.0, parseInt('0x' + hex.slice(5, 7)) / 255.0];
}

function bindEvents(gl, program) {
    document.getElementById('diffuse').addEventListener('change', function (e) {
        setAttr1f(gl, e.target.value, program.u_Diffuse);
    });
    document.getElementById('specular').addEventListener('change', function (e) {
        setAttr1f(gl, e.target.value, program.u_Specular);
    });
    document.getElementById('ambient').addEventListener('change', function (e) {
        setAttr1f(gl, e.target.value, program.u_Ambient);
    });
    document.getElementById('gloss').addEventListener('change', function (e) {
        setAttr1f(gl, e.target.value, program.u_Gloss);
    });
    document.getElementById('diffuseColor').addEventListener('change', function (e) {
        setColorAttr(gl, e.target.value, program.u_DiffuseColor);
    });
    document.getElementById('specularColor').addEventListener('change', function (e) {
        setColorAttr(gl, e.target.value, program.u_SpecularColor);
    });

    document.getElementById('ambientColor').addEventListener('change', function (e) {
        setColorAttr(gl, e.target.value, program.u_AmbientColor);
    });

    document.getElementById('lightColor').addEventListener('change', function (e) {
        setColorAttr(gl, e.target.value, program.u_LightColor);
    });
}

function initVertexBuffers(gl, program) {
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
        1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,     // v0-v1-v2-v3 front
        1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,     // v0-v3-v4-v5 right
        1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,     // v0-v5-v6-v1 up
        1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,     // v1-v6-v7-v2 left
        1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,     // v7-v4-v3-v2 down
        1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1    // v4-v7-v6-v5 back
    ]);

    // var colors = new Float32Array([    // Colors
    //     0, 0, 0.5, 0.5, 0.5, 0.5, 0.6, 0.1, 0.8, 0.5, 0.2, 0.9,     // v0-v1-v2-v3 front
    //     0.1, 0.2, 0.5, 0.1, 0.8, 0, 0.1, 0.7, 0, 0.4, 0.3, 0.7,     // v0-v3-v4-v5 right
    //     0.1, 0.6, 0.3, 0.8, 0.4, 0.9, 0.6, 0.4, 0.2, 0.6, 0.5, 0.8,     // v0-v5-v6-v1 up
    //     0.2, 0.4, 0.5, 0.3, 0.5, 0.8, 0.3, 0.4, 0.9, 0.9, 0.6, 0.2,     // v1-v6-v7-v2 left
    //     0.9, 0.8, 0.7, 0.6, 0.5, 0, 0.4, 0.2, 0.2, 0.1, 0.7, 0.4,     // v7-v4-v3-v2 down
    //     0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.4, 0.6, 0.3　    // v4-v7-v6-v5 back
    // ]);


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
    if (!initArrayBuffer(gl, program.a_Position, vertices, 3, gl.FLOAT)) return -1;
    // if (!initArrayBuffer(gl, program.a_Color, colors, 3, gl.FLOAT)) return -1;
    if (!initArrayBuffer(gl, program.a_Normal, normals, 3, gl.FLOAT)) return -1;

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
    gl.vertexAttribPointer(attribute, num, type, false, 0, 0);
    // Enable the assignment of the buffer object to the attribute variable
    gl.enableVertexAttribArray(attribute);

    return true;
}

var g_modelMatrix = new Matrix4();
var g_mvpMatrix = new Matrix4();
var g_normalMatrix = new Matrix4();

function draw(gl, program, angle, viewProjMatrix, n) {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);  // Clear color and depth buffers

    g_modelMatrix.setRotate(angle, 0.0, 1.0, 0.0);
    g_modelMatrix.rotate(angle, 1.0, 0.0, 0.0);
    g_modelMatrix.rotate(angle, 0.0, 0.0, 1.0);
    gl.uniformMatrix4fv(program.u_ModelMatrix, false, g_modelMatrix.elements);

    // Calculate the normal transformation matrix and pass it to u_NormalMatrix
    g_normalMatrix.setInverseOf(g_modelMatrix);
    g_normalMatrix.transpose();
    gl.uniformMatrix4fv(program.u_NormalMatrix, false, g_normalMatrix.elements);

    // Calculate the model view project matrix and pass it to u_MvpMatrix
    g_mvpMatrix.set(viewProjMatrix);
    g_mvpMatrix.multiply(g_modelMatrix);
    gl.uniformMatrix4fv(program.u_MvpMatrix, false, g_mvpMatrix.elements);

    gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);   // Draw the cube
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