import { Starling, Quad, Sprite } from '../src/index';

class App extends Sprite {
    constructor()
    {
        super();
        let quad = new Quad(100, 100);
        quad.x = 100;
        quad.y = 100;
        quad.color = 0x0000ff;
        this.addChild(quad);

        //quad = new Quad(100, 100);
        //quad.x = 300;
        //quad.y = 100;
        //quad.color = 0xffffff;
        //this.addChild(quad);
        //
        //quad = new Quad(10, 300);
        //quad.x = 140;
        //quad.y = 40;
        //quad.rotation = -0.3;
        //quad.color = 0xffffff;
        //this.addChild(quad);
    }
}

const canvas = document.getElementById('starling-canvas');
const starling = new Starling(App, canvas, null, window);

starling.start();

// min test case

(function ()
{
    return;
    const gl = canvas.getContext('webgl2');

    gl.frontFace(gl.CW);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

    const positionsData = new Float32Array([
        -1.0, -1.0,
        -1.0, 1.0,
        1.0, 1.0,
    ]);

    const indexData = new Uint16Array([0, 1, 2]); // CW
//const indexData = new Uint16Array([0, 2, 1]); // CCW

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    const positions = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positions);
    gl.bufferData(gl.ARRAY_BUFFER, positionsData, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    const indices = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indices);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexData, gl.STATIC_DRAW);

    gl.bindVertexArray(null);

// Program

    const vs = `#version 300 es
            layout(location = 0) in vec4 aPosition;
            uniform mat4 u_viewProj;

            //out vec4 v_color;

            void main() {
                //gl_Position = u_viewProj * a_position;
                gl_Position = aPosition;
                //v_color = vec4(1.0, 0.0, 0.0, 1.0);
            }
        `;

    const fs = `#version 300 es
            precision highp float;

            //in vec4 v_color;

            out vec4 color;

            void main() {
               color = vec4(1.0, 1.0, 0.5, 1.0);
            }
        `;

    function createShader(source, type)
    {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        return shader;
    }

    const program = gl.createProgram();
    const vertexShader = createShader(vs, gl.VERTEX_SHADER);
    const fragmentShader = createShader(fs, gl.FRAGMENT_SHADER);
    gl.attachShader(program, vertexShader);
    gl.deleteShader(vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.deleteShader(fragmentShader);
    gl.linkProgram(program);

    let log = gl.getProgramInfoLog(program);
    if (log) console.log(`ProgramLog\n${log}`);

    log = gl.getShaderInfoLog(vertexShader);
    if (log) console.log(`VertexShaderLog\n${log}`);

    log = gl.getShaderInfoLog(fragmentShader);
    if (log) console.log(`FragmentShaderLog\n${log}`);

// Render
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(program);

    gl.bindVertexArray(vao);

    gl.drawElements(gl.TRIANGLES, 3, gl.UNSIGNED_SHORT, 0);

    gl.bindVertexArray(null);
}());

// UI

document.getElementById('start-stop').onclick = () =>
{
    if (starling.isStarted)
        starling.stop();
    else
        starling.start();
};
