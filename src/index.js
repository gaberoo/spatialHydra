'use strict';

// var d3 = require('d3');
var R = require('randgen');
var pd = require('probability-distributions');
var _ = require('lodash');
var Promise = require("bluebird");

var m = 8;     // number of patches
var r = 1.85;  // growth rate
var gen = 100; // number of generations
var d = 0.0;   // dispersal

var b1 = 0.0027;
var b2 = -0.005;

function binom(n, p, lim = 30.0) {
  if (n <= 0.0) {
    return 0.0;
  } else if (p >= 1.0) {
    return n;
  } else if (p <= 0) {
    return 0.0;
  } else {
    let mean = n*p;
    if (mean > lim) {
      // normal approximation to the binomial when the mean is over 'lim'
      let sigma = Math.sqrt(mean*(1-d));
      let x = Math.floor(R.rnorm(mean,sigma));
      x = (x < 0) ? 0 : x;
      x = (x > n) ? n : x;
      return x;
    } else {
      let x = pd.rbinom(1, n, p);
      return x[0];
    }
  }
}

function next_generation(n1, n2) {
  let n = Math.floor(r*n1);
  let p = Math.exp(b1*n1 + b2*n2);
  p = p > 1.0 ? 1.0 : p;
  return binom(n,p,100);
}

function disperse(data) {
  let i = data[0].length-1;
  let N = 0;
  let q = 0;
  for (let j = 0; j < m; ++j) {
    // binomial sampling of how many individuals disperse
    q = binom(data[j][i],d);
    data[j][i] -= q;
    N += q;
  }
  if (N > 0) {
    // redistribute the dispersed individuals
    let dist = pd.sample(_.range(m), N, true);
    _.each(dist, function(j) { data[j][i]++ });
  }
}

var colors = [ '#e41a1c', '#377eb8', '#4daf4a', '#984ea3',
               '#ff7f00', '#ffff33', '#a65628', '#f781bf' ];

var graphOpts = {
  animation: {
    duration: 0, // general animation time
  },
  hover: {
    animationDuration: 0, // duration of animations when hovering an item
  },
  responsiveAnimationDuration: 0, // animation duration after a resize
  scales: {
    yAxes: [{
      id: 'left-y-axis',
      type: 'logarithmic',
      position: 'left'
    }]
  }
}

var loaderStr = '<div class="loader" id="graph"></div>';

var go = function() {
  let loader = $('#graph').replaceWith(loaderStr).promise();

  let run = loader.then(function() {
    console.log("Calculating...");
    return new Promise(function(resolve,reject) {
      m = $('#m').val();
      r = $('#r').val();
      gen = $('#gen').val();

      b1 = $('#b1').val();
      b2 = $('#b2').val();

      d = parseInt($('#d').val());

      var x = [ 0, 1 ];
      var y0 = [ parseInt($('#y0').val()), parseInt($('#y1').val()) ];

      let data = [];
      for (let i = 0; i < m; i++) {
        data[i] = y0.slice();
      }

      for (let i = 2; i <= gen; i++) {
        x.push(i);
        for (let j = 0; j < m; j++) {
          var n2 = next_generation(data[j][i-1], data[j][i-2]);
          data[j][i] = n2;
          // if (n2[0] > 10000) { break; }
        }
        disperse(data);
      }

      let datasets = [];
      for (let j = 0; j < m; j++) {
        datasets[j] = {
          label: 'Patch ' + (j+1),
          data: data[j].slice(),
          fill: false,
          borderColor: colors[j]
        };
      }

      resolve({ labels: x, datasets: datasets });
    })
  });
    
  run.then(function(data) {
    $('#graph').replaceWith('<canvas id="graph"></canvas>');
    var ctx = document.getElementById("graph").getContext('2d');
    var myChart = new Chart(ctx, {
      type: 'line',
      data: data,
      options: graphOpts
    });
  });
}

window.go = go;

