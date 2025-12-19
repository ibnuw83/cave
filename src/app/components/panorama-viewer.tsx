'use client';

import { ReactNode, useRef, useEffect } from 'react';

export function PanoramaViewer({
  imageUrl,
  children,
}: {
  imageUrl: string;
  children: ReactNode;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl');
    if (!gl) {
      console.error('WebGL tidak didukung');
      return;
    }

    // ===== AUTO RESIZE =====
    const resize = () => {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener('resize', resize);

    // ===== SHADERS =====
    const vsSource = `
      attribute vec3 a_position;
      uniform mat4 u_matrix;
      varying vec3 v_pos;
      void main() {
        v_pos = a_position;
        gl_Position = u_matrix * vec4(a_position, 1.0);
      }
    `;

    const fsSource = `
      precision mediump float;
      varying vec3 v_pos;
      uniform sampler2D u_texture;
      const float PI = 3.141592653589793;
      void main() {
        float lon = atan(v_pos.z, v_pos.x);
        float lat = acos(v_pos.y / length(v_pos));
        vec2 uv = vec2(lon / (2.0 * PI) + 0.5, lat / PI);
        gl_FragColor = texture2D(u_texture, uv);
      }
    `;

    const createShader = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(s));
        return null;
      }
      return s;
    };

    const program = gl.createProgram()!;
    gl.attachShader(program, createShader(gl.VERTEX_SHADER, vsSource)!);
    gl.attachShader(program, createShader(gl.FRAGMENT_SHADER, fsSource)!);
    gl.linkProgram(program);
    gl.useProgram(program);

    // ===== SPHERE =====
    const vertices: number[] = [];
    const indices: number[] = [];
    const latBands = 40;
    const lonBands = 40;

    for (let lat = 0; lat <= latBands; lat++) {
      const t = (lat * Math.PI) / latBands;
      for (let lon = 0; lon <= lonBands; lon++) {
        const p = (lon * 2 * Math.PI) / lonBands;
        vertices.push(
          Math.sin(t) * Math.cos(p),
          Math.cos(t),
          Math.sin(t) * Math.sin(p)
        );
      }
    }

    for (let lat = 0; lat < latBands; lat++) {
      for (let lon = 0; lon < lonBands; lon++) {
        const i = lat * (lonBands + 1) + lon;
        indices.push(i, i + lonBands + 1, i + 1);
        indices.push(i + lonBands + 1, i + lonBands + 2, i + 1);
      }
    }

    const vbo = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    const ibo = gl.createBuffer()!;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

    const posLoc = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);

    // ===== TEXTURE =====
    const tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;
    img.onload = () => {
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
      gl.generateMipmap(gl.TEXTURE_2D);
    };

    // ===== CAMERA =====
    let yaw = 0;
    let pitch = -0.3; // Start looking slightly down
    let dragging = false;
    let lastX = 0;
    let lastY = 0;

    canvas.onmousedown = e => {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
    };
    canvas.onmouseup = () => (dragging = false);
    canvas.onmouseout = () => (dragging = false); // Stop dragging if mouse leaves canvas
    canvas.onmousemove = e => {
      if (!dragging) return;
      yaw -= (e.clientX - lastX) * 0.005;
      pitch -= (e.clientY - lastY) * 0.005;
      pitch = Math.max(-1.5, Math.min(1.5, pitch)); // Clamp vertical rotation
      lastX = e.clientX;
      lastY = e.clientY;
    };
    
    // Touch controls
    canvas.ontouchstart = e => {
      dragging = true;
      lastX = e.touches[0].clientX;
      lastY = e.touches[0].clientY;
    };
    canvas.ontouchend = () => (dragging = false);
    canvas.ontouchmove = e => {
        if (!dragging) return;
        yaw -= (e.touches[0].clientX - lastX) * 0.005;
        pitch -= (e.touches[0].clientY - lastY) * 0.005;
        pitch = Math.max(-1.5, Math.min(1.5, pitch));
        lastX = e.touches[0].clientX;
        lastY = e.touches[0].clientY;
    };


    // ===== RENDER LOOP =====
    const mat4 = (fov: number) => {
      const a = canvas.width / canvas.height;
      const f = 1 / Math.tan(fov / 2);
      const near = 0.1;
      const far = 100;
      const nf = 1 / (near - far);
      return new Float32Array([
        f / a, 0, 0, 0,
        0, f, 0, 0,
        0, 0, (far + near) * nf, -1,
        0, 0, 2 * far * near * nf, 0,
      ]);
    };

    const uMatrix = gl.getUniformLocation(program, 'u_matrix');

    const render = () => {
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST);

      const projectionMatrix = mat4(1.2);
      
      const cy = Math.cos(yaw);
      const sy = Math.sin(yaw);
      const cp = Math.cos(pitch);
      const sp = Math.sin(pitch);
      
      const rotY = new Float32Array([
          cy, 0, -sy, 0,
          0, 1, 0, 0,
          sy, 0, cy, 0,
          0, 0, 0, 1
      ]);
      
      const rotX = new Float32Array([
          1, 0, 0, 0,
          0, cp, sp, 0,
          0, -sp, cp, 0,
          0, 0, 0, 1
      ]);

      const multiply = (a: Float32Array, b: Float32Array): Float32Array => {
          const out = new Float32Array(16);
          for(let i=0; i<4; i++) {
              for(let j=0; j<4; j++) {
                  out[i*4+j] = 0;
                  for(let k=0; k<4; k++) {
                      out[i*4+j] += a[i*4+k] * b[k*4+j];
                  }
              }
          }
          return out;
      }
      
      const viewMatrix = multiply(rotX, rotY);
      const finalMatrix = multiply(projectionMatrix, viewMatrix);

      gl.uniformMatrix4fv(uMatrix, false, finalMatrix);
      gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
      requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
    };
  }, [imageUrl]);

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden cursor-grab active:cursor-grabbing">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      {children}
    </div>
  );
}
