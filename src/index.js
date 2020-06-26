import p5 from 'p5/lib/p5.min';
import 'p5/lib/addons/p5.dom.min';
import Tone from 'tone';
import StartAudioContext from 'startaudiocontext';
import moment from 'moment';

var counter_day = document.getElementById('counter-day');
var counter_hour = document.getElementById('counter-hour');


const sketch = (p) => {

	class DataPoint {
		constructor() {
  			this.pos = p.createVector(0,0,0);
  			this.label = "";
  			this.color = p.color(0,255,255,255);
  			this.size = 1;
  			this.trig = 0;
  			this.canTrig = true;
		}

  		drawPoint(){
			// p.noStroke();
			p.strokeWeight(0.1);
			p.fill(this.color);
			p.ambientMaterial(this.r, this.r,this.r);
			p.push();
			p.translate(this.pos.x, this.pos.y, this.pos.z);
  		//   p.rotateX(this.size,0,0);
			p.box(this.size);
			p.fill(this.color);
			// p.fill(255,0,0,this.trig);
			p.box(this.size * 1.5);
		
			// let rnd = p.floor(p.random(10));
			// synths[ rnd ].envelope.attack = 1/1000;
			// synths[ rnd ].triggerAttackRelease( Tone.Midi( ((255/20 + 2) - this.size + 2) * 10 ).toFrequency(), this.size/500);
	
			// if(this.trig == 255) {
			// 	if(this.canTrig) {
			// 		let rnd = p.floor(p.random(10));
			// 		synths[ rnd ].envelope.attack = this.r/1000;
			// 		synths[ rnd ].triggerAttackRelease( Tone.Midi( ((255/20 + 2) - this.size + 2) * 10 ).toFrequency(), this.size/500);
			// 		// this.canTrig = false;
			// 	}
			// }


  		  this.trig-=100;

  		  p.pop();


  		}
		
  		setPos(p) {
  			this.pos = p;
  			return this;
  		}
		
  		setCol(color_string) {
  			this.color = p.color(color_string);
  			this.r = 0;
  			this.g = 0;
  			this.b = 0;
  			return this;
  		}
		
  		setSize(s) {
  			this.size = s;
  			return this;
  		}
	}

	let Y;
	let stepCount = 0;
	let data = [];
	let features = [];

	let playHeadx = -250;
	let playHeady = -250;
	
	let x = 0;
	let y = 0;
	let easing = 0.9;
	let synths = [];

	var player;
	var last_index = 0;

	var tsne_data = null;
	var data_length = null;
	var current_date = null;

	let color_palette = ['rgb(166,206,227)','rgb(31,120,180)','rgb(178,223,138)','rgb(51,160,44)','rgb(251,154,153)','rgb(227,26,28)','rgb(253,191,111)','rgb(255,127,0)','rgb(202,178,214)','rgb(106,61,154)']

	moment.locale('es');

	var panner = new Tone.Panner(-1).toMaster();
	var freeverb = new Tone.Freeverb().connect(panner);
        freeverb.dampening.value = 3500;
        freeverb.roomSize.value = 0.79;
	
	for(let i=0; i<10; i++) {
		synths.push(new Tone.FMSynth({
                "harmonicity"  : 10 ,
                "modulationIndex"  : 80 ,
                "detune"  : 0 ,
                "oscillator"  : {
                    "type"  : "sine"
                }  ,
                "envelope"  : {
                    "attack"  : 0.001 ,
                    "decay"  : 0.003 ,
                    "sustain"  : 0.06 ,
                    "release"  : 0.3
                }  ,
                "modulation"  : {
                    "type"  : "square"
                }  ,
                "modulationEnvelope"  : {
                    "attack"  : 0.01 ,
                    "decay"  : 0.02 ,
                    "sustain"  : 0.03 ,
                    "release"  : 0.033
                },
                "portamento" : 0.01 
            }).connect(freeverb));
	}

	p.preload = () => {
		player = new Tone.Player({
									"url" : './assets/audio.mp3',
									"autostart" : true,
									"loop": true,
								}).toMaster();
		player.autostart = true;

		tsne_data = p.loadJSON("/assets/tweets_tsne.json");
	}

	p.setup = () => {

		let canvas = p.createCanvas(p.windowWidth-20,p.windowHeight-20, p.WEBGL);

		p.smooth();

		data_length = Object.keys(tsne_data).length;

		current_date = moment(tsne_data[100].date);
		// const counter = selectAll('.counter');

		p.frameRate(60);


	}


	let zp = 0;
	p.draw = () => {

		let targetX = p.map(p.mouseX,0,p.width,-1,1);
		let dx = targetX - x;
		x += dx * easing;

		let targetY = p.map(p.mouseY,0,p.height,-1,1);
		let dy = targetY - y;
		y += dy * easing;

		p.camera(p.sin(p.frameCount/300) * 10+x, p.cos(p.frameCount/300) * 20+y, (p.cos(p.frameCount/600)/8+0.5)*250, 0, 0, 0, 0, 1, 0);
		// p.background(150);
		p.clear();
	
		// panner.pan.value = playHeadx / 250;

		p.pointLight(150, 150, 150, p.frameCount%p.width, 0, 200);
		// p.directionalLight(255,255,255, -1, 0, -1);
		p.ambientLight(p.frameCount%p.width);

		// stepCount++;
  		// if(stepCount<600) {
    	// 	// tsne.step();
  		// }

		let an_hour_before = current_date.clone().subtract(1,'hours');
		
  		for(let i=last_index; i < data_length; i++) {

			if ( moment(tsne_data[i].date).isBetween(an_hour_before,current_date)  ){

				let x_coord = tsne_data[i].tsne_coords_1*100;
				let y_coord = tsne_data[i].tsne_coords_2*100;
				let z_coord = tsne_data[i].tsne_coords_3*100;

				let d = new DataPoint();

				d.setCol( color_palette[tsne_data[i].topic_num] ).setSize(1);
				
				if( p.random() < 0.5 ) {
					d.trig = 255;
					d.canTrig = true;
				}

				d.setPos( p.createVector(x_coord, y_coord, z_coord) ).drawPoint();



			} else if (moment(tsne_data[i].date).isBefore(an_hour_before)) {
				last_index = i;
			} else if (moment(tsne_data[i].date).isAfter(current_date)) {
				break;
			}
			
		}


		if (data_length - last_index != 1) {

			counter_day.innerHTML = current_date.format("dddd, MMMM DD YYYY");
			counter_hour.innerHTML = current_date.format("HH:mm");

			current_date = current_date.add(1,'m');

		} else {

			for(let i=data_length-100; i < data_length; i++) {

				let x_coord = tsne_data[i].tsne_coords_1*100;
				let y_coord = tsne_data[i].tsne_coords_2*100;
				let z_coord = tsne_data[i].tsne_coords_3*100;

				let d = new DataPoint();

				d.setCol( color_palette[tsne_data[i].topic_num] ).setSize(1);
				
				if( p.random() < 0.5 ) {
					d.trig = 255;
					d.canTrig = true;
				}

				d.setPos( p.createVector(x_coord, y_coord, z_coord) ).drawPoint();

			}

		}

		// counter_day.innerHTML = current_date.format("dddd, MMMM DD YYYY");
		// counter_hour.innerHTML = current_date.format("HH:mm");

		// current_date = current_date.add(1,'d');


  		// p.noFill();
  		// p.stroke(255, 50);
		// p.box(500);
		 
		// date = date.add(1,'m');
		// console.log(date.format("dddd, MMMM DD YYYY, HH:mm"));

		

	}

  p.keyPressed = () => {
        if(p.key == 'm') {
            p.save(Date.now() + ".jpg");
        }
  }
  p.mousePressed = () => {
        StartAudioContext(Tone.context).then(function(){});
  }
}

export default sketch;
new p5(sketch,document.getElementById('p5sketch'));

