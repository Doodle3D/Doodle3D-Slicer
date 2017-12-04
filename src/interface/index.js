import _ from 'lodash';
import React from 'react';
import * as THREE from 'three';
import PropTypes from 'proptypes';
import { placeOnGround, createScene, fetchProgress, slice, TabTemplate } from './utils.js';
import injectSheet from 'react-jss';
import RaisedButton from 'material-ui/RaisedButton';
import Slider from 'material-ui/Slider';
import LinearProgress from 'material-ui/LinearProgress';
import { grey50, grey300, grey800, red500 } from 'material-ui/styles/colors';
import { Tabs, Tab } from 'material-ui/Tabs';
import Settings from './Settings.js';
import baseSettings from '../settings/default.yml';
import printerSettings from '../settings/printer.yml';
import materialSettings from '../settings/material.yml';
import qualitySettings from '../settings/quality.yml';
import ReactResizeDetector from 'react-resize-detector';

const MAX_FULLSCREEN_WIDTH = 720;

const styles = {
  container: {
    position: 'relative',
    display: 'flex',
    height: '100%',
    backgroundColor: grey50,
    color: grey800,
    overflow: 'hidden',
    fontFamily: 'roboto, sans-serif'
  },
  controlBar: {
    position: 'absolute',
    bottom: '10px',
    left: '10px'
  },
  d3View: {
    flexGrow: 1,
    flexBasis: 0
  },
  canvas: {
    position: 'absolute'
  },
  settingsBar: {
    display: 'flex',
    flexDirection: 'column',
    maxWidth: '380px',
    boxSizing: 'border-box',
    padding: '10px',
    backgroundColor: 'white',
    borderLeft: `1px solid ${grey300}`
  },
  sliceActions: {
    flexShrink: 0,
  },
  sliceButtons: {
    justifyContent: 'flex-end',
    display: 'flex'
  },
  button: {
    margin: '5px 0 5px 5px'
  },
  controlButton: {
    marginRight: '2px'
  },
  buttonContainer: {
    width: '100%',
    padding: '10px'
  },
  error: {
    color: red500
  },
  title: {
    position: 'absolute'
  }
};

class Interface extends React.Component {
  static propTypes = {
    geometry(props, propName) {
      if (!(props[propName].isGeometry || props[propName].isBufferGeometry)) {
        throw new Error('invalid prop, is not geometry');
      }
    },
    classes: PropTypes.objectOf(PropTypes.string),
    defaultSettings: PropTypes.object.isRequired,
    printers: PropTypes.object.isRequired,
    defaultPrinter: PropTypes.string.isRequired,
    quality: PropTypes.object.isRequired,
    defaultQuality: PropTypes.string.isRequired,
    material: PropTypes.object.isRequired,
    defaultMaterial: PropTypes.string.isRequired,
    pixelRatio: PropTypes.number.isRequired
  };

  static defaultProps = {
    defaultSettings: baseSettings,
    printers: printerSettings,
    defaultPrinter: 'ultimaker2',
    quality: qualitySettings,
    defaultQuality: 'medium',
    material: materialSettings,
    defaultMaterial: 'pla',
    pixelRatio: 1
  };

  constructor(props) {
    super(props);
    const { defaultPrinter, defaultQuality, defaultMaterial, printers, quality, material, defaultSettings } = props;
    this.state = {
      controlMode: 'translate',
      showFullScreen: false,
      isSlicing: false,
      error: null,
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
    this.setState({ ...scene });
  }

  componentWillUnmount() {
    if (this.state.editorControls) this.state.editorControls.dispose();
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

  scaleUp = () => this.scaleMesh(0.9);
  scaleDown = () => this.scaleMesh(1.0 / 0.9);
  scaleMesh = (factor) => {
    const { mesh, render } = this.state;
    if (mesh) {
      mesh.scale.multiplyScalar(factor);
      mesh.updateMatrix();
      placeOnGround(mesh);
      render();
    }
  };

  rotateX = () => this.rotate(new THREE.Vector3(0, 0, 1));
  rotateY = () => this.rotate(new THREE.Vector3(1, 0, 0));
  rotateZ = () => this.rotate(new THREE.Vector3(0, 1, 0));
  rotate = (axis, angle = Math.PI / 2.0) => {
    const { mesh, render } = this.state;
    if (mesh) {
      const quaternion = new THREE.Quaternion();
      quaternion.setFromAxisAngle(axis, angle);
      mesh.quaternion.premultiply(quaternion);
      mesh.updateMatrix();
      placeOnGround(mesh);
      render();
    }
  };

  slice = async () => {
    const { mesh, settings, isSlicing, printers, quality, material } = this.state;

    if (isSlicing) return;

    this.setState({ isSlicing: true, progress: { action: '', slicing: 0, uploading: 0 }, error: null });

    try {
      await slice(mesh, settings, printers, quality, material, progress => {
        this.setState({ progress: { ...this.state.progress, ...progress } });
      });
    } catch (error) {
      this.setState({ error: error.message });
    }

    this.setState({ isSlicing: false });
  };

  onChangeSettings = (settings) => {
    this.setState(settings);
  };

  componentWillUpdate(nextProps, nextState) {
    const { box, render, setSize } = this.state;
    let changed = false;
    if (box && nextState.settings.dimensions !== this.state.settings.dimensions) {
      const { dimensions } = nextState.settings;
      box.scale.set(dimensions.y, dimensions.z, dimensions.x);
      box.updateMatrix();
      changed = true;
    }
    if (changed) render();
  }

  componentDidUpdate() {
    const { updateCanvas } = this.state;
    const { canvas } = this.refs;
    if (updateCanvas && canvas) updateCanvas(canvas);
  }

  onResize3dView = (width, height) => {
    window.requestAnimationFrame(() => {
      const { setSize } = this.state;
      const { pixelRatio } = this.props;
      setSize(width, height, pixelRatio);
    });
  };

  onResizeContainer = (width) => {
    this.setState({ showFullScreen: width > MAX_FULLSCREEN_WIDTH });
  };

  render() {
    const { classes, defaultPrinter, defaultQuality, defaultMaterial, onCancel } = this.props;
    const { isSlicing, progress, settings, printers, quality, material, showFullScreen, error } = this.state;

    const percentage = progress ? (progress.uploading + progress.slicing) / 2.0 * 100.0 : 0.0;

    const settingsPanel = (
      <div className={classes.settingsBar} style={{ ...(showFullScreen ? {} : { maxWidth: 'inherit', width: '100%', height: '100%' }) }}>
        <Settings
          disabled={isSlicing}
          printers={printerSettings}
          defaultPrinter={defaultPrinter}
          quality={qualitySettings}
          defaultQuality={defaultQuality}
          material={materialSettings}
          defaultMaterial={defaultMaterial}
          initialSettings={settings}
          onChange={this.onChangeSettings}
        />
        <div className={classes.sliceActions}>
          {error && <p className={classes.error}>{error}</p>}
          {isSlicing && <p>{progress.action}</p>}
          {isSlicing && <LinearProgress mode="determinate" value={percentage} />}
          <div className={classes.sliceButtons}>
            <RaisedButton
              label="Print"
              primary
              className={`${classes.button}`}
              onTouchTap={this.slice}
              disabled={isSlicing}
            />
          </div>
        </div>
      </div>
    );

    const d3Panel = (
      <div className={classes.d3View}>
        <ReactResizeDetector handleWidth handleHeight onResize={this.onResize3dView} />
        <canvas className={classes.canvas} ref="canvas" />
        {!isSlicing && <div className={classes.controlBar}>
          <RaisedButton className={classes.controlButton} onTouchTap={this.resetMesh} label="reset" />
          <RaisedButton className={classes.controlButton} onTouchTap={this.scaleUp} label="scale down" />
          <RaisedButton className={classes.controlButton} onTouchTap={this.scaleDown} label="scale up" />
          <RaisedButton className={classes.controlButton} onTouchTap={this.rotateX} label="rotate x" />
          <RaisedButton className={classes.controlButton} onTouchTap={this.rotateY} label="rotate y" />
          <RaisedButton className={classes.controlButton} onTouchTap={this.rotateZ} label="rotate z" />
        </div>}
      </div>
    );

    if (showFullScreen) {
      return (
        <div className={classes.container}>
          <ReactResizeDetector handleWidth handleHeight onResize={this.onResizeContainer} />
          <h1 className={classes.title}>Print</h1>
          {d3Panel}
          {settingsPanel}
        </div>
      );
    } else {
      return (
        <div className={classes.container}>
          <ReactResizeDetector handleWidth handleHeight onResize={this.onResizeContainer} />
          <Tabs
            style={{ width: '100%', display: 'flex', flexDirection: 'column' }}
            tabItemContainerStyle={{ flexShrink: 0 }}
            contentContainerStyle={{ flexGrow: 1, display: 'flex' }}
            tabTemplateStyle={{ display: 'flex' }}
            tabTemplate={TabTemplate}
          >
            <Tab label="Settings">
              {settingsPanel}
            </Tab>
            <Tab label="Edit Model">
              {d3Panel}
            </Tab>
          </Tabs>
        </div>
      );
    }
  }
}

export default injectSheet(styles)(Interface);
