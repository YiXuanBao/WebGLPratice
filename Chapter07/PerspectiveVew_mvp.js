// PerspectiveVew_mvp.js

// Vertex shader program
var VSHADER_SOURCE =
    'attribute vec4 a_Position;\n' +
    'attribute vec4 a_Color;\n' +
    'uniform mat4 u_MvpMatrix;\n' +
    // 'uniform mat4 u_ModelMatrix;\n' +
    // 'uniform mat4 u_ViewMatrix;\n' +
    // 'uniform mat4 u_ProjMatrix;\n' +
    'varying vec4 v_Color;\n' +
    'void main() {\n' +
    // '  gl_Position = u_ProjMatrix * u_ViewMatrix * u_ModelMatrix * a_Position;\n' +
    '  gl_Position = u_MvpMatrix * a_Position;\n' +
    '  v_Color = a_Color;\n' +
    '}\n';

// Fragment shader program
var FSHADER_SOURCE =
    '#ifdef GL_ES\n' +
    'precision mediump float;\n' +
    '#endif\n' +
    'varying vec4 v_Color;\n' +
    'void main() {\n' +
    '  gl_FragColor = v_Color;\n' +
    '}\n';

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

    // Set the vertex coordinates and color (the blue triangle is in the front)
    var n = initVertexBuffers(gl);
    if (n < 0) {
        console.log('Failed to set the vertex information');
        return;
    }

    // Specify the color for clearing <canvas>
    gl.clearColor(0, 0, 0, 1);
    gl.enable(gl.DEPTH_TEST); // 开启深度测试
    gl.enable(gl.POLYGON_OFFSET_FILL);
    // get the storage locations of u_ViewMatrix and u_ProjMatrix
    // var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    // var u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
    // var u_ProjMatrix = gl.getUniformLocation(gl.program, 'u_ProjMatrix');
    var u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix');

    var modelMatrix = new MyMatrix4(); // the model matrix
    var viewMatrix = new MyMatrix4(); // The view matrix
    var projMatrix = new MyMatrix4(); // The projection matrix
    var mvpMatrix = new MyMatrix4();

    // calculate the view matrix and projection matrix
    viewMatrix.setLookAt(3.6, 2.5, 10.0, 0, 0, -2, 0, 1, 1);
    projMatrix.setPerspective(30, canvas.width / canvas.height, 1.0, 100.0);

    // Clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEOTH_BUFFER_BIT);

    // Pass the view and projection matrix to u_ViewMatrix, u_ProjMatrix
    // gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    // gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
    // gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);
    modelMatrix.setTranslate(0.0, 0.0, 0.0);
    mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
    gl.drawArrays(gl.TRIANGLES, 0, n / 2);
    gl.polygonOffset(1.0, 1.0);
    gl.drawArrays(gl.TRIANGLES, n / 2, n / 2);

    // modelMatrix.setTranslate(-0.75, 0.0, 0.0);
    // mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);
    // gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
    // gl.drawArrays(gl.TRIANGLES, 0, n);

    // modelMatrix.setTranslate(2.0, 1.0, -5.0);
    // mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);
    // gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
    // gl.drawArrays(gl.TRIANGLES, 0, n);
}

function initVertexBuffers(gl) {
    var verticesColors = new Float32Array([
        0.0,
    2.5,
    -5.0,
    0.4,
    1.0,
    0.4, // The green triangle
    -2.5,
    -2.5,
    -5.0,
    0.4,
    1.0,
    0.4,
    2.5,
    -2.5,
    -5.0,
    1.0,
    0.4,
    0.4,

    0.0,
    3.0,
    -5.0,
    1.0,
    0.4,
    0.4, // The yellow triagle
    -3.0,
    -3.0,
    -5.0,
    1.0,
    1.0,
    0.4,
    3.0,
    -3.0,
    -5.0,
    1.0,
    1.0,
    0.4,
        // Three triangles on the right side
        // 0.0, 2.5, -5.0, 0.5, 0.5, 0.5,  // The front blue one 
        // -2.5, -2.5, -5.0, 0.5, 0.5, 0.5,
        // 2.5, -2.5, -5.0, 0.5, 0.5, 0.5,

        // 0.0, 1.0, -2.0, 1.0, 1.0, 0.4, // The middle yellow one
        // -0.5, -1.0, -2.0, 1.0, 1.0, 0.4,
        // 0.5, -1.0, -2.0, 1.0, 0.4, 0.4,

        // 0.0, 3.0, -5.0, 1.0, 1.0, 1.0, // The middle yellow one
        // -3.0, -3.0, -5.0, 1.0, 1.0, 1.0,
        // 3.0, -3.0, -5.0, 1.0, 1.0, 1.0,

        // 0.0, 1.0, -4.0, 0.4, 1.0, 0.4, // The back green one
        // -0.5, -1.0, -4.0, 0.4, 1.0, 0.4,
        // 0.5, -1.0, -4.0, 1.0, 0.4, 0.4,
    ]);
    var n = 6; // Three vertices per triangle * 6

    // Create a buffer object
    var vertexColorbuffer = gl.createBuffer();
    if (!vertexColorbuffer) {
        console.log('Failed to create the buffer object');
        return -1;
    }

    // Write the vertex coordinates and color to the buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorbuffer);
    gl.bufferData(gl.ARRAY_BUFFER, verticesColors, gl.STATIC_DRAW);

    var FSIZE = verticesColors.BYTES_PER_ELEMENT;

    // Assign the buffer object to a_Position and enable the assignment
    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return -1;
    }
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * 6, 0);
    gl.enableVertexAttribArray(a_Position);

    // Assign the buffer object to a_Color and enable the assignment
    var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
    if (a_Color < 0) {
        console.log('Failed to get the storage location of a_Color');
        return -1;
    }

    gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE * 6, FSIZE * 3);
    gl.enableVertexAttribArray(a_Color);

    return n;
}
