// HelloTriangle.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE =
'attribute vec4 a_Position;\n' +
'attribute vec4 a_Color;\n' +
'varying vec4 v_Color;\n' + // varying variable
'uniform mat4 u_xformMatrix;\n' +
'uniform mat4 u_globalRotation;\n' +
'void main() {\n' +
'gl_Position = u_globalRotation * u_xformMatrix * a_Position ;\n' +
'v_Color = a_Color;\n' + 
'}\n';
// Fragment shader program
var FSHADER_SOURCE =
  'precision mediump float;\n' + // Precision qualifier (See Chapter 6)
  'varying vec4 v_Color;\n' +    // Receive the data from the vertex shader
  'void main() {\n' +
  'gl_FragColor = v_Color;\n' +
  '}\n';

var cubes = [];
var cubeColors = [];
var transforms = [];
var cubeSize = 0.1;
var bgColor = [1.0, 0.8, 0.8, 1.0];
// var bgColor = [1.0, 0.8, 0.8, 1.0];

var rotationUpdated = false;
var globalAngle;
var canvas;
var cubeSides = [];
var time;

var ANGLE;
var ANGLE_STEP = 1.8;
var Y_STEP = 0.01;
var BEND_STEP = 5.0;
var Y_STEPD = -0.05;
var rotationSlider = document.getElementById("rotation");
var gl;

function main() {
    var canvas = document.getElementById("webgl");
    gl = getWebGLContext(canvas);
    gl.enable(gl.DEPTH_TEST);
  if (!gl) {
    console.log("Failed to get the rendering context for WebGL");
    return;
  }

  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log("Failed to intialize shaders.");
    return;
  }
    var u_globalRotation = gl.getUniformLocation(gl.program, 'u_globalRotation');
  if (!u_globalRotation) {
    console.log('Failed to get the storage location of u_globalRotation in main');
    return;
  }
  var u_xformMatrix = gl.getUniformLocation(gl.program, 'u_xformMatrix');
  if (!u_xformMatrix) {
    console.log('Failed to get the storage location of u_xformMatrix in main');
    return;
  }
  
  // Current rotation angle
  // Model matrix
  var vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.clearColor(bgColor[0], bgColor[1], bgColor[2], 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  // Start drawing
  var currentAngle = 0.0;
  var currentY = 0.0;
  var currentBend = 0.0;
  var tick = function() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    var updatedFrames = animate(currentAngle, currentY, currentBend);
    currentAngle = updatedFrames[0];
    currentY = updatedFrames[1];
    currentBend = updatedFrames[2];
    var traveled = 0;
      // Update the rotation angle
    renderScene(currentAngle, currentY, currentBend);
    if(currentAngle > 3) {
      ANGLE_STEP = -ANGLE_STEP;
    } else if (currentAngle < 0) {
      ANGLE_STEP = Math.abs(ANGLE_STEP);
    }

    // traveled += traveled + Math.abs(currentY);
    if(currentY > 0.01) {
      Y_STEP = -Y_STEP;
    } else if(currentY < -0.02) {
      Y_STEP = Math.abs(Y_STEP);
    }

    if(currentBend > 7) {
      BEND_STEP = -BEND_STEP;
    } else if(currentBend < -5) {
      BEND_STEP = Math.abs(BEND_STEP);
    }

    requestAnimationFrame(tick, canvas); // Request that the browser calls tick
  };

  tick();


  rotationSlider.oninput = function() {
    globalAngle = parseFloat(this.value);
    rotationUpdated = true;
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    renderScene(currentAngle, currentY, animationJoint);
  };


}

var g_last = Date.now();
function animate(angle, legY, bendX) {
  var frames = [];
  // Calculate the elapsed time
  var now = Date.now();
  var elapsed = now - g_last;
  g_last = now;
  // Update the current rotation angle (adjusted by the elapsed time)
  var newAngle = angle + (ANGLE_STEP * elapsed) / 1000.0;
  frames.push(newAngle % 360);
  // return newAngle %= 360;
  var newY = legY + (Y_STEP * elapsed) / 1000.0;
  frames.push(newY);

  var newBend = bendX + (BEND_STEP * elapsed) / 1000.0;
  frames.push(newBend % 360);
  return frames;
}

function renderScene(animationAngle, animationY, animationBend) {
  // Colors
  var white = [1,1,1];
  var grey = [0.8, 0.8, 0.8];
  var black = [0,0,0];
  var browngrey = [0.65, 0.65,0.6];
  var lightgrey = [0.95, 0.95, 0.93];
  var red = [1.0, 0.0, 0.0];
  var blue = [0.0, 0.0, 1.0];
  var radian = Math.PI * ANGLE / 180.0; // Convert to radians
  var cosB = Math.cos(radian), sinB = Math.sin(radian);
  var Tx, Ty, Tz;
  var angle;

  var u_globalRotation = gl.getUniformLocation(gl.program, 'u_globalRotation');
  if (!u_globalRotation) {
    console.log('Failed to get the storage location of u_globalRotation');
    return;
  }
  var u_xformMatrix = gl.getUniformLocation(gl.program, 'u_xformMatrix');
  if (!u_xformMatrix) {
    console.log('Failed to get the storage location of u_xformMatrix');
    return;
  }

  var r_Matrix = new Matrix4();
  var xformMatrix = new Matrix4();

  if(rotationUpdated) {
    r_Matrix.setRotate(globalAngle, 0, 1, 0);
    gl.uniformMatrix4fv(u_globalRotation, false, r_Matrix.elements);
  } else {
    r_Matrix.setIdentity();
    gl.uniformMatrix4fv(u_globalRotation, false, r_Matrix.elements);
  }

// Base body 
  var bodyMatrix = new Matrix4();
  bodyMatrix.setTranslate(0, animationY, 0);
  xformMatrix.setRotate(35,0,1,0);
  xformMatrix.rotate(-10,1,0,0);
  xformMatrix.scale(1.4, 1.1, 1.1);
  xformMatrix.multiply(bodyMatrix);
  gl.uniformMatrix4fv(u_xformMatrix, false, xformMatrix.elements);
  drawCube(gl, canvas, grey, white, white, white, white, white);
  // drawCube(gl, canvas, blue, blue, blue, blue, blue, blue);

// Back of base body
  xformMatrix.scale(1.2, 1.2, 1.2);
  xformMatrix.translate(0, 0.02, 0.25);
  gl.uniformMatrix4fv(u_xformMatrix, false, xformMatrix.elements);
  drawCube(gl, canvas, grey, white, white, white, white, white);
  // drawCube(gl, canvas, browngrey, blue, blue, blue, blue, blue);

  // Head
  xformMatrix = new Matrix4();
  xformMatrix.setRotate(35,0,1,0);
  xformMatrix.rotate(-10,1,0,0);
  xformMatrix.scale(0.8,0.8,0.8);
  xformMatrix.translate(0, 0, -0.32);

  var rotationMatrix = new Matrix4();
    bodyMatrix.setTranslate(0, animationY, 0);

  rotationMatrix.setRotate(animationAngle, 1, 0, 0);
  xformMatrix.translate(0, animationY, 0);
  xformMatrix.multiply(rotationMatrix);
  gl.uniformMatrix4fv(u_xformMatrix, false, xformMatrix.elements);
  // drawCube(gl, canvas, grey, white, white, white, white, white);
  drawCube(gl, canvas, lightgrey, lightgrey, white, white, white, white);


//   // Snout
  xformMatrix.scale(0.8, 0.5, 0.5);
  xformMatrix.translate(0, -0.15, -0.45);
  gl.uniformMatrix4fv(u_xformMatrix, false, xformMatrix.elements);
  drawCube(gl, canvas, lightgrey, lightgrey, white, white, white, white);

  xformMatrix.scale(0.8, 0.5, 0.5);
  xformMatrix.translate(0, -0.13, -0.2);
  gl.uniformMatrix4fv(u_xformMatrix, false, xformMatrix.elements);
  drawCube(gl, canvas, black, black, black, black, black, black);


// Eyeballs 
  xformMatrix.scale(0.2, 0.4, -0.8);
  xformMatrix.translate(-0.75, 1.3, -0.65);
  gl.uniformMatrix4fv(u_xformMatrix, false, xformMatrix.elements);
  drawCube(gl, canvas, black, black, black, black, black, black);

  xformMatrix.translate(1.5, 0, 0);
  gl.uniformMatrix4fv(u_xformMatrix, false, xformMatrix.elements);
  drawCube(gl, canvas, black, black, black, black, black, black);

  // Eyebrows
  xformMatrix.scale(2.5, 1, 1);
  xformMatrix.translate(0, 0.3, 0);
  gl.uniformMatrix4fv(u_xformMatrix, false, xformMatrix.elements);
  drawCube(gl, canvas, browngrey, browngrey, browngrey, browngrey, browngrey, browngrey);

  xformMatrix.translate(-0.6, 0, 0);
  gl.uniformMatrix4fv(u_xformMatrix, false, xformMatrix.elements);
  drawCube(gl, canvas, browngrey, browngrey, browngrey, browngrey, browngrey, browngrey);

  // Ears 
  xformMatrix.scale(1, 3, 1);
  xformMatrix.translate(-0.1, 0.3, -0.5);
  gl.uniformMatrix4fv(u_xformMatrix, false, xformMatrix.elements);
  drawCube(gl, canvas, browngrey, browngrey, browngrey, browngrey, browngrey, browngrey);

  xformMatrix.translate(0.8, 0, 0);
  gl.uniformMatrix4fv(u_xformMatrix, false, xformMatrix.elements);
  drawCube(gl, canvas,  browngrey, browngrey, browngrey, browngrey, browngrey, browngrey);

  animationMatrix = new Matrix4();
  animationMatrix.setIdentity();
  animationMatrix.rotate(animationBend, 1, 0, 0);
  animationMatrix.translate(0, animationY, 0);
//   // Legzz
//   // front right
  xformMatrix = new Matrix4();
  xformMatrix.setRotate(35,0,1,0);
  xformMatrix.rotate(-10,1,0,0);
  xformMatrix.scale(0.45, 0.8, 0.7);
  xformMatrix.translate(-0.2, -0.32, 0);
  xformMatrix.multiply(animationMatrix);
  gl.uniformMatrix4fv(u_xformMatrix, false, xformMatrix.elements);
  drawCube(gl, canvas, white, white, white, white, lightgrey, lightgrey);


// // front left
  xformMatrix = new Matrix4();
  xformMatrix.setRotate(35,0,1,0);
  xformMatrix.rotate(-10,1,0,0);
  xformMatrix.scale(0.45, 0.8, 0.7);
  xformMatrix.translate(0.2, -0.32, 0);
  xformMatrix.multiply(animationMatrix);
  gl.uniformMatrix4fv(u_xformMatrix, false, xformMatrix.elements);
  drawCube(gl, canvas, white, white, white, white, lightgrey, lightgrey);


// //   // back left 
  xformMatrix = new Matrix4();
  xformMatrix.setRotate(35,0,1,0);
  xformMatrix.rotate(-10,1,0,0);
  xformMatrix.scale(0.45, 0.8, 0.7);
  xformMatrix.translate(0.2, -0.32, 0.5);
  xformMatrix.multiply(animationMatrix);
  gl.uniformMatrix4fv(u_xformMatrix, false, xformMatrix.elements);
  drawCube(gl, canvas, white, grey, white, white, lightgrey, lightgrey);

// // //   //back right
  xformMatrix = new Matrix4();
  xformMatrix.setRotate(35,0,1,0);
  xformMatrix.rotate(-10,1,0,0);
  xformMatrix.scale(0.45, 0.8, 0.7);
  xformMatrix.translate(-0.2, -0.32, 0.5);
  xformMatrix.translate(0, animationY, 0);
  xformMatrix.multiply(animationMatrix);
  gl.uniformMatrix4fv(u_xformMatrix, false, xformMatrix.elements);
  drawCube(gl, canvas, white, grey, white, white, lightgrey, lightgrey);

// // leg bend 
// front left
  xformMatrix = new Matrix4();
  xformMatrix.setRotate(35,0,1,0);
  xformMatrix.rotate(-10,1,0,0);
  xformMatrix.scale(0.35, 0.55, 0.3);
  xformMatrix.translate(0.25, -0.7, -0.15);
  xformMatrix.translate(0, animationY, 0);
  xformMatrix.multiply(animationMatrix);
  gl.uniformMatrix4fv(u_xformMatrix, false, xformMatrix.elements);
  drawCube(gl, canvas, white, grey, white, white, lightgrey, lightgrey);
  // drawCube(gl, canvas, black, black, black, black, black, black);


  xformMatrix = new Matrix4();
  xformMatrix.setRotate(35,0,1,0);
  xformMatrix.rotate(-10,1,0,0);
  xformMatrix.scale(0.35, 0.55, 0.3);
  xformMatrix.translate(-0.25, -0.7, -0.12);
  xformMatrix.multiply(animationMatrix);
  gl.uniformMatrix4fv(u_xformMatrix, false, xformMatrix.elements);
  drawCube(gl, canvas, white, grey, white, white, lightgrey, lightgrey);

  xformMatrix = new Matrix4();
  xformMatrix.setRotate(35,0,1,0);
  xformMatrix.rotate(-10,1,0,0);
  xformMatrix.scale(0.35, 0.55, 0.3);
  xformMatrix.translate(-0.25, -0.7, 1.2);
  xformMatrix.multiply(animationMatrix);
  gl.uniformMatrix4fv(u_xformMatrix, false, xformMatrix.elements);
  drawCube(gl, canvas, white, grey, white, white, lightgrey, lightgrey);

  xformMatrix = new Matrix4();
  xformMatrix.setRotate(35,0,1,0);
  xformMatrix.rotate(-10,1,0,0);
  xformMatrix.scale(0.35, 0.55, 0.3);
  xformMatrix.translate(0.25, -0.7, 1.2);
  gl.uniformMatrix4fv(u_xformMatrix, false, xformMatrix.elements);
  drawCube(gl, canvas, white, grey, white, white, lightgrey, lightgrey);

// // paws 

// // left front peet 
  xformMatrix = new Matrix4();
  xformMatrix.setRotate(35,0,1,0);
  xformMatrix.rotate(-10,1,0,0);
  xformMatrix.scale(0.4, 0.285, 0.5);
  xformMatrix.translate(0.25, -1.6, -0.12);
  gl.uniformMatrix4fv(u_xformMatrix, false, xformMatrix.elements);
  drawCube(gl, canvas, white, lightgrey, white, white, white, white);

  xformMatrix = new Matrix4();
  xformMatrix.setRotate(35,0,1,0);
  xformMatrix.rotate(-10,1,0,0);
  xformMatrix.scale(0.4, 0.285, 0.5);
  xformMatrix.translate(-0.25,-1.6, -0.12);
  gl.uniformMatrix4fv(u_xformMatrix, false, xformMatrix.elements);
  drawCube(gl, canvas, white, lightgrey, white, white, white, white);

  xformMatrix = new Matrix4();
  xformMatrix.setRotate(35,0,1,0);
  xformMatrix.rotate(-10,1,0,0);
  xformMatrix.scale(0.4, 0.285, 0.5);
  xformMatrix.translate(-0.25, -1.6, 0.7);
  gl.uniformMatrix4fv(u_xformMatrix, false, xformMatrix.elements);
  drawCube(gl, canvas, white, lightgrey, white, white, white, white);

  xformMatrix = new Matrix4();
  xformMatrix.setRotate(35,0,1,0);
  xformMatrix.rotate(-10,1,0,0);
  xformMatrix.scale(0.4, 0.285, 0.5);
  xformMatrix.translate(0.25, -1.6, 0.7);
  gl.uniformMatrix4fv(u_xformMatrix, false, xformMatrix.elements);
  drawCube(gl, canvas, white, lightgrey, white, white, white, white);


//   // tail 
  xformMatrix = new Matrix4();
  xformMatrix.setRotate(35,0,1,0);
  xformMatrix.rotate(-10,1,0,0);
  xformMatrix.scale(0.3, 0.3, 0.3);
  xformMatrix.translate(0, 0, 1.8);
  xformMatrix.translate(0, animationY, 0);
  xformMatrix.multiply(animationMatrix);
  gl.uniformMatrix4fv(u_xformMatrix, false, xformMatrix.elements);
  drawCube(gl, canvas, lightgrey, lightgrey, lightgrey, lightgrey, lightgrey, lightgrey);

}

function drawCube(gl, canvas, c1, c2, c3, c4, c5, c6) {
  var length = 0.3;
  var radius = length / 2;
  var t1 = new Float32Array([
  // front face 
  -radius,-radius,-radius, c1[0], c1[1], c1[2],
  -radius,radius,-radius, c1[0], c1[1], c1[2],
  radius,radius,-radius, c1[0], c1[1], c1[2],
  -radius,-radius,-radius, c1[0], c1[1], c1[2],
  radius,radius,-radius, c1[0], c1[1], c1[2],
  radius,-radius,-radius, c1[0], c1[1], c1[2],
  // // top face 
  -radius,radius,-radius, c2[0], c2[1], c2[2],
  -radius,radius,radius, c2[0], c2[1], c2[2],
  radius,radius,-radius, c2[0], c2[1], c2[2],
  -radius,radius,radius, c2[0], c2[1], c2[2],
  radius,radius,radius, c2[0], c2[1], c2[2],
  radius,radius,-radius, c2[0], c2[1], c2[2],
  // // back face
  -radius,-radius,radius, c3[0], c3[1], c3[2],
  -radius,radius,radius, c3[0], c3[1], c3[2],
  radius,-radius,radius, c3[0], c3[1], c3[2],
  -radius,radius,radius, c3[0], c3[1], c3[2],
  radius,radius,radius, c3[0], c3[1], c3[2],
  radius,-radius,radius, c3[0], c3[1], c3[2],
  // //bottom face
  -radius,-radius,-radius, c4[0], c4[1], c4[2],
  -radius,-radius,radius, c4[0], c4[1], c4[2],
  radius,-radius,-radius, c4[0], c4[1], c4[2],
  -radius,-radius,radius, c4[0], c4[1], c4[2],
  radius,-radius,radius, c4[0], c4[1], c4[2],
  radius,-radius,-radius, c4[0], c4[1], c4[2],
  // //left side
  -radius,-radius,-radius, c5[0], c5[1], c5[2],
  -radius,radius,-radius, c5[0], c5[1], c5[2],
  -radius,radius,radius, c5[0], c5[1], c5[2],
  -radius,radius,radius, c5[0], c5[1], c5[2],
  -radius,-radius,radius, c5[0], c5[1], c5[2],
  -radius,-radius,-radius, c5[0], c5[1], c5[2],
  // // light side 
  radius,radius,-radius, c6[0], c6[1], c6[2],
  radius,radius,radius, c6[0], c6[1], c6[2],
  radius,-radius,-radius, c6[0], c6[1], c6[2],
  radius,radius,radius, c6[0], c6[1], c6[2],
  radius,-radius,radius, c6[0], c6[1], c6[2],
  radius,-radius,-radius, c6[0], c6[1], c6[2]
  ]);


  var n = updateVertexBuffer(gl, t1);
  gl.drawArrays(gl.TRIANGLES, 0, n);

  // cubes.push[t1];
  // cubeColors.push[colorArray];
}

function updateVertexBuffer(gl, vertices) {
  var n = 36; // 3 * #triangles 
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  var a_Position = gl.getAttribLocation(gl.program, "a_Position");
  if (a_Position < 0) {
    console.log("Failed to get the storage location of a_Position");
    return -1;
  }

  var FLOAT_SIZE = Float32Array.BYTES_PER_ELEMENT;
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FLOAT_SIZE * 6, 0);
  gl.enableVertexAttribArray(a_Position);
  var a_Color = gl.getAttribLocation(gl.program, "a_Color");
  if (a_Color < 0) {
    console.log("Failed to get the storage location of v_Color");
    return -1;
  }

  gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FLOAT_SIZE * 6, FLOAT_SIZE * 3);
  gl.enableVertexAttribArray(a_Color);

  return n;
}

function drawEverything(gl, canvas) {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  var len = cubes.length;
  for (var i = 0; i < len; i++) {
    shapeToDraw = cubes[i];

    var rgba = g_colors[i];
    var n = updateVertexBuffer(gl, shapeToDraw, 2);

    var u_FragColor = gl.getUniformLocation(gl.program, "u_FragColor");
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
    gl.drawArrays(gl.TRIANGLES, 0, n);
  }
}
