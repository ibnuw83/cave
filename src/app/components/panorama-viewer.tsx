
'use client';

import { ReactNode, useRef, useEffect } from 'react';

export function PanoramaViewer({ imageUrl, children }: { imageUrl: string, children: ReactNode }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl');
    if (!gl) {
      console.error("WebGL not supported");
      return;
    }

    const vertexShaderSource = `
      attribute vec4 aVertexPosition;
      uniform mat4 uModelViewMatrix;
      uniform mat4 uProjectionMatrix;
      varying highp vec2 vTextureCoord;

      void main(void) {
        gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
        vTextureCoord = aVertexPosition.xy;
      }
    `;
    
    // This shader correctly maps an equirectangular texture onto a sphere.
    const fragmentShaderSource = `
      precision highp float;
      varying highp vec2 vTextureCoord;
      uniform sampler2D uSampler;
      uniform mat4 uRotationMatrix;

      const float PI = 3.141592653589793;

      void main(void) {
        vec3 ray = (uRotationMatrix * vec4(vTextureCoord.x, vTextureCoord.y, 1.0, 1.0)).xyz;
        ray = normalize(ray);

        float lon = atan(ray.x, ray.z);
        float lat = asin(ray.y);

        vec2 textureCoord = vec2(lon / (2.0 * PI) + 0.5, lat / PI + 0.5);

        gl_FragColor = texture2D(uSampler, textureCoord);
      }
    `;

    const initShaderProgram = (gl: WebGLRenderingContext, vsSource: string, fsSource: string) => {
        const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
        const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);
        if (!vertexShader || !fragmentShader) return null;

        const shaderProgram = gl.createProgram();
        if (!shaderProgram) return null;

        gl.attachShader(shaderProgram, vertexShader);
        gl.attachShader(shaderProgram, fragmentShader);
        gl.linkProgram(shaderProgram);

        if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
            console.error('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
            return null;
        }
        return shaderProgram;
    };

    const loadShader = (gl: WebGLRenderingContext, type: number, source: string) => {
        const shader = gl.createShader(type);
        if (!shader) return null;
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    };
    
    const shaderProgram = initShaderProgram(gl, vertexShaderSource, fragmentShaderSource);
    if (!shaderProgram) return;

    const programInfo = {
        program: shaderProgram,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
        },
        uniformLocations: {
            projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
            modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
            rotationMatrix: gl.getUniformLocation(shaderProgram, 'uRotationMatrix'),
            uSampler: gl.getUniformLocation(shaderProgram, 'uSampler'),
        },
    };

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const positions = [-1.0, 1.0, 1.0, 1.0, -1.0, -1.0, 1.0, -1.0];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 255, 255]));
    
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    };
    image.src = imageUrl;

    let rotationX = 0;
    let rotationY = 0;
    let isDragging = false;
    let lastMouseX = 0;
    let lastMouseY = 0;

    const onMouseDown = (e: MouseEvent) => { isDragging = true; lastMouseX = e.clientX; lastMouseY = e.clientY; };
    const onMouseUp = () => { isDragging = false; };
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - lastMouseX;
      const dy = e.clientY - lastMouseY;
      rotationY -= dx * 0.005; // Note the -= for natural movement
      rotationX -= dy * 0.005;
      rotationX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, rotationX));
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
    };
    
    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('mouseleave', onMouseUp);
    canvas.addEventListener('mousemove', onMouseMove);
    
    let animationFrameId: number;

    const drawScene = () => {
      resizeCanvasToDisplaySize(gl.canvas as HTMLCanvasElement);
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      gl.clearColor(0.0, 0.0, 0.0, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.vertexAttribPointer(programInfo.attribLocations.vertexPosition, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
      
      gl.useProgram(programInfo.program);
      
      const projectionMatrix = mat4.create();
      mat4.ortho(projectionMatrix, -1, 1, -1, 1, -1, 1);
      
      const modelViewMatrix = mat4.create();

      const rotationMatrix = mat4.create();
      mat4.rotate(rotationMatrix, rotationMatrix, rotationX, [1, 0, 0]);
      mat4.rotate(rotationMatrix, rotationMatrix, rotationY, [0, 1, 0]);
      
      gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
      gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);
      gl.uniformMatrix4fv(programInfo.uniformLocations.rotationMatrix, false, rotationMatrix);
      
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.uniform1i(programInfo.uniformLocations.uSampler, 0);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      
      animationFrameId = requestAnimationFrame(drawScene);
    }
    
    drawScene();
    
    return () => {
        cancelAnimationFrame(animationFrameId);
        canvas.removeEventListener('mousedown', onMouseDown);
        canvas.removeEventListener('mouseup', onMouseUp);
        canvas.removeEventListener('mouseleave', onMouseUp);
        canvas.removeEventListener('mousemove', onMouseMove);
    }

  }, [imageUrl]);

  return (
    <div className="relative w-full h-screen bg-black">
      <canvas ref={canvasRef} className="w-full h-full" />
      {children}
    </div>
  );
}


// --- WebGL Helper Functions ---

const mat4 = {
    create: () => new Float32Array(16),
    ortho: (out: Float32Array, left: number, right: number, bottom: number, top: number, near: number, far: number) => {
        const lr = 1 / (left - right);
        const bt = 1 / (bottom - top);
        const nf = 1 / (near - far);
        out[0] = -2 * lr; out[1] = 0; out[2] = 0; out[3] = 0;
        out[4] = 0; out[5] = -2 * bt; out[6] = 0; out[7] = 0;
        out[8] = 0; out[9] = 0; out[10] = 2 * nf; out[11] = 0;
        out[12] = (left + right) * lr; out[13] = (top + bottom) * bt; out[14] = (far + near) * nf; out[15] = 1;
        return out;
    },
    rotate: (out: Float32Array, a: Float32Array, rad: number, axis: number[]) => {
        let [x, y, z] = axis; let len = Math.hypot(x, y, z);
        if (len < 1e-6) { return out; }
        len = 1 / len; x *= len; y *= len; z *= len;
        const s = Math.sin(rad); const c = Math.cos(rad); const t = 1 - c;
        const a00 = a[0]; const a01 = a[1]; const a02 = a[2]; const a03 = a[3];
        const a10 = a[4]; const a11 = a[5]; const a12 = a[6]; const a13 = a[7];
        const a20 = a[8]; const a21 = a[9]; const a22 = a[10]; const a23 = a[11];
        const b00 = x * x * t + c; const b01 = y * x * t + z * s; const b02 = z * x * t - y * s;
        const b10 = x * y * t - z * s; const b11 = y * y * t + c; const b12 = z * y * t + x * s;
        const b20 = x * z * t + y * s; const b21 = y * z * t - x * s; const b22 = z * z * t + c;
        out[0] = a00 * b00 + a10 * b01 + a20 * b02; out[1] = a01 * b00 + a11 * b01 + a21 * b02;
        out[2] = a02 * b00 + a12 * b01 + a22 * b02; out[3] = a03 * b00 + a13 * b01 + a23 * b02;
        out[4] = a00 * b10 + a10 * b11 + a20 * b12; out[5] = a01 * b10 + a11 * b11 + a21 * b12;
        out[6] = a02 * b10 + a12 * b11 + a22 * b12; out[7] = a03 * b10 + a13 * b11 + a23 * b12;
        out[8] = a00 * b20 + a10 * b21 + a20 * b22; out[9] = a01 * b20 + a11 * b21 + a21 * b22;
        out[10] = a02 * b20 + a12 * b21 + a22 * b22; out[11] = a03 * b20 + a13 * b21 + a23 * b22;
        if (a !== out) { out[12] = a[12]; out[13] = a[13]; out[14] = a[14]; out[15] = a[15]; }
        return out;
    },
};

function resizeCanvasToDisplaySize(canvas: HTMLCanvasElement) {
    const displayWidth  = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;
    if (canvas.width  !== displayWidth || canvas.height !== displayHeight) {
        canvas.width  = displayWidth;
        canvas.height = displayHeight;
        return true;
    }
    return false;
}
