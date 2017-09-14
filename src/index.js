'use strict';

// var d3 = require('d3');
var pd = require('probability-distributions');
var _ = require('lodash');
var Promise = require("bluebird");

var m = 8;     // number of patches
var r = 1.85;  // growth rate
var gen = 100; // number of generations
var d = 0.0;   // dispersal

var b1 = 0.0027;
var b2 = -0.005;

function next_generation(n1, n2) {
  let n = Math.floor(r*n1);
  let p = Math.exp(b1*n1 + b2*n2);
  p = p > 1.0 ? 1.0 : p;
  return pd.rbinom(1, n, p);
}

function disperse(data) {
  let i = data[0].length-1;
  let N = 0;
  let q = 0;
  for (let j = 0; j < m; ++j) {
    if (d < 1.0) {
      q = pd.rbinom(1, data[j][i], d)[0];
    } else {
      q = data[j][i];
    }
    data[j][i] -= q;
    N += q;
  }
  if (N > 0) {
    let dist = pd.sample(_.range(m), N, true);
    _.each(dist, function(j) { data[j][i]++ });
  }
}

var colors = [
  '#e41a1c',
  '#377eb8',
  '#4daf4a',
  '#984ea3',
  '#ff7f00',
  '#ffff33',
  '#a65628',
  '#f781bf'
];

var graphOpts = {
  animation: {
    duration: 0, // general animation time
  },
  hover: {
    animationDuration: 0, // duration of animations when hovering an item
  },
  responsiveAnimationDuration: 0, // animation duration after a resize
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

      var x = [ 0, 1 ];
      var y0 = [ $('#y0').val(), $('#y1').val() ];
      var data = [];
      for (let i = 0; i < m; i++) {
        data[i] = y0.slice();
      }

      for (let i = 2; i <= gen; i++) {
        console.log(i);
        x.push(i);
        for (let j = 0; j < m; j++) {
          let n2 = next_generation(data[j][i-1], data[j][i-2]);
          data[j][i] = n2[0];
          if (n2[0] > 10000) {
            reject("Overflow");
          }
        }
        disperse(data);
      }

      var datasets = [];
      for (let j = 0; j < m; j++) {
        datasets[j] = {
          label: 'Patch ' + j,
          data: data[j],
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

