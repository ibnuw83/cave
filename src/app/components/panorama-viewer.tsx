
'use client';

import { ReactNode, useRef, useEffect } from 'react';

export function PanoramaViewer({ imageUrl, children }: { imageUrl: string; children: ReactNode }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl');
    if (!gl) {
      console.error('WebGL not supported');
      return;
    }

    const vertexShaderSource = `
      attribute vec2 a_position;
      varying vec2 v_texCoord;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_texCoord = a_position * 0.5 + 0.5;
      }
    `;

    const fragmentShaderSource = `
      precision mediump float;
      varying vec2 v_texCoord;
      uniform sampler2D u_texture;
      uniform mat3 u_rotation;

      const float PI = 3.14159265359;

      void main() {
        vec2 uv = v_texCoord;
        float lon = uv.x * 2.0 * PI - PI;
        float lat = uv.y * PI - PI / 2.0;

        vec3 direction = vec3(
          cos(lat) * sin(lon),
          sin(lat),
          cos(lat) * cos(lon)
        );
        
        vec3 rotatedDirection = u_rotation * direction;

        float u = 0.5 + atan(rotatedDirection.x, rotatedDirection.z) / (2.0 * PI);
        float v = 0.5 - asin(rotatedDirection.y) / PI;
        
        gl_FragColor = texture2D(u_texture, vec2(u, v));
      }
    `;

    function createShader(gl: WebGLRenderingContext, type: number, source: string) {
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

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Unable to initialize the shader program: ' + gl.getProgramInfoLog(program));
      return;
    }
    gl.useProgram(program);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const positions = [-1, -1, 1, -1, -1, 1, 1, 1];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    const positionAttributeLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);
    
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 255, 255])); // blue pixel

    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      render();
    };
    image.src = imageUrl;

    const rotationUniformLocation = gl.getUniformLocation(program, "u_rotation");
    
    let rotationY = 0;
    let rotationX = 0;
    let isDragging = false;
    let lastMouseX = 0;
    let lastMouseY = 0;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - lastMouseX;
      const dy = e.clientY - lastMouseY;
      rotationY += dx * 0.01;
      rotationX -= dy * 0.01;
      rotationX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, rotationX)); // Clamp vertical rotation
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    function render() {
        if (!gl) return;
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        // Create rotation matrices
        const rotY = [
            Math.cos(rotationY), 0, Math.sin(rotationY),
            0, 1, 0,
            -Math.sin(rotationY), 0, Math.cos(rotationY)
        ];
        const rotX = [
            1, 0, 0,
            0, Math.cos(rotationX), -Math.sin(rotationX),
            0, Math.sin(rotationX), Math.cos(rotationX)
        ];

        // Combine rotations (Y then X)
        const rotationMatrix = multiplyMatrices(rotX, rotY);
        
        gl.uniformMatrix3fv(rotationUniformLocation, false, rotationMatrix);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        requestAnimationFrame(render);
    }

    function multiplyMatrices(m1: number[], m2: number[]) {
        const result = [];
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                let sum = 0;
                for (let k = 0; k < 3; k++) {
                    sum += m1[i * 3 + k] * m2[k * 3 + j];
                }
                result[i * 3 + j] = sum;
            }
        }
        return result;
    }
    
    // Handle canvas resizing
    const resizeObserver = new ResizeObserver(entries => {
        for (let entry of entries) {
            const { width, height } = entry.contentRect;
            if(canvas){
                canvas.width = width;
                canvas.height = height;
            }
        }
    });

    resizeObserver.observe(canvas);
    
    render();

    return () => {
      canvas.removeEventListener('mousedown', onMouseDown);
      canvas.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      resizeObserver.disconnect();
    };
  }, [imageUrl]);

  return (
    <div className="relative w-full h-screen bg-black">
      <canvas ref={canvasRef} className="w-full h-full" />
      {children}
    </div>
  );
}
