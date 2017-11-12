import React from 'react';
import { placeOnGround, createScene, createGcodeGeometry } from './utils.js';
import baseSettings from '../settings/default.yml';
import printerSettings from '../settings/printer.yml';
import materialSettings from '../settings/material.yml';
import qualitySettings from '../settings/quality.yml';
import PropTypes from 'proptypes';
import injectSheet from 'react-jss';
import { sliceGeometry } from '../slicer.js';
import * as THREE from 'three';

const styles = {
  container: {
    position: 'relative'
  },
  canvas: {
    position: 'absolute',
  },
  controlBar: {
    position: 'absolute',
    bottom: 0,
    left: 0
  },
  sliceBar: {
    position: 'absolute',
    top: 0,
    right: 0
  }
};

class Interface extends React.Component {
  static defaultProps = {
    width: 720,
    height: 480,
    printers: printerSettings,
    defaultPrinter: 'ultimaker2'
  };
  static propTypes = {
    geometry: (props, propName) => {
      if (!(props[propName].isGeometry || props[propName].isBufferGeometry)) {
        throw new Error('invalid prop, is not geometry');
      }
    },
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    classes: PropTypes.objectOf(PropTypes.string),
    printers: PropTypes.object.isRequired,
    defaultPrinter: PropTypes.string.isRequired,
  };
  state = {
    controlMode: 'translate',
    sliced: false
  };

  componentDidMount() {
    const { canvas } = this.refs;
    const scene = createScene(canvas, this.props, this.state);
    this.setState(scene);
  }

  resetMesh = () => {
    const { mesh, render } = this.state;
    if (mesh) {
      mesh.position.set(0, 0, 0);
      mesh.scale.set(1, 1, 1);
      mesh.rotation.set(0, 0, 0);
      mesh.updateMatrix();
      placeOnGround(mesh);
      render();
    }
  };

  reset = () => {
    const { control, mesh, render, gcode, scene } = this.state;
    control.visible = true;
    mesh.visible = true;

    scene.remove(gcode.linePreview);
    gcode.linePreview.geometry.dispose();

    this.setState({ sliced: false, gcode: null });
    render();
  };

  slice = async () => {
    const { mesh, render, scene, control } = this.state;
    const settings = {
      ...baseSettings,
      ...materialSettings.pla,
      ...printerSettings[this.props.defaultPrinter]
    };

    const { dimensions } = settings;
    const centerX = dimensions.x / 2;
    const centerY = dimensions.y / 2;

    const geometry = mesh.geometry.clone();
    mesh.updateMatrix();

    const matrix = new THREE.Matrix4().makeTranslation(centerY, 0, centerX).multiply(mesh.matrix);
    const gcode = await sliceGeometry(settings, geometry, matrix, true, true, (process) => {
      console.log('process: ', process);
    });

    // TODO
    // can't disable control
    control.visible = false;
    mesh.visible = false;

    gcode.linePreview.position.x = -centerY;
    gcode.linePreview.position.z = -centerX;
    scene.add(gcode.linePreview);

    this.setState({ sliced: true, gcode });
    render();
  };

  componentWillUnmount() {
    if (this.state.editorControls) this.state.editorControls.dispose();
    if (this.state.control) this.state.control.dispose();
  }

  componentWillUpdate(nextProps, nextState) {
    const { control } = this.state;
    if (control && nextState.controlMode !== this.state.controlMode) control.setMode(nextState.controlMode);
  }

  render() {
    const { width, height, classes } = this.props;
    const { sliced } = this.state;
    return (
      <div style={{ width, height }} className={classes.container}>
        <canvas className={classes.canvas} ref="canvas" width={width} height={height} />
        {!sliced && <div className={classes.controlBar}>
          <button onClick={this.resetMesh}>Reset</button>
          <button onClick={() => this.setState({ controlMode: 'translate' })}>Translate</button>
          <button onClick={() => this.setState({ controlMode: 'rotate' })}>Rotate</button>
          <button onClick={() => this.setState({ controlMode: 'scale' })}>Scale</button>
        </div>}
        {!sliced && <div className={classes.sliceBar}>
          <button onClick={this.slice}>Slice</button>
        </div>}
        {sliced && <div className={classes.sliceBar}>
          <button onClick={this.reset}>Slice Again</button>
          <button>Download</button>
        </div>}
      </div>
    );
  }
}

export default injectSheet(styles)(Interface);
