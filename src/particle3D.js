import {ParticleSystem} from './ParticleSystem'
import {DataProcess} from './DataProcess'
import {Util} from './Util'
import * as Cesium from 'cesium/Cesium'
import {defaultParticleSystemOptions} from './options'

export default class Particle3D {
  constructor(viewer, file , userInput = defaultParticleSystemOptions) {

    var animate = null;
    const that = this;
    var resized = false;

    this.moveStartFun = function () {
      that.scene.primitives.show = false;
    }

    this.moveEndFun = function () {
      that.updateViewerParameters();
      that.particleSystem.applyViewerParameters(that.viewerParameters);
      that.scene.primitives.show = true;
    }

    this.resizeFun = function () {
      resized = true;
      that.scene.primitives.show = false;
      that.scene.primitives.removeAll();
    }

    this.preRenderFun = function () {
      if (resized) {
        that.particleSystem.canvasResize(that.scene.context);
        resized = false;
        that.addPrimitives();
        that.scene.primitives.show = true;
      }
    }

    this.viewer = viewer;
    this.scene = this.viewer.scene;
    this.camera = this.viewer.camera;
    this.userInput = userInput;
    this.file = file;
    
    this.viewerParameters = {
      lonRange: new Cesium.Cartesian2(),
      latRange: new Cesium.Cartesian2(),
      pixelSize: 0.0
    };
    // use a smaller earth radius to make sure distance to camera > 0
    this.globeBoundingSphere = new Cesium.BoundingSphere(Cesium.Cartesian3.ZERO, 0.99 * 6378137.0);
    this.updateViewerParameters();

    DataProcess.loadData(this.file).then(
      (data) => {
        this.particleSystem = new ParticleSystem(this.scene.context, data,
          userInput, this.viewerParameters);
        this.addPrimitives();
      });

  }

  addPrimitives() {
    // the order of primitives.add() should respect the dependency of primitives
    this.scene.primitives.add(this.particleSystem.particlesComputing.primitives.calculateSpeed);
    this.scene.primitives.add(this.particleSystem.particlesComputing.primitives.updatePosition);
    this.scene.primitives.add(this.particleSystem.particlesComputing.primitives.postProcessingPosition);

    this.scene.primitives.add(this.particleSystem.particlesRendering.primitives.segments);
    this.scene.primitives.add(this.particleSystem.particlesRendering.primitives.trails);
    this.scene.primitives.add(this.particleSystem.particlesRendering.primitives.screen);
  }

  updateViewerParameters() {
    var viewRectangle = this.camera.computeViewRectangle(this.scene.globe.ellipsoid);
    var lonLatRange = Util.viewRectangleToLonLatRange(viewRectangle);
    this.viewerParameters.lonRange.x = lonLatRange.lon.min;
    this.viewerParameters.lonRange.y = lonLatRange.lon.max;
    this.viewerParameters.latRange.x = lonLatRange.lat.min;
    this.viewerParameters.latRange.y = lonLatRange.lat.max;

    var pixelSize = this.camera.getPixelSize(
      this.globeBoundingSphere,
      this.scene.drawingBufferWidth,
      this.scene.drawingBufferHeight
    );

    if (pixelSize > 0) {
      this.viewerParameters.pixelSize = pixelSize;
    }
  }

  setupEventListeners() {
    this.camera.moveStart.addEventListener(this.moveStartFun);
    this.camera.moveEnd.addEventListener(this.moveEndFun);
    window.addEventListener("resize", this.resizeFun);
    this.scene.preRender.addEventListener(this.preRenderFun);
  }

  removeEventListeners() {
    this.camera.moveStart.removeEventListener(this.moveStartFun);
    this.camera.moveEnd.removeEventListener(this.moveEndFun);
    this.scene.preRender.removeEventListener(this.preRenderFun);
    window.removeEventListener("resize", this.resizeFun);
  }

  optionsChange(userInput) {
    this.particleSystem.applyUserInput(userInput);
  }

  start() {
    const that = this;
    that.scene.primitives.show = true;
    this.setupEventListeners();
    var animate = function () {
      that.viewer.resize();
      that.viewer.scene.requestRender();
      that.animate = requestAnimationFrame(animate);
    }
    animate();
  }
  stop() {
    this.scene.primitives.show = false;
    this.viewer.scene.requestRender();
    this.removeEventListeners();
    window.cancelAnimationFrame(this.animate);
  }
  remove() {
    this.stop();
    this.scene.primitives.removeAll();
  }
}