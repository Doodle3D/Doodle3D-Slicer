import * as THREE from 'three';
import React from 'react';
import PropTypes from 'proptypes';
import { centerGeometry, placeOnGround, createScene, slice, TabTemplate } from './utils.js';
import injectSheet from 'react-jss';
import RaisedButton from 'material-ui/RaisedButton';
import LinearProgress from 'material-ui/LinearProgress';
import { grey50, grey300, grey800, red500 } from 'material-ui/styles/colors';
import Popover from 'material-ui/Popover/Popover';
import Menu from 'material-ui/Menu';
import MenuItem from 'material-ui/MenuItem';
import { Tabs, Tab } from 'material-ui/Tabs';
import Settings from './Settings.js';
import ReactResizeDetector from 'react-resize-detector';
import muiThemeable from 'material-ui/styles/muiThemeable';
import logo from '../../img/logo.png';

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
    maxWidth: '320px',
    boxSizing: 'border-box',
    padding: '10px 20px',
    backgroundColor: 'white',
    overflowY: 'auto',
    borderLeft: `1px solid ${grey300}`
  },
  sliceActions: {
    flexShrink: 0
  },
  sliceInfo: {
    margin: '10px 0',
    '& p': {
      marginBottom: '5px',
      fontSize: '11px'
    }
  },
  sliceButtons: {
    justifyContent: 'flex-end',
    display: 'flex'
  },
  button: {
    margin: '5px 0 5px 5px'
  },
  controlButton: {
    marginRight: '5px'
  },
  buttonContainer: {
    width: '100%',
    padding: '10px'
  },
  error: {
    color: red500
  },
  title: {
    userSelect: 'none',
    position: 'absolute',
    left: '10px'
  },
  detail: {
    userSelect: 'none',
    marginTop: '10px',
    marginBottom: '10px'
  },
  logo: {
    position: 'absolute',
    left: '20px',
    top: '20px',
    width: '150px',
    height: '51px'
  }
};

class Interface extends React.Component {
  static propTypes = {
    selectedPrinter: PropTypes.string,
    mesh: PropTypes.shape({ isMesh: PropTypes.oneOf([true]) }),
    classes: PropTypes.objectOf(PropTypes.string),
    pixelRatio: PropTypes.number.isRequired,
    onCancel: PropTypes.func,
    onSliceSucces: PropTypes.func.isRequired,
    muiTheme: PropTypes.object.isRequired
  };

  static defaultProps = {
    pixelRatio: 1
  };

  constructor(props) {
    super(props);

    this.canvasElement = React.createRef();

    const scene = createScene(this.props);
    this.state = {
      scene,
      settings: null,
      showFullScreen: window.innerWidth > MAX_FULLSCREEN_WIDTH,
      isSlicing: false,
      error: null,
      mesh: null,
      objectDimensions: '0x0x0mm',
      popover: { open: false, element: null }
    };
  }

  componentDidMount() {
    const { scene } = this.state;
    scene.updateCanvas(this.canvasElement.current);

    const { mesh } = this.props;
    if (mesh) {
      this.updateMesh(mesh, scene);
    }
  }

  updateMesh(mesh, scene = this.state.scene) {
    scene.mesh.geometry = mesh.geometry;
    centerGeometry(scene.mesh);
    placeOnGround(scene.mesh);
    this.calculateDimensions();
    scene.render();

    this.setState({ mesh });
  }

  componentWillUnmount() {
    const { scene: { editorControls, mesh: { material }, renderer } } = this.state;
    editorControls.dispose();
    material.dispose();
    renderer.dispose();
  }

  resetMesh = () => {
    const { scene: { mesh, render }, isSlicing } = this.state;
    if (isSlicing) return;
    if (mesh) {
      mesh.position.set(0, 0, 0);
      mesh.scale.set(1, 1, 1);
      mesh.rotation.set(0, 0, 0);
      mesh.updateMatrix();
      placeOnGround(mesh);
      this.calculateDimensions();
      render();
    }
  };

  scaleUp = () => this.scaleMesh(0.9);
  scaleDown = () => this.scaleMesh(1.0 / 0.9);
  scaleMesh = (factor) => {
    const { scene: { mesh, render }, isSlicing } = this.state;
    if (isSlicing) return;
    if (mesh) {
      mesh.scale.multiplyScalar(factor);
      mesh.updateMatrix();
      placeOnGround(mesh);
      this.calculateDimensions();
      render();
    }
  };

  rotateX = () => this.rotate(new THREE.Vector3(0, 0, 1), Math.PI / 2.0);
  rotateY = () => this.rotate(new THREE.Vector3(1, 0, 0), Math.PI / 2.0);
  rotateZ = () => this.rotate(new THREE.Vector3(0, 1, 0), Math.PI / 2.0);
  rotate = (axis, angle) => {
    const { scene: { mesh, render }, isSlicing } = this.state;
    if (isSlicing) return;
    if (mesh) {
      mesh.rotateOnWorldAxis(axis, angle);
      placeOnGround(mesh);
      this.calculateDimensions();
      render();
    }
  };

  slice = async () => {
    const { isSlicing, settings, mesh, scene: { mesh: { matrix } } } = this.state;
    const { onSliceSucces } = this.props;

    if (isSlicing) return;
    if (!settings) {
      this.setState({ error: 'please select a printer first' });
      return;
    }
    if (!mesh) {
      this.setState({ error: 'there is no file to slice' });
      return;
    }

    this.closePopover();
    this.setState({ isSlicing: true, progress: { action: '', percentage: 0, step: 0 }, error: null });

    const exportMesh = new THREE.Mesh(mesh.geometry, mesh.material);
    exportMesh.applyMatrix(matrix);

    try {
      const updateProgres = progress => this.setState({ progress: { ...this.state.progress, ...progress } });
      const sliceResults = await slice(exportMesh, settings, updateProgres);
      onSliceSucces(sliceResults);
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

  componentDidUpdate() {
    const { scene: { updateCanvas } } = this.state;
    if (updateCanvas && this.canvasElement.current) updateCanvas(this.canvasElement.current);
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

  onChangeSettings = (settings) => {
    const { scene: { box, render } } = this.state;

    let changed = false;
    if (!this.state.settings || this.state.settings.dimensions !== settings.dimensions) {
      box.scale.set(settings.dimensions.y, settings.dimensions.z, settings.dimensions.x);
      box.updateMatrix();
      changed = true;
    }
    if (changed) render();

    this.setState({ settings, error: null });
  };

  calculateDimensions = () => {
    const { scene: { mesh } } = this.state;
    const { x, y, z } = new THREE.Box3().setFromObject(mesh).getSize();
    this.setState({ objectDimensions: `${Math.round(y)}x${Math.round(z)}x${Math.round(x)}mm` });
  };

  render() {
    const { classes, onCancel, selectedPrinter } = this.props;
    const { isSlicing, settings, progress, showFullScreen, error, objectDimensions } = this.state;

    const style = { ...(showFullScreen ? {} : { maxWidth: 'inherit', width: '100%', height: '100%' }) };

    const settingsPanel = (
      <div className={classes.settingsBar} style={style}>
        <Settings
          selectedPrinter={selectedPrinter}
          disabled={isSlicing}
          onChange={this.onChangeSettings}
        />
        <div className={classes.sliceActions}>
          <div className={classes.sliceInfo}>
            {error && <p className={classes.error}>{error}</p>}
            {isSlicing && <p>{progress.action}</p>}
            {isSlicing && <LinearProgress mode="determinate" value={progress.percentage * 100.0} />}
          </div>
          <div className={classes.sliceButtons}>
            {onCancel && <RaisedButton
              label="Close"
              className={`${classes.button}`}
              onClick={onCancel}
            />}
            <RaisedButton
              label="Download GCODE"
              ref="button"
              primary
              className={`${classes.button}`}
              disabled={isSlicing}
              onClick={() => this.slice()}
            />
          </div>
        </div>
      </div>
    );

    const d3Panel = (
      <div className={classes.d3View}>
        <ReactResizeDetector handleWidth handleHeight onResize={this.onResize3dView} />
        <canvas className={classes.canvas} ref={this.canvasElement} />
        <div className={classes.controlBar}>
          <div className={classes.detail}>
            <p>Dimensions: {objectDimensions}</p>
          </div>
          <RaisedButton disabled={isSlicing} className={classes.controlButton} onClick={this.resetMesh} label="reset" />
          <RaisedButton disabled={isSlicing} className={classes.controlButton} onClick={this.scaleUp} label="scale down" />
          <RaisedButton disabled={isSlicing} className={classes.controlButton} onClick={this.scaleDown} label="scale up" />
          <RaisedButton disabled={isSlicing} className={classes.controlButton} onClick={this.rotateX} label="rotate x" />
          <RaisedButton disabled={isSlicing} className={classes.controlButton} onClick={this.rotateY} label="rotate y" />
          <RaisedButton disabled={isSlicing} className={classes.controlButton} onClick={this.rotateZ} label="rotate z" />
        </div>
      </div>
    );

    if (showFullScreen) {
      return (
        <div className={classes.container}>
          <ReactResizeDetector handleWidth handleHeight onResize={this.onResizeContainer} />
          <img src={logo} className={classes.logo} />
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

export default muiThemeable()(injectSheet(styles)(Interface));
