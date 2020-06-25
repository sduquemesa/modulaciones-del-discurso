import p5 from 'p5/lib/p5.min';
import Tone from 'tone';
import StartAudioContext from 'startaudiocontext';
import moment from 'moment';

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
  		//   p.fill(255,0,0,this.trig);
  		  	p.box(this.size * 1.5);
  		  
			if(this.trig == 255) {
				if(this.canTrig) {
					let rnd = p.floor(p.random(10));
					synths[ rnd ].envelope.attack = this.r/1000;
					synths[ rnd ].triggerAttackRelease( Tone.Midi( ((255/20 + 2) - this.size + 2) * 10 ).toFrequency(), this.size/500);
					this.canTrig = false;
				}
			}


  		  this.trig-=100;

  		  p.pop();


  		}
		
  		setPos(p) {
  			this.pos = p;
  			return this;
  		}
		
  		setCol(color_string) {
  			this.color = p.color(color_string);
  			this.r = 255;
  			this.g = 255;
  			this.b = 255;
  			return this;
  		}
		
  		setSize(s) {
  			this.size = s;
  			return this;
  		}
	}

	let num = 500;
	let tsne;
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

	var tsne_data = null;
	var date = null;

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

		let canvas = p.createCanvas(p.windowWidth-100,p.windowHeight-20, p.WEBGL);
		p.smooth();

		// console.log(player);
		// console.log('data',tsne_data);

		date = moment(tsne_data['0'].date);
		var data_length = Object.keys(tsne_data).length;
		// console.log('data',data_length);
				
		// console.log('setup',date,tsne_data);
		// console.group('initialize data')
  		for(let i=0; i<1000; i++) {			

			// getting data from tsne
			let f1 = tsne_data[i].tsne_coords_1*10;
			let f2 = tsne_data[i].tsne_coords_2*10;
			let f3 = tsne_data[i].tsne_coords_3*10;

			// let f1 = p.random(255);
			// let f2 = p.random(255);
			// let f3 = p.random(255);
	
			// add generated data to an array of feature vectors
			features.push( [f1, f2, f3] ); // feature vector's length (components) can be selected freely
		
			let d = new DataPoint();
			// use data as color components for the datapoints
			// d.setCol( f1, f2, f3, 255 ).setSize(f1/20 + 2);
			// d.setCol( 255, 255, tsne_data[i].topic_num*25.5, 255 ).setSize(f1/20 + 2);
			d.setCol( color_palette[tsne_data[i].topic_num] ).setSize(p.dist(f1,f2,f3,0, 0,0)*0.2);
			data.push(d);	
			
		  }
		//   console.groupEnd();
  		
		Y = features;
	}


	let zp = 0;
	p.draw = () => {

		p.camera(p.sin(p.frameCount/300) * 10, p.cos(p.frameCount/300) * 10, (p.cos(p.frameCount/600)/8+1)*200, 0, 0, 0, 0, 1, 0);
		p.background(30);
		p.frameRate(60);

		let targetX = p.constrain(p.mouseX + p.sin(-p.frameCount/20) * 80,0,p.width);
  		let dx = targetX - x;
  		x += dx * easing;

  		let targetY = p.constrain(p.mouseY + p.cos(-p.frameCount/20) * 80,0,p.height);
  		let dy = targetY - y;
  		y += dy * easing;
		
		playHeadx = p.map(x,0,p.width,-50,50);
		playHeady = p.map(y,0,p.height,-50,50);
		
		/*if(playHeadx > 250) {
			playHeadx = -250;
			for(let i=0; i< Y.length; i++) {
    			data[i].canTrig = true;
    		}
		}*/

		panner.pan.value = playHeadx / 250;

		p.pointLight(150, 150, 150, p.frameCount%p.width, 0, 200);
		// p.directionalLight(255,255,255, -1, 0, -1);
		p.ambientLight(0);

		//p.rotateY(p.sin(p.frameCount/1000) * p.PI/4);
		//p.rotateX(-p.frameCount/1000);

		// zp = p.sin(p.frameCount/100) * 250;
		// p.push();
		// p.translate(playHeadx,0,0);
		// p.fill(255,120);
		// p.noStroke();
		// p.box(1,500,0);
		// p.pop();

		// p.push();
		// p.translate(0,playHeady,0);
		// p.fill(255,120);
		// p.noStroke();
		// p.box(500,1,0);
		// p.pop();

		// p.push();
		// p.translate(playHeadx,playHeady,0);
		// p.fill(255,0,0,40);
		// p.noStroke();
		// p.box(1,1,500);
		// p.pop();

		stepCount++;
  		if(stepCount<600) {
    		// tsne.step();
  		}

  		for(let i=0; i< Y.length; i++) {
    		data[i].setPos( p.createVector(Y[i][0] * 10, Y[i][1] * 10, Y[i][2] * 10) ).drawPoint();
    		if(p.dist(data[i].pos.x,data[i].pos.y,0, playHeadx,playHeady, 0) <= 100) {
    			data[i].trig = 255;
    		} else {
    			data[i].canTrig = true;
    		}
  		}

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
new p5(sketch);


