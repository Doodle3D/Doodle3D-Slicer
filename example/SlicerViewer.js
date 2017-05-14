import React from 'react';
import { PRECISION } from '../src/constants.js';
import {ReactSVGPanZoom} from 'react-svg-pan-zoom';

export default class SlicerViewer extends React.Component {
  state = {
    layer: 0,
    render: {
      renderIntersectionPoints: false,
      renderShape1: false,
      renderShape2: true,
      renderOuterLine: true,
      renderInnerLine: true,
      renderFill: true
    }
  };

  changeSlider = (event) => {
    this.setState({
      layer: parseInt(event.target.value)
    });
  };

  onControl = (event) => {
    const section = event.target.value;
    this.setState({
      render: {
        ...this.state.render,
        [section]: !this.state.render[section]
      }
    });
  };

  render() {
    const { layer, render } = this.state;
    const { layerIntersectionPoints, settings, layerShapes, slices } = this.props;

    const numLayers = settings.dimensionsZ / settings.layerHeight;

    const intersectionPoints = layerIntersectionPoints[layer + 1];
    const shape = layerShapes[layer];
    const slice = slices[layer];

    return (
      <div>
        <svg viewBox={`-20 -20 ${settings.dimensionsX + 40} ${settings.dimensionsX + 40}`}>
          <rect
            width={settings.dimensionsX}
            height={settings.dimensionsY}
            fill="lightGrey"
          />
          {render.renderIntersectionPoints && intersectionPoints.map(({ x, y }, i) => (
            <circle key={i} cx={x} cy={y} r="0.3"/>
          ))}
          {render.renderShape1 && shape && shape.closedShapes.map((closedShape, i) => (
            <polygon
              key={i}
              points={closedShape.map(({ x, y }) => `${x} ${y}`).join(' ')}
              fill="rgba(255, 0, 0, 0.5)"
            />
          ))}
          {slice && slice.parts.map((slicePart, i) => (
            <g key={i}>
              {render.renderShape2 && <ClipperShapeSVG
                shape={slicePart.shape}
                scale={PRECISION}
                color="rgba(0, 0, 0, 0.5)"
                fill
              />}
              {render.renderOuterLine && <ClipperShapeSVG
                shape={slicePart.outerLine}
                scale={1.0}
                color="blue"
                strokeWidth={settings.nozzleDiameter * 0.9}
              />}
              {render.renderInnerLine && slicePart.innerLines.map((innerLine, i) => (
                <ClipperShapeSVG
                  key={i}
                  shape={innerLine}
                  scale={1.0}
                  color="red"
                  strokeWidth={settings.nozzleDiameter * 0.9}
                />
              ))}
              {render.renderFill && <ClipperShapeSVG
                shape={slicePart.fill}
                scale={1.0}
                color="yellow"
                strokeWidth={settings.nozzleDiameter * 0.9}
              />}
            </g>
          ))}
        </svg>
        <div id="controls">
          <input onChange={this.changeSlider} value={layer} type="range" min="0" max={numLayers} />
          <p>Layer: {layer}</p>
          <p><label><input type="checkbox" value="renderIntersectionPoints" onChange={this.onControl} checked={render.renderIntersectionPoints} />Render Intersection Points</label></p>
          <p><label><input type="checkbox" value="renderShape1" onChange={this.onControl} checked={render.renderShape1} />Render Shape 1</label></p>
          <p><label><input type="checkbox" value="renderShape2" onChange={this.onControl} checked={render.renderShape2} />Render Shape 2</label></p>
          <p><label><input type="checkbox" value="renderOuterLine" onChange={this.onControl} checked={render.renderOuterLine} />Render Out Line</label></p>
          <p><label><input type="checkbox" value="renderInnerLine" onChange={this.onControl} checked={render.renderInnerLine} />Render Inner Lines</label></p>
          <p><label><input type="checkbox" value="renderFill" onChange={this.onControl} checked={render.renderFill} />Render Fill</label></p>
        </div>
      </div>
    );
  }
}

class ClipperShapeSVG extends React.Component {
  render() {
    const { shape, color = 'black', strokeWidth, scale, fill } = this.props;

    const data = shape.paths.map(path => {
      const pathData = path.map(({ X, Y }, i) => `${i === 0 ? 'M' : 'L '}${X * scale} ${Y * scale}`);
      if (shape.closed) pathData.push('Z');
      return pathData.join(' ');
    }).join(' ');

    return (
      <path
        d={data}
        strokeWidth={typeof strokeWidth === 'number' ? strokeWidth : 1.0}
        vectorEffect={typeof strokeWidth === 'number' ? 'none' : 'non-scaling-stroke'}
        fill={fill ? color : 'none'}
        stroke={!fill ? color : 'none'}
      />
    );
  }
}
