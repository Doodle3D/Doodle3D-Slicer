import _ from 'lodash';
import React from 'react';
import * as THREE from 'three';
import PropTypes from 'proptypes';
import { placeOnGround, createScene, createGcodeGeometry } from './utils.js';
import injectSheet from 'react-jss';
import { sliceGeometry } from '../slicer.js';
import RaisedButton from 'material-ui/RaisedButton';
import Slider from 'material-ui/Slider';
import { grey100, grey300 } from 'material-ui/styles/colors';
import Settings from './Settings.js';
import baseSettings from '../settings/default.yml';
import printerSettings from '../settings/printer.yml';
import materialSettings from '../settings/material.yml';
import qualitySettings from '../settings/quality.yml';
import ReactResizeDetector from 'react-resize-detector';

const styles = {
  container: {
    position: 'relative',
    display: 'flex',
    height: '100%',
    backgroundColor: grey100,
    overflow: 'hidden'
  },
  controlBar: {
    position: 'absolute',
    bottom: '10px',
    left: '10px'
  },
  d3View: {
    flexGrow: 1
  },
  canvas: {
    position: 'absolute'
  },
  sliceBar: {
    width: '240px',
    padding: '10px',
    overflowY: 'auto',
    backgroundColor: 'white',
    borderLeft: `1px solid ${grey300}`
  },
  overlay: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    color: 'white',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  },
  sliceActions: {
    listStyleType: 'none'
  },
  button: {
    margin: '5px 0'
  },
  controlButton: {
    marginRight: '2px'
  }
};

class Interface extends React.Component {
  constructor(props) {
    super(props);
    const { defaultPrinter, defaultQuality, defaultMaterial, printers, quality, material, defaultSettings } = props;
    this.state = {
      controlMode: 'translate',
      isSlicing: false,
      sliced: false,
      printers: defaultPrinter,
      quality: defaultQuality,
      material: defaultMaterial,
      settings: _.merge(
        {},
        defaultSettings,
        printers[defaultPrinter],
        quality[defaultQuality],
        material[defaultMaterial]
      )
    };
  }

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
    control.enabled = true;
    control.setSize(1);
    control.visible = true;
    mesh.visible = true;

    scene.remove(gcode.linePreview);
    gcode.linePreview.geometry.dispose();

    this.setState({ sliced: false, gcode: null });
    render();
  };

  slice = async () => {
    const { mesh, render, scene, control, settings } = this.state;

    const { dimensions } = settings;
    const centerX = dimensions.x / 2;
    const centerY = dimensions.y / 2;

    const geometry = mesh.geometry.clone();
    mesh.updateMatrix();

    this.setState({ isSlicing: true, progress: { actions: [], percentage: 0 } });

    const matrix = new THREE.Matrix4().makeTranslation(centerY, 0, centerX).multiply(mesh.matrix);
    const gcode = await sliceGeometry(settings, geometry, matrix, false, true, ({ progress }) => {
      this.setState({ progress: {
        actions: [...this.state.progress.actions, progress.action],
        percentage: progress.done / progress.total
      } });
    });

    this.setState({ isSlicing: false });

    // TODO
    // can't disable control ui still interacts with mouse input
    control.enabled = false;
    // hack to disable control
    control.setSize(0);
    control.visible = false;
    mesh.visible = false;

    gcode.linePreview.position.x = -centerY;
    gcode.linePreview.position.z = -centerX;
    scene.add(gcode.linePreview);

    this.setState({ sliced: true, gcode });
    render();
  };

  onChangeSettings = (settings) => {
    this.setState(settings);
  };

  updateDrawRange = (event, value) => {
    const { gcode, render } = this.state;
    gcode.linePreview.geometry.setDrawRange(0, value);
    render();
  };

  componentWillUnmount() {
    if (this.state.editorControls) this.state.editorControls.dispose();
    if (this.state.control) this.state.control.dispose();
  }

  componentWillUpdate(nextProps, nextState) {
    const { control, box, render, setSize } = this.state;
    if (control && nextState.controlMode !== this.state.controlMode) control.setMode(nextState.controlMode);
    if (box && nextState.settings.dimensions !== this.state.settings.dimensions) {
      const { dimensions } = nextState.settings;
      box.scale.set(dimensions.y, dimensions.z, dimensions.x);
      render();
    }
    if (setSize && nextProps.width !== this.props.width || nextProps.height !== this.props.height || nextProps.pixelRatio !== this.props.pixelRatio) {
      setSize(nextProps.width, nextProps.height, nextProps.pixelRatio);
    }
  }

  onResize = (width, height) => {
    window.requestAnimationFrame(() => {
      const { setSize } = this.state;
      const { pixelRatio } = this.props;
      setSize(width, height, pixelRatio);
    });
  };

  render() {
    const { width, height, classes, onCompleteActions, defaultPrinter, defaultQuality, defaultMaterial } = this.props;
    const { sliced, isSlicing, progress, gcode, controlMode, settings, printer, quality, material } = this.state;

    return (
      <div className={classes.container}>
        <div className={classes.d3View}>
          <ReactResizeDetector handleWidth handleHeight onResize={this.onResize} />
          <canvas className={classes.canvas} ref="canvas" width={width} height={height} />
          {!sliced && <div className={classes.controlBar}>
          <RaisedButton className={classes.controlButton} onTouchTap={this.resetMesh} primary label="reset" />
          <RaisedButton className={classes.controlButton} disabled={controlMode === 'translate'} onTouchTap={() => this.setState({ controlMode: 'translate' })} primary label="translate" />
          <RaisedButton className={classes.controlButton} disabled={controlMode === 'rotate'} onTouchTap={() => this.setState({ controlMode: 'rotate' })} primary label="rotate" />
          <RaisedButton className={classes.controlButton} disabled={controlMode === 'scale'} onTouchTap={() => this.setState({ controlMode: 'scale' })} primary label="scale" />
          </div>}
        </div>
        {sliced && <div className={classes.controlBar}>
          <Slider
            axis="y"
            style={{ height: '300px' }}
            step={2}
            min={1}
            max={gcode.linePreview.geometry.getAttribute('position').count}
            defaultValue={gcode.linePreview.geometry.getAttribute('position').count}
            onChange={this.updateDrawRange}
          />
        </div>}
        {!sliced && <div className={classes.sliceBar}>
          <Settings
            printers={printerSettings}
            defaultPrinter={defaultPrinter}
            quality={qualitySettings}
            defaultQuality={defaultQuality}
            material={materialSettings}
            defaultMaterial={defaultMaterial}
            initialSettings={settings}
            onChange={this.onChangeSettings}
          />
          <RaisedButton className={classes.button} fullWidth disabled={isSlicing} onTouchTap={this.slice} primary label="slice" />
        </div>}
        {sliced && <div className={classes.sliceBar}>
          <RaisedButton className={classes.button} fullWidth onTouchTap={this.reset} primary label="slice again" />
          {onCompleteActions.map(({ title, callback }, i) => (
            <RaisedButton className={classes.button} key={i} fullWidth onTouchTap={() => callback({ gcode, settings, printer, quality, material })} primary label={title} />
          ))}
        </div>}
        {isSlicing && <div className={classes.overlay}>
          <p>Slicing: {progress.percentage.toLocaleString(navigator.language, { style: 'percent' })}</p>
          <ul className={classes.sliceActions}>
            {progress.actions.map((action, i) => <li key={i}>{action}</li>)}
          </ul>
        </div>}
      </div>
    );
  }
}
Interface.propTypes = {
  geometry(props, propName) {
    if (!(props[propName].isGeometry || props[propName].isBufferGeometry)) {
      throw new Error('invalid prop, is not geometry');
    }
  },
  classes: PropTypes.objectOf(PropTypes.string),
  onCompleteActions: PropTypes.arrayOf(PropTypes.shape({ title: PropTypes.string, callback: PropTypes.func })).isRequired,
  defaultSettings: PropTypes.object.isRequired,
  printers: PropTypes.object.isRequired,
  defaultPrinter: PropTypes.string.isRequired,
  quality: PropTypes.object.isRequired,
  defaultQuality: PropTypes.string.isRequired,
  material: PropTypes.object.isRequired,
  defaultMaterial: PropTypes.string.isRequired,
  pixelRatio: PropTypes.number.isRequired
};
Interface.defaultProps = {
  defaultSettings: baseSettings,
  printers: printerSettings,
  defaultPrinter: 'ultimaker2',
  quality: qualitySettings,
  defaultQuality: 'medium',
  material: materialSettings,
  defaultMaterial: 'pla',
  pixelRatio: 1
};

export default injectSheet(styles)(Interface);
