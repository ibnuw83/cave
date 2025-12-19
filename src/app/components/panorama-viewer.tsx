'use client';

import { ReactNode, useRef, useEffect } from 'react';

// Matriks dan utilitas vektor untuk WebGL
const mat4 = {
  perspective: function (out: number[], fovy: number, aspect: number, near: number, far: number) {
    const f = 1.0 / Math.tan(fovy / 2);
    out[0] = f / aspect;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = f;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[11] = -1;
    out[12] = 0;
    out[13] = 0;
    out[15] = 0;
    if (far != null && far !== Infinity) {
      const nf = 1 / (near - far);
      out[10] = (far + near) * nf;
      out[14] = 2 * far * near * nf;
    } else {
      out[10] = -1;
      out[14] = -2 * near;
    }
    return out;
  },
  create: function () {
    let out = new Float32Array(16);
    out[0] = 1;
    out[5] = 1;
    out[10] = 1;
    out[15] = 1;
    return out;
  },
    rotateX: function (out: number[], a: number[], rad: number) {
    let s = Math.sin(rad);
    let c = Math.cos(rad);
    let a10 = a[4];
    let a11 = a[5];
    let a12 = a[6];
    let a13 = a[7];
    let a20 = a[8];
    let a21 = a[9];
    let a22 = a[10];
    let a23 = a[11];

    if (a !== out) {
      out[0] = a[0];
      out[1] = a[1];
      out[2] = a[2];
      out[3] = a[3];
      out[12] = a[12];
      out[13] = a[13];
      out[14] = a[14];
      out[15] = a[15];
    }
    out[4] = a10 * c + a20 * s;
    out[5] = a11 * c + a21 * s;
    out[6] = a12 * c + a22 * s;
    out[7] = a13 * c + a23 * s;
    out[8] = a20 * c - a10 * s;
    out[9] = a21 * c - a11 * s;
    out[10] = a22 * c - a12 * s;
    out[11] = a23 * c - a13 * s;
    return out;
  },
    rotateY: function (out: number[], a: number[], rad: number) {
    let s = Math.sin(rad);
    let c = Math.cos(rad);
    let a00 = a[0];
    let a01 = a[1];
    let a02 = a[2];
    let a03 = a[3];
    let a20 = a[8];
    let a21 = a[9];
    let a22 = a[10];
    let a23 = a[11];
    if (a !== out) {
      out[4] = a[4];
      out[5] = a[5];
      out[6] = a[6];
      out[7] = a[7];
      out[12] = a[12];
      out[13] = a[13];
      out[14] = a[14];
      out[15] = a[15];
    }
    out[0] = a00 * c - a20 * s;
    out[1] = a01 * c - a21 * s;
    out[2] = a02 * c - a22 * s;
    out[3] = a03 * c - a23 * s;
    out[8] = a00 * s + a20 * c;
    out[9] = a01 * s + a21 * c;
    out[10] = a02 * s + a22 * c;
    out[11] = a03 * s + a23 * c;
    return out;
  },
};

export function PanoramaViewer({ imageUrl, children }: { imageUrl: string; children: ReactNode }) {
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
      attribute vec3 a_position;
      uniform mat4 u_projection;
      uniform mat4 u_view;
      varying vec3 v_texcoord;
      void main() {
        gl_Position = u_projection * u_view * vec4(a_position, 1.0);
        v_texcoord = a_position;
      }
    `;

    const fragmentShaderSource = `
      precision mediump float;
      uniform sampler2D u_texture;
      varying vec3 v_texcoord;
      void main() {
        vec3 normal = normalize(v_texcoord);
        float phi = atan(normal.z, normal.x);
        float theta = asin(normal.y);
        vec2 uv = vec2(phi / (2.0 * 3.1415926535) + 0.5, theta / 3.1415926535 + 0.5);
        gl_FragColor = texture2D(u_texture, uv);
      }
    `;

    function createShader(gl: WebGLRenderingContext, type: number, source: string) {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Gagal mengompilasi shader:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Gagal menautkan program:', gl.getProgramInfoLog(program));
      return;
    }
    gl.useProgram(program);

    const positionLocation = gl.getAttribLocation(program, 'a_position');
    const projectionLocation = gl.getUniformLocation(program, 'u_projection');
    const viewLocation = gl.getUniformLocation(program, 'u_view');
    const textureLocation = gl.getUniformLocation(program, 'u_texture');

    // Buat bola (sphere)
    const latitudeBands = 30;
    const longitudeBands = 30;
    const radius = 2;
    const vertexPositionData: number[] = [];
    const indexData: number[] = [];
    for (let latNumber = 0; latNumber <= latitudeBands; latNumber++) {
      const theta = (latNumber * Math.PI) / latitudeBands;
      const sinTheta = Math.sin(theta);
      const cosTheta = Math.cos(theta);
      for (let longNumber = 0; longNumber <= longitudeBands; longNumber++) {
        const phi = (longNumber * 2 * Math.PI) / longitudeBands;
        const sinPhi = Math.sin(phi);
        const cosPhi = Math.cos(phi);
        const x = cosPhi * sinTheta;
        const y = cosTheta;
        const z = sinPhi * sinTheta;
        vertexPositionData.push(radius * x, radius * y, radius * z);
      }
    }
    for (let latNumber = 0; latNumber < latitudeBands; latNumber++) {
      for (let longNumber = 0; longNumber < longitudeBands; longNumber++) {
        const first = latNumber * (longitudeBands + 1) + longNumber;
        const second = first + longitudeBands + 1;
        indexData.push(first, second, first + 1, second, second + 1, first + 1);
      }
    }

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexPositionData), gl.STATIC_DRAW);

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexData), gl.STATIC_DRAW);

    // Muat tekstur
    const texture = gl.createTexture();
    const image = new Image();
    image.crossOrigin = 'anonymous'; // Penting untuk WebGL
    image.src = imageUrl;
    image.onload = () => {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.bindTexture(gl.TEXTURE_2D, null);
      render();
    };

    let rotationY = 0;
    let rotationX = 0;
    let isDragging = false;
    let lastMouseX = 0;
    let lastMouseY = 0;

    const onMouseDown = (e: MouseEvent | TouchEvent) => {
      isDragging = true;
      lastMouseX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      lastMouseY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    };
    const onMouseUp = () => isDragging = false;
    const onMouseMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const deltaX = clientX - lastMouseX;
      const deltaY = clientY - lastMouseY;
      rotationY += deltaX * 0.01;
      rotationX += deltaY * 0.01;
      rotationX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, rotationX)); // Batasi rotasi vertikal
      lastMouseX = clientX;
      lastMouseY = clientY;
    };

    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('mouseleave', onMouseUp);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('touchstart', onMouseDown);
    canvas.addEventListener('touchend', onMouseUp);
    canvas.addEventListener('touchmove', onMouseMove);

    function render() {
      if (!gl || gl.isContextLost()) return;
      
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);

      gl.clearColor(0.0, 0.0, 0.0, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST);

      const projectionMatrix = mat4.create();
      mat4.perspective(projectionMatrix, (45 * Math.PI) / 180, canvas.width / canvas.height, 0.1, 100.0);

      const viewMatrix = mat4.create();
      mat4.rotateX(viewMatrix, viewMatrix, rotationX);
      mat4.rotateY(viewMatrix, viewMatrix, rotationY);
      
      gl.useProgram(program);

      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(positionLocation);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.uniform1i(textureLocation, 0);

      gl.uniformMatrix4fv(projectionLocation, false, projectionMatrix);
      gl.uniformMatrix4fv(viewLocation, false, viewMatrix);

      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
      gl.drawElements(gl.TRIANGLES, indexData.length, gl.UNSIGNED_SHORT, 0);
      
      requestAnimationFrame(render);
    }
    
    let frameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(frameId);
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      gl.deleteBuffer(positionBuffer);
      gl.deleteBuffer(indexBuffer);
      gl.deleteTexture(texture);
      canvas.removeEventListener('mousedown', onMouseDown);
      canvas.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('mouseleave', onMouseUp);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('touchstart', onMouseDown);
      canvas.removeEventListener('touchend', onMouseUp);
      canvas.removeEventListener('touchmove', onMouseMove);
    };
  }, [imageUrl]);

  return (
    <div className="relative w-full h-screen bg-black">
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
      {children}
    </div>
  );
}
