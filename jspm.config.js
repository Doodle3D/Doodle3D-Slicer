SystemJS.config({
  paths: {
    "github:": "jspm_packages/github/",
    "npm:": "jspm_packages/npm/",
    "slicer/": "src/"
  },
  browserConfig: {
    "baseURL": "/"
  },
  devConfig: {
    "map": {
      "babel-runtime": "npm:babel-runtime@5.8.38",
      "core-js": "npm:core-js@0.9.18",
      "process": "github:jspm/nodelibs-process@0.2.0-alpha",
      "fs": "github:jspm/nodelibs-fs@0.2.0-alpha",
      "plugin-babel": "npm:systemjs-plugin-babel@0.0.12"
    },
    "packages": {
      "npm:babel-runtime@5.8.38": {
        "map": {}
      },
      "npm:core-js@0.9.18": {
        "map": {
          "systemjs-json": "github:systemjs/plugin-json@0.1.2"
        }
      }
    }
  },
  transpiler: "plugin-babel",
  babelOptions: {
    "optional": [
      "runtime"
    ]
  },
  packages: {
    "slicer": {
      "main": "index.js"
    }
  },
  bundles: {
    "bundle.js": []
  },
  map: {
    "babel": "npm:babel-core@5.8.38"
  }
});

SystemJS.config({
  packageConfigPaths: [
    "npm:@*/*.json",
    "npm:*.json",
    "github:*/*.json"
  ],
  map: {
    "json": "github:systemjs/plugin-json@0.1.2",
    "Doodle3D/clipper-js": "github:Doodle3D/clipper-js@master",
    "casperlamboo/EventDispatcher": "github:casperlamboo/EventDispatcher@master",
    "three.js": "github:mrdoob/three.js@r72"
  },
  packages: {
    "github:Doodle3D/clipper-js@master": {
      "map": {
        "clipper-lib": "npm:clipper-lib@1.0.0"
      }
    },
    "npm:clipper-lib@1.0.0": {
      "map": {}
    }
  }
});
