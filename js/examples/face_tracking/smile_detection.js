var smileFactor;

(function exampleCode() {
	"use strict";

	brfv4Example.initCurrentExample = function(brfManager, resolution) {
		brfManager.init(resolution, resolution, brfv4Example.appId);
	};

	brfv4Example.updateCurrentExample = function(brfManager, imageData, draw) {

		brfManager.update(imageData);

		draw.clear();

		// Face detection results: a rough rectangle used to start the face tracking.

		draw.drawRects(brfManager.getAllDetectedFaces(),	false, 1.0, 0x00a1ff, 0.5);
		draw.drawRects(brfManager.getMergedDetectedFaces(),	false, 2.0, 0xffd200, 1.0);

		var faces = brfManager.getFaces(); // default: one face, only one element in that array.

		for(var i = 0; i < faces.length; i++) {

			var face = faces[i];

			if(		face.state === brfv4.BRFState.FACE_TRACKING_START ||
					face.state === brfv4.BRFState.FACE_TRACKING) {

				// Smile Detection

				setPoint(face.vertices, 48, p0); // mouth corner left
				setPoint(face.vertices, 54, p1); // mouth corner right
				//console.log(face.vertices);

				var mouthWidth = calcDistance(p0, p1);

				setPoint(face.vertices, 39, p1); // left eye inner corner
				setPoint(face.vertices, 42, p0); // right eye outer corner

				var eyeDist = calcDistance(p0, p1);
				smileFactor = mouthWidth / eyeDist;

				smileFactor -= 1.40; // 1.40 - neutral, 1.70 smiling

				if(smileFactor > 0.25) smileFactor = 0.25;
				if(smileFactor < 0.00) smileFactor = 0.00;

				smileFactor *= 4.0;

				if(smileFactor < 0.0) { smileFactor = 0.0; }
				if(smileFactor > 1.0) { smileFactor = 1.0; }

				//console.log(smileFactor);
				// Let the color show you how much you are smiling.

				var color =
					(((0xff * (1.0 - smileFactor) & 0xff) << 16)) +
					(((0xff * smileFactor) & 0xff) << 8);

				// Face Tracking results: 68 facial feature points.

				draw.drawTriangles(	face.vertices, face.triangles, false, 1.0, color, 0.4);
				draw.drawVertices(	face.vertices, 2.0, false, color, 0.4);

				// brfv4Example.dom.updateHeadline("BRFv4 - intermediate - face tracking - simple " +
				// 	"smile detection.\nDetects how much someone is smiling. smile factor: " +
				// 	(smileFactor * 100).toFixed(0) + "%");
				brfv4Example.dom.updateHeadline((smileFactor * 100).toFixed(0) + "%");
			}
		}
	};

	var p0				= new brfv4.Point();
	var p1				= new brfv4.Point();

	var setPoint		= brfv4.BRFv4PointUtils.setPoint;
	var calcDistance	= brfv4.BRFv4PointUtils.calcDistance;

	// brfv4Example.dom.updateHeadline("BRFv4 - intermediate - face tracking - simple smile " +
	// 	"detection.\nDetects how much someone is smiling.");
	//
	// brfv4Example.dom.updateCodeSnippet(exampleCode + "");
})();

//bad tv shader
var camera, scene, renderer;
var video, videoTexture,videoMaterial;
var composer;
var shaderTime = 0;
var badTVParams, badTVPass;
var staticParams, staticPass;
var rgbParams, rgbPass;
var filmParams, filmPass;
var renderPass, copyPass;
var gui;
var pnoise, globalParams;
var m = 1;
var e = 0.0088;

badTVeffect();
animate();

function setup() {
	// setup canvas
	var cnv = createCanvas(400, 300);
	cnv.position(0, 0);
}

function badTVeffect() {
		camera = new THREE.PerspectiveCamera(55, 1080/ 720, 20, 3000);
		camera.position.z = 1000;
		scene = new THREE.Scene();
		//Load Video
		video = document.createElement( 'img' );
		// video.loop = true;
		video.src = 'img/logo.jpg';

		//init video texture
		videoTexture = new THREE.Texture( video );
		videoTexture.minFilter = THREE.LinearFilter;
		videoTexture.magFilter = THREE.LinearFilter;
		videoMaterial = new THREE.MeshBasicMaterial( {
			map: videoTexture
		} );
		//Add video plane
		var planeGeometry = new THREE.PlaneGeometry( 1080, 720,1,1 );
		var plane = new THREE.Mesh( planeGeometry, videoMaterial );
		scene.add( plane );
		plane.z = 0;
		plane.scale.x = plane.scale.y = 1.45;

		//init renderer
		renderer = new THREE.WebGLRenderer();
		renderer.setSize( 1150,800 );
		document.body.appendChild( renderer.domElement );
		//POST PROCESSING
		//Create Shader Passes
		renderPass = new THREE.RenderPass( scene, camera );
		badTVPass = new THREE.ShaderPass( THREE.BadTVShader );
		rgbPass = new THREE.ShaderPass( THREE.RGBShiftShader );
		filmPass = new THREE.ShaderPass( THREE.FilmShader );
		staticPass = new THREE.ShaderPass( THREE.StaticShader );
		copyPass = new THREE.ShaderPass( THREE.CopyShader );
		//set shader uniforms
		filmPass.uniforms.grayscale.value = 0;
		//Init DAT GUI control panel
		badTVParams = {
			mute:true,
			show: true,
			distortion: 1,
			distortion2: 1.0,
			speed: 0.3,
			rollSpeed: 0.1
		};
		staticParams = {
			show: true,
			amount:0.25,
			size:4.0
		};
		rgbParams = {
			show: true,
			amount: 0.005,
			angle: 0.0,
		};
		filmParams = {
			show: true,
			count: 800,
			sIntensity: 0.9,
			nIntensity: 0.4
		};

//     gui = new dat.GUI();

// 		gui.add(badTVParams, 'mute').onChange(onToggleMute);
// 		var f1 = gui.addFolder('Bad TV');
// 		f1.add(badTVParams, 'show').onChange(onToggleShaders);
// 		f1.add(badTVParams, 'distortion', 0.1, 20).step(0.1).listen(m).name('Thick Distort').onChange(onParamsChange);
// 		f1.add(badTVParams, 'distortion2', 0.1, 20).step(0.1).listen().name('Fine Distort').onChange(onParamsChange);
// 		f1.add(badTVParams, 'speed', 0.0,1.0).step(0.01).listen().name('Distort Speed').onChange(onParamsChange);
// 		f1.add(badTVParams, 'rollSpeed', 0.0,1.0).step(0.01).listen().name('Roll Speed').onChange(onParamsChange);
// 		f1.open();
// 		var f2 = gui.addFolder('RGB Shift');
// 		f2.add(rgbParams, 'show').onChange(onToggleShaders);
// 		f2.add(rgbParams, 'amount', 0.0, 0.1).listen().onChange(onParamsChange);
// 		f2.add(rgbParams, 'angle', 0.0, 2.0).listen().onChange(onParamsChange);
// 		f2.open();
// 		var f4 = gui.addFolder('Static');
// 		f4.add(staticParams, 'show').onChange(onToggleShaders);
// 		f4.add(staticParams, 'amount', 0.0,1.0).step(0.01).listen().onChange(onParamsChange);
// 		f4.add(staticParams, 'size', 1.0,100.0).step(1.0).onChange(onParamsChange);
// 		f4.open();
// 		var f3 = gui.addFolder('Scanlines');
// 		f3.add(filmParams, 'show').onChange(onToggleShaders);
// 		f3.add(filmParams, 'count', 50, 1000).onChange(onParamsChange);
// 		f3.add(filmParams, 'sIntensity', 0.0, 2.0).step(0.1).onChange(onParamsChange);
// 		f3.add(filmParams, 'nIntensity', 0.0, 2.0).step(0.1).onChange(onParamsChange);
// 		f3.open();
// 		gui.close();


    onToggleShaders();
    onParamsChange();
  }

	function onParamsChange() {
		//copy gui params into shader uniforms
		badTVPass.uniforms[ 'distortion' ].value = badTVParams.distortion;
		badTVPass.uniforms[ 'distortion2' ].value = badTVParams.distortion2;
		badTVPass.uniforms[ 'speed' ].value = badTVParams.speed;
		badTVPass.uniforms[ 'rollSpeed' ].value = badTVParams.rollSpeed;
		staticPass.uniforms[ 'amount' ].value = staticParams.amount;
		staticPass.uniforms[ 'size' ].value = staticParams.size;
		rgbPass.uniforms[ 'angle' ].value = rgbParams.angle*Math.PI;
		rgbPass.uniforms[ 'amount' ].value = rgbParams.amount;
		filmPass.uniforms[ 'sCount' ].value = filmParams.count;
		filmPass.uniforms[ 'sIntensity' ].value = filmParams.sIntensity;
		filmPass.uniforms[ 'nIntensity' ].value = filmParams.nIntensity;
	}

	function map(num, in_min, in_max, out_min, out_max) {
  return (num - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

	function onToggleShaders(){
		//Add Shader Passes to Composer
		//order is important
		composer = new THREE.EffectComposer( renderer);
		composer.addPass( renderPass );

		if (filmParams.show){
			composer.addPass( filmPass );
		}
		if (badTVParams.show){
			composer.addPass( badTVPass );
		}
		if (rgbParams.show){
			composer.addPass( rgbPass );
		}
		if (staticParams.show){
			composer.addPass( staticPass );
		}
		composer.addPass( copyPass );
		copyPass.renderToScreen = true;
	}
	function onToggleMute(){
		video.volume  = badTVParams.mute ? 0 : 1;
	}
	function animate() {
		shaderTime += 0.1;
		m = map(smileFactor, 0, 1, 10, 1);
		e = map(smileFactor, 0, 1, 0.0993, 0.0088);
    badTVPass.uniforms[ 'distortion' ].value = m;
    // rgbPass.uniforms[ 'amount' ].value = e;
		badTVPass.uniforms[ 'time' ].value =  shaderTime;
		filmPass.uniforms[ 'time' ].value =  shaderTime;
		staticPass.uniforms[ 'time' ].value =  shaderTime;
		if ( video.readyState === video.HAVE_ENOUGH_DATA ) {
			if ( videoTexture ) videoTexture.needsUpdate = true;
		}
		requestAnimationFrame( animate );
		composer.render( 0.1);
	}
	function onResize() {
		renderer.setSize(window.innerWidth, window.innerHeight);
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
	}
