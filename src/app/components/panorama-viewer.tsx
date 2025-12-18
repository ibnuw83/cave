
'use client';

import { useRef, useEffect, useState, ReactNode } from 'react';
import { Button } from '@/components/ui/button';

export function PanoramaViewer({ imageUrl, children }: { imageUrl: string, children: ReactNode }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isGyroActive, setIsGyroActive] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  const rotation = useRef({ lon: 90, lat: 0 });
  const fov = useRef(75);

  useEffect(() => {
     // Ensure this runs only on the client
     if (typeof window !== 'undefined') {
        setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
     }
  }, []);

  const requestGyro = async () => {
    // Standard permission request for iOS 13+
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      try {
        const permissionState = await (DeviceOrientationEvent as any).requestPermission();
        if (permissionState === 'granted') {
          setIsGyroActive(true);
        }
      } catch (error) {
        console.error('Gyro permission request failed:', error);
      }
    } else {
        // For other devices (like Android), just enable it
        setIsGyroActive(true);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl');
    if (!gl) {
      console.error('WebGL not supported');
      return;
    }
    
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let frameId: number;

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 255, 255])); // blue pixel

    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    };

    if (imageUrl.startsWith('https://images.unsplash.com/')) {
        image.src = imageUrl.replace('https://images.unsplash.com', '/image-proxy');
    } else {
        image.src = imageUrl;
    }


    const sphere = createSphere(gl, 50, 50);

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, `
      attribute vec3 aVertexPosition;
      attribute vec2 aTextureCoord;
      uniform mat4 uMVMatrix;
      uniform mat4 uPMatrix;
      varying highp vec2 vTextureCoord;
      void main(void) {
        gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
        vTextureCoord = aTextureCoord;
      }
    `);

    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, `
      varying highp vec2 vTextureCoord;
      uniform sampler2D uSampler;
      void main(void) {
        gl_FragColor = texture2D(uSampler, vec2(1.0 - vTextureCoord.s, vTextureCoord.t));
      }
    `);
      
    if(!vertexShader || !fragmentShader) return;

    const shaderProgram = createProgram(gl, vertexShader, fragmentShader);
    
    if(!shaderProgram) return;

    const programInfo = {
      program: shaderProgram,
      attribLocations: {
        vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
        textureCoord: gl.getAttribLocation(shaderProgram, 'aTextureCoord'),
      },
      uniformLocations: {
        projectionMatrix: gl.getUniformLocation(shaderProgram, 'uPMatrix'),
        modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uMVMatrix'),
        uSampler: gl.getUniformLocation(shaderProgram, 'uSampler'),
      },
    };

    function render() {
        if (!gl || gl.isContextLost()) return;

        // Handle canvas resize
        const displayWidth  = gl.canvas.clientWidth;
        const displayHeight = gl.canvas.clientHeight;
        if (gl.canvas.width  !== displayWidth || gl.canvas.height !== displayHeight) {
            gl.canvas.width  = displayWidth;
            gl.canvas.height = displayHeight;
            gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        }

        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        const projectionMatrix = mat4.create();
        mat4.perspective(projectionMatrix, fov.current * Math.PI / 180, aspect, 0.1, 100.0);

        const modelViewMatrix = mat4.create();
        mat4.rotate(modelViewMatrix, modelViewMatrix, rotation.current.lat * Math.PI / 180, [1, 0, 0]);
        mat4.rotate(modelViewMatrix, modelViewMatrix, rotation.current.lon * Math.PI / 180, [0, 1, 0]);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, sphere.vertex);
        gl.vertexAttribPointer(programInfo.attribLocations.vertexPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);

        gl.bindBuffer(gl.ARRAY_BUFFER, sphere.texture);
        gl.vertexAttribPointer(programInfo.attribLocations.textureCoord, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(programInfo.attribLocations.textureCoord);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphere.index);
        gl.useProgram(programInfo.program);
        gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
        gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);
        
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(programInfo.uniformLocations.uSampler, 0);

        gl.drawElements(gl.TRIANGLES, sphere.numIndices, gl.UNSIGNED_SHORT, 0);
        
        frameId = requestAnimationFrame(render);
    }

    render();
    
    // --- Event Handlers ---
    function onMouseDown(event: MouseEvent) { isDragging = true; previousMousePosition = { x: event.clientX, y: event.clientY }; }
    function onTouchStart(event: TouchEvent) { isDragging = true; previousMousePosition = { x: event.touches[0].clientX, y: event.touches[0].clientY }; }
    function onMouseUp() { isDragging = false; }
    function onTouchEnd() { isDragging = false; }
    function onMouseMove(event: MouseEvent) {
      if (!isDragging) return;
      const deltaX = event.clientX - previousMousePosition.x;
      const deltaY = event.clientY - previousMousePosition.y;
      rotation.current.lon -= deltaX * 0.1;
      rotation.current.lat -= deltaY * 0.1;
      rotation.current.lat = Math.max(-85, Math.min(85, rotation.current.lat)); // Clamp latitude
      previousMousePosition = { x: event.clientX, y: event.clientY };
    }
     function onTouchMove(event: TouchEvent) {
      if (!isDragging) return;
      const deltaX = event.touches[0].clientX - previousMousePosition.x;
      const deltaY = event.touches[0].clientY - previousMousePosition.y;
      rotation.current.lon -= deltaX * 0.1;
      rotation.current.lat -= deltaY * 0.1;
      rotation.current.lat = Math.max(-85, Math.min(85, rotation.current.lat)); // Clamp latitude
      previousMousePosition = { x: event.touches[0].clientX, y: event.touches[0].clientY };
    }
    function onWheel(event: WheelEvent) {
        event.preventDefault();
        fov.current += event.deltaY * 0.05;
        fov.current = Math.max(30, Math.min(100, fov.current)); // Clamp FOV
    }
    
    let initialAlpha: number | null = null;
    function onDeviceOrientation(event: DeviceOrientationEvent) {
        if (!isGyroActive || event.alpha === null || event.beta === null) return;
        
        if (initialAlpha === null) {
            initialAlpha = event.alpha;
        }

        // Adjust alpha to be relative to the initial orientation
        const relativeAlpha = event.alpha - initialAlpha;
        
        // This is a simplified mapping and might need calibration/adjustment
        rotation.current.lon = -relativeAlpha;
        rotation.current.lat = event.beta - 90;
        rotation.current.lat = Math.max(-85, Math.min(85, rotation.current.lat));
    }


    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('touchstart', onTouchStart);
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('touchend', onTouchEnd);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('touchmove', onTouchMove);
    canvas.addEventListener('wheel', onWheel);
    window.addEventListener('deviceorientation', onDeviceOrientation);


    return () => {
      cancelAnimationFrame(frameId);
      canvas.removeEventListener('mousedown', onMouseDown);
      canvas.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('touchend', onTouchEnd);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('wheel', onWheel);
      window.removeEventListener('deviceorientation', onDeviceOrientation);
       if (gl && !gl.isContextLost()) {
          gl.deleteProgram(programInfo.program);
          gl.deleteShader(vertexShader);
          gl.deleteShader(fragmentShader);
          gl.deleteBuffer(sphere.vertex);
          gl.deleteBuffer(sphere.texture);
          gl.deleteBuffer(sphere.index);
          gl.deleteTexture(texture);
       }
    };

  }, [imageUrl, isGyroActive]);

  return (
    <div className="relative w-full h-screen bg-black">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
       {children}
       {isMobile && !isGyroActive && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/50">
          <Button onClick={requestGyro} variant="secondary">Aktifkan Mode Gyro</Button>
        </div>
      )}
    </div>
  );
}


// --- WebGL Helper Functions ---

function createShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
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
}

function createProgram(gl: WebGLRenderingContext, vs: WebGLShader, fs: WebGLShader): WebGLProgram | null {
  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Unable to initialize the shader program: ' + gl.getProgramInfoLog(program));
    return null;
  }
  return program;
}

function createSphere(gl: WebGLRenderingContext, latitudeBands: number, longitudeBands: number) {
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
      vertexPositionData.push(10 * x, 10 * y, 10 * z);
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

  const vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexPositionData), gl.STATIC_DRAW);

  const textureBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordData), gl.STATIC_DRAW);

  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexData), gl.STATIC_DRAW);

  return { vertex: vertexBuffer, texture: textureBuffer, index: indexBuffer, numIndices: indexData.length };
}


// A minimal mat4 library for transformations
const mat4 = {
  create: () => {
    let out = new Float32Array(16);
    out[0] = 1;
    out[5] = 1;
    out[10] = 1;
    out[15] = 1;
    return out;
  },
  perspective: (out: Float32Array, fovy: number, aspect: number, near: number, far: number) => {
    const f = 1.0 / Math.tan(fovy / 2);
    out[0] = f / aspect; out[1] = 0; out[2] = 0; out[3] = 0;
    out[4] = 0; out[5] = f; out[6] = 0; out[7] = 0;
    out[8] = 0; out[9] = 0; out[11] = -1; out[12] = 0; out[13] = 0; out[15] = 0;
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
  rotate: (out: Float32Array, a: Float32Array, rad: number, axis: number[]) => {
    let [x, y, z] = axis;
    let len = Math.hypot(x, y, z);
    if (len < 0.000001) { return null; }
    len = 1 / len;
    x *= len; y *= len; z *= len;
    const s = Math.sin(rad);
    const c = Math.cos(rad);
    const t = 1 - c;
    const a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
    const a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
    const a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
    const b00 = x * x * t + c, b01 = y * x * t + z * s, b02 = z * x * t - y * s;
    const b10 = x * y * t - z * s, b11 = y * y * t + c, b12 = z * y * t + x * s;
    const b20 = x * z * t + y * s, b21 = y * z * t - x * s, b22 = z * z * t + c;
    out[0] = a00 * b00 + a10 * b01 + a20 * b02;
    out[1] = a01 * b00 + a11 * b01 + a21 * b02;
    out[2] = a02 * b00 + a12 * b01 + a22 * b02;
    out[3] = a03 * b00 + a13 * b01 + a23 * b02;
    out[4] = a00 * b10 + a10 * b11 + a20 * b12;
    out[5] = a01 * b10 + a11 * b11 + a21 * b12;
    out[6] = a02 * b10 + a12 * b11 + a22 * b12;
    out[7] = a03 * b10 + a13 * b11 + a23 * b12;
    out[8] = a00 * b20 + a10 * b21 + a20 * b22;
    out[9] = a01 * b20 + a11 * b21 + a21 * b22;
    out[10] = a02 * b20 + a12 * b21 + a22 * b22;
    out[11] = a03 * b20 + a13 * b21 + a23 * b22;
    if (a !== out) {
      out[12] = a[12]; out[13] = a[13]; out[14] = a[14]; out[15] = a[15];
    }
    return out;
  }
};
