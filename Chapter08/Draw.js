// Draw.js

//顶点着色器
var VSHADER_SOURCE =
    'attribute vec4 a_Position;\n' +
    'attribute vec2 a_TexCoord;\n' +
    'varying vec2 v_TexCoord;\n' +
    'void main() {\n' +
    '   gl_Position = a_Position;\n' +
    '   v_TexCoord = a_TexCoord;\n' +
    '}\n';

// 片元着色器
var FSHADER_SOURCE =
    'precision mediump float;\n' +
    'uniform sampler2D u_Sampler;\n' +
    'varying vec2 v_TexCoord;\n' +
    'void main() {\n' +
    '   vec4 color = texture2D(u_Sampler, v_TexCoord);\n' +
    // '   for (int i = 0; i < 10; i++){\n' +
    // '       if(bak[0] <= 0.5) color[0] *= bak[0];\n' +
    // '       if(bak[1] <= 0.4) color[1] *= bak[1];\n' +
    // '       if(bak[2] <= 0.3) color[2] *= bak[2];\n' +
    // // '       color[2] *= bak[2];\n' +
    // '   }\n' +
    '   gl_FragColor = color;\n' +
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


    document.getElementById('fileInput')
        .addEventListener('change', function selectedFileChanged() {
            if (this.isDefaultNamespace.length == 0) {
                console.log('请选择文件');
                return;
            }
            const reader = new FileReader();
            reader.onload = function fileReadCompleted() {
                initTextues(gl, n, reader.result);
            };
            reader.readAsDataURL(this.files[0]);
        });

    // gl.clearColor(0.0, 0.0, 0.0, 1.0);
    //配置纹理
    // if (!initTextues(gl, n)) {
    //     console.log('初始化纹理失败');
    //     return;
    // }
}


var points = [
    -0.75, 0.75, 0.0, 1.0,
    -0.75, -0.75, 0.0, 0.0,
    0.75, 0.75, 1.0, 1.0,
    0.75, -0.75, 1.0, 0.0,
];

function initVertexBuffers() {
    var verticesTexCoords = new Float32Array(points);

    var n = 4;
    var vertexTexCoordBuffer = gl.createBuffer();
    if (!vertexTexCoordBuffer) {
        console.log('创建gl缓冲区失败');
        return -1;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexTexCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, verticesTexCoords, gl.STATIC_DRAW);

    var FSIZE = verticesTexCoords.BYTES_PER_ELEMENT;

    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, FSIZE * 4, 0);
    gl.enableVertexAttribArray(a_Position);

    var a_TexCoord = gl.getAttribLocation(gl.program, 'a_TexCoord');
    gl.vertexAttribPointer(a_TexCoord, 2, gl.FLOAT, false, FSIZE * 4, FSIZE * 2);
    gl.enableVertexAttribArray(a_TexCoord);

    return n;
}

function initTextues(gl, n, path) {
    var texture = gl.createTexture(); // 创建纹理对象
    var u_Sampler = gl.getUniformLocation(gl.program, 'u_Sampler');
    var image = new Image(); // 创建一个image对象
    image.onload = function () {
        loadTexture(gl, n, texture, u_Sampler, image);
    };
    image.src = path;
    document.body.appendChild(image);
    return true;
}

function loadTexture(gl, n, texture, u_Sampler, image) {
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);// 对纹理图像进行y轴翻转
    // 开启0号纹理单元
    gl.activeTexture(gl.TEXTURE0);
    // 向target绑定纹理对象
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // 配置纹理参数
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    // 配置纹理图像
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
    // 将0号纹理传递给着色器
    gl.uniform1i(u_Sampler, 0);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, n);
}