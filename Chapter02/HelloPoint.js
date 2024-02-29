// HelloPoint.js

// 顶点着色器程序
var VSHADER_SOURCE =
    'void main() {\n'+
    'gl_Position = vec4(0.0,0.0,0.0,1.0);\n' + //设置坐标
    'gl_PointSize = 10.0;\n' + //设置尺寸
    '}\n';

//片元着色器
var FSHADER_SOURCE =
    'void main() {\n' +
    'gl_FragColor = vec4(1.0,0.0,0.0,1.0);\n' + //设置颜色
    '}\n';

function main()
{
    // 获取canvas
    var canvas = document.getElementById('webgl');

    var gl = getWebGLContext(canvas);
    if (!gl)
    {
        console.log("获取webgl context失败");
        return;
    }

    //初始化着色器
    if (!initShaders(gl, VSHADER_SOURCE,FSHADER_SOURCE))
    {
        console.log('初始化shader失败');
        return;
    }

    // 设置背景色
    gl.clearColor(0.0,0.0,0.0,1.0);

    gl.clear(gl.COLOR_BUFFER_BIT);
    
    //画点
    gl.drawArrays(gl.POINTS,0,1);
}