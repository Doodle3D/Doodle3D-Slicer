import _ from 'lodash';
import React from 'react';
import { Quaternion } from 'three/src/math/Quaternion.js';
import { Vector3 } from 'three/src/math/Vector3.js';
import { Mesh } from 'three/src/objects/Mesh.js';
import PropTypes from 'proptypes';
import { centerGeometry, placeOnGround, createScene, fetchProgress, slice, TabTemplate } from './utils.js';
import injectSheet from 'react-jss';
import RaisedButton from 'material-ui/RaisedButton';
import FlatButton from 'material-ui/FlatButton';
import Slider from 'material-ui/Slider';
import LinearProgress from 'material-ui/LinearProgress';
import { grey50, grey300, grey800, red500 } from 'material-ui/styles/colors';
import Popover from 'material-ui/Popover/Popover';
import Menu from 'material-ui/Menu';
import MenuItem from 'material-ui/MenuItem';
import { Tabs, Tab } from 'material-ui/Tabs';
import Settings from './Settings.js';
import defaultSettings from '../settings/default.yml';
import printerSettings from '../settings/printer.yml';
import materialSettings from '../settings/material.yml';
import qualitySettings from '../settings/quality.yml';
import ReactResizeDetector from 'react-resize-detector';
import JSONToSketchData from 'doodle3d-core/shape/JSONToSketchData';
import createSceneData from 'doodle3d-core/d3/createSceneData.js';
import { generateExportMesh } from 'doodle3d-core/utils/exportUtils.js';
import { Matrix4 } from 'three/src/math/Matrix4.js';

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
    file: PropTypes.oneOfType([
      PropTypes.shape({ isMesh: PropTypes.oneOf([true]) }),
      PropTypes.string
    ]).isRequired,
    classes: PropTypes.objectOf(PropTypes.string),
    defaultSettings: PropTypes.object.isRequired,
    printers: PropTypes.object.isRequired,
    defaultPrinter: PropTypes.string,
    quality: PropTypes.object.isRequired,
    defaultQuality: PropTypes.string.isRequired,
    material: PropTypes.object.isRequired,
    defaultMaterial: PropTypes.string.isRequired,
    pixelRatio: PropTypes.number.isRequired,
    onCancel: PropTypes.func,
    name: PropTypes.string.isRequired
  };

  static defaultProps = {
    defaultSettings: defaultSettings,
    printers: printerSettings,
    quality: qualitySettings,
    defaultQuality: 'medium',
    material: materialSettings,
    defaultMaterial: 'pla',
    pixelRatio: 1,
    name: 'Doodle3D'
  };

  constructor(props) {
    super(props);
    const { defaultPrinter, defaultQuality, defaultMaterial, printers, quality, material, defaultSettings } = props;

    this.state = {
      showFullScreen: false,
      isSlicing: false,
      isLoading: true,
      error: null,
      printers: defaultPrinter,
      quality: defaultQuality,
      material: defaultMaterial,
      popover: {
        element: null,
        open: false
      },
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

    this.setState({ scene });

    const { file } = this.props;

    if (!file) {
      throw new Error('no file provided');
    } if (typeof file === 'string') {
      fetch(file)
        .then(resonse => resonse.json())
        .then(json => JSONToSketchData(json))
        .then(file => createSceneData(file))
        .then(sketch => generateExportMesh(sketch, { offsetSingleWalls: false, matrix: new Matrix4() }))
        .then(mesh => this.updateMesh(mesh, scene));
    } else if (file.isMesh) {
      this.updateMesh(file, scene);
    } else {
      throw new Error('unknown file property');
    }
  }

  updateMesh(mesh, scene) {
    scene.mesh.geometry = mesh.geometry;
    centerGeometry(scene.mesh);
    placeOnGround(scene.mesh);
    scene.render();

    this.setState({ mesh, isLoading: false });
  }

  componentWillUnmount() {
    const { scene: { editorControls, mesh: { material } }, renderer } = this.state;
    editorControls.dispose();
    material.dispose();
    renderer.dispose();
  }

  resetMesh = () => {
    const { scene: { mesh, render }, isSlicing, isLoading } = this.state;
    if (isSlicing || isLoading) return;
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
    const { scene: { mesh, render }, isSlicing, isLoading } = this.state;
    if (isSlicing || isLoading) return;
    if (mesh) {
      mesh.scale.multiplyScalar(factor);
      mesh.updateMatrix();
      placeOnGround(mesh);
      render();
    }
  };

  rotateX = () => this.rotate(new Vector3(0, 0, 1), Math.PI / 2.0);
  rotateY = () => this.rotate(new Vector3(1, 0, 0), Math.PI / 2.0);
  rotateZ = () => this.rotate(new Vector3(0, 1, 0), Math.PI / 2.0);
  rotate = (axis, angle) => {
    const { scene: { mesh, render }, isSlicing, isLoading } = this.state;
    if (isSlicing || isLoading) return;
    if (mesh) {
      mesh.rotateOnWorldAxis(axis, angle);
      placeOnGround(mesh);
      render();
    }
  };

  slice = async (target) => {
    const { isSlicing, isLoading, settings, printers, quality, mesh, scene: { material, mesh: { matrix } } } = this.state;
    const { name } = this.props;

    if (isSlicing || isLoading) return;

    this.closePopover();

    this.setState({ isSlicing: true, progress: { action: '', percentage: 0, step: 0 }, error: null });

    const exportMesh = new Mesh(mesh.geometry, mesh.material);
    exportMesh.applyMatrix(matrix);

    try {
      await slice(target, name, exportMesh, settings, printers, quality, material, progress => {
        this.setState({ progress: { ...this.state.progress, ...progress } });
      });
    } catch (error) {
      this.setState({ error: error.message });
      throw error;
    } finally {
      this.setState({ isSlicing: false });
    }
  };

  openPopover = (event) => {
    event.preventDefault();

    this.setState({
      popover: {
        element: event.currentTarget,
        open: true
      }
    });
  };
  closePopover = () => {
    this.setState({
      popover: {
        element: null,
        open: false
      }
    });
  };

  onChangeSettings = (settings) => {
    this.setState(settings);
  };

  componentWillUpdate(nextProps, nextState) {
    if (!this.state.scene) return;
    const { scene: { box, render, setSize } } = this.state;
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
    const { scene: { updateCanvas } } = this.state;
    const { canvas } = this.refs;
    if (updateCanvas && canvas) updateCanvas(canvas);
  }

  onResize3dView = (width, height) => {
    window.requestAnimationFrame(() => {
      const { scene: { setSize } } = this.state;
      const { pixelRatio } = this.props;
      if (setSize) setSize(width, height, pixelRatio);
    });
  };

  onResizeContainer = (width) => {
    this.setState({ showFullScreen: width > MAX_FULLSCREEN_WIDTH });
  };

  render() {
    const { classes, defaultPrinter, defaultQuality, defaultMaterial, onCancel } = this.props;
    const { isSlicing, isLoading, progress, settings, printers, quality, material, showFullScreen, error } = this.state;

    const disableUI = isSlicing || isLoading;
    const style = { ...(showFullScreen ? {} : { maxWidth: 'inherit', width: '100%', height: '100%' }) };

    const settingsPanel = (
      <div className={classes.settingsBar} style={style}>
        <Settings
          disabled={disableUI}
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
          {isSlicing && <LinearProgress mode="determinate" value={progress.percentage * 100.0} />}
          <div className={classes.sliceButtons}>
            {onCancel && <RaisedButton
              label="Cancel"
              className={`${classes.button}`}
              onTouchTap={onCancel}
            />}
            <RaisedButton
              label="Print"
              ref="button"
              primary
              className={`${classes.button}`}
              onTouchTap={this.openPopover}
              disabled={disableUI}
            />
            <Popover
              open={this.state.popover.open}
              anchorEl={this.state.popover.element}
              anchorOrigin={{horizontal: 'left', vertical: 'bottom'}}
              targetOrigin={{horizontal: 'left', vertical: 'bottom'}}
              onRequestClose={this.closePopover}
            >
            <Menu>
              <MenuItem primaryText="Send over WiFi" onTouchTap={() => this.slice('WIFI')} />
              <MenuItem primaryText="Download GCode" onTouchTap={() => this.slice('DOWNLOAD')} />
            </Menu>
            </Popover>
          </div>
        </div>
      </div>
    );

    const d3Panel = (
      <div className={classes.d3View}>
        <ReactResizeDetector handleWidth handleHeight onResize={this.onResize3dView} />
        <canvas className={classes.canvas} ref="canvas" />
        <div className={classes.controlBar}>
          <RaisedButton disabled={disableUI} className={classes.controlButton} onTouchTap={this.resetMesh} label="reset" />
          <RaisedButton disabled={disableUI} className={classes.controlButton} onTouchTap={this.scaleUp} label="scale down" />
          <RaisedButton disabled={disableUI} className={classes.controlButton} onTouchTap={this.scaleDown} label="scale up" />
          <RaisedButton disabled={disableUI} className={classes.controlButton} onTouchTap={this.rotateX} label="rotate x" />
          <RaisedButton disabled={disableUI} className={classes.controlButton} onTouchTap={this.rotateY} label="rotate y" />
          <RaisedButton disabled={disableUI} className={classes.controlButton} onTouchTap={this.rotateZ} label="rotate z" />
        </div>
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
