import React from 'react';

export default class SlicerViewer extends React.Component {
	state = {
		slice: 0
	};

	changeSlider = (event) => {
		this.setState({
			...this.state,
			slice: parseInt(event.target.value)
		});
	};

	render() {
		const { slice } = this.state;
		const { layerIntersectionPoints, settings, layerShapes } = this.props;

		const numLayers = settings.dimensionsZ / settings.layerHeight;

		const intersectionPoints = layerIntersectionPoints[slice + 1];
		const shape = layerShapes[slice];

		return (
			<div>
				<svg viewBox={`-20 -20 ${settings.dimensionsX + 40} ${settings.dimensionsX + 40}`}>
					<rect
						width={settings.dimensionsX}
						height={settings.dimensionsY}
						fill="lightGrey"
					/>
					{intersectionPoints.map(({ x, y }, i) => <circle key={i} cx={x} cy={y} r="0.3"/>)}
					{shape && shape.closedShapes.map((closedShape, i) => (
						<polygon
							key={i}
							points={closedShape.map(({ x, y }) => `${x} ${y}`).join(' ')}
							fill="rgba(255, 0, 0, 0.5)"
						/>
					))}
				</svg>
				<input onChange={this.changeSlider} value={slice} type="range" min="0" max={numLayers} />
			</div>
		);
	}
}
