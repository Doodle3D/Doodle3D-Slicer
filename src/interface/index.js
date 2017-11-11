import React from 'react';
import { placeOnGround, createScene, createGcodeGeometry } from './utils.js';
import baseSettings from '../settings/default.yml';
import printerSettings from '../settings/printer.yml';
import materialSettings from '../settings/material.yml';
import qualitySettings from '../settings/quality.yml';
import PropTypes from 'proptypes';
import injectSheet from 'react-jss';
import { sliceMesh } from '../slicer.js';

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
    controlMode: 'translate'
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
  }

  slice = async () => {
    const { mesh, render, scene, control } = this.state;
    const settings = {
      ...baseSettings,
      ...materialSettings.pla,
      ...printerSettings[this.props.defaultPrinter]
    };
    const { gcode } = await sliceMesh(settings, mesh, true, (process) => {
      console.log('process: ', process);
    });

    control.dispose();
    scene.remove(control, mesh);

    const line = createGcodeGeometry(gcode);
    scene.add(line);

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
    return (
      <div style={{ width, height }} className={classes.container}>
        <canvas className={classes.canvas} ref="canvas" width={width} height={height} />
        <div className={classes.controlBar}>
          <button onClick={this.resetMesh}>Reset</button>
          <button onClick={() => this.setState({ controlMode: 'translate' })}>Translate</button>
          <button onClick={() => this.setState({ controlMode: 'rotate' })}>Rotate</button>
          <button onClick={() => this.setState({ controlMode: 'scale' })}>Scale</button>
        </div>
        <div className={classes.sliceBar}>
          <button onClick={this.slice}>Slice</button>
        </div>
      </div>
    );
  }
}

export default injectSheet(styles)(Interface);
