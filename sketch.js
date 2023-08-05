let dialUpSpeed = 25; // in kbps? lol

// add randomness to the loading speed
function updateSpeed() {
  // add a random increase or decrease
  let random = Math.random();
  if (random < 0.5) {
    dialUpSpeed += 3;
  }
  else {
    dialUpSpeed -= 3;
  }
}

setTimeout(function () {
  updateSpeed();
}, 100);

let globalImage;

function preload() {
  globalImage = loadImage('hualienmao.png');
}

let instance1, instance2, instance3, instance4;

function setup() {
  // initialize all instances from setup to make sure the preload finished
  instance1 = new p5(sketch1, 'p5-container1')
  instance2 = new p5(sketch2, 'p5-container2');
  instance3 = new p5(sketch3, 'p5-container3');
  instance4 = new p5(sketch4, 'p5-container4');
}


// Interlaced loading
// ---------------------------------- 
let sketch1 = function (p) {
  let currentRow = 0;
  let dataPerFrame = 128; 
  let frameDuration = 1000 * dataPerFrame / dialUpSpeed; // milliseconds per frame

  p.setup = function () {
    let canvas = p.createCanvas(globalImage.width, globalImage.height);
    canvas.parent('p5-container1');
    p.pixelDensity(1);
    p.image(globalImage, 0, 0);
    p.loadPixels();
    for (let i = 0; i < p.pixels.length; i++) {
      p.pixels[i] = 255;  // Initialize all pixels to white
    }
    p.updatePixels();
    p.background(0);
  };

  p.draw = function () {
    p.frameRate(frameDuration);
    if (globalImage.width > 0) {
      globalImage.loadPixels();
      p.loadPixels();
      for (let n = 0; n < 2; n++) {
        for (let x = 0; x < globalImage.width; x++) {
          let loc = ((currentRow + n) * globalImage.width + x) * 4;
          p.pixels[loc] = globalImage.pixels[loc];
          p.pixels[loc + 1] = globalImage.pixels[loc + 1];
          p.pixels[loc + 2] = globalImage.pixels[loc + 2];
          p.pixels[loc + 3] = globalImage.pixels[loc + 3];
        }
      }
      p.updatePixels();
      currentRow += 2;
    }
  };

  p.resetSketch = function () {
    currentRow = 0; // Reset the current row
    p.loadPixels();
    for (let i = 0; i < p.pixels.length; i++) {
      p.pixels[i] = 255; // Initialize all pixels to white
    }
    p.updatePixels();
    p.background(0);
    p.loop(); // Restart the draw loop
  };


};


// Progressive rendering - mosaic
// ----------------------------------
let sketch2 = function (p2) {
  let currentPass = 20; // Start by skipping every 20th pixel

  p2.setup = function () {
    let canvas = p2.createCanvas(globalImage.width, globalImage.height);
    canvas.parent('p5-container2');
    p2.pixelDensity(1);
    p2.background(0);
  };

  p2.draw = function () {
    p2.frameRate(dialUpSpeed * 0.0525);

    if (globalImage.width > 0) {
      globalImage.loadPixels();
      p2.loadPixels();

      for (let y = 0; y < globalImage.height; y += currentPass) {
        let blockHeight = currentPass;

        if (y + currentPass > globalImage.height) {
          blockHeight = globalImage.height - y;
        }

        for (let x = 0; x < globalImage.width; x += currentPass) {
          let blockSize = currentPass;

          if (x + currentPass > globalImage.width) {
            blockSize = globalImage.width - x;
          }

          let loc = (y * globalImage.width + x) * 4;
          for (let i = 0; i < blockHeight; i++) {
            for (let j = 0; j < blockSize; j++) {
              let targetLoc = ((y + i) * globalImage.width + (x + j)) * 4;
              p2.pixels[targetLoc] = globalImage.pixels[loc];
              p2.pixels[targetLoc + 1] = globalImage.pixels[loc + 1];
              p2.pixels[targetLoc + 2] = globalImage.pixels[loc + 2];
              p2.pixels[targetLoc + 3] = globalImage.pixels[loc + 3];
            }
          }
        }
      }
      p2.updatePixels();
      if (currentPass > 1) {
        currentPass--;
      } else {
        p2.noLoop(); // Stop the draw loop once we're at full resolution
      }
    }
  };
  p2.resetSketch = function () {
    currentPass = 20; // Start by skipping every nth pixel
    p2.loop(); // Restart the draw loop
  };
};

// JPEG-XL style blocking
// ----------------------------------
let sketch3 = function (p3) {
  let blockSize;
  let numRows
  let numCols
  let currentRow
  let currentCol

  p3.setup = function () {
    let canvas = p3.createCanvas(globalImage.width, globalImage.height);
    canvas.parent('p5-container3');
    p3.pixelDensity(1);
    blockSize = Math.floor(p3.width / numCols); // Make sure the block size is an integer
    p3.resetSketch();
  };

  p3.draw = function () {
    p3.frameRate(p3.round(dialUpSpeed * 0.1))
    globalImage.loadPixels();
    p3.loadPixels();

    for (let y = currentRow * blockSize; y < (currentRow + 1) * blockSize || (currentRow == numRows - 1 && y < p3.height); y++) {
      for (let x = currentCol * blockSize; x < (currentCol + 1) * blockSize || (currentCol == numCols - 1 && x < p3.width); x++) {
        let loc = (y * p3.width + x) * 4;
        p3.pixels[loc] = globalImage.pixels[loc];
        p3.pixels[loc + 1] = globalImage.pixels[loc + 1];
        p3.pixels[loc + 2] = globalImage.pixels[loc + 2];
        p3.pixels[loc + 3] = 255;
      }
    }

    p3.updatePixels();

    currentCol++;
    if (currentCol >= numCols) {
      currentCol = 0;
      currentRow++;
      if (currentRow >= numRows) {
        p3.noLoop(); // Stop after the entire image is loaded
      }
    }
  };

  p3.resetSketch = function () {
    blockSize = Math.floor(p3.width / 5); // Make sure the block size is an integer
    numRows = 5;
    numCols = 5;
    currentRow = 0;
    currentCol = 0;
    p3.background(0);
    p3.loop(); // Restart the draw loop
  };

};

// Interlaced and progressive rendering
// ----------------------------------
let sketch4 = function (p4) {
  let images = [];
  let currentState;
  let pass = 0;
  let wipeHeight = 0;
  let speeds = [5, 8, 4];
  let dataPerFrame = 1024;
  let frameDuration = 1000 * dataPerFrame / dialUpSpeed;


  p4.setup = function () {
    p4.createCanvas(globalImage.width, globalImage.height);
    p4.pixelDensity(1);
    p4.frameRate(frameDuration);

    // Create and store different states of the image
    images[0] = p4.createImage(globalImage.width, globalImage.height); // Grayscale
    images[1] = p4.createImage(globalImage.width, globalImage.height); // Selective Luminance
    images[2] = globalImage; // Original image

    // Preprocess grayscale and selective luminance images
    globalImage.loadPixels();
    images[0].loadPixels();
    images[1].loadPixels();

    for (let i = 0; i < globalImage.pixels.length; i += 4) {
      let r = globalImage.pixels[i];
      let g = globalImage.pixels[i + 1];
      let b = globalImage.pixels[i + 2];
      let luminance = 0.299 * r + 0.587 * g + 0.114 * b;

      // Grayscale
      let gray = (r + g + b) / 3;
      images[0].pixels[i] = images[0].pixels[i + 1] = images[0].pixels[i + 2] = gray;
      images[0].pixels[i + 3] = 255;

      // Selective Luminance
      if (luminance <= 128) {
        images[1].pixels[i] = images[1].pixels[i + 1] = images[1].pixels[i + 2] = gray;
      } else {
        images[1].pixels[i] = r;
        images[1].pixels[i + 1] = g;
        images[1].pixels[i + 2] = b;
      }
      images[1].pixels[i + 3] = 255;
    }

    images[0].updatePixels();
    images[1].updatePixels();

    // Initialize current state with transparent pixels
    currentState = new Uint8ClampedArray(4 * globalImage.width * globalImage.height);
  };

  p4.draw = function () {
    if (globalImage.width > 0) { // Check if the image is loaded
      let currentImg = images[pass];
      currentImg.loadPixels();

      for (let y = 0; y < wipeHeight; y++) {
        for (let x = 0; x < p4.width; x++) {
          let loc = (y * p4.width + x) * 4;
          currentState[loc] = currentImg.pixels[loc];
          currentState[loc + 1] = currentImg.pixels[loc + 1];
          currentState[loc + 2] = currentImg.pixels[loc + 2];
          currentState[loc + 3] = 255;
        }
      }

      p4.loadPixels();
      for (let i = 0; i < p4.pixels.length; i++) {
        p4.pixels[i] = currentState[i];
      }
      p4.updatePixels();

      wipeHeight += speeds[pass];
      if (wipeHeight > p4.height) {
        wipeHeight = 0;
        pass++;
        if (pass > 2) p4.noLoop();
      }
    }
  };

  p4.resetSketch = function () {
    // Reset the loading pass and wipe height
    pass = 0;
    wipeHeight = 0;

    // Initialize current state with transparent pixels
    currentState = new Uint8ClampedArray(4 * globalImage.width * globalImage.height);
    p4.loop();
  };

};


let isConnected = false;


document.getElementById('reload-button').addEventListener('click', function () {
  instance1.resetSketch();
  instance2.resetSketch();
  instance3.resetSketch();
  instance4.resetSketch();
})

document.getElementById('connect-button').addEventListener('click', function () {
  let button = this;

  if (!isConnected) {
    button.textContent = 'Connecting...'; 
    playAudio('dial-up-modem-02.mp3').then(function () {
      button.textContent = 'Play Dial-up Sound';
    });

    isConnected = true;
  }
});

function playAudio(src) {
  return new Promise(function (resolve) {
    let audio = new Audio(src);
    audio.play();
    audio.addEventListener('ended', function () {
      resolve();
    });
  });
}