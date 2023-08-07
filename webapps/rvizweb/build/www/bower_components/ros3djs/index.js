var ROS3D = function (exports, THREE$1, ROSLIB, EventEmitter2) {
  'use strict';

  function _interopDefaultLegacy(e) {
    return e && typeof e === 'object' && 'default' in e ? e : {
      'default': e
    };
  }

  function _interopNamespace(e) {
    if (e && e.__esModule) return e;
    var n = Object.create(null);

    if (e) {
      Object.keys(e).forEach(function (k) {
        if (k !== 'default') {
          var d = Object.getOwnPropertyDescriptor(e, k);
          Object.defineProperty(n, k, d.get ? d : {
            enumerable: true,
            get: function () {
              return e[k];
            }
          });
        }
      });
    }

    n["default"] = e;
    return Object.freeze(n);
  }

  var THREE__namespace =
  /*#__PURE__*/
  _interopNamespace(THREE$1);

  var ROSLIB__namespace =
  /*#__PURE__*/
  _interopNamespace(ROSLIB);

  var EventEmitter2__default =
  /*#__PURE__*/
  _interopDefaultLegacy(EventEmitter2);

  var THREE = Object.assign({}, THREE__namespace); // Marker types

  var MARKER_ARROW = 0;
  var MARKER_CUBE = 1;
  var MARKER_SPHERE = 2;
  var MARKER_CYLINDER = 3;
  var MARKER_LINE_STRIP = 4;
  var MARKER_LINE_LIST = 5;
  var MARKER_CUBE_LIST = 6;
  var MARKER_SPHERE_LIST = 7;
  var MARKER_POINTS = 8;
  var MARKER_TEXT_VIEW_FACING = 9;
  var MARKER_MESH_RESOURCE = 10;
  var MARKER_TRIANGLE_LIST = 11; // Interactive marker feedback types

  var INTERACTIVE_MARKER_KEEP_ALIVE = 0;
  var INTERACTIVE_MARKER_POSE_UPDATE = 1;
  var INTERACTIVE_MARKER_MENU_SELECT = 2;
  var INTERACTIVE_MARKER_BUTTON_CLICK = 3;
  var INTERACTIVE_MARKER_MOUSE_DOWN = 4;
  var INTERACTIVE_MARKER_MOUSE_UP = 5; // Interactive marker control types

  var INTERACTIVE_MARKER_NONE = 0;
  var INTERACTIVE_MARKER_MENU = 1;
  var INTERACTIVE_MARKER_BUTTON = 2;
  var INTERACTIVE_MARKER_MOVE_AXIS = 3;
  var INTERACTIVE_MARKER_MOVE_PLANE = 4;
  var INTERACTIVE_MARKER_ROTATE_AXIS = 5;
  var INTERACTIVE_MARKER_MOVE_ROTATE = 6;
  var INTERACTIVE_MARKER_MOVE_3D = 7;
  var INTERACTIVE_MARKER_ROTATE_3D = 8;
  var INTERACTIVE_MARKER_MOVE_ROTATE_3D = 9; // Interactive marker rotation behavior

  var INTERACTIVE_MARKER_INHERIT = 0;
  var INTERACTIVE_MARKER_FIXED = 1;
  var INTERACTIVE_MARKER_VIEW_FACING = 2;
  /**
   * @function makeColorMaterial
   * @description Create a THREE material based on the given RGBA values.
   *
   * @param r - the red value
   * @param g - the green value
   * @param b - the blue value
   * @param a - the alpha value
   * @returns the THREE material
   */

  var makeColorMaterial = function (r, g, b, a) {
    var color = new THREE.Color();
    color.setRGB(r, g, b);

    if (a <= 0.99) {
      return new THREE.MeshBasicMaterial({
        color: color.getHex(),
        opacity: a + 0.1,
        transparent: true,
        depthWrite: true,
        blendSrc: THREE.SrcAlphaFactor,
        blendDst: THREE.OneMinusSrcAlphaFactor,
        blendEquation: THREE.ReverseSubtractEquation,
        blending: THREE.NormalBlending
      });
    } else {
      return new THREE.MeshPhongMaterial({
        color: color.getHex(),
        opacity: a,
        blending: THREE.NormalBlending
      });
    }
  };
  /**
   * @function intersectPlane
   * @description Return the intersection between the mouseray and the plane.
   *
   * @param mouseRay - the mouse ray
   * @param planeOrigin - the origin of the plane
   * @param planeNormal - the normal of the plane
   * @returns the intersection point
   */


  var intersectPlane = function (mouseRay, planeOrigin, planeNormal) {
    var vector = new THREE.Vector3();
    var intersectPoint = new THREE.Vector3();
    vector.subVectors(planeOrigin, mouseRay.origin);
    var dot = mouseRay.direction.dot(planeNormal); // bail if ray and plane are parallel

    if (Math.abs(dot) < mouseRay.precision) {
      return undefined;
    } // calc distance to plane


    var scalar = planeNormal.dot(vector) / dot;
    intersectPoint.addVectors(mouseRay.origin, mouseRay.direction.clone().multiplyScalar(scalar));
    return intersectPoint;
  };
  /**
   * @function findClosestPoint
   * @description Find the closest point on targetRay to any point on mouseRay. Math taken from
   * http://paulbourke.net/geometry/lineline3d/
   *
   * @param targetRay - the target ray to use
   * @param mouseRay - the mouse ray
   * @param the closest point between the two rays
   */


  var findClosestPoint = function (targetRay, mouseRay) {
    var v13 = new THREE.Vector3();
    v13.subVectors(targetRay.origin, mouseRay.origin);
    var v43 = mouseRay.direction.clone();
    var v21 = targetRay.direction.clone();
    var d1343 = v13.dot(v43);
    var d4321 = v43.dot(v21);
    var d1321 = v13.dot(v21);
    var d4343 = v43.dot(v43);
    var d2121 = v21.dot(v21);
    var denom = d2121 * d4343 - d4321 * d4321; // check within a delta

    if (Math.abs(denom) <= 0.0001) {
      return undefined;
    }

    var numer = d1343 * d4321 - d1321 * d4343;
    var mua = numer / denom;
    return mua;
  };
  /**
   * @function closestAxisPoint
   * @description Find the closest point between the axis and the mouse.
   *
   * @param axisRay - the ray from the axis
   * @param camera - the camera to project from
   * @param mousePos - the mouse position
   * @returns the closest axis point
   */


  var closestAxisPoint = function (axisRay, camera, mousePos) {
    // project axis onto screen
    var o = axisRay.origin.clone();
    o.project(camera);
    var o2 = axisRay.direction.clone().add(axisRay.origin);
    o2.project(camera); // d is the axis vector in screen space (d = o2-o)

    var d = o2.clone().sub(o); // t is the 2d ray param of perpendicular projection of mousePos onto o

    var tmp = new THREE.Vector2(); // (t = (mousePos - o) * d / (d*d))

    var t = tmp.subVectors(mousePos, o).dot(d) / d.dot(d); // mp is the final 2d-projected mouse pos (mp = o + d*t)

    var mp = new THREE.Vector2();
    mp.addVectors(o, d.clone().multiplyScalar(t)); // go back to 3d by shooting a ray

    var vector = new THREE.Vector3(mp.x, mp.y, 0.5);
    vector.unproject(camera);
    var mpRay = new THREE.Ray(camera.position, vector.sub(camera.position).normalize());
    return findClosestPoint(axisRay, mpRay);
  };
  /**
   * @fileOverview
   * @author Julius Kammerl - jkammerl@willowgarage.com
   */


  class DepthCloud extends THREE.Object3D {
    /**
     * The DepthCloud object.
     *
     * @constructor
     * @param options - object with following keys:
     *
     *   * url - the URL of the stream
     *   * streamType (optional) - the stream type: mjpeg or vp8 video (defaults to vp8)
     *   * f (optional) - the camera's focal length (defaults to standard Kinect calibration)
     *   * maxDepthPerTile (optional) - the factor with which we control the desired depth range (defaults to 1.0)
     *   * pointSize (optional) - point size (pixels) for rendered point cloud
     *   * width (optional) - width of the video stream
     *   * height (optional) - height of the video stream
     *   * whiteness (optional) - blends rgb values to white (0..100)
     *   * varianceThreshold (optional) - threshold for variance filter, used for compression artifact removal
     */
    constructor(options) {
      super();
      options = options || {};
      this.url = options.url;
      this.streamType = options.streamType || 'vp8';
      this.f = options.f || 526;
      this.maxDepthPerTile = options.maxDepthPerTile || 1.0;
      this.pointSize = options.pointSize || 3;
      this.width = options.width || 1024;
      this.height = options.height || 1024;
      this.resolutionFactor = Math.max(this.width, this.height) / 1024;
      this.whiteness = options.whiteness || 0;
      this.varianceThreshold = options.varianceThreshold || 0.000016667;
      this.isMjpeg = this.streamType.toLowerCase() === 'mjpeg';
      this.video = document.createElement(this.isMjpeg ? 'img' : 'video');
      this.video.crossOrigin = 'Anonymous';
      this.video.addEventListener(this.isMjpeg ? 'load' : 'loadedmetadata', this.metaLoaded.bind(this), false);

      if (!this.isMjpeg) {
        this.video.loop = true;
      }

      this.video.src = this.url;
      this.video.setAttribute('crossorigin', 'Anonymous'); // define custom shaders

      this.vertex_shader = ['uniform sampler2D map;', '', 'uniform float width;', 'uniform float height;', 'uniform float nearClipping, farClipping;', '', 'uniform float pointSize;', 'uniform float zOffset;', '', 'uniform float focallength;', 'uniform float maxDepthPerTile;', 'uniform float resolutionFactor;', '', 'varying vec2 vUvP;', 'varying vec2 colorP;', '', 'varying float depthVariance;', 'varying float maskVal;', '', 'float sampleDepth(vec2 pos)', '  {', '    float depth;', '    ', '    vec2 vUv = vec2( pos.x / (width*2.0), pos.y / (height*2.0)+0.5 );', '    vec2 vUv2 = vec2( pos.x / (width*2.0)+0.5, pos.y / (height*2.0)+0.5 );', '    ', '    vec4 depthColor = texture2D( map, vUv );', '    ', '    depth = ( depthColor.r + depthColor.g + depthColor.b ) / 3.0 ;', '    ', '    if (depth>0.99)', '    {', '      vec4 depthColor2 = texture2D( map, vUv2 );', '      float depth2 = ( depthColor2.r + depthColor2.g + depthColor2.b ) / 3.0 ;', '      depth = 0.99+depth2;', '    }', '    ', '    return depth;', '  }', '', 'float median(float a, float b, float c)', '  {', '    float r=a;', '    ', '    if ( (a<b) && (b<c) )', '    {', '      r = b;', '    }', '    if ( (a<c) && (c<b) )', '    {', '      r = c;', '    }', '    return r;', '  }', '', 'float variance(float d1, float d2, float d3, float d4, float d5, float d6, float d7, float d8, float d9)', '  {', '    float mean = (d1 + d2 + d3 + d4 + d5 + d6 + d7 + d8 + d9) / 9.0;', '    float t1 = (d1-mean);', '    float t2 = (d2-mean);', '    float t3 = (d3-mean);', '    float t4 = (d4-mean);', '    float t5 = (d5-mean);', '    float t6 = (d6-mean);', '    float t7 = (d7-mean);', '    float t8 = (d8-mean);', '    float t9 = (d9-mean);', '    float v = (t1*t1+t2*t2+t3*t3+t4*t4+t5*t5+t6*t6+t7*t7+t8*t8+t9*t9)/9.0;', '    return v;', '  }', '', 'vec2 decodeDepth(vec2 pos)', '  {', '    vec2 ret;', '    ', '    ', '    float depth1 = sampleDepth(vec2(position.x-1.0, position.y-1.0));', '    float depth2 = sampleDepth(vec2(position.x, position.y-1.0));', '    float depth3 = sampleDepth(vec2(position.x+1.0, position.y-1.0));', '    float depth4 = sampleDepth(vec2(position.x-1.0, position.y));', '    float depth5 = sampleDepth(vec2(position.x, position.y));', '    float depth6 = sampleDepth(vec2(position.x+1.0, position.y));', '    float depth7 = sampleDepth(vec2(position.x-1.0, position.y+1.0));', '    float depth8 = sampleDepth(vec2(position.x, position.y+1.0));', '    float depth9 = sampleDepth(vec2(position.x+1.0, position.y+1.0));', '    ', '    float median1 = median(depth1, depth2, depth3);', '    float median2 = median(depth4, depth5, depth6);', '    float median3 = median(depth7, depth8, depth9);', '    ', '    ret.x = median(median1, median2, median3);', '    ret.y = variance(depth1, depth2, depth3, depth4, depth5, depth6, depth7, depth8, depth9);', '    ', '    return ret;', '    ', '  }', '', '', 'void main() {', '  ', '  vUvP = vec2( position.x / (width*2.0), position.y / (height*2.0)+0.5 );', '  colorP = vec2( position.x / (width*2.0)+0.5 , position.y / (height*2.0)  );', '  ', '  vec4 pos = vec4(0.0,0.0,0.0,0.0);', '  depthVariance = 0.0;', '  ', '  if ( (vUvP.x<0.0)|| (vUvP.x>0.5) || (vUvP.y<0.5) || (vUvP.y>0.0))', '  {', '    vec2 smp = decodeDepth(vec2(position.x, position.y));', '    float depth = smp.x;', '    depthVariance = smp.y;', '    ', '    float z = -depth;', '    ', '    pos = vec4(', '      ( position.x / width - 0.5 ) * z * 0.5 * maxDepthPerTile * resolutionFactor * (1000.0/focallength) * -1.0,', '      ( position.y / height - 0.5 ) * z * 0.5 * maxDepthPerTile * resolutionFactor * (1000.0/focallength),', '      (- z + zOffset / 1000.0) * maxDepthPerTile,', '      1.0);', '    ', '    vec2 maskP = vec2( position.x / (width*2.0), position.y / (height*2.0)  );', '    vec4 maskColor = texture2D( map, maskP );', '    maskVal = ( maskColor.r + maskColor.g + maskColor.b ) / 3.0 ;', '  }', '  ', '  gl_PointSize = pointSize;', '  gl_Position = projectionMatrix * modelViewMatrix * pos;', '  ', '}'].join('\n');
      this.fragment_shader = ['uniform sampler2D map;', 'uniform float varianceThreshold;', 'uniform float whiteness;', '', 'varying vec2 vUvP;', 'varying vec2 colorP;', '', 'varying float depthVariance;', 'varying float maskVal;', '', '', 'void main() {', '  ', '  vec4 color;', '  ', '  if ( (depthVariance>varianceThreshold) || (maskVal>0.5) ||(vUvP.x<0.0)|| (vUvP.x>0.5) || (vUvP.y<0.5) || (vUvP.y>1.0))', '  {  ', '    discard;', '  }', '  else ', '  {', '    color = texture2D( map, colorP );', '    ', '    float fader = whiteness /100.0;', '    ', '    color.r = color.r * (1.0-fader)+ fader;', '    ', '    color.g = color.g * (1.0-fader)+ fader;', '    ', '    color.b = color.b * (1.0-fader)+ fader;', '    ', '    color.a = 1.0;//smoothstep( 20000.0, -20000.0, gl_FragCoord.z / gl_FragCoord.w );', '  }', '  ', '  gl_FragColor = vec4( color.r, color.g, color.b, color.a );', '  ', '}'].join('\n');
    }

    /**
     * Callback called when video metadata is ready
     */
    metaLoaded() {
      this.metaLoaded = true;
      this.initStreamer();
    }

    /**
     * Callback called when video metadata is ready
     */
    initStreamer() {
      if (this.metaLoaded) {
        this.texture = new THREE.Texture(this.video);
        this.geometry = new THREE.Geometry();

        for (var i = 0, l = this.width * this.height; i < l; i++) {
          var vertex = new THREE.Vector3();
          vertex.x = i % this.width;
          vertex.y = Math.floor(i / this.width);
          this.geometry.vertices.push(vertex);
        }

        this.material = new THREE.ShaderMaterial({
          uniforms: {
            'map': {
              type: 't',
              value: this.texture
            },
            'width': {
              type: 'f',
              value: this.width
            },
            'height': {
              type: 'f',
              value: this.height
            },
            'focallength': {
              type: 'f',
              value: this.f
            },
            'pointSize': {
              type: 'f',
              value: this.pointSize
            },
            'zOffset': {
              type: 'f',
              value: 0
            },
            'whiteness': {
              type: 'f',
              value: this.whiteness
            },
            'varianceThreshold': {
              type: 'f',
              value: this.varianceThreshold
            },
            'maxDepthPerTile': {
              type: 'f',
              value: this.maxDepthPerTile
            },
            'resolutionFactor': {
              type: 'f',
              value: this.resolutionFactor
            }
          },
          vertexShader: this.vertex_shader,
          fragmentShader: this.fragment_shader
        });
        this.mesh = new THREE.ParticleSystem(this.geometry, this.material);
        this.mesh.position.x = 0;
        this.mesh.position.y = 0;
        this.add(this.mesh);
        var that = this;
        setInterval(function () {
          if (that.isMjpeg || that.video.readyState === that.video.HAVE_ENOUGH_DATA) {
            that.texture.needsUpdate = true;
          }
        }, 1000 / 30);
      }
    }

    /**
     * Start video playback
     */
    startStream() {
      if (!this.isMjpeg) {
        this.video.play();
      }
    }

    /**
     * Stop video playback
     */
    stopStream() {
      if (!this.isMjpeg) {
        this.video.pause();
      }
    }

  }
  /**
   * @fileOverview
   * @author David Gossow - dgossow@willowgarage.com
   */


  class Arrow extends THREE.Mesh {
    /**
     * A Arrow is a THREE object that can be used to display an arrow model.
     *
     * @constructor
     * @param options - object with following keys:
     *
     *   * origin (optional) - the origin of the arrow
     *   * direction (optional) - the direction vector of the arrow
     *   * length (optional) - the length of the arrow
     *   * headLength (optional) - the head length of the arrow
     *   * shaftDiameter (optional) - the shaft diameter of the arrow
     *   * headDiameter (optional) - the head diameter of the arrow
     *   * material (optional) - the material to use for this arrow
     */
    constructor(options) {
      options = options || {};
      var origin = options.origin || new THREE.Vector3(0, 0, 0);
      var direction = options.direction || new THREE.Vector3(1, 0, 0);
      var length = options.length || 1;
      var headLength = options.headLength || 0.2;
      var shaftDiameter = options.shaftDiameter || 0.05;
      var headDiameter = options.headDiameter || 0.1;
      var material = options.material || new THREE.MeshBasicMaterial();
      var shaftLength = length - headLength; // create and merge geometry

      var geometry = new THREE.CylinderGeometry(shaftDiameter * 0.5, shaftDiameter * 0.5, shaftLength, 12, 1);
      var m = new THREE.Matrix4();
      m.setPosition(new THREE.Vector3(0, shaftLength * 0.5, 0));
      geometry.applyMatrix(m); // create the head

      var coneGeometry = new THREE.CylinderGeometry(0, headDiameter * 0.5, headLength, 12, 1);
      m.setPosition(new THREE.Vector3(0, shaftLength + headLength * 0.5, 0));
      coneGeometry.applyMatrix(m); // put the arrow together

      geometry.merge(coneGeometry);
      super(geometry, material);
      this.position.copy(origin);
      this.setDirection(direction);
    }

    /**
     * Set the direction of this arrow to that of the given vector.
     *
     * @param direction - the direction to set this arrow
     */
    setDirection(direction) {
      var axis = new THREE.Vector3();

      if (direction.x === 0 && direction.z === 0) {
        axis.set(1, 0, 0);
      } else {
        axis.set(0, 1, 0).cross(direction);
      }

      var radians = Math.acos(new THREE.Vector3(0, 1, 0).dot(direction.clone().normalize()));
      this.matrix = new THREE.Matrix4().makeRotationAxis(axis.normalize(), radians);
      this.rotation.setFromRotationMatrix(this.matrix, this.rotation.order);
    }

    /**
     * Set this arrow to be the given length.
     *
     * @param length - the new length of the arrow
     */
    setLength(length) {
      this.scale.set(length, length, length);
    }

    /**
     * Set the color of this arrow to the given hex value.
     *
     * @param hex - the hex value of the color to use
     */
    setColor(hex) {
      this.material.color.setHex(hex);
    }

    /*
     * Free memory of elements in this marker.
     */
    dispose() {
      if (this.geometry !== undefined) {
        this.geometry.dispose();
      }

      if (this.material !== undefined) {
        this.material.dispose();
      }
    }

  }
  /**
   * @fileOverview
   * @author aleeper / http://adamleeper.com/
   * @author mrdoob / http://mrdoob.com/
   * @author gero3 / https://github.com/gero3
   * @author Mugen87 / https://github.com/Mugen87
   *
   * Description: A THREE loader for STL ASCII files, as created by Solidworks and other CAD programs.
   *
   * Supports both binary and ASCII encoded files, with automatic detection of type.
   *
   * The loader returns a non-indexed buffer geometry.
   *
   * Limitations:
   *  Binary decoding supports "Magics" color format (http://en.wikipedia.org/wiki/STL_(file_format)#Color_in_binary_STL).
   *  There is perhaps some question as to how valid it is to always assume little-endian-ness.
   *  ASCII decoding assumes file is UTF-8.
   *
   * Usage:
   *  var loader = new THREE.STLLoader();
   *  loader.load( './models/stl/slotted_disk.stl', function ( geometry ) {
   *    scene.add( new THREE.Mesh( geometry ) );
   *  });
   *
   * For binary STLs geometry might contain colors for vertices. To use it:
   *  // use the same code to load STL as above
   *  if (geometry.hasColors) {
   *    material = new THREE.MeshPhongMaterial({ opacity: geometry.alpha, vertexColors: THREE.VertexColors });
   *  } else { .... }
   *  var mesh = new THREE.Mesh( geometry, material );
   */


  THREE.STLLoader = function (manager) {
    this.manager = manager !== undefined ? manager : THREE.DefaultLoadingManager;
  };

  THREE.STLLoader.prototype = {
    constructor: THREE.STLLoader,
    load: function (url, onLoad, onProgress, onError) {
      var scope = this;
      var loader = new THREE.FileLoader(scope.manager);
      loader.setResponseType('arraybuffer');
      loader.load(url, function (text) {
        onLoad(scope.parse(text));
      }, onProgress, onError);
    },
    parse: function (data) {
      function isBinary(data) {
        var expect, face_size, n_faces, reader;
        reader = new DataView(data);
        face_size = 32 / 8 * 3 + 32 / 8 * 3 * 3 + 16 / 8;
        n_faces = reader.getUint32(80, true);
        expect = 80 + 32 / 8 + n_faces * face_size;

        if (expect === reader.byteLength) {
          return true;
        } // An ASCII STL data must begin with 'solid ' as the first six bytes.
        // However, ASCII STLs lacking the SPACE after the 'd' are known to be
        // plentiful.  So, check the first 5 bytes for 'solid'.
        // US-ASCII ordinal values for 's', 'o', 'l', 'i', 'd'


        var solid = [115, 111, 108, 105, 100];

        for (var i = 0; i < 5; i++) {
          // If solid[ i ] does not match the i-th byte, then it is not an
          // ASCII STL; hence, it is binary and return true.
          if (solid[i] != reader.getUint8(i, false)) return true;
        } // First 5 bytes read "solid"; declare it to be an ASCII STL


        return false;
      }

      function parseBinary(data) {
        var reader = new DataView(data);
        var faces = reader.getUint32(80, true);
        var r,
            g,
            b,
            hasColors = false,
            colors;
        var defaultR, defaultG, defaultB, alpha; // process STL header
        // check for default color in header ("COLOR=rgba" sequence).

        for (var index = 0; index < 80 - 10; index++) {
          if (reader.getUint32(index, false) == 0x434F4C4F
          /*COLO*/
          && reader.getUint8(index + 4) == 0x52
          /*'R'*/
          && reader.getUint8(index + 5) == 0x3D
          /*'='*/
          ) {
            hasColors = true;
            colors = [];
            defaultR = reader.getUint8(index + 6) / 255;
            defaultG = reader.getUint8(index + 7) / 255;
            defaultB = reader.getUint8(index + 8) / 255;
            alpha = reader.getUint8(index + 9) / 255;
          }
        }

        var dataOffset = 84;
        var faceLength = 12 * 4 + 2;
        var geometry = new THREE.BufferGeometry();
        var vertices = [];
        var normals = [];

        for (var face = 0; face < faces; face++) {
          var start = dataOffset + face * faceLength;
          var normalX = reader.getFloat32(start, true);
          var normalY = reader.getFloat32(start + 4, true);
          var normalZ = reader.getFloat32(start + 8, true);

          if (hasColors) {
            var packedColor = reader.getUint16(start + 48, true);

            if ((packedColor & 0x8000) === 0) {
              // facet has its own unique color
              r = (packedColor & 0x1F) / 31;
              g = (packedColor >> 5 & 0x1F) / 31;
              b = (packedColor >> 10 & 0x1F) / 31;
            } else {
              r = defaultR;
              g = defaultG;
              b = defaultB;
            }
          }

          for (var i = 1; i <= 3; i++) {
            var vertexstart = start + i * 12;
            vertices.push(reader.getFloat32(vertexstart, true));
            vertices.push(reader.getFloat32(vertexstart + 4, true));
            vertices.push(reader.getFloat32(vertexstart + 8, true));
            normals.push(normalX, normalY, normalZ);

            if (hasColors) {
              colors.push(r, g, b);
            }
          }
        }

        geometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
        geometry.addAttribute('normal', new THREE.BufferAttribute(new Float32Array(normals), 3));

        if (hasColors) {
          geometry.addAttribute('color', new THREE.BufferAttribute(new Float32Array(colors), 3));
          geometry.hasColors = true;
          geometry.alpha = alpha;
        }

        return geometry;
      }

      function parseASCII(data) {
        var geometry = new THREE.BufferGeometry();
        var patternFace = /facet([\s\S]*?)endfacet/g;
        var faceCounter = 0;
        var patternFloat = /[\s]+([+-]?(?:\d+.\d+|\d+.|\d+|.\d+)(?:[eE][+-]?\d+)?)/.source;
        var patternVertex = new RegExp('vertex' + patternFloat + patternFloat + patternFloat, 'g');
        var patternNormal = new RegExp('normal' + patternFloat + patternFloat + patternFloat, 'g');
        var vertices = [];
        var normals = [];
        var normal = new THREE.Vector3();
        var result;

        while ((result = patternFace.exec(data)) !== null) {
          var vertexCountPerFace = 0;
          var normalCountPerFace = 0;
          var text = result[0];

          while ((result = patternNormal.exec(text)) !== null) {
            normal.x = parseFloat(result[1]);
            normal.y = parseFloat(result[2]);
            normal.z = parseFloat(result[3]);
            normalCountPerFace++;
          }

          while ((result = patternVertex.exec(text)) !== null) {
            vertices.push(parseFloat(result[1]), parseFloat(result[2]), parseFloat(result[3]));
            normals.push(normal.x, normal.y, normal.z);
            vertexCountPerFace++;
          } // every face have to own ONE valid normal


          if (normalCountPerFace !== 1) {
            console.error('THREE.STLLoader: Something isn\'t right with the normal of face number ' + faceCounter);
          } // each face have to own THREE valid vertices


          if (vertexCountPerFace !== 3) {
            console.error('THREE.STLLoader: Something isn\'t right with the vertices of face number ' + faceCounter);
          }

          faceCounter++;
        }

        geometry.addAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.addAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
        return geometry;
      }

      function ensureString(buffer) {
        if (typeof buffer !== 'string') {
          var array_buffer = new Uint8Array(buffer);

          if (window.TextDecoder !== undefined) {
            return new TextDecoder().decode(array_buffer);
          }

          var str = '';

          for (var i = 0, il = buffer.byteLength; i < il; i++) {
            str += String.fromCharCode(array_buffer[i]); // implicitly assumes little-endian
          }

          return str;
        } else {
          return buffer;
        }
      }

      function ensureBinary(buffer) {
        if (typeof buffer === 'string') {
          var array_buffer = new Uint8Array(buffer.length);

          for (var i = 0; i < buffer.length; i++) {
            array_buffer[i] = buffer.charCodeAt(i) & 0xff; // implicitly assumes little-endian
          }

          return array_buffer.buffer || array_buffer;
        } else {
          return buffer;
        }
      } // start


      var binData = ensureBinary(data);
      return isBinary(binData) ? parseBinary(binData) : parseASCII(ensureString(data));
    }
  };
  /**
   * @fileOverview
   * @author mrdoob / http://mrdoob.com/
   *
   * @Modified by Jose Rojas from OBJLoader.js@r106
   *
   */
  // o object_name | g group_name

  var object_pattern = /^[og]\s*(.+)?/; // mtllib file_reference

  var material_library_pattern = /^mtllib /; // usemtl material_name

  var material_use_pattern = /^usemtl /;

  function ParserState() {
    var state = {
      objects: [],
      object: {},
      vertices: [],
      normals: [],
      colors: [],
      uvs: [],
      materialLibraries: [],
      startObject: function (name, fromDeclaration) {
        // If the current object (initial from reset) is not from a g/o declaration in the parsed
        // file. We need to use it for the first parsed g/o to keep things in sync.
        if (this.object && this.object.fromDeclaration === false) {
          this.object.name = name;
          this.object.fromDeclaration = fromDeclaration !== false;
          return;
        }

        var previousMaterial = this.object && typeof this.object.currentMaterial === 'function' ? this.object.currentMaterial() : undefined;

        if (this.object && typeof this.object._finalize === 'function') {
          this.object._finalize(true);
        }

        this.object = {
          name: name || '',
          fromDeclaration: fromDeclaration !== false,
          geometry: {
            vertices: [],
            normals: [],
            colors: [],
            uvs: []
          },
          materials: [],
          smooth: true,
          startMaterial: function (name, libraries) {
            var previous = this._finalize(false); // New usemtl declaration overwrites an inherited material, except if faces were declared
            // after the material, then it must be preserved for proper MultiMaterial continuation.


            if (previous && (previous.inherited || previous.groupCount <= 0)) {
              this.materials.splice(previous.index, 1);
            }

            var material = {
              index: this.materials.length,
              name: name || '',
              mtllib: Array.isArray(libraries) && libraries.length > 0 ? libraries[libraries.length - 1] : '',
              smooth: previous !== undefined ? previous.smooth : this.smooth,
              groupStart: previous !== undefined ? previous.groupEnd : 0,
              groupEnd: -1,
              groupCount: -1,
              inherited: false,
              clone: function (index) {
                var cloned = {
                  index: typeof index === 'number' ? index : this.index,
                  name: this.name,
                  mtllib: this.mtllib,
                  smooth: this.smooth,
                  groupStart: 0,
                  groupEnd: -1,
                  groupCount: -1,
                  inherited: false
                };
                cloned.clone = this.clone.bind(cloned);
                return cloned;
              }
            };
            this.materials.push(material);
            return material;
          },
          currentMaterial: function () {
            if (this.materials.length > 0) {
              return this.materials[this.materials.length - 1];
            }

            return undefined;
          },
          _finalize: function (end) {
            var lastMultiMaterial = this.currentMaterial();

            if (lastMultiMaterial && lastMultiMaterial.groupEnd === -1) {
              lastMultiMaterial.groupEnd = this.geometry.vertices.length / 3;
              lastMultiMaterial.groupCount = lastMultiMaterial.groupEnd - lastMultiMaterial.groupStart;
              lastMultiMaterial.inherited = false;
            } // Ignore objects tail materials if no face declarations followed them before a new o/g started.


            if (end && this.materials.length > 1) {
              for (var mi = this.materials.length - 1; mi >= 0; mi--) {
                if (this.materials[mi].groupCount <= 0) {
                  this.materials.splice(mi, 1);
                }
              }
            } // Guarantee at least one empty material, this makes the creation later more straight forward.


            if (end && this.materials.length === 0) {
              this.materials.push({
                name: '',
                smooth: this.smooth
              });
            }

            return lastMultiMaterial;
          }
        }; // Inherit previous objects material.
        // Spec tells us that a declared material must be set to all objects until a new material is declared.
        // If a usemtl declaration is encountered while this new object is being parsed, it will
        // overwrite the inherited material. Exception being that there was already face declarations
        // to the inherited material, then it will be preserved for proper MultiMaterial continuation.

        if (previousMaterial && previousMaterial.name && typeof previousMaterial.clone === 'function') {
          var declared = previousMaterial.clone(0);
          declared.inherited = true;
          this.object.materials.push(declared);
        }

        this.objects.push(this.object);
      },
      finalize: function () {
        if (this.object && typeof this.object._finalize === 'function') {
          this.object._finalize(true);
        }
      },
      parseVertexIndex: function (value, len) {
        var index = parseInt(value, 10);
        return (index >= 0 ? index - 1 : index + len / 3) * 3;
      },
      parseNormalIndex: function (value, len) {
        var index = parseInt(value, 10);
        return (index >= 0 ? index - 1 : index + len / 3) * 3;
      },
      parseUVIndex: function (value, len) {
        var index = parseInt(value, 10);
        return (index >= 0 ? index - 1 : index + len / 2) * 2;
      },
      addVertex: function (a, b, c) {
        var src = this.vertices;
        var dst = this.object.geometry.vertices;
        dst.push(src[a + 0], src[a + 1], src[a + 2]);
        dst.push(src[b + 0], src[b + 1], src[b + 2]);
        dst.push(src[c + 0], src[c + 1], src[c + 2]);
      },
      addVertexPoint: function (a) {
        var src = this.vertices;
        var dst = this.object.geometry.vertices;
        dst.push(src[a + 0], src[a + 1], src[a + 2]);
      },
      addVertexLine: function (a) {
        var src = this.vertices;
        var dst = this.object.geometry.vertices;
        dst.push(src[a + 0], src[a + 1], src[a + 2]);
      },
      addNormal: function (a, b, c) {
        var src = this.normals;
        var dst = this.object.geometry.normals;
        dst.push(src[a + 0], src[a + 1], src[a + 2]);
        dst.push(src[b + 0], src[b + 1], src[b + 2]);
        dst.push(src[c + 0], src[c + 1], src[c + 2]);
      },
      addColor: function (a, b, c) {
        var src = this.colors;
        var dst = this.object.geometry.colors;
        dst.push(src[a + 0], src[a + 1], src[a + 2]);
        dst.push(src[b + 0], src[b + 1], src[b + 2]);
        dst.push(src[c + 0], src[c + 1], src[c + 2]);
      },
      addUV: function (a, b, c) {
        var src = this.uvs;
        var dst = this.object.geometry.uvs;
        dst.push(src[a + 0], src[a + 1]);
        dst.push(src[b + 0], src[b + 1]);
        dst.push(src[c + 0], src[c + 1]);
      },
      addUVLine: function (a) {
        var src = this.uvs;
        var dst = this.object.geometry.uvs;
        dst.push(src[a + 0], src[a + 1]);
      },
      addFace: function (a, b, c, ua, ub, uc, na, nb, nc) {
        var vLen = this.vertices.length;
        var ia = this.parseVertexIndex(a, vLen);
        var ib = this.parseVertexIndex(b, vLen);
        var ic = this.parseVertexIndex(c, vLen);
        this.addVertex(ia, ib, ic);

        if (ua !== undefined && ua !== '') {
          var uvLen = this.uvs.length;
          ia = this.parseUVIndex(ua, uvLen);
          ib = this.parseUVIndex(ub, uvLen);
          ic = this.parseUVIndex(uc, uvLen);
          this.addUV(ia, ib, ic);
        }

        if (na !== undefined && na !== '') {
          // Normals are many times the same. If so, skip function call and parseInt.
          var nLen = this.normals.length;
          ia = this.parseNormalIndex(na, nLen);
          ib = na === nb ? ia : this.parseNormalIndex(nb, nLen);
          ic = na === nc ? ia : this.parseNormalIndex(nc, nLen);
          this.addNormal(ia, ib, ic);
        }

        if (this.colors.length > 0) {
          this.addColor(ia, ib, ic);
        }
      },
      addPointGeometry: function (vertices) {
        this.object.geometry.type = 'Points';
        var vLen = this.vertices.length;

        for (var vi = 0, l = vertices.length; vi < l; vi++) {
          this.addVertexPoint(this.parseVertexIndex(vertices[vi], vLen));
        }
      },
      addLineGeometry: function (vertices, uvs) {
        this.object.geometry.type = 'Line';
        var vLen = this.vertices.length;
        var uvLen = this.uvs.length;

        for (var vi = 0, l = vertices.length; vi < l; vi++) {
          this.addVertexLine(this.parseVertexIndex(vertices[vi], vLen));
        }

        for (var uvi = 0, l = uvs.length; uvi < l; uvi++) {
          this.addUVLine(this.parseUVIndex(uvs[uvi], uvLen));
        }
      }
    };
    state.startObject('', false);
    return state;
  }

  THREE.OBJLoader = function (manager) {
    this.manager = manager !== undefined ? manager : THREE.DefaultLoadingManager;
    this.materials = null;
  };

  THREE.OBJLoader.prototype = {
    constructor: THREE.OBJLoader,
    load: function (url, onLoad, onProgress, onError) {
      var scope = this;
      var loader = new THREE.FileLoader(scope.manager);
      loader.setPath(this.path);
      loader.load(url, function (text) {
        onLoad(scope.parse(text));
      }, onProgress, onError);
    },
    setPath: function (value) {
      this.path = value;
      return this;
    },
    setMaterials: function (materials) {
      this.materials = materials;
      return this;
    },
    parse: function (text) {
      console.time('OBJLoader');
      var state = new ParserState();

      if (text.indexOf('\r\n') !== -1) {
        // This is faster than String.split with regex that splits on both
        text = text.replace(/\r\n/g, '\n');
      }

      if (text.indexOf('\\\n') !== -1) {
        // join lines separated by a line continuation character (\)
        text = text.replace(/\\\n/g, '');
      }

      var lines = text.split('\n');
      var line = '',
          lineFirstChar = '';
      var lineLength = 0;
      var result = []; // Faster to just trim left side of the line. Use if available.

      var trimLeft = typeof ''.trimLeft === 'function';

      for (var i = 0, l = lines.length; i < l; i++) {
        line = lines[i];
        line = trimLeft ? line.trimLeft() : line.trim();
        lineLength = line.length;
        if (lineLength === 0) continue;
        lineFirstChar = line.charAt(0); // @todo invoke passed in handler if any

        if (lineFirstChar === '#') continue;

        if (lineFirstChar === 'v') {
          var data = line.split(/\s+/);

          switch (data[0]) {
            case 'v':
              state.vertices.push(parseFloat(data[1]), parseFloat(data[2]), parseFloat(data[3]));

              if (data.length === 8) {
                state.colors.push(parseFloat(data[4]), parseFloat(data[5]), parseFloat(data[6]));
              }

              break;

            case 'vn':
              state.normals.push(parseFloat(data[1]), parseFloat(data[2]), parseFloat(data[3]));
              break;

            case 'vt':
              state.uvs.push(parseFloat(data[1]), parseFloat(data[2]));
              break;
          }
        } else if (lineFirstChar === 'f') {
          var lineData = line.substr(1).trim();
          var vertexData = lineData.split(/\s+/);
          var faceVertices = []; // Parse the face vertex data into an easy to work with format

          for (var j = 0, jl = vertexData.length; j < jl; j++) {
            var vertex = vertexData[j];

            if (vertex.length > 0) {
              var vertexParts = vertex.split('/');
              faceVertices.push(vertexParts);
            }
          } // Draw an edge between the first vertex and all subsequent vertices to form an n-gon


          var v1 = faceVertices[0];

          for (var j = 1, jl = faceVertices.length - 1; j < jl; j++) {
            var v2 = faceVertices[j];
            var v3 = faceVertices[j + 1];
            state.addFace(v1[0], v2[0], v3[0], v1[1], v2[1], v3[1], v1[2], v2[2], v3[2]);
          }
        } else if (lineFirstChar === 'l') {
          var lineParts = line.substring(1).trim().split(" ");
          var lineVertices = [],
              lineUVs = [];

          if (line.indexOf("/") === -1) {
            lineVertices = lineParts;
          } else {
            for (var li = 0, llen = lineParts.length; li < llen; li++) {
              var parts = lineParts[li].split("/");
              if (parts[0] !== "") lineVertices.push(parts[0]);
              if (parts[1] !== "") lineUVs.push(parts[1]);
            }
          }

          state.addLineGeometry(lineVertices, lineUVs);
        } else if (lineFirstChar === 'p') {
          var lineData = line.substr(1).trim();
          var pointData = lineData.split(" ");
          state.addPointGeometry(pointData);
        } else if ((result = object_pattern.exec(line)) !== null) {
          // o object_name
          // or
          // g group_name
          // WORKAROUND: https://bugs.chromium.org/p/v8/issues/detail?id=2869
          // var name = result[ 0 ].substr( 1 ).trim();
          var name = (" " + result[0].substr(1).trim()).substr(1);
          state.startObject(name);
        } else if (material_use_pattern.test(line)) {
          // material
          state.object.startMaterial(line.substring(7).trim(), state.materialLibraries);
        } else if (material_library_pattern.test(line)) {
          // mtl file
          state.materialLibraries.push(line.substring(7).trim());
        } else if (lineFirstChar === 's') {
          result = line.split(' '); // smooth shading
          // @todo Handle files that have varying smooth values for a set of faces inside one geometry,
          // but does not define a usemtl for each face set.
          // This should be detected and a dummy material created (later MultiMaterial and geometry groups).
          // This requires some care to not create extra material on each smooth value for "normal" obj files.
          // where explicit usemtl defines geometry groups.
          // Example asset: examples/models/obj/cerberus/Cerberus.obj

          /*
           * http://paulbourke.net/dataformats/obj/
           * or
           * http://www.cs.utah.edu/~boulos/cs3505/obj_spec.pdf
           *
           * From chapter "Grouping" Syntax explanation "s group_number":
           * "group_number is the smoothing group number. To turn off smoothing groups, use a value of 0 or off.
           * Polygonal elements use group numbers to put elements in different smoothing groups. For free-form
           * surfaces, smoothing groups are either turned on or off; there is no difference between values greater
           * than 0."
           */

          if (result.length > 1) {
            var value = result[1].trim().toLowerCase();
            state.object.smooth = value !== '0' && value !== 'off';
          } else {
            // ZBrush can produce "s" lines #11707
            state.object.smooth = true;
          }

          var material = state.object.currentMaterial();
          if (material) material.smooth = state.object.smooth;
        } else {
          // Handle null terminated files without exception
          if (line === '\0') continue;
          throw new Error('THREE.OBJLoader: Unexpected line: "' + line + '"');
        }
      }

      state.finalize();
      var container = new THREE.Object3D();
      container.materialLibraries = [].concat(state.materialLibraries);

      for (var i = 0, l = state.objects.length; i < l; i++) {
        var object = state.objects[i];
        var geometry = object.geometry;
        var materials = object.materials;
        var isLine = geometry.type === 'Line';
        var isPoints = geometry.type === 'Points';
        var hasVertexColors = false; // Skip o/g line declarations that did not follow with any faces

        if (geometry.vertices.length === 0) continue;
        var buffergeometry = new THREE.BufferGeometry();
        buffergeometry.addAttribute('position', new THREE.Float32BufferAttribute(geometry.vertices, 3));

        if (geometry.normals.length > 0) {
          buffergeometry.addAttribute('normal', new THREE.Float32BufferAttribute(geometry.normals, 3));
        } else {
          buffergeometry.computeVertexNormals();
        }

        if (geometry.colors.length > 0) {
          hasVertexColors = true;
          buffergeometry.addAttribute('color', new THREE.Float32BufferAttribute(geometry.colors, 3));
        }

        if (geometry.uvs.length > 0) {
          buffergeometry.addAttribute('uv', new THREE.Float32BufferAttribute(geometry.uvs, 2));
        } // Create materials


        var createdMaterials = [];

        for (var mi = 0, miLen = materials.length; mi < miLen; mi++) {
          var sourceMaterial = materials[mi];
          var material = undefined;

          if (this.materials !== null) {
            material = this.materials.create(sourceMaterial.name); // mtl etc. loaders probably can't create line materials correctly, copy properties to a line material.

            if (isLine && material && !(material instanceof THREE.LineBasicMaterial)) {
              var materialLine = new THREE.LineBasicMaterial();
              THREE.Material.prototype.copy.call(materialLine, material);
              materialLine.color.copy(material.color);
              materialLine.lights = false;
              material = materialLine;
            } else if (isPoints && material && !(material instanceof THREE.PointsMaterial)) {
              var materialPoints = new THREE.PointsMaterial({
                size: 10,
                sizeAttenuation: false
              });
              THREE.Material.prototype.copy.call(materialPoints, material);
              materialPoints.color.copy(material.color);
              materialPoints.map = material.map;
              materialPoints.lights = false;
              material = materialPoints;
            }
          }

          if (!material) {
            if (isLine) {
              material = new THREE.LineBasicMaterial();
            } else if (isPoints) {
              material = new THREE.PointsMaterial({
                size: 1,
                sizeAttenuation: false
              });
            } else {
              material = new THREE.MeshPhongMaterial();
            }

            material.name = sourceMaterial.name;
          }

          material.flatShading = sourceMaterial.smooth ? false : true;
          material.vertexColors = hasVertexColors ? THREE.VertexColors : THREE.NoColors;
          createdMaterials.push(material);
        } // Create mesh


        var mesh;

        if (createdMaterials.length > 1) {
          for (var mi = 0, miLen = materials.length; mi < miLen; mi++) {
            var sourceMaterial = materials[mi];
            buffergeometry.addGroup(sourceMaterial.groupStart, sourceMaterial.groupCount, mi);
          }

          if (isLine) {
            mesh = new THREE.LineSegments(buffergeometry, createdMaterials);
          } else if (isPoints) {
            mesh = new THREE.Points(buffergeometry, createdMaterials);
          } else {
            mesh = new THREE.Mesh(buffergeometry, createdMaterials);
          }
        } else {
          if (isLine) {
            mesh = new THREE.LineSegments(buffergeometry, createdMaterials[0]);
          } else if (isPoints) {
            mesh = new THREE.Points(buffergeometry, createdMaterials[0]);
          } else {
            mesh = new THREE.Mesh(buffergeometry, createdMaterials[0]);
          }
        }

        mesh.name = object.name;
        container.add(mesh);
      }

      console.timeEnd('OBJLoader');
      return container;
    }
  };
  /**
   * @fileOverview
   * Loads a Wavefront .mtl file specifying materials
   *
   * @author angelxuanchang
   */

  THREE.MTLLoader = function (manager) {
    this.manager = manager !== undefined ? manager : THREE.DefaultLoadingManager;
  };

  THREE.MTLLoader.prototype = {
    constructor: THREE.MTLLoader,
    crossOrigin: 'anonymous',

    /**
     * Loads and parses a MTL asset from a URL.
     *
     * @param {String} url - URL to the MTL file.
     * @param {Function} [onLoad] - Callback invoked with the loaded object.
     * @param {Function} [onProgress] - Callback for download progress.
     * @param {Function} [onError] - Callback for download errors.
     *
     * @see setPath setResourcePath
     *
     * @note In order for relative texture references to resolve correctly
     * you must call setResourcePath() explicitly prior to load.
     */
    load: function (url, onLoad, onProgress, onError) {
      var scope = this;
      var path = this.path === undefined ? THREE.LoaderUtils.extractUrlBase(url) : this.path;
      var loader = new THREE.FileLoader(this.manager);
      loader.setPath(this.path);
      loader.load(url, function (text) {
        onLoad(scope.parse(text, path));
      }, onProgress, onError);
    },

    /**
     * Set base path for resolving references.
     * If set this path will be prepended to each loaded and found reference.
     *
     * @see setResourcePath
     * @param {String} path
     * @return {THREE.MTLLoader}
     *
     * @example
     *     mtlLoader.setPath( 'assets/obj/' );
     *     mtlLoader.load( 'my.mtl', ... );
     */
    setPath: function (path) {
      this.path = path;
      return this;
    },

    /**
     * Set base path for additional resources like textures.
     *
     * @see setPath
     * @param {String} path
     * @return {THREE.MTLLoader}
     *
     * @example
     *     mtlLoader.setPath( 'assets/obj/' );
     *     mtlLoader.setResourcePath( 'assets/textures/' );
     *     mtlLoader.load( 'my.mtl', ... );
     */
    setResourcePath: function (path) {
      this.resourcePath = path;
      return this;
    },
    setTexturePath: function (path) {
      console.warn('THREE.MTLLoader: .setTexturePath() has been renamed to .setResourcePath().');
      return this.setResourcePath(path);
    },
    setCrossOrigin: function (value) {
      this.crossOrigin = value;
      return this;
    },
    setMaterialOptions: function (value) {
      this.materialOptions = value;
      return this;
    },

    /**
     * Parses a MTL file.
     *
     * @param {String} text - Content of MTL file
     * @return {THREE.MTLLoader.MaterialCreator}
     *
     * @see setPath setResourcePath
     *
     * @note In order for relative texture references to resolve correctly
     * you must call setResourcePath() explicitly prior to parse.
     */
    parse: function (text, path) {
      var lines = text.split('\n');
      var info = {};
      var delimiter_pattern = /\s+/;
      var materialsInfo = {};

      for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        line = line.trim();

        if (line.length === 0 || line.charAt(0) === '#') {
          // Blank line or comment ignore
          continue;
        }

        var pos = line.indexOf(' ');
        var key = pos >= 0 ? line.substring(0, pos) : line;
        key = key.toLowerCase();
        var value = pos >= 0 ? line.substring(pos + 1) : '';
        value = value.trim();

        if (key === 'newmtl') {
          // New material
          info = {
            name: value
          };
          materialsInfo[value] = info;
        } else {
          if (key === 'ka' || key === 'kd' || key === 'ks' || key === 'ke') {
            var ss = value.split(delimiter_pattern, 3);
            info[key] = [parseFloat(ss[0]), parseFloat(ss[1]), parseFloat(ss[2])];
          } else {
            info[key] = value;
          }
        }
      }

      var materialCreator = new THREE.MTLLoader.MaterialCreator(this.resourcePath || path, this.materialOptions);
      materialCreator.setCrossOrigin(this.crossOrigin);
      materialCreator.setManager(this.manager);
      materialCreator.setMaterials(materialsInfo);
      return materialCreator;
    }
  };
  /**
   * Create a new THREE-MTLLoader.MaterialCreator
   * @param baseUrl - Url relative to which textures are loaded
   * @param options - Set of options on how to construct the materials
   *                  side: Which side to apply the material
   *                        THREE.FrontSide (default), THREE.BackSide, THREE.DoubleSide
   *                  wrap: What type of wrapping to apply for textures
   *                        THREE.RepeatWrapping (default), THREE.ClampToEdgeWrapping, THREE.MirroredRepeatWrapping
   *                  normalizeRGB: RGBs need to be normalized to 0-1 from 0-255
   *                                Default: false, assumed to be already normalized
   *                  ignoreZeroRGBs: Ignore values of RGBs (Ka,Kd,Ks) that are all 0's
   *                                  Default: false
   * @constructor
   */

  THREE.MTLLoader.MaterialCreator = function (baseUrl, options) {
    this.baseUrl = baseUrl || '';
    this.options = options;
    this.materialsInfo = {};
    this.materials = {};
    this.materialsArray = [];
    this.nameLookup = {};
    this.side = this.options && this.options.side ? this.options.side : THREE.FrontSide;
    this.wrap = this.options && this.options.wrap ? this.options.wrap : THREE.RepeatWrapping;
  };

  THREE.MTLLoader.MaterialCreator.prototype = {
    constructor: THREE.MTLLoader.MaterialCreator,
    crossOrigin: 'anonymous',
    setCrossOrigin: function (value) {
      this.crossOrigin = value;
      return this;
    },
    setManager: function (value) {
      this.manager = value;
    },
    setMaterials: function (materialsInfo) {
      this.materialsInfo = this.convert(materialsInfo);
      this.materials = {};
      this.materialsArray = [];
      this.nameLookup = {};
    },
    convert: function (materialsInfo) {
      if (!this.options) return materialsInfo;
      var converted = {};

      for (var mn in materialsInfo) {
        // Convert materials info into normalized form based on options
        var mat = materialsInfo[mn];
        var covmat = {};
        converted[mn] = covmat;

        for (var prop in mat) {
          var save = true;
          var value = mat[prop];
          var lprop = prop.toLowerCase();

          switch (lprop) {
            case 'kd':
            case 'ka':
            case 'ks':
              // Diffuse color (color under white light) using RGB values
              if (this.options && this.options.normalizeRGB) {
                value = [value[0] / 255, value[1] / 255, value[2] / 255];
              }

              if (this.options && this.options.ignoreZeroRGBs) {
                if (value[0] === 0 && value[1] === 0 && value[2] === 0) {
                  // ignore
                  save = false;
                }
              }

              break;
          }

          if (save) {
            covmat[lprop] = value;
          }
        }
      }

      return converted;
    },
    preload: function () {
      for (var mn in this.materialsInfo) {
        this.create(mn);
      }
    },
    getIndex: function (materialName) {
      return this.nameLookup[materialName];
    },
    getAsArray: function () {
      var index = 0;

      for (var mn in this.materialsInfo) {
        this.materialsArray[index] = this.create(mn);
        this.nameLookup[mn] = index;
        index++;
      }

      return this.materialsArray;
    },
    create: function (materialName) {
      if (this.materials[materialName] === undefined) {
        this.createMaterial_(materialName);
      }

      return this.materials[materialName];
    },
    createMaterial_: function (materialName) {
      // Create material
      var scope = this;
      var mat = this.materialsInfo[materialName];
      var params = {
        name: materialName,
        side: this.side
      };

      function resolveURL(baseUrl, url) {
        if (typeof url !== 'string' || url === '') return ''; // Absolute URL

        if (/^https?:\/\//i.test(url)) return url;
        return baseUrl + url;
      }

      function setMapForType(mapType, value) {
        if (params[mapType]) return; // Keep the first encountered texture

        var texParams = scope.getTextureParams(value, params);
        var map = scope.loadTexture(resolveURL(scope.baseUrl, texParams.url));
        map.repeat.copy(texParams.scale);
        map.offset.copy(texParams.offset);
        map.wrapS = scope.wrap;
        map.wrapT = scope.wrap;
        params[mapType] = map;
      }

      for (var prop in mat) {
        var value = mat[prop];
        var n;
        if (value === '') continue;

        switch (prop.toLowerCase()) {
          // Ns is material specular exponent
          case 'kd':
            // Diffuse color (color under white light) using RGB values
            params.color = new THREE.Color().fromArray(value);
            break;

          case 'ks':
            // Specular color (color when light is reflected from shiny surface) using RGB values
            params.specular = new THREE.Color().fromArray(value);
            break;

          case 'ke':
            // Emissive using RGB values
            params.emissive = new THREE.Color().fromArray(value);
            break;

          case 'map_kd':
            // Diffuse texture map
            setMapForType("map", value);
            break;

          case 'map_ks':
            // Specular map
            setMapForType("specularMap", value);
            break;

          case 'map_ke':
            // Emissive map
            setMapForType("emissiveMap", value);
            break;

          case 'norm':
            setMapForType("normalMap", value);
            break;

          case 'map_bump':
          case 'bump':
            // Bump texture map
            setMapForType("bumpMap", value);
            break;

          case 'map_d':
            // Alpha map
            setMapForType("alphaMap", value);
            params.transparent = true;
            break;

          case 'ns':
            // The specular exponent (defines the focus of the specular highlight)
            // A high exponent results in a tight, concentrated highlight. Ns values normally range from 0 to 1000.
            params.shininess = parseFloat(value);
            break;

          case 'd':
            n = parseFloat(value);

            if (n < 1) {
              params.opacity = n;
              params.transparent = true;
            }

            break;

          case 'tr':
            n = parseFloat(value);
            if (this.options && this.options.invertTrProperty) n = 1 - n;

            if (n > 0) {
              params.opacity = 1 - n;
              params.transparent = true;
            }

            break;
        }
      }

      this.materials[materialName] = new THREE.MeshPhongMaterial(params);
      return this.materials[materialName];
    },
    getTextureParams: function (value, matParams) {
      var texParams = {
        scale: new THREE.Vector2(1, 1),
        offset: new THREE.Vector2(0, 0)
      };
      var items = value.split(/\s+/);
      var pos;
      pos = items.indexOf('-bm');

      if (pos >= 0) {
        matParams.bumpScale = parseFloat(items[pos + 1]);
        items.splice(pos, 2);
      }

      pos = items.indexOf('-s');

      if (pos >= 0) {
        texParams.scale.set(parseFloat(items[pos + 1]), parseFloat(items[pos + 2]));
        items.splice(pos, 4); // we expect 3 parameters here!
      }

      pos = items.indexOf('-o');

      if (pos >= 0) {
        texParams.offset.set(parseFloat(items[pos + 1]), parseFloat(items[pos + 2]));
        items.splice(pos, 4); // we expect 3 parameters here!
      }

      texParams.url = items.join(' ').trim();
      return texParams;
    },
    loadTexture: function (url, mapping, onLoad, onProgress, onError) {
      var texture;
      var loader = THREE.Loader.Handlers.get(url);
      var manager = this.manager !== undefined ? this.manager : THREE.DefaultLoadingManager;

      if (loader === null) {
        loader = new THREE.TextureLoader(manager);
      }

      if (loader.setCrossOrigin) loader.setCrossOrigin(this.crossOrigin);
      texture = loader.load(url, onLoad, onProgress, onError);
      if (mapping !== undefined) texture.mapping = mapping;
      return texture;
    }
  };
  /**
   * @fileOverview
   * @author mrdoob / http://mrdoob.com/
   * @author Mugen87 / https://github.com/Mugen87
   *
   *
   * @Modified by Jihoon Lee from ColladerLoader.js@r88
   * To support rviz compatible collada viewing.
   * See: #202 why it is forked.
   *
   * It is a fork from ColladerLoader.js in three.js. It follows three.js license.
   */

  THREE.ColladaLoader = function (manager) {
    this.manager = manager !== undefined ? manager : THREE.DefaultLoadingManager;
  };

  THREE.ColladaLoader.prototype = {
    constructor: THREE.ColladaLoader,
    crossOrigin: 'Anonymous',
    load: function (url, onLoad, onProgress, onError) {
      var scope = this;
      var path = THREE.Loader.prototype.extractUrlBase(url);
      var loader = new THREE.FileLoader(scope.manager);
      loader.load(url, function (text) {
        onLoad(scope.parse(text, path));
      }, onProgress, onError);
    },
    options: {
      set convertUpAxis(value) {
        console.warn('THREE.ColladaLoader: options.convertUpAxis() has been removed. Up axis is converted automatically.');
      }

    },
    setCrossOrigin: function (value) {
      this.crossOrigin = value;
    },
    parse: function (text, path) {
      function getElementsByTagName(xml, name) {
        // Non recursive xml.getElementsByTagName() ...
        var array = [];
        var childNodes = xml.childNodes;

        for (var i = 0, l = childNodes.length; i < l; i++) {
          var child = childNodes[i];

          if (child.nodeName === name) {
            array.push(child);
          }
        }

        return array;
      }

      function parseStrings(text) {
        if (text.length === 0) return [];
        var parts = text.trim().split(/\s+/);
        var array = new Array(parts.length);

        for (var i = 0, l = parts.length; i < l; i++) {
          array[i] = parts[i];
        }

        return array;
      }

      function parseFloats(text) {
        if (text.length === 0) return [];
        var parts = text.trim().split(/\s+/);
        var array = new Array(parts.length);

        for (var i = 0, l = parts.length; i < l; i++) {
          array[i] = parseFloat(parts[i]);
        }

        return array;
      }

      function parseInts(text) {
        if (text.length === 0) return [];
        var parts = text.trim().split(/\s+/);
        var array = new Array(parts.length);

        for (var i = 0, l = parts.length; i < l; i++) {
          array[i] = parseInt(parts[i]);
        }

        return array;
      }

      function parseId(text) {
        return text.substring(1);
      }

      function generateId() {
        return 'three_default_' + count++;
      }

      function isEmpty(object) {
        return Object.keys(object).length === 0;
      } // asset


      function parseAsset(xml) {
        return {
          unit: parseAssetUnit(getElementsByTagName(xml, 'unit')[0]),
          upAxis: parseAssetUpAxis(getElementsByTagName(xml, 'up_axis')[0])
        };
      }

      function parseAssetUnit(xml) {
        return xml !== undefined ? parseFloat(xml.getAttribute('meter')) : 1;
      }

      function parseAssetUpAxis(xml) {
        return xml !== undefined ? xml.textContent : 'Y_UP';
      } // library


      function parseLibrary(xml, libraryName, nodeName, parser) {
        var library = getElementsByTagName(xml, libraryName)[0];

        if (library !== undefined) {
          var elements = getElementsByTagName(library, nodeName);

          for (var i = 0; i < elements.length; i++) {
            parser(elements[i]);
          }
        }
      }

      function buildLibrary(data, builder) {
        for (var name in data) {
          var object = data[name];
          object.build = builder(data[name]);
        }
      } // get


      function getBuild(data, builder) {
        if (data.build !== undefined) return data.build;
        data.build = builder(data);
        return data.build;
      } // animation


      function parseAnimation(xml) {
        var data = {
          sources: {},
          samplers: {},
          channels: {}
        };

        for (var i = 0, l = xml.childNodes.length; i < l; i++) {
          var child = xml.childNodes[i];
          if (child.nodeType !== 1) continue;
          var id;

          switch (child.nodeName) {
            case 'source':
              id = child.getAttribute('id');
              data.sources[id] = parseSource(child);
              break;

            case 'sampler':
              id = child.getAttribute('id');
              data.samplers[id] = parseAnimationSampler(child);
              break;

            case 'channel':
              id = child.getAttribute('target');
              data.channels[id] = parseAnimationChannel(child);
              break;

            default:
              console.log(child);
          }
        }

        library.animations[xml.getAttribute('id')] = data;
      }

      function parseAnimationSampler(xml) {
        var data = {
          inputs: {}
        };

        for (var i = 0, l = xml.childNodes.length; i < l; i++) {
          var child = xml.childNodes[i];
          if (child.nodeType !== 1) continue;

          switch (child.nodeName) {
            case 'input':
              var id = parseId(child.getAttribute('source'));
              var semantic = child.getAttribute('semantic');
              data.inputs[semantic] = id;
              break;
          }
        }

        return data;
      }

      function parseAnimationChannel(xml) {
        var data = {};
        var target = xml.getAttribute('target'); // parsing SID Addressing Syntax

        var parts = target.split('/');
        var id = parts.shift();
        var sid = parts.shift(); // check selection syntax

        var arraySyntax = sid.indexOf('(') !== -1;
        var memberSyntax = sid.indexOf('.') !== -1;

        if (memberSyntax) {
          //  member selection access
          parts = sid.split('.');
          sid = parts.shift();
          data.member = parts.shift();
        } else if (arraySyntax) {
          // array-access syntax. can be used to express fields in one-dimensional vectors or two-dimensional matrices.
          var indices = sid.split('(');
          sid = indices.shift();

          for (var i = 0; i < indices.length; i++) {
            indices[i] = parseInt(indices[i].replace(/\)/, ''));
          }

          data.indices = indices;
        }

        data.id = id;
        data.sid = sid;
        data.arraySyntax = arraySyntax;
        data.memberSyntax = memberSyntax;
        data.sampler = parseId(xml.getAttribute('source'));
        return data;
      }

      function buildAnimation(data) {
        var tracks = [];
        var channels = data.channels;
        var samplers = data.samplers;
        var sources = data.sources;

        for (var target in channels) {
          if (channels.hasOwnProperty(target)) {
            var channel = channels[target];
            var sampler = samplers[channel.sampler];
            var inputId = sampler.inputs.INPUT;
            var outputId = sampler.inputs.OUTPUT;
            var inputSource = sources[inputId];
            var outputSource = sources[outputId];
            var animation = buildAnimationChannel(channel, inputSource, outputSource);
            createKeyframeTracks(animation, tracks);
          }
        }

        return tracks;
      }

      function getAnimation(id) {
        return getBuild(library.animations[id], buildAnimation);
      }

      function buildAnimationChannel(channel, inputSource, outputSource) {
        var node = library.nodes[channel.id];
        var object3D = getNode(node.id);
        var transform = node.transforms[channel.sid];
        var defaultMatrix = node.matrix.clone().transpose();
        var time, stride;
        var i, il, j, jl;
        var data = {}; // the collada spec allows the animation of data in various ways.
        // depending on the transform type (matrix, translate, rotate, scale), we execute different logic

        switch (transform) {
          case 'matrix':
            for (i = 0, il = inputSource.array.length; i < il; i++) {
              time = inputSource.array[i];
              stride = i * outputSource.stride;
              if (data[time] === undefined) data[time] = {};

              if (channel.arraySyntax === true) {
                var value = outputSource.array[stride];
                var index = channel.indices[0] + 4 * channel.indices[1];
                data[time][index] = value;
              } else {
                for (j = 0, jl = outputSource.stride; j < jl; j++) {
                  data[time][j] = outputSource.array[stride + j];
                }
              }
            }

            break;

          case 'translate':
            console.warn('THREE.ColladaLoader: Animation transform type "%s" not yet implemented.', transform);
            break;

          case 'rotate':
            console.warn('THREE.ColladaLoader: Animation transform type "%s" not yet implemented.', transform);
            break;

          case 'scale':
            console.warn('THREE.ColladaLoader: Animation transform type "%s" not yet implemented.', transform);
            break;
        }

        var keyframes = prepareAnimationData(data, defaultMatrix);
        var animation = {
          name: object3D.uuid,
          keyframes: keyframes
        };
        return animation;
      }

      function prepareAnimationData(data, defaultMatrix) {
        var keyframes = []; // transfer data into a sortable array

        for (var time in data) {
          keyframes.push({
            time: parseFloat(time),
            value: data[time]
          });
        } // ensure keyframes are sorted by time


        keyframes.sort(ascending); // now we clean up all animation data, so we can use them for keyframe tracks

        for (var i = 0; i < 16; i++) {
          transformAnimationData(keyframes, i, defaultMatrix.elements[i]);
        }

        return keyframes; // array sort function

        function ascending(a, b) {
          return a.time - b.time;
        }
      }

      var position = new THREE.Vector3();
      var scale = new THREE.Vector3();
      var quaternion = new THREE.Quaternion();

      function createKeyframeTracks(animation, tracks) {
        var keyframes = animation.keyframes;
        var name = animation.name;
        var times = [];
        var positionData = [];
        var quaternionData = [];
        var scaleData = [];

        for (var i = 0, l = keyframes.length; i < l; i++) {
          var keyframe = keyframes[i];
          var time = keyframe.time;
          var value = keyframe.value;
          matrix.fromArray(value).transpose();
          matrix.decompose(position, quaternion, scale);
          times.push(time);
          positionData.push(position.x, position.y, position.z);
          quaternionData.push(quaternion.x, quaternion.y, quaternion.z, quaternion.w);
          scaleData.push(scale.x, scale.y, scale.z);
        }

        if (positionData.length > 0) tracks.push(new THREE.VectorKeyframeTrack(name + '.position', times, positionData));
        if (quaternionData.length > 0) tracks.push(new THREE.QuaternionKeyframeTrack(name + '.quaternion', times, quaternionData));
        if (scaleData.length > 0) tracks.push(new THREE.VectorKeyframeTrack(name + '.scale', times, scaleData));
        return tracks;
      }

      function transformAnimationData(keyframes, property, defaultValue) {
        var keyframe;
        var empty = true;
        var i, l; // check, if values of a property are missing in our keyframes

        for (i = 0, l = keyframes.length; i < l; i++) {
          keyframe = keyframes[i];

          if (keyframe.value[property] === undefined) {
            keyframe.value[property] = null; // mark as missing
          } else {
            empty = false;
          }
        }

        if (empty === true) {
          // no values at all, so we set a default value
          for (i = 0, l = keyframes.length; i < l; i++) {
            keyframe = keyframes[i];
            keyframe.value[property] = defaultValue;
          }
        } else {
          // filling gaps
          createMissingKeyframes(keyframes, property);
        }
      }

      function createMissingKeyframes(keyframes, property) {
        var prev, next;

        for (var i = 0, l = keyframes.length; i < l; i++) {
          var keyframe = keyframes[i];

          if (keyframe.value[property] === null) {
            prev = getPrev(keyframes, i, property);
            next = getNext(keyframes, i, property);

            if (prev === null) {
              keyframe.value[property] = next.value[property];
              continue;
            }

            if (next === null) {
              keyframe.value[property] = prev.value[property];
              continue;
            }

            interpolate(keyframe, prev, next, property);
          }
        }
      }

      function getPrev(keyframes, i, property) {
        while (i >= 0) {
          var keyframe = keyframes[i];
          if (keyframe.value[property] !== null) return keyframe;
          i--;
        }

        return null;
      }

      function getNext(keyframes, i, property) {
        while (i < keyframes.length) {
          var keyframe = keyframes[i];
          if (keyframe.value[property] !== null) return keyframe;
          i++;
        }

        return null;
      }

      function interpolate(key, prev, next, property) {
        if (next.time - prev.time === 0) {
          key.value[property] = prev.value[property];
          return;
        }

        key.value[property] = (key.time - prev.time) * (next.value[property] - prev.value[property]) / (next.time - prev.time) + prev.value[property];
      } // animation clips


      function parseAnimationClip(xml) {
        var data = {
          name: xml.getAttribute('id') || 'default',
          start: parseFloat(xml.getAttribute('start') || 0),
          end: parseFloat(xml.getAttribute('end') || 0),
          animations: []
        };

        for (var i = 0, l = xml.childNodes.length; i < l; i++) {
          var child = xml.childNodes[i];
          if (child.nodeType !== 1) continue;

          switch (child.nodeName) {
            case 'instance_animation':
              data.animations.push(parseId(child.getAttribute('url')));
              break;
          }
        }

        library.clips[xml.getAttribute('id')] = data;
      }

      function buildAnimationClip(data) {
        var tracks = [];
        var name = data.name;
        var duration = data.end - data.start || -1;
        var animations = data.animations;

        for (var i = 0, il = animations.length; i < il; i++) {
          var animationTracks = getAnimation(animations[i]);

          for (var j = 0, jl = animationTracks.length; j < jl; j++) {
            tracks.push(animationTracks[j]);
          }
        }

        return new THREE.AnimationClip(name, duration, tracks);
      }

      function getAnimationClip(id) {
        return getBuild(library.clips[id], buildAnimationClip);
      } // controller


      function parseController(xml) {
        var data = {};

        for (var i = 0, l = xml.childNodes.length; i < l; i++) {
          var child = xml.childNodes[i];
          if (child.nodeType !== 1) continue;

          switch (child.nodeName) {
            case 'skin':
              // there is exactly one skin per controller
              data.id = parseId(child.getAttribute('source'));
              data.skin = parseSkin(child);
              break;

            case 'morph':
              data.id = parseId(child.getAttribute('source'));
              console.warn('THREE.ColladaLoader: Morph target animation not supported yet.');
              break;
          }
        }

        library.controllers[xml.getAttribute('id')] = data;
      }

      function parseSkin(xml) {
        var data = {
          sources: {}
        };

        for (var i = 0, l = xml.childNodes.length; i < l; i++) {
          var child = xml.childNodes[i];
          if (child.nodeType !== 1) continue;

          switch (child.nodeName) {
            case 'bind_shape_matrix':
              data.bindShapeMatrix = parseFloats(child.textContent);
              break;

            case 'source':
              var id = child.getAttribute('id');
              data.sources[id] = parseSource(child);
              break;

            case 'joints':
              data.joints = parseJoints(child);
              break;

            case 'vertex_weights':
              data.vertexWeights = parseVertexWeights(child);
              break;
          }
        }

        return data;
      }

      function parseJoints(xml) {
        var data = {
          inputs: {}
        };

        for (var i = 0, l = xml.childNodes.length; i < l; i++) {
          var child = xml.childNodes[i];
          if (child.nodeType !== 1) continue;

          switch (child.nodeName) {
            case 'input':
              var semantic = child.getAttribute('semantic');
              var id = parseId(child.getAttribute('source'));
              data.inputs[semantic] = id;
              break;
          }
        }

        return data;
      }

      function parseVertexWeights(xml) {
        var data = {
          inputs: {}
        };

        for (var i = 0, l = xml.childNodes.length; i < l; i++) {
          var child = xml.childNodes[i];
          if (child.nodeType !== 1) continue;

          switch (child.nodeName) {
            case 'input':
              var semantic = child.getAttribute('semantic');
              var id = parseId(child.getAttribute('source'));
              var offset = parseInt(child.getAttribute('offset'));
              data.inputs[semantic] = {
                id: id,
                offset: offset
              };
              break;

            case 'vcount':
              data.vcount = parseInts(child.textContent);
              break;

            case 'v':
              data.v = parseInts(child.textContent);
              break;
          }
        }

        return data;
      }

      function buildController(data) {
        var build = {
          id: data.id
        };
        var geometry = library.geometries[build.id];

        if (data.skin !== undefined) {
          build.skin = buildSkin(data.skin); // we enhance the 'sources' property of the corresponding geometry with our skin data

          geometry.sources.skinIndices = build.skin.indices;
          geometry.sources.skinWeights = build.skin.weights;
        }

        return build;
      }

      function buildSkin(data) {
        var BONE_LIMIT = 4;
        var build = {
          joints: [],
          // this must be an array to preserve the joint order
          indices: {
            array: [],
            stride: BONE_LIMIT
          },
          weights: {
            array: [],
            stride: BONE_LIMIT
          }
        };
        var sources = data.sources;
        var vertexWeights = data.vertexWeights;
        var vcount = vertexWeights.vcount;
        var v = vertexWeights.v;
        var jointOffset = vertexWeights.inputs.JOINT.offset;
        var weightOffset = vertexWeights.inputs.WEIGHT.offset;
        var jointSource = data.sources[data.joints.inputs.JOINT];
        var inverseSource = data.sources[data.joints.inputs.INV_BIND_MATRIX];
        var weights = sources[vertexWeights.inputs.WEIGHT.id].array;
        var stride = 0;
        var i, j, l; // procces skin data for each vertex

        for (i = 0, l = vcount.length; i < l; i++) {
          var jointCount = vcount[i]; // this is the amount of joints that affect a single vertex

          var vertexSkinData = [];

          for (j = 0; j < jointCount; j++) {
            var skinIndex = v[stride + jointOffset];
            var weightId = v[stride + weightOffset];
            var skinWeight = weights[weightId];
            vertexSkinData.push({
              index: skinIndex,
              weight: skinWeight
            });
            stride += 2;
          } // we sort the joints in descending order based on the weights.
          // this ensures, we only procced the most important joints of the vertex


          vertexSkinData.sort(descending); // now we provide for each vertex a set of four index and weight values.
          // the order of the skin data matches the order of vertices

          for (j = 0; j < BONE_LIMIT; j++) {
            var d = vertexSkinData[j];

            if (d !== undefined) {
              build.indices.array.push(d.index);
              build.weights.array.push(d.weight);
            } else {
              build.indices.array.push(0);
              build.weights.array.push(0);
            }
          }
        } // setup bind matrix


        build.bindMatrix = new THREE.Matrix4().fromArray(data.bindShapeMatrix).transpose(); // process bones and inverse bind matrix data

        for (i = 0, l = jointSource.array.length; i < l; i++) {
          var name = jointSource.array[i];
          var boneInverse = new THREE.Matrix4().fromArray(inverseSource.array, i * inverseSource.stride).transpose();
          build.joints.push({
            name: name,
            boneInverse: boneInverse
          });
        }

        return build; // array sort function

        function descending(a, b) {
          return b.weight - a.weight;
        }
      }

      function getController(id) {
        return getBuild(library.controllers[id], buildController);
      } // image


      function parseImage(xml) {
        var data = {
          init_from: getElementsByTagName(xml, 'init_from')[0].textContent
        };
        library.images[xml.getAttribute('id')] = data;
      }

      function buildImage(data) {
        if (data.build !== undefined) return data.build;
        return data.init_from;
      }

      function getImage(id) {
        return getBuild(library.images[id], buildImage);
      } // effect


      function parseEffect(xml) {
        var data = {};

        for (var i = 0, l = xml.childNodes.length; i < l; i++) {
          var child = xml.childNodes[i];
          if (child.nodeType !== 1) continue;

          switch (child.nodeName) {
            case 'profile_COMMON':
              data.profile = parseEffectProfileCOMMON(child);
              break;
          }
        }

        library.effects[xml.getAttribute('id')] = data;
      }

      function parseEffectProfileCOMMON(xml) {
        var data = {
          surfaces: {},
          samplers: {}
        };

        for (var i = 0, l = xml.childNodes.length; i < l; i++) {
          var child = xml.childNodes[i];
          if (child.nodeType !== 1) continue;

          switch (child.nodeName) {
            case 'newparam':
              parseEffectNewparam(child, data);
              break;

            case 'technique':
              data.technique = parseEffectTechnique(child);
              break;
          }
        }

        return data;
      }

      function parseEffectNewparam(xml, data) {
        var sid = xml.getAttribute('sid');

        for (var i = 0, l = xml.childNodes.length; i < l; i++) {
          var child = xml.childNodes[i];
          if (child.nodeType !== 1) continue;

          switch (child.nodeName) {
            case 'surface':
              data.surfaces[sid] = parseEffectSurface(child);
              break;

            case 'sampler2D':
              data.samplers[sid] = parseEffectSampler(child);
              break;
          }
        }
      }

      function parseEffectSurface(xml) {
        var data = {};

        for (var i = 0, l = xml.childNodes.length; i < l; i++) {
          var child = xml.childNodes[i];
          if (child.nodeType !== 1) continue;

          switch (child.nodeName) {
            case 'init_from':
              data.init_from = child.textContent;
              break;
          }
        }

        return data;
      }

      function parseEffectSampler(xml) {
        var data = {};

        for (var i = 0, l = xml.childNodes.length; i < l; i++) {
          var child = xml.childNodes[i];
          if (child.nodeType !== 1) continue;

          switch (child.nodeName) {
            case 'source':
              data.source = child.textContent;
              break;
          }
        }

        return data;
      }

      function parseEffectTechnique(xml) {
        var data = {};

        for (var i = 0, l = xml.childNodes.length; i < l; i++) {
          var child = xml.childNodes[i];
          if (child.nodeType !== 1) continue;

          switch (child.nodeName) {
            case 'constant':
            case 'lambert':
            case 'blinn':
            case 'phong':
              data.type = child.nodeName;
              data.parameters = parseEffectParameters(child);
              break;
          }
        }

        return data;
      }

      function parseEffectParameters(xml) {
        var data = {};

        for (var i = 0, l = xml.childNodes.length; i < l; i++) {
          var child = xml.childNodes[i];
          if (child.nodeType !== 1) continue;

          switch (child.nodeName) {
            case 'emission':
            case 'diffuse':
            case 'specular':
            case 'shininess':
            case 'transparent':
            case 'transparency':
              data[child.nodeName] = parseEffectParameter(child);
              break;
          }
        }

        return data;
      }

      function parseEffectParameter(xml) {
        var data = {};

        for (var i = 0, l = xml.childNodes.length; i < l; i++) {
          var child = xml.childNodes[i];
          if (child.nodeType !== 1) continue;

          switch (child.nodeName) {
            case 'color':
              data[child.nodeName] = parseFloats(child.textContent);
              break;

            case 'float':
              data[child.nodeName] = parseFloat(child.textContent);
              break;

            case 'texture':
              data[child.nodeName] = {
                id: child.getAttribute('texture'),
                extra: parseEffectParameterTexture(child)
              };
              break;
          }
        }

        return data;
      }

      function parseEffectParameterTexture(xml) {
        var data = {
          technique: {}
        };

        for (var i = 0, l = xml.childNodes.length; i < l; i++) {
          var child = xml.childNodes[i];
          if (child.nodeType !== 1) continue;

          switch (child.nodeName) {
            case 'extra':
              parseEffectParameterTextureExtra(child, data);
              break;
          }
        }

        return data;
      }

      function parseEffectParameterTextureExtra(xml, data) {
        for (var i = 0, l = xml.childNodes.length; i < l; i++) {
          var child = xml.childNodes[i];
          if (child.nodeType !== 1) continue;

          switch (child.nodeName) {
            case 'technique':
              parseEffectParameterTextureExtraTechnique(child, data);
              break;
          }
        }
      }

      function parseEffectParameterTextureExtraTechnique(xml, data) {
        for (var i = 0, l = xml.childNodes.length; i < l; i++) {
          var child = xml.childNodes[i];
          if (child.nodeType !== 1) continue;

          switch (child.nodeName) {
            case 'repeatU':
            case 'repeatV':
            case 'offsetU':
            case 'offsetV':
              data.technique[child.nodeName] = parseFloat(child.textContent);
              break;

            case 'wrapU':
            case 'wrapV':
              // some files have values for wrapU/wrapV which become NaN via parseInt
              if (child.textContent.toUpperCase() === 'TRUE') {
                data.technique[child.nodeName] = 1;
              } else if (child.textContent.toUpperCase() === 'FALSE') {
                data.technique[child.nodeName] = 0;
              } else {
                data.technique[child.nodeName] = parseInt(child.textContent);
              }

              break;
          }
        }
      }

      function buildEffect(data) {
        return data;
      }

      function getEffect(id) {
        return getBuild(library.effects[id], buildEffect);
      } // material


      function parseMaterial(xml) {
        var data = {
          name: xml.getAttribute('name')
        };

        for (var i = 0, l = xml.childNodes.length; i < l; i++) {
          var child = xml.childNodes[i];
          if (child.nodeType !== 1) continue;

          switch (child.nodeName) {
            case 'instance_effect':
              data.url = parseId(child.getAttribute('url'));
              break;
          }
        }

        library.materials[xml.getAttribute('id')] = data;
      }

      function buildMaterial(data) {
        var effect = getEffect(data.url);
        var technique = effect.profile.technique;
        var material;

        switch (technique.type) {
          case 'phong':
          case 'blinn':
            material = new THREE.MeshPhongMaterial();
            break;

          case 'lambert':
            material = new THREE.MeshLambertMaterial();
            break;

          default:
            material = new THREE.MeshBasicMaterial();
            break;
        }

        material.name = data.name;

        function getTexture(textureObject) {
          var sampler = effect.profile.samplers[textureObject.id];

          if (sampler !== undefined) {
            var surface = effect.profile.surfaces[sampler.source];
            var texture = textureLoader.load(getImage(surface.init_from));
            var extra = textureObject.extra;

            if (extra !== undefined && extra.technique !== undefined && isEmpty(extra.technique) === false) {
              var technique = extra.technique;
              texture.wrapS = technique.wrapU ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
              texture.wrapT = technique.wrapV ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
              texture.offset.set(technique.offsetU || 0, technique.offsetV || 0);
              texture.repeat.set(technique.repeatU || 1, technique.repeatV || 1);
            } else {
              texture.wrapS = THREE.RepeatWrapping;
              texture.wrapT = THREE.RepeatWrapping;
            }

            return texture;
          }

          console.error('THREE.ColladaLoader: Undefined sampler', textureObject.id);
          return null;
        }

        var parameters = technique.parameters;

        for (var key in parameters) {
          var parameter = parameters[key];

          switch (key) {
            case 'diffuse':
              if (parameter.color) material.color.fromArray(parameter.color);
              if (parameter.texture) material.map = getTexture(parameter.texture);
              break;

            case 'specular':
              if (parameter.color && material.specular) material.specular.fromArray(parameter.color);
              if (parameter.texture) material.specularMap = getTexture(parameter.texture);
              break;

            case 'shininess':
              if (parameter.float && material.shininess) material.shininess = parameter.float;
              break;

            case 'emission':
              if (parameter.color && material.emissive) material.emissive.fromArray(parameter.color);
              break;

            case 'transparent':
              // if ( parameter.texture ) material.alphaMap = getTexture( parameter.texture );
              material.transparent = true;
              break;

            case 'transparency':
              if (parameter.float !== undefined) material.opacity = parameter.float;
              material.transparent = true;
              break;
          }
        }

        return material;
      }

      function getMaterial(id) {
        return getBuild(library.materials[id], buildMaterial);
      } // camera


      function parseCamera(xml) {
        var data = {
          name: xml.getAttribute('name')
        };

        for (var i = 0, l = xml.childNodes.length; i < l; i++) {
          var child = xml.childNodes[i];
          if (child.nodeType !== 1) continue;

          switch (child.nodeName) {
            case 'optics':
              data.optics = parseCameraOptics(child);
              break;
          }
        }

        library.cameras[xml.getAttribute('id')] = data;
      }

      function parseCameraOptics(xml) {
        for (var i = 0; i < xml.childNodes.length; i++) {
          var child = xml.childNodes[i];

          switch (child.nodeName) {
            case 'technique_common':
              return parseCameraTechnique(child);
          }
        }

        return {};
      }

      function parseCameraTechnique(xml) {
        var data = {};

        for (var i = 0; i < xml.childNodes.length; i++) {
          var child = xml.childNodes[i];

          switch (child.nodeName) {
            case 'perspective':
            case 'orthographic':
              data.technique = child.nodeName;
              data.parameters = parseCameraParameters(child);
              break;
          }
        }

        return data;
      }

      function parseCameraParameters(xml) {
        var data = {};

        for (var i = 0; i < xml.childNodes.length; i++) {
          var child = xml.childNodes[i];

          switch (child.nodeName) {
            case 'xfov':
            case 'yfov':
            case 'xmag':
            case 'ymag':
            case 'znear':
            case 'zfar':
            case 'aspect_ratio':
              data[child.nodeName] = parseFloat(child.textContent);
              break;
          }
        }

        return data;
      }

      function buildCamera(data) {
        var camera;

        switch (data.optics.technique) {
          case 'perspective':
            camera = new THREE.PerspectiveCamera(data.optics.parameters.yfov, data.optics.parameters.aspect_ratio, data.optics.parameters.znear, data.optics.parameters.zfar);
            break;

          case 'orthographic':
            var ymag = data.optics.parameters.ymag;
            var xmag = data.optics.parameters.xmag;
            var aspectRatio = data.optics.parameters.aspect_ratio;
            xmag = xmag === undefined ? ymag * aspectRatio : xmag;
            ymag = ymag === undefined ? xmag / aspectRatio : ymag;
            xmag *= 0.5;
            ymag *= 0.5;
            camera = new THREE.OrthographicCamera(-xmag, xmag, ymag, -ymag, // left, right, top, bottom
            data.optics.parameters.znear, data.optics.parameters.zfar);
            break;

          default:
            camera = new THREE.PerspectiveCamera();
            break;
        }

        camera.name = data.name;
        return camera;
      }

      function getCamera(id) {
        var data = library.cameras[id];

        if (data !== undefined) {
          return getBuild(data, buildCamera);
        }

        return null;
      } // light


      function parseLight(xml) {
        var data = {};

        for (var i = 0, l = xml.childNodes.length; i < l; i++) {
          var child = xml.childNodes[i];
          if (child.nodeType !== 1) continue;

          switch (child.nodeName) {
            case 'technique_common':
              data = parseLightTechnique(child);
              break;
          }
        }

        library.lights[xml.getAttribute('id')] = data;
      }

      function parseLightTechnique(xml) {
        var data = {};

        for (var i = 0, l = xml.childNodes.length; i < l; i++) {
          var child = xml.childNodes[i];
          if (child.nodeType !== 1) continue;

          switch (child.nodeName) {
            case 'directional':
            case 'point':
            case 'spot':
            case 'ambient':
              data.technique = child.nodeName;
              data.parameters = parseLightParameters(child);
          }
        }

        return data;
      }

      function parseLightParameters(xml) {
        var data = {};

        for (var i = 0, l = xml.childNodes.length; i < l; i++) {
          var child = xml.childNodes[i];
          if (child.nodeType !== 1) continue;

          switch (child.nodeName) {
            case 'color':
              var array = parseFloats(child.textContent);
              data.color = new THREE.Color().fromArray(array);
              break;

            case 'falloff_angle':
              data.falloffAngle = parseFloat(child.textContent);
              break;

            case 'quadratic_attenuation':
              var f = parseFloat(child.textContent);
              data.distance = f ? Math.sqrt(1 / f) : 0;
              break;
          }
        }

        return data;
      }

      function buildLight(data) {
        var light;

        switch (data.technique) {
          case 'directional':
            light = new THREE.DirectionalLight();
            break;

          case 'point':
            light = new THREE.PointLight();
            break;

          case 'spot':
            light = new THREE.SpotLight();
            break;

          case 'ambient':
            light = new THREE.AmbientLight();
            break;
        }

        if (data.parameters.color) light.color.copy(data.parameters.color);
        if (data.parameters.distance) light.distance = data.parameters.distance;
        return light;
      } // geometry


      function parseGeometry(xml) {
        var data = {
          name: xml.getAttribute('name'),
          sources: {},
          vertices: {},
          primitives: []
        };
        var mesh = getElementsByTagName(xml, 'mesh')[0];

        for (var i = 0; i < mesh.childNodes.length; i++) {
          var child = mesh.childNodes[i];
          if (child.nodeType !== 1) continue;
          var id = child.getAttribute('id');

          switch (child.nodeName) {
            case 'source':
              data.sources[id] = parseSource(child);
              break;

            case 'vertices':
              // data.sources[ id ] = data.sources[ parseId( getElementsByTagName( child, 'input' )[ 0 ].getAttribute( 'source' ) ) ];
              data.vertices = parseGeometryVertices(child);
              break;

            case 'polygons':
              console.warn('THREE.ColladaLoader: Unsupported primitive type: ', child.nodeName);
              break;

            case 'lines':
            case 'linestrips':
            case 'polylist':
            case 'triangles':
              data.primitives.push(parseGeometryPrimitive(child));
              break;

            default:
              console.log(child);
          }
        }

        library.geometries[xml.getAttribute('id')] = data;
      }

      function parseSource(xml) {
        var data = {
          array: [],
          stride: 3
        };

        for (var i = 0; i < xml.childNodes.length; i++) {
          var child = xml.childNodes[i];
          if (child.nodeType !== 1) continue;

          switch (child.nodeName) {
            case 'float_array':
              data.array = parseFloats(child.textContent);
              break;

            case 'Name_array':
              data.array = parseStrings(child.textContent);
              break;

            case 'technique_common':
              var accessor = getElementsByTagName(child, 'accessor')[0];

              if (accessor !== undefined) {
                data.stride = parseInt(accessor.getAttribute('stride'));
              }

              break;
          }
        }

        return data;
      }

      function parseGeometryVertices(xml) {
        var data = {};

        for (var i = 0; i < xml.childNodes.length; i++) {
          var child = xml.childNodes[i];
          if (child.nodeType !== 1) continue;
          data[child.getAttribute('semantic')] = parseId(child.getAttribute('source'));
        }

        return data;
      }

      function parseGeometryPrimitive(xml) {
        var primitive = {
          type: xml.nodeName,
          material: xml.getAttribute('material'),
          count: parseInt(xml.getAttribute('count')),
          inputs: {},
          stride: 0
        };

        for (var i = 0, l = xml.childNodes.length; i < l; i++) {
          var child = xml.childNodes[i];
          if (child.nodeType !== 1) continue;

          switch (child.nodeName) {
            case 'input':
              var id = parseId(child.getAttribute('source'));
              var semantic = child.getAttribute('semantic');
              var offset = parseInt(child.getAttribute('offset'));
              primitive.inputs[semantic] = {
                id: id,
                offset: offset
              };
              primitive.stride = Math.max(primitive.stride, offset + 1);
              break;

            case 'vcount':
              primitive.vcount = parseInts(child.textContent);
              break;

            case 'p':
              primitive.p = parseInts(child.textContent);
              break;
          }
        }

        return primitive;
      }

      function groupPrimitives(primitives) {
        var build = {};

        for (var i = 0; i < primitives.length; i++) {
          var primitive = primitives[i];
          if (build[primitive.type] === undefined) build[primitive.type] = [];
          build[primitive.type].push(primitive);
        }

        return build;
      }

      function buildGeometry(data) {
        var build = {};
        var sources = data.sources;
        var vertices = data.vertices;
        var primitives = data.primitives;
        if (primitives.length === 0) return {}; // our goal is to create one buffer geoemtry for a single type of primitives
        // first, we group all primitives by their type

        var groupedPrimitives = groupPrimitives(primitives);

        for (var type in groupedPrimitives) {
          // second, we create for each type of primitives (polylist,triangles or lines) a buffer geometry
          build[type] = buildGeometryType(groupedPrimitives[type], sources, vertices);
        }

        return build;
      }

      function buildGeometryType(primitives, sources, vertices) {
        var build = {};
        var position = {
          array: [],
          stride: 0
        };
        var normal = {
          array: [],
          stride: 0
        };
        var uv = {
          array: [],
          stride: 0
        };
        var color = {
          array: [],
          stride: 0
        };
        var skinIndex = {
          array: [],
          stride: 4
        };
        var skinWeight = {
          array: [],
          stride: 4
        };
        var geometry = new THREE.BufferGeometry();
        var materialKeys = [];
        var start = 0,
            count = 0;

        for (var p = 0; p < primitives.length; p++) {
          var primitive = primitives[p];
          var inputs = primitive.inputs;
          var triangleCount = 1;

          if (primitive.vcount && primitive.vcount[0] === 4) {
            triangleCount = 2; // one quad -> two triangles
          } // groups


          if (primitive.type === 'lines' || primitive.type === 'linestrips') {
            count = primitive.count * 2;
          } else {
            count = primitive.count * 3 * triangleCount;
          }

          geometry.addGroup(start, count, p);
          start += count; // material

          if (primitive.material) {
            materialKeys.push(primitive.material);
          } // geometry data


          for (var name in inputs) {
            var input = inputs[name];

            switch (name) {
              case 'VERTEX':
                for (var key in vertices) {
                  var id = vertices[key];

                  switch (key) {
                    case 'POSITION':
                      buildGeometryData(primitive, sources[id], input.offset, position.array);
                      position.stride = sources[id].stride;

                      if (sources.skinWeights && sources.skinIndices) {
                        buildGeometryData(primitive, sources.skinIndices, input.offset, skinIndex.array);
                        buildGeometryData(primitive, sources.skinWeights, input.offset, skinWeight.array);
                      }

                      break;

                    case 'NORMAL':
                      buildGeometryData(primitive, sources[id], input.offset, normal.array);
                      normal.stride = sources[id].stride;
                      break;

                    case 'COLOR':
                      buildGeometryData(primitive, sources[id], input.offset, color.array);
                      color.stride = sources[id].stride;
                      break;

                    case 'TEXCOORD':
                      buildGeometryData(primitive, sources[id], input.offset, uv.array);
                      uv.stride = sources[id].stride;
                      break;

                    default:
                      console.warn('THREE.ColladaLoader: Semantic "%s" not handled in geometry build process.', key);
                  }
                }

                break;

              case 'NORMAL':
                buildGeometryData(primitive, sources[input.id], input.offset, normal.array);
                normal.stride = sources[input.id].stride;
                break;

              case 'COLOR':
                buildGeometryData(primitive, sources[input.id], input.offset, color.array);
                color.stride = sources[input.id].stride;
                break;

              case 'TEXCOORD':
                buildGeometryData(primitive, sources[input.id], input.offset, uv.array);
                uv.stride = sources[input.id].stride;
                break;
            }
          }
        } // build geometry


        if (position.array.length > 0) geometry.addAttribute('position', new THREE.Float32BufferAttribute(position.array, position.stride));
        if (normal.array.length > 0) geometry.addAttribute('normal', new THREE.Float32BufferAttribute(normal.array, normal.stride));
        if (color.array.length > 0) geometry.addAttribute('color', new THREE.Float32BufferAttribute(color.array, color.stride));
        if (uv.array.length > 0) geometry.addAttribute('uv', new THREE.Float32BufferAttribute(uv.array, uv.stride));
        if (skinIndex.array.length > 0) geometry.addAttribute('skinIndex', new THREE.Float32BufferAttribute(skinIndex.array, skinIndex.stride));
        if (skinWeight.array.length > 0) geometry.addAttribute('skinWeight', new THREE.Float32BufferAttribute(skinWeight.array, skinWeight.stride));
        build.data = geometry;
        build.type = primitives[0].type;
        build.materialKeys = materialKeys;
        return build;
      }

      function buildGeometryData(primitive, source, offset, array) {
        var indices = primitive.p;
        var stride = primitive.stride;
        var vcount = primitive.vcount;

        function pushVector(i) {
          var index = indices[i + offset] * sourceStride;
          var length = index + sourceStride;

          for (; index < length; index++) {
            array.push(sourceArray[index]);
          }
        }

        var maxcount = 0;
        var sourceArray = source.array;
        var sourceStride = source.stride;

        if (primitive.vcount !== undefined) {
          var index = 0;

          for (var i = 0, l = vcount.length; i < l; i++) {
            var count = vcount[i];

            if (count === 4) {
              var a = index + stride * 0;
              var b = index + stride * 1;
              var c = index + stride * 2;
              var d = index + stride * 3;
              pushVector(a);
              pushVector(b);
              pushVector(d);
              pushVector(b);
              pushVector(c);
              pushVector(d);
            } else if (count === 3) {
              var a = index + stride * 0;
              var b = index + stride * 1;
              var c = index + stride * 2;
              pushVector(a);
              pushVector(b);
              pushVector(c);
            } else {
              maxcount = Math.max(maxcount, count);
            }

            index += stride * count;
          }

          if (maxcount > 0) {
            console.log('THREE.ColladaLoader: Geometry has faces with more than 4 vertices.');
          }
        } else {
          for (var i = 0, l = indices.length; i < l; i += stride) {
            pushVector(i);
          }
        }
      }

      function getGeometry(id) {
        return getBuild(library.geometries[id], buildGeometry);
      } // kinematics


      function parseKinematicsModel(xml) {
        var data = {
          name: xml.getAttribute('name') || '',
          joints: {},
          links: []
        };

        for (var i = 0; i < xml.childNodes.length; i++) {
          var child = xml.childNodes[i];
          if (child.nodeType !== 1) continue;

          switch (child.nodeName) {
            case 'technique_common':
              parseKinematicsTechniqueCommon(child, data);
              break;
          }
        }

        library.kinematicsModels[xml.getAttribute('id')] = data;
      }

      function buildKinematicsModel(data) {
        if (data.build !== undefined) return data.build;
        return data;
      }

      function getKinematicsModel(id) {
        return getBuild(library.kinematicsModels[id], buildKinematicsModel);
      }

      function parseKinematicsTechniqueCommon(xml, data) {
        for (var i = 0; i < xml.childNodes.length; i++) {
          var child = xml.childNodes[i];
          if (child.nodeType !== 1) continue;

          switch (child.nodeName) {
            case 'joint':
              data.joints[child.getAttribute('sid')] = parseKinematicsJoint(child);
              break;

            case 'link':
              data.links.push(parseKinematicsLink(child));
              break;
          }
        }
      }

      function parseKinematicsJoint(xml) {
        var data;

        for (var i = 0; i < xml.childNodes.length; i++) {
          var child = xml.childNodes[i];
          if (child.nodeType !== 1) continue;

          switch (child.nodeName) {
            case 'prismatic':
            case 'revolute':
              data = parseKinematicsJointParameter(child);
              break;
          }
        }

        return data;
      }

      function parseKinematicsJointParameter(xml, data) {
        var data = {
          sid: xml.getAttribute('sid'),
          name: xml.getAttribute('name') || '',
          axis: new THREE.Vector3(),
          limits: {
            min: 0,
            max: 0
          },
          type: xml.nodeName,
          static: false,
          zeroPosition: 0,
          middlePosition: 0
        };

        for (var i = 0; i < xml.childNodes.length; i++) {
          var child = xml.childNodes[i];
          if (child.nodeType !== 1) continue;

          switch (child.nodeName) {
            case 'axis':
              var array = parseFloats(child.textContent);
              data.axis.fromArray(array);
              break;

            case 'limits':
              var max = child.getElementsByTagName('max')[0];
              var min = child.getElementsByTagName('min')[0];
              data.limits.max = parseFloat(max.textContent);
              data.limits.min = parseFloat(min.textContent);
              break;
          }
        } // if min is equal to or greater than max, consider the joint static


        if (data.limits.min >= data.limits.max) {
          data.static = true;
        } // calculate middle position


        data.middlePosition = (data.limits.min + data.limits.max) / 2.0;
        return data;
      }

      function parseKinematicsLink(xml) {
        var data = {
          sid: xml.getAttribute('sid'),
          name: xml.getAttribute('name') || '',
          attachments: [],
          transforms: []
        };

        for (var i = 0; i < xml.childNodes.length; i++) {
          var child = xml.childNodes[i];
          if (child.nodeType !== 1) continue;

          switch (child.nodeName) {
            case 'attachment_full':
              data.attachments.push(parseKinematicsAttachment(child));
              break;

            case 'matrix':
            case 'translate':
            case 'rotate':
              data.transforms.push(parseKinematicsTransform(child));
              break;
          }
        }

        return data;
      }

      function parseKinematicsAttachment(xml) {
        var data = {
          joint: xml.getAttribute('joint').split('/').pop(),
          transforms: [],
          links: []
        };

        for (var i = 0; i < xml.childNodes.length; i++) {
          var child = xml.childNodes[i];
          if (child.nodeType !== 1) continue;

          switch (child.nodeName) {
            case 'link':
              data.links.push(parseKinematicsLink(child));
              break;

            case 'matrix':
            case 'translate':
            case 'rotate':
              data.transforms.push(parseKinematicsTransform(child));
              break;
          }
        }

        return data;
      }

      function parseKinematicsTransform(xml) {
        var data = {
          type: xml.nodeName
        };
        var array = parseFloats(xml.textContent);

        switch (data.type) {
          case 'matrix':
            data.obj = new THREE.Matrix4();
            data.obj.fromArray(array).transpose();
            break;

          case 'translate':
            data.obj = new THREE.Vector3();
            data.obj.fromArray(array);
            break;

          case 'rotate':
            data.obj = new THREE.Vector3();
            data.obj.fromArray(array);
            data.angle = THREE.Math.degToRad(array[3]);
            break;
        }

        return data;
      }

      function parseKinematicsScene(xml) {
        var data = {
          bindJointAxis: []
        };

        for (var i = 0; i < xml.childNodes.length; i++) {
          var child = xml.childNodes[i];
          if (child.nodeType !== 1) continue;

          switch (child.nodeName) {
            case 'bind_joint_axis':
              data.bindJointAxis.push(parseKinematicsBindJointAxis(child));
              break;
          }
        }

        library.kinematicsScenes[parseId(xml.getAttribute('url'))] = data;
      }

      function parseKinematicsBindJointAxis(xml) {
        var data = {
          target: xml.getAttribute('target').split('/').pop()
        };

        for (var i = 0; i < xml.childNodes.length; i++) {
          var child = xml.childNodes[i];
          if (child.nodeType !== 1) continue;

          switch (child.nodeName) {
            case 'axis':
              var param = child.getElementsByTagName('param')[0];
              data.axis = param.textContent;
              var tmpJointIndex = data.axis.split('inst_').pop().split('axis')[0];
              data.jointIndex = tmpJointIndex.substr(0, tmpJointIndex.length - 1);
              break;
          }
        }

        return data;
      }

      function buildKinematicsScene(data) {
        if (data.build !== undefined) return data.build;
        return data;
      }

      function getKinematicsScene(id) {
        return getBuild(library.kinematicsScenes[id], buildKinematicsScene);
      }

      function setupKinematics() {
        var kinematicsModelId = Object.keys(library.kinematicsModels)[0];
        var kinematicsSceneId = Object.keys(library.kinematicsScenes)[0];
        var visualSceneId = Object.keys(library.visualScenes)[0];
        if (kinematicsModelId === undefined || kinematicsSceneId === undefined) return;
        var kinematicsModel = getKinematicsModel(kinematicsModelId);
        var kinematicsScene = getKinematicsScene(kinematicsSceneId);
        var visualScene = getVisualScene(visualSceneId);
        var bindJointAxis = kinematicsScene.bindJointAxis;
        var jointMap = {};

        for (var i = 0, l = bindJointAxis.length; i < l; i++) {
          var axis = bindJointAxis[i]; // the result of the following query is an element of type 'translate', 'rotate','scale' or 'matrix'

          var targetElement = collada.querySelector('[sid="' + axis.target + '"]');

          if (targetElement) {
            // get the parent of the transfrom element
            var parentVisualElement = targetElement.parentElement; // connect the joint of the kinematics model with the element in the visual scene

            connect(axis.jointIndex, parentVisualElement);
          }
        }

        function connect(jointIndex, visualElement) {
          var visualElementName = visualElement.getAttribute('name');
          var joint = kinematicsModel.joints[jointIndex];
          visualScene.traverse(function (object) {
            if (object.name === visualElementName) {
              jointMap[jointIndex] = {
                object: object,
                transforms: buildTransformList(visualElement),
                joint: joint,
                position: joint.zeroPosition
              };
            }
          });
        }

        var m0 = new THREE.Matrix4();
        kinematics = {
          joints: kinematicsModel && kinematicsModel.joints,
          getJointValue: function (jointIndex) {
            var jointData = jointMap[jointIndex];

            if (jointData) {
              return jointData.position;
            } else {
              console.warn('THREE.ColladaLoader: Joint ' + jointIndex + ' doesn\'t exist.');
            }
          },
          setJointValue: function (jointIndex, value) {
            var jointData = jointMap[jointIndex];

            if (jointData) {
              var joint = jointData.joint;

              if (value > joint.limits.max || value < joint.limits.min) {
                console.warn('THREE.ColladaLoader: Joint ' + jointIndex + ' value ' + value + ' outside of limits (min: ' + joint.limits.min + ', max: ' + joint.limits.max + ').');
              } else if (joint.static) {
                console.warn('THREE.ColladaLoader: Joint ' + jointIndex + ' is static.');
              } else {
                var object = jointData.object;
                var axis = joint.axis;
                var transforms = jointData.transforms;
                matrix.identity(); // each update, we have to apply all transforms in the correct order

                for (var i = 0; i < transforms.length; i++) {
                  var transform = transforms[i]; // if there is a connection of the transform node with a joint, apply the joint value

                  if (transform.sid && transform.sid.indexOf(jointIndex) !== -1) {
                    switch (joint.type) {
                      case 'revolute':
                        matrix.multiply(m0.makeRotationAxis(axis, THREE.Math.degToRad(value)));
                        break;

                      case 'prismatic':
                        matrix.multiply(m0.makeTranslation(axis.x * value, axis.y * value, axis.z * value));
                        break;

                      default:
                        console.warn('THREE.ColladaLoader: Unknown joint type: ' + joint.type);
                        break;
                    }
                  } else {
                    switch (transform.type) {
                      case 'matrix':
                        matrix.multiply(transform.obj);
                        break;

                      case 'translate':
                        matrix.multiply(m0.makeTranslation(transform.obj.x, transform.obj.y, transform.obj.z));
                        break;

                      case 'scale':
                        matrix.scale(transform.obj);
                        break;

                      case 'rotate':
                        matrix.multiply(m0.makeRotationAxis(transform.obj, transform.angle));
                        break;
                    }
                  }
                }

                object.matrix.copy(matrix);
                object.matrix.decompose(object.position, object.quaternion, object.scale);
                jointMap[jointIndex].position = value;
              }
            } else {
              console.log('THREE.ColladaLoader: ' + jointIndex + ' does not exist.');
            }
          }
        };
      }

      function buildTransformList(node) {
        var transforms = [];
        var xml = collada.querySelector('[id="' + node.id + '"]');

        for (var i = 0; i < xml.childNodes.length; i++) {
          var child = xml.childNodes[i];
          if (child.nodeType !== 1) continue;

          switch (child.nodeName) {
            case 'matrix':
              var array = parseFloats(child.textContent);
              var matrix = new THREE.Matrix4().fromArray(array).transpose();
              transforms.push({
                sid: child.getAttribute('sid'),
                type: child.nodeName,
                obj: matrix
              });
              break;

            case 'translate':
            case 'scale':
              var array = parseFloats(child.textContent);
              var vector = new THREE.Vector3().fromArray(array);
              transforms.push({
                sid: child.getAttribute('sid'),
                type: child.nodeName,
                obj: vector
              });
              break;

            case 'rotate':
              var array = parseFloats(child.textContent);
              var vector = new THREE.Vector3().fromArray(array);
              var angle = THREE.Math.degToRad(array[3]);
              transforms.push({
                sid: child.getAttribute('sid'),
                type: child.nodeName,
                obj: vector,
                angle: angle
              });
              break;
          }
        }

        return transforms;
      } // nodes


      function prepareNodes(xml) {
        var elements = xml.getElementsByTagName('node'); // ensure all node elements have id attributes

        for (var i = 0; i < elements.length; i++) {
          var element = elements[i];

          if (element.hasAttribute('id') === false) {
            element.setAttribute('id', generateId());
          }
        }
      }

      var matrix = new THREE.Matrix4();
      var vector = new THREE.Vector3();

      function parseNode(xml) {
        var data = {
          name: xml.getAttribute('name') || '',
          type: xml.getAttribute('type'),
          id: xml.getAttribute('id'),
          sid: xml.getAttribute('sid'),
          matrix: new THREE.Matrix4(),
          nodes: [],
          instanceCameras: [],
          instanceControllers: [],
          instanceLights: [],
          instanceGeometries: [],
          instanceNodes: [],
          transforms: {}
        };

        for (var i = 0; i < xml.childNodes.length; i++) {
          var child = xml.childNodes[i];
          if (child.nodeType !== 1) continue;

          switch (child.nodeName) {
            case 'node':
              data.nodes.push(child.getAttribute('id'));
              parseNode(child);
              break;

            case 'instance_camera':
              data.instanceCameras.push(parseId(child.getAttribute('url')));
              break;

            case 'instance_controller':
              data.instanceControllers.push(parseNodeInstance(child));
              break;

            case 'instance_light':
              data.instanceLights.push(parseId(child.getAttribute('url')));
              break;

            case 'instance_geometry':
              data.instanceGeometries.push(parseNodeInstance(child));
              break;

            case 'instance_node':
              data.instanceNodes.push(parseId(child.getAttribute('url')));
              break;

            case 'matrix':
              var array = parseFloats(child.textContent);
              data.matrix.multiply(matrix.fromArray(array).transpose());
              data.transforms[child.getAttribute('sid')] = child.nodeName;
              break;

            case 'translate':
              var array = parseFloats(child.textContent);
              vector.fromArray(array);
              data.matrix.multiply(matrix.makeTranslation(vector.x, vector.y, vector.z));
              data.transforms[child.getAttribute('sid')] = child.nodeName;
              break;

            case 'rotate':
              var array = parseFloats(child.textContent);
              var angle = THREE.Math.degToRad(array[3]);
              data.matrix.multiply(matrix.makeRotationAxis(vector.fromArray(array), angle));
              data.transforms[child.getAttribute('sid')] = child.nodeName;
              break;

            case 'scale':
              var array = parseFloats(child.textContent);
              data.matrix.scale(vector.fromArray(array));
              data.transforms[child.getAttribute('sid')] = child.nodeName;
              break;

            case 'extra':
              break;

            default:
              console.log(child);
          }
        }

        library.nodes[data.id] = data;
        return data;
      }

      function parseNodeInstance(xml) {
        var data = {
          id: parseId(xml.getAttribute('url')),
          materials: {},
          skeletons: []
        };

        for (var i = 0; i < xml.childNodes.length; i++) {
          var child = xml.childNodes[i];

          switch (child.nodeName) {
            case 'bind_material':
              var instances = child.getElementsByTagName('instance_material');

              for (var j = 0; j < instances.length; j++) {
                var instance = instances[j];
                var symbol = instance.getAttribute('symbol');
                var target = instance.getAttribute('target');
                data.materials[symbol] = parseId(target);
              }

              break;

            case 'skeleton':
              data.skeletons.push(parseId(child.textContent));
              break;
          }
        }

        return data;
      }

      function buildSkeleton(skeletons, joints) {
        var boneData = [];
        var sortedBoneData = [];
        var i, j, data; // a skeleton can have multiple root bones. collada expresses this
        // situtation with multiple "skeleton" tags per controller instance

        for (i = 0; i < skeletons.length; i++) {
          var skeleton = skeletons[i];
          var root = getNode(skeleton); // setup bone data for a single bone hierarchy

          buildBoneHierarchy(root, joints, boneData);
        } // sort bone data (the order is defined in the corresponding controller)


        for (i = 0; i < joints.length; i++) {
          for (j = 0; j < boneData.length; j++) {
            data = boneData[j];

            if (data.bone.name === joints[i].name) {
              sortedBoneData[i] = data;
              data.processed = true;
              break;
            }
          }
        } // add unprocessed bone data at the end of the list


        for (i = 0; i < boneData.length; i++) {
          data = boneData[i];

          if (data.processed === false) {
            sortedBoneData.push(data);
            data.processed = true;
          }
        } // setup arrays for skeleton creation


        var bones = [];
        var boneInverses = [];

        for (i = 0; i < sortedBoneData.length; i++) {
          data = sortedBoneData[i];
          bones.push(data.bone);
          boneInverses.push(data.boneInverse);
        }

        return new THREE.Skeleton(bones, boneInverses);
      }

      function buildBoneHierarchy(root, joints, boneData) {
        // setup bone data from visual scene
        root.traverse(function (object) {
          if (object.isBone === true) {
            var boneInverse; // retrieve the boneInverse from the controller data

            for (var i = 0; i < joints.length; i++) {
              var joint = joints[i];

              if (joint.name === object.name) {
                boneInverse = joint.boneInverse;
                break;
              }
            }

            if (boneInverse === undefined) {
              // Unfortunately, there can be joints in the visual scene that are not part of the
              // corresponding controller. In this case, we have to create a dummy boneInverse matrix
              // for the respective bone. This bone won't affect any vertices, because there are no skin indices
              // and weights defined for it. But we still have to add the bone to the sorted bone list in order to
              // ensure a correct animation of the model.
              boneInverse = new THREE.Matrix4();
            }

            boneData.push({
              bone: object,
              boneInverse: boneInverse,
              processed: false
            });
          }
        });
      }

      function buildNode(data) {
        var objects = [];
        var matrix = data.matrix;
        var nodes = data.nodes;
        var type = data.type;
        var instanceCameras = data.instanceCameras;
        var instanceControllers = data.instanceControllers;
        var instanceLights = data.instanceLights;
        var instanceGeometries = data.instanceGeometries;
        var instanceNodes = data.instanceNodes; // nodes

        for (var i = 0, l = nodes.length; i < l; i++) {
          objects.push(getNode(nodes[i]));
        } // instance cameras


        for (var i = 0, l = instanceCameras.length; i < l; i++) {
          var instanceCamera = getCamera(instanceCameras[i]);

          if (instanceCamera !== null) {
            objects.push(instanceCamera.clone());
          }
        } // instance controllers


        for (var i = 0, l = instanceControllers.length; i < l; i++) {
          var instance = instanceControllers[i];
          var controller = getController(instance.id);
          var geometries = getGeometry(controller.id);
          var newObjects = buildObjects(geometries, instance.materials);
          var skeletons = instance.skeletons;
          var joints = controller.skin.joints;
          var skeleton = buildSkeleton(skeletons, joints);

          for (var j = 0, jl = newObjects.length; j < jl; j++) {
            var object = newObjects[j];

            if (object.isSkinnedMesh) {
              object.bind(skeleton, controller.skin.bindMatrix);
              object.normalizeSkinWeights();
            }

            objects.push(object);
          }
        } // instance lights


        for (var i = 0, l = instanceLights.length; i < l; i++) {
          var instanceCamera = getCamera(instanceCameras[i]);

          if (instanceCamera !== null) {
            objects.push(instanceCamera.clone());
          }
        } // instance geometries


        for (var i = 0, l = instanceGeometries.length; i < l; i++) {
          var instance = instanceGeometries[i]; // a single geometry instance in collada can lead to multiple object3Ds.
          // this is the case when primitives are combined like triangles and lines

          var geometries = getGeometry(instance.id);
          var newObjects = buildObjects(geometries, instance.materials);

          for (var j = 0, jl = newObjects.length; j < jl; j++) {
            objects.push(newObjects[j]);
          }
        } // instance nodes


        for (var i = 0, l = instanceNodes.length; i < l; i++) {
          objects.push(getNode(instanceNodes[i]).clone());
        }

        var object;

        if (nodes.length === 0 && objects.length === 1) {
          object = objects[0];
        } else {
          object = type === 'JOINT' ? new THREE.Bone() : new THREE.Object3D();

          for (var i = 0; i < objects.length; i++) {
            object.add(objects[i]);
          }
        }

        object.name = type === 'JOINT' ? data.sid : data.name;
        object.matrix.copy(matrix);
        object.matrix.decompose(object.position, object.quaternion, object.scale);
        return object;
      }

      function resolveMaterialBinding(keys, instanceMaterials) {
        var materials = [];

        for (var i = 0, l = keys.length; i < l; i++) {
          var id = instanceMaterials[keys[i]];
          materials.push(getMaterial(id));
        }

        return materials;
      }

      function buildObjects(geometries, instanceMaterials) {
        var objects = [];

        for (var type in geometries) {
          var geometry = geometries[type];
          var materials = resolveMaterialBinding(geometry.materialKeys, instanceMaterials); // handle case if no materials are defined

          if (materials.length === 0) {
            if (type === 'lines' || type === 'linestrips') {
              materials.push(new THREE.LineBasicMaterial());
            } else {
              materials.push(new THREE.MeshPhongMaterial());
            }
          } // regard skinning


          var skinning = geometry.data.attributes.skinIndex !== undefined;

          if (skinning) {
            for (var i = 0, l = materials.length; i < l; i++) {
              materials[i].skinning = true;
            }
          } // choose between a single or multi materials (material array)


          var material = materials.length === 1 ? materials[0] : materials; // now create a specific 3D object

          var object;

          switch (type) {
            case 'lines':
              object = new THREE.LineSegments(geometry.data, material);
              break;

            case 'linestrips':
              object = new THREE.Line(geometry.data, material);
              break;

            case 'triangles':
            case 'polylist':
              if (skinning) {
                object = new THREE.SkinnedMesh(geometry.data, material);
              } else {
                object = new THREE.Mesh(geometry.data, material);
              }

              break;
          }

          objects.push(object);
        }

        return objects;
      }

      function getNode(id) {
        return getBuild(library.nodes[id], buildNode);
      } // visual scenes


      function parseVisualScene(xml) {
        var data = {
          name: xml.getAttribute('name'),
          children: []
        };
        prepareNodes(xml);
        var elements = getElementsByTagName(xml, 'node');

        for (var i = 0; i < elements.length; i++) {
          data.children.push(parseNode(elements[i]));
        }

        library.visualScenes[xml.getAttribute('id')] = data;
      }

      function buildVisualScene(data) {
        var group = new THREE.Object3D();
        group.name = data.name;
        var children = data.children;

        for (var i = 0; i < children.length; i++) {
          var child = children[i];

          if (child.id === null) {
            group.add(buildNode(child));
          } else {
            // if there is an ID, let's try to get the finished build (e.g. joints are already build)
            group.add(getNode(child.id));
          }
        }

        return group;
      }

      function getVisualScene(id) {
        return getBuild(library.visualScenes[id], buildVisualScene);
      } // scenes


      function parseScene(xml) {
        var instance = getElementsByTagName(xml, 'instance_visual_scene')[0];
        return getVisualScene(parseId(instance.getAttribute('url')));
      }

      function setupAnimations() {
        var clips = library.clips;

        if (isEmpty(clips) === true) {
          if (isEmpty(library.animations) === false) {
            // if there are animations but no clips, we create a default clip for playback
            var tracks = [];

            for (var id in library.animations) {
              var animationTracks = getAnimation(id);

              for (var i = 0, l = animationTracks.length; i < l; i++) {
                tracks.push(animationTracks[i]);
              }
            }

            animations.push(new THREE.AnimationClip('default', -1, tracks));
          }
        } else {
          for (var id in clips) {
            animations.push(getAnimationClip(id));
          }
        }
      }

      console.time('THREE.ColladaLoader');

      if (text.length === 0) {
        return {
          scene: new THREE.Scene()
        };
      }

      console.time('THREE.ColladaLoader: DOMParser');
      var xml = new DOMParser().parseFromString(text, 'application/xml');
      console.timeEnd('THREE.ColladaLoader: DOMParser');
      var collada = getElementsByTagName(xml, 'COLLADA')[0]; // metadata

      var version = collada.getAttribute('version');
      console.log('THREE.ColladaLoader: File version', version);
      var asset = parseAsset(getElementsByTagName(collada, 'asset')[0]);
      var textureLoader = new THREE.TextureLoader(this.manager);
      textureLoader.setPath(path).setCrossOrigin(this.crossOrigin); //

      var animations = [];
      var kinematics = {};
      var count = 0; //

      var library = {
        animations: {},
        clips: {},
        controllers: {},
        images: {},
        effects: {},
        materials: {},
        cameras: {},
        lights: {},
        geometries: {},
        nodes: {},
        visualScenes: {},
        kinematicsModels: {},
        kinematicsScenes: {}
      };
      console.time('THREE.ColladaLoader: Parse');
      parseLibrary(collada, 'library_animations', 'animation', parseAnimation);
      parseLibrary(collada, 'library_animation_clips', 'animation_clip', parseAnimationClip);
      parseLibrary(collada, 'library_controllers', 'controller', parseController);
      parseLibrary(collada, 'library_images', 'image', parseImage);
      parseLibrary(collada, 'library_effects', 'effect', parseEffect);
      parseLibrary(collada, 'library_materials', 'material', parseMaterial);
      parseLibrary(collada, 'library_cameras', 'camera', parseCamera);
      parseLibrary(collada, 'library_lights', 'light', parseLight);
      parseLibrary(collada, 'library_geometries', 'geometry', parseGeometry);
      parseLibrary(collada, 'library_nodes', 'node', parseNode);
      parseLibrary(collada, 'library_visual_scenes', 'visual_scene', parseVisualScene);
      parseLibrary(collada, 'library_kinematics_models', 'kinematics_model', parseKinematicsModel);
      parseLibrary(collada, 'scene', 'instance_kinematics_scene', parseKinematicsScene);
      console.timeEnd('THREE.ColladaLoader: Parse');
      console.time('THREE.ColladaLoader: Build');
      buildLibrary(library.animations, buildAnimation);
      buildLibrary(library.clips, buildAnimationClip);
      buildLibrary(library.controllers, buildController);
      buildLibrary(library.images, buildImage);
      buildLibrary(library.effects, buildEffect);
      buildLibrary(library.materials, buildMaterial);
      buildLibrary(library.cameras, buildCamera);
      buildLibrary(library.lights, buildLight);
      buildLibrary(library.geometries, buildGeometry);
      buildLibrary(library.visualScenes, buildVisualScene);
      console.timeEnd('THREE.ColladaLoader: Build');
      setupAnimations();
      setupKinematics();
      var scene = parseScene(getElementsByTagName(collada, 'scene')[0]);
      /*
       * up_axis of some robot models in ROS world aren't properly set because
       * rviz ignores this field. Thus, ignores Z_UP to show urdfs just like rviz.
       * See https://github.com/ros-visualization/rviz/issues/1045 for the detail
        if ( asset.upAxis === 'Z_UP' ) {
           scene.rotation.x = - Math.PI / 2;
         }
       */

      scene.scale.multiplyScalar(asset.unit);
      console.timeEnd('THREE.ColladaLoader');
      return {
        animations: animations,
        kinematics: kinematics,
        library: library,
        scene: scene
      };
    }
  };
  /**
   * @fileOverview
   * @author Jose Rojas - jrojas@redlinesolutions.co
   */

  /**
   * MeshLoader is a singleton factory class for using various helper classes to
   * load mesh files of different types.
   *
   * It consists of one dictionary property 'loaders'. The dictionary keys consist
   * of the file extension for each supported loader type. The dictionary values
   * are functions used to construct the loader objects. The functions have the
   * following parameters:
   *
   *  * meshRes - the MeshResource that will contain the loaded mesh
   *  * uri - the uri path to the mesh file
   *  @returns loader object
   */

  var MeshLoader = {
    onError: function (error) {
      console.error(error);
    },
    loaders: {
      'dae': function (meshRes, uri, options) {
        const material = options.material;
        const loader = new THREE.ColladaLoader(options.loader);

        loader.log = function (message) {
          if (meshRes.warnings) {
            console.warn(message);
          }
        };

        loader.load(uri, function colladaReady(collada) {
          // check for a scale factor in ColladaLoader2
          // add a texture to anything that is missing one
          if (material !== null) {
            collada.scene.traverse(function (child) {
              if (child instanceof THREE.Mesh) {
                if (child.material === undefined) {
                  child.material = material;
                }
              }
            });
          }

          meshRes.add(collada.scene);
        },
        /*onProgress=*/
        null, MeshLoader.onError);
        return loader;
      },
      'obj': function (meshRes, uri, options) {
        const material = options.material;
        const loader = new THREE.OBJLoader(options.loader);

        loader.log = function (message) {
          if (meshRes.warnings) {
            console.warn(message);
          }
        }; //Reload the mesh again after materials have been loaded
        // @todo: this should be improved so that the file doesn't need to be
        // reloaded however that would involve more changes within the OBJLoader.


        function onMaterialsLoaded(loader, materials) {
          loader.setMaterials(materials).load(uri, function OBJMaterialsReady(obj) {
            // add the container group
            meshRes.add(obj);
          }, null, MeshLoader.onError);
        }

        loader.load(uri, function OBJFileReady(obj) {
          const baseUri = THREE.LoaderUtils.extractUrlBase(uri);

          if (obj.materialLibraries.length) {
            // load the material libraries
            const materialUri = obj.materialLibraries[0];
            new THREE.MTLLoader(options.loader).setPath(baseUri).load(materialUri, function (materials) {
              materials.preload();
              onMaterialsLoaded(loader, materials);
            }, null, MeshLoader.onError);
          } else {
            // add the container group
            if (material !== null) {
              obj.children.forEach(function (child) {
                if (child instanceof THREE.Mesh) {
                  child.material = material;
                }
              });
            }

            meshRes.add(obj);
          }
        },
        /*onProgress=*/
        null, MeshLoader.onError);
        return loader;
      },
      'stl': function (meshRes, uri, options) {
        const material = options.material;
        const loader = new THREE.STLLoader(options.loader);
        {
          loader.load(uri, function (geometry) {
            geometry.computeFaceNormals();
            var mesh;

            if (material !== null) {
              mesh = new THREE.Mesh(geometry, material);
            } else {
              mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
                color: 0x999999
              }));
            }

            meshRes.add(mesh);
          },
          /*onProgress=*/
          null, MeshLoader.onError);
        }
        return loader;
      }
    }
  };
  /**
   * @fileOverview
   * @author Jihoon Lee - jihoonlee.in@gmail.com
   * @author Russell Toris - rctoris@wpi.edu
   */

  class MeshResource extends THREE.Object3D {
    /**
     * A MeshResource is an THREE object that will load from a external mesh file. Currently loads
     * Collada files.
     *
     * @constructor
     * @param options - object with following keys:
     *
     *  * path (optional) - the base path to the associated models that will be loaded
     *  * resource - the resource file name to load
     *  * material (optional) - the material to use for the object
     *  * warnings (optional) - if warnings should be printed
     */
    constructor(options) {
      super();
      options = options || {};
      var path = options.path || '/';
      var resource = options.resource;
      options.material || null;
      this.warnings = options.warnings; // check for a trailing '/'

      if (path.substr(path.length - 1) !== '/') {
        path += '/';
      }

      var uri = path + resource;
      var fileType = uri.substr(-3).toLowerCase(); // check the type

      var loaderFunc = MeshLoader.loaders[fileType];

      if (loaderFunc) {
        loaderFunc(this, uri, options);
      } else {
        console.warn('Unsupported loader for file type: \'' + fileType + '\'');
      }
    }

  }
  /**
   * @fileOverview
   * @author David Gossow - dgossow@willowgarage.com
   */


  class TriangleList extends THREE.Object3D {
    /**
     * A TriangleList is a THREE object that can be used to display a list of triangles as a geometry.
     *
     * @constructor
     * @param options - object with following keys:
     *
     *   * material (optional) - the material to use for the object
     *   * vertices - the array of vertices to use
     *   * colors - the associated array of colors to use
     */
    constructor(options) {
      options = options || {};
      var material = options.material || new THREE.MeshBasicMaterial();
      var vertices = options.vertices;
      var colors = options.colors;
      super(); // set the material to be double sided

      material.side = THREE.DoubleSide; // construct the geometry

      var geometry = new THREE.Geometry();

      for (i = 0; i < vertices.length; i++) {
        geometry.vertices.push(new THREE.Vector3(vertices[i].x, vertices[i].y, vertices[i].z));
      } // set the colors


      var i, j;

      if (colors.length === vertices.length) {
        // use per-vertex color
        for (i = 0; i < vertices.length; i += 3) {
          var faceVert = new THREE.Face3(i, i + 1, i + 2);

          for (j = i * 3; j < i * 3 + 3; i++) {
            var color = new THREE.Color();
            color.setRGB(colors[i].r, colors[i].g, colors[i].b);
            faceVert.vertexColors.push(color);
          }

          geometry.faces.push(faceVert);
        }

        material.vertexColors = THREE.VertexColors;
      } else if (colors.length === vertices.length / 3) {
        // use per-triangle color
        for (i = 0; i < vertices.length; i += 3) {
          var faceTri = new THREE.Face3(i, i + 1, i + 2);
          faceTri.color.setRGB(colors[i / 3].r, colors[i / 3].g, colors[i / 3].b);
          geometry.faces.push(faceTri);
        }

        material.vertexColors = THREE.FaceColors;
      } else {
        // use marker color
        for (i = 0; i < vertices.length; i += 3) {
          var face = new THREE.Face3(i, i + 1, i + 2);
          geometry.faces.push(face);
        }
      }

      geometry.computeBoundingBox();
      geometry.computeBoundingSphere();
      geometry.computeFaceNormals();
      this.add(new THREE.Mesh(geometry, material));
    }

    /**
     * Set the color of this object to the given hex value.
     *
     * @param hex - the hex value of the color to set
     */
    setColor(hex) {
      this.mesh.material.color.setHex(hex);
    }

  }
  /**
   * @fileOverview
   * @author David Gossow - dgossow@willowgarage.com
   * @author Russell Toris - rctoris@wpi.edu
   */


  class Marker extends THREE.Object3D {
    /**
     * A Marker can convert a ROS marker message into a THREE object.
     *
     * @constructor
     * @param options - object with following keys:
     *
     *   * path - the base path or URL for any mesh files that will be loaded for this marker
     *   * message - the marker message
     */
    constructor(options) {
      super();
      options = options || {};
      var path = options.path || '/';
      var message = options.message; // check for a trailing '/'

      if (path.substr(path.length - 1) !== '/') {
        path += '/';
      }

      if (message.scale) {
        this.msgScale = [message.scale.x, message.scale.y, message.scale.z];
      } else {
        this.msgScale = [1, 1, 1];
      }

      this.msgColor = message.color;
      this.msgMesh = undefined; // set the pose and get the color

      this.setPose(message.pose);
      var colorMaterial = makeColorMaterial(this.msgColor.r, this.msgColor.g, this.msgColor.b, this.msgColor.a); // create the object based on the type

      switch (message.type) {
        case MARKER_ARROW:
          // get the sizes for the arrow
          var len = message.scale.x;
          var headLength = len * 0.23;
          var headDiameter = message.scale.y;
          var shaftDiameter = headDiameter * 0.5; // determine the points

          var direction,
              p1 = null;

          if (message.points.length === 2) {
            p1 = new THREE.Vector3(message.points[0].x, message.points[0].y, message.points[0].z);
            var p2 = new THREE.Vector3(message.points[1].x, message.points[1].y, message.points[1].z);
            direction = p1.clone().negate().add(p2); // direction = p2 - p1;

            len = direction.length();
            headDiameter = message.scale.y;
            shaftDiameter = message.scale.x;

            if (message.scale.z !== 0.0) {
              headLength = message.scale.z;
            }
          } // add the marker


          this.add(new Arrow({
            direction: direction,
            origin: p1,
            length: len,
            headLength: headLength,
            shaftDiameter: shaftDiameter,
            headDiameter: headDiameter,
            material: colorMaterial
          }));
          break;

        case MARKER_CUBE:
          // set the cube dimensions
          var cubeGeom = new THREE.BoxGeometry(message.scale.x, message.scale.y, message.scale.z);
          this.add(new THREE.Mesh(cubeGeom, colorMaterial));
          break;

        case MARKER_SPHERE:
          // set the sphere dimensions
          var sphereGeom = new THREE.SphereGeometry(0.5);
          var sphereMesh = new THREE.Mesh(sphereGeom, colorMaterial);
          sphereMesh.scale.x = message.scale.x;
          sphereMesh.scale.y = message.scale.y;
          sphereMesh.scale.z = message.scale.z;
          this.add(sphereMesh);
          break;

        case MARKER_CYLINDER:
          // set the cylinder dimensions
          var cylinderGeom = new THREE.CylinderGeometry(0.5, 0.5, 1, 16, 1, false);
          var cylinderMesh = new THREE.Mesh(cylinderGeom, colorMaterial);
          cylinderMesh.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI * 0.5);
          cylinderMesh.scale.set(message.scale.x, message.scale.z, message.scale.y);
          this.add(cylinderMesh);
          break;

        case MARKER_LINE_STRIP:
          var lineStripGeom = new THREE.Geometry();
          var lineStripMaterial = new THREE.LineBasicMaterial({
            linewidth: message.scale.x
          }); // add the points

          var j;

          for (j = 0; j < message.points.length; j++) {
            var pt = new THREE.Vector3();
            pt.x = message.points[j].x;
            pt.y = message.points[j].y;
            pt.z = message.points[j].z;
            lineStripGeom.vertices.push(pt);
          } // determine the colors for each


          if (message.colors.length === message.points.length) {
            lineStripMaterial.vertexColors = true;

            for (j = 0; j < message.points.length; j++) {
              var clr = new THREE.Color();
              clr.setRGB(message.colors[j].r, message.colors[j].g, message.colors[j].b);
              lineStripGeom.colors.push(clr);
            }
          } else {
            lineStripMaterial.color.setRGB(message.color.r, message.color.g, message.color.b);
          } // add the line


          this.add(new THREE.Line(lineStripGeom, lineStripMaterial));
          break;

        case MARKER_LINE_LIST:
          var lineListGeom = new THREE.Geometry();
          var lineListMaterial = new THREE.LineBasicMaterial({
            linewidth: message.scale.x
          }); // add the points

          var k;

          for (k = 0; k < message.points.length; k++) {
            var v = new THREE.Vector3();
            v.x = message.points[k].x;
            v.y = message.points[k].y;
            v.z = message.points[k].z;
            lineListGeom.vertices.push(v);
          } // determine the colors for each


          if (message.colors.length === message.points.length) {
            lineListMaterial.vertexColors = true;

            for (k = 0; k < message.points.length; k++) {
              var c = new THREE.Color();
              c.setRGB(message.colors[k].r, message.colors[k].g, message.colors[k].b);
              lineListGeom.colors.push(c);
            }
          } else {
            lineListMaterial.color.setRGB(message.color.r, message.color.g, message.color.b);
          } // add the line


          this.add(new THREE.LineSegments(lineListGeom, lineListMaterial));
          break;

        case MARKER_CUBE_LIST:
          // holds the main object
          var object = new THREE.Object3D(); // check if custom colors should be used

          var numPoints = message.points.length;
          var createColors = numPoints === message.colors.length; // do not render giant lists

          var stepSize = Math.ceil(numPoints / 1250); // add the points

          var p, cube, curColor, newMesh;

          for (p = 0; p < numPoints; p += stepSize) {
            cube = new THREE.BoxGeometry(message.scale.x, message.scale.y, message.scale.z); // check the color

            if (createColors) {
              curColor = makeColorMaterial(message.colors[p].r, message.colors[p].g, message.colors[p].b, message.colors[p].a);
            } else {
              curColor = colorMaterial;
            }

            newMesh = new THREE.Mesh(cube, curColor);
            newMesh.position.x = message.points[p].x;
            newMesh.position.y = message.points[p].y;
            newMesh.position.z = message.points[p].z;
            object.add(newMesh);
          }

          this.add(object);
          break;

        case MARKER_SPHERE_LIST:
          // holds the main object
          var sphereObject = new THREE.Object3D(); // check if custom colors should be used

          var numSpherePoints = message.points.length;
          var createSphereColors = numSpherePoints === message.colors.length; // do not render giant lists

          var sphereStepSize = Math.ceil(numSpherePoints / 1250); // add the points

          var q, sphere, curSphereColor, newSphereMesh;

          for (q = 0; q < numSpherePoints; q += sphereStepSize) {
            sphere = new THREE.SphereGeometry(0.5, 8, 8); // check the color

            if (createSphereColors) {
              curSphereColor = makeColorMaterial(message.colors[q].r, message.colors[q].g, message.colors[q].b, message.colors[q].a);
            } else {
              curSphereColor = colorMaterial;
            }

            newSphereMesh = new THREE.Mesh(sphere, curSphereColor);
            newSphereMesh.scale.x = message.scale.x;
            newSphereMesh.scale.y = message.scale.y;
            newSphereMesh.scale.z = message.scale.z;
            newSphereMesh.position.x = message.points[q].x;
            newSphereMesh.position.y = message.points[q].y;
            newSphereMesh.position.z = message.points[q].z;
            sphereObject.add(newSphereMesh);
          }

          this.add(sphereObject);
          break;

        case MARKER_POINTS:
          // for now, use a particle system for the lists
          var geometry = new THREE.Geometry();
          var material = new THREE.PointsMaterial({
            size: message.scale.x
          }); // add the points

          var i;

          for (i = 0; i < message.points.length; i++) {
            var vertex = new THREE.Vector3();
            vertex.x = message.points[i].x;
            vertex.y = message.points[i].y;
            vertex.z = message.points[i].z;
            geometry.vertices.push(vertex);
          } // determine the colors for each


          if (message.colors.length === message.points.length) {
            material.vertexColors = true;

            for (i = 0; i < message.points.length; i++) {
              var color = new THREE.Color();
              color.setRGB(message.colors[i].r, message.colors[i].g, message.colors[i].b);
              geometry.colors.push(color);
            }
          } else {
            material.color.setRGB(message.color.r, message.color.g, message.color.b);
          } // add the particle system


          this.add(new THREE.Points(geometry, material));
          break;

        case MARKER_TEXT_VIEW_FACING:
          // only work on non-empty text
          if (message.text.length > 0) {
            // Use a THREE.Sprite to always be view-facing
            // ( code from http://stackoverflow.com/a/27348780 )
            var textColor = this.msgColor;
            var canvas = document.createElement('canvas');
            var context = canvas.getContext('2d');
            var textHeight = 100;
            var fontString = 'normal ' + textHeight + 'px sans-serif';
            context.font = fontString;
            var metrics = context.measureText(message.text);
            var textWidth = metrics.width;
            canvas.width = textWidth; // To account for overhang (like the letter 'g'), make the canvas bigger
            // The non-text portion is transparent anyway

            canvas.height = 1.5 * textHeight; // this does need to be set again

            context.font = fontString;
            context.fillStyle = 'rgba(' + Math.round(255 * textColor.r) + ', ' + Math.round(255 * textColor.g) + ', ' + Math.round(255 * textColor.b) + ', ' + textColor.a + ')';
            context.textAlign = 'left';
            context.textBaseline = 'middle';
            context.fillText(message.text, 0, canvas.height / 2);
            var texture = new THREE.Texture(canvas);
            texture.needsUpdate = true;
            var spriteMaterial = new THREE.SpriteMaterial({
              map: texture,
              // NOTE: This is needed for THREE.js r61, unused in r70
              useScreenCoordinates: false
            });
            var sprite = new THREE.Sprite(spriteMaterial);
            var textSize = message.scale.x;
            sprite.scale.set(textWidth / canvas.height * textSize, textSize, 1);
            this.add(sprite);
          }

          break;

        case MARKER_MESH_RESOURCE:
          // load and add the mesh
          var meshColorMaterial = null;

          if (message.color.r !== 0 || message.color.g !== 0 || message.color.b !== 0 || message.color.a !== 0) {
            meshColorMaterial = colorMaterial;
          }

          this.msgMesh = message.mesh_resource.substr(10);
          var meshResource = new MeshResource({
            path: path,
            resource: this.msgMesh,
            material: meshColorMaterial
          });
          this.add(meshResource);
          break;

        case MARKER_TRIANGLE_LIST:
          // create the list of triangles
          var tri = new TriangleList({
            material: colorMaterial,
            vertices: message.points,
            colors: message.colors
          });
          tri.scale.set(message.scale.x, message.scale.y, message.scale.z);
          this.add(tri);
          break;

        default:
          console.error('Currently unsupported marker type: ' + message.type);
          break;
      }
    }

    /**
     * Set the pose of this marker to the given values.
     *
     * @param pose - the pose to set for this marker
     */
    setPose(pose) {
      // set position information
      this.position.x = pose.position.x;
      this.position.y = pose.position.y;
      this.position.z = pose.position.z; // set the rotation

      this.quaternion.set(pose.orientation.x, pose.orientation.y, pose.orientation.z, pose.orientation.w);
      this.quaternion.normalize(); // update the world

      this.updateMatrixWorld();
    }

    /**
     * Update this marker.
     *
     * @param message - the marker message
     * @return true on success otherwhise false is returned
     */
    update(message) {
      // set the pose and get the color
      this.setPose(message.pose); // Update color

      if (message.color.r !== this.msgColor.r || message.color.g !== this.msgColor.g || message.color.b !== this.msgColor.b || message.color.a !== this.msgColor.a) {
        var colorMaterial = makeColorMaterial(message.color.r, message.color.g, message.color.b, message.color.a);

        switch (message.type) {
          case MARKER_LINE_STRIP:
          case MARKER_LINE_LIST:
          case MARKER_POINTS:
            break;

          case MARKER_ARROW:
          case MARKER_CUBE:
          case MARKER_SPHERE:
          case MARKER_CYLINDER:
          case MARKER_TRIANGLE_LIST:
          case MARKER_TEXT_VIEW_FACING:
            this.traverse(function (child) {
              if (child instanceof THREE.Mesh) {
                child.material = colorMaterial;
              }
            });
            break;

          case MARKER_MESH_RESOURCE:
            var meshColorMaterial = null;

            if (message.color.r !== 0 || message.color.g !== 0 || message.color.b !== 0 || message.color.a !== 0) {
              meshColorMaterial = this.colorMaterial;
            }

            this.traverse(function (child) {
              if (child instanceof THREE.Mesh) {
                child.material = meshColorMaterial;
              }
            });
            break;

          case MARKER_CUBE_LIST:
          case MARKER_SPHERE_LIST:
            // TODO Support to update color for MARKER_CUBE_LIST & MARKER_SPHERE_LIST
            return false;

          default:
            return false;
        }

        this.msgColor = message.color;
      } // Update geometry


      var scaleChanged = Math.abs(this.msgScale[0] - message.scale.x) > 1.0e-6 || Math.abs(this.msgScale[1] - message.scale.y) > 1.0e-6 || Math.abs(this.msgScale[2] - message.scale.z) > 1.0e-6;
      this.msgScale = [message.scale.x, message.scale.y, message.scale.z];

      switch (message.type) {
        case MARKER_CUBE:
        case MARKER_SPHERE:
        case MARKER_CYLINDER:
          if (scaleChanged) {
            return false;
          }

          break;

        case MARKER_TEXT_VIEW_FACING:
          if (scaleChanged || this.text !== message.text) {
            return false;
          }

          break;

        case MARKER_MESH_RESOURCE:
          var meshResource = message.mesh_resource.substr(10);

          if (meshResource !== this.msgMesh) {
            return false;
          }

          if (scaleChanged) {
            return false;
          }

          break;

        case MARKER_ARROW:
        case MARKER_LINE_STRIP:
        case MARKER_LINE_LIST:
        case MARKER_CUBE_LIST:
        case MARKER_SPHERE_LIST:
        case MARKER_POINTS:
        case MARKER_TRIANGLE_LIST:
          // TODO: Check if geometry changed
          return false;
      }

      return true;
    }

    /*
     * Free memory of elements in this marker.
     */
    dispose() {
      this.children.forEach(function (element) {
        if (element instanceof MeshResource) {
          element.children.forEach(function (scene) {
            if (scene.material !== undefined) {
              scene.material.dispose();
            }

            scene.children.forEach(function (mesh) {
              if (mesh.geometry !== undefined) {
                mesh.geometry.dispose();
              }

              if (mesh.material !== undefined) {
                mesh.material.dispose();
              }

              scene.remove(mesh);
            });
            element.remove(scene);
          });
        } else {
          if (element.geometry !== undefined) {
            element.geometry.dispose();
          }

          if (element.material !== undefined) {
            element.material.dispose();
          }
        }

        element.parent.remove(element);
      });
    }

  }
  /**
   * @fileOverview
   * @author David Gossow - dgossow@willowgarage.com
   */


  class InteractiveMarkerControl extends THREE.Object3D {
    /**
     * The main marker control object for an interactive marker.
     *
     * @constructor
     * @param options - object with following keys:
     *
     *  * parent - the parent of this control
     *  * message - the interactive marker control message
     *  * camera - the main camera associated with the viewer for this marker client
     *  * path (optional) - the base path to any meshes that will be loaded
     *  * loader (optional) - the Collada loader to use (e.g., an instance of ROS3D.COLLADA_LOADER)
     */
    constructor(options) {
      super();
      var that = this;
      options = options || {};
      this.parent = options.parent;
      var handle = options.handle;
      var message = options.message;
      this.message = message;
      this.name = message.name;
      this.camera = options.camera;
      this.path = options.path || '/';
      this.loader = options.loader;
      this.dragging = false;
      this.startMousePos = new THREE.Vector2();
      this.isShift = false; // orientation for the control

      var controlOri = new THREE.Quaternion(message.orientation.x, message.orientation.y, message.orientation.z, message.orientation.w);
      controlOri.normalize(); // transform x axis into local frame

      var controlAxis = new THREE.Vector3(1, 0, 0);
      controlAxis.applyQuaternion(controlOri);
      this.currentControlOri = new THREE.Quaternion(); // determine mouse interaction

      switch (message.interaction_mode) {
        case INTERACTIVE_MARKER_MOVE_ROTATE_3D:
        case INTERACTIVE_MARKER_MOVE_3D:
          this.addEventListener('mousemove', this.parent.move3d.bind(this.parent, this, controlAxis));
          break;

        case INTERACTIVE_MARKER_MOVE_AXIS:
          this.addEventListener('mousemove', this.parent.moveAxis.bind(this.parent, this, controlAxis));
          this.addEventListener('touchmove', this.parent.moveAxis.bind(this.parent, this, controlAxis));
          break;

        case INTERACTIVE_MARKER_ROTATE_AXIS:
          this.addEventListener('mousemove', this.parent.rotateAxis.bind(this.parent, this, controlOri));
          break;

        case INTERACTIVE_MARKER_MOVE_PLANE:
          this.addEventListener('mousemove', this.parent.movePlane.bind(this.parent, this, controlAxis));
          break;

        case INTERACTIVE_MARKER_BUTTON:
          this.addEventListener('click', this.parent.buttonClick.bind(this.parent, this));
          break;
      }
      /**
       * Install default listeners for highlighting / dragging.
       *
       * @param event - the event to stop
       */


      function stopPropagation(event) {
        event.stopPropagation();
      } // check the mode


      if (message.interaction_mode !== INTERACTIVE_MARKER_NONE) {
        this.addEventListener('mousedown', this.parent.startDrag.bind(this.parent, this));
        this.addEventListener('mouseup', this.parent.stopDrag.bind(this.parent, this));
        this.addEventListener('contextmenu', this.parent.showMenu.bind(this.parent, this));
        this.addEventListener('mouseup', function (event3d) {
          if (that.startMousePos.distanceToSquared(event3d.mousePos) === 0) {
            event3d.type = 'contextmenu';
            that.dispatchEvent(event3d);
          }
        });
        this.addEventListener('mouseover', stopPropagation);
        this.addEventListener('mouseout', stopPropagation);
        this.addEventListener('click', stopPropagation);
        this.addEventListener('mousedown', function (event3d) {
          that.startMousePos = event3d.mousePos;
        }); // touch support

        this.addEventListener('touchstart', function (event3d) {
          if (event3d.domEvent.touches.length === 1) {
            event3d.type = 'mousedown';
            event3d.domEvent.button = 0;
            that.dispatchEvent(event3d);
          }
        });
        this.addEventListener('touchmove', function (event3d) {
          if (event3d.domEvent.touches.length === 1) {
            event3d.type = 'mousemove';
            event3d.domEvent.button = 0;
            that.dispatchEvent(event3d);
          }
        });
        this.addEventListener('touchend', function (event3d) {
          if (event3d.domEvent.touches.length === 0) {
            event3d.domEvent.button = 0;
            event3d.type = 'mouseup';
            that.dispatchEvent(event3d);
            event3d.type = 'click';
            that.dispatchEvent(event3d);
          }
        });
        window.addEventListener('keydown', function (event) {
          if (event.keyCode === 16) {
            that.isShift = true;
          }
        });
        window.addEventListener('keyup', function (event) {
          if (event.keyCode === 16) {
            that.isShift = false;
          }
        });
      } // rotation behavior


      var rotInv = new THREE.Quaternion();
      var posInv = this.parent.position.clone().multiplyScalar(-1);

      switch (message.orientation_mode) {
        case INTERACTIVE_MARKER_INHERIT:
          rotInv = this.parent.quaternion.clone().inverse();
          break;

        case INTERACTIVE_MARKER_FIXED:
          break;

        case INTERACTIVE_MARKER_VIEW_FACING:
          break;

        default:
          console.error('Unkown orientation mode: ' + message.orientation_mode);
          break;
      } // temporary TFClient to get transformations from InteractiveMarker
      // frame to potential child Marker frames


      var localTfClient = new ROSLIB__namespace.TFClient({
        ros: handle.tfClient.ros,
        fixedFrame: handle.message.header.frame_id,
        serverName: handle.tfClient.serverName
      }); // create visuals (markers)

      message.markers.forEach(function (markerMsg) {
        var addMarker = function (transformMsg) {
          var markerHelper = new Marker({
            message: markerMsg,
            path: that.path,
            loader: that.loader
          }); // if transformMsg isn't null, this was called by TFClient

          if (transformMsg !== null) {
            // get the current pose as a ROSLIB.Pose...
            var newPose = new ROSLIB__namespace.Pose({
              position: markerHelper.position,
              orientation: markerHelper.quaternion
            }); // so we can apply the transform provided by the TFClient

            newPose.applyTransform(new ROSLIB__namespace.Transform(transformMsg)); // get transform between parent marker's location and its frame
            // apply it to sub-marker position to get sub-marker position
            // relative to parent marker

            var transformMarker = new Marker({
              message: markerMsg,
              path: that.path,
              loader: that.loader
            });
            transformMarker.position.add(posInv);
            transformMarker.position.applyQuaternion(rotInv);
            transformMarker.quaternion.multiplyQuaternions(rotInv, transformMarker.quaternion);
            var translation = new THREE.Vector3(transformMarker.position.x, transformMarker.position.y, transformMarker.position.z);
            var transform = new ROSLIB__namespace.Transform({
              translation: translation,
              orientation: transformMarker.quaternion
            }); // apply that transform too

            newPose.applyTransform(transform);
            markerHelper.setPose(newPose);
            markerHelper.updateMatrixWorld(); // we only need to set the pose once - at least, this is what RViz seems to be doing, might change in the future

            localTfClient.unsubscribe(markerMsg.header.frame_id);
          } // add the marker


          that.add(markerHelper);
        }; // If the marker is not relative to the parent marker's position,
        // ask the *local* TFClient for the transformation from the
        // InteractiveMarker frame to the sub-Marker frame


        if (markerMsg.header.frame_id !== '') {
          localTfClient.subscribe(markerMsg.header.frame_id, addMarker);
        } // If not, just add the marker without changing its pose
        else {
            addMarker(null);
          }
      });
    }

    updateMatrixWorld(force) {
      var that = this;
      var message = this.message;

      switch (message.orientation_mode) {
        case INTERACTIVE_MARKER_INHERIT:
          super.updateMatrixWorld(force);
          that.currentControlOri.copy(that.quaternion);
          that.currentControlOri.normalize();
          break;

        case INTERACTIVE_MARKER_FIXED:
          that.quaternion.copy(that.parent.quaternion.clone().inverse());
          that.updateMatrix();
          that.matrixWorldNeedsUpdate = true;
          super.updateMatrixWorld(force);
          that.currentControlOri.copy(that.quaternion);
          break;

        case INTERACTIVE_MARKER_VIEW_FACING:
          that.camera.updateMatrixWorld();
          var cameraRot = new THREE.Matrix4().extractRotation(that.camera.matrixWorld);
          var ros2Gl = new THREE.Matrix4();
          var r90 = Math.PI * 0.5;
          var rv = new THREE.Euler(-r90, 0, r90);
          ros2Gl.makeRotationFromEuler(rv);
          var worldToLocal = new THREE.Matrix4();
          worldToLocal.getInverse(that.parent.matrixWorld);
          cameraRot.multiplyMatrices(cameraRot, ros2Gl);
          cameraRot.multiplyMatrices(worldToLocal, cameraRot);
          that.currentControlOri.setFromRotationMatrix(cameraRot); // check the orientation

          if (!message.independent_marker_orientation) {
            that.quaternion.copy(that.currentControlOri);
            that.updateMatrix();
            that.matrixWorldNeedsUpdate = true;
          }

          super.updateMatrixWorld(force);
          break;

        default:
          console.error('Unkown orientation mode: ' + message.orientation_mode);
          break;
      }
    }

  }
  /**
   * @fileOverview
   * @author David Gossow - dgossow@willowgarage.com
   */


  class InteractiveMarkerMenu extends THREE.EventDispatcher {
    /**
     * A menu for an interactive marker. This will be overlayed on the canvas.
     *
     * @constructor
     * @param options - object with following keys:
     *
     *  * menuEntries - the menu entries to add
     *  * className (optional) - a custom CSS class for the menu div
     *  * entryClassName (optional) - a custom CSS class for the menu entry
     *  * overlayClassName (optional) - a custom CSS class for the menu overlay
     *  * menuFontSize (optional) - the menu font size
     */
    constructor(options) {
      super();
      var that = this;
      options = options || {};
      var menuEntries = options.menuEntries;
      var className = options.className || 'default-interactive-marker-menu';
      options.entryClassName || 'default-interactive-marker-menu-entry';
      var overlayClassName = options.overlayClassName || 'default-interactive-marker-overlay';
      var menuFontSize = options.menuFontSize || '0.8em'; // holds the menu tree

      var allMenus = [];
      allMenus[0] = {
        children: []
      }; // create the CSS for this marker if it has not been created

      if (document.getElementById('default-interactive-marker-menu-css') === null) {
        var style = document.createElement('style');
        style.id = 'default-interactive-marker-menu-css';
        style.type = 'text/css';
        style.innerHTML = '.default-interactive-marker-menu {' + 'background-color: #444444;' + 'border: 1px solid #888888;' + 'border: 1px solid #888888;' + 'padding: 0px 0px 0px 0px;' + 'color: #FFFFFF;' + 'font-family: sans-serif;' + 'font-size: ' + menuFontSize + ';' + 'z-index: 1002;' + '}' + '.default-interactive-marker-menu ul {' + 'padding: 0px 0px 5px 0px;' + 'margin: 0px;' + 'list-style-type: none;' + '}' + '.default-interactive-marker-menu ul li div {' + '-webkit-touch-callout: none;' + '-webkit-user-select: none;' + '-khtml-user-select: none;' + '-moz-user-select: none;' + '-ms-user-select: none;' + 'user-select: none;' + 'cursor: default;' + 'padding: 3px 10px 3px 10px;' + '}' + '.default-interactive-marker-menu-entry:hover {' + '  background-color: #666666;' + '  cursor: pointer;' + '}' + '.default-interactive-marker-menu ul ul {' + '  font-style: italic;' + '  padding-left: 10px;' + '}' + '.default-interactive-marker-overlay {' + '  position: absolute;' + '  top: 0%;' + '  left: 0%;' + '  width: 100%;' + '  height: 100%;' + '  background-color: black;' + '  z-index: 1001;' + '  -moz-opacity: 0.0;' + '  opacity: .0;' + '  filter: alpha(opacity = 0);' + '}';
        document.getElementsByTagName('head')[0].appendChild(style);
      } // place the menu in a div


      this.menuDomElem = document.createElement('div');
      this.menuDomElem.style.position = 'absolute';
      this.menuDomElem.className = className;
      this.menuDomElem.addEventListener('contextmenu', function (event) {
        event.preventDefault();
      }); // create the overlay DOM

      this.overlayDomElem = document.createElement('div');
      this.overlayDomElem.className = overlayClassName;
      this.hideListener = this.hide.bind(this);
      this.overlayDomElem.addEventListener('contextmenu', this.hideListener);
      this.overlayDomElem.addEventListener('click', this.hideListener);
      this.overlayDomElem.addEventListener('touchstart', this.hideListener); // parse all entries and link children to parents

      var i, entry, id;

      for (i = 0; i < menuEntries.length; i++) {
        entry = menuEntries[i];
        id = entry.id;
        allMenus[id] = {
          title: entry.title,
          id: id,
          children: []
        };
      }

      for (i = 0; i < menuEntries.length; i++) {
        entry = menuEntries[i];
        id = entry.id;
        var menu = allMenus[id];
        var parent = allMenus[entry.parent_id];
        parent.children.push(menu);
      }

      function emitMenuSelect(menuEntry, domEvent) {
        this.dispatchEvent({
          type: 'menu-select',
          domEvent: domEvent,
          id: menuEntry.id,
          controlName: this.controlName
        });
        this.hide(domEvent);
      }
      /**
       * Create the HTML UL element for the menu and link it to the parent.
       *
       * @param parentDomElem - the parent DOM element
       * @param parentMenu - the parent menu
       */


      function makeUl(parentDomElem, parentMenu) {
        var ulElem = document.createElement('ul');
        parentDomElem.appendChild(ulElem);
        var children = parentMenu.children;

        for (var i = 0; i < children.length; i++) {
          var liElem = document.createElement('li');
          var divElem = document.createElement('div');
          divElem.appendChild(document.createTextNode(children[i].title));
          ulElem.appendChild(liElem);
          liElem.appendChild(divElem);

          if (children[i].children.length > 0) {
            makeUl(liElem, children[i]);
            divElem.addEventListener('click', that.hide.bind(that));
            divElem.addEventListener('touchstart', that.hide.bind(that));
          } else {
            divElem.addEventListener('click', emitMenuSelect.bind(that, children[i]));
            divElem.addEventListener('touchstart', emitMenuSelect.bind(that, children[i]));
            divElem.className = 'default-interactive-marker-menu-entry';
          }
        }
      } // construct DOM element


      makeUl(this.menuDomElem, allMenus[0]);
    }

    /**
     * Shoe the menu DOM element.
     *
     * @param control - the control for the menu
     * @param event - the event that caused this
     */
    show(control, event) {
      if (event && event.preventDefault) {
        event.preventDefault();
      }

      this.controlName = control.name; // position it on the click

      if (event.domEvent.changedTouches !== undefined) {
        // touch click
        this.menuDomElem.style.left = event.domEvent.changedTouches[0].pageX + 'px';
        this.menuDomElem.style.top = event.domEvent.changedTouches[0].pageY + 'px';
      } else {
        // mouse click
        this.menuDomElem.style.left = event.domEvent.clientX + 'px';
        this.menuDomElem.style.top = event.domEvent.clientY + 'px';
      }

      document.body.appendChild(this.overlayDomElem);
      document.body.appendChild(this.menuDomElem);
    }

    /**
     * Hide the menu DOM element.
     *
     * @param event (optional) - the event that caused this
     */
    hide(event) {
      if (event && event.preventDefault) {
        event.preventDefault();
      }

      document.body.removeChild(this.overlayDomElem);
      document.body.removeChild(this.menuDomElem);
    }

  }
  /**
   * @fileOverview
   * @author David Gossow - dgossow@willowgarage.com
   */


  class InteractiveMarker extends THREE.Object3D {
    /**
     * The main interactive marker object.
     *
     * @constructor
     * @param options - object with following keys:
     *
     *  * handle - the ROS3D.InteractiveMarkerHandle for this marker
     *  * camera - the main camera associated with the viewer for this marker
     *  * path (optional) - the base path to any meshes that will be loaded
     *  * loader (optional) - the Collada loader to use (e.g., an instance of ROS3D.COLLADA_LOADER)
     */
    constructor(options) {
      super();
      var that = this;
      options = options || {};
      var handle = options.handle;
      this.name = handle.name;
      var camera = options.camera;
      var path = options.path || '/';
      var loader = options.loader;
      this.dragging = false; // set the initial pose

      this.onServerSetPose({
        pose: handle.pose
      }); // information on where the drag started

      this.dragStart = {
        position: new THREE.Vector3(),
        orientation: new THREE.Quaternion(),
        positionWorld: new THREE.Vector3(),
        orientationWorld: new THREE.Quaternion(),
        event3d: {}
      }; // add each control message

      handle.controls.forEach(function (controlMessage) {
        that.add(new InteractiveMarkerControl({
          parent: that,
          handle: handle,
          message: controlMessage,
          camera: camera,
          path: path,
          loader: loader
        }));
      }); // check for any menus

      if (handle.menuEntries.length > 0) {
        this.menu = new InteractiveMarkerMenu({
          menuEntries: handle.menuEntries,
          menuFontSize: handle.menuFontSize
        }); // forward menu select events

        this.menu.addEventListener('menu-select', function (event) {
          that.dispatchEvent(event);
        });
      }
    }

    /**
     * Show the interactive marker menu associated with this marker.
     *
     * @param control - the control to use
     * @param event - the event that caused this
     */
    showMenu(control, event) {
      if (this.menu) {
        this.menu.show(control, event);
      }
    }

    /**
     * Move the axis based on the given event information.
     *
     * @param control - the control to use
     * @param origAxis - the origin of the axis
     * @param event3d - the event that caused this
     */
    moveAxis(control, origAxis, event3d) {
      if (this.dragging) {
        var currentControlOri = control.currentControlOri;
        var axis = origAxis.clone().applyQuaternion(currentControlOri); // get move axis in world coords

        var originWorld = this.dragStart.event3d.intersection.point;
        var axisWorld = axis.clone().applyQuaternion(this.dragStart.orientationWorld.clone());
        var axisRay = new THREE.Ray(originWorld, axisWorld); // find closest point to mouse on axis

        var t = closestAxisPoint(axisRay, event3d.camera, event3d.mousePos); // offset from drag start position

        var p = new THREE.Vector3();
        p.addVectors(this.dragStart.position, axis.clone().applyQuaternion(this.dragStart.orientation).multiplyScalar(t));
        this.setPosition(control, p);
        event3d.stopPropagation();
      }
    }

    /**
     * Move with respect to the plane based on the contorl and event.
     *
     * @param control - the control to use
     * @param origNormal - the normal of the origin
     * @param event3d - the event that caused this
     */
    move3d(control, origNormal, event3d) {
      // by default, move in a plane
      if (this.dragging) {
        if (control.isShift) ;else {
          // we want to use the origin plane that is closest to the camera
          var cameraVector = control.camera.getWorldDirection();
          var x = Math.abs(cameraVector.x);
          var y = Math.abs(cameraVector.y);
          var z = Math.abs(cameraVector.z);
          var controlOri = new THREE.Quaternion(1, 0, 0, 1);

          if (y > x && y > z) {
            // orientation for the control
            controlOri = new THREE.Quaternion(0, 0, 1, 1);
          } else if (z > x && z > y) {
            // orientation for the control
            controlOri = new THREE.Quaternion(0, 1, 0, 1);
          }

          controlOri.normalize(); // transform x axis into local frame

          origNormal = new THREE.Vector3(1, 0, 0);
          origNormal.applyQuaternion(controlOri);
          this.movePlane(control, origNormal, event3d);
        }
      }
    }

    /**
     * Move with respect to the plane based on the contorl and event.
     *
     * @param control - the control to use
     * @param origNormal - the normal of the origin
     * @param event3d - the event that caused this
     */
    movePlane(control, origNormal, event3d) {
      if (this.dragging) {
        var currentControlOri = control.currentControlOri;
        var normal = origNormal.clone().applyQuaternion(currentControlOri); // get plane params in world coords

        var originWorld = this.dragStart.event3d.intersection.point;
        var normalWorld = normal.clone().applyQuaternion(this.dragStart.orientationWorld); // intersect mouse ray with plane

        var intersection = intersectPlane(event3d.mouseRay, originWorld, normalWorld); // offset from drag start position

        var p = new THREE.Vector3();
        p.subVectors(intersection, originWorld);
        p.add(this.dragStart.positionWorld);
        this.setPosition(control, p);
        event3d.stopPropagation();
      }
    }

    /**
     * Rotate based on the control and event given.
     *
     * @param control - the control to use
     * @param origOrientation - the orientation of the origin
     * @param event3d - the event that caused this
     */
    rotateAxis(control, origOrientation, event3d) {
      if (this.dragging) {
        control.updateMatrixWorld();
        var currentControlOri = control.currentControlOri;
        var orientation = currentControlOri.clone().multiply(origOrientation.clone());
        var normal = new THREE.Vector3(1, 0, 0).applyQuaternion(orientation); // get plane params in world coords

        var originWorld = this.dragStart.event3d.intersection.point;
        var normalWorld = normal.applyQuaternion(this.dragStart.orientationWorld); // intersect mouse ray with plane

        var intersection = intersectPlane(event3d.mouseRay, originWorld, normalWorld); // offset local origin to lie on intersection plane

        var normalRay = new THREE.Ray(this.dragStart.positionWorld, normalWorld);
        var rotOrigin = intersectPlane(normalRay, originWorld, normalWorld); // rotates from world to plane coords

        var orientationWorld = this.dragStart.orientationWorld.clone().multiply(orientation);
        var orientationWorldInv = orientationWorld.clone().inverse(); // rotate original and current intersection into local coords

        intersection.sub(rotOrigin);
        intersection.applyQuaternion(orientationWorldInv);
        var origIntersection = this.dragStart.event3d.intersection.point.clone();
        origIntersection.sub(rotOrigin);
        origIntersection.applyQuaternion(orientationWorldInv); // compute relative 2d angle

        var a1 = Math.atan2(intersection.y, intersection.z);
        var a2 = Math.atan2(origIntersection.y, origIntersection.z);
        var a = a2 - a1;
        var rot = new THREE.Quaternion();
        rot.setFromAxisAngle(normal, a); // rotate

        this.setOrientation(control, rot.multiply(this.dragStart.orientationWorld)); // offset from drag start position

        event3d.stopPropagation();
      }
    }

    /**
     * Dispatch the given event type.
     *
     * @param type - the type of event
     * @param control - the control to use
     */
    feedbackEvent(type, control) {
      this.dispatchEvent({
        type: type,
        position: this.position.clone(),
        orientation: this.quaternion.clone(),
        controlName: control.name
      });
    }

    /**
     * Start a drag action.
     *
     * @param control - the control to use
     * @param event3d - the event that caused this
     */
    startDrag(control, event3d) {
      if (event3d.domEvent.button === 0) {
        event3d.stopPropagation();
        this.dragging = true;
        this.updateMatrixWorld(true);
        var scale = new THREE.Vector3();
        this.matrixWorld.decompose(this.dragStart.positionWorld, this.dragStart.orientationWorld, scale);
        this.dragStart.position = this.position.clone();
        this.dragStart.orientation = this.quaternion.clone();
        this.dragStart.event3d = event3d;
        this.feedbackEvent('user-mousedown', control);
      }
    }

    /**
     * Stop a drag action.
     *
     * @param control - the control to use
     * @param event3d - the event that caused this
     */
    stopDrag(control, event3d) {
      if (event3d.domEvent.button === 0) {
        event3d.stopPropagation();
        this.dragging = false;
        this.dragStart.event3d = {};
        this.onServerSetPose(this.bufferedPoseEvent);
        this.bufferedPoseEvent = undefined;
        this.feedbackEvent('user-mouseup', control);
      }
    }

    /**
     * Handle a button click.
     *
     * @param control - the control to use
     * @param event3d - the event that caused this
     */
    buttonClick(control, event3d) {
      event3d.stopPropagation();
      this.feedbackEvent('user-button-click', control);
    }

    /**
     * Handle a user pose change for the position.
     *
     * @param control - the control to use
     * @param event3d - the event that caused this
     */
    setPosition(control, position) {
      this.position.copy(position);
      this.feedbackEvent('user-pose-change', control);
    }

    /**
     * Handle a user pose change for the orientation.
     *
     * @param control - the control to use
     * @param event3d - the event that caused this
     */
    setOrientation(control, orientation) {
      orientation.normalize();
      this.quaternion.copy(orientation);
      this.feedbackEvent('user-pose-change', control);
    }

    /**
     * Update the marker based when the pose is set from the server.
     *
     * @param event - the event that caused this
     */
    onServerSetPose(event) {
      if (event !== undefined) {
        // don't update while dragging
        if (this.dragging) {
          this.bufferedPoseEvent = event;
        } else {
          var pose = event.pose;
          this.position.copy(pose.position);
          this.quaternion.copy(pose.orientation);
          this.updateMatrixWorld(true);
        }
      }
    }

    /**
     * Free memory of elements in this marker.
     */
    dispose() {
      var that = this;
      this.children.forEach(function (intMarkerControl) {
        intMarkerControl.children.forEach(function (marker) {
          marker.dispose();
          intMarkerControl.remove(marker);
        });
        that.remove(intMarkerControl);
      });
    }

  }
  /**
   * @fileOverview
   * @author David Gossow - dgossow@willowgarage.com
   */


  class InteractiveMarkerHandle extends EventEmitter2__default["default"] {
    /**
     * Handle with signals for a single interactive marker.
     *
     * Emits the following events:
     *
     *  * 'pose' - emitted when a new pose comes from the server
     *
     * @constructor
     * @param options - object with following keys:
     *
     *  * message - the interactive marker message
     *  * feedbackTopic - the ROSLIB.Topic associated with the feedback
     *  * tfClient - a handle to the TF client to use
     *  * menuFontSize (optional) - the menu font size
     */
    constructor(options) {
      super();
      options = options || {};
      this.message = options.message;
      this.feedbackTopic = options.feedbackTopic;
      this.tfClient = options.tfClient;
      this.menuFontSize = options.menuFontSize || '0.8em';
      this.name = this.message.name;
      this.header = this.message.header;
      this.controls = this.message.controls;
      this.menuEntries = this.message.menu_entries;
      this.dragging = false;
      this.timeoutHandle = null;
      this.tfTransform = new ROSLIB__namespace.Transform();
      this.pose = new ROSLIB__namespace.Pose();
      this.setPoseFromClientBound = this.setPoseFromClient.bind(this);
      this.onMouseDownBound = this.onMouseDown.bind(this);
      this.onMouseUpBound = this.onMouseUp.bind(this);
      this.onButtonClickBound = this.onButtonClick.bind(this);
      this.onMenuSelectBound = this.onMenuSelect.bind(this); // start by setting the pose

      this.setPoseFromServer(this.message.pose);
      this.tfUpdateBound = this.tfUpdate.bind(this);
    }

    /**
     * Subscribe to the TF associated with this interactive marker.
     */
    subscribeTf() {
      // subscribe to tf updates if frame-fixed
      if (this.message.header.stamp.secs === 0.0 && this.message.header.stamp.nsecs === 0.0) {
        this.tfClient.subscribe(this.message.header.frame_id, this.tfUpdateBound);
      }
    }

    unsubscribeTf() {
      this.tfClient.unsubscribe(this.message.header.frame_id, this.tfUpdateBound);
    }

    /**
     * Emit the new pose that has come from the server.
     */
    emitServerPoseUpdate() {
      var poseTransformed = new ROSLIB__namespace.Pose(this.pose);
      poseTransformed.applyTransform(this.tfTransform);
      this.emit('pose', poseTransformed);
    }

    /**
     * Update the pose based on the pose given by the server.
     *
     * @param poseMsg - the pose given by the server
     */
    setPoseFromServer(poseMsg) {
      this.pose = new ROSLIB__namespace.Pose(poseMsg);
      this.emitServerPoseUpdate();
    }

    /**
     * Update the pose based on the TF given by the server.
     *
     * @param transformMsg - the TF given by the server
     */
    tfUpdate(transformMsg) {
      this.tfTransform = new ROSLIB__namespace.Transform(transformMsg);
      this.emitServerPoseUpdate();
    }

    /**
     * Set the pose from the client based on the given event.
     *
     * @param event - the event to base the change off of
     */
    setPoseFromClient(event) {
      // apply the transform
      this.pose = new ROSLIB__namespace.Pose(event);
      var inv = this.tfTransform.clone();
      inv.rotation.invert();
      inv.translation.multiplyQuaternion(inv.rotation);
      inv.translation.x *= -1;
      inv.translation.y *= -1;
      inv.translation.z *= -1;
      this.pose.applyTransform(inv); // send feedback to the server

      this.sendFeedback(INTERACTIVE_MARKER_POSE_UPDATE, undefined, 0, event.controlName); // keep sending pose feedback until the mouse goes up

      if (this.dragging) {
        if (this.timeoutHandle) {
          clearTimeout(this.timeoutHandle);
        }

        this.timeoutHandle = setTimeout(this.setPoseFromClient.bind(this, event), 250);
      }
    }

    /**
     * Send the button click feedback to the server.
     *
     * @param event - the event associated with the button click
     */
    onButtonClick(event) {
      this.sendFeedback(INTERACTIVE_MARKER_BUTTON_CLICK, event.clickPosition, 0, event.controlName);
    }

    /**
     * Send the mousedown feedback to the server.
     *
     * @param event - the event associated with the mousedown
     */
    onMouseDown(event) {
      this.sendFeedback(INTERACTIVE_MARKER_MOUSE_DOWN, event.clickPosition, 0, event.controlName);
      this.dragging = true;
    }

    /**
     * Send the mouseup feedback to the server.
     *
     * @param event - the event associated with the mouseup
     */
    onMouseUp(event) {
      this.sendFeedback(INTERACTIVE_MARKER_MOUSE_UP, event.clickPosition, 0, event.controlName);
      this.dragging = false;

      if (this.timeoutHandle) {
        clearTimeout(this.timeoutHandle);
      }
    }

    /**
     * Send the menu select feedback to the server.
     *
     * @param event - the event associated with the menu select
     */
    onMenuSelect(event) {
      this.sendFeedback(INTERACTIVE_MARKER_MENU_SELECT, undefined, event.id, event.controlName);
    }

    /**
     * Send feedback to the interactive marker server.
     *
     * @param eventType - the type of event that happened
     * @param clickPosition (optional) - the position in ROS space the click happened
     * @param menuEntryID (optional) - the menu entry ID that is associated
     * @param controlName - the name of the control
     */
    sendFeedback(eventType, clickPosition, menuEntryID, controlName) {
      // check for the click position
      var mousePointValid = clickPosition !== undefined;
      clickPosition = clickPosition || {
        x: 0,
        y: 0,
        z: 0
      };
      var feedback = {
        header: this.header,
        client_id: this.clientID,
        marker_name: this.name,
        control_name: controlName,
        event_type: eventType,
        pose: this.pose,
        mouse_point: clickPosition,
        mouse_point_valid: mousePointValid,
        menu_entry_id: menuEntryID
      };
      this.feedbackTopic.publish(feedback);
    }

  }
  /**
   * @fileOverview
   * @author David Gossow - dgossow@willowgarage.com
   */


  class InteractiveMarkerClient {
    /**
     * A client for an interactive marker topic.
     *
     * @constructor
     * @param options - object with following keys:
     *
     *  * ros - a handle to the ROS connection
     *  * tfClient - a handle to the TF client
     *  * topic (optional) - the topic to subscribe to, like '/basic_controls', if not provided use subscribe() to start message receiving
     *  * path (optional) - the base path to any meshes that will be loaded
     *  * camera - the main camera associated with the viewer for this marker client
     *  * rootObject (optional) - the root THREE 3D object to render to
     *  * loader (optional) - the Collada loader to use (e.g., an instance of ROS3D.COLLADA_LOADER)
     *  * menuFontSize (optional) - the menu font size
     */
    constructor(options) {
      options = options || {};
      this.ros = options.ros;
      this.tfClient = options.tfClient;
      this.topicName = options.topic;
      this.path = options.path || '/';
      this.camera = options.camera;
      this.rootObject = options.rootObject || new THREE.Object3D();
      this.loader = options.loader;
      this.menuFontSize = options.menuFontSize || '0.8em';
      this.interactiveMarkers = {};
      this.updateTopic = null;
      this.feedbackTopic = null; // check for an initial topic

      if (this.topicName) {
        this.subscribe(this.topicName);
      }
    }

    /**
     * Subscribe to the given interactive marker topic. This will unsubscribe from any current topics.
     *
     * @param topic - the topic to subscribe to, like '/basic_controls'
     */
    subscribe(topic) {
      // unsubscribe to the other topics
      this.unsubscribe();
      this.updateTopic = new ROSLIB__namespace.Topic({
        ros: this.ros,
        name: topic + '/tunneled/update',
        messageType: 'visualization_msgs/InteractiveMarkerUpdate',
        compression: 'png'
      });
      this.updateTopic.subscribe(this.processUpdate.bind(this));
      this.feedbackTopic = new ROSLIB__namespace.Topic({
        ros: this.ros,
        name: topic + '/feedback',
        messageType: 'visualization_msgs/InteractiveMarkerFeedback',
        compression: 'png'
      });
      this.feedbackTopic.advertise();
      this.initService = new ROSLIB__namespace.Service({
        ros: this.ros,
        name: topic + '/tunneled/get_init',
        serviceType: 'demo_interactive_markers/GetInit'
      });
      var request = new ROSLIB__namespace.ServiceRequest({});
      this.initService.callService(request, this.processInit.bind(this));
    }

    /**
     * Unsubscribe from the current interactive marker topic.
     */
    unsubscribe() {
      if (this.updateTopic) {
        this.updateTopic.unsubscribe(this.processUpdate);
      }

      if (this.feedbackTopic) {
        this.feedbackTopic.unadvertise();
      } // erase all markers


      for (var intMarkerName in this.interactiveMarkers) {
        this.eraseIntMarker(intMarkerName);
      }

      this.interactiveMarkers = {};
    }

    /**
     * Process the given interactive marker initialization message.
     *
     * @param initMessage - the interactive marker initialization message to process
     */
    processInit(initMessage) {
      var message = initMessage.msg; // erase any old markers

      message.erases = [];

      for (var intMarkerName in this.interactiveMarkers) {
        message.erases.push(intMarkerName);
      }

      message.poses = []; // treat it as an update

      this.processUpdate(message);
    }

    /**
     * Process the given interactive marker update message.
     *
     * @param initMessage - the interactive marker update message to process
     */
    processUpdate(message) {
      var that = this; // erase any markers

      message.erases.forEach(function (name) {
        that.eraseIntMarker(name);
      }); // updates marker poses

      message.poses.forEach(function (poseMessage) {
        var marker = that.interactiveMarkers[poseMessage.name];

        if (marker) {
          marker.setPoseFromServer(poseMessage.pose);
        }
      }); // add new markers

      message.markers.forEach(function (msg) {
        // get rid of anything with the same name
        var oldhandle = that.interactiveMarkers[msg.name];

        if (oldhandle) {
          that.eraseIntMarker(oldhandle.name);
        } // create the handle


        var handle = new InteractiveMarkerHandle({
          message: msg,
          feedbackTopic: that.feedbackTopic,
          tfClient: that.tfClient,
          menuFontSize: that.menuFontSize
        });
        that.interactiveMarkers[msg.name] = handle; // create the actual marker

        var intMarker = new InteractiveMarker({
          handle: handle,
          camera: that.camera,
          path: that.path,
          loader: that.loader
        }); // add it to the scene

        intMarker.name = msg.name;
        that.rootObject.add(intMarker); // listen for any pose updates from the server

        handle.on('pose', function (pose) {
          intMarker.onServerSetPose({
            pose: pose
          });
        }); // add bound versions of UI handlers

        intMarker.addEventListener('user-pose-change', handle.setPoseFromClientBound);
        intMarker.addEventListener('user-mousedown', handle.onMouseDownBound);
        intMarker.addEventListener('user-mouseup', handle.onMouseUpBound);
        intMarker.addEventListener('user-button-click', handle.onButtonClickBound);
        intMarker.addEventListener('menu-select', handle.onMenuSelectBound); // now listen for any TF changes

        handle.subscribeTf();
      });
    }

    /**
     * Erase the interactive marker with the given name.
     *
     * @param intMarkerName - the interactive marker name to delete
     */
    eraseIntMarker(intMarkerName) {
      if (this.interactiveMarkers[intMarkerName]) {
        // remove the object
        var targetIntMarker = this.rootObject.getObjectByName(intMarkerName);
        this.rootObject.remove(targetIntMarker); // unsubscribe from TF topic!

        var handle = this.interactiveMarkers[intMarkerName];
        handle.unsubscribeTf(); // remove all other listeners

        targetIntMarker.removeEventListener('user-pose-change', handle.setPoseFromClientBound);
        targetIntMarker.removeEventListener('user-mousedown', handle.onMouseDownBound);
        targetIntMarker.removeEventListener('user-mouseup', handle.onMouseUpBound);
        targetIntMarker.removeEventListener('user-button-click', handle.onButtonClickBound);
        targetIntMarker.removeEventListener('menu-select', handle.onMenuSelectBound); // remove the handle from the map - after leaving this function's scope, there should be no references to the handle

        delete this.interactiveMarkers[intMarkerName];
        targetIntMarker.dispose();
      }
    }

  }
  /**
   * @fileOverview
   * @author Jihoon Lee - jihoonlee.in@gmail.com
   * @author Russell Toris - rctoris@wpi.edu
   */


  class SceneNode extends THREE.Object3D {
    /**
     * A SceneNode can be used to keep track of a 3D object with respect to a ROS frame within a scene.
     *
     * @constructor
     * @param options - object with following keys:
     *
     *  * tfClient - a handle to the TF client
     *  * frameID - the frame ID this object belongs to
     *  * pose (optional) - the pose associated with this object
     *  * object - the THREE 3D object to be rendered
     */
    constructor(options) {
      super();
      options = options || {};
      var that = this;
      this.tfClient = options.tfClient;
      this.frameID = options.frameID;
      var object = options.object;
      this.pose = options.pose || new ROSLIB__namespace.Pose(); // Do not render this object until we receive a TF update

      this.visible = false; // add the model

      this.add(object); // set the inital pose

      this.updatePose(this.pose); // save the TF handler so we can remove it later

      this.tfUpdate = function (msg) {
        // apply the transform
        var tf = new ROSLIB__namespace.Transform(msg);
        var poseTransformed = new ROSLIB__namespace.Pose(that.pose);
        poseTransformed.applyTransform(tf); // update the world

        that.updatePose(poseTransformed);
        that.visible = true;
      }; // listen for TF updates


      this.tfClient.subscribe(this.frameID, this.tfUpdate);
    }

    /**
     * Set the pose of the associated model.
     *
     * @param pose - the pose to update with
     */
    updatePose(pose) {
      this.position.set(pose.position.x, pose.position.y, pose.position.z);
      this.quaternion.set(pose.orientation.x, pose.orientation.y, pose.orientation.z, pose.orientation.w);
      this.updateMatrixWorld(true);
    }

    unsubscribeTf() {
      this.tfClient.unsubscribe(this.frameID, this.tfUpdate);
    }

  }
  /**
   * @fileOverview
   * @author Russell Toris - rctoris@wpi.edu
   * @author Nils Berg - berg.nils@gmail.com
   */


  class MarkerArrayClient extends EventEmitter2__default["default"] {
    /**
     * A MarkerArray client that listens to a given topic.
     *
     * Emits the following events:
     *
     *  * 'change' - there was an update or change in the MarkerArray
     *
     * @constructor
     * @param options - object with following keys:
     *
     *   * ros - the ROSLIB.Ros connection handle
     *   * topic - the marker topic to listen to
     *   * tfClient - the TF client handle to use
     *   * rootObject (optional) - the root object to add the markers to
     *   * path (optional) - the base path to any meshes that will be loaded
     */
    constructor(options) {
      super();
      options = options || {};
      this.ros = options.ros;
      this.topicName = options.topic;
      this.tfClient = options.tfClient;
      this.rootObject = options.rootObject || new THREE.Object3D();
      this.path = options.path || '/'; // Markers that are displayed (Map ns+id--Marker)

      this.markers = {};
      this.rosTopic = undefined;
      this.subscribe();
    }

    subscribe() {
      this.unsubscribe(); // subscribe to MarkerArray topic

      this.rosTopic = new ROSLIB__namespace.Topic({
        ros: this.ros,
        name: this.topicName,
        messageType: 'visualization_msgs/MarkerArray',
        compression: 'png'
      });
      this.rosTopic.subscribe(this.processMessage.bind(this));
    }

    processMessage(arrayMessage) {
      arrayMessage.markers.forEach(function (message) {
        var key = message.ns + message.id;

        if (message.action === 0) {
          var updated = false;

          if (key in this.markers) {
            // "MODIFY"
            updated = this.markers[key].children[0].update(message);

            if (!updated) {
              // "REMOVE"
              this.removeMarker(key);
            }
          }

          if (!updated) {
            // "ADD"
            var newMarker = new Marker({
              message: message,
              path: this.path
            });
            this.markers[key] = new SceneNode({
              frameID: message.header.frame_id,
              tfClient: this.tfClient,
              object: newMarker
            });
            this.rootObject.add(this.markers[key]);
          }
        } else if (message.action === 1) {
          // "DEPRECATED"
          console.warn('Received marker message with deprecated action identifier "1"');
        } else if (message.action === 2) {
          // "DELETE"
          this.removeMarker(key);
        } else if (message.action === 3) {
          // "DELETE ALL"
          for (var m in this.markers) {
            this.removeMarker(m);
          }

          this.markers = {};
        } else {
          console.warn('Received marker message with unknown action identifier "' + message.action + '"');
        }
      }.bind(this));
      this.emit('change');
    }

    unsubscribe() {
      if (this.rosTopic) {
        this.rosTopic.unsubscribe(this.processMessage);
      }
    }

    removeMarker(key) {
      var oldNode = this.markers[key];

      if (!oldNode) {
        return;
      }

      oldNode.unsubscribeTf();
      this.rootObject.remove(oldNode);
      oldNode.children.forEach(child => {
        child.dispose();
      });
      delete this.markers[key];
    }

  }
  /**
   * @fileOverview
   * @author Russell Toris - rctoris@wpi.edu
   */


  class MarkerClient extends EventEmitter2__default["default"] {
    /**
     * A marker client that listens to a given marker topic.
     *
     * Emits the following events:
     *
     *  * 'change' - there was an update or change in the marker
     *
     * @constructor
     * @param options - object with following keys:
     *
     *   * ros - the ROSLIB.Ros connection handle
     *   * topic - the marker topic to listen to
     *   * tfClient - the TF client handle to use
     *   * rootObject (optional) - the root object to add this marker to
     *   * path (optional) - the base path to any meshes that will be loaded
     *   * lifetime - the lifetime of marker
     */
    constructor(options) {
      super();
      options = options || {};
      this.ros = options.ros;
      this.topicName = options.topic;
      this.tfClient = options.tfClient;
      this.rootObject = options.rootObject || new THREE.Object3D();
      this.path = options.path || '/';
      this.lifetime = options.lifetime || 0; // Markers that are displayed (Map ns+id--Marker)

      this.markers = {};
      this.rosTopic = undefined;
      this.updatedTime = {};
      this.subscribe();
    }

    unsubscribe() {
      if (this.rosTopic) {
        this.rosTopic.unsubscribe(this.processMessage);
      }
    }

    checkTime(name) {
      var curTime = new Date().getTime();

      if (curTime - this.updatedTime[name] > this.lifetime) {
        this.removeMarker(name);
        this.emit('change');
      } else {
        var that = this;
        setTimeout(function () {
          that.checkTime(name);
        }, 100);
      }
    }

    subscribe() {
      this.unsubscribe(); // subscribe to the topic

      this.rosTopic = new ROSLIB__namespace.Topic({
        ros: this.ros,
        name: this.topicName,
        messageType: 'visualization_msgs/Marker',
        compression: 'png'
      });
      this.rosTopic.subscribe(this.processMessage.bind(this));
    }

    processMessage(message) {
      // remove old marker from Three.Object3D children buffer
      var key = message.ns + message.id;
      var oldNode = this.markers[key];
      this.updatedTime[key] = new Date().getTime();

      if (oldNode) {
        this.removeMarker(key);
      } else if (this.lifetime) {
        this.checkTime(message.ns + message.id);
      }

      if (message.action === 0) {
        // "ADD" or "MODIFY"
        var newMarker = new Marker({
          message: message,
          path: this.path
        });
        this.markers[key] = new SceneNode({
          frameID: message.header.frame_id,
          tfClient: this.tfClient,
          object: newMarker
        });
        this.rootObject.add(this.markers[key]);
      }

      this.emit('change');
    }

    removeMarker(key) {
      var oldNode = this.markers[key];

      if (!oldNode) {
        return;
      }

      oldNode.unsubscribeTf();
      this.rootObject.remove(oldNode);
      oldNode.children.forEach(child => {
        child.dispose();
      });
      delete this.markers[key];
    }

  }
  /**
   * @fileOverview
   * @author Jihoon Lee - lee@magazino.eu
   */


  class Arrow2 extends THREE.ArrowHelper {
    /**
     * A Arrow is a THREE object that can be used to display an arrow model using ArrowHelper
     *
     * @constructor
     * @param options - object with following keys:
     *
     *   * origin (optional) - the origin of the arrow
     *   * direction (optional) - the direction vector of the arrow
     *   * length (optional) - the length of the arrow
     *   * headLength (optional) - the head length of the arrow
     *   * shaftDiameter (optional) - the shaft diameter of the arrow
     *   * headDiameter (optional) - the head diameter of the arrow
     *   * material (optional) - the material to use for this arrow
     */
    constructor(options) {
      options = options || {};
      var origin = options.origin || new THREE.Vector3(0, 0, 0);
      var direction = options.direction || new THREE.Vector3(1, 0, 0);
      var length = options.length || 1;
      options.headLength || 0.2;
      options.shaftDiameter || 0.05;
      options.headDiameter || 0.1;
      options.material || new THREE.MeshBasicMaterial();
      super(direction, origin, length, 0xff0000);
    }

    /*
     * Free memory of elements in this object.
     */
    dispose() {
      if (this.line !== undefined) {
        this.line.material.dispose();
        this.line.geometry.dispose();
      }

      if (this.cone !== undefined) {
        this.cone.material.dispose();
        this.cone.geometry.dispose();
      }
    }

  }

  /**
   * @fileOverview
   * @author David Gossow - dgossow@willowgarage.com
   */
  class Axes extends THREE.Object3D {
    /**
     * An Axes object can be used to display the axis of a particular coordinate frame.
     *
     * @constructor
     * @param options - object with following keys:
     *
     *   * shaftRadius (optional) - the radius of the shaft to render
     *   * headRadius (optional) - the radius of the head to render
     *   * headLength (optional) - the length of the head to render
     *   * scale (optional) - the scale of the frame (defaults to 1.0)
     *   * lineType (optional) - the line type for the axes. Supported line types:
     *                           'dashed' and 'full'.
     *   * lineDashLength (optional) - the length of the dashes, relative to the length of the axis.
     *                                 Maximum value is 1, which means the dash length is
     *                                 equal to the length of the axis. Parameter only applies when
     *                                 lineType is set to dashed.
     */
    constructor(options) {
      super();
      var that = this;
      options = options || {};
      var shaftRadius = options.shaftRadius || 0.008;
      var headRadius = options.headRadius || 0.023;
      var headLength = options.headLength || 0.1;
      var scaleArg = options.scale || 1.0;
      var lineType = options.lineType || 'full';
      var lineDashLength = options.lineDashLength || 0.1;
      this.scale.set(scaleArg, scaleArg, scaleArg); // create the cylinders for the objects

      this.lineGeom = new THREE.CylinderGeometry(shaftRadius, shaftRadius, 1.0 - headLength);
      this.headGeom = new THREE.CylinderGeometry(0, headRadius, headLength);
      /**
       * Adds an axis marker to this axes object.
       *
       * @param axis - the 3D vector representing the axis to add
       */

      function addAxis(axis) {
        // set the color of the axis
        var color = new THREE.Color();
        color.setRGB(axis.x, axis.y, axis.z);
        var material = new THREE.MeshBasicMaterial({
          color: color.getHex()
        }); // setup the rotation information

        var rotAxis = new THREE.Vector3();
        rotAxis.crossVectors(axis, new THREE.Vector3(0, -1, 0));
        var rot = new THREE.Quaternion();
        rot.setFromAxisAngle(rotAxis, 0.5 * Math.PI); // create the arrow

        var arrow = new THREE.Mesh(that.headGeom, material);
        arrow.position.copy(axis);
        arrow.position.multiplyScalar(0.95);
        arrow.quaternion.copy(rot);
        arrow.updateMatrix();
        that.add(arrow); // create the line

        var line;

        if (lineType === 'dashed') {
          var l = lineDashLength;

          for (var i = 0; l / 2 + 3 * l * i + l / 2 <= 1; ++i) {
            var geom = new THREE.CylinderGeometry(shaftRadius, shaftRadius, l);
            line = new THREE.Mesh(geom, material);
            line.position.copy(axis); // Make spacing between dashes equal to 1.5 times the dash length.

            line.position.multiplyScalar(l / 2 + 3 * l * i);
            line.quaternion.copy(rot);
            line.updateMatrix();
            that.add(line);
          }
        } else if (lineType === 'full') {
          line = new THREE.Mesh(that.lineGeom, material);
          line.position.copy(axis);
          line.position.multiplyScalar(0.45);
          line.quaternion.copy(rot);
          line.updateMatrix();
          that.add(line);
        } else {
          console.warn('[Axes]: Unsupported line type. Not drawing any axes.');
        }
      } // add the three markers to the axes


      addAxis(new THREE.Vector3(1, 0, 0));
      addAxis(new THREE.Vector3(0, 1, 0));
      addAxis(new THREE.Vector3(0, 0, 1));
    }

  }
  /**
   * @fileOverview
   * @author Russell Toris - rctoris@wpi.edu
   */


  class Grid extends THREE.Object3D {
    /**
     * Create a grid object.
     *
     * @constructor
     * @param options - object with following keys:
     *
     *  * num_cells (optional) - The number of cells of the grid
     *  * color (optional) - the line color of the grid, like '#cccccc'
     *  * lineWidth (optional) - the width of the lines in the grid
     *  * cellSize (optional) - The length, in meters, of the side of each cell
     */
    constructor(options) {
      options = options || {};
      var num_cells = options.num_cells || 10;
      var color = options.color || '#cccccc';
      var lineWidth = options.lineWidth || 1;
      var cellSize = options.cellSize || 1;
      super();
      var material = new THREE.LineBasicMaterial({
        color: color,
        linewidth: lineWidth
      });

      for (var i = 0; i <= num_cells; ++i) {
        var edge = cellSize * num_cells / 2;
        var position = edge - i * cellSize;
        var geometryH = new THREE.Geometry();
        geometryH.vertices.push(new THREE.Vector3(-edge, position, 0), new THREE.Vector3(edge, position, 0));
        var geometryV = new THREE.Geometry();
        geometryV.vertices.push(new THREE.Vector3(position, -edge, 0), new THREE.Vector3(position, edge, 0));
        this.add(new THREE.Line(geometryH, material));
        this.add(new THREE.Line(geometryV, material));
      }
    }

  }
  /**
   * @fileOverview
   * @author Russell Toris - rctoris@wpi.edu
   */


  class OccupancyGrid extends THREE.Mesh {
    /**
     * An OccupancyGrid can convert a ROS occupancy grid message into a THREE object.
     *
     * @constructor
     * @param options - object with following keys:
     *
     *   * message - the occupancy grid message
     *   * color (optional) - color of the visualized grid
     *   * opacity (optional) - opacity of the visualized grid (0.0 == fully transparent, 1.0 == opaque)
     */
    constructor(options) {
      options = options || {};
      var message = options.message;
      var opacity = options.opacity || 1.0;
      var color = options.color || {
        r: 255,
        g: 255,
        b: 255,
        a: 255
      }; // create the geometry

      var info = message.info;
      var origin = info.origin;
      var width = info.width;
      var height = info.height;
      var geom = new THREE.PlaneBufferGeometry(width, height); // create the color material

      var imageData = new Uint8Array(width * height * 4);
      var texture = new THREE.DataTexture(imageData, width, height, THREE.RGBAFormat);
      texture.flipY = true;
      texture.minFilter = THREE.NearestFilter;
      texture.magFilter = THREE.NearestFilter;
      texture.needsUpdate = true;
      var material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: opacity < 1.0,
        opacity: opacity
      });
      material.side = THREE.DoubleSide; // create the mesh

      super(geom, material); // move the map so the corner is at X, Y and correct orientation (informations from message.info)
      // assign options to this for subclasses

      Object.assign(this, options);
      this.quaternion.copy(new THREE.Quaternion(origin.orientation.x, origin.orientation.y, origin.orientation.z, origin.orientation.w));
      this.position.x = width * info.resolution / 2 + origin.position.x;
      this.position.y = height * info.resolution / 2 + origin.position.y;
      this.position.z = origin.position.z;
      this.scale.x = info.resolution;
      this.scale.y = info.resolution;
      var data = message.data; // update the texture (after the the super call and this are accessible)

      this.color = color;
      this.material = material;
      this.texture = texture;

      for (var row = 0; row < height; row++) {
        for (var col = 0; col < width; col++) {
          // determine the index into the map data
          var invRow = height - row - 1;
          var mapI = col + invRow * width; // determine the value

          var val = this.getValue(mapI, invRow, col, data); // determine the color

          var color = this.getColor(mapI, invRow, col, val); // determine the index into the image data array

          var i = (col + row * width) * 4; // copy the color

          imageData.set(color, i);
        }
      }

      texture.needsUpdate = true;
    }

    dispose() {
      this.material.dispose();
      this.texture.dispose();
    }

    /**
     * Returns the value for a given grid cell
     * @param {int} index the current index of the cell
     * @param {int} row the row of the cell
     * @param {int} col the column of the cell
     * @param {object} data the data buffer
     */
    getValue(index, row, col, data) {
      return data[index];
    }

    /**
     * Returns a color value given parameters of the position in the grid; the default implementation
     * scales the default color value by the grid value. Subclasses can extend this functionality
     * (e.g. lookup a color in a color map).
     * @param {int} index the current index of the cell
     * @param {int} row the row of the cell
     * @param {int} col the column of the cell
     * @param {float} value the value of the cell
     * @returns r,g,b,a array of values from 0 to 255 representing the color values for each channel
     */
    getColor(index, row, col, value) {
      return [value * this.color.r / 255, value * this.color.g / 255, value * this.color.b / 255, 255];
    }

  }
  /**
   * @fileOverview
   * @author Russell Toris - rctoris@wpi.edu
   */


  class OccupancyGridClient extends EventEmitter2__default["default"] {
    /**
     * An occupancy grid client that listens to a given map topic.
     *
     * Emits the following events:
     *
     *  * 'change' - there was an update or change in the marker
     *
     * @constructor
     * @param options - object with following keys:
     *
     *   * ros - the ROSLIB.Ros connection handle
     *   * topic (optional) - the map topic to listen to
     *   * continuous (optional) - if the map should be continuously loaded (e.g., for SLAM)
     *   * tfClient (optional) - the TF client handle to use for a scene node
     *   * compression (optional) - message compression (default: 'cbor')
     *   * rootObject (optional) - the root object to add this marker to
     *   * offsetPose (optional) - offset pose of the grid visualization, e.g. for z-offset (ROSLIB.Pose type)
     *   * color (optional) - color of the visualized grid
     *   * opacity (optional) - opacity of the visualized grid (0.0 == fully transparent, 1.0 == opaque)
     */
    constructor(options) {
      super();
      options = options || {};
      this.ros = options.ros;
      this.topicName = options.topic || '/map';
      this.compression = options.compression || 'cbor';
      this.continuous = options.continuous;
      this.tfClient = options.tfClient;
      this.rootObject = options.rootObject || new THREE.Object3D();
      this.offsetPose = options.offsetPose || new ROSLIB__namespace.Pose();
      this.color = options.color || {
        r: 255,
        g: 255,
        b: 255
      };
      this.opacity = options.opacity || 1.0; // current grid that is displayed

      this.currentGrid = null; // subscribe to the topic

      this.rosTopic = undefined;
      this.subscribe();
    }

    unsubscribe() {
      if (this.rosTopic) {
        this.rosTopic.unsubscribe(this.processMessage);
      }
    }

    subscribe() {
      this.unsubscribe(); // subscribe to the topic

      this.rosTopic = new ROSLIB__namespace.Topic({
        ros: this.ros,
        name: this.topicName,
        messageType: 'nav_msgs/OccupancyGrid',
        queue_length: 1,
        compression: this.compression
      });
      this.sceneNode = null;
      this.rosTopic.subscribe(this.processMessage.bind(this));
    }

    processMessage(message) {
      // check for an old map
      if (this.currentGrid) {
        // check if it there is a tf client
        if (this.tfClient) {
          // grid is of type ROS3D.SceneNode
          this.sceneNode.unsubscribeTf();
          this.sceneNode.remove(this.currentGrid);
        } else {
          this.rootObject.remove(this.currentGrid);
        }

        this.currentGrid.dispose();
      }

      var newGrid = new OccupancyGrid({
        message: message,
        color: this.color,
        opacity: this.opacity
      }); // check if we care about the scene

      if (this.tfClient) {
        this.currentGrid = newGrid;

        if (this.sceneNode === null) {
          this.sceneNode = new SceneNode({
            frameID: message.header.frame_id,
            tfClient: this.tfClient,
            object: newGrid,
            pose: this.offsetPose
          });
          this.rootObject.add(this.sceneNode);
        } else {
          this.sceneNode.add(this.currentGrid);
        }
      } else {
        this.sceneNode = this.currentGrid = newGrid;
        this.rootObject.add(this.currentGrid);
      }

      this.emit('change'); // check if we should unsubscribe

      if (!this.continuous) {
        this.rosTopic.unsubscribe(this.processMessage);
      }
    }

  }
  /**
   * @fileOverview
   * @author Peter Sari - sari@photoneo.com
   */


  class OcTreeBaseNode {
    /**
     * Base node type that represents one voxel as a node of the tree
     */
    constructor() {
      this._children = [null, null, null, null, null, null, null, null];
      this.value = null;
    }

    createChildNodeAt(newNode, index) {
      this._children[index % 8] = newNode;
    }

    hasChildAt(index) {
      return this._children[index % 8] !== null;
    }

    getChildAt(index) {
      return this._children[index % 8];
    }

    isLeafNode() {
      for (let i = 0; i < 8; ++i) {
        if (this._children[i] !== null) {
          return false;
        }
      }

      return true;
    }

    hasChildren() {
      for (let i = 0; i < 8; ++i) {
        if (this._children[i] !== null) {
          return true;
        }
      }

      return false;
    }

  }
  /**
   * @fileOverview
   * @author Peter Sari - sari@photoneo.com
   */

  /**
   * Toggles voxel visibility
   *
   *    * `occupied` - only voxels that are above or equal to the occupation threshold are shown
   *    * `free` - only voxels that are below the occupation threshold are shown
   *    * `all` - all allocated voxels are shown
   */


  var OcTreeVoxelRenderMode = {
    OCCUPIED: 'occupied',
    FREE: 'free',
    ALL: 'all'
  };
  /**
   * Coloring modes for each voxel
   *
   *     * 'solid' - voxels will have a single solid color set by the tree globally
   *     * 'occupancy' - voxels are false colored by their occupancy value. Fall back for `solid` if not available.
   *     * 'color' - voxels will colorized by their
   */

  var OcTreeColorMode = {
    SOLID: 'solid',
    OCCUPANCY: 'occupancy',
    COLOR: 'color'
  }; // ----- ----- ----- ----- ----- ----- ----- ----- ----- ----- ----- ----- -----

  /**
   Quick and dirty helper class
   to read ArrayBuffer in a streamed data-like fashion with mixed types in it
  */

  function InStream(data, isLittleEndian) {
    this.buffer = data.buffer;
    this.length = data.length;
    this.isLittleEndian = typeof isLittleEndian !== 'undefined' ? !!isLittleEndian : true;
    this._dataView = new DataView(this.buffer);
    this._cursor = 0; // Creates a set of wrapper functions for DataView
    // also flattens all dependencies

    [{
      kind: 'Int8',
      width: 1
    }, {
      kind: 'Uint8',
      width: 1
    }, {
      kind: 'Int16',
      width: 2
    }, {
      kind: 'Uint16',
      width: 2
    }, {
      kind: 'Int32',
      width: 4
    }, {
      kind: 'Uint32',
      width: 4
    }, {
      kind: 'BigInt64',
      width: 8
    }, {
      kind: 'BigUint64',
      width: 8
    }, {
      kind: 'Float32',
      width: 4
    }, {
      kind: 'Float64',
      width: 8
    }].forEach(wrap => {
      const interfaceFunction = 'read' + wrap.kind;
      const wrappedFunction = 'get' + wrap.kind; // Function name which going to be wrapped from DataView

      this[interfaceFunction] = () => {
        if (this._cursor + wrap.width > this.length) {
          throw new Error('Cannot read data stream. Overflow. Len=' + this.length + ' crsr=' + this._cursor);
        }

        const returningValue = this._dataView[wrappedFunction](this._cursor, this.isLittleEndian);

        this._cursor += wrap.width;
        return returningValue;
      };
    });
    Object.defineProperty(this, 'isEnd', {
      get: () => this.cursor >= this.data.length
    });
    return this;
  } // ----- ----- ----- ----- ----- ----- ----- ----- ----- ----- ----- ----- -----


  class OcTreeBase {
    /**
     * Represensta a BaseTree that can be build from ros message and create a THREE node from it.
     * Due a tree can be represented different ways in a message, this class is also a base class to
     * represent specialized versions fo the ree.
     *
     * @constructor
     * @param options - object with following keys:
     *
     *    * resolution - the size of leaf nodes in meter
     *    * color - color of the visualized map (if solid coloring option was set)
     *    * voxelRenderMode - toggle between rendering modes @see ROS3D.OcTreeVoxelRenderMode
     */
    constructor(options) {
      this.resolution = typeof options.resolution !== 'undefined' ? options.resolution : 1.;
      this.color = new THREE.Color(typeof options.color !== 'undefined' ? options.color : 'green');
      this.opacity = typeof options.opacity !== 'undefined' ? options.opacity : 1.;
      this.voxelRenderMode = typeof options.voxelRenderMode !== 'undefined' ? options.voxelRenderMode : OcTreeVoxelRenderMode.OCCUPIED;
      this._rootNode = null;
      this._treeDepth = 16;
      this._treeMaxKeyVal = 32768;
      this._BINARY_UNALLOCATED = 0b00;
      this._BINARY_LEAF_FREE = 0b01;
      this._BINARY_LEAF_OCCUPIED = 0b10;
      this._BINARY_HAS_CHILDREN = 0b11;
      this._BINARY_CHILD_BUILD_TABLE = {};

      this._BINARY_CHILD_BUILD_TABLE[this._BINARY_LEAF_FREE] = function (child) {
        child.value = this._defaultFreeValue;
      };

      this._BINARY_CHILD_BUILD_TABLE[this._BINARY_LEAF_OCCUPIED] = function (child) {
        child.value = this._defaultOccupiedValue;
      };

      this._BINARY_CHILD_BUILD_TABLE[this._BINARY_HAS_CHILDREN] = function (child) {
        child.value = null;
      };
      /**
       * Table which we are building the geometry data from.
       */


      this._FACES = [{
        // 0. left (x=0)
        normal: [-1, 0, 0],
        vertices: [[0, 1, 0], [0, 0, 0], [0, 1, 1], [0, 0, 1]],
        childIndex: [0b001, 0b011, 0b101, 0b111]
      }, {
        // 1. right (x=1)
        normal: [1, 0, 0],
        vertices: [[1, 1, 1], [1, 0, 1], [1, 1, 0], [1, 0, 0]],
        childIndex: [0b000, 0b010, 0b100, 0b110]
      }, {
        // 2. bottom (y=0)
        normal: [0, -1, 0],
        vertices: [[1, 0, 1], [0, 0, 1], [1, 0, 0], [0, 0, 0]],
        childIndex: [0b010, 0b011, 0b110, 0b111]
      }, {
        // 3. top (y=1)
        normal: [0, 1, 0],
        vertices: [[0, 1, 1], [1, 1, 1], [0, 1, 0], [1, 1, 0]],
        childIndex: [0b000, 0b001, 0b100, 0b101]
      }, {
        // 4. back (z=0)
        normal: [0, 0, -1],
        vertices: [[1, 0, 0], [0, 0, 0], [1, 1, 0], [0, 1, 0]],
        childIndex: [0b100, 0b101, 0b110, 0b111]
      }, {
        // 5.front (z=1)
        normal: [0, 0, 1],
        vertices: [[0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1]],
        childIndex: [0b000, 0b001, 0b010, 0b011]
      }]; // Table of voxel size for each level of the tree

      this.nodeSizeTable = new Array(this._treeDepth);
      let _val = this.resolution;

      for (let i = this._treeDepth - 1; i >= 0; --i) {
        this.nodeSizeTable[i] = _val;
        _val = 2. * _val;
      }

      this._defaultOccupiedValue = true;
      this._defaultFreeValue = false;
      this.object = null;
    }

    /*
     * Finds a key in a given depth. Search is performed on the lowest level by default.
     * @return the node at given position, null if not found
     */
    searchAtDepth(key, depth) {
      depth = typeof depth !== 'undefined' ? depth > 0 ? depth : this._treeDepth : this._treeDepth;

      const keyAtDepth = this._adjustKeyAtDepth(key, depth);

      const diff = this._treeDepth - depth;
      let currentNode = this._rootNode; // follow nodes down to requested level (for diff = 0 it's the last level)
      // Return the closest node, or null if not any

      for (let i = this._treeDepth - 1; i >= diff; --i) {
        const pos = this._computeChildIdx(keyAtDepth, i);

        if (currentNode.hasChildAt(pos)) {
          currentNode = currentNode.getChildAt(pos);
        } else {
          // we expected a child but did not get it
          // is the current node a leaf already?
          if (!currentNode.hasChildren()) {
            return currentNode;
          } // it is not, search failed


          return null;
        }
      }

      return currentNode;
    }

    /**
     *
     */
    _computeCoordFromKey(key) {
      return key.map(keyVal => this.resolution * (keyVal - this._treeMaxKeyVal));
    }

    _computeChildIdx(key, depth) {
      let pos = 0;

      if (key[0] & 1 << depth) {
        pos += 1;
      }

      if (key[1] & 1 << depth) {
        pos += 2;
      }

      if (key[2] & 1 << depth) {
        pos += 4;
      }

      return pos;
    }

    _computeKeyFromChildIdx(index, offset, depth) {
      const diff = this._treeDepth - depth - 1;
      return [offset[0] + (!!(index & 1) << diff), offset[1] + (!!(index & 2) << diff), offset[2] + (!!(index & 4) << diff)];
    }

    _adjustKeyAtDepth(key, depth) {
      // generate appropriate key_at_depth for queried depth
      let diff = this._treeDepth - depth;

      if (diff === 0) {
        return key;
      }

      return key.map(keyVal => (keyVal - this._treeMaxKeyVal >> diff << diff) + (1 << diff - 1) + this._treeMaxKeyVal);
    }

    _newNode() {
      return new OcTreeBaseNode();
    }

    /*
     * Reads and builds a tree which was represented in a binary form from a message
     * Binary form only contains the tree structure to be allocated, all the data of voxels are stripped,
     * occupation is represented as a binary value.
     * Each node is represented as a 2-bit value which makes up the 8 child nodes of the parent (16 bits in total)
     * starting with the root node.
     */
    readBinary(data) {
      if (this._rootNode !== null) {
        delete this._rootNode;
      }

      this._rootNode = this._newNode();
      let dataStream = new InStream(data, true);
      let stack = new Array();
      stack.push(this._rootNode);

      while (stack.length > 0) {
        let node = stack.pop(); // 2 bits per children, 16 bit total

        const childAllocationMap = dataStream.readUint16(); // Insert all children and leaves

        let index = 8;

        while (index !== 0) {
          --index;
          const allocation = (childAllocationMap & 0b11 << 2 * index) >> 2 * index;

          if (allocation !== this._BINARY_UNALLOCATED) {
            let child = this._newNode();

            const fn = this._BINARY_CHILD_BUILD_TABLE[allocation].bind(this);

            fn(child);
            node.createChildNodeAt(child, index);

            if (allocation === this._BINARY_HAS_CHILDREN) {
              stack.push(child);
            }
          }
        }
      }
    }

    /**
     * Reads a full tree (with node data) from a message.
     * A pacjet starts with the node data, followed by the allocation map of their children.
     * Each type of tree has different data structure @see ROS3DJS.OcTreeBase._readNodeData
     */
    read(data) {
      if (this._rootNode !== null) {
        delete this._rootNode;
      }

      this._rootNode = this._newNode();
      let dataStream = new InStream(data, true);
      let stack = new Array();
      stack.push(this._rootNode);

      while (stack.length > 0) {
        let node = stack.pop(); // Data comes first

        this._readNodeData(dataStream, node);

        const childAllocationMap = dataStream.readUint8(); // Insert all children and leaves

        let index = 8;

        while (index !== 0) {
          --index;
          const hasChild = childAllocationMap & 1 << index;

          if (hasChild) {
            let child = this._newNode();

            child.value = null;
            node.createChildNodeAt(child, index);
            stack.push(child);
          }
        }
      }
    }

    /**
     * Abstract function; Reads and sets data of a node
     */
    _readNodeData(dataStream, node) {
      // This needs to be implemented by specialized tree
      console.error('Not implemented');
    }

    /**
    * Builds up THREE.js geometry from tree data.
    */
    buildGeometry() {
      console.assert(this._rootNode !== null, 'No tree data');

      const {
        vertices,
        normals,
        colors,
        indices
      } = this._buildFaces();

      const geometry = new THREE.BufferGeometry();
      const material = new THREE.MeshBasicMaterial({
        color: 'white',
        flatShading: true,
        vertexColors: THREE.VertexColors,
        transparent: this.opacity < 1.0,
        opacity: this.opacity
      });
      geometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
      geometry.addAttribute('normal', new THREE.BufferAttribute(new Float32Array(normals), 3));
      geometry.addAttribute('color', new THREE.BufferAttribute(new Float32Array(colors), 3));
      geometry.setIndex(indices);
      const mesh = new THREE.Mesh(geometry, material);
      this.object = new THREE.Object3D();
      this.object.add(mesh);
    }

    _traverseLeaves(callback) {
      let stack = new Array();
      stack.push({
        node: this._rootNode,
        depth: 0,
        key: [0, 0, 0]
      });

      while (stack.length > 0) {
        let current = stack.pop();

        if (current.node.isLeafNode()) {
          callback(current.node, current.key, current.depth - 1);
        } else {
          for (let index = 0; index < 8; ++index) {
            if (current.node.hasChildAt(index)) {
              const key = this._computeKeyFromChildIdx(index, current.key, current.depth);

              stack.push({
                node: current.node.getChildAt(index),
                depth: current.depth + 1,
                key
              });
            }
          }
        }
      }
    }

    /**
     * Abstract function; to implement different coloring schemes
     */
    _obtainColor(node) {
      return this.color;
    }

    _checkOccupied(node) {
      return node.value !== false;
    }

    _buildFaces() {
      let geometry = {
        vertices: [],
        indices: [],
        normals: [],
        colors: [],
        _insertFace: function (face, pos, size, color) {
          const indexCount = this.vertices.length / 3;
          face.vertices.forEach(function (vertex) {
            this.vertices.push(pos[0] + vertex[0] * size, pos[1] + vertex[1] * size, pos[2] + vertex[2] * size);
          });
          const colorArr = [color.r, color.g, color.b];
          this.colors.push(...colorArr, ...colorArr, ...colorArr, ...colorArr);
          this.normals.push(...face.normal, ...face.normal, ...face.normal, ...face.normal);
          this.indices.push(indexCount, indexCount + 1, indexCount + 2, indexCount + 2, indexCount + 1, indexCount + 3);
        },
        _checkNeighborsTouchingFace: function (face, neighborNode, voxelRenderMode) {
          // Finds if there's not a node at a given position, aka a 'hole'
          let stack = new Array();
          stack.push(neighborNode);

          while (stack.length !== 0) {
            const node = stack.pop();

            if (node.hasChildren()) {
              face.childIndex.forEach(function (childIndex) {
                if (node.hasChildAt(childIndex)) {
                  const child = node.getChildAt(childIndex); // filter occupancy

                  const isOccupied = this._checkOccupied(node);

                  const isNeedsToRender = isOccupied && voxelRenderMode === ROS3D.OcTreeVoxelRenderMode.OCCUPIED || !isOccupied && voxelRenderMode === OcTreeVoxelRenderMode.FREE;

                  if (isNeedsToRender) {
                    stack.push(child);
                  }
                } else {
                  return true;
                }
              });
            }
          }

          return false;
        }
      };

      this._traverseLeaves((node, key, depth) => {
        const pos = this._computeCoordFromKey(key);

        const size = this.nodeSizeTable[depth];
        const diff = this._treeDepth - depth;

        const isOccupied = this._checkOccupied(node); // By default it will show ALL
        // Hide free voxels if set


        if (!isOccupied && this.voxelRenderMode === OcTreeVoxelRenderMode.OCCUPIED) {
          return;
        } // Hide occuped voxels if set.


        if (isOccupied && this.voxelRenderMode === OcTreeVoxelRenderMode.FREE) {
          return;
        }

        this._FACES.forEach(function (face) {
          // Add geometry where there is no neighbor voxel
          const neighborKey = [key[0] + face.normal[0] * diff * diff, key[1] + face.normal[1] * diff * diff, key[2] + face.normal[2] * diff * diff];
          const neighborNode = this.searchAtDepth(neighborKey);

          if (neighborNode === null) {
            // 1. Simply add geometry where there is no neighbors
            geometry._insertFace(face, pos, size, this._obtainColor(node));
          } else if (depth < this._treeDepth) {
            // 2. Special case, when a node (voxel) is not on the lowest level
            // of the tree, but also need to add a geometry, because might
            // not be "fully covered" by neighboring voxels on the lowest level
            if (geometry._checkNeighborsTouchingFace(face, neighborNode, this.voxelRenderMode)) ;
          }
        });
      }); // return geometry;


      return {
        vertices: geometry.vertices,
        normals: geometry.normals,
        colors: geometry.colors,
        indices: geometry.indices
      };
    }

  }
  /**
   * @fileOverview
   * @author Peter Sari - sari@photoneo.com
   */


  class OcTree extends OcTreeBase {
    /**
     * Specilaization of BaseOcTree
     *
     * @constructor
     * @param options - object with following keys:
     *    * inherited from BaseOctree
     *    * occupancyThreshold (optional) - threshold value that separates occupied and free voxels from each other. (Default: 0)
     *    * colorMode (optional) - Coloring mode @see ROS3D.OcTreeColorMode.
     *    * palette (optional) - Palette used for false-coloring (default: predefined palette)
     *    * paletteSclae (optional) - Scale of palette to represent a wider range of values (default: 1.)
     */
    constructor(options) {
      super(options);
      this._defaultOccupiedValue = 1.;
      this._defaultFreeValue = -1.;
      this.occupancyThreshold = typeof options.occupancyThreshold !== 'undefined' ? options.occupancyThreshold : 0.0000001;
      this.useFlatColoring = typeof options.colorMode !== 'undefined' && options.colorMode === OcTreeColorMode.SOLID;
      this.palette = typeof options.palette !== 'undefined' ? options.palette.map(color => new THREE.Color(color)) : [{
        r: 0,
        g: 0,
        b: 128
      }, // dark blue (low)
      {
        r: 0,
        g: 255,
        b: 0
      }, // green
      {
        r: 255,
        g: 255,
        b: 0
      }, // yellow (mid)
      {
        r: 255,
        g: 128,
        b: 0
      }, // orange
      {
        r: 255,
        g: 0,
        b: 0 // red (high)

      }];
      this.paletteScale = typeof options.paletteScale !== 'undefined' ? options.paletteScale : 1.;
    }

    _readNodeData(dataStream, node) {
      node.value = dataStream.readFloat32();
    }

    _obtainColor(node) {
      if (this.useFlatColoring) {
        return this.color;
      } // Use a simple sigmoid curve to fit values from -inf..inf into 0..1 range


      const value = 1. / (1. + Math.exp(-node.value * this.paletteScale)) * this.palette.length; // Normalize

      const intVal = Math.trunc(value);
      const fracVal = value - intVal;

      if (intVal < 0) {
        return this.palette[0];
      }

      if (intVal >= this.palette.length - 1) {
        return this.palette[this.palette.length - 1];
      } // Simple lerp


      return {
        r: fracVal * this.palette[intVal].r + (1. - fracVal) * this.palette[intVal + 1].r,
        g: fracVal * this.palette[intVal].g + (1. - fracVal) * this.palette[intVal + 1].g,
        b: fracVal * this.palette[intVal].b + (1. - fracVal) * this.palette[intVal + 1].b
      };
    }

    _checkOccupied(node) {
      return node.value >= this.occupancyThreshold;
    }

  }

  class ColorOcTree extends OcTree {
    /**
     * @fileOverview
     * @author Peter Sari - sari@photoneo.com
     */
    constructor(options) {
      super(options);
      this.useOwnColor = typeof options.palette !== 'undefined' && options.colorMode === OcTreeColorMode.COLOR;
    }

    _readNodeData(dataStream, node) {
      node.value = dataStream.readFloat32(); // occupancy

      node.color = {
        r: dataStream.readUint8(),
        // red
        g: dataStream.readUint8(),
        // green
        b: dataStream.readUint8() // blue

      };
    }

    _obtainColor(node) {
      if (!this.useOwnColor) {
        return OcTree.prototype._obtainColor.call(this, node);
      }

      return node.color;
    }

  }
  /**
   * @fileOverview
   * @author Peter Sari - sari@photoneo.com
   */


  class OcTreeClient extends EventEmitter2__default["default"] {
    /**
     * An OcTree client that listens to a given OcTree topic.
     *
     * Emits the following events:
     *
     * 'change' - there was an update or change in the marker
     *
     * @constructor
     * @param options - object with following keys:
     *
     *    * ros - the ROSLIB.Ros connection handle
     *    * topic (optional) - the map topic to listen to
     *    * continuous (optional) - if the map should be continuously loaded (e.g., for SLAM)
     *    * tfClient (optional) - the TF client handle to use for a scene node
     *    * compression (optional) - message compression (default: 'cbor')
     *    * rootObject (optional) - the root object to add this marker to
     *    * offsetPose (optional) - offset pose of the mao visualization, e.g. for z-offset (ROSLIB.Pose type)
     *    * colorMode (optional)) - colorization mode for each voxels @see RORS3D.OcTreeColorMode (default 'color')
     *    * color (optional) - color of the visualized map (if solid coloring option was set). Can be any value accepted by THREE.Color
     *    * opacity (optional) - opacity of the visualized grid (0.0 == fully transparent, 1.0 == opaque)
     *    * palette (optional) - list of RGB colors to be used as palette (THREE.Color)
     *    * paletteScale (optional) - scale favtor of palette to cover wider range of values. (default: 1)
     *    * voxelRenderMode (optional)- toggle between rendering modes @see ROS3D.OcTreeVoxelRenderMode. (default `occupid`)
     *
     */
    constructor(options) {
      super();
      options = options || {};
      this.ros = options.ros;
      this.topicName = options.topic || '/octomap';
      this.compression = options.compression || 'cbor';
      this.continuous = options.continuous;
      this.tfClient = options.tfClient;
      this.rootObject = options.rootObject || new THREE.Object3D();
      this.offsetPose = options.offsetPose || new ROSLIB__namespace.Pose(); // Options passed to converter

      this.options = {}; // Append only when it was set, otherwise defaults are provided by the underlying layer

      if (typeof options.color !== 'undefined') {
        this.options['color'] = options.color;
      }

      if (typeof options.opacity !== 'undefined') {
        this.options['opacity'] = options.opacity;
      }

      if (typeof options.colorMode !== 'undefined') {
        this.options['colorMode'] = options.colorMode;
      }

      if (typeof options.palette !== 'undefined') {
        this.options['palette'] = options.palette;
      }

      if (typeof options.paletteScale !== 'undefined') {
        this.options['paletteScale'] = options.palette;
      }

      if (typeof options.voxelRenderMode !== 'undefined') {
        this.options['voxelRenderMode'] = options.voxelRenderMode;
      } // current grid that is displayed


      this.currentMap = null; // subscribe to the topic

      this.rosTopic = undefined;
      this.subscribe();
    }

    unsubscribe() {
      if (this.rosTopic) {
        this.rosTopic.unsubscribe(this.processMessage);
      }
    }

    subscribe() {
      this.unsubscribe(); // subscribe to the topic

      this.rosTopic = new ROSLIB__namespace.Topic({
        ros: this.ros,
        name: this.topicName,
        messageType: 'octomap_msgs/Octomap',
        queue_length: 1,
        compression: this.compression
      });
      this.rosTopic.subscribe(this.processMessage.bind(this));
    }

    processMessage(message) {
      // check for an old map
      if (this.currentMap) {
        if (this.currentMap.tfClient) {
          this.currentMap.unsubscribeTf();
        }
      }

      this._processMessagePrivate(message);

      if (!this.continuous) {
        this.rosTopic.unsubscribe(this.processMessage);
      }
    }

    _loadOcTree(message) {
      return new Promise(function (resolve, reject) {
        // 1. Create the corresponding octree object from message
        const options = Object.assign({
          resolution: message.resolution
        }, this.options);
        let newOcTree = null;
        {
          if (message.binary) {
            newOcTree = new OcTreeBase(options);
            newOcTree.readBinary(message.data);
          } else {
            const ctorTable = {
              'OcTree': OcTree,
              'ColorOcTree': ColorOcTree
            };

            if (message.id in ctorTable) {
              console.log(message.id, ctorTable);
              newOcTree = new ctorTable[message.id](options);
              newOcTree.read(message.data);
            }
          }
        }
        {
          newOcTree.buildGeometry();
        }
        resolve(newOcTree);
      }.bind(this));
    }

    _processMessagePrivate(message) {
      let promise = this._loadOcTree(message);

      promise.then( // 3. Replace geometry
      function (newOcTree) {
        // check if we care about the scene
        const oldNode = this.sceneNode;

        if (this.tfClient) {
          this.currentMap = newOcTree;
          this.sceneNode = new SceneNode({
            frameID: message.header.frame_id,
            tfClient: this.tfClient,
            object: newOcTree.object,
            pose: this.offsetPose
          });
        } else {
          this.sceneNode = newOcTree.object;
          this.currentMap = newOcTree;
        }

        this.rootObject.remove(oldNode);
        this.rootObject.add(this.sceneNode);
        this.emit('change');
      }.bind(this));
    }

  }
  /**
   * @fileOverview
   * @author David V. Lu!! - davidvlu@gmail.com
   */


  class Odometry extends THREE.Object3D {
    /**
     * An Odometry client
     *
     * @constructor
     * @param options - object with following keys:
     *
     *  * ros - the ROSLIB.Ros connection handle
     *  * topic - the marker topic to listen to
     *  * tfClient - the TF client handle to use
     *  * rootObject (optional) - the root object to add this marker to
     *  * keep (optional) - number of markers to keep around (default: 1)
     *  * color (optional) - color for line (default: 0xcc00ff)
     *  * length (optional) - the length of the arrow (default: 1.0)
     *  * headLength (optional) - the head length of the arrow (default: 0.2)
     *  * shaftDiameter (optional) - the shaft diameter of the arrow (default: 0.05)
     *  * headDiameter (optional) - the head diameter of the arrow (default: 0.1)
     */
    constructor(options) {
      super();
      this.options = options || {};
      this.ros = options.ros;
      this.topicName = options.topic || '/particlecloud';
      this.tfClient = options.tfClient;
      this.color = options.color || 0xcc00ff;
      this.length = options.length || 1.0;
      this.rootObject = options.rootObject || new THREE.Object3D();
      this.keep = options.keep || 1;
      this.sns = [];
      this.rosTopic = undefined;
      this.subscribe();
    }

    unsubscribe() {
      if (this.rosTopic) {
        this.rosTopic.unsubscribe(this.processMessage);
      }
    }

    subscribe() {
      this.unsubscribe(); // subscribe to the topic

      this.rosTopic = new ROSLIB__namespace.Topic({
        ros: this.ros,
        name: this.topicName,
        queue_length: 1,
        messageType: 'nav_msgs/Odometry'
      });
      this.rosTopic.subscribe(this.processMessage.bind(this));
    }

    processMessage(message) {
      if (this.sns.length >= this.keep) {
        this.sns[0].unsubscribeTf();
        this.rootObject.remove(this.sns[0]);
        this.sns.shift();
      }

      this.options.origin = new THREE.Vector3(message.pose.pose.position.x, message.pose.pose.position.y, message.pose.pose.position.z);
      var rot = new THREE.Quaternion(message.pose.pose.orientation.x, message.pose.pose.orientation.y, message.pose.pose.orientation.z, message.pose.pose.orientation.w);
      this.options.direction = new THREE.Vector3(1, 0, 0);
      this.options.direction.applyQuaternion(rot);
      this.options.material = new THREE.MeshBasicMaterial({
        color: this.color
      });
      var arrow = new Arrow(this.options);
      this.sns.push(new SceneNode({
        frameID: message.header.frame_id,
        tfClient: this.tfClient,
        object: arrow
      }));
      this.rootObject.add(this.sns[this.sns.length - 1]);
    }

  }
  /**
   * @fileOverview
   * @author David V. Lu!! - davidvlu@gmail.com
   */


  class Path extends THREE.Object3D {
    /**
     * A Path client that listens to a given topic and displays a line connecting the poses.
     *
     * @constructor
     * @param options - object with following keys:
     *
     *  * ros - the ROSLIB.Ros connection handle
     *  * topic - the marker topic to listen to
     *  * tfClient - the TF client handle to use
     *  * rootObject (optional) - the root object to add this marker to
     *  * color (optional) - color for line (default: 0xcc00ff)
     */
    constructor(options) {
      super();
      options = options || {};
      this.ros = options.ros;
      this.topicName = options.topic || '/path';
      this.tfClient = options.tfClient;
      this.color = options.color || 0xcc00ff;
      this.rootObject = options.rootObject || new THREE.Object3D();
      this.sn = null;
      this.line = null;
      this.rosTopic = undefined;
      this.subscribe();
    }

    unsubscribe() {
      if (this.rosTopic) {
        this.rosTopic.unsubscribe(this.processMessage);
      }
    }

    subscribe() {
      this.unsubscribe(); // subscribe to the topic

      this.rosTopic = new ROSLIB__namespace.Topic({
        ros: this.ros,
        name: this.topicName,
        queue_length: 1,
        messageType: 'nav_msgs/Path'
      });
      this.rosTopic.subscribe(this.processMessage.bind(this));
    }

    processMessage(message) {
      if (this.sn !== null) {
        this.sn.unsubscribeTf();
        this.rootObject.remove(this.sn);
      }

      var lineGeometry = new THREE.Geometry();

      for (var i = 0; i < message.poses.length; i++) {
        var v3 = new THREE.Vector3(message.poses[i].pose.position.x, message.poses[i].pose.position.y, message.poses[i].pose.position.z);
        lineGeometry.vertices.push(v3);
      }

      lineGeometry.computeLineDistances();
      var lineMaterial = new THREE.LineBasicMaterial({
        color: this.color
      });
      var line = new THREE.Line(lineGeometry, lineMaterial);
      this.sn = new SceneNode({
        frameID: message.header.frame_id,
        tfClient: this.tfClient,
        object: line
      });
      this.rootObject.add(this.sn);
    }

  }
  /**
   * @fileOverview
   * @author David V. Lu!! - davidvlu@gmail.com
   */


  class Point extends THREE.Object3D {
    /**
     * A PointStamped client
     *
     * @constructor
     * @param options - object with following keys:
     *
     *  * ros - the ROSLIB.Ros connection handle
     *  * topic - the marker topic to listen to
     *  * tfClient - the TF client handle to use
     *  * rootObject (optional) - the root object to add this marker to
     *  * color (optional) - color for line (default: 0xcc00ff)
     *  * radius (optional) - radius of the point (default: 0.2)
     */
    constructor(options) {
      super();
      this.options = options || {};
      this.ros = options.ros;
      this.topicName = options.topic || '/point';
      this.tfClient = options.tfClient;
      this.color = options.color || 0xcc00ff;
      this.rootObject = options.rootObject || new THREE.Object3D();
      this.radius = options.radius || 0.2;
      this.sn = null;
      this.rosTopic = undefined;
      this.subscribe();
    }

    unsubscribe() {
      if (this.rosTopic) {
        this.rosTopic.unsubscribe(this.processMessage);
      }
    }

    subscribe() {
      this.unsubscribe(); // subscribe to the topic

      this.rosTopic = new ROSLIB__namespace.Topic({
        ros: this.ros,
        name: this.topicName,
        queue_length: 1,
        messageType: 'geometry_msgs/PointStamped'
      });
      this.rosTopic.subscribe(this.processMessage.bind(this));
    }

    processMessage(message) {
      if (this.sn !== null) {
        this.sn.unsubscribeTf();
        this.rootObject.remove(this.sn);
      }

      var sphereGeometry = new THREE.SphereGeometry(this.radius);
      var sphereMaterial = new THREE.MeshBasicMaterial({
        color: this.color
      });
      var sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
      sphere.position.set(message.point.x, message.point.y, message.point.z);
      this.sn = new SceneNode({
        frameID: message.header.frame_id,
        tfClient: this.tfClient,
        object: sphere
      });
      this.rootObject.add(this.sn);
    }

  }
  /**
   * @fileOverview
   * @author David V. Lu!! - davidvlu@gmail.com
   */


  class Polygon extends THREE.Object3D {
    /**
     * A PolygonStamped client that listens to a given topic and displays the polygon
     *
     * @constructor
     * @param options - object with following keys:
     *
     *  * ros - the ROSLIB.Ros connection handle
     *  * topic - the marker topic to listen to
     *  * tfClient - the TF client handle to use
     *  * rootObject (optional) - the root object to add this marker to
     *  * color (optional) - color for line (default: 0xcc00ff)
     */
    constructor(options) {
      super();
      options = options || {};
      this.ros = options.ros;
      this.topicName = options.topic || '/path';
      this.tfClient = options.tfClient;
      this.color = options.color || 0xcc00ff;
      this.rootObject = options.rootObject || new THREE.Object3D();
      this.sn = null;
      this.line = null;
      this.rosTopic = undefined;
      this.subscribe();
    }

    unsubscribe() {
      if (this.rosTopic) {
        this.rosTopic.unsubscribe(this.processMessage);
      }
    }

    subscribe() {
      this.unsubscribe(); // subscribe to the topic

      this.rosTopic = new ROSLIB__namespace.Topic({
        ros: this.ros,
        name: this.topicName,
        queue_length: 1,
        messageType: 'geometry_msgs/PolygonStamped'
      });
      this.rosTopic.subscribe(this.processMessage.bind(this));
    }

    processMessage(message) {
      if (this.sn !== null) {
        this.sn.unsubscribeTf();
        this.rootObject.remove(this.sn);
      }

      var lineGeometry = new THREE.Geometry();
      var v3;

      for (var i = 0; i < message.polygon.points.length; i++) {
        v3 = new THREE.Vector3(message.polygon.points[i].x, message.polygon.points[i].y, message.polygon.points[i].z);
        lineGeometry.vertices.push(v3);
      }

      v3 = new THREE.Vector3(message.polygon.points[0].x, message.polygon.points[0].y, message.polygon.points[0].z);
      lineGeometry.vertices.push(v3);
      lineGeometry.computeLineDistances();
      var lineMaterial = new THREE.LineBasicMaterial({
        color: this.color
      });
      var line = new THREE.Line(lineGeometry, lineMaterial);
      this.sn = new SceneNode({
        frameID: message.header.frame_id,
        tfClient: this.tfClient,
        object: line
      });
      this.rootObject.add(this.sn);
    }

  }
  /**
   * @fileOverview
   * @author David V. Lu!! - davidvlu@gmail.com
   */


  class Pose extends THREE.Object3D {
    /**
     * A PoseStamped client
     *
     * @constructor
     * @param options - object with following keys:
     *
     *  * ros - the ROSLIB.Ros connection handle
     *  * topic - the marker topic to listen to
     *  * tfClient - the TF client handle to use
     *  * rootObject (optional) - the root object to add this marker to
     *  * color (optional) - color for line (default: 0xcc00ff)
     *  * length (optional) - the length of the arrow (default: 1.0)
     *  * headLength (optional) - the head length of the arrow (default: 0.2)
     *  * shaftDiameter (optional) - the shaft diameter of the arrow (default: 0.05)
     *  * headDiameter (optional) - the head diameter of the arrow (default: 0.1)
     */
    constructor(options) {
      super();
      this.options = options || {};
      this.ros = options.ros;
      this.topicName = options.topic || '/pose';
      this.tfClient = options.tfClient;
      this.color = options.color || 0xcc00ff;
      this.rootObject = options.rootObject || new THREE.Object3D();
      this.sn = null;
      this.rosTopic = undefined;
      this.subscribe();
    }

    unsubscribe() {
      if (this.rosTopic) {
        this.rosTopic.unsubscribe(this.processMessage);
      }
    }

    subscribe() {
      this.unsubscribe(); // subscribe to the topic

      this.rosTopic = new ROSLIB__namespace.Topic({
        ros: this.ros,
        name: this.topicName,
        queue_length: 1,
        messageType: 'geometry_msgs/PoseStamped'
      });
      this.rosTopic.subscribe(this.processMessage.bind(this));
    }

    processMessage(message) {
      if (this.sn !== null) {
        this.sn.unsubscribeTf();
        this.rootObject.remove(this.sn);
      }

      this.options.origin = new THREE.Vector3(message.pose.position.x, message.pose.position.y, message.pose.position.z);
      var rot = new THREE.Quaternion(message.pose.orientation.x, message.pose.orientation.y, message.pose.orientation.z, message.pose.orientation.w);
      this.options.direction = new THREE.Vector3(1, 0, 0);
      this.options.direction.applyQuaternion(rot);
      this.options.material = new THREE.MeshBasicMaterial({
        color: this.color
      });
      var arrow = new Arrow(this.options);
      this.sn = new SceneNode({
        frameID: message.header.frame_id,
        tfClient: this.tfClient,
        object: arrow
      });
      this.rootObject.add(this.sn);
    }

  }
  /**
   * @fileOverview
   * @author David V. Lu!! - davidvlu@gmail.com
   */


  class PoseArray extends THREE.Object3D {
    /**
     * A PoseArray client
     *
     * @constructor
     * @param options - object with following keys:
     *
     *  * ros - the ROSLIB.Ros connection handle
     *  * topic - the marker topic to listen to
     *  * tfClient - the TF client handle to use
     *  * rootObject (optional) - the root object to add this marker to
     *  * color (optional) - color for line (default: 0xcc00ff)
     *  * length (optional) - the length of the arrow (default: 1.0)
     */
    constructor(options) {
      super();
      this.options = options || {};
      this.ros = options.ros;
      this.topicName = options.topic || '/particlecloud';
      this.tfClient = options.tfClient;
      this.color = options.color || 0xcc00ff;
      this.length = options.length || 1.0;
      this.rootObject = options.rootObject || new THREE.Object3D();
      this.sn = null;
      this.rosTopic = undefined;
      this.subscribe();
    }

    unsubscribe() {
      if (this.rosTopic) {
        this.rosTopic.unsubscribe(this.processMessage);
      }
    }

    subscribe() {
      this.unsubscribe(); // subscribe to the topic

      this.rosTopic = new ROSLIB__namespace.Topic({
        ros: this.ros,
        name: this.topicName,
        queue_length: 1,
        messageType: 'geometry_msgs/PoseArray'
      });
      this.rosTopic.subscribe(this.processMessage.bind(this));
    }

    processMessage(message) {
      if (this.sn !== null) {
        this.sn.unsubscribeTf();
        this.rootObject.remove(this.sn);
      }

      var group = new THREE.Object3D();
      var line;

      for (var i = 0; i < message.poses.length; i++) {
        var lineGeometry = new THREE.Geometry();
        var v3 = new THREE.Vector3(message.poses[i].position.x, message.poses[i].position.y, message.poses[i].position.z);
        lineGeometry.vertices.push(v3);
        var rot = new THREE.Quaternion(message.poses[i].orientation.x, message.poses[i].orientation.y, message.poses[i].orientation.z, message.poses[i].orientation.w);
        var tip = new THREE.Vector3(this.length, 0, 0);
        var side1 = new THREE.Vector3(this.length * 0.8, this.length * 0.2, 0);
        var side2 = new THREE.Vector3(this.length * 0.8, -this.length * 0.2, 0);
        tip.applyQuaternion(rot);
        side1.applyQuaternion(rot);
        side2.applyQuaternion(rot);
        lineGeometry.vertices.push(tip.add(v3));
        lineGeometry.vertices.push(side1.add(v3));
        lineGeometry.vertices.push(side2.add(v3));
        lineGeometry.vertices.push(tip);
        lineGeometry.computeLineDistances();
        var lineMaterial = new THREE.LineBasicMaterial({
          color: this.color
        });
        line = new THREE.Line(lineGeometry, lineMaterial);
        group.add(line);
      }

      this.sn = new SceneNode({
        frameID: message.header.frame_id,
        tfClient: this.tfClient,
        object: group
      });
      this.rootObject.add(this.sn);
    }

  }
  /**
   * @fileOverview
   * @author David V. Lu!! - davidvlu@gmail.com
   */


  class PoseWithCovariance extends THREE.Object3D {
    /**
     * A PoseWithCovarianceStamped client
     *
     * @constructor
     * @param options - object with following keys:
     *
     *  * ros - the ROSLIB.Ros connection handle
     *  * topic - the marker topic to listen to
     *  * tfClient - the TF client handle to use
     *  * rootObject (optional) - the root object to add this marker to
     *  * color (optional) - color for line (default: 0xcc00ff)
     */
    constructor(options) {
      super();
      this.options = options || {};
      this.ros = options.ros;
      this.topicName = options.topic || '/PoseWithCovariance';
      this.tfClient = options.tfClient;
      this.color = options.color || 0xcc00ff;
      this.rootObject = options.rootObject || new THREE.Object3D();
      this.sn = null;
      this.rosTopic = undefined;
      this.subscribe();
    }

    unsubscribe() {
      if (this.rosTopic) {
        this.rosTopic.unsubscribe(this.processMessage);
      }
    }

    subscribe() {
      this.unsubscribe(); // subscribe to the topic

      this.rosTopic = new ROSLIB__namespace.Topic({
        ros: this.ros,
        name: this.topicName,
        queue_length: 1,
        messageType: 'geometry_msgs/PoseWithCovarianceStamped'
      });
      this.rosTopic.subscribe(this.processMessage.bind(this));
    }

    processMessage(message) {
      if (this.sn !== null) {
        this.sn.unsubscribeTf();
        this.rootObject.remove(this.sn);
      }

      this.options.origin = new THREE.Vector3(message.pose.pose.position.x, message.pose.pose.position.y, message.pose.pose.position.z);
      var rot = new THREE.Quaternion(message.pose.pose.orientation.x, message.pose.pose.orientation.y, message.pose.pose.orientation.z, message.pose.pose.orientation.w);
      this.options.direction = new THREE.Vector3(1, 0, 0);
      this.options.direction.applyQuaternion(rot);
      this.options.material = new THREE.MeshBasicMaterial({
        color: this.color
      });
      var arrow = new Arrow(this.options);
      this.sn = new SceneNode({
        frameID: message.header.frame_id,
        tfClient: this.tfClient,
        object: arrow
      });
      this.rootObject.add(this.sn);
    }

  }
  /**
   * @fileOverview
   * @author David V. Lu!! - davidvlu@gmail.com
   * @author Mathieu Bredif - mathieu.bredif@ign.fr
   */


  class Points extends THREE.Object3D {
    /**
     * A set of points. Used by PointCloud2 and LaserScan.
     *
     * @constructor
     * @param options - object with following keys:
     *
     *  * tfClient - the TF client handle to use
     *  * rootObject (optional) - the root object to add this marker to use for the points.
     *  * max_pts (optional) - number of points to draw (default: 10000)
     *  * pointRatio (optional) - point subsampling ratio (default: 1, no subsampling)
     *  * messageRatio (optional) - message subsampling ratio (default: 1, no subsampling)
     *  * material (optional) - a material object or an option to construct a PointsMaterial.
     *  * colorsrc (optional) - the field to be used for coloring (default: 'rgb')
     *  * colormap (optional) - function that turns the colorsrc field value to a color
     */
    constructor(options) {
      super();
      options = options || {};
      this.tfClient = options.tfClient;
      this.rootObject = options.rootObject || new THREE.Object3D();
      this.max_pts = options.max_pts || 10000;
      this.pointRatio = options.pointRatio || 1;
      this.messageRatio = options.messageRatio || 1;
      this.messageCount = 0;
      this.material = options.material || {};
      this.colorsrc = options.colorsrc;
      this.colormap = options.colormap;

      if ('color' in options || 'size' in options || 'texture' in options) {
        console.warn('toplevel "color", "size" and "texture" options are deprecated.' + 'They should beprovided within a "material" option, e.g. : ' + ' { tfClient, material : { color: mycolor, size: mysize, map: mytexture }, ... }');
      }

      this.sn = null;
    }

    setup(frame, point_step, fields) {
      if (this.sn === null) {
        // turn fields to a map
        fields = fields || [];
        this.fields = {};

        for (var i = 0; i < fields.length; i++) {
          this.fields[fields[i].name] = fields[i];
        }

        this.geom = new THREE.BufferGeometry();
        this.positions = new THREE.BufferAttribute(new Float32Array(this.max_pts * 3), 3, false);
        this.geom.addAttribute('position', this.positions.setDynamic(true));

        if (!this.colorsrc && this.fields.rgb) {
          this.colorsrc = 'rgb';
        }

        if (this.colorsrc) {
          var field = this.fields[this.colorsrc];

          if (field) {
            this.colors = new THREE.BufferAttribute(new Float32Array(this.max_pts * 3), 3, false);
            this.geom.addAttribute('color', this.colors.setDynamic(true));
            var offset = field.offset;
            this.getColor = [function (dv, base, le) {
              return dv.getInt8(base + offset, le);
            }, function (dv, base, le) {
              return dv.getUint8(base + offset, le);
            }, function (dv, base, le) {
              return dv.getInt16(base + offset, le);
            }, function (dv, base, le) {
              return dv.getUint16(base + offset, le);
            }, function (dv, base, le) {
              return dv.getInt32(base + offset, le);
            }, function (dv, base, le) {
              return dv.getUint32(base + offset, le);
            }, function (dv, base, le) {
              return dv.getFloat32(base + offset, le);
            }, function (dv, base, le) {
              return dv.getFloat64(base + offset, le);
            }][field.datatype - 1];

            this.colormap = this.colormap || function (x) {
              return new THREE.Color(x);
            };
          } else {
            console.warn('unavailable field "' + this.colorsrc + '" for coloring.');
          }
        }

        if (!this.material.isMaterial) {
          // if it is an option, apply defaults and pass it to a PointsMaterial
          if (this.colors && this.material.vertexColors === undefined) {
            this.material.vertexColors = THREE.VertexColors;
          }

          this.material = new THREE.PointsMaterial(this.material);
        }

        this.object = new THREE.Points(this.geom, this.material);
        this.sn = new SceneNode({
          frameID: frame,
          tfClient: this.tfClient,
          object: this.object
        });
        this.rootObject.add(this.sn);
      }

      return this.messageCount++ % this.messageRatio === 0;
    }

    update(n) {
      this.geom.setDrawRange(0, n);
      this.positions.needsUpdate = true;
      this.positions.updateRange.count = n * this.positions.itemSize;

      if (this.colors) {
        this.colors.needsUpdate = true;
        this.colors.updateRange.count = n * this.colors.itemSize;
      }
    }

  }
  /**
   * @fileOverview
   * @author David V. Lu!! - davidvlu@gmail.com
   */


  class LaserScan extends THREE.Object3D {
    /**
     * A LaserScan client that listens to a given topic and displays the points.
     *
     * @constructor
     * @param options - object with following keys:
     *
     *  * ros - the ROSLIB.Ros connection handle
     *  * topic - the marker topic to listen to (default '/scan')
     *  * tfClient - the TF client handle to use
     *  * compression (optional) - message compression (default: 'cbor')
     *  * rootObject (optional) - the root object to add this marker to use for the points.
     *  * max_pts (optional) - number of points to draw (default: 10000)
     *  * pointRatio (optional) - point subsampling ratio (default: 1, no subsampling)
     *  * messageRatio (optional) - message subsampling ratio (default: 1, no subsampling)
     *  * material (optional) - a material object or an option to construct a PointsMaterial.
     */
    constructor(options) {
      super();
      options = options || {};
      this.ros = options.ros;
      this.topicName = options.topic || '/scan';
      this.compression = options.compression || 'cbor';
      this.points = new Points(options);
      this.rosTopic = undefined;
      this.subscribe();
    }

    unsubscribe() {
      if (this.rosTopic) {
        this.rosTopic.unsubscribe(this.processMessage);
      }
    }

    subscribe() {
      this.unsubscribe(); // subscribe to the topic

      this.rosTopic = new ROSLIB__namespace.Topic({
        ros: this.ros,
        name: this.topicName,
        compression: this.compression,
        queue_length: 1,
        messageType: 'sensor_msgs/LaserScan'
      });
      this.rosTopic.subscribe(this.processMessage.bind(this));
    }

    processMessage(message) {
      if (!this.points.setup(message.header.frame_id)) {
        return;
      }

      var n = message.ranges.length;
      var j = 0;

      for (var i = 0; i < n; i += this.points.pointRatio) {
        var range = message.ranges[i];

        if (range >= message.range_min && range <= message.range_max) {
          var angle = message.angle_min + i * message.angle_increment;
          this.points.positions.array[j++] = range * Math.cos(angle);
          this.points.positions.array[j++] = range * Math.sin(angle);
          this.points.positions.array[j++] = 0.0;
        }
      }

      this.points.update(j / 3);
    }

  }
  /**
   * @fileOverview
   * @author Mathieu Bredif - mathieu.bredif@ign.fr
   */


  class NavSatFix extends THREE.Object3D {
    /**
     * A NavSatFix client that listens to a given topic and displays a line connecting the gps fixes.
     *
     * @constructor
     * @param options - object with following keys:
     *
     *  * ros - the ROSLIB.Ros connection handle
     *  * topic - the NavSatFix topic to listen to
     *  * rootObject (optional) - the root object to add the trajectory line and the gps marker to
     *  * object3d (optional) - the object3d to be translated by the gps position
     *  * material (optional) - THREE.js material or options passed to a THREE.LineBasicMaterial, such as :
     *    * material.color (optional) - color for line
     *    * material.linewidth (optional) - line width
     *  * altitudeNaN (optional) - default altitude when the message altitude is NaN (default: 0)
     *  * keep (optional) - number of gps fix points to keep (default: 100)
     *  * convert (optional) - conversion function from lon/lat/alt to THREE.Vector3 (default: passthrough)
     */
    constructor(options) {
      super();
      options = options || {};
      this.ros = options.ros;
      this.topicName = options.topic || '/gps/fix';
      this.rootObject = options.rootObject || new THREE.Object3D();
      this.object3d = options.object3d || new THREE.Object3D();
      var material = options.material || {};
      this.altitudeNaN = options.altitudeNaN || 0;
      this.keep = options.keep || 100;

      this.convert = options.convert || function (lon, lat, alt) {
        return new THREE.Vector3(lon, lat, alt);
      };

      this.count = 0;
      this.next1 = 0;
      this.next2 = this.keep;
      this.geom = new THREE.BufferGeometry();
      this.vertices = new THREE.BufferAttribute(new Float32Array(6 * this.keep), 3);
      this.geom.addAttribute('position', this.vertices);
      this.material = material.isMaterial ? material : new THREE.LineBasicMaterial(material);
      this.line = new THREE.Line(this.geom, this.material);
      this.rootObject.add(this.object3d);
      this.rootObject.add(this.line);
      this.rosTopic = undefined;
      this.subscribe();
    }

    unsubscribe() {
      if (this.rosTopic) {
        this.rosTopic.unsubscribe(this.processMessage);
      }
    }

    subscribe() {
      this.unsubscribe(); // subscribe to the topic

      this.rosTopic = new ROSLIB__namespace.Topic({
        ros: this.ros,
        name: this.topicName,
        queue_length: 1,
        messageType: 'sensor_msgs/NavSatFix'
      });
      this.rosTopic.subscribe(this.processMessage.bind(this));
    }

    processMessage(message) {
      var altitude = isNaN(message.altitude) ? this.altitudeNaN : message.altitude;
      var p = this.convert(message.longitude, message.latitude, altitude); // move the object3d to the gps position

      this.object3d.position.copy(p);
      this.object3d.updateMatrixWorld(true); // copy the position twice in the circular buffer
      // the second half replicates the first to allow a single drawRange

      this.vertices.array[3 * this.next1] = p.x;
      this.vertices.array[3 * this.next1 + 1] = p.y;
      this.vertices.array[3 * this.next1 + 2] = p.z;
      this.vertices.array[3 * this.next2] = p.x;
      this.vertices.array[3 * this.next2 + 1] = p.y;
      this.vertices.array[3 * this.next2 + 2] = p.z;
      this.vertices.needsUpdate = true;
      this.next1 = (this.next1 + 1) % this.keep;
      this.next2 = this.next1 + this.keep;
      this.count = Math.min(this.count + 1, this.keep);
      this.geom.setDrawRange(this.next2 - this.count, this.count);
    }

  }
  /**
   * @fileOverview
   * @author David V. Lu!! - davidvlu@gmail.com
   * @author Mathieu Bredif - mathieu.bredif@ign.fr
   */

  /**
   * Decodes the base64-encoded array 'inbytes' into the array 'outbytes'
   * until 'inbytes' is exhausted or 'outbytes' is filled.
   * if 'record_size' is specified, records of length 'record_size' bytes
   * are copied every other 'pointRatio' records.
   * returns the number of decoded records
   */


  function decode64(inbytes, outbytes, record_size, pointRatio) {
    var x,
        b = 0,
        l = 0,
        j = 0,
        L = inbytes.length,
        A = outbytes.length;
    record_size = record_size || A; // default copies everything (no skipping)

    pointRatio = pointRatio || 1; // default copies everything (no skipping)

    var bitskip = (pointRatio - 1) * record_size * 8;

    for (x = 0; x < L && j < A; x++) {
      b = (b << 6) + decode64.e[inbytes.charAt(x)];
      l += 6;

      if (l >= 8) {
        l -= 8;
        outbytes[j++] = b >>> l & 0xff;

        if (j % record_size === 0) {
          // skip records
          // no    optimization: for(var i=0;i<bitskip;x++){l+=6;if(l>=8) {l-=8;i+=8;}}
          // first optimization: for(;l<bitskip;l+=6){x++;} l=l%8;
          x += Math.ceil((bitskip - l) / 6);
          l = l % 8;

          if (l > 0) {
            b = decode64.e[inbytes.charAt(x)];
          }
        }
      }
    }

    return Math.floor(j / record_size);
  } // initialize decoder with static lookup table 'e'


  decode64.S = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  decode64.e = {};

  for (var i = 0; i < 64; i++) {
    decode64.e[decode64.S.charAt(i)] = i;
  }

  class PointCloud2 extends THREE.Object3D {
    /**
     * A PointCloud2 client that listens to a given topic and displays the points.
     *
     * @constructor
     * @param options - object with following keys:
     *
     *  * ros - the ROSLIB.Ros connection handle
     *  * topic - the marker topic to listen to (default: '/points')
     *  * tfClient - the TF client handle to use
     *  * compression (optional) - message compression (default: 'cbor')
     *  * rootObject (optional) - the root object to add this marker to use for the points.
     *  * max_pts (optional) - number of points to draw (default: 10000)
     *  * pointRatio (optional) - point subsampling ratio (default: 1, no subsampling)
     *  * messageRatio (optional) - message subsampling ratio (default: 1, no subsampling)
     *  * material (optional) - a material object or an option to construct a PointsMaterial.
     *  * colorsrc (optional) - the field to be used for coloring (default: 'rgb')
     *  * colormap (optional) - function that turns the colorsrc field value to a color
     */
    constructor(options) {
      super();
      options = options || {};
      this.ros = options.ros;
      this.topicName = options.topic || '/points';
      this.throttle_rate = options.throttle_rate || null;
      this.compression = options.compression || 'cbor';
      this.max_pts = options.max_pts || 10000;
      this.points = new Points(options);
      this.rosTopic = undefined;
      this.buffer = null;
      this.subscribe();
    }

    unsubscribe() {
      if (this.rosTopic) {
        this.rosTopic.unsubscribe(this.processMessage);
      }
    }

    subscribe() {
      this.unsubscribe(); // subscribe to the topic

      this.rosTopic = new ROSLIB__namespace.Topic({
        ros: this.ros,
        name: this.topicName,
        messageType: 'sensor_msgs/PointCloud2',
        throttle_rate: this.throttle_rate,
        queue_length: 1,
        compression: this.compression
      });
      this.rosTopic.subscribe(this.processMessage.bind(this));
    }

    processMessage(msg) {
      if (!this.points.setup(msg.header.frame_id, msg.point_step, msg.fields)) {
        return;
      }

      var n,
          pointRatio = this.points.pointRatio;
      var bufSz = this.max_pts * msg.point_step;

      if (msg.data.buffer) {
        this.buffer = msg.data.slice(0, Math.min(msg.data.byteLength, bufSz));
        n = Math.min(msg.height * msg.width / pointRatio, this.points.positions.array.length / 3);
      } else {
        if (!this.buffer || this.buffer.byteLength < bufSz) {
          this.buffer = new Uint8Array(bufSz);
        }

        n = decode64(msg.data, this.buffer, msg.point_step, pointRatio);
        pointRatio = 1;
      }

      var dv = new DataView(this.buffer.buffer);
      var littleEndian = !msg.is_bigendian;
      var x = this.points.fields.x.offset;
      var y = this.points.fields.y.offset;
      var z = this.points.fields.z.offset;
      var base, color;

      for (var i = 0; i < n; i++) {
        base = i * pointRatio * msg.point_step;
        this.points.positions.array[3 * i] = dv.getFloat32(base + x, littleEndian);
        this.points.positions.array[3 * i + 1] = dv.getFloat32(base + y, littleEndian);
        this.points.positions.array[3 * i + 2] = dv.getFloat32(base + z, littleEndian);

        if (this.points.colors) {
          color = this.points.colormap(this.points.getColor(dv, base, littleEndian));
          this.points.colors.array[3 * i] = color.r;
          this.points.colors.array[3 * i + 1] = color.g;
          this.points.colors.array[3 * i + 2] = color.b;
        }
      }

      this.points.update(n);
    }

  }
  /**
   * @fileOverview
   * @author Jihoon Lee - jihoon.lee@kakaobrain.com
   */


  class TFAxes extends THREE.Object3D {
    /**
     * An Axes node can be used to display the axis of a particular coordinate frame.
     *
     * @constructor
     * @param options - object with following keys:
     *
     *   * frame_id - the frame id to visualize axes
     *   * tfClient - the TF client handle to use
     *   * shaftRadius (optional) - the radius of the shaft to render
     *   * headRadius (optional) - the radius of the head to render
     *   * headLength (optional) - the length of the head to render
     *   * scale (optional) - the scale of the frame (defaults to 1.0)
     *   * lineType (optional) - the line type for the axes. Supported line types:
     *                           'dashed' and 'full'.
     *   * lineDashLength (optional) - the length of the dashes, relative to the length of the axis.
     *                                 Maximum value is 1, which means the dash length is
     *                                 equal to the length of the axis. Parameter only applies when
     *                                 lineType is set to dashed.
     */
    constructor(options) {
      super();
      options = options || {};
      this.frame_id = options.frame_id;
      this.tfClient = options.tfClient;
      this.rootObject = options.rootObject || new THREE.Object3D();
      this.axes = new Axes({
        shaftRadius: options.shaftRadius || 0.025,
        headRadius: options.headRaidus || 0.07,
        headLength: options.headLength || 0.2,
        scale: options.scale || 1.0,
        lineType: options.lineType || 'full',
        lineDashLength: options.lineDashLength || 0.1
      });
      this.sn = new SceneNode({
        frameID: this.frame_id,
        tfClient: this.tfClient,
        object: this.axes
      });
      this.rootObject.add(this.sn);
    }

  }
  /**
   * @fileOverview
   * @author Jihoon Lee - jihoonlee.in@gmail.com
   * @author Russell Toris - rctoris@wpi.edu
   */


  class Urdf extends THREE.Object3D {
    /**
     * A URDF can be used to load a ROSLIB.UrdfModel and its associated models into a 3D object.
     *
     * @constructor
     * @param options - object with following keys:
     *
     *   * urdfModel - the ROSLIB.UrdfModel to load
     *   * tfClient - the TF client handle to use
     *   * path (optional) - the base path to the associated Collada models that will be loaded
     *   * tfPrefix (optional) - the TF prefix to used for multi-robots
     *   * loader (optional) - the Collada loader to use (e.g., an instance of ROS3D.COLLADA_LOADER)
     */
    constructor(options) {
      options = options || {};
      var urdfModel = options.urdfModel;
      var path = options.path || '/';
      var tfClient = options.tfClient;
      var tfPrefix = options.tfPrefix || '';
      var loader = options.loader;

      var defaultColorMaterialFuc = options.defaultColorMaterialFuc || function () {
        return makeColorMaterial(0, 0, 0, 0.8);
      };

      super(); // load all models

      var links = urdfModel.links;

      for (var l in links) {
        var link = links[l];

        for (var i = 0; i < link.visuals.length; i++) {
          var visual = link.visuals[i];

          if (visual && visual.geometry) {
            // Save frameID
            var frameID = tfPrefix + '/' + link.name; // Save color material

            var colorMaterial = null;

            if (visual.material && visual.material.color) {
              var color = visual.material && visual.material.color;
              colorMaterial = makeColorMaterial(color.r, color.g, color.b, color.a);
            } else {
              colorMaterial = defaultColorMaterialFuc();
            }

            if (visual.geometry.type === ROSLIB__namespace.URDF_MESH) {
              var uri = visual.geometry.filename; // strips package://

              var tmpIndex = uri.indexOf('package://');

              if (tmpIndex !== -1) {
                uri = uri.substr(tmpIndex + 'package://'.length);
              }

              var fileType = uri.substr(-3).toLowerCase();

              if (MeshLoader.loaders[fileType]) {
                // create the model
                var mesh = new MeshResource({
                  path: path,
                  resource: uri,
                  loader: loader,
                  material: colorMaterial
                }); // check for a scale

                if (link.visuals[i].geometry.scale) {
                  mesh.scale.copy(visual.geometry.scale);
                } // create a scene node with the model


                var sceneNode = new SceneNode({
                  frameID: frameID,
                  pose: visual.origin,
                  tfClient: tfClient,
                  object: mesh
                });
                sceneNode.name = visual.name;
                this.add(sceneNode);
              } else {
                console.warn('Could not load geometry mesh: ' + uri);
              }
            } else {
              var shapeMesh = this.createShapeMesh(visual, colorMaterial); // Create a scene node with the shape

              var scene = new SceneNode({
                frameID: frameID,
                pose: visual.origin,
                tfClient: tfClient,
                object: shapeMesh
              });
              scene.name = visual.name;
              this.add(scene);
            }
          }
        }
      }
    }

    createShapeMesh(visual, colorMaterial) {
      var shapeMesh; // Create a shape

      switch (visual.geometry.type) {
        case ROSLIB__namespace.URDF_BOX:
          var dimension = visual.geometry.dimension;
          var cube = new THREE.BoxGeometry(dimension.x, dimension.y, dimension.z);
          shapeMesh = new THREE.Mesh(cube, colorMaterial);
          break;

        case ROSLIB__namespace.URDF_CYLINDER:
          var radius = visual.geometry.radius;
          var length = visual.geometry.length;
          var cylinder = new THREE.CylinderGeometry(radius, radius, length, 16, 1, false);
          shapeMesh = new THREE.Mesh(cylinder, colorMaterial);
          shapeMesh.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI * 0.5);
          break;

        case ROSLIB__namespace.URDF_SPHERE:
          var sphere = new THREE.SphereGeometry(visual.geometry.radius, 16);
          shapeMesh = new THREE.Mesh(sphere, colorMaterial);
          break;
      }

      return shapeMesh;
    }

    unsubscribeTf() {
      this.children.forEach(function (n) {
        if (typeof n.unsubscribeTf === 'function') {
          n.unsubscribeTf();
        }
      });
    }

  }
  /**
   * @fileOverview
   * @author Jihoon Lee - jihoonlee.in@gmail.com
   * @author Russell Toris - rctoris@wpi.edu
   */


  class UrdfClient {
    /**
     * A URDF client can be used to load a URDF and its associated models into a 3D object from the ROS
     * parameter server.
     *
     * Emits the following events:
     *
     * * 'change' - emited after the URDF and its meshes have been loaded into the root object
     *
     * @constructor
     * @param options - object with following keys:
     *
     *   * ros - the ROSLIB.Ros connection handle
     *   * param (optional) - the paramter to load the URDF from, like 'robot_description'
     *   * tfClient - the TF client handle to use
     *   * path (optional) - the base path to the associated Collada models that will be loaded
     *   * rootObject (optional) - the root object to add this marker to
     *   * tfPrefix (optional) - the TF prefix to used for multi-robots
     *   * loader (optional) - the Collada loader to use (e.g., an instance of ROS3D.COLLADA_LOADER)
     */
    constructor(options) {
      var that = this;
      options = options || {};
      var ros = options.ros;
      this.param = options.param || 'robot_description';
      this.path = options.path || '/';
      this.tfClient = options.tfClient;
      this.rootObject = options.rootObject || new THREE.Object3D();
      this.tfPrefix = options.tfPrefix || '';
      this.loader = options.loader; // get the URDF value from ROS

      var getParam = new ROSLIB__namespace.Param({
        ros: ros,
        name: this.param
      });
      getParam.get(function (string) {
        // hand off the XML string to the URDF model
        var urdfModel = new ROSLIB__namespace.UrdfModel({
          string: string
        }); // load all models

        that.urdf = new Urdf({
          urdfModel: urdfModel,
          path: that.path,
          tfClient: that.tfClient,
          tfPrefix: that.tfPrefix,
          loader: that.loader
        });
        that.rootObject.add(that.urdf);
      });
    }

  }
  /**
   * @fileOverview
   * @author David Gossow - dgossow@willowgarage.com
   */


  class Highlighter {
    /**
     * A mouseover highlighter for 3D objects in the scene.
     *
     * @constructor
     * @param options - object with following keys:
     *
     *   * mouseHandler - the handler for the mouseover and mouseout events
     */
    constructor(options) {
      options = options || {};
      this.mouseHandler = options.mouseHandler;
      this.hoverObjs = {}; // bind the mouse events

      this.mouseHandler.addEventListener('mouseover', this.onMouseOver.bind(this));
      this.mouseHandler.addEventListener('mouseout', this.onMouseOut.bind(this));
    }

    /**
     * Add the current target of the mouseover to the hover list.
     *
     * @param event - the event that contains the target of the mouseover
     */
    onMouseOver(event) {
      this.hoverObjs[event.currentTarget.uuid] = event.currentTarget;
    }

    /**
     * Remove the current target of the mouseover from the hover list.
     *
     * @param event - the event that contains the target of the mouseout
     */
    onMouseOut(event) {
      var uuid = event.currentTarget.uuid;

      if (uuid in this.hoverObjs) {
        delete this.hoverObjs[uuid];
      }
    }

    /**
     * Render the highlights for all objects that are currently highlighted.
     *
     * This method should be executed after clearing the renderer and
     * rendering the regular scene.
     *
     * @param scene - the current scene, which should contain the highlighted objects (among others)
     * @param renderer - the renderer used to render the scene.
     * @param camera - the scene's camera
     */
    renderHighlights(scene, renderer, camera) {
      // Render highlights by making everything but the highlighted
      // objects invisible...
      this.makeEverythingInvisible(scene);
      this.makeHighlightedVisible(scene); // Providing a transparent overrideMaterial...

      var originalOverrideMaterial = scene.overrideMaterial;
      scene.overrideMaterial = new THREE.MeshBasicMaterial({
        fog: false,
        opacity: 0.5,
        transparent: true,
        depthTest: true,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetUnits: -1,
        side: THREE.DoubleSide
      }); // And then rendering over the regular scene

      renderer.render(scene, camera); // Finally, restore the original overrideMaterial (if any) and
      // object visibility.

      scene.overrideMaterial = originalOverrideMaterial;
      this.restoreVisibility(scene);
    }

    /**
     * Traverses the given object and makes every object that's a Mesh,
     * Line or Sprite invisible. Also saves the previous visibility state
     * so we can restore it later.
     *
     * @param scene - the object to traverse
     */
    makeEverythingInvisible(scene) {
      scene.traverse(function (currentObject) {
        if (currentObject instanceof THREE.Mesh || currentObject instanceof THREE.Line || currentObject instanceof THREE.Sprite) {
          currentObject.previousVisibility = currentObject.visible;
          currentObject.visible = false;
        }
      });
    }

    /**
     * Make the objects in the scene that are currently highlighted (and
     * all of their children!) visible.
     *
     * @param scene - the object to traverse
     */
    makeHighlightedVisible(scene) {
      var makeVisible = function (currentObject) {
        if (currentObject instanceof THREE.Mesh || currentObject instanceof THREE.Line || currentObject instanceof THREE.Sprite) {
          currentObject.visible = true;
        }
      };

      for (var uuid in this.hoverObjs) {
        var selectedObject = this.hoverObjs[uuid]; // Make each selected object and all of its children visible

        selectedObject.visible = true;
        selectedObject.traverse(makeVisible);
      }
    }

    /**
     * Restore the old visibility state that was saved by
     * makeEverythinginvisible.
     *
     * @param scene - the object to traverse
     */
    restoreVisibility(scene) {
      scene.traverse(function (currentObject) {
        if (currentObject.hasOwnProperty('previousVisibility')) {
          currentObject.visible = currentObject.previousVisibility;
        }
      }.bind(this));
    }

  }
  /**
   * @fileOverview
   * @author David Gossow - dgossow@willowgarage.com
   */


  class MouseHandler extends THREE.EventDispatcher {
    /**
     * A handler for mouse events within a 3D viewer.
     *
     * @constructor
     * @param options - object with following keys:
     *
     *   * renderer - the main renderer
     *   * camera - the main camera in the scene
     *   * rootObject - the root object to check for mouse events
     *   * fallbackTarget - the fallback target, e.g., the camera controls
     */
    constructor(options) {
      super();
      this.renderer = options.renderer;
      this.camera = options.camera;
      this.rootObject = options.rootObject;
      this.fallbackTarget = options.fallbackTarget;
      this.lastTarget = this.fallbackTarget;
      this.dragging = false; // listen to DOM events

      var eventNames = ['contextmenu', 'click', 'dblclick', 'mouseout', 'mousedown', 'mouseup', 'mousemove', 'mousewheel', 'DOMMouseScroll', 'touchstart', 'touchend', 'touchcancel', 'touchleave', 'touchmove'];
      this.listeners = {}; // add event listeners for the associated mouse events

      eventNames.forEach(function (eventName) {
        this.listeners[eventName] = this.processDomEvent.bind(this);
        this.renderer.domElement.addEventListener(eventName, this.listeners[eventName], false);
      }, this);
    }

    /**
     * Process the particular DOM even that has occurred based on the mouse's position in the scene.
     *
     * @param domEvent - the DOM event to process
     */
    processDomEvent(domEvent) {
      // don't deal with the default handler
      domEvent.preventDefault(); // compute normalized device coords and 3D mouse ray

      var target = domEvent.target;
      var rect = target.getBoundingClientRect();
      var pos_x, pos_y;

      if (domEvent.type.indexOf('touch') !== -1) {
        pos_x = 0;
        pos_y = 0;

        for (var i = 0; i < domEvent.touches.length; ++i) {
          pos_x += domEvent.touches[i].clientX;
          pos_y += domEvent.touches[i].clientY;
        }

        pos_x /= domEvent.touches.length;
        pos_y /= domEvent.touches.length;
      } else {
        pos_x = domEvent.clientX;
        pos_y = domEvent.clientY;
      }

      var left = pos_x - rect.left - target.clientLeft + target.scrollLeft;
      var top = pos_y - rect.top - target.clientTop + target.scrollTop;
      var deviceX = left / target.clientWidth * 2 - 1;
      var deviceY = -top / target.clientHeight * 2 + 1;
      var mousePos = new THREE.Vector2(deviceX, deviceY);
      var mouseRaycaster = new THREE.Raycaster();
      mouseRaycaster.linePrecision = 0.001;
      mouseRaycaster.setFromCamera(mousePos, this.camera);
      var mouseRay = mouseRaycaster.ray; // make our 3d mouse event

      var event3D = {
        mousePos: mousePos,
        mouseRay: mouseRay,
        domEvent: domEvent,
        camera: this.camera,
        intersection: this.lastIntersection
      }; // if the mouse leaves the dom element, stop everything

      if (domEvent.type === 'mouseout') {
        if (this.dragging) {
          this.notify(this.lastTarget, 'mouseup', event3D);
          this.dragging = false;
        }

        this.notify(this.lastTarget, 'mouseout', event3D);
        this.lastTarget = null;
        return;
      } // if the touch leaves the dom element, stop everything


      if (domEvent.type === 'touchleave' || domEvent.type === 'touchend') {
        if (this.dragging) {
          this.notify(this.lastTarget, 'mouseup', event3D);
          this.dragging = false;
        }

        this.notify(this.lastTarget, 'touchend', event3D);
        this.lastTarget = null;
        return;
      } // while the user is holding the mouse down, stay on the same target


      if (this.dragging) {
        this.notify(this.lastTarget, domEvent.type, event3D); // for check for right or left mouse button

        if (domEvent.type === 'mouseup' && domEvent.button === 2 || domEvent.type === 'click' || domEvent.type === 'touchend') {
          this.dragging = false;
        }

        return;
      } // in the normal case, we need to check what is under the mouse


      target = this.lastTarget;
      var intersections = [];
      intersections = mouseRaycaster.intersectObject(this.rootObject, true);

      if (intersections.length > 0) {
        target = intersections[0].object;
        event3D.intersection = this.lastIntersection = intersections[0];
      } else {
        target = this.fallbackTarget;
      } // if the mouse moves from one object to another (or from/to the 'null' object), notify both


      if (target !== this.lastTarget && domEvent.type.match(/mouse/)) {
        // Event Status. TODO: Make it as enum
        // 0: Accepted
        // 1: Failed
        // 2: Continued
        var eventStatus = this.notify(target, 'mouseover', event3D);

        if (eventStatus === 0) {
          this.notify(this.lastTarget, 'mouseout', event3D);
        } else if (eventStatus === 1) {
          // if target was null or no target has caught our event, fall back
          target = this.fallbackTarget;

          if (target !== this.lastTarget) {
            this.notify(target, 'mouseover', event3D);
            this.notify(this.lastTarget, 'mouseout', event3D);
          }
        }
      } // if the finger moves from one object to another (or from/to the 'null' object), notify both


      if (target !== this.lastTarget && domEvent.type.match(/touch/)) {
        var toucheventAccepted = this.notify(target, domEvent.type, event3D);

        if (toucheventAccepted) {
          this.notify(this.lastTarget, 'touchleave', event3D);
          this.notify(this.lastTarget, 'touchend', event3D);
        } else {
          // if target was null or no target has caught our event, fall back
          target = this.fallbackTarget;

          if (target !== this.lastTarget) {
            this.notify(this.lastTarget, 'touchmove', event3D);
            this.notify(this.lastTarget, 'touchend', event3D);
          }
        }
      } // pass through event


      this.notify(target, domEvent.type, event3D);

      if (domEvent.type === 'mousedown' || domEvent.type === 'touchstart' || domEvent.type === 'touchmove') {
        this.dragging = true;
      }

      this.lastTarget = target;
    }

    /**
     * Notify the listener of the type of event that occurred.
     *
     * @param target - the target of the event
     * @param type - the type of event that occurred
     * @param event3D - the 3D mouse even information
     * @returns if an event was canceled
     */
    notify(target, type, event3D) {
      // ensure the type is set
      //
      event3D.type = type; // make the event cancelable

      event3D.cancelBubble = false;
      event3D.continueBubble = false;

      event3D.stopPropagation = function () {
        event3D.cancelBubble = true;
      }; // it hit the selectable object but don't highlight


      event3D.continuePropagation = function () {
        event3D.continueBubble = true;
      }; // walk up graph until event is canceled or root node has been reached


      event3D.currentTarget = target;

      while (event3D.currentTarget) {
        // try to fire event on object
        if (event3D.currentTarget.dispatchEvent && event3D.currentTarget.dispatchEvent instanceof Function) {
          event3D.currentTarget.dispatchEvent(event3D);

          if (event3D.cancelBubble) {
            this.dispatchEvent(event3D);
            return 0; // Event Accepted
          } else if (event3D.continueBubble) {
            return 2; // Event Continued
          }
        } // walk up


        event3D.currentTarget = event3D.currentTarget.parent;
      }

      return 1; // Event Failed
    }

  }
  /**
   * @fileOverview
   * @author David Gossow - dgossow@willowgarage.com
   * @author Xueqiao Xu - xueqiaoxu@gmail.com
   * @author Mr.doob - http://mrdoob.com
   * @author AlteredQualia - http://alteredqualia.com
   */


  class OrbitControls extends THREE.EventDispatcher {
    /**
     * Behaves like THREE.OrbitControls, but uses right-handed coordinates and z as up vector.
     *
     * @constructor
     * @param scene - the global scene to use
     * @param camera - the camera to use
     * @param userZoomSpeed (optional) - the speed for zooming
     * @param userRotateSpeed (optional) - the speed for rotating
     * @param autoRotate (optional) - if the orbit should auto rotate
     * @param autoRotateSpeed (optional) - the speed for auto rotating
     * @param displayPanAndZoomFrame - whether to display a frame when panning/zooming
     *                                 (defaults to true)
     * @param lineTypePanAndZoomFrame - line type for the frame that is displayed when
     *                                  panning/zooming. Only has effect when
     *                                  displayPanAndZoomFrame is set to true.
     */
    constructor(options) {
      super();
      var that = this;
      options = options || {};
      var scene = options.scene;
      this.camera = options.camera;
      this.center = new THREE.Vector3();
      this.userZoom = true;
      this.userZoomSpeed = options.userZoomSpeed || 1.0;
      this.userRotate = true;
      this.userRotateSpeed = options.userRotateSpeed || 1.0;
      this.autoRotate = options.autoRotate;
      this.autoRotateSpeed = options.autoRotateSpeed || 2.0;
      this.displayPanAndZoomFrame = options.displayPanAndZoomFrame === undefined ? true : !!options.displayPanAndZoomFrame;
      this.lineTypePanAndZoomFrame = options.dashedPanAndZoomFrame || 'full'; // In ROS, z is pointing upwards

      this.camera.up = new THREE.Vector3(0, 0, 1); // internals

      var pixelsPerRound = 1800;
      var touchMoveThreshold = 10;
      var rotateStart = new THREE.Vector2();
      var rotateEnd = new THREE.Vector2();
      var rotateDelta = new THREE.Vector2();
      var zoomStart = new THREE.Vector2();
      var zoomEnd = new THREE.Vector2();
      var zoomDelta = new THREE.Vector2();
      var moveStartCenter = new THREE.Vector3();
      var moveStartNormal = new THREE.Vector3();
      var moveStartPosition = new THREE.Vector3();
      var moveStartIntersection = new THREE.Vector3();
      var touchStartPosition = new Array(2);
      var touchMoveVector = new Array(2);
      this.phiDelta = 0;
      this.thetaDelta = 0;
      this.scale = 1;
      this.lastPosition = new THREE.Vector3(); // internal states

      var STATE = {
        NONE: -1,
        ROTATE: 0,
        ZOOM: 1,
        MOVE: 2
      };
      var state = STATE.NONE;
      this.axes = new Axes({
        shaftRadius: 0.025,
        headRadius: 0.07,
        headLength: 0.2,
        lineType: this.lineTypePanAndZoomFrame
      });

      if (this.displayPanAndZoomFrame) {
        // initially not visible
        scene.add(this.axes);
        this.axes.traverse(function (obj) {
          obj.visible = false;
        });
      }
      /**
       * Handle the mousedown 3D event.
       *
       * @param event3D - the 3D event to handle
       */


      function onMouseDown(event3D) {
        var event = event3D.domEvent;
        event.preventDefault();

        switch (event.button) {
          case 0:
            state = STATE.ROTATE;
            rotateStart.set(event.clientX, event.clientY);
            break;

          case 1:
            state = STATE.MOVE;
            moveStartNormal = new THREE.Vector3(0, 0, 1);
            var rMat = new THREE.Matrix4().extractRotation(this.camera.matrix);
            moveStartNormal.applyMatrix4(rMat);
            moveStartCenter = that.center.clone();
            moveStartPosition = that.camera.position.clone();
            moveStartIntersection = intersectViewPlane(event3D.mouseRay, moveStartCenter, moveStartNormal);
            break;

          case 2:
            state = STATE.ZOOM;
            zoomStart.set(event.clientX, event.clientY);
            break;
        }

        this.showAxes();
      }
      /**
       * Handle the mousemove 3D event.
       *
       * @param event3D - the 3D event to handle
       */


      function onMouseMove(event3D) {
        var event = event3D.domEvent;

        if (state === STATE.ROTATE) {
          rotateEnd.set(event.clientX, event.clientY);
          rotateDelta.subVectors(rotateEnd, rotateStart);
          that.rotateLeft(2 * Math.PI * rotateDelta.x / pixelsPerRound * that.userRotateSpeed);
          that.rotateUp(2 * Math.PI * rotateDelta.y / pixelsPerRound * that.userRotateSpeed);
          rotateStart.copy(rotateEnd);
          this.showAxes();
        } else if (state === STATE.ZOOM) {
          zoomEnd.set(event.clientX, event.clientY);
          zoomDelta.subVectors(zoomEnd, zoomStart);

          if (zoomDelta.y > 0) {
            that.zoomIn();
          } else {
            that.zoomOut();
          }

          zoomStart.copy(zoomEnd);
          this.showAxes();
        } else if (state === STATE.MOVE) {
          var intersection = intersectViewPlane(event3D.mouseRay, that.center, moveStartNormal);

          if (!intersection) {
            return;
          }

          var delta = new THREE.Vector3().subVectors(moveStartIntersection.clone(), intersection.clone());
          that.center.addVectors(moveStartCenter.clone(), delta.clone());
          that.camera.position.addVectors(moveStartPosition.clone(), delta.clone());
          that.update();
          that.camera.updateMatrixWorld();
          this.showAxes();
        }
      }
      /**
       * Used to track the movement during camera movement.
       *
       * @param mouseRay - the mouse ray to intersect with
       * @param planeOrigin - the origin of the plane
       * @param planeNormal - the normal of the plane
       * @returns the intersection
       */


      function intersectViewPlane(mouseRay, planeOrigin, planeNormal) {
        var vector = new THREE.Vector3();
        var intersection = new THREE.Vector3();
        vector.subVectors(planeOrigin, mouseRay.origin);
        var dot = mouseRay.direction.dot(planeNormal); // bail if ray and plane are parallel

        if (Math.abs(dot) < mouseRay.precision) {
          return null;
        } // calc distance to plane


        var scalar = planeNormal.dot(vector) / dot;
        intersection = mouseRay.direction.clone().multiplyScalar(scalar);
        return intersection;
      }
      /**
       * Handle the mouseup 3D event.
       *
       * @param event3D - the 3D event to handle
       */


      function onMouseUp(event3D) {
        if (!that.userRotate) {
          return;
        }

        state = STATE.NONE;
      }
      /**
       * Handle the mousewheel 3D event.
       *
       * @param event3D - the 3D event to handle
       */


      function onMouseWheel(event3D) {
        if (!that.userZoom) {
          return;
        }

        var event = event3D.domEvent; // wheelDelta --> Chrome, detail --> Firefox

        var delta;

        if (typeof event.wheelDelta !== 'undefined') {
          delta = event.wheelDelta;
        } else {
          delta = -event.detail;
        }

        if (delta > 0) {
          that.zoomIn();
        } else {
          that.zoomOut();
        }

        this.showAxes();
      }
      /**
       * Handle the touchdown 3D event.
       *
       * @param event3D - the 3D event to handle
       */


      function onTouchDown(event3D) {
        var event = event3D.domEvent;

        switch (event.touches.length) {
          case 1:
            state = STATE.ROTATE;
            rotateStart.set(event.touches[0].pageX - window.scrollX, event.touches[0].pageY - window.scrollY);
            break;

          case 2:
            state = STATE.NONE;
            /* ready for move */

            moveStartNormal = new THREE.Vector3(0, 0, 1);
            var rMat = new THREE.Matrix4().extractRotation(this.camera.matrix);
            moveStartNormal.applyMatrix4(rMat);
            moveStartCenter = that.center.clone();
            moveStartPosition = that.camera.position.clone();
            moveStartIntersection = intersectViewPlane(event3D.mouseRay, moveStartCenter, moveStartNormal);
            touchStartPosition[0] = new THREE.Vector2(event.touches[0].pageX, event.touches[0].pageY);
            touchStartPosition[1] = new THREE.Vector2(event.touches[1].pageX, event.touches[1].pageY);
            touchMoveVector[0] = new THREE.Vector2(0, 0);
            touchMoveVector[1] = new THREE.Vector2(0, 0);
            break;
        }

        this.showAxes();
        event.preventDefault();
      }
      /**
       * Handle the touchmove 3D event.
       *
       * @param event3D - the 3D event to handle
       */


      function onTouchMove(event3D) {
        var event = event3D.domEvent;

        if (state === STATE.ROTATE) {
          rotateEnd.set(event.touches[0].pageX - window.scrollX, event.touches[0].pageY - window.scrollY);
          rotateDelta.subVectors(rotateEnd, rotateStart);
          that.rotateLeft(2 * Math.PI * rotateDelta.x / pixelsPerRound * that.userRotateSpeed);
          that.rotateUp(2 * Math.PI * rotateDelta.y / pixelsPerRound * that.userRotateSpeed);
          rotateStart.copy(rotateEnd);
          this.showAxes();
        } else {
          touchMoveVector[0].set(touchStartPosition[0].x - event.touches[0].pageX, touchStartPosition[0].y - event.touches[0].pageY);
          touchMoveVector[1].set(touchStartPosition[1].x - event.touches[1].pageX, touchStartPosition[1].y - event.touches[1].pageY);

          if (touchMoveVector[0].lengthSq() > touchMoveThreshold && touchMoveVector[1].lengthSq() > touchMoveThreshold) {
            touchStartPosition[0].set(event.touches[0].pageX, event.touches[0].pageY);
            touchStartPosition[1].set(event.touches[1].pageX, event.touches[1].pageY);

            if (touchMoveVector[0].dot(touchMoveVector[1]) > 0 && state !== STATE.ZOOM) {
              state = STATE.MOVE;
            } else if (touchMoveVector[0].dot(touchMoveVector[1]) < 0 && state !== STATE.MOVE) {
              state = STATE.ZOOM;
            }

            if (state === STATE.ZOOM) {
              var tmpVector = new THREE.Vector2();
              tmpVector.subVectors(touchStartPosition[0], touchStartPosition[1]);

              if (touchMoveVector[0].dot(tmpVector) < 0 && touchMoveVector[1].dot(tmpVector) > 0) {
                that.zoomOut();
              } else if (touchMoveVector[0].dot(tmpVector) > 0 && touchMoveVector[1].dot(tmpVector) < 0) {
                that.zoomIn();
              }
            }
          }

          if (state === STATE.MOVE) {
            var intersection = intersectViewPlane(event3D.mouseRay, that.center, moveStartNormal);

            if (!intersection) {
              return;
            }

            var delta = new THREE.Vector3().subVectors(moveStartIntersection.clone(), intersection.clone());
            that.center.addVectors(moveStartCenter.clone(), delta.clone());
            that.camera.position.addVectors(moveStartPosition.clone(), delta.clone());
            that.update();
            that.camera.updateMatrixWorld();
          }

          this.showAxes();
          event.preventDefault();
        }
      }

      function onTouchEnd(event3D) {
        var event = event3D.domEvent;

        if (event.touches.length === 1 && state !== STATE.ROTATE) {
          state = STATE.ROTATE;
          rotateStart.set(event.touches[0].pageX - window.scrollX, event.touches[0].pageY - window.scrollY);
        } else {
          state = STATE.NONE;
        }
      } // add event listeners


      this.addEventListener('mousedown', onMouseDown);
      this.addEventListener('mouseup', onMouseUp);
      this.addEventListener('mousemove', onMouseMove);
      this.addEventListener('touchstart', onTouchDown);
      this.addEventListener('touchmove', onTouchMove);
      this.addEventListener('touchend', onTouchEnd); // Chrome/Firefox have different events here

      this.addEventListener('mousewheel', onMouseWheel);
      this.addEventListener('DOMMouseScroll', onMouseWheel);
    }

    /**
     * Display the main axes for 1 second.
     */
    showAxes() {
      var that = this;
      this.axes.traverse(function (obj) {
        obj.visible = true;
      });

      if (this.hideTimeout) {
        clearTimeout(this.hideTimeout);
      }

      this.hideTimeout = setTimeout(function () {
        that.axes.traverse(function (obj) {
          obj.visible = false;
        });
        that.hideTimeout = false;
      }, 1000);
    }

    /**
     * Rotate the camera to the left by the given angle.
     *
     * @param angle (optional) - the angle to rotate by
     */
    rotateLeft(angle) {
      if (angle === undefined) {
        angle = 2 * Math.PI / 60 / 60 * this.autoRotateSpeed;
      }

      this.thetaDelta -= angle;
    }

    /**
     * Rotate the camera to the right by the given angle.
     *
     * @param angle (optional) - the angle to rotate by
     */
    rotateRight(angle) {
      if (angle === undefined) {
        angle = 2 * Math.PI / 60 / 60 * this.autoRotateSpeed;
      }

      this.thetaDelta += angle;
    }

    /**
     * Rotate the camera up by the given angle.
     *
     * @param angle (optional) - the angle to rotate by
     */
    rotateUp(angle) {
      if (angle === undefined) {
        angle = 2 * Math.PI / 60 / 60 * this.autoRotateSpeed;
      }

      this.phiDelta -= angle;
    }

    /**
     * Rotate the camera down by the given angle.
     *
     * @param angle (optional) - the angle to rotate by
     */
    rotateDown(angle) {
      if (angle === undefined) {
        angle = 2 * Math.PI / 60 / 60 * this.autoRotateSpeed;
      }

      this.phiDelta += angle;
    }

    /**
     * Zoom in by the given scale.
     *
     * @param zoomScale (optional) - the scale to zoom in by
     */
    zoomIn(zoomScale) {
      if (zoomScale === undefined) {
        zoomScale = Math.pow(0.95, this.userZoomSpeed);
      }

      this.scale /= zoomScale;
    }

    /**
     * Zoom out by the given scale.
     *
     * @param zoomScale (optional) - the scale to zoom in by
     */
    zoomOut(zoomScale) {
      if (zoomScale === undefined) {
        zoomScale = Math.pow(0.95, this.userZoomSpeed);
      }

      this.scale *= zoomScale;
    }

    /**
     * Update the camera to the current settings.
     */
    update() {
      // x->y, y->z, z->x
      var position = this.camera.position;
      var offset = position.clone().sub(this.center); // angle from z-axis around y-axis

      var theta = Math.atan2(offset.y, offset.x); // angle from y-axis

      var phi = Math.atan2(Math.sqrt(offset.y * offset.y + offset.x * offset.x), offset.z);

      if (this.autoRotate) {
        this.rotateLeft(2 * Math.PI / 60 / 60 * this.autoRotateSpeed);
      }

      theta += this.thetaDelta;
      phi += this.phiDelta; // restrict phi to be between EPS and PI-EPS

      var eps = 0.000001;
      phi = Math.max(eps, Math.min(Math.PI - eps, phi));
      var radius = offset.length();
      offset.set(radius * Math.sin(phi) * Math.cos(theta), radius * Math.sin(phi) * Math.sin(theta), radius * Math.cos(phi));
      offset.multiplyScalar(this.scale);
      position.copy(this.center).add(offset);
      this.camera.lookAt(this.center);
      radius = offset.length();
      this.axes.position.copy(this.center);
      this.axes.scale.set(radius * 0.05, radius * 0.05, radius * 0.05);
      this.axes.updateMatrixWorld(true);
      this.thetaDelta = 0;
      this.phiDelta = 0;
      this.scale = 1;

      if (this.lastPosition.distanceTo(this.camera.position) > 0) {
        this.dispatchEvent({
          type: 'change'
        });
        this.lastPosition.copy(this.camera.position);
      }
    }

  }
  /**
   * @fileOverview
   * @author David Gossow - dgossow@willowgarage.com
   * @author Russell Toris - rctoris@wpi.edu
   * @author Jihoon Lee - jihoonlee.in@gmail.com
   */


  class Viewer {
    /**
     * A Viewer can be used to render an interactive 3D scene to a HTML5 canvas.
     *
     * @constructor
     * @param options - object with following keys:
     *
     *  * divID - the ID of the div to place the viewer in
     *  * elem - the elem to place the viewer in (overrides divID if provided)
     *  * width - the initial width, in pixels, of the canvas
     *  * height - the initial height, in pixels, of the canvas
     *  * background (optional) - the color to render the background, like '#efefef'
     *  * alpha (optional) - the alpha of the background
     *  * antialias (optional) - if antialiasing should be used
     *  * intensity (optional) - the lighting intensity setting to use
     *  * cameraPosition (optional) - the starting position of the camera
     *  * displayPanAndZoomFrame (optional) - whether to display a frame when
     *  *                                     panning/zooming. Defaults to true.
     *  * lineTypePanAndZoomFrame - line type for the frame that is displayed when
     *  *                           panning/zooming. Only has effect when
     *  *                           displayPanAndZoomFrame is set to true.
     */
    constructor(options) {
      options = options || {};
      var divID = options.divID;
      var elem = options.elem;
      var width = options.width;
      var height = options.height;
      var background = options.background || '#111111';
      var antialias = options.antialias;
      var intensity = options.intensity || 0.66;
      var near = options.near || 0.01;
      var far = options.far || 1000;
      var alpha = options.alpha || 1.0;
      var cameraPosition = options.cameraPose || {
        x: 3,
        y: 3,
        z: 3
      };
      var cameraZoomSpeed = options.cameraZoomSpeed || 0.5;
      var displayPanAndZoomFrame = options.displayPanAndZoomFrame === undefined ? true : !!options.displayPanAndZoomFrame;
      var lineTypePanAndZoomFrame = options.lineTypePanAndZoomFrame || 'full'; // create the canvas to render to

      this.renderer = new THREE.WebGLRenderer({
        antialias: antialias,
        alpha: true
      });
      this.renderer.setClearColor(parseInt(background.replace('#', '0x'), 16), alpha);
      this.renderer.sortObjects = false;
      this.renderer.setSize(width, height);
      this.renderer.shadowMap.enabled = false;
      this.renderer.autoClear = false; // create the global scene

      this.scene = new THREE.Scene(); // create the global camera

      this.camera = new THREE.PerspectiveCamera(40, width / height, near, far);
      this.camera.position.x = cameraPosition.x;
      this.camera.position.y = cameraPosition.y;
      this.camera.position.z = cameraPosition.z; // add controls to the camera

      this.cameraControls = new OrbitControls({
        scene: this.scene,
        camera: this.camera,
        displayPanAndZoomFrame: displayPanAndZoomFrame,
        lineTypePanAndZoomFrame: lineTypePanAndZoomFrame
      });
      this.cameraControls.userZoomSpeed = cameraZoomSpeed; // lights

      this.scene.add(new THREE.AmbientLight(0x555555));
      this.directionalLight = new THREE.DirectionalLight(0xffffff, intensity);
      this.scene.add(this.directionalLight); // propagates mouse events to three.js objects

      this.selectableObjects = new THREE.Group();
      this.scene.add(this.selectableObjects);
      var mouseHandler = new MouseHandler({
        renderer: this.renderer,
        camera: this.camera,
        rootObject: this.selectableObjects,
        fallbackTarget: this.cameraControls
      }); // highlights the receiver of mouse events

      this.highlighter = new Highlighter({
        mouseHandler: mouseHandler
      });
      this.stopped = true;
      this.animationRequestId = undefined; // add the renderer to the page

      var node = elem || document.getElementById(divID);
      node.appendChild(this.renderer.domElement); // begin the render loop

      this.start();
    }

    /**
     *  Start the render loop
     */
    start() {
      this.stopped = false;
      this.draw();
    }

    /**
     * Renders the associated scene to the viewer.
     */
    draw() {
      if (this.stopped) {
        // Do nothing if stopped
        return;
      } // update the controls


      this.cameraControls.update(); // put light to the top-left of the camera
      // BUG: position is a read-only property of DirectionalLight,
      // attempting to assign to it either does nothing or throws an error.
      //this.directionalLight.position = this.camera.localToWorld(new THREE.Vector3(-1, 1, 0));

      this.directionalLight.position.normalize(); // set the scene

      this.renderer.clear(true, true, true);
      this.renderer.render(this.scene, this.camera);
      this.highlighter.renderHighlights(this.scene, this.renderer, this.camera); // draw the frame

      this.animationRequestId = requestAnimationFrame(this.draw.bind(this));
    }

    /**
     *  Stop the render loop
     */
    stop() {
      if (!this.stopped) {
        // Stop animation render loop
        cancelAnimationFrame(this.animationRequestId);
      }

      this.stopped = true;
    }

    /**
     * Add the given THREE Object3D to the global scene in the viewer.
     *
     * @param object - the THREE Object3D to add
     * @param selectable (optional) - if the object should be added to the selectable list
     */
    addObject(object, selectable) {
      if (selectable) {
        this.selectableObjects.add(object);
      } else {
        this.scene.add(object);
      }
    }

    /**
     * Resize 3D viewer
     *
     * @param width - new width value
     * @param height - new height value
     */
    resize(width, height) {
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    }

  }

  exports.Arrow = Arrow;
  exports.Arrow2 = Arrow2;
  exports.Axes = Axes;
  exports.ColorOcTree = ColorOcTree;
  exports.DepthCloud = DepthCloud;
  exports.Grid = Grid;
  exports.Highlighter = Highlighter;
  exports.INTERACTIVE_MARKER_BUTTON = INTERACTIVE_MARKER_BUTTON;
  exports.INTERACTIVE_MARKER_BUTTON_CLICK = INTERACTIVE_MARKER_BUTTON_CLICK;
  exports.INTERACTIVE_MARKER_FIXED = INTERACTIVE_MARKER_FIXED;
  exports.INTERACTIVE_MARKER_INHERIT = INTERACTIVE_MARKER_INHERIT;
  exports.INTERACTIVE_MARKER_KEEP_ALIVE = INTERACTIVE_MARKER_KEEP_ALIVE;
  exports.INTERACTIVE_MARKER_MENU = INTERACTIVE_MARKER_MENU;
  exports.INTERACTIVE_MARKER_MENU_SELECT = INTERACTIVE_MARKER_MENU_SELECT;
  exports.INTERACTIVE_MARKER_MOUSE_DOWN = INTERACTIVE_MARKER_MOUSE_DOWN;
  exports.INTERACTIVE_MARKER_MOUSE_UP = INTERACTIVE_MARKER_MOUSE_UP;
  exports.INTERACTIVE_MARKER_MOVE_3D = INTERACTIVE_MARKER_MOVE_3D;
  exports.INTERACTIVE_MARKER_MOVE_AXIS = INTERACTIVE_MARKER_MOVE_AXIS;
  exports.INTERACTIVE_MARKER_MOVE_PLANE = INTERACTIVE_MARKER_MOVE_PLANE;
  exports.INTERACTIVE_MARKER_MOVE_ROTATE = INTERACTIVE_MARKER_MOVE_ROTATE;
  exports.INTERACTIVE_MARKER_MOVE_ROTATE_3D = INTERACTIVE_MARKER_MOVE_ROTATE_3D;
  exports.INTERACTIVE_MARKER_NONE = INTERACTIVE_MARKER_NONE;
  exports.INTERACTIVE_MARKER_POSE_UPDATE = INTERACTIVE_MARKER_POSE_UPDATE;
  exports.INTERACTIVE_MARKER_ROTATE_3D = INTERACTIVE_MARKER_ROTATE_3D;
  exports.INTERACTIVE_MARKER_ROTATE_AXIS = INTERACTIVE_MARKER_ROTATE_AXIS;
  exports.INTERACTIVE_MARKER_VIEW_FACING = INTERACTIVE_MARKER_VIEW_FACING;
  exports.InteractiveMarker = InteractiveMarker;
  exports.InteractiveMarkerClient = InteractiveMarkerClient;
  exports.InteractiveMarkerControl = InteractiveMarkerControl;
  exports.InteractiveMarkerHandle = InteractiveMarkerHandle;
  exports.InteractiveMarkerMenu = InteractiveMarkerMenu;
  exports.LaserScan = LaserScan;
  exports.MARKER_ARROW = MARKER_ARROW;
  exports.MARKER_CUBE = MARKER_CUBE;
  exports.MARKER_CUBE_LIST = MARKER_CUBE_LIST;
  exports.MARKER_CYLINDER = MARKER_CYLINDER;
  exports.MARKER_LINE_LIST = MARKER_LINE_LIST;
  exports.MARKER_LINE_STRIP = MARKER_LINE_STRIP;
  exports.MARKER_MESH_RESOURCE = MARKER_MESH_RESOURCE;
  exports.MARKER_POINTS = MARKER_POINTS;
  exports.MARKER_SPHERE = MARKER_SPHERE;
  exports.MARKER_SPHERE_LIST = MARKER_SPHERE_LIST;
  exports.MARKER_TEXT_VIEW_FACING = MARKER_TEXT_VIEW_FACING;
  exports.MARKER_TRIANGLE_LIST = MARKER_TRIANGLE_LIST;
  exports.Marker = Marker;
  exports.MarkerArrayClient = MarkerArrayClient;
  exports.MarkerClient = MarkerClient;
  exports.MeshLoader = MeshLoader;
  exports.MeshResource = MeshResource;
  exports.MouseHandler = MouseHandler;
  exports.NavSatFix = NavSatFix;
  exports.OcTree = OcTree;
  exports.OcTreeClient = OcTreeClient;
  exports.OccupancyGrid = OccupancyGrid;
  exports.OccupancyGridClient = OccupancyGridClient;
  exports.Odometry = Odometry;
  exports.OrbitControls = OrbitControls;
  exports.Path = Path;
  exports.Point = Point;
  exports.PointCloud2 = PointCloud2;
  exports.Points = Points;
  exports.Polygon = Polygon;
  exports.Pose = Pose;
  exports.PoseArray = PoseArray;
  exports.PoseWithCovariance = PoseWithCovariance;
  exports.SceneNode = SceneNode;
  exports.TFAxes = TFAxes;
  exports.TriangleList = TriangleList;
  exports.Urdf = Urdf;
  exports.UrdfClient = UrdfClient;
  exports.Viewer = Viewer;
  exports.closestAxisPoint = closestAxisPoint;
  exports.findClosestPoint = findClosestPoint;
  exports.intersectPlane = intersectPlane;
  exports.makeColorMaterial = makeColorMaterial;
  Object.defineProperty(exports, '__esModule', {
    value: true
  });
  return exports;
}({}, THREE, ROSLIB, EventEmitter2);