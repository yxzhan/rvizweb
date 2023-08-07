var ROS3D = function (e, t, s, i) {
  "use strict";

  function r(e) {
    return e && "object" == typeof e && "default" in e ? e : {
      default: e
    };
  }

  function o(e) {
    if (e && e.__esModule) return e;
    var t = Object.create(null);
    return e && Object.keys(e).forEach(function (s) {
      if ("default" !== s) {
        var i = Object.getOwnPropertyDescriptor(e, s);
        Object.defineProperty(t, s, i.get ? i : {
          enumerable: !0,
          get: function () {
            return e[s];
          }
        });
      }
    }), t.default = e, Object.freeze(t);
  }

  var a = o(t),
      n = o(s),
      c = r(i),
      h = Object.assign({}, a),
      l = function (e, t, s, i) {
    var r = new h.Color();
    return r.setRGB(e, t, s), i <= .99 ? new h.MeshBasicMaterial({
      color: r.getHex(),
      opacity: i + .1,
      transparent: !0,
      depthWrite: !0,
      blendSrc: h.SrcAlphaFactor,
      blendDst: h.OneMinusSrcAlphaFactor,
      blendEquation: h.ReverseSubtractEquation,
      blending: h.NormalBlending
    }) : new h.MeshPhongMaterial({
      color: r.getHex(),
      opacity: i,
      blending: h.NormalBlending
    });
  },
      d = function (e, t, s) {
    var i = new h.Vector3(),
        r = new h.Vector3();
    i.subVectors(t, e.origin);
    var o = e.direction.dot(s);

    if (!(Math.abs(o) < e.precision)) {
      var a = s.dot(i) / o;
      return r.addVectors(e.origin, e.direction.clone().multiplyScalar(a)), r;
    }
  },
      u = function (e, t) {
    var s = new h.Vector3();
    s.subVectors(e.origin, t.origin);
    var i = t.direction.clone(),
        r = e.direction.clone(),
        o = s.dot(i),
        a = i.dot(r),
        n = s.dot(r),
        c = i.dot(i),
        l = r.dot(r) * c - a * a;
    if (!(Math.abs(l) <= 1e-4)) return (o * a - n * c) / l;
  },
      p = function (e, t, s) {
    var i = e.origin.clone();
    i.project(t);
    var r = e.direction.clone().add(e.origin);
    r.project(t);
    var o = r.clone().sub(i),
        a = new h.Vector2().subVectors(s, i).dot(o) / o.dot(o),
        n = new h.Vector2();
    n.addVectors(i, o.clone().multiplyScalar(a));
    var c = new h.Vector3(n.x, n.y, .5);
    c.unproject(t);
    var l = new h.Ray(t.position, c.sub(t.position).normalize());
    return u(e, l);
  };

  class m extends h.Object3D {
    constructor(e) {
      super(), e = e || {}, this.url = e.url, this.streamType = e.streamType || "vp8", this.f = e.f || 526, this.maxDepthPerTile = e.maxDepthPerTile || 1, this.pointSize = e.pointSize || 3, this.width = e.width || 1024, this.height = e.height || 1024, this.resolutionFactor = Math.max(this.width, this.height) / 1024, this.whiteness = e.whiteness || 0, this.varianceThreshold = e.varianceThreshold || 16667e-9, this.isMjpeg = "mjpeg" === this.streamType.toLowerCase(), this.video = document.createElement(this.isMjpeg ? "img" : "video"), this.video.crossOrigin = "Anonymous", this.video.addEventListener(this.isMjpeg ? "load" : "loadedmetadata", this.metaLoaded.bind(this), !1), this.isMjpeg || (this.video.loop = !0), this.video.src = this.url, this.video.setAttribute("crossorigin", "Anonymous"), this.vertex_shader = ["uniform sampler2D map;", "", "uniform float width;", "uniform float height;", "uniform float nearClipping, farClipping;", "", "uniform float pointSize;", "uniform float zOffset;", "", "uniform float focallength;", "uniform float maxDepthPerTile;", "uniform float resolutionFactor;", "", "varying vec2 vUvP;", "varying vec2 colorP;", "", "varying float depthVariance;", "varying float maskVal;", "", "float sampleDepth(vec2 pos)", "  {", "    float depth;", "    ", "    vec2 vUv = vec2( pos.x / (width*2.0), pos.y / (height*2.0)+0.5 );", "    vec2 vUv2 = vec2( pos.x / (width*2.0)+0.5, pos.y / (height*2.0)+0.5 );", "    ", "    vec4 depthColor = texture2D( map, vUv );", "    ", "    depth = ( depthColor.r + depthColor.g + depthColor.b ) / 3.0 ;", "    ", "    if (depth>0.99)", "    {", "      vec4 depthColor2 = texture2D( map, vUv2 );", "      float depth2 = ( depthColor2.r + depthColor2.g + depthColor2.b ) / 3.0 ;", "      depth = 0.99+depth2;", "    }", "    ", "    return depth;", "  }", "", "float median(float a, float b, float c)", "  {", "    float r=a;", "    ", "    if ( (a<b) && (b<c) )", "    {", "      r = b;", "    }", "    if ( (a<c) && (c<b) )", "    {", "      r = c;", "    }", "    return r;", "  }", "", "float variance(float d1, float d2, float d3, float d4, float d5, float d6, float d7, float d8, float d9)", "  {", "    float mean = (d1 + d2 + d3 + d4 + d5 + d6 + d7 + d8 + d9) / 9.0;", "    float t1 = (d1-mean);", "    float t2 = (d2-mean);", "    float t3 = (d3-mean);", "    float t4 = (d4-mean);", "    float t5 = (d5-mean);", "    float t6 = (d6-mean);", "    float t7 = (d7-mean);", "    float t8 = (d8-mean);", "    float t9 = (d9-mean);", "    float v = (t1*t1+t2*t2+t3*t3+t4*t4+t5*t5+t6*t6+t7*t7+t8*t8+t9*t9)/9.0;", "    return v;", "  }", "", "vec2 decodeDepth(vec2 pos)", "  {", "    vec2 ret;", "    ", "    ", "    float depth1 = sampleDepth(vec2(position.x-1.0, position.y-1.0));", "    float depth2 = sampleDepth(vec2(position.x, position.y-1.0));", "    float depth3 = sampleDepth(vec2(position.x+1.0, position.y-1.0));", "    float depth4 = sampleDepth(vec2(position.x-1.0, position.y));", "    float depth5 = sampleDepth(vec2(position.x, position.y));", "    float depth6 = sampleDepth(vec2(position.x+1.0, position.y));", "    float depth7 = sampleDepth(vec2(position.x-1.0, position.y+1.0));", "    float depth8 = sampleDepth(vec2(position.x, position.y+1.0));", "    float depth9 = sampleDepth(vec2(position.x+1.0, position.y+1.0));", "    ", "    float median1 = median(depth1, depth2, depth3);", "    float median2 = median(depth4, depth5, depth6);", "    float median3 = median(depth7, depth8, depth9);", "    ", "    ret.x = median(median1, median2, median3);", "    ret.y = variance(depth1, depth2, depth3, depth4, depth5, depth6, depth7, depth8, depth9);", "    ", "    return ret;", "    ", "  }", "", "", "void main() {", "  ", "  vUvP = vec2( position.x / (width*2.0), position.y / (height*2.0)+0.5 );", "  colorP = vec2( position.x / (width*2.0)+0.5 , position.y / (height*2.0)  );", "  ", "  vec4 pos = vec4(0.0,0.0,0.0,0.0);", "  depthVariance = 0.0;", "  ", "  if ( (vUvP.x<0.0)|| (vUvP.x>0.5) || (vUvP.y<0.5) || (vUvP.y>0.0))", "  {", "    vec2 smp = decodeDepth(vec2(position.x, position.y));", "    float depth = smp.x;", "    depthVariance = smp.y;", "    ", "    float z = -depth;", "    ", "    pos = vec4(", "      ( position.x / width - 0.5 ) * z * 0.5 * maxDepthPerTile * resolutionFactor * (1000.0/focallength) * -1.0,", "      ( position.y / height - 0.5 ) * z * 0.5 * maxDepthPerTile * resolutionFactor * (1000.0/focallength),", "      (- z + zOffset / 1000.0) * maxDepthPerTile,", "      1.0);", "    ", "    vec2 maskP = vec2( position.x / (width*2.0), position.y / (height*2.0)  );", "    vec4 maskColor = texture2D( map, maskP );", "    maskVal = ( maskColor.r + maskColor.g + maskColor.b ) / 3.0 ;", "  }", "  ", "  gl_PointSize = pointSize;", "  gl_Position = projectionMatrix * modelViewMatrix * pos;", "  ", "}"].join("\n"), this.fragment_shader = ["uniform sampler2D map;", "uniform float varianceThreshold;", "uniform float whiteness;", "", "varying vec2 vUvP;", "varying vec2 colorP;", "", "varying float depthVariance;", "varying float maskVal;", "", "", "void main() {", "  ", "  vec4 color;", "  ", "  if ( (depthVariance>varianceThreshold) || (maskVal>0.5) ||(vUvP.x<0.0)|| (vUvP.x>0.5) || (vUvP.y<0.5) || (vUvP.y>1.0))", "  {  ", "    discard;", "  }", "  else ", "  {", "    color = texture2D( map, colorP );", "    ", "    float fader = whiteness /100.0;", "    ", "    color.r = color.r * (1.0-fader)+ fader;", "    ", "    color.g = color.g * (1.0-fader)+ fader;", "    ", "    color.b = color.b * (1.0-fader)+ fader;", "    ", "    color.a = 1.0;//smoothstep( 20000.0, -20000.0, gl_FragCoord.z / gl_FragCoord.w );", "  }", "  ", "  gl_FragColor = vec4( color.r, color.g, color.b, color.a );", "  ", "}"].join("\n");
    }

    metaLoaded() {
      this.metaLoaded = !0, this.initStreamer();
    }

    initStreamer() {
      if (this.metaLoaded) {
        this.texture = new h.Texture(this.video), this.geometry = new h.Geometry();

        for (var e = 0, t = this.width * this.height; e < t; e++) {
          var s = new h.Vector3();
          s.x = e % this.width, s.y = Math.floor(e / this.width), this.geometry.vertices.push(s);
        }

        this.material = new h.ShaderMaterial({
          uniforms: {
            map: {
              type: "t",
              value: this.texture
            },
            width: {
              type: "f",
              value: this.width
            },
            height: {
              type: "f",
              value: this.height
            },
            focallength: {
              type: "f",
              value: this.f
            },
            pointSize: {
              type: "f",
              value: this.pointSize
            },
            zOffset: {
              type: "f",
              value: 0
            },
            whiteness: {
              type: "f",
              value: this.whiteness
            },
            varianceThreshold: {
              type: "f",
              value: this.varianceThreshold
            },
            maxDepthPerTile: {
              type: "f",
              value: this.maxDepthPerTile
            },
            resolutionFactor: {
              type: "f",
              value: this.resolutionFactor
            }
          },
          vertexShader: this.vertex_shader,
          fragmentShader: this.fragment_shader
        }), this.mesh = new h.ParticleSystem(this.geometry, this.material), this.mesh.position.x = 0, this.mesh.position.y = 0, this.add(this.mesh);
        var i = this;
        setInterval(function () {
          (i.isMjpeg || i.video.readyState === i.video.HAVE_ENOUGH_DATA) && (i.texture.needsUpdate = !0);
        }, 1e3 / 30);
      }
    }

    startStream() {
      this.isMjpeg || this.video.play();
    }

    stopStream() {
      this.isMjpeg || this.video.pause();
    }

  }

  class f extends h.Mesh {
    constructor(e) {
      var t = (e = e || {}).origin || new h.Vector3(0, 0, 0),
          s = e.direction || new h.Vector3(1, 0, 0),
          i = e.length || 1,
          r = e.headLength || .2,
          o = e.shaftDiameter || .05,
          a = e.headDiameter || .1,
          n = e.material || new h.MeshBasicMaterial(),
          c = i - r,
          l = new h.CylinderGeometry(.5 * o, .5 * o, c, 12, 1),
          d = new h.Matrix4();
      d.setPosition(new h.Vector3(0, .5 * c, 0)), l.applyMatrix(d);
      var u = new h.CylinderGeometry(0, .5 * a, r, 12, 1);
      d.setPosition(new h.Vector3(0, c + .5 * r, 0)), u.applyMatrix(d), l.merge(u), super(l, n), this.position.copy(t), this.setDirection(s);
    }

    setDirection(e) {
      var t = new h.Vector3();
      0 === e.x && 0 === e.z ? t.set(1, 0, 0) : t.set(0, 1, 0).cross(e);
      var s = Math.acos(new h.Vector3(0, 1, 0).dot(e.clone().normalize()));
      this.matrix = new h.Matrix4().makeRotationAxis(t.normalize(), s), this.rotation.setFromRotationMatrix(this.matrix, this.rotation.order);
    }

    setLength(e) {
      this.scale.set(e, e, e);
    }

    setColor(e) {
      this.material.color.setHex(e);
    }

    dispose() {
      void 0 !== this.geometry && this.geometry.dispose(), void 0 !== this.material && this.material.dispose();
    }

  }

  h.STLLoader = function (e) {
    this.manager = void 0 !== e ? e : h.DefaultLoadingManager;
  }, h.STLLoader.prototype = {
    constructor: h.STLLoader,
    load: function (e, t, s, i) {
      var r = this,
          o = new h.FileLoader(r.manager);
      o.setResponseType("arraybuffer"), o.load(e, function (e) {
        t(r.parse(e));
      }, s, i);
    },
    parse: function (e) {
      var t = function (e) {
        if ("string" == typeof e) {
          for (var t = new Uint8Array(e.length), s = 0; s < e.length; s++) t[s] = 255 & e.charCodeAt(s);

          return t.buffer || t;
        }

        return e;
      }(e);

      return function (e) {
        var t;
        if (50, 84 + 50 * (t = new DataView(e)).getUint32(80, !0) === t.byteLength) return !0;

        for (var s = [115, 111, 108, 105, 100], i = 0; i < 5; i++) if (s[i] != t.getUint8(i, !1)) return !0;

        return !1;
      }(t) ? function (e) {
        for (var t, s, i, r, o, a, n, c, l = new DataView(e), d = l.getUint32(80, !0), u = !1, p = 0; p < 70; p++) 1129270351 == l.getUint32(p, !1) && 82 == l.getUint8(p + 4) && 61 == l.getUint8(p + 5) && (u = !0, r = [], o = l.getUint8(p + 6) / 255, a = l.getUint8(p + 7) / 255, n = l.getUint8(p + 8) / 255, c = l.getUint8(p + 9) / 255);

        for (var m = new h.BufferGeometry(), f = [], v = [], g = 0; g < d; g++) {
          var b = 84 + 50 * g,
              y = l.getFloat32(b, !0),
              w = l.getFloat32(b + 4, !0),
              x = l.getFloat32(b + 8, !0);

          if (u) {
            var T = l.getUint16(b + 48, !0);
            0 == (32768 & T) ? (t = (31 & T) / 31, s = (T >> 5 & 31) / 31, i = (T >> 10 & 31) / 31) : (t = o, s = a, i = n);
          }

          for (var M = 1; M <= 3; M++) {
            var C = b + 12 * M;
            f.push(l.getFloat32(C, !0)), f.push(l.getFloat32(C + 4, !0)), f.push(l.getFloat32(C + 8, !0)), v.push(y, w, x), u && r.push(t, s, i);
          }
        }

        return m.addAttribute("position", new h.BufferAttribute(new Float32Array(f), 3)), m.addAttribute("normal", new h.BufferAttribute(new Float32Array(v), 3)), u && (m.addAttribute("color", new h.BufferAttribute(new Float32Array(r), 3)), m.hasColors = !0, m.alpha = c), m;
      }(t) : function (e) {
        for (var t, s = new h.BufferGeometry(), i = /facet([\s\S]*?)endfacet/g, r = 0, o = /[\s]+([+-]?(?:\d+.\d+|\d+.|\d+|.\d+)(?:[eE][+-]?\d+)?)/.source, a = new RegExp("vertex" + o + o + o, "g"), n = new RegExp("normal" + o + o + o, "g"), c = [], l = [], d = new h.Vector3(); null !== (t = i.exec(e));) {
          for (var u = 0, p = 0, m = t[0]; null !== (t = n.exec(m));) d.x = parseFloat(t[1]), d.y = parseFloat(t[2]), d.z = parseFloat(t[3]), p++;

          for (; null !== (t = a.exec(m));) c.push(parseFloat(t[1]), parseFloat(t[2]), parseFloat(t[3])), l.push(d.x, d.y, d.z), u++;

          1 !== p && console.error("THREE.STLLoader: Something isn't right with the normal of face number " + r), 3 !== u && console.error("THREE.STLLoader: Something isn't right with the vertices of face number " + r), r++;
        }

        return s.addAttribute("position", new h.Float32BufferAttribute(c, 3)), s.addAttribute("normal", new h.Float32BufferAttribute(l, 3)), s;
      }(function (e) {
        if ("string" != typeof e) {
          var t = new Uint8Array(e);
          if (void 0 !== window.TextDecoder) return new TextDecoder().decode(t);

          for (var s = "", i = 0, r = e.byteLength; i < r; i++) s += String.fromCharCode(t[i]);

          return s;
        }

        return e;
      }(e));
    }
  };
  var v = /^[og]\s*(.+)?/,
      g = /^mtllib /,
      b = /^usemtl /;

  function y() {
    var e = {
      objects: [],
      object: {},
      vertices: [],
      normals: [],
      colors: [],
      uvs: [],
      materialLibraries: [],
      startObject: function (e, t) {
        if (this.object && !1 === this.object.fromDeclaration) return this.object.name = e, void (this.object.fromDeclaration = !1 !== t);
        var s = this.object && "function" == typeof this.object.currentMaterial ? this.object.currentMaterial() : void 0;

        if (this.object && "function" == typeof this.object._finalize && this.object._finalize(!0), this.object = {
          name: e || "",
          fromDeclaration: !1 !== t,
          geometry: {
            vertices: [],
            normals: [],
            colors: [],
            uvs: []
          },
          materials: [],
          smooth: !0,
          startMaterial: function (e, t) {
            var s = this._finalize(!1);

            s && (s.inherited || s.groupCount <= 0) && this.materials.splice(s.index, 1);
            var i = {
              index: this.materials.length,
              name: e || "",
              mtllib: Array.isArray(t) && t.length > 0 ? t[t.length - 1] : "",
              smooth: void 0 !== s ? s.smooth : this.smooth,
              groupStart: void 0 !== s ? s.groupEnd : 0,
              groupEnd: -1,
              groupCount: -1,
              inherited: !1,
              clone: function (e) {
                var t = {
                  index: "number" == typeof e ? e : this.index,
                  name: this.name,
                  mtllib: this.mtllib,
                  smooth: this.smooth,
                  groupStart: 0,
                  groupEnd: -1,
                  groupCount: -1,
                  inherited: !1
                };
                return t.clone = this.clone.bind(t), t;
              }
            };
            return this.materials.push(i), i;
          },
          currentMaterial: function () {
            if (this.materials.length > 0) return this.materials[this.materials.length - 1];
          },
          _finalize: function (e) {
            var t = this.currentMaterial();
            if (t && -1 === t.groupEnd && (t.groupEnd = this.geometry.vertices.length / 3, t.groupCount = t.groupEnd - t.groupStart, t.inherited = !1), e && this.materials.length > 1) for (var s = this.materials.length - 1; s >= 0; s--) this.materials[s].groupCount <= 0 && this.materials.splice(s, 1);
            return e && 0 === this.materials.length && this.materials.push({
              name: "",
              smooth: this.smooth
            }), t;
          }
        }, s && s.name && "function" == typeof s.clone) {
          var i = s.clone(0);
          i.inherited = !0, this.object.materials.push(i);
        }

        this.objects.push(this.object);
      },
      finalize: function () {
        this.object && "function" == typeof this.object._finalize && this.object._finalize(!0);
      },
      parseVertexIndex: function (e, t) {
        var s = parseInt(e, 10);
        return 3 * (s >= 0 ? s - 1 : s + t / 3);
      },
      parseNormalIndex: function (e, t) {
        var s = parseInt(e, 10);
        return 3 * (s >= 0 ? s - 1 : s + t / 3);
      },
      parseUVIndex: function (e, t) {
        var s = parseInt(e, 10);
        return 2 * (s >= 0 ? s - 1 : s + t / 2);
      },
      addVertex: function (e, t, s) {
        var i = this.vertices,
            r = this.object.geometry.vertices;
        r.push(i[e + 0], i[e + 1], i[e + 2]), r.push(i[t + 0], i[t + 1], i[t + 2]), r.push(i[s + 0], i[s + 1], i[s + 2]);
      },
      addVertexPoint: function (e) {
        var t = this.vertices;
        this.object.geometry.vertices.push(t[e + 0], t[e + 1], t[e + 2]);
      },
      addVertexLine: function (e) {
        var t = this.vertices;
        this.object.geometry.vertices.push(t[e + 0], t[e + 1], t[e + 2]);
      },
      addNormal: function (e, t, s) {
        var i = this.normals,
            r = this.object.geometry.normals;
        r.push(i[e + 0], i[e + 1], i[e + 2]), r.push(i[t + 0], i[t + 1], i[t + 2]), r.push(i[s + 0], i[s + 1], i[s + 2]);
      },
      addColor: function (e, t, s) {
        var i = this.colors,
            r = this.object.geometry.colors;
        r.push(i[e + 0], i[e + 1], i[e + 2]), r.push(i[t + 0], i[t + 1], i[t + 2]), r.push(i[s + 0], i[s + 1], i[s + 2]);
      },
      addUV: function (e, t, s) {
        var i = this.uvs,
            r = this.object.geometry.uvs;
        r.push(i[e + 0], i[e + 1]), r.push(i[t + 0], i[t + 1]), r.push(i[s + 0], i[s + 1]);
      },
      addUVLine: function (e) {
        var t = this.uvs;
        this.object.geometry.uvs.push(t[e + 0], t[e + 1]);
      },
      addFace: function (e, t, s, i, r, o, a, n, c) {
        var h = this.vertices.length,
            l = this.parseVertexIndex(e, h),
            d = this.parseVertexIndex(t, h),
            u = this.parseVertexIndex(s, h);

        if (this.addVertex(l, d, u), void 0 !== i && "" !== i) {
          var p = this.uvs.length;
          l = this.parseUVIndex(i, p), d = this.parseUVIndex(r, p), u = this.parseUVIndex(o, p), this.addUV(l, d, u);
        }

        if (void 0 !== a && "" !== a) {
          var m = this.normals.length;
          l = this.parseNormalIndex(a, m), d = a === n ? l : this.parseNormalIndex(n, m), u = a === c ? l : this.parseNormalIndex(c, m), this.addNormal(l, d, u);
        }

        this.colors.length > 0 && this.addColor(l, d, u);
      },
      addPointGeometry: function (e) {
        this.object.geometry.type = "Points";

        for (var t = this.vertices.length, s = 0, i = e.length; s < i; s++) this.addVertexPoint(this.parseVertexIndex(e[s], t));
      },
      addLineGeometry: function (e, t) {
        this.object.geometry.type = "Line";

        for (var s = this.vertices.length, i = this.uvs.length, r = 0, o = e.length; r < o; r++) this.addVertexLine(this.parseVertexIndex(e[r], s));

        var a = 0;

        for (o = t.length; a < o; a++) this.addUVLine(this.parseUVIndex(t[a], i));
      }
    };
    return e.startObject("", !1), e;
  }

  h.OBJLoader = function (e) {
    this.manager = void 0 !== e ? e : h.DefaultLoadingManager, this.materials = null;
  }, h.OBJLoader.prototype = {
    constructor: h.OBJLoader,
    load: function (e, t, s, i) {
      var r = this,
          o = new h.FileLoader(r.manager);
      o.setPath(this.path), o.load(e, function (e) {
        t(r.parse(e));
      }, s, i);
    },
    setPath: function (e) {
      return this.path = e, this;
    },
    setMaterials: function (e) {
      return this.materials = e, this;
    },
    parse: function (e) {
      console.time("OBJLoader");
      var t = new y();
      -1 !== e.indexOf("\r\n") && (e = e.replace(/\r\n/g, "\n")), -1 !== e.indexOf("\\\n") && (e = e.replace(/\\\n/g, ""));

      for (var s = e.split("\n"), i = "", r = "", o = [], a = "function" == typeof "".trimLeft, n = 0, c = s.length; n < c; n++) if (i = s[n], 0 !== (i = a ? i.trimLeft() : i.trim()).length && "#" !== (r = i.charAt(0))) if ("v" === r) {
        var l = i.split(/\s+/);

        switch (l[0]) {
          case "v":
            t.vertices.push(parseFloat(l[1]), parseFloat(l[2]), parseFloat(l[3])), 8 === l.length && t.colors.push(parseFloat(l[4]), parseFloat(l[5]), parseFloat(l[6]));
            break;

          case "vn":
            t.normals.push(parseFloat(l[1]), parseFloat(l[2]), parseFloat(l[3]));
            break;

          case "vt":
            t.uvs.push(parseFloat(l[1]), parseFloat(l[2]));
        }
      } else if ("f" === r) {
        for (var d = i.substr(1).trim().split(/\s+/), u = [], p = 0, m = d.length; p < m; p++) {
          var f = d[p];

          if (f.length > 0) {
            var w = f.split("/");
            u.push(w);
          }
        }

        var x = u[0];

        for (p = 1, m = u.length - 1; p < m; p++) {
          var T = u[p],
              M = u[p + 1];
          t.addFace(x[0], T[0], M[0], x[1], T[1], M[1], x[2], T[2], M[2]);
        }
      } else if ("l" === r) {
        var C = i.substring(1).trim().split(" "),
            E = [],
            _ = [];
        if (-1 === i.indexOf("/")) E = C;else for (var k = 0, A = C.length; k < A; k++) {
          var N = C[k].split("/");
          "" !== N[0] && E.push(N[0]), "" !== N[1] && _.push(N[1]);
        }
        t.addLineGeometry(E, _);
      } else if ("p" === r) {
        var O = i.substr(1).trim().split(" ");
        t.addPointGeometry(O);
      } else if (null !== (o = v.exec(i))) {
        var L = (" " + o[0].substr(1).trim()).substr(1);
        t.startObject(L);
      } else if (b.test(i)) t.object.startMaterial(i.substring(7).trim(), t.materialLibraries);else if (g.test(i)) t.materialLibraries.push(i.substring(7).trim());else {
        if ("s" !== r) {
          if ("\0" === i) continue;
          throw new Error('THREE.OBJLoader: Unexpected line: "' + i + '"');
        }

        if ((o = i.split(" ")).length > 1) {
          var j = o[1].trim().toLowerCase();
          t.object.smooth = "0" !== j && "off" !== j;
        } else t.object.smooth = !0;

        (W = t.object.currentMaterial()) && (W.smooth = t.object.smooth);
      }

      t.finalize();
      var R = new h.Object3D();
      R.materialLibraries = [].concat(t.materialLibraries);

      for (n = 0, c = t.objects.length; n < c; n++) {
        var D = t.objects[n],
            S = D.geometry,
            I = D.materials,
            P = "Line" === S.type,
            V = "Points" === S.type,
            F = !1;

        if (0 !== S.vertices.length) {
          var B = new h.BufferGeometry();
          B.addAttribute("position", new h.Float32BufferAttribute(S.vertices, 3)), S.normals.length > 0 ? B.addAttribute("normal", new h.Float32BufferAttribute(S.normals, 3)) : B.computeVertexNormals(), S.colors.length > 0 && (F = !0, B.addAttribute("color", new h.Float32BufferAttribute(S.colors, 3))), S.uvs.length > 0 && B.addAttribute("uv", new h.Float32BufferAttribute(S.uvs, 2));

          for (var z, U = [], G = 0, H = I.length; G < H; G++) {
            var q = I[G],
                W = void 0;
            if (null !== this.materials) if (W = this.materials.create(q.name), !P || !W || W instanceof h.LineBasicMaterial) {
              if (V && W && !(W instanceof h.PointsMaterial)) {
                var K = new h.PointsMaterial({
                  size: 10,
                  sizeAttenuation: !1
                });
                h.Material.prototype.copy.call(K, W), K.color.copy(W.color), K.map = W.map, K.lights = !1, W = K;
              }
            } else {
              var Y = new h.LineBasicMaterial();
              h.Material.prototype.copy.call(Y, W), Y.color.copy(W.color), Y.lights = !1, W = Y;
            }
            W || ((W = P ? new h.LineBasicMaterial() : V ? new h.PointsMaterial({
              size: 1,
              sizeAttenuation: !1
            }) : new h.MeshPhongMaterial()).name = q.name), W.flatShading = !q.smooth, W.vertexColors = F ? h.VertexColors : h.NoColors, U.push(W);
          }

          if (U.length > 1) {
            for (G = 0, H = I.length; G < H; G++) {
              q = I[G];
              B.addGroup(q.groupStart, q.groupCount, G);
            }

            z = P ? new h.LineSegments(B, U) : V ? new h.Points(B, U) : new h.Mesh(B, U);
          } else z = P ? new h.LineSegments(B, U[0]) : V ? new h.Points(B, U[0]) : new h.Mesh(B, U[0]);

          z.name = D.name, R.add(z);
        }
      }

      return console.timeEnd("OBJLoader"), R;
    }
  }, h.MTLLoader = function (e) {
    this.manager = void 0 !== e ? e : h.DefaultLoadingManager;
  }, h.MTLLoader.prototype = {
    constructor: h.MTLLoader,
    crossOrigin: "anonymous",
    load: function (e, t, s, i) {
      var r = this,
          o = void 0 === this.path ? h.LoaderUtils.extractUrlBase(e) : this.path,
          a = new h.FileLoader(this.manager);
      a.setPath(this.path), a.load(e, function (e) {
        t(r.parse(e, o));
      }, s, i);
    },
    setPath: function (e) {
      return this.path = e, this;
    },
    setResourcePath: function (e) {
      return this.resourcePath = e, this;
    },
    setTexturePath: function (e) {
      return console.warn("THREE.MTLLoader: .setTexturePath() has been renamed to .setResourcePath()."), this.setResourcePath(e);
    },
    setCrossOrigin: function (e) {
      return this.crossOrigin = e, this;
    },
    setMaterialOptions: function (e) {
      return this.materialOptions = e, this;
    },
    parse: function (e, t) {
      for (var s = e.split("\n"), i = {}, r = /\s+/, o = {}, a = 0; a < s.length; a++) {
        var n = s[a];

        if (0 !== (n = n.trim()).length && "#" !== n.charAt(0)) {
          var c = n.indexOf(" "),
              l = c >= 0 ? n.substring(0, c) : n;
          l = l.toLowerCase();
          var d = c >= 0 ? n.substring(c + 1) : "";
          if (d = d.trim(), "newmtl" === l) i = {
            name: d
          }, o[d] = i;else if ("ka" === l || "kd" === l || "ks" === l || "ke" === l) {
            var u = d.split(r, 3);
            i[l] = [parseFloat(u[0]), parseFloat(u[1]), parseFloat(u[2])];
          } else i[l] = d;
        }
      }

      var p = new h.MTLLoader.MaterialCreator(this.resourcePath || t, this.materialOptions);
      return p.setCrossOrigin(this.crossOrigin), p.setManager(this.manager), p.setMaterials(o), p;
    }
  }, h.MTLLoader.MaterialCreator = function (e, t) {
    this.baseUrl = e || "", this.options = t, this.materialsInfo = {}, this.materials = {}, this.materialsArray = [], this.nameLookup = {}, this.side = this.options && this.options.side ? this.options.side : h.FrontSide, this.wrap = this.options && this.options.wrap ? this.options.wrap : h.RepeatWrapping;
  }, h.MTLLoader.MaterialCreator.prototype = {
    constructor: h.MTLLoader.MaterialCreator,
    crossOrigin: "anonymous",
    setCrossOrigin: function (e) {
      return this.crossOrigin = e, this;
    },
    setManager: function (e) {
      this.manager = e;
    },
    setMaterials: function (e) {
      this.materialsInfo = this.convert(e), this.materials = {}, this.materialsArray = [], this.nameLookup = {};
    },
    convert: function (e) {
      if (!this.options) return e;
      var t = {};

      for (var s in e) {
        var i = e[s],
            r = {};

        for (var o in t[s] = r, i) {
          var a = !0,
              n = i[o],
              c = o.toLowerCase();

          switch (c) {
            case "kd":
            case "ka":
            case "ks":
              this.options && this.options.normalizeRGB && (n = [n[0] / 255, n[1] / 255, n[2] / 255]), this.options && this.options.ignoreZeroRGBs && 0 === n[0] && 0 === n[1] && 0 === n[2] && (a = !1);
          }

          a && (r[c] = n);
        }
      }

      return t;
    },
    preload: function () {
      for (var e in this.materialsInfo) this.create(e);
    },
    getIndex: function (e) {
      return this.nameLookup[e];
    },
    getAsArray: function () {
      var e = 0;

      for (var t in this.materialsInfo) this.materialsArray[e] = this.create(t), this.nameLookup[t] = e, e++;

      return this.materialsArray;
    },
    create: function (e) {
      return void 0 === this.materials[e] && this.createMaterial_(e), this.materials[e];
    },
    createMaterial_: function (e) {
      var t = this,
          s = this.materialsInfo[e],
          i = {
        name: e,
        side: this.side
      };

      function r(e, s) {
        if (!i[e]) {
          var r,
              o,
              a = t.getTextureParams(s, i),
              n = t.loadTexture((r = t.baseUrl, "string" != typeof (o = a.url) || "" === o ? "" : /^https?:\/\//i.test(o) ? o : r + o));
          n.repeat.copy(a.scale), n.offset.copy(a.offset), n.wrapS = t.wrap, n.wrapT = t.wrap, i[e] = n;
        }
      }

      for (var o in s) {
        var a,
            n = s[o];
        if ("" !== n) switch (o.toLowerCase()) {
          case "kd":
            i.color = new h.Color().fromArray(n);
            break;

          case "ks":
            i.specular = new h.Color().fromArray(n);
            break;

          case "ke":
            i.emissive = new h.Color().fromArray(n);
            break;

          case "map_kd":
            r("map", n);
            break;

          case "map_ks":
            r("specularMap", n);
            break;

          case "map_ke":
            r("emissiveMap", n);
            break;

          case "norm":
            r("normalMap", n);
            break;

          case "map_bump":
          case "bump":
            r("bumpMap", n);
            break;

          case "map_d":
            r("alphaMap", n), i.transparent = !0;
            break;

          case "ns":
            i.shininess = parseFloat(n);
            break;

          case "d":
            (a = parseFloat(n)) < 1 && (i.opacity = a, i.transparent = !0);
            break;

          case "tr":
            a = parseFloat(n), this.options && this.options.invertTrProperty && (a = 1 - a), a > 0 && (i.opacity = 1 - a, i.transparent = !0);
        }
      }

      return this.materials[e] = new h.MeshPhongMaterial(i), this.materials[e];
    },
    getTextureParams: function (e, t) {
      var s,
          i = {
        scale: new h.Vector2(1, 1),
        offset: new h.Vector2(0, 0)
      },
          r = e.split(/\s+/);
      return (s = r.indexOf("-bm")) >= 0 && (t.bumpScale = parseFloat(r[s + 1]), r.splice(s, 2)), (s = r.indexOf("-s")) >= 0 && (i.scale.set(parseFloat(r[s + 1]), parseFloat(r[s + 2])), r.splice(s, 4)), (s = r.indexOf("-o")) >= 0 && (i.offset.set(parseFloat(r[s + 1]), parseFloat(r[s + 2])), r.splice(s, 4)), i.url = r.join(" ").trim(), i;
    },
    loadTexture: function (e, t, s, i, r) {
      var o,
          a = h.Loader.Handlers.get(e),
          n = void 0 !== this.manager ? this.manager : h.DefaultLoadingManager;
      return null === a && (a = new h.TextureLoader(n)), a.setCrossOrigin && a.setCrossOrigin(this.crossOrigin), o = a.load(e, s, i, r), void 0 !== t && (o.mapping = t), o;
    }
  }, h.ColladaLoader = function (e) {
    this.manager = void 0 !== e ? e : h.DefaultLoadingManager;
  }, h.ColladaLoader.prototype = {
    constructor: h.ColladaLoader,
    crossOrigin: "Anonymous",
    load: function (e, t, s, i) {
      var r = this,
          o = h.Loader.prototype.extractUrlBase(e);
      new h.FileLoader(r.manager).load(e, function (e) {
        t(r.parse(e, o));
      }, s, i);
    },
    options: {
      set convertUpAxis(e) {
        console.warn("THREE.ColladaLoader: options.convertUpAxis() has been removed. Up axis is converted automatically.");
      }

    },
    setCrossOrigin: function (e) {
      this.crossOrigin = e;
    },
    parse: function (e, t) {
      function s(e, t) {
        for (var s = [], i = e.childNodes, r = 0, o = i.length; r < o; r++) {
          var a = i[r];
          a.nodeName === t && s.push(a);
        }

        return s;
      }

      function i(e) {
        if (0 === e.length) return [];

        for (var t = e.trim().split(/\s+/), s = new Array(t.length), i = 0, r = t.length; i < r; i++) s[i] = t[i];

        return s;
      }

      function r(e) {
        if (0 === e.length) return [];

        for (var t = e.trim().split(/\s+/), s = new Array(t.length), i = 0, r = t.length; i < r; i++) s[i] = parseFloat(t[i]);

        return s;
      }

      function o(e) {
        if (0 === e.length) return [];

        for (var t = e.trim().split(/\s+/), s = new Array(t.length), i = 0, r = t.length; i < r; i++) s[i] = parseInt(t[i]);

        return s;
      }

      function a(e) {
        return e.substring(1);
      }

      function n(e) {
        return 0 === Object.keys(e).length;
      }

      function c(e) {
        return void 0 !== e ? parseFloat(e.getAttribute("meter")) : 1;
      }

      function l(e) {
        return void 0 !== e ? e.textContent : "Y_UP";
      }

      function d(e, t, i, r) {
        var o = s(e, t)[0];
        if (void 0 !== o) for (var a = s(o, i), n = 0; n < a.length; n++) r(a[n]);
      }

      function u(e, t) {
        for (var s in e) {
          e[s].build = t(e[s]);
        }
      }

      function p(e, t) {
        return void 0 !== e.build || (e.build = t(e)), e.build;
      }

      function m(e) {
        for (var t = {
          inputs: {}
        }, s = 0, i = e.childNodes.length; s < i; s++) {
          var r = e.childNodes[s];

          if (1 === r.nodeType && "input" === r.nodeName) {
            var o = a(r.getAttribute("source")),
                n = r.getAttribute("semantic");
            t.inputs[n] = o;
          }
        }

        return t;
      }

      function f(e) {
        var t = {},
            s = e.getAttribute("target").split("/"),
            i = s.shift(),
            r = s.shift(),
            o = -1 !== r.indexOf("("),
            n = -1 !== r.indexOf(".");
        if (n) s = r.split("."), r = s.shift(), t.member = s.shift();else if (o) {
          var c = r.split("(");
          r = c.shift();

          for (var h = 0; h < c.length; h++) c[h] = parseInt(c[h].replace(/\)/, ""));

          t.indices = c;
        }
        return t.id = i, t.sid = r, t.arraySyntax = o, t.memberSyntax = n, t.sampler = a(e.getAttribute("source")), t;
      }

      function v(e) {
        var t = [],
            s = e.channels,
            i = e.samplers,
            r = e.sources;

        for (var o in s) if (s.hasOwnProperty(o)) {
          var a = s[o],
              n = i[a.sampler],
              c = n.inputs.INPUT,
              h = n.inputs.OUTPUT;
          T(b(a, r[c], r[h]), t);
        }

        return t;
      }

      function g(e) {
        return p(Pe.animations[e], v);
      }

      function b(e, t, s) {
        var i,
            r,
            o,
            a,
            n,
            c,
            h = Pe.nodes[e.id],
            l = _e(h.id),
            d = h.transforms[e.sid],
            u = h.matrix.clone().transpose(),
            p = {};

        switch (d) {
          case "matrix":
            for (o = 0, a = t.array.length; o < a; o++) if (i = t.array[o], r = o * s.stride, void 0 === p[i] && (p[i] = {}), !0 === e.arraySyntax) {
              var m = s.array[r],
                  f = e.indices[0] + 4 * e.indices[1];
              p[i][f] = m;
            } else for (n = 0, c = s.stride; n < c; n++) p[i][n] = s.array[r + n];

            break;

          case "translate":
          case "rotate":
          case "scale":
            console.warn('THREE.ColladaLoader: Animation transform type "%s" not yet implemented.', d);
        }

        var v = function (e, t) {
          var s = [];

          for (var i in e) s.push({
            time: parseFloat(i),
            value: e[i]
          });

          s.sort(o);

          for (var r = 0; r < 16; r++) M(s, r, t.elements[r]);

          return s;

          function o(e, t) {
            return e.time - t.time;
          }
        }(p, u);

        return {
          name: l.uuid,
          keyframes: v
        };
      }

      var y = new h.Vector3(),
          w = new h.Vector3(),
          x = new h.Quaternion();

      function T(e, t) {
        for (var s = e.keyframes, i = e.name, r = [], o = [], a = [], n = [], c = 0, l = s.length; c < l; c++) {
          var d = s[c],
              u = d.time,
              p = d.value;
          ge.fromArray(p).transpose(), ge.decompose(y, x, w), r.push(u), o.push(y.x, y.y, y.z), a.push(x.x, x.y, x.z, x.w), n.push(w.x, w.y, w.z);
        }

        return o.length > 0 && t.push(new h.VectorKeyframeTrack(i + ".position", r, o)), a.length > 0 && t.push(new h.QuaternionKeyframeTrack(i + ".quaternion", r, a)), n.length > 0 && t.push(new h.VectorKeyframeTrack(i + ".scale", r, n)), t;
      }

      function M(e, t, s) {
        var i,
            r,
            o,
            a = !0;

        for (r = 0, o = e.length; r < o; r++) void 0 === (i = e[r]).value[t] ? i.value[t] = null : a = !1;

        if (!0 === a) for (r = 0, o = e.length; r < o; r++) (i = e[r]).value[t] = s;else !function (e, t) {
          for (var s, i, r = 0, o = e.length; r < o; r++) {
            var a = e[r];

            if (null === a.value[t]) {
              if (s = C(e, r, t), i = E(e, r, t), null === s) {
                a.value[t] = i.value[t];
                continue;
              }

              if (null === i) {
                a.value[t] = s.value[t];
                continue;
              }

              _(a, s, i, t);
            }
          }
        }(e, t);
      }

      function C(e, t, s) {
        for (; t >= 0;) {
          var i = e[t];
          if (null !== i.value[s]) return i;
          t--;
        }

        return null;
      }

      function E(e, t, s) {
        for (; t < e.length;) {
          var i = e[t];
          if (null !== i.value[s]) return i;
          t++;
        }

        return null;
      }

      function _(e, t, s, i) {
        s.time - t.time != 0 ? e.value[i] = (e.time - t.time) * (s.value[i] - t.value[i]) / (s.time - t.time) + t.value[i] : e.value[i] = t.value[i];
      }

      function k(e) {
        for (var t = [], s = e.name, i = e.end - e.start || -1, r = e.animations, o = 0, a = r.length; o < a; o++) for (var n = g(r[o]), c = 0, l = n.length; c < l; c++) t.push(n[c]);

        return new h.AnimationClip(s, i, t);
      }

      function A(e) {
        return p(Pe.clips[e], k);
      }

      function N(e) {
        for (var t = {
          sources: {}
        }, s = 0, i = e.childNodes.length; s < i; s++) {
          var o = e.childNodes[s];
          if (1 === o.nodeType) switch (o.nodeName) {
            case "bind_shape_matrix":
              t.bindShapeMatrix = r(o.textContent);
              break;

            case "source":
              var a = o.getAttribute("id");
              t.sources[a] = ee(o);
              break;

            case "joints":
              t.joints = O(o);
              break;

            case "vertex_weights":
              t.vertexWeights = L(o);
          }
        }

        return t;
      }

      function O(e) {
        for (var t = {
          inputs: {}
        }, s = 0, i = e.childNodes.length; s < i; s++) {
          var r = e.childNodes[s];

          if (1 === r.nodeType && "input" === r.nodeName) {
            var o = r.getAttribute("semantic"),
                n = a(r.getAttribute("source"));
            t.inputs[o] = n;
          }
        }

        return t;
      }

      function L(e) {
        for (var t = {
          inputs: {}
        }, s = 0, i = e.childNodes.length; s < i; s++) {
          var r = e.childNodes[s];
          if (1 === r.nodeType) switch (r.nodeName) {
            case "input":
              var n = r.getAttribute("semantic"),
                  c = a(r.getAttribute("source")),
                  h = parseInt(r.getAttribute("offset"));
              t.inputs[n] = {
                id: c,
                offset: h
              };
              break;

            case "vcount":
              t.vcount = o(r.textContent);
              break;

            case "v":
              t.v = o(r.textContent);
          }
        }

        return t;
      }

      function j(e) {
        var t = {
          id: e.id
        },
            s = Pe.geometries[t.id];
        return void 0 !== e.skin && (t.skin = function (e) {
          var t,
              s,
              i,
              r = 4,
              o = {
            joints: [],
            indices: {
              array: [],
              stride: r
            },
            weights: {
              array: [],
              stride: r
            }
          },
              a = e.sources,
              n = e.vertexWeights,
              c = n.vcount,
              l = n.v,
              d = n.inputs.JOINT.offset,
              u = n.inputs.WEIGHT.offset,
              p = e.sources[e.joints.inputs.JOINT],
              m = e.sources[e.joints.inputs.INV_BIND_MATRIX],
              f = a[n.inputs.WEIGHT.id].array,
              v = 0;

          for (t = 0, i = c.length; t < i; t++) {
            var g = c[t],
                b = [];

            for (s = 0; s < g; s++) {
              var y = l[v + d],
                  w = f[l[v + u]];
              b.push({
                index: y,
                weight: w
              }), v += 2;
            }

            for (b.sort(C), s = 0; s < r; s++) {
              var x = b[s];
              void 0 !== x ? (o.indices.array.push(x.index), o.weights.array.push(x.weight)) : (o.indices.array.push(0), o.weights.array.push(0));
            }
          }

          for (o.bindMatrix = new h.Matrix4().fromArray(e.bindShapeMatrix).transpose(), t = 0, i = p.array.length; t < i; t++) {
            var T = p.array[t],
                M = new h.Matrix4().fromArray(m.array, t * m.stride).transpose();
            o.joints.push({
              name: T,
              boneInverse: M
            });
          }

          return o;

          function C(e, t) {
            return t.weight - e.weight;
          }
        }(e.skin), s.sources.skinIndices = t.skin.indices, s.sources.skinWeights = t.skin.weights), t;
      }

      function R(e) {
        return void 0 !== e.build ? e.build : e.init_from;
      }

      function D(e) {
        for (var t = {
          surfaces: {},
          samplers: {}
        }, s = 0, i = e.childNodes.length; s < i; s++) {
          var r = e.childNodes[s];
          if (1 === r.nodeType) switch (r.nodeName) {
            case "newparam":
              S(r, t);
              break;

            case "technique":
              t.technique = V(r);
          }
        }

        return t;
      }

      function S(e, t) {
        for (var s = e.getAttribute("sid"), i = 0, r = e.childNodes.length; i < r; i++) {
          var o = e.childNodes[i];
          if (1 === o.nodeType) switch (o.nodeName) {
            case "surface":
              t.surfaces[s] = I(o);
              break;

            case "sampler2D":
              t.samplers[s] = P(o);
          }
        }
      }

      function I(e) {
        for (var t = {}, s = 0, i = e.childNodes.length; s < i; s++) {
          var r = e.childNodes[s];
          if (1 === r.nodeType && "init_from" === r.nodeName) t.init_from = r.textContent;
        }

        return t;
      }

      function P(e) {
        for (var t = {}, s = 0, i = e.childNodes.length; s < i; s++) {
          var r = e.childNodes[s];
          if (1 === r.nodeType && "source" === r.nodeName) t.source = r.textContent;
        }

        return t;
      }

      function V(e) {
        for (var t = {}, s = 0, i = e.childNodes.length; s < i; s++) {
          var r = e.childNodes[s];
          if (1 === r.nodeType) switch (r.nodeName) {
            case "constant":
            case "lambert":
            case "blinn":
            case "phong":
              t.type = r.nodeName, t.parameters = F(r);
          }
        }

        return t;
      }

      function F(e) {
        for (var t = {}, s = 0, i = e.childNodes.length; s < i; s++) {
          var r = e.childNodes[s];
          if (1 === r.nodeType) switch (r.nodeName) {
            case "emission":
            case "diffuse":
            case "specular":
            case "shininess":
            case "transparent":
            case "transparency":
              t[r.nodeName] = B(r);
          }
        }

        return t;
      }

      function B(e) {
        for (var t = {}, s = 0, i = e.childNodes.length; s < i; s++) {
          var o = e.childNodes[s];
          if (1 === o.nodeType) switch (o.nodeName) {
            case "color":
              t[o.nodeName] = r(o.textContent);
              break;

            case "float":
              t[o.nodeName] = parseFloat(o.textContent);
              break;

            case "texture":
              t[o.nodeName] = {
                id: o.getAttribute("texture"),
                extra: z(o)
              };
          }
        }

        return t;
      }

      function z(e) {
        for (var t = {
          technique: {}
        }, s = 0, i = e.childNodes.length; s < i; s++) {
          var r = e.childNodes[s];
          if (1 === r.nodeType && "extra" === r.nodeName) U(r, t);
        }

        return t;
      }

      function U(e, t) {
        for (var s = 0, i = e.childNodes.length; s < i; s++) {
          var r = e.childNodes[s];
          if (1 === r.nodeType && "technique" === r.nodeName) G(r, t);
        }
      }

      function G(e, t) {
        for (var s = 0, i = e.childNodes.length; s < i; s++) {
          var r = e.childNodes[s];
          if (1 === r.nodeType) switch (r.nodeName) {
            case "repeatU":
            case "repeatV":
            case "offsetU":
            case "offsetV":
              t.technique[r.nodeName] = parseFloat(r.textContent);
              break;

            case "wrapU":
            case "wrapV":
              "TRUE" === r.textContent.toUpperCase() ? t.technique[r.nodeName] = 1 : "FALSE" === r.textContent.toUpperCase() ? t.technique[r.nodeName] = 0 : t.technique[r.nodeName] = parseInt(r.textContent);
          }
        }
      }

      function H(e) {
        return e;
      }

      function q(e) {
        var t,
            s,
            i = (t = e.url, p(Pe.effects[t], H)),
            r = i.profile.technique;

        switch (r.type) {
          case "phong":
          case "blinn":
            s = new h.MeshPhongMaterial();
            break;

          case "lambert":
            s = new h.MeshLambertMaterial();
            break;

          default:
            s = new h.MeshBasicMaterial();
        }

        function o(e) {
          var t = i.profile.samplers[e.id];

          if (void 0 !== t) {
            var s = i.profile.surfaces[t.source],
                r = Re.load(function (e) {
              return p(Pe.images[e], R);
            }(s.init_from)),
                o = e.extra;

            if (void 0 !== o && void 0 !== o.technique && !1 === n(o.technique)) {
              var a = o.technique;
              r.wrapS = a.wrapU ? h.RepeatWrapping : h.ClampToEdgeWrapping, r.wrapT = a.wrapV ? h.RepeatWrapping : h.ClampToEdgeWrapping, r.offset.set(a.offsetU || 0, a.offsetV || 0), r.repeat.set(a.repeatU || 1, a.repeatV || 1);
            } else r.wrapS = h.RepeatWrapping, r.wrapT = h.RepeatWrapping;

            return r;
          }

          return console.error("THREE.ColladaLoader: Undefined sampler", e.id), null;
        }

        s.name = e.name;
        var a = r.parameters;

        for (var c in a) {
          var l = a[c];

          switch (c) {
            case "diffuse":
              l.color && s.color.fromArray(l.color), l.texture && (s.map = o(l.texture));
              break;

            case "specular":
              l.color && s.specular && s.specular.fromArray(l.color), l.texture && (s.specularMap = o(l.texture));
              break;

            case "shininess":
              l.float && s.shininess && (s.shininess = l.float);
              break;

            case "emission":
              l.color && s.emissive && s.emissive.fromArray(l.color);
              break;

            case "transparent":
              s.transparent = !0;
              break;

            case "transparency":
              void 0 !== l.float && (s.opacity = l.float), s.transparent = !0;
          }
        }

        return s;
      }

      function W(e) {
        return p(Pe.materials[e], q);
      }

      function K(e) {
        for (var t = 0; t < e.childNodes.length; t++) {
          var s = e.childNodes[t];
          if ("technique_common" === s.nodeName) return Y(s);
        }

        return {};
      }

      function Y(e) {
        for (var t = {}, s = 0; s < e.childNodes.length; s++) {
          var i = e.childNodes[s];

          switch (i.nodeName) {
            case "perspective":
            case "orthographic":
              t.technique = i.nodeName, t.parameters = Q(i);
          }
        }

        return t;
      }

      function Q(e) {
        for (var t = {}, s = 0; s < e.childNodes.length; s++) {
          var i = e.childNodes[s];

          switch (i.nodeName) {
            case "xfov":
            case "yfov":
            case "xmag":
            case "ymag":
            case "znear":
            case "zfar":
            case "aspect_ratio":
              t[i.nodeName] = parseFloat(i.textContent);
          }
        }

        return t;
      }

      function X(e) {
        var t;

        switch (e.optics.technique) {
          case "perspective":
            t = new h.PerspectiveCamera(e.optics.parameters.yfov, e.optics.parameters.aspect_ratio, e.optics.parameters.znear, e.optics.parameters.zfar);
            break;

          case "orthographic":
            var s = e.optics.parameters.ymag,
                i = e.optics.parameters.xmag,
                r = e.optics.parameters.aspect_ratio;
            i = void 0 === i ? s * r : i, s = void 0 === s ? i / r : s, i *= .5, s *= .5, t = new h.OrthographicCamera(-i, i, s, -s, e.optics.parameters.znear, e.optics.parameters.zfar);
            break;

          default:
            t = new h.PerspectiveCamera();
        }

        return t.name = e.name, t;
      }

      function Z(e) {
        var t = Pe.cameras[e];
        return void 0 !== t ? p(t, X) : null;
      }

      function J(e) {
        for (var t = {}, s = 0, i = e.childNodes.length; s < i; s++) {
          var r = e.childNodes[s];
          if (1 === r.nodeType) switch (r.nodeName) {
            case "directional":
            case "point":
            case "spot":
            case "ambient":
              t.technique = r.nodeName, t.parameters = $(r);
          }
        }

        return t;
      }

      function $(e) {
        for (var t = {}, s = 0, i = e.childNodes.length; s < i; s++) {
          var o = e.childNodes[s];
          if (1 === o.nodeType) switch (o.nodeName) {
            case "color":
              var a = r(o.textContent);
              t.color = new h.Color().fromArray(a);
              break;

            case "falloff_angle":
              t.falloffAngle = parseFloat(o.textContent);
              break;

            case "quadratic_attenuation":
              var n = parseFloat(o.textContent);
              t.distance = n ? Math.sqrt(1 / n) : 0;
          }
        }

        return t;
      }

      function ee(e) {
        for (var t = {
          array: [],
          stride: 3
        }, o = 0; o < e.childNodes.length; o++) {
          var a = e.childNodes[o];
          if (1 === a.nodeType) switch (a.nodeName) {
            case "float_array":
              t.array = r(a.textContent);
              break;

            case "Name_array":
              t.array = i(a.textContent);
              break;

            case "technique_common":
              var n = s(a, "accessor")[0];
              void 0 !== n && (t.stride = parseInt(n.getAttribute("stride")));
          }
        }

        return t;
      }

      function te(e) {
        for (var t = {}, s = 0; s < e.childNodes.length; s++) {
          var i = e.childNodes[s];
          1 === i.nodeType && (t[i.getAttribute("semantic")] = a(i.getAttribute("source")));
        }

        return t;
      }

      function se(e) {
        for (var t = {
          type: e.nodeName,
          material: e.getAttribute("material"),
          count: parseInt(e.getAttribute("count")),
          inputs: {},
          stride: 0
        }, s = 0, i = e.childNodes.length; s < i; s++) {
          var r = e.childNodes[s];
          if (1 === r.nodeType) switch (r.nodeName) {
            case "input":
              var n = a(r.getAttribute("source")),
                  c = r.getAttribute("semantic"),
                  h = parseInt(r.getAttribute("offset"));
              t.inputs[c] = {
                id: n,
                offset: h
              }, t.stride = Math.max(t.stride, h + 1);
              break;

            case "vcount":
              t.vcount = o(r.textContent);
              break;

            case "p":
              t.p = o(r.textContent);
          }
        }

        return t;
      }

      function ie(e) {
        var t = {},
            s = e.sources,
            i = e.vertices,
            r = e.primitives;
        if (0 === r.length) return {};

        var o = function (e) {
          for (var t = {}, s = 0; s < e.length; s++) {
            var i = e[s];
            void 0 === t[i.type] && (t[i.type] = []), t[i.type].push(i);
          }

          return t;
        }(r);

        for (var a in o) t[a] = re(o[a], s, i);

        return t;
      }

      function re(e, t, s) {
        for (var i = {}, r = {
          array: [],
          stride: 0
        }, o = {
          array: [],
          stride: 0
        }, a = {
          array: [],
          stride: 0
        }, n = {
          array: [],
          stride: 0
        }, c = [], l = 4, d = [], u = 4, p = new h.BufferGeometry(), m = [], f = 0, v = 0, g = 0; g < e.length; g++) {
          var b = e[g],
              y = b.inputs,
              w = 1;

          for (var x in b.vcount && 4 === b.vcount[0] && (w = 2), v = "lines" === b.type || "linestrips" === b.type ? 2 * b.count : 3 * b.count * w, p.addGroup(f, v, g), f += v, b.material && m.push(b.material), y) {
            var T = y[x];

            switch (x) {
              case "VERTEX":
                for (var M in s) {
                  var C = s[M];

                  switch (M) {
                    case "POSITION":
                      oe(b, t[C], T.offset, r.array), r.stride = t[C].stride, t.skinWeights && t.skinIndices && (oe(b, t.skinIndices, T.offset, c), oe(b, t.skinWeights, T.offset, d));
                      break;

                    case "NORMAL":
                      oe(b, t[C], T.offset, o.array), o.stride = t[C].stride;
                      break;

                    case "COLOR":
                      oe(b, t[C], T.offset, n.array), n.stride = t[C].stride;
                      break;

                    case "TEXCOORD":
                      oe(b, t[C], T.offset, a.array), a.stride = t[C].stride;
                      break;

                    default:
                      console.warn('THREE.ColladaLoader: Semantic "%s" not handled in geometry build process.', M);
                  }
                }

                break;

              case "NORMAL":
                oe(b, t[T.id], T.offset, o.array), o.stride = t[T.id].stride;
                break;

              case "COLOR":
                oe(b, t[T.id], T.offset, n.array), n.stride = t[T.id].stride;
                break;

              case "TEXCOORD":
                oe(b, t[T.id], T.offset, a.array), a.stride = t[T.id].stride;
            }
          }
        }

        return r.array.length > 0 && p.addAttribute("position", new h.Float32BufferAttribute(r.array, r.stride)), o.array.length > 0 && p.addAttribute("normal", new h.Float32BufferAttribute(o.array, o.stride)), n.array.length > 0 && p.addAttribute("color", new h.Float32BufferAttribute(n.array, n.stride)), a.array.length > 0 && p.addAttribute("uv", new h.Float32BufferAttribute(a.array, a.stride)), c.length > 0 && p.addAttribute("skinIndex", new h.Float32BufferAttribute(c, l)), d.length > 0 && p.addAttribute("skinWeight", new h.Float32BufferAttribute(d, u)), i.data = p, i.type = e[0].type, i.materialKeys = m, i;
      }

      function oe(e, t, s, i) {
        var r = e.p,
            o = e.stride,
            a = e.vcount;

        function n(e) {
          for (var t = r[e + s] * l, o = t + l; t < o; t++) i.push(h[t]);
        }

        var c = 0,
            h = t.array,
            l = t.stride;

        if (void 0 !== e.vcount) {
          for (var d = 0, u = 0, p = a.length; u < p; u++) {
            var m = a[u];

            if (4 === m) {
              var f = d + 1 * o,
                  v = d + 2 * o,
                  g = d + 3 * o;
              n(d + 0 * o), n(f), n(g), n(f), n(v), n(g);
            } else if (3 === m) {
              f = d + 1 * o, v = d + 2 * o;
              n(d + 0 * o), n(f), n(v);
            } else c = Math.max(c, m);

            d += o * m;
          }

          c > 0 && console.log("THREE.ColladaLoader: Geometry has faces with more than 4 vertices.");
        } else for (u = 0, p = r.length; u < p; u += o) n(u);
      }

      function ae(e) {
        return p(Pe.geometries[e], ie);
      }

      function ne(e) {
        return void 0 !== e.build ? e.build : e;
      }

      function ce(e, t) {
        for (var s = 0; s < e.childNodes.length; s++) {
          var i = e.childNodes[s];
          if (1 === i.nodeType) switch (i.nodeName) {
            case "joint":
              t.joints[i.getAttribute("sid")] = he(i);
              break;

            case "link":
              t.links.push(de(i));
          }
        }
      }

      function he(e) {
        for (var t, s = 0; s < e.childNodes.length; s++) {
          var i = e.childNodes[s];
          if (1 === i.nodeType) switch (i.nodeName) {
            case "prismatic":
            case "revolute":
              t = le(i);
          }
        }

        return t;
      }

      function le(e, t) {
        t = {
          sid: e.getAttribute("sid"),
          name: e.getAttribute("name") || "",
          axis: new h.Vector3(),
          limits: {
            min: 0,
            max: 0
          },
          type: e.nodeName,
          static: !1,
          zeroPosition: 0,
          middlePosition: 0
        };

        for (var s = 0; s < e.childNodes.length; s++) {
          var i = e.childNodes[s];
          if (1 === i.nodeType) switch (i.nodeName) {
            case "axis":
              var o = r(i.textContent);
              t.axis.fromArray(o);
              break;

            case "limits":
              var a = i.getElementsByTagName("max")[0],
                  n = i.getElementsByTagName("min")[0];
              t.limits.max = parseFloat(a.textContent), t.limits.min = parseFloat(n.textContent);
          }
        }

        return t.limits.min >= t.limits.max && (t.static = !0), t.middlePosition = (t.limits.min + t.limits.max) / 2, t;
      }

      function de(e) {
        for (var t = {
          sid: e.getAttribute("sid"),
          name: e.getAttribute("name") || "",
          attachments: [],
          transforms: []
        }, s = 0; s < e.childNodes.length; s++) {
          var i = e.childNodes[s];
          if (1 === i.nodeType) switch (i.nodeName) {
            case "attachment_full":
              t.attachments.push(ue(i));
              break;

            case "matrix":
            case "translate":
            case "rotate":
              t.transforms.push(pe(i));
          }
        }

        return t;
      }

      function ue(e) {
        for (var t = {
          joint: e.getAttribute("joint").split("/").pop(),
          transforms: [],
          links: []
        }, s = 0; s < e.childNodes.length; s++) {
          var i = e.childNodes[s];
          if (1 === i.nodeType) switch (i.nodeName) {
            case "link":
              t.links.push(de(i));
              break;

            case "matrix":
            case "translate":
            case "rotate":
              t.transforms.push(pe(i));
          }
        }

        return t;
      }

      function pe(e) {
        var t = {
          type: e.nodeName
        },
            s = r(e.textContent);

        switch (t.type) {
          case "matrix":
            t.obj = new h.Matrix4(), t.obj.fromArray(s).transpose();
            break;

          case "translate":
            t.obj = new h.Vector3(), t.obj.fromArray(s);
            break;

          case "rotate":
            t.obj = new h.Vector3(), t.obj.fromArray(s), t.angle = h.Math.degToRad(s[3]);
        }

        return t;
      }

      function me(e) {
        for (var t = {
          target: e.getAttribute("target").split("/").pop()
        }, s = 0; s < e.childNodes.length; s++) {
          var i = e.childNodes[s];

          if (1 === i.nodeType && "axis" === i.nodeName) {
            var r = i.getElementsByTagName("param")[0];
            t.axis = r.textContent;
            var o = t.axis.split("inst_").pop().split("axis")[0];
            t.jointIndex = o.substr(0, o.length - 1);
          }
        }

        return t;
      }

      function fe(e) {
        return void 0 !== e.build ? e.build : e;
      }

      function ve(e) {
        for (var t = [], s = Oe.querySelector('[id="' + e.id + '"]'), i = 0; i < s.childNodes.length; i++) {
          var o = s.childNodes[i];
          if (1 === o.nodeType) switch (o.nodeName) {
            case "matrix":
              var a = r(o.textContent),
                  n = new h.Matrix4().fromArray(a).transpose();
              t.push({
                sid: o.getAttribute("sid"),
                type: o.nodeName,
                obj: n
              });
              break;

            case "translate":
            case "scale":
              a = r(o.textContent);
              var c = new h.Vector3().fromArray(a);
              t.push({
                sid: o.getAttribute("sid"),
                type: o.nodeName,
                obj: c
              });
              break;

            case "rotate":
              a = r(o.textContent), c = new h.Vector3().fromArray(a);
              var l = h.Math.degToRad(a[3]);
              t.push({
                sid: o.getAttribute("sid"),
                type: o.nodeName,
                obj: c,
                angle: l
              });
          }
        }

        return t;
      }

      var ge = new h.Matrix4(),
          be = new h.Vector3();

      function ye(e) {
        for (var t = {
          name: e.getAttribute("name") || "",
          type: e.getAttribute("type"),
          id: e.getAttribute("id"),
          sid: e.getAttribute("sid"),
          matrix: new h.Matrix4(),
          nodes: [],
          instanceCameras: [],
          instanceControllers: [],
          instanceLights: [],
          instanceGeometries: [],
          instanceNodes: [],
          transforms: {}
        }, s = 0; s < e.childNodes.length; s++) {
          var i = e.childNodes[s];
          if (1 === i.nodeType) switch (i.nodeName) {
            case "node":
              t.nodes.push(i.getAttribute("id")), ye(i);
              break;

            case "instance_camera":
              t.instanceCameras.push(a(i.getAttribute("url")));
              break;

            case "instance_controller":
              t.instanceControllers.push(we(i));
              break;

            case "instance_light":
              t.instanceLights.push(a(i.getAttribute("url")));
              break;

            case "instance_geometry":
              t.instanceGeometries.push(we(i));
              break;

            case "instance_node":
              t.instanceNodes.push(a(i.getAttribute("url")));
              break;

            case "matrix":
              var o = r(i.textContent);
              t.matrix.multiply(ge.fromArray(o).transpose()), t.transforms[i.getAttribute("sid")] = i.nodeName;
              break;

            case "translate":
              o = r(i.textContent);
              be.fromArray(o), t.matrix.multiply(ge.makeTranslation(be.x, be.y, be.z)), t.transforms[i.getAttribute("sid")] = i.nodeName;
              break;

            case "rotate":
              o = r(i.textContent);
              var n = h.Math.degToRad(o[3]);
              t.matrix.multiply(ge.makeRotationAxis(be.fromArray(o), n)), t.transforms[i.getAttribute("sid")] = i.nodeName;
              break;

            case "scale":
              o = r(i.textContent);
              t.matrix.scale(be.fromArray(o)), t.transforms[i.getAttribute("sid")] = i.nodeName;
              break;

            case "extra":
              break;

            default:
              console.log(i);
          }
        }

        return Pe.nodes[t.id] = t, t;
      }

      function we(e) {
        for (var t = {
          id: a(e.getAttribute("url")),
          materials: {},
          skeletons: []
        }, s = 0; s < e.childNodes.length; s++) {
          var i = e.childNodes[s];

          switch (i.nodeName) {
            case "bind_material":
              for (var r = i.getElementsByTagName("instance_material"), o = 0; o < r.length; o++) {
                var n = r[o],
                    c = n.getAttribute("symbol"),
                    h = n.getAttribute("target");
                t.materials[c] = a(h);
              }

              break;

            case "skeleton":
              t.skeletons.push(a(i.textContent));
          }
        }

        return t;
      }

      function xe(e, t) {
        var s,
            i,
            r,
            o = [],
            a = [];

        for (s = 0; s < e.length; s++) {
          Te(_e(e[s]), t, o);
        }

        for (s = 0; s < t.length; s++) for (i = 0; i < o.length; i++) if ((r = o[i]).bone.name === t[s].name) {
          a[s] = r, r.processed = !0;
          break;
        }

        for (s = 0; s < o.length; s++) !1 === (r = o[s]).processed && (a.push(r), r.processed = !0);

        var n = [],
            c = [];

        for (s = 0; s < a.length; s++) r = a[s], n.push(r.bone), c.push(r.boneInverse);

        return new h.Skeleton(n, c);
      }

      function Te(e, t, s) {
        e.traverse(function (e) {
          if (!0 === e.isBone) {
            for (var i, r = 0; r < t.length; r++) {
              var o = t[r];

              if (o.name === e.name) {
                i = o.boneInverse;
                break;
              }
            }

            void 0 === i && (i = new h.Matrix4()), s.push({
              bone: e,
              boneInverse: i,
              processed: !1
            });
          }
        });
      }

      function Me(e) {
        for (var t, s = [], i = e.matrix, r = e.nodes, o = e.type, a = e.instanceCameras, n = e.instanceControllers, c = e.instanceLights, l = e.instanceGeometries, d = e.instanceNodes, u = 0, m = r.length; u < m; u++) s.push(_e(r[u]));

        for (u = 0, m = a.length; u < m; u++) {
          null !== (T = Z(a[u])) && s.push(T.clone());
        }

        for (u = 0, m = n.length; u < m; u++) for (var f = n[u], v = (t = f.id, p(Pe.controllers[t], j)), g = Ee(ae(v.id), f.materials), b = xe(f.skeletons, v.skin.joints), y = 0, w = g.length; y < w; y++) {
          var x;
          (x = g[y]).isSkinnedMesh && (x.bind(b, v.skin.bindMatrix), x.normalizeSkinWeights()), s.push(x);
        }

        for (u = 0, m = c.length; u < m; u++) {
          var T;
          null !== (T = Z(a[u])) && s.push(T.clone());
        }

        for (u = 0, m = l.length; u < m; u++) for (y = 0, w = (g = Ee(ae((f = l[u]).id), f.materials)).length; y < w; y++) s.push(g[y]);

        for (u = 0, m = d.length; u < m; u++) s.push(_e(d[u]).clone());

        if (0 === r.length && 1 === s.length) x = s[0];else {
          x = "JOINT" === o ? new h.Bone() : new h.Object3D();

          for (u = 0; u < s.length; u++) x.add(s[u]);
        }
        return x.name = "JOINT" === o ? e.sid : e.name, x.matrix.copy(i), x.matrix.decompose(x.position, x.quaternion, x.scale), x;
      }

      function Ce(e, t) {
        for (var s = [], i = 0, r = e.length; i < r; i++) {
          var o = t[e[i]];
          s.push(W(o));
        }

        return s;
      }

      function Ee(e, t) {
        var s = [];

        for (var i in e) {
          var r = e[i],
              o = Ce(r.materialKeys, t);
          0 === o.length && ("lines" === i || "linestrips" === i ? o.push(new h.LineBasicMaterial()) : o.push(new h.MeshPhongMaterial()));
          var a = void 0 !== r.data.attributes.skinIndex;
          if (a) for (var n = 0, c = o.length; n < c; n++) o[n].skinning = !0;
          var l,
              d = 1 === o.length ? o[0] : o;

          switch (i) {
            case "lines":
              l = new h.LineSegments(r.data, d);
              break;

            case "linestrips":
              l = new h.Line(r.data, d);
              break;

            case "triangles":
            case "polylist":
              l = a ? new h.SkinnedMesh(r.data, d) : new h.Mesh(r.data, d);
          }

          s.push(l);
        }

        return s;
      }

      function _e(e) {
        return p(Pe.nodes[e], Me);
      }

      function ke(e) {
        var t = new h.Object3D();
        t.name = e.name;

        for (var s = e.children, i = 0; i < s.length; i++) {
          var r = s[i];
          null === r.id ? t.add(Me(r)) : t.add(_e(r.id));
        }

        return t;
      }

      function Ae(e) {
        return p(Pe.visualScenes[e], ke);
      }

      if (console.time("THREE.ColladaLoader"), 0 === e.length) return {
        scene: new h.Scene()
      };
      console.time("THREE.ColladaLoader: DOMParser");
      var Ne = new DOMParser().parseFromString(e, "application/xml");
      console.timeEnd("THREE.ColladaLoader: DOMParser");
      var Oe = s(Ne, "COLLADA")[0],
          Le = Oe.getAttribute("version");
      console.log("THREE.ColladaLoader: File version", Le);

      var je = function (e) {
        return {
          unit: c(s(e, "unit")[0]),
          upAxis: l(s(e, "up_axis")[0])
        };
      }(s(Oe, "asset")[0]),
          Re = new h.TextureLoader(this.manager);

      Re.setPath(t).setCrossOrigin(this.crossOrigin);
      var De = [],
          Se = {},
          Ie = 0,
          Pe = {
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
      console.time("THREE.ColladaLoader: Parse"), d(Oe, "library_animations", "animation", function (e) {
        for (var t = {
          sources: {},
          samplers: {},
          channels: {}
        }, s = 0, i = e.childNodes.length; s < i; s++) {
          var r,
              o = e.childNodes[s];
          if (1 === o.nodeType) switch (o.nodeName) {
            case "source":
              r = o.getAttribute("id"), t.sources[r] = ee(o);
              break;

            case "sampler":
              r = o.getAttribute("id"), t.samplers[r] = m(o);
              break;

            case "channel":
              r = o.getAttribute("target"), t.channels[r] = f(o);
              break;

            default:
              console.log(o);
          }
        }

        Pe.animations[e.getAttribute("id")] = t;
      }), d(Oe, "library_animation_clips", "animation_clip", function (e) {
        for (var t = {
          name: e.getAttribute("id") || "default",
          start: parseFloat(e.getAttribute("start") || 0),
          end: parseFloat(e.getAttribute("end") || 0),
          animations: []
        }, s = 0, i = e.childNodes.length; s < i; s++) {
          var r = e.childNodes[s];
          if (1 === r.nodeType && "instance_animation" === r.nodeName) t.animations.push(a(r.getAttribute("url")));
        }

        Pe.clips[e.getAttribute("id")] = t;
      }), d(Oe, "library_controllers", "controller", function (e) {
        for (var t = {}, s = 0, i = e.childNodes.length; s < i; s++) {
          var r = e.childNodes[s];
          if (1 === r.nodeType) switch (r.nodeName) {
            case "skin":
              t.id = a(r.getAttribute("source")), t.skin = N(r);
              break;

            case "morph":
              t.id = a(r.getAttribute("source")), console.warn("THREE.ColladaLoader: Morph target animation not supported yet.");
          }
        }

        Pe.controllers[e.getAttribute("id")] = t;
      }), d(Oe, "library_images", "image", function (e) {
        var t = {
          init_from: s(e, "init_from")[0].textContent
        };
        Pe.images[e.getAttribute("id")] = t;
      }), d(Oe, "library_effects", "effect", function (e) {
        for (var t = {}, s = 0, i = e.childNodes.length; s < i; s++) {
          var r = e.childNodes[s];
          if (1 === r.nodeType && "profile_COMMON" === r.nodeName) t.profile = D(r);
        }

        Pe.effects[e.getAttribute("id")] = t;
      }), d(Oe, "library_materials", "material", function (e) {
        for (var t = {
          name: e.getAttribute("name")
        }, s = 0, i = e.childNodes.length; s < i; s++) {
          var r = e.childNodes[s];
          if (1 === r.nodeType && "instance_effect" === r.nodeName) t.url = a(r.getAttribute("url"));
        }

        Pe.materials[e.getAttribute("id")] = t;
      }), d(Oe, "library_cameras", "camera", function (e) {
        for (var t = {
          name: e.getAttribute("name")
        }, s = 0, i = e.childNodes.length; s < i; s++) {
          var r = e.childNodes[s];
          if (1 === r.nodeType && "optics" === r.nodeName) t.optics = K(r);
        }

        Pe.cameras[e.getAttribute("id")] = t;
      }), d(Oe, "library_lights", "light", function (e) {
        for (var t = {}, s = 0, i = e.childNodes.length; s < i; s++) {
          var r = e.childNodes[s];
          if (1 === r.nodeType && "technique_common" === r.nodeName) t = J(r);
        }

        Pe.lights[e.getAttribute("id")] = t;
      }), d(Oe, "library_geometries", "geometry", function (e) {
        for (var t = {
          name: e.getAttribute("name"),
          sources: {},
          vertices: {},
          primitives: []
        }, i = s(e, "mesh")[0], r = 0; r < i.childNodes.length; r++) {
          var o = i.childNodes[r];

          if (1 === o.nodeType) {
            var a = o.getAttribute("id");

            switch (o.nodeName) {
              case "source":
                t.sources[a] = ee(o);
                break;

              case "vertices":
                t.vertices = te(o);
                break;

              case "polygons":
                console.warn("THREE.ColladaLoader: Unsupported primitive type: ", o.nodeName);
                break;

              case "lines":
              case "linestrips":
              case "polylist":
              case "triangles":
                t.primitives.push(se(o));
                break;

              default:
                console.log(o);
            }
          }
        }

        Pe.geometries[e.getAttribute("id")] = t;
      }), d(Oe, "library_nodes", "node", ye), d(Oe, "library_visual_scenes", "visual_scene", function (e) {
        var t = {
          name: e.getAttribute("name"),
          children: []
        };
        !function (e) {
          for (var t = e.getElementsByTagName("node"), s = 0; s < t.length; s++) {
            var i = t[s];
            !1 === i.hasAttribute("id") && i.setAttribute("id", "three_default_" + Ie++);
          }
        }(e);

        for (var i = s(e, "node"), r = 0; r < i.length; r++) t.children.push(ye(i[r]));

        Pe.visualScenes[e.getAttribute("id")] = t;
      }), d(Oe, "library_kinematics_models", "kinematics_model", function (e) {
        for (var t = {
          name: e.getAttribute("name") || "",
          joints: {},
          links: []
        }, s = 0; s < e.childNodes.length; s++) {
          var i = e.childNodes[s];
          if (1 === i.nodeType && "technique_common" === i.nodeName) ce(i, t);
        }

        Pe.kinematicsModels[e.getAttribute("id")] = t;
      }), d(Oe, "scene", "instance_kinematics_scene", function (e) {
        for (var t = {
          bindJointAxis: []
        }, s = 0; s < e.childNodes.length; s++) {
          var i = e.childNodes[s];
          if (1 === i.nodeType && "bind_joint_axis" === i.nodeName) t.bindJointAxis.push(me(i));
        }

        Pe.kinematicsScenes[a(e.getAttribute("url"))] = t;
      }), console.timeEnd("THREE.ColladaLoader: Parse"), console.time("THREE.ColladaLoader: Build"), u(Pe.animations, v), u(Pe.clips, k), u(Pe.controllers, j), u(Pe.images, R), u(Pe.effects, H), u(Pe.materials, q), u(Pe.cameras, X), u(Pe.lights, function (e) {
        var t;

        switch (e.technique) {
          case "directional":
            t = new h.DirectionalLight();
            break;

          case "point":
            t = new h.PointLight();
            break;

          case "spot":
            t = new h.SpotLight();
            break;

          case "ambient":
            t = new h.AmbientLight();
        }

        return e.parameters.color && t.color.copy(e.parameters.color), e.parameters.distance && (t.distance = e.parameters.distance), t;
      }), u(Pe.geometries, ie), u(Pe.visualScenes, ke), console.timeEnd("THREE.ColladaLoader: Build"), function () {
        var e = Pe.clips;

        if (!0 === n(e)) {
          if (!1 === n(Pe.animations)) {
            var t = [];

            for (var s in Pe.animations) for (var i = g(s), r = 0, o = i.length; r < o; r++) t.push(i[r]);

            De.push(new h.AnimationClip("default", -1, t));
          }
        } else for (var s in e) De.push(A(s));
      }(), function () {
        var e = Object.keys(Pe.kinematicsModels)[0],
            t = Object.keys(Pe.kinematicsScenes)[0],
            s = Object.keys(Pe.visualScenes)[0];

        if (void 0 !== e && void 0 !== t) {
          for (var i, r = (i = e, p(Pe.kinematicsModels[i], ne)), o = function (e) {
            return p(Pe.kinematicsScenes[e], fe);
          }(t), a = Ae(s), n = o.bindJointAxis, c = {}, l = 0, d = n.length; l < d; l++) {
            var u = n[l],
                m = Oe.querySelector('[sid="' + u.target + '"]');

            if (m) {
              var f = m.parentElement;
              g(u.jointIndex, f);
            }
          }

          var v = new h.Matrix4();
          Se = {
            joints: r && r.joints,
            getJointValue: function (e) {
              var t = c[e];
              if (t) return t.position;
              console.warn("THREE.ColladaLoader: Joint " + e + " doesn't exist.");
            },
            setJointValue: function (e, t) {
              var s = c[e];

              if (s) {
                var i = s.joint;
                if (t > i.limits.max || t < i.limits.min) console.warn("THREE.ColladaLoader: Joint " + e + " value " + t + " outside of limits (min: " + i.limits.min + ", max: " + i.limits.max + ").");else if (i.static) console.warn("THREE.ColladaLoader: Joint " + e + " is static.");else {
                  var r = s.object,
                      o = i.axis,
                      a = s.transforms;
                  ge.identity();

                  for (var n = 0; n < a.length; n++) {
                    var l = a[n];
                    if (l.sid && -1 !== l.sid.indexOf(e)) switch (i.type) {
                      case "revolute":
                        ge.multiply(v.makeRotationAxis(o, h.Math.degToRad(t)));
                        break;

                      case "prismatic":
                        ge.multiply(v.makeTranslation(o.x * t, o.y * t, o.z * t));
                        break;

                      default:
                        console.warn("THREE.ColladaLoader: Unknown joint type: " + i.type);
                    } else switch (l.type) {
                      case "matrix":
                        ge.multiply(l.obj);
                        break;

                      case "translate":
                        ge.multiply(v.makeTranslation(l.obj.x, l.obj.y, l.obj.z));
                        break;

                      case "scale":
                        ge.scale(l.obj);
                        break;

                      case "rotate":
                        ge.multiply(v.makeRotationAxis(l.obj, l.angle));
                    }
                  }

                  r.matrix.copy(ge), r.matrix.decompose(r.position, r.quaternion, r.scale), c[e].position = t;
                }
              } else console.log("THREE.ColladaLoader: " + e + " does not exist.");
            }
          };
        }

        function g(e, t) {
          var s = t.getAttribute("name"),
              i = r.joints[e];
          a.traverse(function (r) {
            r.name === s && (c[e] = {
              object: r,
              transforms: ve(t),
              joint: i,
              position: i.zeroPosition
            });
          });
        }
      }();

      var Ve = function (e) {
        return Ae(a(s(e, "instance_visual_scene")[0].getAttribute("url")));
      }(s(Oe, "scene")[0]);

      return Ve.scale.multiplyScalar(je.unit), console.timeEnd("THREE.ColladaLoader"), {
        animations: De,
        kinematics: Se,
        library: Pe,
        scene: Ve
      };
    }
  };
  var w = {
    onError: function (e) {
      console.error(e);
    },
    loaders: {
      dae: function (e, t, s) {
        const i = s.material,
              r = new h.ColladaLoader(s.loader);
        return r.log = function (t) {
          e.warnings && console.warn(t);
        }, r.load(t, function (t) {
          null !== i && t.scene.traverse(function (e) {
            e instanceof h.Mesh && void 0 === e.material && (e.material = i);
          }), e.add(t.scene);
        }, null, w.onError), r;
      },
      obj: function (e, t, s) {
        const i = s.material,
              r = new h.OBJLoader(s.loader);
        return r.log = function (t) {
          e.warnings && console.warn(t);
        }, r.load(t, function (o) {
          const a = h.LoaderUtils.extractUrlBase(t);

          if (o.materialLibraries.length) {
            const i = o.materialLibraries[0];
            new h.MTLLoader(s.loader).setPath(a).load(i, function (s) {
              s.preload(), function (s, i) {
                s.setMaterials(i).load(t, function (t) {
                  e.add(t);
                }, null, w.onError);
              }(r, s);
            }, null, w.onError);
          } else null !== i && o.children.foreach(function (e) {
            e instanceof h.Mesh && (e.material = i);
          }), e.add(o);
        }, null, w.onError), r;
      },
      stl: function (e, t, s) {
        const i = s.material,
              r = new h.STLLoader(s.loader);
        return r.load(t, function (t) {
          var s;
          t.computeFaceNormals(), s = null !== i ? new h.Mesh(t, i) : new h.Mesh(t, new h.MeshBasicMaterial({
            color: 10066329
          })), e.add(s);
        }, null, w.onError), r;
      }
    }
  };

  class x extends h.Object3D {
    constructor(e) {
      super();
      var t = (e = e || {}).path || "/",
          s = e.resource;
      e.material, this.warnings = e.warnings, "/" !== t.substr(t.length - 1) && (t += "/");
      var i = t + s,
          r = i.substr(-3).toLowerCase(),
          o = w.loaders[r];
      o ? o(this, i, e) : console.warn("Unsupported loader for file type: '" + r + "'");
    }

  }

  class T extends h.Object3D {
    constructor(e) {
      var t = (e = e || {}).material || new h.MeshBasicMaterial(),
          s = e.vertices,
          i = e.colors;
      super(), t.side = h.DoubleSide;
      var r,
          o,
          a = new h.Geometry();

      for (r = 0; r < s.length; r++) a.vertices.push(new h.Vector3(s[r].x, s[r].y, s[r].z));

      if (i.length === s.length) {
        for (r = 0; r < s.length; r += 3) {
          var n = new h.Face3(r, r + 1, r + 2);

          for (o = 3 * r; o < 3 * r + 3; r++) {
            var c = new h.Color();
            c.setRGB(i[r].r, i[r].g, i[r].b), n.vertexColors.push(c);
          }

          a.faces.push(n);
        }

        t.vertexColors = h.VertexColors;
      } else if (i.length === s.length / 3) {
        for (r = 0; r < s.length; r += 3) {
          var l = new h.Face3(r, r + 1, r + 2);
          l.color.setRGB(i[r / 3].r, i[r / 3].g, i[r / 3].b), a.faces.push(l);
        }

        t.vertexColors = h.FaceColors;
      } else for (r = 0; r < s.length; r += 3) {
        var d = new h.Face3(r, r + 1, r + 2);
        a.faces.push(d);
      }

      a.computeBoundingBox(), a.computeBoundingSphere(), a.computeFaceNormals(), this.add(new h.Mesh(a, t));
    }

    setColor(e) {
      this.mesh.material.color.setHex(e);
    }

  }

  class M extends h.Object3D {
    constructor(e) {
      super();
      var t = (e = e || {}).path || "/",
          s = e.message;
      "/" !== t.substr(t.length - 1) && (t += "/"), s.scale ? this.msgScale = [s.scale.x, s.scale.y, s.scale.z] : this.msgScale = [1, 1, 1], this.msgColor = s.color, this.msgMesh = void 0, this.setPose(s.pose);
      var i = l(this.msgColor.r, this.msgColor.g, this.msgColor.b, this.msgColor.a);

      switch (s.type) {
        case 0:
          var r,
              o = s.scale.x,
              a = .23 * o,
              n = s.scale.y,
              c = .5 * n,
              d = null;

          if (2 === s.points.length) {
            d = new h.Vector3(s.points[0].x, s.points[0].y, s.points[0].z);
            var u = new h.Vector3(s.points[1].x, s.points[1].y, s.points[1].z);
            o = (r = d.clone().negate().add(u)).length(), n = s.scale.y, c = s.scale.x, 0 !== s.scale.z && (a = s.scale.z);
          }

          this.add(new f({
            direction: r,
            origin: d,
            length: o,
            headLength: a,
            shaftDiameter: c,
            headDiameter: n,
            material: i
          }));
          break;

        case 1:
          var p = new h.BoxGeometry(s.scale.x, s.scale.y, s.scale.z);
          this.add(new h.Mesh(p, i));
          break;

        case 2:
          var m = new h.SphereGeometry(.5),
              v = new h.Mesh(m, i);
          v.scale.x = s.scale.x, v.scale.y = s.scale.y, v.scale.z = s.scale.z, this.add(v);
          break;

        case 3:
          var g = new h.CylinderGeometry(.5, .5, 1, 16, 1, !1),
              b = new h.Mesh(g, i);
          b.quaternion.setFromAxisAngle(new h.Vector3(1, 0, 0), .5 * Math.PI), b.scale.set(s.scale.x, s.scale.z, s.scale.y), this.add(b);
          break;

        case 4:
          var y,
              w = new h.Geometry(),
              M = new h.LineBasicMaterial({
            linewidth: s.scale.x
          });

          for (y = 0; y < s.points.length; y++) {
            var C = new h.Vector3();
            C.x = s.points[y].x, C.y = s.points[y].y, C.z = s.points[y].z, w.vertices.push(C);
          }

          if (s.colors.length === s.points.length) for (M.vertexColors = !0, y = 0; y < s.points.length; y++) {
            var E = new h.Color();
            E.setRGB(s.colors[y].r, s.colors[y].g, s.colors[y].b), w.colors.push(E);
          } else M.color.setRGB(s.color.r, s.color.g, s.color.b);
          this.add(new h.Line(w, M));
          break;

        case 5:
          var _,
              k = new h.Geometry(),
              A = new h.LineBasicMaterial({
            linewidth: s.scale.x
          });

          for (_ = 0; _ < s.points.length; _++) {
            var N = new h.Vector3();
            N.x = s.points[_].x, N.y = s.points[_].y, N.z = s.points[_].z, k.vertices.push(N);
          }

          if (s.colors.length === s.points.length) for (A.vertexColors = !0, _ = 0; _ < s.points.length; _++) {
            var O = new h.Color();
            O.setRGB(s.colors[_].r, s.colors[_].g, s.colors[_].b), k.colors.push(O);
          } else A.color.setRGB(s.color.r, s.color.g, s.color.b);
          this.add(new h.LineSegments(k, A));
          break;

        case 6:
          var L,
              j,
              R,
              D,
              S = new h.Object3D(),
              I = s.points.length,
              P = I === s.colors.length,
              V = Math.ceil(I / 1250);

          for (L = 0; L < I; L += V) j = new h.BoxGeometry(s.scale.x, s.scale.y, s.scale.z), R = P ? l(s.colors[L].r, s.colors[L].g, s.colors[L].b, s.colors[L].a) : i, (D = new h.Mesh(j, R)).position.x = s.points[L].x, D.position.y = s.points[L].y, D.position.z = s.points[L].z, S.add(D);

          this.add(S);
          break;

        case 7:
          var F,
              B,
              z,
              U,
              G = new h.Object3D(),
              H = s.points.length,
              q = H === s.colors.length,
              W = Math.ceil(H / 1250);

          for (F = 0; F < H; F += W) B = new h.SphereGeometry(.5, 8, 8), z = q ? l(s.colors[F].r, s.colors[F].g, s.colors[F].b, s.colors[F].a) : i, (U = new h.Mesh(B, z)).scale.x = s.scale.x, U.scale.y = s.scale.y, U.scale.z = s.scale.z, U.position.x = s.points[F].x, U.position.y = s.points[F].y, U.position.z = s.points[F].z, G.add(U);

          this.add(G);
          break;

        case 8:
          var K,
              Y = new h.Geometry(),
              Q = new h.PointsMaterial({
            size: s.scale.x
          });

          for (K = 0; K < s.points.length; K++) {
            var X = new h.Vector3();
            X.x = s.points[K].x, X.y = s.points[K].y, X.z = s.points[K].z, Y.vertices.push(X);
          }

          if (s.colors.length === s.points.length) for (Q.vertexColors = !0, K = 0; K < s.points.length; K++) {
            var Z = new h.Color();
            Z.setRGB(s.colors[K].r, s.colors[K].g, s.colors[K].b), Y.colors.push(Z);
          } else Q.color.setRGB(s.color.r, s.color.g, s.color.b);
          this.add(new h.Points(Y, Q));
          break;

        case 9:
          if (s.text.length > 0) {
            var J = this.msgColor,
                $ = document.createElement("canvas"),
                ee = $.getContext("2d"),
                te = "normal 100px sans-serif";
            ee.font = te;
            var se = ee.measureText(s.text).width;
            $.width = se, $.height = 150, ee.font = te, ee.fillStyle = "rgba(" + Math.round(255 * J.r) + ", " + Math.round(255 * J.g) + ", " + Math.round(255 * J.b) + ", " + J.a + ")", ee.textAlign = "left", ee.textBaseline = "middle", ee.fillText(s.text, 0, $.height / 2);
            var ie = new h.Texture($);
            ie.needsUpdate = !0;
            var re = new h.SpriteMaterial({
              map: ie,
              useScreenCoordinates: !1
            }),
                oe = new h.Sprite(re),
                ae = s.scale.x;
            oe.scale.set(se / $.height * ae, ae, 1), this.add(oe);
          }

          break;

        case 10:
          var ne = null;
          0 === s.color.r && 0 === s.color.g && 0 === s.color.b && 0 === s.color.a || (ne = i), this.msgMesh = s.mesh_resource.substr(10);
          var ce = new x({
            path: t,
            resource: this.msgMesh,
            material: ne
          });
          this.add(ce);
          break;

        case 11:
          var he = new T({
            material: i,
            vertices: s.points,
            colors: s.colors
          });
          he.scale.set(s.scale.x, s.scale.y, s.scale.z), this.add(he);
          break;

        default:
          console.error("Currently unsupported marker type: " + s.type);
      }
    }

    setPose(e) {
      this.position.x = e.position.x, this.position.y = e.position.y, this.position.z = e.position.z, this.quaternion.set(e.orientation.x, e.orientation.y, e.orientation.z, e.orientation.w), this.quaternion.normalize(), this.updateMatrixWorld();
    }

    update(e) {
      if (this.setPose(e.pose), e.color.r !== this.msgColor.r || e.color.g !== this.msgColor.g || e.color.b !== this.msgColor.b || e.color.a !== this.msgColor.a) {
        var t = l(e.color.r, e.color.g, e.color.b, e.color.a);

        switch (e.type) {
          case 4:
          case 5:
          case 8:
            break;

          case 0:
          case 1:
          case 2:
          case 3:
          case 11:
          case 9:
            this.traverse(function (e) {
              e instanceof h.Mesh && (e.material = t);
            });
            break;

          case 10:
            var s = null;
            0 === e.color.r && 0 === e.color.g && 0 === e.color.b && 0 === e.color.a || (s = this.colorMaterial), this.traverse(function (e) {
              e instanceof h.Mesh && (e.material = s);
            });
            break;

          default:
            return !1;
        }

        this.msgColor = e.color;
      }

      var i = Math.abs(this.msgScale[0] - e.scale.x) > 1e-6 || Math.abs(this.msgScale[1] - e.scale.y) > 1e-6 || Math.abs(this.msgScale[2] - e.scale.z) > 1e-6;

      switch (this.msgScale = [e.scale.x, e.scale.y, e.scale.z], e.type) {
        case 1:
        case 2:
        case 3:
          if (i) return !1;
          break;

        case 9:
          if (i || this.text !== e.text) return !1;
          break;

        case 10:
          if (e.mesh_resource.substr(10) !== this.msgMesh) return !1;
          if (i) return !1;
          break;

        case 0:
        case 4:
        case 5:
        case 6:
        case 7:
        case 8:
        case 11:
          return !1;
      }

      return !0;
    }

    dispose() {
      this.children.forEach(function (e) {
        e instanceof x ? e.children.forEach(function (t) {
          void 0 !== t.material && t.material.dispose(), t.children.forEach(function (e) {
            void 0 !== e.geometry && e.geometry.dispose(), void 0 !== e.material && e.material.dispose(), t.remove(e);
          }), e.remove(t);
        }) : (void 0 !== e.geometry && e.geometry.dispose(), void 0 !== e.material && e.material.dispose()), e.parent.remove(e);
      });
    }

  }

  class C extends h.Object3D {
    constructor(e) {
      super();
      var t = this;
      e = e || {}, this.parent = e.parent;
      var s = e.handle,
          i = e.message;
      this.message = i, this.name = i.name, this.camera = e.camera, this.path = e.path || "/", this.loader = e.loader, this.dragging = !1, this.startMousePos = new h.Vector2(), this.isShift = !1;
      var r = new h.Quaternion(i.orientation.x, i.orientation.y, i.orientation.z, i.orientation.w);
      r.normalize();
      var o = new h.Vector3(1, 0, 0);

      switch (o.applyQuaternion(r), this.currentControlOri = new h.Quaternion(), i.interaction_mode) {
        case 9:
        case 7:
          this.addEventListener("mousemove", this.parent.move3d.bind(this.parent, this, o));
          break;

        case 3:
          this.addEventListener("mousemove", this.parent.moveAxis.bind(this.parent, this, o)), this.addEventListener("touchmove", this.parent.moveAxis.bind(this.parent, this, o));
          break;

        case 5:
          this.addEventListener("mousemove", this.parent.rotateAxis.bind(this.parent, this, r));
          break;

        case 4:
          this.addEventListener("mousemove", this.parent.movePlane.bind(this.parent, this, o));
          break;

        case 2:
          this.addEventListener("click", this.parent.buttonClick.bind(this.parent, this));
      }

      function a(e) {
        e.stopPropagation();
      }

      0 !== i.interaction_mode && (this.addEventListener("mousedown", this.parent.startDrag.bind(this.parent, this)), this.addEventListener("mouseup", this.parent.stopDrag.bind(this.parent, this)), this.addEventListener("contextmenu", this.parent.showMenu.bind(this.parent, this)), this.addEventListener("mouseup", function (e) {
        0 === t.startMousePos.distanceToSquared(e.mousePos) && (e.type = "contextmenu", t.dispatchEvent(e));
      }), this.addEventListener("mouseover", a), this.addEventListener("mouseout", a), this.addEventListener("click", a), this.addEventListener("mousedown", function (e) {
        t.startMousePos = e.mousePos;
      }), this.addEventListener("touchstart", function (e) {
        1 === e.domEvent.touches.length && (e.type = "mousedown", e.domEvent.button = 0, t.dispatchEvent(e));
      }), this.addEventListener("touchmove", function (e) {
        1 === e.domEvent.touches.length && (e.type = "mousemove", e.domEvent.button = 0, t.dispatchEvent(e));
      }), this.addEventListener("touchend", function (e) {
        0 === e.domEvent.touches.length && (e.domEvent.button = 0, e.type = "mouseup", t.dispatchEvent(e), e.type = "click", t.dispatchEvent(e));
      }), window.addEventListener("keydown", function (e) {
        16 === e.keyCode && (t.isShift = !0);
      }), window.addEventListener("keyup", function (e) {
        16 === e.keyCode && (t.isShift = !1);
      }));
      var c = new h.Quaternion(),
          l = this.parent.position.clone().multiplyScalar(-1);

      switch (i.orientation_mode) {
        case 0:
          c = this.parent.quaternion.clone().inverse();
          break;

        case 1:
        case 2:
          break;

        default:
          console.error("Unkown orientation mode: " + i.orientation_mode);
      }

      var d = new n.TFClient({
        ros: s.tfClient.ros,
        fixedFrame: s.message.header.frame_id,
        serverName: s.tfClient.serverName
      });
      i.markers.forEach(function (e) {
        var s = function (s) {
          var i = new M({
            message: e,
            path: t.path,
            loader: t.loader
          });

          if (null !== s) {
            var r = new n.Pose({
              position: i.position,
              orientation: i.quaternion
            });
            r.applyTransform(new n.Transform(s));
            var o = new M({
              message: e,
              path: t.path,
              loader: t.loader
            });
            o.position.add(l), o.position.applyQuaternion(c), o.quaternion.multiplyQuaternions(c, o.quaternion);
            var a = new h.Vector3(o.position.x, o.position.y, o.position.z),
                u = new n.Transform({
              translation: a,
              orientation: o.quaternion
            });
            r.applyTransform(u), i.setPose(r), i.updateMatrixWorld(), d.unsubscribe(e.header.frame_id);
          }

          t.add(i);
        };

        "" !== e.header.frame_id ? d.subscribe(e.header.frame_id, s) : s(null);
      });
    }

    updateMatrixWorld(e) {
      var t = this,
          s = this.message;

      switch (s.orientation_mode) {
        case 0:
          super.updateMatrixWorld(e), t.currentControlOri.copy(t.quaternion), t.currentControlOri.normalize();
          break;

        case 1:
          t.quaternion.copy(t.parent.quaternion.clone().inverse()), t.updateMatrix(), t.matrixWorldNeedsUpdate = !0, super.updateMatrixWorld(e), t.currentControlOri.copy(t.quaternion);
          break;

        case 2:
          t.camera.updateMatrixWorld();
          var i = new h.Matrix4().extractRotation(t.camera.matrixWorld),
              r = new h.Matrix4(),
              o = .5 * Math.PI,
              a = new h.Euler(-o, 0, o);
          r.makeRotationFromEuler(a);
          var n = new h.Matrix4();
          n.getInverse(t.parent.matrixWorld), i.multiplyMatrices(i, r), i.multiplyMatrices(n, i), t.currentControlOri.setFromRotationMatrix(i), s.independent_marker_orientation || (t.quaternion.copy(t.currentControlOri), t.updateMatrix(), t.matrixWorldNeedsUpdate = !0), super.updateMatrixWorld(e);
          break;

        default:
          console.error("Unkown orientation mode: " + s.orientation_mode);
      }
    }

  }

  class E extends h.EventDispatcher {
    constructor(e) {
      super();
      var t = this,
          s = (e = e || {}).menuEntries,
          i = e.className || "default-interactive-marker-menu";
      e.entryClassName;
      var r,
          o,
          a,
          n = e.overlayClassName || "default-interactive-marker-overlay",
          c = e.menuFontSize || "0.8em",
          h = [];

      if (h[0] = {
        children: []
      }, null === document.getElementById("default-interactive-marker-menu-css")) {
        var l = document.createElement("style");
        l.id = "default-interactive-marker-menu-css", l.type = "text/css", l.innerHTML = ".default-interactive-marker-menu {background-color: #444444;border: 1px solid #888888;border: 1px solid #888888;padding: 0px 0px 0px 0px;color: #FFFFFF;font-family: sans-serif;font-size: " + c + ";z-index: 1002;}.default-interactive-marker-menu ul {padding: 0px 0px 5px 0px;margin: 0px;list-style-type: none;}.default-interactive-marker-menu ul li div {-webkit-touch-callout: none;-webkit-user-select: none;-khtml-user-select: none;-moz-user-select: none;-ms-user-select: none;user-select: none;cursor: default;padding: 3px 10px 3px 10px;}.default-interactive-marker-menu-entry:hover {  background-color: #666666;  cursor: pointer;}.default-interactive-marker-menu ul ul {  font-style: italic;  padding-left: 10px;}.default-interactive-marker-overlay {  position: absolute;  top: 0%;  left: 0%;  width: 100%;  height: 100%;  background-color: black;  z-index: 1001;  -moz-opacity: 0.0;  opacity: .0;  filter: alpha(opacity = 0);}", document.getElementsByTagName("head")[0].appendChild(l);
      }

      for (this.menuDomElem = document.createElement("div"), this.menuDomElem.style.position = "absolute", this.menuDomElem.className = i, this.menuDomElem.addEventListener("contextmenu", function (e) {
        e.preventDefault();
      }), this.overlayDomElem = document.createElement("div"), this.overlayDomElem.className = n, this.hideListener = this.hide.bind(this), this.overlayDomElem.addEventListener("contextmenu", this.hideListener), this.overlayDomElem.addEventListener("click", this.hideListener), this.overlayDomElem.addEventListener("touchstart", this.hideListener), r = 0; r < s.length; r++) h[a = (o = s[r]).id] = {
        title: o.title,
        id: a,
        children: []
      };

      for (r = 0; r < s.length; r++) {
        var d = h[a = (o = s[r]).id];
        h[o.parent_id].children.push(d);
      }

      function u(e, t) {
        this.dispatchEvent({
          type: "menu-select",
          domEvent: t,
          id: e.id,
          controlName: this.controlName
        }), this.hide(t);
      }

      !function e(s, i) {
        var r = document.createElement("ul");
        s.appendChild(r);

        for (var o = i.children, a = 0; a < o.length; a++) {
          var n = document.createElement("li"),
              c = document.createElement("div");
          c.appendChild(document.createTextNode(o[a].title)), r.appendChild(n), n.appendChild(c), o[a].children.length > 0 ? (e(n, o[a]), c.addEventListener("click", t.hide.bind(t)), c.addEventListener("touchstart", t.hide.bind(t))) : (c.addEventListener("click", u.bind(t, o[a])), c.addEventListener("touchstart", u.bind(t, o[a])), c.className = "default-interactive-marker-menu-entry");
        }
      }(this.menuDomElem, h[0]);
    }

    show(e, t) {
      t && t.preventDefault && t.preventDefault(), this.controlName = e.name, void 0 !== t.domEvent.changedTouches ? (this.menuDomElem.style.left = t.domEvent.changedTouches[0].pageX + "px", this.menuDomElem.style.top = t.domEvent.changedTouches[0].pageY + "px") : (this.menuDomElem.style.left = t.domEvent.clientX + "px", this.menuDomElem.style.top = t.domEvent.clientY + "px"), document.body.appendChild(this.overlayDomElem), document.body.appendChild(this.menuDomElem);
    }

    hide(e) {
      e && e.preventDefault && e.preventDefault(), document.body.removeChild(this.overlayDomElem), document.body.removeChild(this.menuDomElem);
    }

  }

  class _ extends h.Object3D {
    constructor(e) {
      super();
      var t = this,
          s = (e = e || {}).handle;
      this.name = s.name;
      var i = e.camera,
          r = e.path || "/",
          o = e.loader;
      this.dragging = !1, this.onServerSetPose({
        pose: s.pose
      }), this.dragStart = {
        position: new h.Vector3(),
        orientation: new h.Quaternion(),
        positionWorld: new h.Vector3(),
        orientationWorld: new h.Quaternion(),
        event3d: {}
      }, s.controls.forEach(function (e) {
        t.add(new C({
          parent: t,
          handle: s,
          message: e,
          camera: i,
          path: r,
          loader: o
        }));
      }), s.menuEntries.length > 0 && (this.menu = new E({
        menuEntries: s.menuEntries,
        menuFontSize: s.menuFontSize
      }), this.menu.addEventListener("menu-select", function (e) {
        t.dispatchEvent(e);
      }));
    }

    showMenu(e, t) {
      this.menu && this.menu.show(e, t);
    }

    moveAxis(e, t, s) {
      if (this.dragging) {
        var i = e.currentControlOri,
            r = t.clone().applyQuaternion(i),
            o = this.dragStart.event3d.intersection.point,
            a = r.clone().applyQuaternion(this.dragStart.orientationWorld.clone()),
            n = new h.Ray(o, a),
            c = p(n, s.camera, s.mousePos),
            l = new h.Vector3();
        l.addVectors(this.dragStart.position, r.clone().applyQuaternion(this.dragStart.orientation).multiplyScalar(c)), this.setPosition(e, l), s.stopPropagation();
      }
    }

    move3d(e, t, s) {
      if (this.dragging) if (e.isShift) ;else {
        var i = e.camera.getWorldDirection(),
            r = Math.abs(i.x),
            o = Math.abs(i.y),
            a = Math.abs(i.z),
            n = new h.Quaternion(1, 0, 0, 1);
        o > r && o > a ? n = new h.Quaternion(0, 0, 1, 1) : a > r && a > o && (n = new h.Quaternion(0, 1, 0, 1)), n.normalize(), (t = new h.Vector3(1, 0, 0)).applyQuaternion(n), this.movePlane(e, t, s);
      }
    }

    movePlane(e, t, s) {
      if (this.dragging) {
        var i = e.currentControlOri,
            r = t.clone().applyQuaternion(i),
            o = this.dragStart.event3d.intersection.point,
            a = r.clone().applyQuaternion(this.dragStart.orientationWorld),
            n = d(s.mouseRay, o, a),
            c = new h.Vector3();
        c.subVectors(n, o), c.add(this.dragStart.positionWorld), this.setPosition(e, c), s.stopPropagation();
      }
    }

    rotateAxis(e, t, s) {
      if (this.dragging) {
        e.updateMatrixWorld();
        var i = e.currentControlOri.clone().multiply(t.clone()),
            r = new h.Vector3(1, 0, 0).applyQuaternion(i),
            o = this.dragStart.event3d.intersection.point,
            a = r.applyQuaternion(this.dragStart.orientationWorld),
            n = d(s.mouseRay, o, a),
            c = new h.Ray(this.dragStart.positionWorld, a),
            l = d(c, o, a),
            u = this.dragStart.orientationWorld.clone().multiply(i).clone().inverse();
        n.sub(l), n.applyQuaternion(u);
        var p = this.dragStart.event3d.intersection.point.clone();
        p.sub(l), p.applyQuaternion(u);
        var m = Math.atan2(n.y, n.z),
            f = Math.atan2(p.y, p.z) - m,
            v = new h.Quaternion();
        v.setFromAxisAngle(r, f), this.setOrientation(e, v.multiply(this.dragStart.orientationWorld)), s.stopPropagation();
      }
    }

    feedbackEvent(e, t) {
      this.dispatchEvent({
        type: e,
        position: this.position.clone(),
        orientation: this.quaternion.clone(),
        controlName: t.name
      });
    }

    startDrag(e, t) {
      if (0 === t.domEvent.button) {
        t.stopPropagation(), this.dragging = !0, this.updateMatrixWorld(!0);
        var s = new h.Vector3();
        this.matrixWorld.decompose(this.dragStart.positionWorld, this.dragStart.orientationWorld, s), this.dragStart.position = this.position.clone(), this.dragStart.orientation = this.quaternion.clone(), this.dragStart.event3d = t, this.feedbackEvent("user-mousedown", e);
      }
    }

    stopDrag(e, t) {
      0 === t.domEvent.button && (t.stopPropagation(), this.dragging = !1, this.dragStart.event3d = {}, this.onServerSetPose(this.bufferedPoseEvent), this.bufferedPoseEvent = void 0, this.feedbackEvent("user-mouseup", e));
    }

    buttonClick(e, t) {
      t.stopPropagation(), this.feedbackEvent("user-button-click", e);
    }

    setPosition(e, t) {
      this.position.copy(t), this.feedbackEvent("user-pose-change", e);
    }

    setOrientation(e, t) {
      t.normalize(), this.quaternion.copy(t), this.feedbackEvent("user-pose-change", e);
    }

    onServerSetPose(e) {
      if (void 0 !== e) if (this.dragging) this.bufferedPoseEvent = e;else {
        var t = e.pose;
        this.position.copy(t.position), this.quaternion.copy(t.orientation), this.updateMatrixWorld(!0);
      }
    }

    dispose() {
      var e = this;
      this.children.forEach(function (t) {
        t.children.forEach(function (e) {
          e.dispose(), t.remove(e);
        }), e.remove(t);
      });
    }

  }

  class k extends c.default {
    constructor(e) {
      super(), e = e || {}, this.message = e.message, this.feedbackTopic = e.feedbackTopic, this.tfClient = e.tfClient, this.menuFontSize = e.menuFontSize || "0.8em", this.name = this.message.name, this.header = this.message.header, this.controls = this.message.controls, this.menuEntries = this.message.menu_entries, this.dragging = !1, this.timeoutHandle = null, this.tfTransform = new n.Transform(), this.pose = new n.Pose(), this.setPoseFromClientBound = this.setPoseFromClient.bind(this), this.onMouseDownBound = this.onMouseDown.bind(this), this.onMouseUpBound = this.onMouseUp.bind(this), this.onButtonClickBound = this.onButtonClick.bind(this), this.onMenuSelectBound = this.onMenuSelect.bind(this), this.setPoseFromServer(this.message.pose), this.tfUpdateBound = this.tfUpdate.bind(this);
    }

    subscribeTf() {
      0 === this.message.header.stamp.secs && 0 === this.message.header.stamp.nsecs && this.tfClient.subscribe(this.message.header.frame_id, this.tfUpdateBound);
    }

    unsubscribeTf() {
      this.tfClient.unsubscribe(this.message.header.frame_id, this.tfUpdateBound);
    }

    emitServerPoseUpdate() {
      var e = new n.Pose(this.pose);
      e.applyTransform(this.tfTransform), this.emit("pose", e);
    }

    setPoseFromServer(e) {
      this.pose = new n.Pose(e), this.emitServerPoseUpdate();
    }

    tfUpdate(e) {
      this.tfTransform = new n.Transform(e), this.emitServerPoseUpdate();
    }

    setPoseFromClient(e) {
      this.pose = new n.Pose(e);
      var t = this.tfTransform.clone();
      t.rotation.invert(), t.translation.multiplyQuaternion(t.rotation), t.translation.x *= -1, t.translation.y *= -1, t.translation.z *= -1, this.pose.applyTransform(t), this.sendFeedback(1, void 0, 0, e.controlName), this.dragging && (this.timeoutHandle && clearTimeout(this.timeoutHandle), this.timeoutHandle = setTimeout(this.setPoseFromClient.bind(this, e), 250));
    }

    onButtonClick(e) {
      this.sendFeedback(3, e.clickPosition, 0, e.controlName);
    }

    onMouseDown(e) {
      this.sendFeedback(4, e.clickPosition, 0, e.controlName), this.dragging = !0;
    }

    onMouseUp(e) {
      this.sendFeedback(5, e.clickPosition, 0, e.controlName), this.dragging = !1, this.timeoutHandle && clearTimeout(this.timeoutHandle);
    }

    onMenuSelect(e) {
      this.sendFeedback(2, void 0, e.id, e.controlName);
    }

    sendFeedback(e, t, s, i) {
      var r = void 0 !== t;
      t = t || {
        x: 0,
        y: 0,
        z: 0
      };
      var o = {
        header: this.header,
        client_id: this.clientID,
        marker_name: this.name,
        control_name: i,
        event_type: e,
        pose: this.pose,
        mouse_point: t,
        mouse_point_valid: r,
        menu_entry_id: s
      };
      this.feedbackTopic.publish(o);
    }

  }

  class A extends h.Object3D {
    constructor(e) {
      super(), e = e || {};
      var t = this;
      this.tfClient = e.tfClient, this.frameID = e.frameID;
      var s = e.object;
      this.pose = e.pose || new n.Pose(), this.visible = !1, this.add(s), this.updatePose(this.pose), this.tfUpdate = function (e) {
        var s = new n.Transform(e),
            i = new n.Pose(t.pose);
        i.applyTransform(s), t.updatePose(i), t.visible = !0;
      }, this.tfClient.subscribe(this.frameID, this.tfUpdate);
    }

    updatePose(e) {
      this.position.set(e.position.x, e.position.y, e.position.z), this.quaternion.set(e.orientation.x, e.orientation.y, e.orientation.z, e.orientation.w), this.updateMatrixWorld(!0);
    }

    unsubscribeTf() {
      this.tfClient.unsubscribe(this.frameID, this.tfUpdate);
    }

  }

  class N extends c.default {
    constructor(e) {
      super(), e = e || {}, this.ros = e.ros, this.topicName = e.topic, this.tfClient = e.tfClient, this.rootObject = e.rootObject || new h.Object3D(), this.path = e.path || "/", this.markers = {}, this.rosTopic = void 0, this.subscribe();
    }

    subscribe() {
      this.unsubscribe(), this.rosTopic = new n.Topic({
        ros: this.ros,
        name: this.topicName,
        messageType: "visualization_msgs/MarkerArray",
        compression: "png"
      }), this.rosTopic.subscribe(this.processMessage.bind(this));
    }

    processMessage(e) {
      e.markers.forEach(function (e) {
        var t = e.ns + e.id;

        if (0 === e.action) {
          var s = !1;

          if (t in this.markers && ((s = this.markers[t].children[0].update(e)) || this.removeMarker(t)), !s) {
            var i = new M({
              message: e,
              path: this.path
            });
            this.markers[t] = new A({
              frameID: e.header.frame_id,
              tfClient: this.tfClient,
              object: i
            }), this.rootObject.add(this.markers[t]);
          }
        } else if (1 === e.action) console.warn('Received marker message with deprecated action identifier "1"');else if (2 === e.action) this.removeMarker(t);else if (3 === e.action) {
          for (var r in this.markers) this.removeMarker(r);

          this.markers = {};
        } else console.warn('Received marker message with unknown action identifier "' + e.action + '"');
      }.bind(this)), this.emit("change");
    }

    unsubscribe() {
      this.rosTopic && this.rosTopic.unsubscribe(this.processMessage);
    }

    removeMarker(e) {
      var t = this.markers[e];
      t && (t.unsubscribeTf(), this.rootObject.remove(t), t.children.forEach(e => {
        e.dispose();
      }), delete this.markers[e]);
    }

  }

  class O extends c.default {
    constructor(e) {
      super(), e = e || {}, this.ros = e.ros, this.topicName = e.topic, this.tfClient = e.tfClient, this.rootObject = e.rootObject || new h.Object3D(), this.path = e.path || "/", this.lifetime = e.lifetime || 0, this.markers = {}, this.rosTopic = void 0, this.updatedTime = {}, this.subscribe();
    }

    unsubscribe() {
      this.rosTopic && this.rosTopic.unsubscribe(this.processMessage);
    }

    checkTime(e) {
      if (new Date().getTime() - this.updatedTime[e] > this.lifetime) this.removeMarker(e), this.emit("change");else {
        var t = this;
        setTimeout(function () {
          t.checkTime(e);
        }, 100);
      }
    }

    subscribe() {
      this.unsubscribe(), this.rosTopic = new n.Topic({
        ros: this.ros,
        name: this.topicName,
        messageType: "visualization_msgs/Marker",
        compression: "png"
      }), this.rosTopic.subscribe(this.processMessage.bind(this));
    }

    processMessage(e) {
      var t = e.ns + e.id,
          s = this.markers[t];

      if (this.updatedTime[t] = new Date().getTime(), s ? this.removeMarker(t) : this.lifetime && this.checkTime(e.ns + e.id), 0 === e.action) {
        var i = new M({
          message: e,
          path: this.path
        });
        this.markers[t] = new A({
          frameID: e.header.frame_id,
          tfClient: this.tfClient,
          object: i
        }), this.rootObject.add(this.markers[t]);
      }

      this.emit("change");
    }

    removeMarker(e) {
      var t = this.markers[e];
      t && (t.unsubscribeTf(), this.rootObject.remove(t), t.children.forEach(e => {
        e.dispose();
      }), delete this.markers[e]);
    }

  }

  class L extends h.ArrowHelper {
    constructor(e) {
      var t = (e = e || {}).origin || new h.Vector3(0, 0, 0),
          s = e.direction || new h.Vector3(1, 0, 0),
          i = e.length || 1;
      e.headLength, e.shaftDiameter, e.headDiameter, e.material || new h.MeshBasicMaterial(), super(s, t, i, 16711680);
    }

    dispose() {
      void 0 !== this.line && (this.line.material.dispose(), this.line.geometry.dispose()), void 0 !== this.cone && (this.cone.material.dispose(), this.cone.geometry.dispose());
    }

  }

  class j extends h.Object3D {
    constructor(e) {
      super();
      var t = this,
          s = (e = e || {}).shaftRadius || .008,
          i = e.headRadius || .023,
          r = e.headLength || .1,
          o = e.scale || 1,
          a = e.lineType || "full",
          n = e.lineDashLength || .1;

      function c(e) {
        var i = new h.Color();
        i.setRGB(e.x, e.y, e.z);
        var r = new h.MeshBasicMaterial({
          color: i.getHex()
        }),
            o = new h.Vector3();
        o.crossVectors(e, new h.Vector3(0, -1, 0));
        var c = new h.Quaternion();
        c.setFromAxisAngle(o, .5 * Math.PI);
        var l,
            d = new h.Mesh(t.headGeom, r);
        if (d.position.copy(e), d.position.multiplyScalar(.95), d.quaternion.copy(c), d.updateMatrix(), t.add(d), "dashed" === a) for (var u = n, p = 0; u / 2 + 3 * u * p + u / 2 <= 1; ++p) {
          var m = new h.CylinderGeometry(s, s, u);
          (l = new h.Mesh(m, r)).position.copy(e), l.position.multiplyScalar(u / 2 + 3 * u * p), l.quaternion.copy(c), l.updateMatrix(), t.add(l);
        } else "full" === a ? ((l = new h.Mesh(t.lineGeom, r)).position.copy(e), l.position.multiplyScalar(.45), l.quaternion.copy(c), l.updateMatrix(), t.add(l)) : console.warn("[Axes]: Unsupported line type. Not drawing any axes.");
      }

      this.scale.set(o, o, o), this.lineGeom = new h.CylinderGeometry(s, s, 1 - r), this.headGeom = new h.CylinderGeometry(0, i, r), c(new h.Vector3(1, 0, 0)), c(new h.Vector3(0, 1, 0)), c(new h.Vector3(0, 0, 1));
    }

  }

  class R extends h.Object3D {
    constructor(e) {
      var t = (e = e || {}).num_cells || 10,
          s = e.color || "#cccccc",
          i = e.lineWidth || 1,
          r = e.cellSize || 1;
      super();

      for (var o = new h.LineBasicMaterial({
        color: s,
        linewidth: i
      }), a = 0; a <= t; ++a) {
        var n = r * t / 2,
            c = n - a * r,
            l = new h.Geometry();
        l.vertices.push(new h.Vector3(-n, c, 0), new h.Vector3(n, c, 0));
        var d = new h.Geometry();
        d.vertices.push(new h.Vector3(c, -n, 0), new h.Vector3(c, n, 0)), this.add(new h.Line(l, o)), this.add(new h.Line(d, o));
      }
    }

  }

  class D extends h.Mesh {
    constructor(e) {
      var t = (e = e || {}).message,
          s = e.opacity || 1,
          i = e.color || {
        r: 255,
        g: 255,
        b: 255,
        a: 255
      },
          r = t.info,
          o = r.origin,
          a = r.width,
          n = r.height,
          c = new h.PlaneBufferGeometry(a, n),
          l = new Uint8Array(a * n * 4),
          d = new h.DataTexture(l, a, n, h.RGBAFormat);
      d.flipY = !0, d.minFilter = h.NearestFilter, d.magFilter = h.NearestFilter, d.needsUpdate = !0;
      var u = new h.MeshBasicMaterial({
        map: d,
        transparent: s < 1,
        opacity: s
      });
      u.side = h.DoubleSide, super(c, u), Object.assign(this, e), this.quaternion.copy(new h.Quaternion(o.orientation.x, o.orientation.y, o.orientation.z, o.orientation.w)), this.position.x = a * r.resolution / 2 + o.position.x, this.position.y = n * r.resolution / 2 + o.position.y, this.position.z = o.position.z, this.scale.x = r.resolution, this.scale.y = r.resolution;
      var p = t.data;
      this.color = i, this.material = u, this.texture = d;

      for (var m = 0; m < n; m++) for (var f = 0; f < a; f++) {
        var v = n - m - 1,
            g = f + v * a,
            b = this.getValue(g, v, f, p),
            y = (i = this.getColor(g, v, f, b), 4 * (f + m * a));
        l.set(i, y);
      }

      d.needsUpdate = !0;
    }

    dispose() {
      this.material.dispose(), this.texture.dispose();
    }

    getValue(e, t, s, i) {
      return i[e];
    }

    getColor(e, t, s, i) {
      return [i * this.color.r / 255, i * this.color.g / 255, i * this.color.b / 255, 255];
    }

  }

  class S extends c.default {
    constructor(e) {
      super(), e = e || {}, this.ros = e.ros, this.topicName = e.topic || "/map", this.compression = e.compression || "cbor", this.continuous = e.continuous, this.tfClient = e.tfClient, this.rootObject = e.rootObject || new h.Object3D(), this.offsetPose = e.offsetPose || new n.Pose(), this.color = e.color || {
        r: 255,
        g: 255,
        b: 255
      }, this.opacity = e.opacity || 1, this.currentGrid = null, this.rosTopic = void 0, this.subscribe();
    }

    unsubscribe() {
      this.rosTopic && this.rosTopic.unsubscribe(this.processMessage);
    }

    subscribe() {
      this.unsubscribe(), this.rosTopic = new n.Topic({
        ros: this.ros,
        name: this.topicName,
        messageType: "nav_msgs/OccupancyGrid",
        queue_length: 1,
        compression: this.compression
      }), this.sceneNode = null, this.rosTopic.subscribe(this.processMessage.bind(this));
    }

    processMessage(e) {
      this.currentGrid && (this.tfClient ? (this.sceneNode.unsubscribeTf(), this.sceneNode.remove(this.currentGrid)) : this.rootObject.remove(this.currentGrid), this.currentGrid.dispose());
      var t = new D({
        message: e,
        color: this.color,
        opacity: this.opacity
      });
      this.tfClient ? (this.currentGrid = t, null === this.sceneNode ? (this.sceneNode = new A({
        frameID: e.header.frame_id,
        tfClient: this.tfClient,
        object: t,
        pose: this.offsetPose
      }), this.rootObject.add(this.sceneNode)) : this.sceneNode.add(this.currentGrid)) : (this.sceneNode = this.currentGrid = t, this.rootObject.add(this.currentGrid)), this.emit("change"), this.continuous || this.rosTopic.unsubscribe(this.processMessage);
    }

  }

  class I {
    constructor() {
      this._children = [null, null, null, null, null, null, null, null], this.value = null;
    }

    createChildNodeAt(e, t) {
      this._children[t % 8] = e;
    }

    hasChildAt(e) {
      return null !== this._children[e % 8];
    }

    getChildAt(e) {
      return this._children[e % 8];
    }

    isLeafNode() {
      for (let e = 0; e < 8; ++e) if (null !== this._children[e]) return !1;

      return !0;
    }

    hasChildren() {
      for (let e = 0; e < 8; ++e) if (null !== this._children[e]) return !0;

      return !1;
    }

  }

  var P = "occupied",
      V = "free",
      F = "solid",
      B = "color";

  function z(e, t) {
    return this.buffer = e.buffer, this.length = e.length, this.isLittleEndian = void 0 === t || !!t, this._dataView = new DataView(this.buffer), this._cursor = 0, [{
      kind: "Int8",
      width: 1
    }, {
      kind: "Uint8",
      width: 1
    }, {
      kind: "Int16",
      width: 2
    }, {
      kind: "Uint16",
      width: 2
    }, {
      kind: "Int32",
      width: 4
    }, {
      kind: "Uint32",
      width: 4
    }, {
      kind: "BigInt64",
      width: 8
    }, {
      kind: "BigUint64",
      width: 8
    }, {
      kind: "Float32",
      width: 4
    }, {
      kind: "Float64",
      width: 8
    }].forEach(e => {
      const t = "read" + e.kind,
            s = "get" + e.kind;

      this[t] = () => {
        if (this._cursor + e.width > this.length) throw new Error("Cannot read data stream. Overflow. Len=" + this.length + " crsr=" + this._cursor);

        const t = this._dataView[s](this._cursor, this.isLittleEndian);

        return this._cursor += e.width, t;
      };
    }), Object.defineProperty(this, "isEnd", {
      get: () => this.cursor >= this.data.length
    }), this;
  }

  class U {
    constructor(e) {
      this.resolution = void 0 !== e.resolution ? e.resolution : 1, this.color = new h.Color(void 0 !== e.color ? e.color : "green"), this.opacity = void 0 !== e.opacity ? e.opacity : 1, this.voxelRenderMode = void 0 !== e.voxelRenderMode ? e.voxelRenderMode : P, this._rootNode = null, this._treeDepth = 16, this._treeMaxKeyVal = 32768, this._BINARY_UNALLOCATED = 0, this._BINARY_LEAF_FREE = 1, this._BINARY_LEAF_OCCUPIED = 2, this._BINARY_HAS_CHILDREN = 3, this._BINARY_CHILD_BUILD_TABLE = {}, this._BINARY_CHILD_BUILD_TABLE[this._BINARY_LEAF_FREE] = function (e) {
        e.value = this._defaultFreeValue;
      }, this._BINARY_CHILD_BUILD_TABLE[this._BINARY_LEAF_OCCUPIED] = function (e) {
        e.value = this._defaultOccupiedValue;
      }, this._BINARY_CHILD_BUILD_TABLE[this._BINARY_HAS_CHILDREN] = function (e) {
        e.value = null;
      }, this._FACES = [{
        normal: [-1, 0, 0],
        vertices: [[0, 1, 0], [0, 0, 0], [0, 1, 1], [0, 0, 1]],
        childIndex: [1, 3, 5, 7]
      }, {
        normal: [1, 0, 0],
        vertices: [[1, 1, 1], [1, 0, 1], [1, 1, 0], [1, 0, 0]],
        childIndex: [0, 2, 4, 6]
      }, {
        normal: [0, -1, 0],
        vertices: [[1, 0, 1], [0, 0, 1], [1, 0, 0], [0, 0, 0]],
        childIndex: [2, 3, 6, 7]
      }, {
        normal: [0, 1, 0],
        vertices: [[0, 1, 1], [1, 1, 1], [0, 1, 0], [1, 1, 0]],
        childIndex: [0, 1, 4, 5]
      }, {
        normal: [0, 0, -1],
        vertices: [[1, 0, 0], [0, 0, 0], [1, 1, 0], [0, 1, 0]],
        childIndex: [4, 5, 6, 7]
      }, {
        normal: [0, 0, 1],
        vertices: [[0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1]],
        childIndex: [0, 1, 2, 3]
      }], this.nodeSizeTable = new Array(this._treeDepth);
      let t = this.resolution;

      for (let e = this._treeDepth - 1; e >= 0; --e) this.nodeSizeTable[e] = t, t *= 2;

      this._defaultOccupiedValue = !0, this._defaultFreeValue = !1, this.object = null;
    }

    searchAtDepth(e, t) {
      t = void 0 !== t && t > 0 ? t : this._treeDepth;

      const s = this._adjustKeyAtDepth(e, t),
            i = this._treeDepth - t;

      let r = this._rootNode;

      for (let e = this._treeDepth - 1; e >= i; --e) {
        const t = this._computeChildIdx(s, e);

        if (!r.hasChildAt(t)) return r.hasChildren() ? null : r;
        r = r.getChildAt(t);
      }

      return r;
    }

    _computeCoordFromKey(e) {
      return e.map(e => this.resolution * (e - this._treeMaxKeyVal));
    }

    _computeChildIdx(e, t) {
      let s = 0;
      return e[0] & 1 << t && (s += 1), e[1] & 1 << t && (s += 2), e[2] & 1 << t && (s += 4), s;
    }

    _computeKeyFromChildIdx(e, t, s) {
      const i = this._treeDepth - s - 1;
      return [t[0] + (!!(1 & e) << i), t[1] + (!!(2 & e) << i), t[2] + (!!(4 & e) << i)];
    }

    _adjustKeyAtDepth(e, t) {
      let s = this._treeDepth - t;
      return 0 === s ? e : e.map(e => (e - this._treeMaxKeyVal >> s << s) + (1 << s - 1) + this._treeMaxKeyVal);
    }

    _newNode() {
      return new I();
    }

    readBinary(e) {
      null !== this._rootNode && delete this._rootNode, this._rootNode = this._newNode();
      let t = new z(e, !0),
          s = new Array();

      for (s.push(this._rootNode); s.length > 0;) {
        let e = s.pop();
        const i = t.readUint16();
        let r = 8;

        for (; 0 !== r;) {
          --r;
          const t = (i & 3 << 2 * r) >> 2 * r;

          if (t !== this._BINARY_UNALLOCATED) {
            let i = this._newNode();

            this._BINARY_CHILD_BUILD_TABLE[t].bind(this)(i), e.createChildNodeAt(i, r), t === this._BINARY_HAS_CHILDREN && s.push(i);
          }
        }
      }
    }

    read(e) {
      null !== this._rootNode && delete this._rootNode, this._rootNode = this._newNode();
      let t = new z(e, !0),
          s = new Array();

      for (s.push(this._rootNode); s.length > 0;) {
        let e = s.pop();

        this._readNodeData(t, e);

        const i = t.readUint8();
        let r = 8;

        for (; 0 !== r;) {
          --r;

          if (i & 1 << r) {
            let t = this._newNode();

            t.value = null, e.createChildNodeAt(t, r), s.push(t);
          }
        }
      }
    }

    _readNodeData(e, t) {
      console.error("Not implemented");
    }

    buildGeometry() {
      console.assert(null !== this._rootNode, "No tree data");

      const {
        vertices: e,
        normals: t,
        colors: s,
        indices: i
      } = this._buildFaces(),
            r = new h.BufferGeometry(),
            o = new h.MeshBasicMaterial({
        color: "white",
        flatShading: !0,
        vertexColors: h.VertexColors,
        transparent: this.opacity < 1,
        opacity: this.opacity
      });

      r.addAttribute("position", new h.BufferAttribute(new Float32Array(e), 3)), r.addAttribute("normal", new h.BufferAttribute(new Float32Array(t), 3)), r.addAttribute("color", new h.BufferAttribute(new Float32Array(s), 3)), r.setIndex(i);
      const a = new h.Mesh(r, o);
      this.object = new h.Object3D(), this.object.add(a);
    }

    _traverseLeaves(e) {
      let t = new Array();

      for (t.push({
        node: this._rootNode,
        depth: 0,
        key: [0, 0, 0]
      }); t.length > 0;) {
        let s = t.pop();
        if (s.node.isLeafNode()) e(s.node, s.key, s.depth - 1);else for (let e = 0; e < 8; ++e) if (s.node.hasChildAt(e)) {
          const i = this._computeKeyFromChildIdx(e, s.key, s.depth);

          t.push({
            node: s.node.getChildAt(e),
            depth: s.depth + 1,
            key: i
          });
        }
      }
    }

    _obtainColor(e) {
      return this.color;
    }

    _checkOccupied(e) {
      return !1 !== e.value;
    }

    _buildFaces() {
      let e = {
        vertices: [],
        indices: [],
        normals: [],
        colors: [],
        _insertFace: function (e, t, s, i) {
          const r = this.vertices.length / 3;
          e.vertices.forEach(function (e) {
            this.vertices.push(t[0] + e[0] * s, t[1] + e[1] * s, t[2] + e[2] * s);
          });
          const o = [i.r, i.g, i.b];
          this.colors.push(...o, ...o, ...o, ...o), this.normals.push(...e.normal, ...e.normal, ...e.normal, ...e.normal), this.indices.push(r, r + 1, r + 2, r + 2, r + 1, r + 3);
        },
        _checkNeighborsTouchingFace: function (e, t, s) {
          let i = new Array();

          for (i.push(t); 0 !== i.length;) {
            const t = i.pop();
            t.hasChildren() && e.childIndex.forEach(function (e) {
              if (!t.hasChildAt(e)) return !0;
              {
                const r = t.getChildAt(e),
                      o = this._checkOccupied(t);

                (o && s === ROS3D.OcTreeVoxelRenderMode.OCCUPIED || !o && s === V) && i.push(r);
              }
            });
          }

          return !1;
        }
      };
      return this._traverseLeaves((t, s, i) => {
        const r = this._computeCoordFromKey(s),
              o = this.nodeSizeTable[i],
              a = this._treeDepth - i,
              n = this._checkOccupied(t);

        (n || this.voxelRenderMode !== P) && (n && this.voxelRenderMode === V || this._FACES.forEach(function (n) {
          const c = [s[0] + n.normal[0] * a * a, s[1] + n.normal[1] * a * a, s[2] + n.normal[2] * a * a],
                h = this.searchAtDepth(c);
          null === h ? e._insertFace(n, r, o, this._obtainColor(t)) : i < this._treeDepth && e._checkNeighborsTouchingFace(n, h, this.voxelRenderMode);
        }));
      }), {
        vertices: e.vertices,
        normals: e.normals,
        colors: e.colors,
        indices: e.indices
      };
    }

  }

  class G extends U {
    constructor(e) {
      super(e), this._defaultOccupiedValue = 1, this._defaultFreeValue = -1, this.occupancyThreshold = void 0 !== e.occupancyThreshold ? e.occupancyThreshold : 1e-7, this.useFlatColoring = void 0 !== e.colorMode && e.colorMode === F, this.palette = void 0 !== e.palette ? e.palette.map(e => new h.Color(e)) : [{
        r: 0,
        g: 0,
        b: 128
      }, {
        r: 0,
        g: 255,
        b: 0
      }, {
        r: 255,
        g: 255,
        b: 0
      }, {
        r: 255,
        g: 128,
        b: 0
      }, {
        r: 255,
        g: 0,
        b: 0
      }], this.paletteScale = void 0 !== e.paletteScale ? e.paletteScale : 1;
    }

    _readNodeData(e, t) {
      t.value = e.readFloat32();
    }

    _obtainColor(e) {
      if (this.useFlatColoring) return this.color;
      const t = 1 / (1 + Math.exp(-e.value * this.paletteScale)) * this.palette.length,
            s = Math.trunc(t),
            i = t - s;
      return s < 0 ? this.palette[0] : s >= this.palette.length - 1 ? this.palette[this.palette.length - 1] : {
        r: i * this.palette[s].r + (1 - i) * this.palette[s + 1].r,
        g: i * this.palette[s].g + (1 - i) * this.palette[s + 1].g,
        b: i * this.palette[s].b + (1 - i) * this.palette[s + 1].b
      };
    }

    _checkOccupied(e) {
      return e.value >= this.occupancyThreshold;
    }

  }

  class H extends G {
    constructor(e) {
      super(e), this.useOwnColor = void 0 !== e.palette && e.colorMode === B;
    }

    _readNodeData(e, t) {
      t.value = e.readFloat32(), t.color = {
        r: e.readUint8(),
        g: e.readUint8(),
        b: e.readUint8()
      };
    }

    _obtainColor(e) {
      return this.useOwnColor ? e.color : G.prototype._obtainColor.call(this, e);
    }

  }

  class q extends c.default {
    constructor(e) {
      super(), e = e || {}, this.ros = e.ros, this.topicName = e.topic || "/octomap", this.compression = e.compression || "cbor", this.continuous = e.continuous, this.tfClient = e.tfClient, this.rootObject = e.rootObject || new h.Object3D(), this.offsetPose = e.offsetPose || new n.Pose(), this.options = {}, void 0 !== e.color && (this.options.color = e.color), void 0 !== e.opacity && (this.options.opacity = e.opacity), void 0 !== e.colorMode && (this.options.colorMode = e.colorMode), void 0 !== e.palette && (this.options.palette = e.palette), void 0 !== e.paletteScale && (this.options.paletteScale = e.palette), void 0 !== e.voxelRenderMode && (this.options.voxelRenderMode = e.voxelRenderMode), this.currentMap = null, this.rosTopic = void 0, this.subscribe();
    }

    unsubscribe() {
      this.rosTopic && this.rosTopic.unsubscribe(this.processMessage);
    }

    subscribe() {
      this.unsubscribe(), this.rosTopic = new n.Topic({
        ros: this.ros,
        name: this.topicName,
        messageType: "octomap_msgs/Octomap",
        queue_length: 1,
        compression: this.compression
      }), this.rosTopic.subscribe(this.processMessage.bind(this));
    }

    processMessage(e) {
      this.currentMap && this.currentMap.tfClient && this.currentMap.unsubscribeTf(), this._processMessagePrivate(e), this.continuous || this.rosTopic.unsubscribe(this.processMessage);
    }

    _loadOcTree(e) {
      return new Promise(function (t, s) {
        const i = Object.assign({
          resolution: e.resolution
        }, this.options);
        let r = null;
        if (e.binary) r = new U(i), r.readBinary(e.data);else {
          const t = {
            OcTree: G,
            ColorOcTree: H
          };
          e.id in t && (console.log(e.id, t), r = new t[e.id](i), r.read(e.data));
        }
        r.buildGeometry(), t(r);
      }.bind(this));
    }

    _processMessagePrivate(e) {
      this._loadOcTree(e).then(function (t) {
        const s = this.sceneNode;
        this.tfClient ? (this.currentMap = t, this.sceneNode = new A({
          frameID: e.header.frame_id,
          tfClient: this.tfClient,
          object: t.object,
          pose: this.offsetPose
        })) : (this.sceneNode = t.object, this.currentMap = t), this.rootObject.remove(s), this.rootObject.add(this.sceneNode), this.emit("change");
      }.bind(this));
    }

  }

  class W extends h.Object3D {
    constructor(e) {
      super(), this.options = e || {}, this.ros = e.ros, this.topicName = e.topic || "/particlecloud", this.tfClient = e.tfClient, this.color = e.color || 13369599, this.length = e.length || 1, this.rootObject = e.rootObject || new h.Object3D(), this.keep = e.keep || 1, this.sns = [], this.rosTopic = void 0, this.subscribe();
    }

    unsubscribe() {
      this.rosTopic && this.rosTopic.unsubscribe(this.processMessage);
    }

    subscribe() {
      this.unsubscribe(), this.rosTopic = new n.Topic({
        ros: this.ros,
        name: this.topicName,
        queue_length: 1,
        messageType: "nav_msgs/Odometry"
      }), this.rosTopic.subscribe(this.processMessage.bind(this));
    }

    processMessage(e) {
      this.sns.length >= this.keep && (this.sns[0].unsubscribeTf(), this.rootObject.remove(this.sns[0]), this.sns.shift()), this.options.origin = new h.Vector3(e.pose.pose.position.x, e.pose.pose.position.y, e.pose.pose.position.z);
      var t = new h.Quaternion(e.pose.pose.orientation.x, e.pose.pose.orientation.y, e.pose.pose.orientation.z, e.pose.pose.orientation.w);
      this.options.direction = new h.Vector3(1, 0, 0), this.options.direction.applyQuaternion(t), this.options.material = new h.MeshBasicMaterial({
        color: this.color
      });
      var s = new f(this.options);
      this.sns.push(new A({
        frameID: e.header.frame_id,
        tfClient: this.tfClient,
        object: s
      })), this.rootObject.add(this.sns[this.sns.length - 1]);
    }

  }

  class K extends h.Object3D {
    constructor(e) {
      super(), e = e || {}, this.ros = e.ros, this.topicName = e.topic || "/path", this.tfClient = e.tfClient, this.color = e.color || 13369599, this.rootObject = e.rootObject || new h.Object3D(), this.sn = null, this.line = null, this.rosTopic = void 0, this.subscribe();
    }

    unsubscribe() {
      this.rosTopic && this.rosTopic.unsubscribe(this.processMessage);
    }

    subscribe() {
      this.unsubscribe(), this.rosTopic = new n.Topic({
        ros: this.ros,
        name: this.topicName,
        queue_length: 1,
        messageType: "nav_msgs/Path"
      }), this.rosTopic.subscribe(this.processMessage.bind(this));
    }

    processMessage(e) {
      null !== this.sn && (this.sn.unsubscribeTf(), this.rootObject.remove(this.sn));

      for (var t = new h.Geometry(), s = 0; s < e.poses.length; s++) {
        var i = new h.Vector3(e.poses[s].pose.position.x, e.poses[s].pose.position.y, e.poses[s].pose.position.z);
        t.vertices.push(i);
      }

      t.computeLineDistances();
      var r = new h.LineBasicMaterial({
        color: this.color
      }),
          o = new h.Line(t, r);
      this.sn = new A({
        frameID: e.header.frame_id,
        tfClient: this.tfClient,
        object: o
      }), this.rootObject.add(this.sn);
    }

  }

  class Y extends h.Object3D {
    constructor(e) {
      super(), this.options = e || {}, this.ros = e.ros, this.topicName = e.topic || "/point", this.tfClient = e.tfClient, this.color = e.color || 13369599, this.rootObject = e.rootObject || new h.Object3D(), this.radius = e.radius || .2, this.sn = null, this.rosTopic = void 0, this.subscribe();
    }

    unsubscribe() {
      this.rosTopic && this.rosTopic.unsubscribe(this.processMessage);
    }

    subscribe() {
      this.unsubscribe(), this.rosTopic = new n.Topic({
        ros: this.ros,
        name: this.topicName,
        queue_length: 1,
        messageType: "geometry_msgs/PointStamped"
      }), this.rosTopic.subscribe(this.processMessage.bind(this));
    }

    processMessage(e) {
      null !== this.sn && (this.sn.unsubscribeTf(), this.rootObject.remove(this.sn));
      var t = new h.SphereGeometry(this.radius),
          s = new h.MeshBasicMaterial({
        color: this.color
      }),
          i = new h.Mesh(t, s);
      i.position.set(e.point.x, e.point.y, e.point.z), this.sn = new A({
        frameID: e.header.frame_id,
        tfClient: this.tfClient,
        object: i
      }), this.rootObject.add(this.sn);
    }

  }

  class Q extends h.Object3D {
    constructor(e) {
      super(), e = e || {}, this.ros = e.ros, this.topicName = e.topic || "/path", this.tfClient = e.tfClient, this.color = e.color || 13369599, this.rootObject = e.rootObject || new h.Object3D(), this.sn = null, this.line = null, this.rosTopic = void 0, this.subscribe();
    }

    unsubscribe() {
      this.rosTopic && this.rosTopic.unsubscribe(this.processMessage);
    }

    subscribe() {
      this.unsubscribe(), this.rosTopic = new n.Topic({
        ros: this.ros,
        name: this.topicName,
        queue_length: 1,
        messageType: "geometry_msgs/PolygonStamped"
      }), this.rosTopic.subscribe(this.processMessage.bind(this));
    }

    processMessage(e) {
      null !== this.sn && (this.sn.unsubscribeTf(), this.rootObject.remove(this.sn));

      for (var t, s = new h.Geometry(), i = 0; i < e.polygon.points.length; i++) t = new h.Vector3(e.polygon.points[i].x, e.polygon.points[i].y, e.polygon.points[i].z), s.vertices.push(t);

      t = new h.Vector3(e.polygon.points[0].x, e.polygon.points[0].y, e.polygon.points[0].z), s.vertices.push(t), s.computeLineDistances();
      var r = new h.LineBasicMaterial({
        color: this.color
      }),
          o = new h.Line(s, r);
      this.sn = new A({
        frameID: e.header.frame_id,
        tfClient: this.tfClient,
        object: o
      }), this.rootObject.add(this.sn);
    }

  }

  class X extends h.Object3D {
    constructor(e) {
      super(), this.options = e || {}, this.ros = e.ros, this.topicName = e.topic || "/pose", this.tfClient = e.tfClient, this.color = e.color || 13369599, this.rootObject = e.rootObject || new h.Object3D(), this.sn = null, this.rosTopic = void 0, this.subscribe();
    }

    unsubscribe() {
      this.rosTopic && this.rosTopic.unsubscribe(this.processMessage);
    }

    subscribe() {
      this.unsubscribe(), this.rosTopic = new n.Topic({
        ros: this.ros,
        name: this.topicName,
        queue_length: 1,
        messageType: "geometry_msgs/PoseStamped"
      }), this.rosTopic.subscribe(this.processMessage.bind(this));
    }

    processMessage(e) {
      null !== this.sn && (this.sn.unsubscribeTf(), this.rootObject.remove(this.sn)), this.options.origin = new h.Vector3(e.pose.position.x, e.pose.position.y, e.pose.position.z);
      var t = new h.Quaternion(e.pose.orientation.x, e.pose.orientation.y, e.pose.orientation.z, e.pose.orientation.w);
      this.options.direction = new h.Vector3(1, 0, 0), this.options.direction.applyQuaternion(t), this.options.material = new h.MeshBasicMaterial({
        color: this.color
      });
      var s = new f(this.options);
      this.sn = new A({
        frameID: e.header.frame_id,
        tfClient: this.tfClient,
        object: s
      }), this.rootObject.add(this.sn);
    }

  }

  class Z extends h.Object3D {
    constructor(e) {
      super(), this.options = e || {}, this.ros = e.ros, this.topicName = e.topic || "/particlecloud", this.tfClient = e.tfClient, this.color = e.color || 13369599, this.length = e.length || 1, this.rootObject = e.rootObject || new h.Object3D(), this.sn = null, this.rosTopic = void 0, this.subscribe();
    }

    unsubscribe() {
      this.rosTopic && this.rosTopic.unsubscribe(this.processMessage);
    }

    subscribe() {
      this.unsubscribe(), this.rosTopic = new n.Topic({
        ros: this.ros,
        name: this.topicName,
        queue_length: 1,
        messageType: "geometry_msgs/PoseArray"
      }), this.rosTopic.subscribe(this.processMessage.bind(this));
    }

    processMessage(e) {
      null !== this.sn && (this.sn.unsubscribeTf(), this.rootObject.remove(this.sn));

      for (var t, s = new h.Object3D(), i = 0; i < e.poses.length; i++) {
        var r = new h.Geometry(),
            o = new h.Vector3(e.poses[i].position.x, e.poses[i].position.y, e.poses[i].position.z);
        r.vertices.push(o);
        var a = new h.Quaternion(e.poses[i].orientation.x, e.poses[i].orientation.y, e.poses[i].orientation.z, e.poses[i].orientation.w),
            n = new h.Vector3(this.length, 0, 0),
            c = new h.Vector3(.8 * this.length, .2 * this.length, 0),
            l = new h.Vector3(.8 * this.length, .2 * -this.length, 0);
        n.applyQuaternion(a), c.applyQuaternion(a), l.applyQuaternion(a), r.vertices.push(n.add(o)), r.vertices.push(c.add(o)), r.vertices.push(l.add(o)), r.vertices.push(n), r.computeLineDistances();
        var d = new h.LineBasicMaterial({
          color: this.color
        });
        t = new h.Line(r, d), s.add(t);
      }

      this.sn = new A({
        frameID: e.header.frame_id,
        tfClient: this.tfClient,
        object: s
      }), this.rootObject.add(this.sn);
    }

  }

  class J extends h.Object3D {
    constructor(e) {
      super(), this.options = e || {}, this.ros = e.ros, this.topicName = e.topic || "/PoseWithCovariance", this.tfClient = e.tfClient, this.color = e.color || 13369599, this.rootObject = e.rootObject || new h.Object3D(), this.sn = null, this.rosTopic = void 0, this.subscribe();
    }

    unsubscribe() {
      this.rosTopic && this.rosTopic.unsubscribe(this.processMessage);
    }

    subscribe() {
      this.unsubscribe(), this.rosTopic = new n.Topic({
        ros: this.ros,
        name: this.topicName,
        queue_length: 1,
        messageType: "geometry_msgs/PoseWithCovarianceStamped"
      }), this.rosTopic.subscribe(this.processMessage.bind(this));
    }

    processMessage(e) {
      null !== this.sn && (this.sn.unsubscribeTf(), this.rootObject.remove(this.sn)), this.options.origin = new h.Vector3(e.pose.pose.position.x, e.pose.pose.position.y, e.pose.pose.position.z);
      var t = new h.Quaternion(e.pose.pose.orientation.x, e.pose.pose.orientation.y, e.pose.pose.orientation.z, e.pose.pose.orientation.w);
      this.options.direction = new h.Vector3(1, 0, 0), this.options.direction.applyQuaternion(t), this.options.material = new h.MeshBasicMaterial({
        color: this.color
      });
      var s = new f(this.options);
      this.sn = new A({
        frameID: e.header.frame_id,
        tfClient: this.tfClient,
        object: s
      }), this.rootObject.add(this.sn);
    }

  }

  class $ extends h.Object3D {
    constructor(e) {
      super(), e = e || {}, this.tfClient = e.tfClient, this.rootObject = e.rootObject || new h.Object3D(), this.max_pts = e.max_pts || 1e4, this.pointRatio = e.pointRatio || 1, this.messageRatio = e.messageRatio || 1, this.messageCount = 0, this.material = e.material || {}, this.colorsrc = e.colorsrc, this.colormap = e.colormap, ("color" in e || "size" in e || "texture" in e) && console.warn('toplevel "color", "size" and "texture" options are deprecated.They should beprovided within a "material" option, e.g. :  { tfClient, material : { color: mycolor, size: mysize, map: mytexture }, ... }'), this.sn = null;
    }

    setup(e, t, s) {
      if (null === this.sn) {
        s = s || [], this.fields = {};

        for (var i = 0; i < s.length; i++) this.fields[s[i].name] = s[i];

        if (this.geom = new h.BufferGeometry(), this.positions = new h.BufferAttribute(new Float32Array(3 * this.max_pts), 3, !1), this.geom.addAttribute("position", this.positions.setDynamic(!0)), !this.colorsrc && this.fields.rgb && (this.colorsrc = "rgb"), this.colorsrc) {
          var r = this.fields[this.colorsrc];

          if (r) {
            this.colors = new h.BufferAttribute(new Float32Array(3 * this.max_pts), 3, !1), this.geom.addAttribute("color", this.colors.setDynamic(!0));
            var o = r.offset;
            this.getColor = [function (e, t, s) {
              return e.getInt8(t + o, s);
            }, function (e, t, s) {
              return e.getUint8(t + o, s);
            }, function (e, t, s) {
              return e.getInt16(t + o, s);
            }, function (e, t, s) {
              return e.getUint16(t + o, s);
            }, function (e, t, s) {
              return e.getInt32(t + o, s);
            }, function (e, t, s) {
              return e.getUint32(t + o, s);
            }, function (e, t, s) {
              return e.getFloat32(t + o, s);
            }, function (e, t, s) {
              return e.getFloat64(t + o, s);
            }][r.datatype - 1], this.colormap = this.colormap || function (e) {
              return new h.Color(e);
            };
          } else console.warn('unavailable field "' + this.colorsrc + '" for coloring.');
        }

        this.material.isMaterial || (this.colors && void 0 === this.material.vertexColors && (this.material.vertexColors = h.VertexColors), this.material = new h.PointsMaterial(this.material)), this.object = new h.Points(this.geom, this.material), this.sn = new A({
          frameID: e,
          tfClient: this.tfClient,
          object: this.object
        }), this.rootObject.add(this.sn);
      }

      return this.messageCount++ % this.messageRatio == 0;
    }

    update(e) {
      this.geom.setDrawRange(0, e), this.positions.needsUpdate = !0, this.positions.updateRange.count = e * this.positions.itemSize, this.colors && (this.colors.needsUpdate = !0, this.colors.updateRange.count = e * this.colors.itemSize);
    }

  }

  class ee extends h.Object3D {
    constructor(e) {
      super(), e = e || {}, this.ros = e.ros, this.topicName = e.topic || "/scan", this.compression = e.compression || "cbor", this.points = new $(e), this.rosTopic = void 0, this.subscribe();
    }

    unsubscribe() {
      this.rosTopic && this.rosTopic.unsubscribe(this.processMessage);
    }

    subscribe() {
      this.unsubscribe(), this.rosTopic = new n.Topic({
        ros: this.ros,
        name: this.topicName,
        compression: this.compression,
        queue_length: 1,
        messageType: "sensor_msgs/LaserScan"
      }), this.rosTopic.subscribe(this.processMessage.bind(this));
    }

    processMessage(e) {
      if (this.points.setup(e.header.frame_id)) {
        for (var t = e.ranges.length, s = 0, i = 0; i < t; i += this.points.pointRatio) {
          var r = e.ranges[i];

          if (r >= e.range_min && r <= e.range_max) {
            var o = e.angle_min + i * e.angle_increment;
            this.points.positions.array[s++] = r * Math.cos(o), this.points.positions.array[s++] = r * Math.sin(o), this.points.positions.array[s++] = 0;
          }
        }

        this.points.update(s / 3);
      }
    }

  }

  class te extends h.Object3D {
    constructor(e) {
      super(), e = e || {}, this.ros = e.ros, this.topicName = e.topic || "/gps/fix", this.rootObject = e.rootObject || new h.Object3D(), this.object3d = e.object3d || new h.Object3D();
      var t = e.material || {};
      this.altitudeNaN = e.altitudeNaN || 0, this.keep = e.keep || 100, this.convert = e.convert || function (e, t, s) {
        return new h.Vector3(e, t, s);
      }, this.count = 0, this.next1 = 0, this.next2 = this.keep, this.geom = new h.BufferGeometry(), this.vertices = new h.BufferAttribute(new Float32Array(6 * this.keep), 3), this.geom.addAttribute("position", this.vertices), this.material = t.isMaterial ? t : new h.LineBasicMaterial(t), this.line = new h.Line(this.geom, this.material), this.rootObject.add(this.object3d), this.rootObject.add(this.line), this.rosTopic = void 0, this.subscribe();
    }

    unsubscribe() {
      this.rosTopic && this.rosTopic.unsubscribe(this.processMessage);
    }

    subscribe() {
      this.unsubscribe(), this.rosTopic = new n.Topic({
        ros: this.ros,
        name: this.topicName,
        queue_length: 1,
        messageType: "sensor_msgs/NavSatFix"
      }), this.rosTopic.subscribe(this.processMessage.bind(this));
    }

    processMessage(e) {
      var t = isNaN(e.altitude) ? this.altitudeNaN : e.altitude,
          s = this.convert(e.longitude, e.latitude, t);
      this.object3d.position.copy(s), this.object3d.updateMatrixWorld(!0), this.vertices.array[3 * this.next1] = s.x, this.vertices.array[3 * this.next1 + 1] = s.y, this.vertices.array[3 * this.next1 + 2] = s.z, this.vertices.array[3 * this.next2] = s.x, this.vertices.array[3 * this.next2 + 1] = s.y, this.vertices.array[3 * this.next2 + 2] = s.z, this.vertices.needsUpdate = !0, this.next1 = (this.next1 + 1) % this.keep, this.next2 = this.next1 + this.keep, this.count = Math.min(this.count + 1, this.keep), this.geom.setDrawRange(this.next2 - this.count, this.count);
    }

  }

  function se(e, t, s, i) {
    var r,
        o = 0,
        a = 0,
        n = 0,
        c = e.length,
        h = t.length,
        l = ((i = i || 1) - 1) * (s = s || h) * 8;

    for (r = 0; r < c && n < h; r++) o = (o << 6) + se.e[e.charAt(r)], (a += 6) >= 8 && (a -= 8, t[n++] = o >>> a & 255, n % s == 0 && (r += Math.ceil((l - a) / 6), (a %= 8) > 0 && (o = se.e[e.charAt(r)])));

    return Math.floor(n / s);
  }

  se.S = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/", se.e = {};

  for (var ie = 0; ie < 64; ie++) se.e[se.S.charAt(ie)] = ie;

  class re extends h.Object3D {
    constructor(e) {
      super(), e = e || {}, this.ros = e.ros, this.topicName = e.topic || "/points", this.throttle_rate = e.throttle_rate || null, this.compression = e.compression || "cbor", this.max_pts = e.max_pts || 1e4, this.points = new $(e), this.rosTopic = void 0, this.buffer = null, this.subscribe();
    }

    unsubscribe() {
      this.rosTopic && this.rosTopic.unsubscribe(this.processMessage);
    }

    subscribe() {
      this.unsubscribe(), this.rosTopic = new n.Topic({
        ros: this.ros,
        name: this.topicName,
        messageType: "sensor_msgs/PointCloud2",
        throttle_rate: this.throttle_rate,
        queue_length: 1,
        compression: this.compression
      }), this.rosTopic.subscribe(this.processMessage.bind(this));
    }

    processMessage(e) {
      if (this.points.setup(e.header.frame_id, e.point_step, e.fields)) {
        var t,
            s = this.points.pointRatio,
            i = this.max_pts * e.point_step;
        e.data.buffer ? (this.buffer = e.data.slice(0, Math.min(e.data.byteLength, i)), t = Math.min(e.height * e.width / s, this.points.positions.array.length / 3)) : ((!this.buffer || this.buffer.byteLength < i) && (this.buffer = new Uint8Array(i)), t = se(e.data, this.buffer, e.point_step, s), s = 1);

        for (var r, o, a = new DataView(this.buffer.buffer), n = !e.is_bigendian, c = this.points.fields.x.offset, h = this.points.fields.y.offset, l = this.points.fields.z.offset, d = 0; d < t; d++) r = d * s * e.point_step, this.points.positions.array[3 * d] = a.getFloat32(r + c, n), this.points.positions.array[3 * d + 1] = a.getFloat32(r + h, n), this.points.positions.array[3 * d + 2] = a.getFloat32(r + l, n), this.points.colors && (o = this.points.colormap(this.points.getColor(a, r, n)), this.points.colors.array[3 * d] = o.r, this.points.colors.array[3 * d + 1] = o.g, this.points.colors.array[3 * d + 2] = o.b);

        this.points.update(t);
      }
    }

  }

  class oe extends h.Object3D {
    constructor(e) {
      super(), e = e || {}, this.frame_id = e.frame_id, this.tfClient = e.tfClient, this.rootObject = e.rootObject || new h.Object3D(), this.axes = new j({
        shaftRadius: e.shaftRadius || .025,
        headRadius: e.headRaidus || .07,
        headLength: e.headLength || .2,
        scale: e.scale || 1,
        lineType: e.lineType || "full",
        lineDashLength: e.lineDashLength || .1
      }), this.sn = new A({
        frameID: this.frame_id,
        tfClient: this.tfClient,
        object: this.axes
      }), this.rootObject.add(this.sn);
    }

  }

  class ae extends h.Object3D {
    constructor(e) {
      var t = (e = e || {}).urdfModel,
          s = e.path || "/",
          i = e.tfClient,
          r = e.tfPrefix || "",
          o = e.loader,
          a = e.defaultColorMaterialFuc || function () {
        return l(0, 0, 0, .8);
      };

      super();
      var c = t.links;

      for (var h in c) for (var d = c[h], u = 0; u < d.visuals.length; u++) {
        var p = d.visuals[u];

        if (p && p.geometry) {
          var m = r + "/" + d.name,
              f = null;

          if (p.material && p.material.color) {
            var v = p.material && p.material.color;
            f = l(v.r, v.g, v.b, v.a);
          } else f = a();

          if (p.geometry.type === n.URDF_MESH) {
            var g = p.geometry.filename,
                b = g.indexOf("package://");
            -1 !== b && (g = g.substr(b + "package://".length));
            var y = g.substr(-3).toLowerCase();

            if (w.loaders[y]) {
              var T = new x({
                path: s,
                resource: g,
                loader: o,
                material: f
              });
              d.visuals[u].geometry.scale && T.scale.copy(p.geometry.scale);
              var M = new A({
                frameID: m,
                pose: p.origin,
                tfClient: i,
                object: T
              });
              M.name = p.name, this.add(M);
            } else console.warn("Could not load geometry mesh: " + g);
          } else {
            var C = this.createShapeMesh(p, f),
                E = new A({
              frameID: m,
              pose: p.origin,
              tfClient: i,
              object: C
            });
            E.name = p.name, this.add(E);
          }
        }
      }
    }

    createShapeMesh(e, t) {
      var s;

      switch (e.geometry.type) {
        case n.URDF_BOX:
          var i = e.geometry.dimension,
              r = new h.BoxGeometry(i.x, i.y, i.z);
          s = new h.Mesh(r, t);
          break;

        case n.URDF_CYLINDER:
          var o = e.geometry.radius,
              a = e.geometry.length,
              c = new h.CylinderGeometry(o, o, a, 16, 1, !1);
          (s = new h.Mesh(c, t)).quaternion.setFromAxisAngle(new h.Vector3(1, 0, 0), .5 * Math.PI);
          break;

        case n.URDF_SPHERE:
          var l = new h.SphereGeometry(e.geometry.radius, 16);
          s = new h.Mesh(l, t);
      }

      return s;
    }

    unsubscribeTf() {
      this.children.forEach(function (e) {
        "function" == typeof e.unsubscribeTf && e.unsubscribeTf();
      });
    }

  }

  class ne {
    constructor(e) {
      e = e || {}, this.mouseHandler = e.mouseHandler, this.hoverObjs = {}, this.mouseHandler.addEventListener("mouseover", this.onMouseOver.bind(this)), this.mouseHandler.addEventListener("mouseout", this.onMouseOut.bind(this));
    }

    onMouseOver(e) {
      this.hoverObjs[e.currentTarget.uuid] = e.currentTarget;
    }

    onMouseOut(e) {
      var t = e.currentTarget.uuid;
      t in this.hoverObjs && delete this.hoverObjs[t];
    }

    renderHighlights(e, t, s) {
      this.makeEverythingInvisible(e), this.makeHighlightedVisible(e);
      var i = e.overrideMaterial;
      e.overrideMaterial = new h.MeshBasicMaterial({
        fog: !1,
        opacity: .5,
        transparent: !0,
        depthTest: !0,
        depthWrite: !1,
        polygonOffset: !0,
        polygonOffsetUnits: -1,
        side: h.DoubleSide
      }), t.render(e, s), e.overrideMaterial = i, this.restoreVisibility(e);
    }

    makeEverythingInvisible(e) {
      e.traverse(function (e) {
        (e instanceof h.Mesh || e instanceof h.Line || e instanceof h.Sprite) && (e.previousVisibility = e.visible, e.visible = !1);
      });
    }

    makeHighlightedVisible(e) {
      var t = function (e) {
        (e instanceof h.Mesh || e instanceof h.Line || e instanceof h.Sprite) && (e.visible = !0);
      };

      for (var s in this.hoverObjs) {
        var i = this.hoverObjs[s];
        i.visible = !0, i.traverse(t);
      }
    }

    restoreVisibility(e) {
      e.traverse(function (e) {
        e.hasOwnProperty("previousVisibility") && (e.visible = e.previousVisibility);
      }.bind(this));
    }

  }

  class ce extends h.EventDispatcher {
    constructor(e) {
      super(), this.renderer = e.renderer, this.camera = e.camera, this.rootObject = e.rootObject, this.fallbackTarget = e.fallbackTarget, this.lastTarget = this.fallbackTarget, this.dragging = !1;
      this.listeners = {}, ["contextmenu", "click", "dblclick", "mouseout", "mousedown", "mouseup", "mousemove", "mousewheel", "DOMMouseScroll", "touchstart", "touchend", "touchcancel", "touchleave", "touchmove"].forEach(function (e) {
        this.listeners[e] = this.processDomEvent.bind(this), this.renderer.domElement.addEventListener(e, this.listeners[e], !1);
      }, this);
    }

    processDomEvent(e) {
      e.preventDefault();
      var t,
          s,
          i = e.target,
          r = i.getBoundingClientRect();

      if (-1 !== e.type.indexOf("touch")) {
        t = 0, s = 0;

        for (var o = 0; o < e.touches.length; ++o) t += e.touches[o].clientX, s += e.touches[o].clientY;

        t /= e.touches.length, s /= e.touches.length;
      } else t = e.clientX, s = e.clientY;

      var a = t - r.left - i.clientLeft + i.scrollLeft,
          n = s - r.top - i.clientTop + i.scrollTop,
          c = a / i.clientWidth * 2 - 1,
          l = -n / i.clientHeight * 2 + 1,
          d = new h.Vector2(c, l),
          u = new h.Raycaster();
      u.linePrecision = .001, u.setFromCamera(d, this.camera);
      var p = {
        mousePos: d,
        mouseRay: u.ray,
        domEvent: e,
        camera: this.camera,
        intersection: this.lastIntersection
      };
      if ("mouseout" === e.type) return this.dragging && (this.notify(this.lastTarget, "mouseup", p), this.dragging = !1), this.notify(this.lastTarget, "mouseout", p), void (this.lastTarget = null);
      if ("touchleave" === e.type || "touchend" === e.type) return this.dragging && (this.notify(this.lastTarget, "mouseup", p), this.dragging = !1), this.notify(this.lastTarget, "touchend", p), void (this.lastTarget = null);
      if (this.dragging) return this.notify(this.lastTarget, e.type, p), void (("mouseup" === e.type && 2 === e.button || "click" === e.type || "touchend" === e.type) && (this.dragging = !1));
      i = this.lastTarget;
      var m;

      if ((m = u.intersectObject(this.rootObject, !0)).length > 0 ? (i = m[0].object, p.intersection = this.lastIntersection = m[0]) : i = this.fallbackTarget, i !== this.lastTarget && e.type.match(/mouse/)) {
        var f = this.notify(i, "mouseover", p);
        0 === f ? this.notify(this.lastTarget, "mouseout", p) : 1 === f && (i = this.fallbackTarget) !== this.lastTarget && (this.notify(i, "mouseover", p), this.notify(this.lastTarget, "mouseout", p));
      }

      i !== this.lastTarget && e.type.match(/touch/) && (this.notify(i, e.type, p) ? (this.notify(this.lastTarget, "touchleave", p), this.notify(this.lastTarget, "touchend", p)) : (i = this.fallbackTarget) !== this.lastTarget && (this.notify(this.lastTarget, "touchmove", p), this.notify(this.lastTarget, "touchend", p)));
      this.notify(i, e.type, p), "mousedown" !== e.type && "touchstart" !== e.type && "touchmove" !== e.type || (this.dragging = !0), this.lastTarget = i;
    }

    notify(e, t, s) {
      for (s.type = t, s.cancelBubble = !1, s.continueBubble = !1, s.stopPropagation = function () {
        s.cancelBubble = !0;
      }, s.continuePropagation = function () {
        s.continueBubble = !0;
      }, s.currentTarget = e; s.currentTarget;) {
        if (s.currentTarget.dispatchEvent && s.currentTarget.dispatchEvent instanceof Function) {
          if (s.currentTarget.dispatchEvent(s), s.cancelBubble) return this.dispatchEvent(s), 0;
          if (s.continueBubble) return 2;
        }

        s.currentTarget = s.currentTarget.parent;
      }

      return 1;
    }

  }

  class he extends h.EventDispatcher {
    constructor(e) {
      super();
      var t = this,
          s = (e = e || {}).scene;
      this.camera = e.camera, this.center = new h.Vector3(), this.userZoom = !0, this.userZoomSpeed = e.userZoomSpeed || 1, this.userRotate = !0, this.userRotateSpeed = e.userRotateSpeed || 1, this.autoRotate = e.autoRotate, this.autoRotateSpeed = e.autoRotateSpeed || 2, this.displayPanAndZoomFrame = void 0 === e.displayPanAndZoomFrame || !!e.displayPanAndZoomFrame, this.lineTypePanAndZoomFrame = e.dashedPanAndZoomFrame || "full", this.camera.up = new h.Vector3(0, 0, 1);
      var i = 1800,
          r = new h.Vector2(),
          o = new h.Vector2(),
          a = new h.Vector2(),
          n = new h.Vector2(),
          c = new h.Vector2(),
          l = new h.Vector2(),
          d = new h.Vector3(),
          u = new h.Vector3(),
          p = new h.Vector3(),
          m = new h.Vector3(),
          f = new Array(2),
          v = new Array(2);
      this.phiDelta = 0, this.thetaDelta = 0, this.scale = 1, this.lastPosition = new h.Vector3();
      var g = -1,
          b = 0,
          y = 1,
          w = 2,
          x = g;

      function T(e, t, s) {
        var i = new h.Vector3();
        new h.Vector3();
        i.subVectors(t, e.origin);
        var r = e.direction.dot(s);
        if (Math.abs(r) < e.precision) return null;
        var o = s.dot(i) / r;
        return e.direction.clone().multiplyScalar(o);
      }

      function M(e) {
        if (t.userZoom) {
          var s = e.domEvent;
          (void 0 !== s.wheelDelta ? s.wheelDelta : -s.detail) > 0 ? t.zoomIn() : t.zoomOut(), this.showAxes();
        }
      }

      this.axes = new j({
        shaftRadius: .025,
        headRadius: .07,
        headLength: .2,
        lineType: this.lineTypePanAndZoomFrame
      }), this.displayPanAndZoomFrame && (s.add(this.axes), this.axes.traverse(function (e) {
        e.visible = !1;
      })), this.addEventListener("mousedown", function (e) {
        var s = e.domEvent;

        switch (s.preventDefault(), s.button) {
          case 0:
            x = b, r.set(s.clientX, s.clientY);
            break;

          case 1:
            x = w, u = new h.Vector3(0, 0, 1);
            var i = new h.Matrix4().extractRotation(this.camera.matrix);
            u.applyMatrix4(i), d = t.center.clone(), p = t.camera.position.clone(), m = T(e.mouseRay, d, u);
            break;

          case 2:
            x = y, n.set(s.clientX, s.clientY);
        }

        this.showAxes();
      }), this.addEventListener("mouseup", function (e) {
        t.userRotate && (x = g);
      }), this.addEventListener("mousemove", function (e) {
        var s = e.domEvent;
        if (x === b) o.set(s.clientX, s.clientY), a.subVectors(o, r), t.rotateLeft(2 * Math.PI * a.x / i * t.userRotateSpeed), t.rotateUp(2 * Math.PI * a.y / i * t.userRotateSpeed), r.copy(o), this.showAxes();else if (x === y) c.set(s.clientX, s.clientY), l.subVectors(c, n), l.y > 0 ? t.zoomIn() : t.zoomOut(), n.copy(c), this.showAxes();else if (x === w) {
          var f = T(e.mouseRay, t.center, u);
          if (!f) return;
          var v = new h.Vector3().subVectors(m.clone(), f.clone());
          t.center.addVectors(d.clone(), v.clone()), t.camera.position.addVectors(p.clone(), v.clone()), t.update(), t.camera.updateMatrixWorld(), this.showAxes();
        }
      }), this.addEventListener("touchstart", function (e) {
        var s = e.domEvent;

        switch (s.touches.length) {
          case 1:
            x = b, r.set(s.touches[0].pageX - window.scrollX, s.touches[0].pageY - window.scrollY);
            break;

          case 2:
            x = g, u = new h.Vector3(0, 0, 1);
            var i = new h.Matrix4().extractRotation(this.camera.matrix);
            u.applyMatrix4(i), d = t.center.clone(), p = t.camera.position.clone(), m = T(e.mouseRay, d, u), f[0] = new h.Vector2(s.touches[0].pageX, s.touches[0].pageY), f[1] = new h.Vector2(s.touches[1].pageX, s.touches[1].pageY), v[0] = new h.Vector2(0, 0), v[1] = new h.Vector2(0, 0);
        }

        this.showAxes(), s.preventDefault();
      }), this.addEventListener("touchmove", function (e) {
        var s = e.domEvent;
        if (x === b) o.set(s.touches[0].pageX - window.scrollX, s.touches[0].pageY - window.scrollY), a.subVectors(o, r), t.rotateLeft(2 * Math.PI * a.x / i * t.userRotateSpeed), t.rotateUp(2 * Math.PI * a.y / i * t.userRotateSpeed), r.copy(o), this.showAxes();else {
          if (v[0].set(f[0].x - s.touches[0].pageX, f[0].y - s.touches[0].pageY), v[1].set(f[1].x - s.touches[1].pageX, f[1].y - s.touches[1].pageY), v[0].lengthSq() > 10 && v[1].lengthSq() > 10 && (f[0].set(s.touches[0].pageX, s.touches[0].pageY), f[1].set(s.touches[1].pageX, s.touches[1].pageY), v[0].dot(v[1]) > 0 && x !== y ? x = w : v[0].dot(v[1]) < 0 && x !== w && (x = y), x === y)) {
            var n = new h.Vector2();
            n.subVectors(f[0], f[1]), v[0].dot(n) < 0 && v[1].dot(n) > 0 ? t.zoomOut() : v[0].dot(n) > 0 && v[1].dot(n) < 0 && t.zoomIn();
          }

          if (x === w) {
            var c = T(e.mouseRay, t.center, u);
            if (!c) return;
            var l = new h.Vector3().subVectors(m.clone(), c.clone());
            t.center.addVectors(d.clone(), l.clone()), t.camera.position.addVectors(p.clone(), l.clone()), t.update(), t.camera.updateMatrixWorld();
          }

          this.showAxes(), s.preventDefault();
        }
      }), this.addEventListener("touchend", function (e) {
        var t = e.domEvent;
        1 === t.touches.length && x !== b ? (x = b, r.set(t.touches[0].pageX - window.scrollX, t.touches[0].pageY - window.scrollY)) : x = g;
      }), this.addEventListener("mousewheel", M), this.addEventListener("DOMMouseScroll", M);
    }

    showAxes() {
      var e = this;
      this.axes.traverse(function (e) {
        e.visible = !0;
      }), this.hideTimeout && clearTimeout(this.hideTimeout), this.hideTimeout = setTimeout(function () {
        e.axes.traverse(function (e) {
          e.visible = !1;
        }), e.hideTimeout = !1;
      }, 1e3);
    }

    rotateLeft(e) {
      void 0 === e && (e = 2 * Math.PI / 60 / 60 * this.autoRotateSpeed), this.thetaDelta -= e;
    }

    rotateRight(e) {
      void 0 === e && (e = 2 * Math.PI / 60 / 60 * this.autoRotateSpeed), this.thetaDelta += e;
    }

    rotateUp(e) {
      void 0 === e && (e = 2 * Math.PI / 60 / 60 * this.autoRotateSpeed), this.phiDelta -= e;
    }

    rotateDown(e) {
      void 0 === e && (e = 2 * Math.PI / 60 / 60 * this.autoRotateSpeed), this.phiDelta += e;
    }

    zoomIn(e) {
      void 0 === e && (e = Math.pow(.95, this.userZoomSpeed)), this.scale /= e;
    }

    zoomOut(e) {
      void 0 === e && (e = Math.pow(.95, this.userZoomSpeed)), this.scale *= e;
    }

    update() {
      var e = this.camera.position,
          t = e.clone().sub(this.center),
          s = Math.atan2(t.y, t.x),
          i = Math.atan2(Math.sqrt(t.y * t.y + t.x * t.x), t.z);
      this.autoRotate && this.rotateLeft(2 * Math.PI / 60 / 60 * this.autoRotateSpeed), s += this.thetaDelta, i += this.phiDelta;
      var r = 1e-6;
      i = Math.max(r, Math.min(Math.PI - r, i));
      var o = t.length();
      t.set(o * Math.sin(i) * Math.cos(s), o * Math.sin(i) * Math.sin(s), o * Math.cos(i)), t.multiplyScalar(this.scale), e.copy(this.center).add(t), this.camera.lookAt(this.center), o = t.length(), this.axes.position.copy(this.center), this.axes.scale.set(.05 * o, .05 * o, .05 * o), this.axes.updateMatrixWorld(!0), this.thetaDelta = 0, this.phiDelta = 0, this.scale = 1, this.lastPosition.distanceTo(this.camera.position) > 0 && (this.dispatchEvent({
        type: "change"
      }), this.lastPosition.copy(this.camera.position));
    }

  }

  return e.Arrow = f, e.Arrow2 = L, e.Axes = j, e.ColorOcTree = H, e.DepthCloud = m, e.Grid = R, e.Highlighter = ne, e.INTERACTIVE_MARKER_BUTTON = 2, e.INTERACTIVE_MARKER_BUTTON_CLICK = 3, e.INTERACTIVE_MARKER_FIXED = 1, e.INTERACTIVE_MARKER_INHERIT = 0, e.INTERACTIVE_MARKER_KEEP_ALIVE = 0, e.INTERACTIVE_MARKER_MENU = 1, e.INTERACTIVE_MARKER_MENU_SELECT = 2, e.INTERACTIVE_MARKER_MOUSE_DOWN = 4, e.INTERACTIVE_MARKER_MOUSE_UP = 5, e.INTERACTIVE_MARKER_MOVE_3D = 7, e.INTERACTIVE_MARKER_MOVE_AXIS = 3, e.INTERACTIVE_MARKER_MOVE_PLANE = 4, e.INTERACTIVE_MARKER_MOVE_ROTATE = 6, e.INTERACTIVE_MARKER_MOVE_ROTATE_3D = 9, e.INTERACTIVE_MARKER_NONE = 0, e.INTERACTIVE_MARKER_POSE_UPDATE = 1, e.INTERACTIVE_MARKER_ROTATE_3D = 8, e.INTERACTIVE_MARKER_ROTATE_AXIS = 5, e.INTERACTIVE_MARKER_VIEW_FACING = 2, e.InteractiveMarker = _, e.InteractiveMarkerClient = class {
    constructor(e) {
      e = e || {}, this.ros = e.ros, this.tfClient = e.tfClient, this.topicName = e.topic, this.path = e.path || "/", this.camera = e.camera, this.rootObject = e.rootObject || new h.Object3D(), this.loader = e.loader, this.menuFontSize = e.menuFontSize || "0.8em", this.interactiveMarkers = {}, this.updateTopic = null, this.feedbackTopic = null, this.topicName && this.subscribe(this.topicName);
    }

    subscribe(e) {
      this.unsubscribe(), this.updateTopic = new n.Topic({
        ros: this.ros,
        name: e + "/tunneled/update",
        messageType: "visualization_msgs/InteractiveMarkerUpdate",
        compression: "png"
      }), this.updateTopic.subscribe(this.processUpdate.bind(this)), this.feedbackTopic = new n.Topic({
        ros: this.ros,
        name: e + "/feedback",
        messageType: "visualization_msgs/InteractiveMarkerFeedback",
        compression: "png"
      }), this.feedbackTopic.advertise(), this.initService = new n.Service({
        ros: this.ros,
        name: e + "/tunneled/get_init",
        serviceType: "demo_interactive_markers/GetInit"
      });
      var t = new n.ServiceRequest({});
      this.initService.callService(t, this.processInit.bind(this));
    }

    unsubscribe() {
      for (var e in this.updateTopic && this.updateTopic.unsubscribe(this.processUpdate), this.feedbackTopic && this.feedbackTopic.unadvertise(), this.interactiveMarkers) this.eraseIntMarker(e);

      this.interactiveMarkers = {};
    }

    processInit(e) {
      var t = e.msg;

      for (var s in t.erases = [], this.interactiveMarkers) t.erases.push(s);

      t.poses = [], this.processUpdate(t);
    }

    processUpdate(e) {
      var t = this;
      e.erases.forEach(function (e) {
        t.eraseIntMarker(e);
      }), e.poses.forEach(function (e) {
        var s = t.interactiveMarkers[e.name];
        s && s.setPoseFromServer(e.pose);
      }), e.markers.forEach(function (e) {
        var s = t.interactiveMarkers[e.name];
        s && t.eraseIntMarker(s.name);
        var i = new k({
          message: e,
          feedbackTopic: t.feedbackTopic,
          tfClient: t.tfClient,
          menuFontSize: t.menuFontSize
        });
        t.interactiveMarkers[e.name] = i;
        var r = new _({
          handle: i,
          camera: t.camera,
          path: t.path,
          loader: t.loader
        });
        r.name = e.name, t.rootObject.add(r), i.on("pose", function (e) {
          r.onServerSetPose({
            pose: e
          });
        }), r.addEventListener("user-pose-change", i.setPoseFromClientBound), r.addEventListener("user-mousedown", i.onMouseDownBound), r.addEventListener("user-mouseup", i.onMouseUpBound), r.addEventListener("user-button-click", i.onButtonClickBound), r.addEventListener("menu-select", i.onMenuSelectBound), i.subscribeTf();
      });
    }

    eraseIntMarker(e) {
      if (this.interactiveMarkers[e]) {
        var t = this.rootObject.getObjectByName(e);
        this.rootObject.remove(t);
        var s = this.interactiveMarkers[e];
        s.unsubscribeTf(), t.removeEventListener("user-pose-change", s.setPoseFromClientBound), t.removeEventListener("user-mousedown", s.onMouseDownBound), t.removeEventListener("user-mouseup", s.onMouseUpBound), t.removeEventListener("user-button-click", s.onButtonClickBound), t.removeEventListener("menu-select", s.onMenuSelectBound), delete this.interactiveMarkers[e], t.dispose();
      }
    }

  }, e.InteractiveMarkerControl = C, e.InteractiveMarkerHandle = k, e.InteractiveMarkerMenu = E, e.LaserScan = ee, e.MARKER_ARROW = 0, e.MARKER_CUBE = 1, e.MARKER_CUBE_LIST = 6, e.MARKER_CYLINDER = 3, e.MARKER_LINE_LIST = 5, e.MARKER_LINE_STRIP = 4, e.MARKER_MESH_RESOURCE = 10, e.MARKER_POINTS = 8, e.MARKER_SPHERE = 2, e.MARKER_SPHERE_LIST = 7, e.MARKER_TEXT_VIEW_FACING = 9, e.MARKER_TRIANGLE_LIST = 11, e.Marker = M, e.MarkerArrayClient = N, e.MarkerClient = O, e.MeshLoader = w, e.MeshResource = x, e.MouseHandler = ce, e.NavSatFix = te, e.OcTree = G, e.OcTreeClient = q, e.OccupancyGrid = D, e.OccupancyGridClient = S, e.Odometry = W, e.OrbitControls = he, e.Path = K, e.Point = Y, e.PointCloud2 = re, e.Points = $, e.Polygon = Q, e.Pose = X, e.PoseArray = Z, e.PoseWithCovariance = J, e.SceneNode = A, e.TFAxes = oe, e.TriangleList = T, e.Urdf = ae, e.UrdfClient = class {
    constructor(e) {
      var t = this,
          s = (e = e || {}).ros;
      this.param = e.param || "robot_description", this.path = e.path || "/", this.tfClient = e.tfClient, this.rootObject = e.rootObject || new h.Object3D(), this.tfPrefix = e.tfPrefix || "", this.loader = e.loader, new n.Param({
        ros: s,
        name: this.param
      }).get(function (e) {
        var s = new n.UrdfModel({
          string: e
        });
        t.urdf = new ae({
          urdfModel: s,
          path: t.path,
          tfClient: t.tfClient,
          tfPrefix: t.tfPrefix,
          loader: t.loader
        }), t.rootObject.add(t.urdf);
      });
    }

  }, e.Viewer = class {
    constructor(e) {
      var t = (e = e || {}).divID,
          s = e.elem,
          i = e.width,
          r = e.height,
          o = e.background || "#111111",
          a = e.antialias,
          n = e.intensity || .66,
          c = e.near || .01,
          l = e.far || 1e3,
          d = e.alpha || 1,
          u = e.cameraPose || {
        x: 3,
        y: 3,
        z: 3
      },
          p = e.cameraZoomSpeed || .5,
          m = void 0 === e.displayPanAndZoomFrame || !!e.displayPanAndZoomFrame,
          f = e.lineTypePanAndZoomFrame || "full";
      this.renderer = new h.WebGLRenderer({
        antialias: a,
        alpha: !0
      }), this.renderer.setClearColor(parseInt(o.replace("#", "0x"), 16), d), this.renderer.sortObjects = !1, this.renderer.setSize(i, r), this.renderer.shadowMap.enabled = !1, this.renderer.autoClear = !1, this.scene = new h.Scene(), this.camera = new h.PerspectiveCamera(40, i / r, c, l), this.camera.position.x = u.x, this.camera.position.y = u.y, this.camera.position.z = u.z, this.cameraControls = new he({
        scene: this.scene,
        camera: this.camera,
        displayPanAndZoomFrame: m,
        lineTypePanAndZoomFrame: f
      }), this.cameraControls.userZoomSpeed = p, this.scene.add(new h.AmbientLight(5592405)), this.directionalLight = new h.DirectionalLight(16777215, n), this.scene.add(this.directionalLight), this.selectableObjects = new h.Group(), this.scene.add(this.selectableObjects);
      var v = new ce({
        renderer: this.renderer,
        camera: this.camera,
        rootObject: this.selectableObjects,
        fallbackTarget: this.cameraControls
      });
      this.highlighter = new ne({
        mouseHandler: v
      }), this.stopped = !0, this.animationRequestId = void 0, (s || document.getElementById(t)).appendChild(this.renderer.domElement), this.start();
    }

    start() {
      this.stopped = !1, this.draw();
    }

    draw() {
      this.stopped || (this.cameraControls.update(), this.directionalLight.position.normalize(), this.renderer.clear(!0, !0, !0), this.renderer.render(this.scene, this.camera), this.highlighter.renderHighlights(this.scene, this.renderer, this.camera), this.animationRequestId = requestAnimationFrame(this.draw.bind(this)));
    }

    stop() {
      this.stopped || cancelAnimationFrame(this.animationRequestId), this.stopped = !0;
    }

    addObject(e, t) {
      t ? this.selectableObjects.add(e) : this.scene.add(e);
    }

    resize(e, t) {
      this.camera.aspect = e / t, this.camera.updateProjectionMatrix(), this.renderer.setSize(e, t);
    }

  }, e.closestAxisPoint = p, e.findClosestPoint = u, e.intersectPlane = d, e.makeColorMaterial = l, Object.defineProperty(e, "__esModule", {
    value: !0
  }), e;
}({}, THREE, ROSLIB, EventEmitter2);