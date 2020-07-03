var 
    //time
    duration = $('#duration'),
    timer = $('#timer'),
    loading = $('#loading'),
    //basic controls
    playBtn  = $('#playBtn'),
    pauseBtn = $('#pauseBtn'),
    stopBtn = $('#stopBtn'),
    //progress & wave
    progress = $('#progress'),
    bar = $('#bar'),
    waveContainer = $('#waveContainer'),
    wave = $('#wave'),
    //volume
    volumeBtn = $('#volumeBtn'),
    volume = $('#volume'),
    barEmpty = $('#barEmpty'),
    barFull = $('#barFull'),
    sliderBtn = $('#sliderBtn');
    

var audioUrl = $("#audioUrl").val();
var filename = $("#filename").val();

$('#track').text(filename);

// function typeOf(obj) {
//     return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase()
// }


const audio = new Howl({
    src: [audioUrl],
    autoplay: true,
    loop: true,
    preload: true,
    onloaderror: function(){
        alert('loading err');
    },
    onplayerror: function(){
        alert('not able to play the audio');
    },
    onplay: function(){
        playBtn.css('display' , 'none');
        pauseBtn.css('display' , 'block');
        // Start the wave animation.
        wave.container.style.display = 'block';
        bar.css('display' ,'none');
    },
    onpause: function(){
        playBtn.css('display' , 'block');
        pauseBtn.css('display' , 'none');
        // Stop the wave animation.
        wave.container.style.display = 'none';
        bar.css('display' ,'block');
    },
    onstop(){
        playBtn.css('display' , 'block');
        pauseBtn.css('display' , 'none');
        // Stop the wave animation.
        wave.container.style.display = 'none';
        bar.css('display' ,'block');
    },
    onend: function(){
        // Stop the wave animation.
        wave.container.style.display = 'none';
        bar.css('display' ,'block');
        bar.css('display' ,'block');
    }
});

//play audio
const id = audio.play();
startTimer();
progress.css('width' ,'0');
//display duration once audio loaded
audio.on('load' ,function(){
    duration.html(toHHMMSS2(Math.round(audio.duration(id)))); 
    wave.container.style.display = 'block';
    bar.css('display' ,'none');
    loading.css('display' ,'none'); 
} ,id);

//timer function
function startTimer(){
    setInterval(function(){
        if(audio.playing(id) === true){
            timer.html(toHHMMSS2(Math.round(audio.seek(id))));
            progress.css('width' ,(((audio.seek(id) / audio.duration(id)) * 100) || 0) + '%');
        }
    });
}
//basic controls functions
function pause(){
    audio.pause(id);
}
function resume(){
    audio.play(id);
}
function stop(){
    audio.stop(id);
}
//seeking to new position
function seek(per){
    audio.seek(audio.duration(id)*per ,id);
}

//volume functions
// function toggleVolume() {
//   var display = (volume.css('display') === 'block') ? 'none' : 'block';
//   setTimeout(function() {
//     volume.css('display' ,display);
//   }, (display === 'block') ? 0 : 500);
//   volume.className = (display === 'block') ? 'fadein' : 'fadeout';
// }
function volume(val) {
  // Update the global volume (affecting all Howls).
  Howler.volume(val);
  // Update the display on the slider.
  var barWidth = (val * 90) / 100;
  barFull.css('width' ,(barWidth * 100) + '%');
  sliderBtn.css('left' ,(window.innerWidth * barWidth + window.innerWidth * 0.05 - 25) + 'px');
}


//basic controls event listners
playBtn.on('click' ,function(){
    resume();
});
pauseBtn.on('click' ,function(){
    pause();
});
stopBtn.on('click' ,function(){
    stop();
});

//seeking event listner
waveContainer.on('click' ,function(event){
    seek(event.clientX / window.innerWidth);
});

//volume event listners
volumeBtn.on('click', function() {
//   toggleVolume();
    volume.fadeIn(400);
});
volume.on('click', function() {
//   toggleVolume();
    // volume.fadeOut(400);
});
barEmpty.on('click', function(event) {
    alert(GG);
  var per = event.layerX / parseFloat(barEmpty.scrollWidth);
  volume(per);
});
sliderBtn.on('mousedown', function() {
    alert(GG);
  window.sliderDown = true;
});
sliderBtn.on('touchstart', function() {
    alert(GG);
  window.sliderDown = true;
});
volume.on('mouseup', function() {
  window.sliderDown = false;
});
volume.on('touchend', function() {
  window.sliderDown = false;
});
var move = function(event) {
    alert(GG);
  if (window.sliderDown) {
    var x = event.clientX || event.touches[0].clientX;
    var startX = window.innerWidth * 0.05;
    var layerX = x - startX;
    var per = Math.min(1, Math.max(0, layerX / parseFloat(barEmpty.scrollWidth)));
    volume(per);
  }
};
volume.on('mousemove', move);
volume.on('touchmove', move);


// Setup the "waveform" animation.
var wave = new SiriWave({
  container: waveform,
  width: window.innerWidth,
  height: window.innerHeight * 0.3,
  cover: true,
  speed: 0.03,
  amplitude: 0.7,
  frequency: 2
});
wave.start();

//window event listner
var resize = function(audio) {
    alert('GGs');
    var height = window.innerHeight * 0.3;
    var width = window.innerWidth;
    wave.height = height;
    wave.height_2 = height / 2;
    wave.MAX = wave.height_2 - 4;
    wave.width = width;
    wave.width_2 = width / 2;
    wave.width_4 = width / 4;
    wave.canvas.height = height;
    wave.canvas.width = width;
    wave.container.style.margin = -(height / 2) + 'px auto';
    // Update the position of the slider.
    if (audio) {
      var vol = audio.volume();
      var barWidth = (vol * 0.9);
      sliderBtn.style.left = (window.innerWidth * barWidth + window.innerWidth * 0.05 - 25) + 'px';
    }
  };
  window.on('resize', resize.bind(null ,audio));
  resize(audio);
  




//formating seconds to HH:MM:SS
//1
function toHHMMSS(sec_num) {
    // var sec_num = parseInt(this, 10); // don't forget the second param
    var hours   = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var seconds = sec_num - (hours * 3600) - (minutes * 60);

    if (hours   < 10) {hours   = "0"+hours;}
    if (minutes < 10) {minutes = "0"+minutes;}
    if (seconds < 10) {seconds = "0"+seconds;}
    return hours+':'+minutes+':'+seconds;
}
//2
function toHHMMSS2(secs) {
  var minutes = Math.floor(secs / 60) || 0;
  var seconds = (secs - minutes * 60) || 0;
  return minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
}