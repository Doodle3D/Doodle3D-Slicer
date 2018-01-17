import _ from 'lodash';
import React from 'react';
import { Quaternion } from 'three/src/math/Quaternion.js';
import { Vector3 } from 'three/src/math/Vector3.js';
import { Mesh } from 'three/src/objects/Mesh.js';
import { Box3 } from 'three/src/math/Box3.js';
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
import ReactResizeDetector from 'react-resize-detector';
import JSONToSketchData from 'doodle3d-core/shape/JSONToSketchData';
import createSceneData from 'doodle3d-core/d3/createSceneData.js';
import { generateExportMesh } from 'doodle3d-core/utils/exportUtils.js';
import { Matrix4 } from 'three/src/math/Matrix4.js';
import muiThemeable from 'material-ui/styles/muiThemeable';
import Dialog from 'material-ui/Dialog';

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
    borderLeft: `1px solid ${grey300}`
  },
  sliceActions: {
    flexShrink: 0,
  },
  sliceInfo: {
    margin: '10px 0'
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
    userSelect: 'none',
    position: 'absolute',
    left: '10px'
  },
  detail: {
    userSelect: 'none',
    marginBottom: '10px'
  }
};

class Interface extends React.Component {
  static propTypes = {
    fileUrl: PropTypes.string,
    mesh: PropTypes.shape({ isMesh: PropTypes.oneOf([true]) }),
    classes: PropTypes.objectOf(PropTypes.string),
    pixelRatio: PropTypes.number.isRequired,
    onCancel: PropTypes.func,
    name: PropTypes.string.isRequired,
    muiTheme: PropTypes.object.isRequired,
    allowDragDrop: PropTypes.bool.isRequired
  };

  static defaultProps = {
    pixelRatio: 1,
    name: 'Doodle3D',
    allowDragDrop: true
  };

  constructor(props) {
    super(props);

    const scene = createScene(this.props);
    this.state = {
      scene,
      settings: null,
      showFullScreen: false,
      isSlicing: false,
      error: null,
      mesh: null,
      objectDimensions: '0x0x0mm',
      popover: { open: false, element: null },
      openUrlDialog: { open: false, url: '' }
    };
  }

  componentDidMount() {
    const { canvas } = this.refs;
    const { scene } = this.state;
    scene.updateCanvas(canvas);

    const { mesh, fileUrl } = this.props;
    if (mesh) {
      this.updateMesh(mesh, scene);
    } else if (fileUrl) {
      this.loadFile(fileUrl);
    }
  }

  loadFile = (fileUrl) => {
    fetch(fileUrl)
      .then(resonse => resonse.json())
      .then(json => JSONToSketchData(json))
      .then(file => createSceneData(file))
      .then(sketch => generateExportMesh(sketch, { offsetSingleWalls: false, matrix: new Matrix4() }))
      .then(mesh => this.updateMesh(mesh));
  };

  updateMesh(mesh, scene = this.state.scene) {
    scene.mesh.geometry = mesh.geometry;
    centerGeometry(scene.mesh);
    placeOnGround(scene.mesh);
    this.calculateDimensions();
    scene.render();

    this.setState({ mesh });
  }

  componentWillUnmount() {
    const { scene: { editorControls, mesh: { material } }, renderer } = this.state;
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

  rotateX = () => this.rotate(new Vector3(0, 0, 1), Math.PI / 2.0);
  rotateY = () => this.rotate(new Vector3(1, 0, 0), Math.PI / 2.0);
  rotateZ = () => this.rotate(new Vector3(0, 1, 0), Math.PI / 2.0);
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

  slice = async (target) => {
    const { isSlicing, settings, mesh, scene: { material, mesh: { matrix } } } = this.state;
    const { name } = this.props;

    if (isSlicing) return;
    if (!mesh) {
      this.setState({ error: 'there is no file to slice' });
      return;
    }

    this.closePopover();
    this.setState({ isSlicing: true, progress: { action: '', percentage: 0, step: 0 }, error: null });

    const exportMesh = new Mesh(mesh.geometry, mesh.material);
    exportMesh.applyMatrix(matrix);

    try {
      const updateProgres = progress => this.setState({ progress: { ...this.state.progress, ...progress } });
      await slice(target, name, exportMesh, settings, updateProgres);
    } catch (error) {
      if (error.code === 3) {
        this.setState({ openUrlDialog: { open: true, url: error.url } });
      } else {
        this.setState({ error: error.message });
        throw error;
      }
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
    const { x, y, z } = new Box3().setFromObject(mesh).getSize();
    this.setState({ objectDimensions: `${Math.round(x)}x${Math.round(y)}x${Math.round(z)}mm` });
  };

  onDrop = (event) => {
    event.preventDefault();
    if (!this.props.allowDragDrop) return;

    for (const file of event.dataTransfer.files) {
      const extentions = file.name.split('.').pop();

      switch (extentions.toUpperCase()) {
        case 'D3SKETCH':
          this.loadFile(URL.createObjectURL(file));
          break;
        default:
          break;
      }
    }
  }

  render() {
    const { classes, onCancel } = this.props;
    const { isSlicing, progress, showFullScreen, error, objectDimensions, openUrlDialog } = this.state;

    const style = { ...(showFullScreen ? {} : { maxWidth: 'inherit', width: '100%', height: '100%' }) };

    const settingsPanel = (
      <div className={classes.settingsBar} style={style}>
        <Settings
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
              disabled={isSlicing}
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
          <div className={classes.detail}>
            <p>Dimensions: {objectDimensions}</p>
          </div>
          <RaisedButton disabled={isSlicing} className={classes.controlButton} onTouchTap={this.resetMesh} label="reset" />
          <RaisedButton disabled={isSlicing} className={classes.controlButton} onTouchTap={this.scaleUp} label="scale down" />
          <RaisedButton disabled={isSlicing} className={classes.controlButton} onTouchTap={this.scaleDown} label="scale up" />
          <RaisedButton disabled={isSlicing} className={classes.controlButton} onTouchTap={this.rotateX} label="rotate x" />
          <RaisedButton disabled={isSlicing} className={classes.controlButton} onTouchTap={this.rotateY} label="rotate y" />
          <RaisedButton disabled={isSlicing} className={classes.controlButton} onTouchTap={this.rotateZ} label="rotate z" />
        </div>
      </div>
    );

    const closeDialog = () => this.setState({ openUrlDialog: { open: false, url: '' } });

    const dialog = (
      <Dialog
        open={openUrlDialog.open}
        title="Open with Doodle3D Connect"
        contentStyle={{ maxWidth: '400px' }}
        actions={[
          <FlatButton
            label="Cancel"
            onTouchTap={closeDialog}
          />,
          <RaisedButton
            label="Open"
            primary
            onTouchTap={() => {
              window.open(openUrlDialog.url, '_blank');
              closeDialog();
            }}
          />
        ]}
      >
        <p>Click 'Open' to continue to Doodle3D Connect</p>
      </Dialog>
    )

    if (showFullScreen) {
      return (
        <div
          className={classes.container}
          ref={(container) => {
            if (container) {
              container.addEventListener('dragover', event => event.preventDefault());
              container.addEventListener('drop', this.onDrop);
            }
          }}
        >
          <ReactResizeDetector handleWidth handleHeight onResize={this.onResizeContainer} />
          <h1 className={classes.title}>Doodle3D Slicer</h1>
          {d3Panel}
          {settingsPanel}
          {dialog}
        </div>
      );
    } else {
      return (
        <div
          className={classes.container}
          ref={(container) => {
            if (container) {
              container.addEventListener('dragover', event => event.preventDefault());
              container.addEventListener('drop', this.onDrop);
            }
          }}
        >
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
          {dialog}
        </div>
      );
    }
  }
}

export default muiThemeable()(injectSheet(styles)(Interface));
