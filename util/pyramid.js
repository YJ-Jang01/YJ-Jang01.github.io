/*-----------------------------------------------------------------------------
class Pyramid

A pyramid with square base and triangular sides, standing upright along Y axis.

Base at y=0, apex at y=height.
-----------------------------------------------------------------------------*/

export class Pyramid {
    constructor(gl, options = {}) {
        this.gl = gl;

        // Creating VAO and buffers
        this.vao = gl.createVertexArray();
        this.vbo = gl.createBuffer();
        this.ebo = gl.createBuffer();

        // Base size and height
        const baseSize = 0.5;
        const height = 1.0;

        // Vertices: position (x,y,z), normal (nx,ny,nz), color (r,g,b,a), texCoord (u,v)
        // Base at y=0, apex at y=height
        this.vertices = new Float32Array([
            // Base vertices (y=0)
            -baseSize, 0, -baseSize,    0, -1, 0,    0.8, 0.8, 0.8, 1.0,    0, 0,  // v0
             baseSize, 0, -baseSize,    0, -1, 0,    0.8, 0.8, 0.8, 1.0,    1, 0,  // v1
             baseSize, 0,  baseSize,    0, -1, 0,    0.8, 0.8, 0.8, 1.0,    1, 1,  // v2
            -baseSize, 0,  baseSize,    0, -1, 0,    0.8, 0.8, 0.8, 1.0,    0, 1,  // v3
            // Apex
            0, height, 0,              0, 1, 0,     0.8, 0.8, 0.8, 1.0,    0.5, 0.5 // v4
        ]);

        // Calculate normals for sides
        const computeNormal = (v1, v2, v3) => {
            const u = [v2[0]-v1[0], v2[1]-v1[1], v2[2]-v1[2]];
            const v = [v3[0]-v1[0], v3[1]-v1[1], v3[2]-v1[2]];
            const n = [
                u[1]*v[2] - u[2]*v[1],
                u[2]*v[0] - u[0]*v[2],
                u[0]*v[1] - u[1]*v[0]
            ];
            const len = Math.sqrt(n[0]*n[0] + n[1]*n[1] + n[2]*n[2]);
            return [n[0]/len, n[1]/len, n[2]/len];
        };

        // Front face normal (v0,v1,v4) - towards +Z
        const frontNormal = computeNormal(
            [-baseSize, 0, -baseSize],
            [baseSize, 0, -baseSize],
            [0, height, 0]
        );

        // Right face normal (v1,v2,v4) - towards +X
        const rightNormal = computeNormal(
            [baseSize, 0, -baseSize],
            [baseSize, 0, baseSize],
            [0, height, 0]
        );

        // Back face normal (v2,v3,v4) - towards -Z
        const backNormal = computeNormal(
            [baseSize, 0, baseSize],
            [-baseSize, 0, baseSize],
            [0, height, 0]
        );

        // Left face normal (v3,v0,v4) - towards -X
        const leftNormal = computeNormal(
            [-baseSize, 0, baseSize],
            [-baseSize, 0, -baseSize],
            [0, height, 0]
        );

        // Revised vertices with duplication for flat shading
        this.vertices = new Float32Array([
            // Base
            -baseSize, 0, -baseSize,    0, -1, 0,    0.8, 0.8, 0.8, 1.0,    0, 0,
             baseSize, 0, -baseSize,    0, -1, 0,    0.8, 0.8, 0.8, 1.0,    1, 0,
             baseSize, 0,  baseSize,    0, -1, 0,    0.8, 0.8, 0.8, 1.0,    1, 1,
            -baseSize, 0,  baseSize,    0, -1, 0,    0.8, 0.8, 0.8, 1.0,    0, 1,
            // Front face
            -baseSize, 0, -baseSize,    ...frontNormal,    0.8, 0.8, 0.8, 1.0,    0, 0,
             baseSize, 0, -baseSize,    ...frontNormal,    0.8, 0.8, 0.8, 1.0,    1, 0,
             0, height, 0,              ...frontNormal,    0.8, 0.8, 0.8, 1.0,    0.5, 1,
            // Right face
             baseSize, 0, -baseSize,    ...rightNormal,    0.8, 0.8, 0.8, 1.0,    0, 0,
             baseSize, 0,  baseSize,    ...rightNormal,    0.8, 0.8, 0.8, 1.0,    1, 0,
             0, height, 0,              ...rightNormal,    0.8, 0.8, 0.8, 1.0,    0.5, 1,
            // Back face
             baseSize, 0,  baseSize,    ...backNormal,     0.8, 0.8, 0.8, 1.0,    0, 0,
            -baseSize, 0,  baseSize,    ...backNormal,     0.8, 0.8, 0.8, 1.0,    1, 0,
             0, height, 0,              ...backNormal,     0.8, 0.8, 0.8, 1.0,    0.5, 1,
            // Left face
            -baseSize, 0,  baseSize,    ...leftNormal,     0.8, 0.8, 0.8, 1.0,    0, 0,
            -baseSize, 0, -baseSize,    ...leftNormal,     0.8, 0.8, 0.8, 1.0,    1, 0,
             0, height, 0,              ...leftNormal,     0.8, 0.8, 0.8, 1.0,    0.5, 1
        ]);

        this.indices = new Uint16Array([
            // Base
            0, 3, 2,
            2, 1, 0,
            // Front
            4, 5, 6,
            // Right
            7, 8, 9,
            // Back
            10, 11, 12,
            // Left
            13, 14, 15
        ]);

        this.initBuffers();
    }

    initBuffers() {
        const gl = this.gl;
        gl.bindVertexArray(this.vao);

        // VBO
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.STATIC_DRAW);

        // EBO
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ebo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);

        // Position
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 12 * 4, 0);

        // Normal
        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 12 * 4, 3 * 4);

        // Color
        gl.enableVertexAttribArray(2);
        gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 12 * 4, 6 * 4);

        // TexCoord
        gl.enableVertexAttribArray(3);
        gl.vertexAttribPointer(3, 2, gl.FLOAT, false, 12 * 4, 10 * 4);

        gl.bindVertexArray(null);
    }

    draw(shader) {
        const gl = this.gl;
        shader.use();
        gl.bindVertexArray(this.vao);
        gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_SHORT, 0);
        gl.bindVertexArray(null);
    }
}