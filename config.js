System.config({
  baseURL: "/",
  defaultJSExtensions: true,
  transpiler: "babel",
  babelOptions: {
    "optional": [
      "runtime"
    ]
  },
  paths: {
    "github:*": "jspm_packages/github/*",
    "npm:*": "jspm_packages/npm/*"
  },
  bundles: {
    "bundle.js": []
  },

  map: {
    "Doodle3D/clipper-js": "github:Doodle3D/clipper-js@0.0.2",
    "babel": "npm:babel-core@5.8.38",
    "babel-runtime": "npm:babel-runtime@5.8.38",
    "casperlamboo/EventDispatcher": "github:casperlamboo/EventDispatcher@master",
    "clipper-lib": "npm:clipper-lib@1.0.0",
    "core-js": "npm:core-js@0.9.18",
    "json": "github:systemjs/plugin-json@0.1.0",
    "nodeca/js-yaml": "github:nodeca/js-yaml@3.5.5",
    "read-yaml": "npm:read-yaml@1.0.0",
    "systemjs/plugin-json": "github:systemjs/plugin-json@0.1.0",
    "three.js": "github:mrdoob/three.js@r72",
    "github:Doodle3D/clipper-js@0.0.2": {
      "clipper-lib": "npm:clipper-lib@1.0.0"
    },
    "github:jspm/nodelibs-assert@0.1.0": {
      "assert": "npm:assert@1.3.0"
    },
    "github:jspm/nodelibs-path@0.1.0": {
      "path-browserify": "npm:path-browserify@0.0.0"
    },
    "github:jspm/nodelibs-process@0.1.2": {
      "process": "npm:process@0.11.2"
    },
    "github:jspm/nodelibs-util@0.1.0": {
      "util": "npm:util@0.10.3"
    },
    "npm:argparse@1.0.7": {
      "fs": "github:jspm/nodelibs-fs@0.1.2",
      "path": "github:jspm/nodelibs-path@0.1.0",
      "process": "github:jspm/nodelibs-process@0.1.2",
      "sprintf-js": "npm:sprintf-js@1.0.3",
      "util": "github:jspm/nodelibs-util@0.1.0"
    },
    "npm:assert@1.3.0": {
      "util": "npm:util@0.10.3"
    },
    "npm:babel-runtime@5.8.38": {
      "process": "github:jspm/nodelibs-process@0.1.2"
    },
    "npm:clipper-lib@1.0.0": {
      "process": "github:jspm/nodelibs-process@0.1.2"
    },
    "npm:core-js@0.9.18": {
      "fs": "github:jspm/nodelibs-fs@0.1.2",
      "process": "github:jspm/nodelibs-process@0.1.2",
      "systemjs-json": "github:systemjs/plugin-json@0.1.0"
    },
    "npm:inherits@2.0.1": {
      "util": "github:jspm/nodelibs-util@0.1.0"
    },
    "npm:js-yaml@3.5.5": {
      "argparse": "npm:argparse@1.0.7",
      "esprima": "npm:esprima@2.7.2",
      "fs": "github:jspm/nodelibs-fs@0.1.2",
      "process": "github:jspm/nodelibs-process@0.1.2",
      "systemjs-json": "github:systemjs/plugin-json@0.1.0"
    },
    "npm:path-browserify@0.0.0": {
      "process": "github:jspm/nodelibs-process@0.1.2"
    },
    "npm:process@0.11.2": {
      "assert": "github:jspm/nodelibs-assert@0.1.0"
    },
    "npm:read-yaml@1.0.0": {
      "fs": "github:jspm/nodelibs-fs@0.1.2",
      "js-yaml": "npm:js-yaml@3.5.5",
      "xtend": "npm:xtend@4.0.1"
    },
    "npm:util@0.10.3": {
      "inherits": "npm:inherits@2.0.1",
      "process": "github:jspm/nodelibs-process@0.1.2"
    }
  }
});
