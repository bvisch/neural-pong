
function normalize(vector) {
  var length = Math.sqrt(vector.x*vector.x + vector.y*vector.y);
  return { x: vector.x/length, y: vector.y/length };
}

function subtract(vec1, vec2) {
  return { x: vec1.x - vec2.x, y: vec1.y - vec2.y };
}

function add(vec1, vec2) {
  return { x: vec1.x + vec2.x, y: vec1.y + vec2.y };
}

function mult(vector, times) {
  return { x: vector.x*times, y: vector.y*times };
}

function rightSide(object) {
  return { x: object.position.x + object.width, y: object.position.y };
}

function centre(object) {
  return { x: object.position.x + object.width/2, y: object.position.y + object.height/2 };
}

function within(ball, paddle) {
  return ball.position.y >= paddle.position.y && ball.position.y <= paddle.position.y + paddle.height;
}

window.Pong = {};

window.Pong.sigmoid = function(x) {
  return 1 / (1 + Math.exp(-x));
};

window.Pong.softmax = function(arr) {
  var denom = arr.map(y => Math.exp(y)).reduce((a, b) => a + b);
  for (var i = 0; i < arr.length; ++i)
    arr[i] = Math.exp(arr[i]) / denom;

  return arr;
};

window.Pong.argmax = function(arr) {
  var max = Math.max.apply(null, arr);
  return arr.findIndex(function(el) { return el == max; });
};

function getNetwork() {
  return $.ajax({
    url: '/api/network',
    dataType: 'script'
  });
}

$(function() {
  $.when(getNetwork()).then(function(){

    var canvas = document.getElementById('canvas');
    var ctx = canvas.getContext('2d');

    var cHeight = canvas.clientHeight;
    var cWidth = canvas.clientWidth;

    var PADDLE_WIDTH = 5;
    var PADDLE_HEIGHT = cHeight/6;
    var PADDLE_DIST_FROM_SIDE = 0;

    // var network = new synaptic.Architect.Perceptron(5, 10, 1);
    // var trainer = new synaptic.Trainer(network);

    var Paddle = function(id, x_pos, controller) {
      this.id = id;
      this.width = PADDLE_WIDTH;
      this.height = PADDLE_HEIGHT;
      this.position = { x: x_pos, y: cHeight/2 - PADDLE_HEIGHT/2 };
      this.direction = 0;
      this.speed = 1;
      this.controller = controller;
    };

    Paddle.prototype.move = function(ball) {
      this.direction = this.controller(ball, this);
      this.position.y += this.direction*this.speed;
      if (this.position.y <= 0)
        this.position.y = 0;
      else if (this.position.y + this.height >= cHeight)
        this.position.y = cHeight - this.height;
    };

    Paddle.prototype.render = function() {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(this.position.x, this.position.y, this.width, this.height);
    };

    var BALL_RADIUS = 5;

    var ball = {
      lastTouched: '',
      radius: BALL_RADIUS,
      width: BALL_RADIUS*2,
      height: BALL_RADIUS*2,
      position: {
        x: cWidth/2,
        y: cHeight/2
      },
      direction: {
        x: 0,
        y: 0
      },
      speed: 1,
      stopped: true
    };

    ball.move = function() {
      this.position = add(this.position, mult(this.direction, this.speed));
    };

    ball.reset = function() {
      this.position = {
        x: cWidth/2,
        y: cHeight/2
      };
      this.direction = { x: 0, y: 0 };
      this.stopped = true;
      this.lastTouched = '';
    };

    ball.bounceOffPaddle = function(paddle) {
      if (this.lastTouched != paddle.id) {
        this.direction = {
          x: -this.direction.x,
          y: this.direction.y
        };
      }
      this.lastTouched = paddle.id;
      if (paddle.id == 'left')
        playerScore++;
      else
        aiScore++;
    };

    var playerScore = 0;
    var aiScore = 0;

    ball.collide = function(paddleL, paddleR) {
      if (this.position.x + this.radius <= 0) {
        // aiScore++;
        // this.reset();
        playerScore = 0;
        this.direction.x = -this.direction.x;
      }

      else if (this.position.x + this.radius >= cWidth) {
        // playerScore++;
        // this.reset();
        aiScore = 0;
        this.direction.x = -this.direction.x;
      }

      else if (this.position.y + this.radius <= 0 || this.position.y + this.radius >= cHeight)
        this.direction.y = -this.direction.y;
      else if (this.position.x <= rightSide(paddleL).x && within(this, paddleL)) {
        this.bounceOffPaddle(paddleL);
        // playerScore++;
      }
      else if (rightSide(this).x >= paddleR.position.x && within(this, paddleR)) {
        this.bounceOffPaddle(paddleR);
        // aiScore++;
      }
    };

    ball.render = function() {
      ctx.beginPath();
      ctx.arc(this.position.x, this.position.y, this.radius, 2 * Math.PI, false);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
    };

    var userController = (function() {
      var keysDown = {};
      window.addEventListener('keydown', function (event) {
          keysDown[event.keyCode] = true;
      });

      window.addEventListener('keyup', function (event) {
          keysDown[event.keyCode] = false;
      });

      return function() {
        var direction = 0;
        if (keysDown[38]) direction -= 1;
        if (keysDown[40]) direction += 1;
        return direction;
      }
    })();

    var aiController = function(ball, paddle) {
      if (centre(this).y < centre(ball).y)
        return 1;
      else
        return -1;
      // else if (centre(this).y > centre(ball).y)
      //   return -1;
      // else
      //   return 0;
    };


    // var serverController = (function() {
    //   var direction = 0;
    //   App.nnChannel = App.cable.subscriptions.create('NeuralNetworkChannel', {
    //     // received: function(dir) { direction = dir; },
    //     received: function(data) { $.get('/api/train'); },
    //     train: function() { this.perform('train'); },
    //     store: function(data) { this.perform('store', data); },
    //     move: function(ball, paddle) { this.perform('move', {'ball': ball, 'paddle': paddle }); }
    //   });
    //
    //   return function(ball, paddle) { App.nnChannel.move(centre(ball), centre(paddle)); return direction; };
    // })();

    App.nnChannel = App.cable.subscriptions.create('NeuralNetworkChannel', {
      // received: function(dir) { direction = dir; },
      received: function(data) { getNetwork(); },
      train: function() { this.perform('train'); },
      store: function(data) { this.perform('store', data); }
    });

    var leftPaddle = new Paddle('left', PADDLE_DIST_FROM_SIDE, userController);

    var learningRate = .3;
    var nnController = function(ball, paddle) {
      // var outputs = network.activate([ball.position.x, ball.position.y, ball.direction.x, ball.direction.y, paddle.position.y]);
      // network.propagate(learningRate, [leftPaddle.direction + .5]);userController
      // return outputs - .5;
      // return outputs;
      // console.log(window.Pong.predict([ball.position.x/cWidth, ball.position.y/cHeight, ball.direction.x, ball.direction.y, paddle.position.y/cHeight]) - 1);
      return window.Pong.predict([ball.position.x/cWidth, ball.position.y/cHeight, ball.direction.x, ball.direction.y, paddle.position.y/cHeight]) - 1;
    }

    var rightPaddle = new Paddle('right', cWidth - PADDLE_DIST_FROM_SIDE - PADDLE_WIDTH, window.Pong.predict == undefined ? aiController : nnController);

    var animate = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || function (callback) {
            window.setTimeout(callback, 1000 / 60);
    };

    var output;
    var lastTimestamp = null;
    var FPS = 600;
    var step = function(timestamp) {

      ctx.fillStyle = '#00b2a0';
      ctx.fillRect(0, 0, cWidth, cHeight);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = "50px Helvetica";
      ctx.fillText(playerScore, 100, 50);
      ctx.fillText(aiScore, cWidth - 125, 50);

      ctx.strokeStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.moveTo(cWidth/2, 0);
      ctx.lineTo(cWidth/2, cHeight);
      ctx.stroke();

      var elapsed = timestamp - lastTimestamp;
      lastTimestamp = timestamp;
      var frames = elapsed/(1000/FPS);
      for (var i = 0; i < frames; ++i) {
        if (!ball.stopped) {
          leftPaddle.move(ball);
          rightPaddle.move(ball);
          ball.move();
          ball.collide(leftPaddle, rightPaddle);
          output = [0,0,0];
          output[leftPaddle.direction + 1] = 1;
          // App.nnChannel.store({ 'input': [ball.position.x/cWidth, ball.position.y/cHeight, ball.direction.x, ball.direction.y, leftPaddle.position.y/cHeight], 'output': output });
        }
      }

      leftPaddle.render();
      rightPaddle.render();
      ball.render();

      // if(playerScore + aiScore == 1) {
      //   playerScore = 0;
      //   aiScore = 0;
      //   ball.stopped = true;
      //   ball.position = {
      //     x: cWidth/2,
      //     y: cHeight/2
      //   };
        // App.nnChannel.train();
      // }

      animate(step);
    };

    window.addEventListener('keydown', function(event) {
      if (event.keyCode == 32 && ball.stopped) {
        // ball.direction = normalize(subtract(centre(leftPaddle), centre(ball)));
        ball.direction.x = -1;
        ball.direction.y = -1;
        // ball.direction = normalize(ball.direction);
        ball.stopped = false;
      }
      // if (event.keyCode == 16) App.nnChannel.train();
    });

    animate(step);



    $('#logo').on('click', function(){
      $.ajax({
        type: "GET",
        url: "/pong/hi",
        dataType: 'json',
        success: function(data) { alert("Hello from the server at " + data.date); },
        error: function(jqXHR, textStatus, errorThrown) {console.log(textStatus, errorThrown);}
      });
    });

  });
});
