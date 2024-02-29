// PointLightedCube_perfrag.js

var VSHADER_SOURCE =
    'attribute vec4 a_Position;\n' +
    'attribute vec4 a_Color;\n' +
    'attribute vec4 a_Normal;\n' + //法线
    'attribute vec2 a_TexCoord;\n' +
    'uniform mat4 u_MvpMatrix;\n' +
    'uniform mat4 u_ModelMatrix;\n' +
    'uniform mat4 u_NormalMatrix;\n' +
    'varying vec2 v_TexCoord;\n' +
    // 'varying vec4 v_Color;\n' +
    'varying vec3 v_Position;\n' +
    'varying vec3 v_Normal;\n' +
    'void main(){ \n' +
    // 模型变换
    '   gl_Position = u_MvpMatrix * a_Position;\n' +
    '   v_Normal = normalize(vec3(u_NormalMatrix * a_Normal));\n' +
    '   v_Position = vec3(u_ModelMatrix * a_Position);\n' +
    // '   v_Color = a_Color;\n' +
    '   v_TexCoord = a_TexCoord;\n' +
    '}\n';

var FSHADER_SOURCE =
    '#ifdef GL_ES\n' +
    '   precision mediump float;\n' +
    '#endif\n' +
    'uniform vec3 u_AmbientLight;\n' +
    'uniform vec3 u_LightColor;\n' + // 光线颜色
    'uniform vec3 u_LightPosition;\n' + // 光线方向
    'uniform sampler2D u_Sampler0;\n' +
    'uniform sampler2D u_Sampler1;\n' +
    'varying vec2 v_TexCoord;\n' +
    // 'varying vec4 v_Color;\n' +
    'varying vec3 v_Position;\n' +
    'varying vec3 v_Normal;\n' +
    'void main(){\n' +
    '   vec4 color0 = texture2D(u_Sampler0, v_TexCoord);\n' +
    '   vec4 color1 = texture2D(u_Sampler1, v_TexCoord);\n' +
    // '   vec4 color2 = texture2D(u_Sampler2, v_TexCoord);\n' +
    '   vec4 color = color0 * color1;\n' +
    '   vec3 lightDir = normalize(u_LightPosition - v_Position);\n' +
    // cos₰
    '   float nDotL = max(dot(lightDir, v_Normal), 0.0);\n' +
    // 漫反射光
    '   vec3 diffuse = u_LightColor * color.rgb * nDotL;\n' +
    // 环境光
    '   vec3 ambient = u_AmbientLight * color.rgb;\n' +
    '   gl_FragColor = vec4(ambient + diffuse, color.a);\n' +
    '}\n';


var ANGLE_STEP = 40.0; // 每秒旋转角度
var deltaAngle = 0.0;
var g_last = Date.now(); // 记录最后一次刷新时间
var lastChangeRotateTime = 0;
var rotateChangeInterval = 5000;
var frame = 60; // 帧率
var interval = 1000.0 / frame; // 每帧间隔
var axisX = 1; // -1 ~ 1
var axisY = 1; // -1 ~ 1
var axisZ = 1; // -1 ~ 1
var tick;
var isRun = false;

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
    // gl.clearColor(0, 0, 0, 1);
    gl.enable(gl.DEPTH_TEST);

    // Get the storage locations of uniform variables and so on
    var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    var u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix');
    var u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
    var u_LightColor = gl.getUniformLocation(gl.program, 'u_LightColor');
    var u_LightPosition = gl.getUniformLocation(gl.program, 'u_LightPosition');
    var u_AmbientLight = gl.getUniformLocation(gl.program, 'u_AmbientLight');
    if (!u_MvpMatrix || !u_LightColor || !u_LightPosition || !u_NormalMatrix || !u_AmbientLight || !u_ModelMatrix) {
        console.log('Failed to get the storage location');
        return;
    }

    // Set the light color (white)
    gl.uniform3f(u_LightColor, 1.0, 1.0, 1.0);
    // gl.uniform3f(u_LightColor, 1.0, 0.75, 0.79);
    gl.uniform3f(u_AmbientLight, 0.2, 0.2, 0.2);
    // Set the light direction (in the world coordinate)
    // var lightPosition = new Vector3([1.5, 3.0, 1.0]);
    // lightPosition.normalize();     // Normalize
    // gl.uniform3fv(u_LightPosition, lightPosition.elements);

    // Calculate the view projection matrix
    var vpMatrix = new MyMatrix4();    // Model view projection matrix
    vpMatrix.setPerspective(30, canvas.width / canvas.height, 1, 100);
    vpMatrix.lookAt(0, 5, 7, 0, 0, 0, 0, 1, 0);
    // Pass the model view projection matrix to the variable u_MvpMatrix

    var mvpMatrix = new MyMatrix4();
    var modelMatrix = new MyMatrix4();
    var normalMatrix = new MyMatrix4();

    tick = function () {
        var now = Date.now();
        var deltaTime = now - g_last; //毫秒

        // rotateChangeInterval秒改变一次旋转轴
        if (now >= lastChangeRotateTime) {
            lastChangeRotateTime = now + rotateChangeInterval;
            changeRotateAxis();
            // changeCubeColor(gl, n);
            changePointLightPosition(gl, u_LightPosition);
        }

        if (deltaTime >= interval) {
            g_last = now;// 记录上次刷新时间
            deltaAngle = animateRotate(deltaTime);
            //console.log(deltaTime);
            updateFrame(gl, n, deltaAngle, mvpMatrix, u_MvpMatrix, vpMatrix, modelMatrix, u_ModelMatrix, normalMatrix, u_NormalMatrix);
            // console.log('draw' + Date.now());
        }

        requestAnimationFrame(tick);// 请求浏览器调用tick
    }

    tick();

    document.getElementById('fileInput')
        .addEventListener('change', function selectedFileChanged() {
            if (this.files.length == 0) {
                console.log('请选择文件');
                return;
            }
        
            const reader = new FileReader();
            reader.onload = function fileReadCompleted() {
                initTextues(gl, 0, reader.result);
            };
            reader.readAsDataURL(this.files[0]);
        
            const reader1 = new FileReader();
            reader1.onload = function fileReadCompleted() {
                initTextues(gl, 1, reader1.result);
            };
            reader1.readAsDataURL(this.files[1]);
        
            // const reader2 = new FileReader();
            // reader2.onload = function fileReadCompleted() {
            //     initTextues(gl, 2, reader2.result);
            // };
            // reader2.readAsDataURL(this.files[2]);
        });
}

function updateFrame(gl, n, deltaAngle, mvpMatrix, u_MvpMatrix, vpMatrix, modelMatrix, u_ModelMatrix, normalMatrix, u_NormalMatrix) {
    modelMatrix.rotate(deltaAngle, axisX, axisY, axisZ);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    mvpMatrix.set(vpMatrix).multiply(modelMatrix);
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);

    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

    // Clear color and depth buffer
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);   // Draw the cube
}

function changeRotateAxis() {
    axisX = Math.random() * 2 - 1; // -1 ~ 1
    axisY = Math.random() * 2 - 1; // -1 ~ 1
    axisZ = Math.random() * 2 - 1; // -1 ~ 1
    console.log('改变旋转轴', Date.now());
}

function changeCubeColor(gl, n) {
    var colorsArray = [];
    for (var i = 0; i < n; i++) {
        var r = Math.random();
        var g = Math.random();
        var b = Math.random();
        colorsArray.push(r);
        colorsArray.push(g);
        colorsArray.push(b);
    }
    var colors = new Float32Array(colorsArray);
    if (!initArrayBuffer(gl, 'a_Color', colors, 3, gl.FLOAT)) return -1;
    console.log('改变颜色', Date.now());
}

function changePointLightPosition(gl, u_LightPosition) {
    var x = Math.random() * 10 - 5;
    var y = Math.random() * 10 - 5;
    var z = Math.random() * 5;
    gl.uniform3f(u_LightPosition, x, y, z);
    console.log('改变点光源位置', x, y, z, Date.now());
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

    var texCoords = new Float32Array([
        16.0, 16.0, 0.0, 16.0, 0.0, 0.0, 16.0, 0.0,
        0.0, 8.0, 0.0, 0.0, 8.0, 0.0, 8.0, 8.0,
        4.0, 0.0, 4.0, 4.0, 0.0, 4.0, 0.0, 0.0,
        2.0, 2.0, 0.0, 2.0, 0.0, 0.0, 2.0, 0.0,
        0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, 0.0,
        0.5, 0.0, 0.0, 0.0, 0.0, 0.5, 0.5, 0.5,
    ]);

    // var colors = new Float32Array([    // Colors
    //     1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,     // v0-v1-v2-v3 front
    //     1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,     // v0-v3-v4-v5 right
    //     1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,     // v0-v5-v6-v1 up
    //     1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,     // v1-v6-v7-v2 left
    //     1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,     // v7-v4-v3-v2 down
    //     1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0　    // v4-v7-v6-v5 back
    // ]);

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
    if (!initArrayBuffer(gl, 'a_Position', vertices, 3, gl.FLOAT)) return -1;
    // if (!initArrayBuffer(gl, 'a_Color', colors, 3, gl.FLOAT)) return -1;
    if (!initArrayBuffer(gl, 'a_Normal', normals, 3, gl.FLOAT)) return -1;
    if (!initArrayBuffer(gl, 'a_TexCoord', texCoords, 2, gl.FLOAT)) return -1;

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

function initTextues(gl, index, src) {
    var img;
    if (index == 0)
        img = document.getElementById('selectImg');
    else
        img = document.getElementById('selectImg1');
    var texture = gl.createTexture(); // 创建纹理对象
    var u_Sampler = gl.getUniformLocation(gl.program, 'u_Sampler' + index);
   
    img.onload = function () {
        loadTexture(gl, index, texture, u_Sampler, img);
    };
    img.src = src;
    
    return true;
}

function loadTexture(gl, index, texture, u_Sampler, image) {
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);// 对纹理图像进行y轴翻转
    if (index == 0)
        // 开启0号纹理单元
        gl.activeTexture(gl.TEXTURE0);
    else
        gl.activeTexture(gl.TEXTURE1);
    // 向target绑定纹理对象
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // 配置纹理参数
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    // 配置纹理图像
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
    // 将0号纹理传递给着色器
    gl.uniform1i(u_Sampler, index);

    // gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    // gl.drawArrays(gl.TRIANGLE_STRIP, 0, n);
}