// HelloCanvas.js
function main() {
    // 获取<canvas> 元素
    var canvas = document.getElementById('webgl');

    var gl = getWebGLContext(canvas)
    if (!gl) {
        console.log('获取绘图上下文失败')
        return;
    }

    gl.clearColor(0.0, 0.0, 1.0, 1.0);

    gl.clear(gl.COLOR_BUFFER_BIT);
}