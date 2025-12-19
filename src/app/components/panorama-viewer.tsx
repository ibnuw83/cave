
'use client';

import { ReactNode, useRef, useEffect } from 'react';

export function PanoramaViewer({ imageUrl, children }: { imageUrl: string, children: ReactNode }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl');
    if (!gl) {
      console.error('WebGL tidak didukung');
      return;
    }

    const vertexShaderSource = `
      attribute vec4 a_position;
      uniform mat4 u_matrix;
      varying vec2 v_texcoord;

      void main() {
        gl_Position = u_matrix * a_position;
        v_texcoord = a_position.xy * 0.5 + 0.5;
        // Invert Y for texture mapping
        v_texcoord.y = 1.0 - v_texcoord.y;
      }
    `;

    const fragmentShaderSource = `
      precision mediump float;
      varying vec2 v_texcoord;
      uniform sampler2D u_texture;

      void main() {
        gl_FragColor = texture2D(u_texture, v_texcoord);
      }
    `;

    function createShader(gl: WebGLRenderingContext, type: number, source: string) {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
      if (success) return shader;

      console.error(gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }

    function createProgram(gl: WebGLRenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader) {
      const program = gl.createProgram();
      if (!program) return null;
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
      const success = gl.getProgramParameter(program, gl.LINK_STATUS);
      if (success) return program;

      console.error(gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
      return null;
    }

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

    if (!vertexShader || !fragmentShader) return;
    const program = createProgram(gl, vertexShader, fragmentShader);
    if (!program) return;

    const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
    const matrixLocation = gl.getUniformLocation(program, "u_matrix");
    const textureLocation = gl.getUniformLocation(program, "u_texture");

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    // Create a sphere
    const sphereRadius = 1;
    const latitudeBands = 30;
    const longitudeBands = 30;
    const vertexPositionData: number[] = [];
    const textureCoordData: number[] = [];
    for (let latNumber = 0; latNumber <= latitudeBands; latNumber++) {
      const theta = latNumber * Math.PI / latitudeBands;
      const sinTheta = Math.sin(theta);
      const cosTheta = Math.cos(theta);
      for (let longNumber = 0; longNumber <= longitudeBands; longNumber++) {
        const phi = longNumber * 2 * Math.PI / longitudeBands;
        const sinPhi = Math.sin(phi);
        const cosPhi = Math.cos(phi);
        const x = cosPhi * sinTheta;
        const y = cosTheta;
        const z = sinPhi * sinTheta;
        const u = 1 - (longNumber / longitudeBands);
        const v = 1 - (latNumber / latitudeBands);
        textureCoordData.push(u, v);
        vertexPositionData.push(sphereRadius * x, sphereRadius * y, sphereRadius * z);
      }
    }

    const indexData: number[] = [];
    for (let latNumber = 0; latNumber < latitudeBands; latNumber++) {
      for (let longNumber = 0; longNumber < longitudeBands; longNumber++) {
        const first = (latNumber * (longitudeBands + 1)) + longNumber;
        const second = first + longitudeBands + 1;
        indexData.push(first, second, first + 1);
        indexData.push(second, second + 1, first + 1);
      }
    }

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexPositionData), gl.STATIC_DRAW);
    
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexData), gl.STATIC_DRAW);


    // Load texture
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 255, 255]));

    const image = new Image();
    image.crossOrigin = "anonymous";
    image.src = imageUrl;
    image.onload = () => {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      gl.generateMipmap(gl.TEXTURE_2D);
    };

    let rotationY = 0;
    let rotationX = -0.5; // Look slightly down
    let isDragging = false;
    let lastMouseX = 0;
    let lastMouseY = 0;

    canvas.onmousedown = (e) => {
      isDragging = true;
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
    };
    canvas.onmouseup = () => isDragging = false;
    canvas.onmouseleave = () => isDragging = false;
    canvas.onmousemove = (e) => {
      if (!isDragging) return;
      const dx = e.clientX - lastMouseX;
      const dy = e.clientY - lastMouseY;
      rotationY -= dx * 0.01;
      rotationX -= dy * 0.01;
      rotationX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, rotationX)); // Clamp vertical rotation
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
    };

    function drawScene() {
      if (!gl || !program) return;
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST);
      gl.useProgram(program);
      gl.enableVertexAttribArray(positionAttributeLocation);
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);

      const fieldOfView = 75 * Math.PI / 180;
      const aspect = (gl.canvas as HTMLCanvasElement).clientWidth / (gl.canvas as HTMLCanvasElement).clientHeight;
      const projectionMatrix = createPerspective(fieldOfView, aspect, 0.1, 100);
      
      let viewMatrix = createIdentity();
      viewMatrix = rotateX(viewMatrix, rotationX);
      viewMatrix = rotateY(viewMatrix, rotationY);
      
      // We are inside the sphere, so invert the view matrix
      viewMatrix = inverse(viewMatrix);

      const matrix = multiply(projectionMatrix, viewMatrix);

      gl.uniformMatrix4fv(matrixLocation, false, matrix);
      gl.uniform1i(textureLocation, 0);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
      gl.drawElements(gl.TRIANGLES, indexData.length, gl.UNSIGNED_SHORT, 0);
      requestAnimationFrame(drawScene);
    }
    
    requestAnimationFrame(drawScene);
    
    return () => {
      // Cleanup
    }

  }, [imageUrl]);

  return (
    <div className="relative w-full h-screen bg-black">
      <canvas ref={canvasRef} className="w-full h-full" width="1920" height="1080"/>
      {children}
    </div>
  );
}

// WebGL Math Helpers
function createPerspective(fov: number, aspect: number, near: number, far: number) {
  const f = 1.0 / Math.tan(fov / 2);
  const rangeInv = 1 / (near - far);
  return [
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (near + far) * rangeInv, -1,
    0, 0, near * far * rangeInv * 2, 0
  ];
}

function createIdentity() {
    return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
}

function multiply(a: number[], b: number[]) {
    let a00 = a[0*4+0], a01 = a[0*4+1], a02 = a[0*4+2], a03 = a[0*4+3];
    let a10 = a[1*4+0], a11 = a[1*4+1], a12 = a[1*4+2], a13 = a[1*4+3];
    let a20 = a[2*4+0], a21 = a[2*4+1], a22 = a[2*4+2], a23 = a[2*4+3];
    let a30 = a[3*4+0], a31 = a[3*4+1], a32 = a[3*4+2], a33 = a[3*4+3];
    let b00 = b[0*4+0], b01 = b[0*4+1], b02 = b[0*4+2], b03 = b[0*4+3];
    let b10 = b[1*4+0], b11 = b[1*4+1], b12 = b[1*4+2], b13 = b[1*4+3];
    let b20 = b[2*4+0], b21 = b[2*4+1], b22 = b[2*4+2], b23 = b[2*4+3];
    let b30 = b[3*4+0], b31 = b[3*4+1], b32 = b[3*4+2], b33 = b[3*4+3];
    return [
      b00*a00+b01*a10+b02*a20+b03*a30, b00*a01+b01*a11+b02*a21+b03*a31, b00*a02+b01*a12+b02*a22+b03*a32, b00*a03+b01*a13+b02*a23+b03*a33,
      b10*a00+b11*a10+b12*a20+b13*a30, b10*a01+b11*a11+b12*a21+b13*a31, b10*a02+b11*a12+b12*a22+b13*a32, b10*a03+b11*a13+b12*a23+b13*a33,
      b20*a00+b21*a10+b22*a20+b23*a30, b20*a01+b21*a11+b22*a21+b23*a31, b20*a02+b21*a12+b22*a22+b23*a32, b20*a03+b21*a13+b22*a23+b23*a33,
      b30*a00+b31*a10+b32*a20+b33*a30, b30*a01+b31*a11+b32*a21+b33*a31, b30*a02+b31*a12+b32*a22+b33*a32, b30*a03+b31*a13+b32*a23+b33*a33,
    ];
}

function rotateX(m: number[], angle: number) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    const m10 = m[4], m11 = m[5], m12 = m[6], m13 = m[7];
    const m20 = m[8], m21 = m[9], m22 = m[10], m23 = m[11];
    m[4] = m10 * c + m20 * s;
    m[5] = m11 * c + m21 * s;
    m[6] = m12 * c + m22 * s;
    m[7] = m13 * c + m23 * s;
    m[8] = m10 * -s + m20 * c;
    m[9] = m11 * -s + m21 * c;
    m[10] = m12 * -s + m22 * c;
    m[11] = m13 * -s + m23 * c;
    return m;
}

function rotateY(m: number[], angle: number) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    const m00 = m[0], m01 = m[1], m02 = m[2], m03 = m[3];
    const m20 = m[8], m21 = m[9], m22 = m[10], m23 = m[11];
    m[0] = m00 * c - m20 * s;
    m[1] = m01 * c - m21 * s;
    m[2] = m02 * c - m22 * s;
    m[3] = m03 * c - m23 * s;
    m[8] = m00 * s + m20 * c;
    m[9] = m01 * s + m21 * c;
    m[10] = m02 * s + m22 * c;
    m[11] = m03 * s + m23 * c;
    return m;
}

function inverse(m: number[]) {
    let m00 = m[0], m01 = m[1], m02 = m[2], m03 = m[3];
    let m10 = m[4], m11 = m[5], m12 = m[6], m13 = m[7];
    let m20 = m[8], m21 = m[9], m22 = m[10], m23 = m[11];
    let m30 = m[12], m31 = m[13], m32 = m[14], m33 = m[15];

    let b00 = m00 * m11 - m01 * m10;
    let b01 = m00 * m12 - m02 * m10;
    let b02 = m00 * m13 - m03 * m10;
    let b03 = m01 * m12 - m02 * m11;
    let b04 = m01 * m13 - m03 * m11;
    let b05 = m02 * m13 - m03 * m12;
    let b06 = m20 * m31 - m21 * m30;
    let b07 = m20 * m32 - m22 * m30;
    let b08 = m20 * m33 - m23 * m30;
    let b09 = m21 * m32 - m22 * m31;
    let b10 = m21 * m33 - m23 * m31;
    let b11 = m22 * m33 - m23 * m32;

    let det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
    if (!det) return m;
    det = 1.0 / det;

    let r = createIdentity();
    r[0] = (m11 * b11 - m12 * b10 + m13 * b09) * det;
    r[1] = (m02 * b10 - m01 * b11 - m03 * b09) * det;
    r[2] = (m31 * b05 - m32 * b04 + m33 * b03) * det;
    r[3] = (m22 * b04 - m21 * b05 - m23 * b03) * det;
    r[4] = (m12 * b08 - m10 * b11 - m13 * b07) * det;
    r[5] = (m00 * b11 - m02 * b08 + m03 * b07) * det;
    r[6] = (m32 * b02 - m30 * b05 - m33 * b01) * det;
    r[7] = (m20 * b05 - m22 * b02 + m23 * b01) * det;
    r[8] = (m10 * b10 - m11 * b08 + m13 * b06) * det;
    r[9] = (m01 * b08 - m00 * b10 - m03 * b06) * det;
    r[10] = (m30 * b04 - m31 * b02 + m33 * b00) * det;
    r[11] = (m21 * b02 - m20 * b04 - m23 * b00) * det;
    r[12] = (m11 * b07 - m10 * b09 - m12 * b06) * det;
    r[13] = (m00 * b09 - m01 * b07 + m02 * b06) * det;
    r[14] = (m31 * b01 - m30 * b03 - m32 * b00) * det;
    r[15] = (m20 * b03 - m21 * b01 + m22 * b00) * det;
    return r;
}

    