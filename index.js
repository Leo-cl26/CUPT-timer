var timer_active = false; 
var t;
var warning_timer;
var radius = 300;
var topleftspacing = 100;
var current_phase = -1;

var startTime; // start time of phase in msecs since Jan 1 1970, 00:00:00 UTC, determined via os clock
var lastTickAt; // time when the last tick happened in msecs since Jan 1 '70, to trap system time changes

var phases = new Array();

window.onload=function() {
  phases.push(new Phase("反方挑战", 60 , false));
  phases.push(new Phase("正方准备", 60 , false));
  phases.push(new Phase("正方报告", 720 , false));
  phases.push(new Phase("反方提问", 120 , false));
  phases.push(new Phase("反方准备", 120 , false));
  phases.push(new Phase("反方报告", 180 , false));
  phases.push(new Phase("正反方讨论", 600 , true));
  phases.push(new Phase("评论方提问", 180 , false));
  phases.push(new Phase("评论方准备", 120 , false));
  phases.push(new Phase("评论方报告", 240 , false));
  phases.push(new Phase("正方总结", 60 , false));
  phases.push(new Phase("打分与讨论", 240 , false));
  phases.push(new Phase("评委点评", 300 , false));
  phases.push(new Phase("中场休息", 600 , false));
}

function Phase(name, duration, linked) {// duration passed in seconds
  this.name = name;
  this.duration = duration*1000; // convert to msecs for internal use
  this.linked_offset = 0;
  this.linked = linked;
  this.current_time = 0;
}

function clearWarningLabel() {
  document.getElementById('warninglabel').firstChild.nodeValue = " ";
}

function updateStartTime() {
  startTime = Date.now() - phases[current_phase].current_time;
  lastTickAt = Date.now();
}

function nextPhase() {
  if (current_phase + 1 >= phases.length) {
    document.getElementById('warninglabel').firstChild.nodeValue = "";
    clearTimeout(warning_timer);
    warning_timer = setTimeout(clearWarningLabel, 5000);
  }
  else {
    current_phase++;
    document.getElementById('phaselabel').firstChild.nodeValue = phases[current_phase].name;
    updateStartTime();
    updateLinkedOffset();
    resetColors();
    draw();
  }
}

function previousPhase () {
  if (current_phase - 1 < 0) {
    document.getElementById('warninglabel').firstChild.nodeValue = "";
    clearTimeout(warning_timer);
    warning_timer = setTimeout(clearWarningLabel, 5000);
  }
  else {
    current_phase--;
    document.getElementById('phaselabel').firstChild.nodeValue = phases[current_phase].name;
    updateLinkedOffset();
    updateStartTime();
    resetColors();
    draw();
  }
}

function resetPhase () {
  if(current_phase >= 0) {
    phases[current_phase].current_time = 0;
    updateStartTime();
    resetColors();
    draw();
  }
}

function plus10() {
  if(current_phase >= 0) {
    phases[current_phase].current_time += 10000;
    updateStartTime();
    resetColors();
    draw();
  }
}

function minus10() {
  if(current_phase >= 0) {
    if (phases[current_phase].current_time >= 10000) {
      phases[current_phase].current_time -= 10000;
      updateStartTime();
      resetColors();
      draw();
    } else {
      phases[current_phase].current_time = 0;
      updateStartTime();
      resetColors();
      draw();
    }
  }
}

function updateLinkedOffset () {
  if (phases[current_phase].linked && current_phase > 0) {
    var offset = phases[current_phase-1].duration + phases[current_phase-1].linked_offset - phases[current_phase-1].current_time;
    phases[current_phase].linked_offset = (offset > 0)? offset : 0;
  }
}

function resetColors () {
  if (phases[current_phase].current_time < phases[current_phase].duration + phases[current_phase].linked_offset) {
    document.getElementById('background').setAttributeNS(null,"fill","#eee");
    document.getElementById('foreground').setAttributeNS(null,"fill","#3c0");
  }
  else {
    document.getElementById('background').setAttributeNS(null,"fill","f00");
    document.getElementById('foreground').setAttributeNS(null,"fill","f90");
  }
}

function startstop () {
  if (current_phase < 0) {
    nextPhase();
  }
  
  timer_active = !timer_active;
  if (timer_active) {
    updateStartTime();
    t = setTimeout("tick()", 30);
    document.getElementById('startstop_button_text').firstChild.nodeValue = "暂停";
  }
  else {
    clearTimeout(t);
    document.getElementById('startstop_button_text').firstChild.nodeValue = "开始";
  }
}

function tick () {
  // Trap big "time jumps" occurring in the rare event of a changing system time (e.g. due to time synchronization)
  if(Math.abs(Date.now() - lastTickAt) > 1000) {
    /* Actually, ticks *will* happen with and interval roughly above 30ms, depending on the machine's performance
     * Using this threshold of 1s is kind of a "compromise": (1) no actions will be taken on low-performant machines since they *will* tick with
     * intervals less than 1s and (2) a "loss" of such a small amount of time is still managable (as opposed to a loss of multiple minutes)
     */
    phases[current_phase].current_time += 1000;
    updateStartTime();
  } else {
    // The time elapsed since the large tick sounds reasonable. Everything's fine.
    phases[current_phase].current_time = Date.now() - startTime;
  }
  
  lastTickAt = Date.now();
  draw();
  if (timer_active) {
    t = setTimeout("tick()", 30);
  }
}

function draw () {
  var total_time = phases[current_phase].duration + phases[current_phase].linked_offset;
  var time_string = toMinutesSeconds(phases[current_phase].current_time) + " of " + toMinutesSeconds(total_time);
  document.getElementById('timedisplay').firstChild.nodeValue = time_string;
  var arc = document.getElementById('foreground');
  var center = "M" + (radius+topleftspacing) + "," + (radius+topleftspacing);
  var startpoint = "v-" + radius;
  var arcradius = "a"+radius+","+radius+" ";
  var largeflag = "0 ";
  if (phases[current_phase].current_time % total_time > total_time / 2) {
    largeflag = "1 ";
  }
  var sweepflag = "1 ";
  var angle = 2*Math.PI*(phases[current_phase].current_time % total_time) / total_time; 
  var stopx = Math.sin(angle)*radius;
  var stopy = -Math.cos(angle)*radius+300;
  var stoppoint = stopx + "," + stopy + " ";
  var pathdescription = center + startpoint + arcradius + "0 " + largeflag + sweepflag + stoppoint + "z";
  var re = /(?:\.([^.]+))?$/;
  var index;
  arc.setAttributeNS(null,"d",pathdescription);
  arc.setAttributeNS(null,"stroke", "#000"); 
  arc.setAttributeNS(null,"stroke-width", "1"); 
  
  if (phases[current_phase].current_time >= total_time * 3/4) {
    arc.setAttributeNS(null,"fill", "#f90"); 
  }
  if (phases[current_phase].current_time >= total_time - 30000) {
    arc.setAttributeNS(null,"fill", "#f60"); 
  }
  if (phases[current_phase].current_time >= total_time - 10000) {
    arc.setAttributeNS(null,"fill", "#f00"); 
  }
  if (phases[current_phase].current_time >= total_time) {
    arc.setAttributeNS(null, "fill", "#f00");
    document.getElementById('background').setAttributeNS(null,"fill","#f90");
  }
  if(phases[current_phase].current_time >= 2 * total_time) {
    arc.setAttributeNS(null, "fill", "#fa0");
    document.getElementById('background').setAttributeNS(null,"fill","#fa0");
    document.getElementById('background').setAttributeNS(null,"stroke","#fa0");
    arc.setAttributeNS(null,"stroke-width", "0");
    if((phases[current_phase].current_time % 2000) < 1000) {
      arc.setAttributeNS(null, "fill", "#f00");
      document.getElementById('background').setAttributeNS(null,"fill","#f00");
      document.getElementById('background').setAttributeNS(null,"stroke","#f00");
    }
  }

}

function toMinutesSeconds (msec) {
  var sec = Math.floor(msec/1000);
  var minutes = Math.floor(sec / 60);
  var seconds = sec % 60;
  var minutes_string = (minutes < 10) ? "0"+minutes : minutes.toString();
  var seconds_string = (seconds < 10) ? "0"+seconds : seconds.toString();
  return (minutes_string + ":" + seconds_string);
}
