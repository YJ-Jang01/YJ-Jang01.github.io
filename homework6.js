/*-------------------------------------------------------------------------
homework6.js
---------------------------------------------------------------------------*/
import { resizeAspectRatio, setupText, updateText, Axes } from '../util/util.js';
import { Shader, readShaderFile } from '../util/shader.js';
import { Cube } from '../util/cube.js';

const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl2');
let shader;
let startTime;  // start time of the program
let lastFrameTime;  // time of the last frame
let isInitialized = false;  // program initialization flag

let textOverlay; // for displaying camera info

let modelMatrix = mat4.create();  // model matrix
let viewMatrix = mat4.create();  // view matrix
let projMatrix = mat4.create();  // projection matrix
const cube0 = new Cube(gl);
const cube1 = new Cube(gl);
const cube2 = new Cube(gl);
const cube3 = new Cube(gl);
const cube4 = new Cube(gl);
// positions for the five cubes
const cubePositions = [
    [0.0, 0.0, 0.0],
    [2.0, 0.5, -3.0],
    [-1.5, -0.5, -2.5],
    [3.0, 0.0, -4.0],
    [-3.0, 0.0, 1.0]
];
const axes = new Axes(gl, 2.0); // create an Axes object

// Global variables for camera position and orientation
let cameraPos = vec3.fromValues(0, 0, 5);  // camera position initialization
let cameraFront = vec3.fromValues(0, 0, -1); // camera front vector initialization
let cameraUp = vec3.fromValues(0, 1, 0); // camera up vector (invariant)
let yaw = -90;  // yaw angle, rotation about y-axis (degree)
let pitch = 0;  // pitch angle, rotation about x-axis (degree)
const mouseSensitivity = 0.1;  // mouse sensitivity
const cameraSpeed = 2.5;  // camera speed (unit distance/sec)

// global variables for keyboard input
const keys = {
    'w': false,
    'a': false,
    's': false,
    'd': false
};

// mouse 쓸 때 main call 방법
document.addEventListener('DOMContentLoaded', () => {
    if (isInitialized) {
        console.log("Already initialized");
        return;
    }

    main().then(success => {
        if (!success) {
            console.log('program terminated');
            return;
        }
        isInitialized = true;
    }).catch(error => {
        console.error('program terminated with error:', error);
    });
});

// keyboard event listener for document
document.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if (key in keys) {
        keys[key] = true;
    }
});

document.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    if (key in keys) {
        keys[key] = false;
    }
});

// mouse event listener for canvas
canvas.addEventListener('click', () => {
    canvas.requestPointerLock();
    // Changing the pointer lock state
    console.log("Canvas clicked, requesting pointer lock");
});

document.addEventListener('pointerlockchange', () => {
    if (document.pointerLockElement === canvas) {
        console.log("Pointer is locked");
        document.addEventListener("mousemove", updateCamera);
    } else {
        console.log("Pointer is unlocked");
        document.removeEventListener("mousemove", updateCamera);
    }
    updateText(textOverlay, `Camera pos: (${cameraPos[0].toFixed(2)}, ${cameraPos[1].toFixed(2)}, ${cameraPos[2].toFixed(2)}) | Yaw: ${yaw.toFixed(1)}° | Pitch: ${pitch.toFixed(1)}°`);
});

// camera update function
function updateCamera(e) {
    const xoffset = e.movementX * mouseSensitivity;  // movementX 사용
    const yoffset = -e.movementY * mouseSensitivity; // movementY 사용

    yaw += xoffset;
    pitch += yoffset;

    // pitch limit
    if (pitch > 89.0) pitch = 89.0;
    if (pitch < -89.0) pitch = -89.0;

    const direction = vec3.create();
    direction[0] = Math.cos(glMatrix.toRadian(yaw)) * Math.cos(glMatrix.toRadian(pitch));
    direction[1] = Math.sin(glMatrix.toRadian(pitch));
    direction[2] = Math.sin(glMatrix.toRadian(yaw)) * Math.cos(glMatrix.toRadian(pitch));
    vec3.normalize(cameraFront, direction);
}

function initWebGL() {
    if (!gl) {
        console.error('WebGL 2 is not supported by your browser.');
        return false;
    }

    // set full canvas size: 1400 x 700
    canvas.width = 1400;
    canvas.height = 700;
    resizeAspectRatio(gl, canvas);
    // initial full-viewport (will set per-viewport in render)
    gl.viewport(0, 0, canvas.width, canvas.height);
    // default clear color (not used for per-viewport clears)
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    
    return true;
}

async function initShader() {
    const vertexShaderSource = await readShaderFile('shVert.glsl');
    const fragmentShaderSource = await readShaderFile('shFrag.glsl');
    shader = new Shader(gl, vertexShaderSource, fragmentShaderSource);
}

function render() {
    const currentTime = Date.now();
    const deltaTime = (currentTime - lastFrameTime) / 1000.0;
    lastFrameTime = currentTime;
    const elapsedTime = (currentTime - startTime) / 1000.0;

    // camera movement based on keyboard input
    const cameraSpeedWithDelta = cameraSpeed * deltaTime;
    
    // vec3.scaleAndAdd(v1, v2, v3, s): v1 = v2 + v3 * s
    if (keys['w']) { // move camera forward (to the +cameraFront direction)
        vec3.scaleAndAdd(cameraPos, cameraPos, cameraFront, cameraSpeedWithDelta);
        updateText(textOverlay, `Camera pos: (${cameraPos[0].toFixed(2)}, ${cameraPos[1].toFixed(2)}, ${cameraPos[2].toFixed(2)}) | Yaw: ${yaw.toFixed(1)}° | Pitch: ${pitch.toFixed(1)}°`);

    }
    if (keys['s']) { // move camera backward (to the -cameraFront direction)
        vec3.scaleAndAdd(cameraPos, cameraPos, cameraFront, -cameraSpeedWithDelta);
        updateText(textOverlay, `Camera pos: (${cameraPos[0].toFixed(2)}, ${cameraPos[1].toFixed(2)}, ${cameraPos[2].toFixed(2)}) | Yaw: ${yaw.toFixed(1)}° | Pitch: ${pitch.toFixed(1)}°`);    
    }
    if (keys['a']) { // move camera to the left (to the -cameraRight direction)
        const cameraRight = vec3.create();
        vec3.cross(cameraRight, cameraFront, cameraUp);
        vec3.normalize(cameraRight, cameraRight);
        vec3.scaleAndAdd(cameraPos, cameraPos, cameraRight, -cameraSpeedWithDelta);
        updateText(textOverlay, `Camera pos: (${cameraPos[0].toFixed(2)}, ${cameraPos[1].toFixed(2)}, ${cameraPos[2].toFixed(2)}) | Yaw: ${yaw.toFixed(1)}° | Pitch: ${pitch.toFixed(1)}°`);
    }
    if (keys['d']) { // move camera to the right (to the +cameraRight direction)
        const cameraRight = vec3.create();
        vec3.cross(cameraRight, cameraFront, cameraUp);
        vec3.normalize(cameraRight, cameraRight);
        vec3.scaleAndAdd(cameraPos, cameraPos, cameraRight, cameraSpeedWithDelta);
        updateText(textOverlay, `Camera pos: (${cameraPos[0].toFixed(2)}, ${cameraPos[1].toFixed(2)}, ${cameraPos[2].toFixed(2)}) | Yaw: ${yaw.toFixed(1)}° | Pitch: ${pitch.toFixed(1)}°`);    
    }

    // update view matrix
    mat4.lookAt(viewMatrix, 
        cameraPos, // from position (camera position)
        vec3.add(vec3.create(), cameraPos, cameraFront), // target position (camera position + cameraFront)
        cameraUp); // up vector (camera up vector, usually (0, 1, 0) and invariant)

    // enable depth and scissor tests
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.SCISSOR_TEST);

    // Left viewport (0,0) size 700x700
    const vpW = 700;
    const vpH = 700;

    // left: clear with left background color
    gl.viewport(0, 0, vpW, vpH);
    gl.scissor(0, 0, vpW, vpH);
    gl.clearColor(0.1, 0.2, 0.3, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // projection for square viewport (aspect = 1)
    const projLeft = mat4.create();
    mat4.perspective(projLeft, glMatrix.toRadian(60), vpW / vpH, 0.1, 100.0);

    // draw scene in left viewport (set model per-cube)
    shader.use();
    shader.setMat4('u_view', viewMatrix);
    shader.setMat4('u_projection', projLeft);

    mat4.identity(modelMatrix);
    mat4.translate(modelMatrix, modelMatrix, cubePositions[0]);
    shader.setMat4('u_model', modelMatrix);
    cube0.draw(shader);

    mat4.identity(modelMatrix);
    mat4.translate(modelMatrix, modelMatrix, cubePositions[1]);
    shader.setMat4('u_model', modelMatrix);
    cube1.draw(shader);

    mat4.identity(modelMatrix);
    mat4.translate(modelMatrix, modelMatrix, cubePositions[2]);
    shader.setMat4('u_model', modelMatrix);
    cube2.draw(shader);

    mat4.identity(modelMatrix);
    mat4.translate(modelMatrix, modelMatrix, cubePositions[3]);
    shader.setMat4('u_model', modelMatrix);
    cube3.draw(shader);

    mat4.identity(modelMatrix);
    mat4.translate(modelMatrix, modelMatrix, cubePositions[4]);
    shader.setMat4('u_model', modelMatrix);
    cube4.draw(shader);

    axes.draw(viewMatrix, projLeft);

    // Right viewport (700,0) size 700x700
    gl.viewport(vpW, 0, vpW, vpH);
    gl.scissor(vpW, 0, vpW, vpH);
    gl.clearColor(0.05, 0.15, 0.2, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // orthographic top-down view for right viewport
    const projRight = mat4.create();
    // ortho bounds: cover world x/z extents where cubes are placed
    const orthoSize = 10.0; // half-width
    mat4.ortho(projRight, -orthoSize, orthoSize, -orthoSize, orthoSize, 0.1, 100.0);

    // top-down view: camera above looking down along -Y
    const viewTop = mat4.create();
    const topCamPos = vec3.fromValues(0.0, 15.0, 0.0);
    const topTarget = vec3.fromValues(0.0, 0.0, 0.0);
    const topUp = vec3.fromValues(0.0, 0.0, -1.0); // rotate so +X to right, +Z forward
    mat4.lookAt(viewTop, topCamPos, topTarget, topUp);

    // draw scene in right viewport using orthographic top-down camera
    shader.use();
    shader.setMat4('u_view', viewTop);
    shader.setMat4('u_projection', projRight);

    for (let i = 0; i < cubePositions.length; ++i) {
        mat4.identity(modelMatrix);
        mat4.translate(modelMatrix, modelMatrix, cubePositions[i]);
        shader.setMat4('u_model', modelMatrix);
        switch(i) {
            case 0: cube0.draw(shader); break;
            case 1: cube1.draw(shader); break;
            case 2: cube2.draw(shader); break;
            case 3: cube3.draw(shader); break;
            case 4: cube4.draw(shader); break;
        }
    }

    axes.draw(viewTop, projRight);

    // disable scissor after per-viewport clears/draws
    gl.disable(gl.SCISSOR_TEST);

    // update overlay every frame with current camera info
    if (textOverlay) {
        updateText(textOverlay, `Camera pos: (${cameraPos[0].toFixed(2)}, ${cameraPos[1].toFixed(2)}, ${cameraPos[2].toFixed(2)}) | Yaw: ${yaw.toFixed(1)}° | Pitch: ${pitch.toFixed(1)}°`);
    }

    requestAnimationFrame(render);
}

async function main() {
    try {
        if (!initWebGL()) {
            throw new Error('Failed to initialize WebGL');
        }
        
        await initShader();

        // Projection transformation matrix (invariant in the program)
        mat4.perspective(
            projMatrix,
            glMatrix.toRadian(60),  // field of view (fov, degree)
            canvas.width / canvas.height, // aspect ratio
            0.1, // near
            100.0 // far
        );

        // 시작 시간과 마지막 프레임 시간 초기화
        startTime = Date.now();
        lastFrameTime = startTime;

        textOverlay = setupText(canvas, `Camera pos: (${cameraPos[0].toFixed(2)}, ${cameraPos[1].toFixed(2)}, ${cameraPos[2].toFixed(2)}) | Yaw: ${yaw.toFixed(1)}° | Pitch: ${pitch.toFixed(1)}°`, 1);
        setupText(canvas, "WASD: move | Mouse: rotate (click to lock) | ESC: unlock", 2);
        setupText(canvas, "Left: Perspective | Right: Orthographic (Top-Down)", 3);

        requestAnimationFrame(render);

        return true;

    } catch (error) {
        console.error('Failed to initialize program:', error);
        alert('Failed to initialize program');
        return false;
    }
}
